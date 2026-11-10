#!/usr/bin/env python3
"""Burned-in subtitles: the script's own words on the voice's word times, cut into short phrases.

  python subtitles.py --slug SLUG [--scene N | --all] [-o OUT.json] [--words WORDS.json] [--script SCRIPT.md]
                      [--format long-horizontal|short] [--max-chars N] [--max-dur S] [--dry-run]
  python subtitles.py WORDS.json --script SCRIPT.md [--scene N] -o OUT.json [--format ...]

Why not use Whisper's text: it mishears names, acronyms and numbers ("FDE", "1,500", "CO2"). The script is what the
voice was asked to say, so its spelling is shown, and Whisper only supplies WHEN each word is said: the script words
are aligned to words.json (difflib on normalised words; a word Whisper misheard takes the time of the misheard words
it replaces, a word it missed is spread over the gap between its neighbours).

Cues: one script line (one beat) is one cue unless it is longer than --max-chars (default: 64 for 16:9, 40 for 9:16)
or --max-dur (5 s); then it is split at the best point (sentence end > comma / dash > a real pause > before "and",
"but", "so" ...; never after "a", "the", "of" ...; balanced lengths). A cue shows from its first word to its last word
+ 0.25 s, at least 0.8 s, and runs into the next cue when the gap is under 0.4 s, so subtitles do not flicker.

Input script.md (short-script skill): an optional `Idea:` line, `## Scene N - <name>` headings in long videos, one
voiceover line per beat, `Words: N` / `Total: ...` lines. Headings, `Idea:` / `Words:` / `Total:` lines and lines the
voice never says (under 30 % of their words found) are left out and reported.

Defaults with --slug: script shorts/<slug>/script.md, format from meta.json, words
video/public/<slug>/vo/scene-N.words.json (scene mode) or vo/words.json, output video/src/<slug>/subtitles.json or,
for a scene, video/src/<slug>/scenes/<folder>/subtitles.json when exactly one scene folder matches (the kebab-case
scene name, or a folder starting with "N-", "scene-N" or "0N"); otherwise pass -o. --all does every scene.

Writes {"source", "format", "max_chars", "cues": [{"start", "end", "text"}], "check"}. Times are on the words.json
timeline (the scene's own timeline in scene mode), the same one as the T table next to it. Prints the checks: share
of script words found in the voice, lines where voice and script differ, fastest reading speed (warns over 20
characters a second). Exit code 1 when a line differs a lot or nothing could be aligned.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import FORMATS, ROOT, die, read_meta, write_json

HOLD = 0.25        # keep a cue up this long after its last word
MIN_DUR = 0.8      # shortest cue on screen
JOIN_GAP = 0.4     # a shorter gap to the next cue is closed (no flicker)
MAX_CPS = 20.0     # reading speed warning (characters per second)

HEADING = re.compile(r"^\s*#{1,6}\s*scene\s+(\d+)\b\s*[-–—:.)]*\s*(.*?)\s*#*\s*$", re.I)
META_LINE = re.compile(r"^\W*(idea|words?|word count|total(\s+\w+)?|estimated(\s+\w+)?|length|duration|runtime|"
                       r"sources?|format)\s*[:=]", re.I)
CONJ = {"and", "but", "so", "because", "or", "then", "which", "that", "when", "while", "if", "until", "unless",
        "where", "who", "since", "although", "though", "after", "before"}
PREP = {"into", "in", "on", "to", "with", "for", "from", "at", "by", "about", "like", "inside", "under", "over",
        "through", "without", "across", "behind", "between", "instead", "next"}
WEAK = {"a", "an", "the", "of", "to", "in", "on", "at", "for", "with", "by", "from", "into", "onto", "and", "or",
        "but", "my", "your", "its", "their", "our", "his", "her", "this", "these", "those", "is", "are", "was",
        "were", "be", "very", "so", "as", "than", "not", "no", "can", "will", "would", "could", "should", "don't"}


# ---------- script ----------

def clean_line(line: str) -> str:
    s = line.strip()
    s = re.sub(r"^(>\s*|[-*+]\s+|\d+[.)]\s+)", "", s)
    s = re.sub(r"\[[^\]]*\]", "", s)                     # voice tags like [laughs]
    s = re.sub(r"(\*\*|__|\*|`)", "", s)                 # markdown emphasis
    s = s.strip().strip('"“”').strip()
    return re.sub(r"\s+", " ", s)


def parse_script(path: Path) -> tuple[dict[int, dict], list[str]]:
    """{scene number: {"name", "lines"}}; scene 0 = a script without scene headings. Also the skipped lines."""
    raw = path.read_text(encoding="utf-8").splitlines()
    has_scenes = any(HEADING.match(l) for l in raw)
    sections: dict[int, dict] = {} if has_scenes else {0: {"name": "", "lines": []}}
    current = None if has_scenes else 0
    skipped: list[str] = []
    for line in raw:
        h = HEADING.match(line)
        if h:
            current = int(h.group(1))
            sections[current] = {"name": h.group(2).strip(), "lines": []}
            continue
        if line.lstrip().startswith("#"):
            if has_scenes:
                current = None            # another heading (e.g. "## Sources") ends the scene
            continue
        s = clean_line(line)
        if not s or current is None:
            continue
        if META_LINE.match(s) or s.startswith("|") or s.startswith("("):
            skipped.append(s)
            continue
        sections[current]["lines"].append(s)
    return sections, skipped


# ---------- alignment ----------

def parts(token: str) -> list[str]:
    """Normalised pieces of one word: lower case, letters and digits only, split at hyphens and slashes."""
    t = token.lower().replace("’", "'")
    out = []
    for p in re.split(r"[-–—/]+", t):
        p = re.sub(r"[^\w]", "", p).replace("_", "")
        if p:
            out.append(p)
    return out


def align(lines: list[str], words: list[dict], voice: tuple[float, float]):
    """Per line a list of [text, start, end] tokens; per-line share of words found; extra and replaced voice words."""
    toks = []   # (line index, display text)
    sp, sp_tok = [], []   # script parts and the token index each belongs to
    for li, line in enumerate(lines):
        for word in line.split():
            ps = parts(word)
            toks.append([li, word, None, None])
            for p in ps:
                sp.append(p)
                sp_tok.append(len(toks) - 1)
    wp, wp_time = [], []
    for w in words:
        for p in parts(w["w"]):
            wp.append(p)
            wp_time.append((float(w["start"]), float(w["end"])))

    times: list[tuple[float, float] | None] = [None] * len(sp)
    equal = [False] * len(sp)
    extra: list[str] = []
    replaced: list[str] = []
    sm = difflib.SequenceMatcher(None, sp, wp, autojunk=False)
    ops = sm.get_opcodes()
    for tag, i1, i2, j1, j2 in ops:
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = wp_time[j1 + k]
                equal[i1 + k] = True
        elif tag == "replace":
            spread(times, sp, i1, i2, wp_time[j1][0], wp_time[j2 - 1][1])
            replaced.append(f"{' '.join(sp[i1:i2])} / {' '.join(wp[j1:j2])}")
        elif tag == "insert":
            extra.extend(wp[j1:j2])
    # parts Whisper missed: spread over the gap between their neighbours
    i = 0
    while i < len(sp):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(sp) and times[j] is None:
            j += 1
        a = times[i - 1][1] if i > 0 else voice[0]
        b = times[j][0] if j < len(sp) else voice[1]
        spread(times, sp, i, j, a, max(a, b))
        i = j

    for k, (s, e) in enumerate(times):
        t = toks[sp_tok[k]]
        t[2] = s if t[2] is None else min(t[2], s)
        t[3] = e if t[3] is None else max(t[3], e)
    per_line: list[list[list]] = [[] for _ in lines]
    for li, text, s, e in toks:
        if s is None:          # punctuation-only token ("—"): sits with its neighbour
            prev = per_line[li][-1] if per_line[li] else None
            s = e = prev[2] if prev else voice[0]
        per_line[li].append([text, s, e])
    share = []
    for li in range(len(lines)):
        idx = [k for k in range(len(sp)) if toks[sp_tok[k]][0] == li]
        share.append(sum(equal[k] for k in idx) / len(idx) if idx else 1.0)
    return per_line, share, extra, replaced


def spread(times, sp, i1, i2, a, b):
    """Give parts i1..i2 consecutive slices of [a, b], sized by their length."""
    n = sum(len(sp[k]) for k in range(i1, i2)) or 1
    t = a
    for k in range(i1, i2):
        d = (b - a) * len(sp[k]) / n
        times[k] = (t, t + d)
        t += d


# ---------- cues ----------

def ends_sentence(w: str) -> bool:
    return bool(re.search(r"[.?!…][\"'”’)]*$", w))


def ends_clause(w: str) -> bool:
    return bool(re.search(r"([,;:]|[-–—])[\"'”’)]*$", w)) or w in {"-", "–", "—"}


def text_of(tokens) -> str:
    return " ".join(t[0] for t in tokens)


def split_line(tokens, max_chars: int, row_chars: int, max_dur: float):
    text = text_of(tokens)
    dur = tokens[-1][2] - tokens[0][1]
    inner_stop = any(ends_sentence(t[0]) for t in tokens[1:-1]) if len(tokens) > 2 else False
    if len(tokens) < 2 or (len(text) <= max_chars and dur <= max_dur and not (inner_stop and len(text) > row_chars)):
        return [tokens]
    best, best_k = None, None
    total = len(text)
    for k in range(1, len(tokens)):
        left, right = tokens[:k], tokens[k:]
        prev, nxt = tokens[k - 1][0], tokens[k][0]
        score = 10 * abs(len(text_of(left)) - len(text_of(right))) / total
        if ends_sentence(prev):
            score -= 6
        elif ends_clause(prev):
            score -= 3
        gap = tokens[k][1] - tokens[k - 1][2]
        score -= 3 if gap >= 0.25 else 1 if gap >= 0.12 else 0
        bare = re.sub(r"[^\w']", "", nxt.lower())
        if bare in CONJ or bare in PREP:
            score -= 1.5
        if re.sub(r"[^\w']", "", prev.lower()) in WEAK and not ends_clause(prev):
            score += 4
        if (len(left) < 2 or len(right) < 2) and not ends_sentence(prev):
            score += 3
        if best is None or score < best:
            best, best_k = score, k
    return (split_line(tokens[:best_k], max_chars, row_chars, max_dur)
            + split_line(tokens[best_k:], max_chars, row_chars, max_dur))


def make_cues(per_line, max_chars, row_chars, max_dur, end_limit):
    chunks = []
    for tokens in per_line:
        if tokens:
            chunks.extend(split_line(tokens, max_chars, row_chars, max_dur))
    cues = [{"start": c[0][1], "end": c[-1][2] + HOLD, "text": text_of(c)} for c in chunks]
    for i, c in enumerate(cues):
        nxt = cues[i + 1]["start"] if i + 1 < len(cues) else end_limit
        if nxt - c["end"] < JOIN_GAP:
            c["end"] = nxt
        if c["end"] - c["start"] < MIN_DUR:
            c["end"] = max(c["end"], min(c["start"] + MIN_DUR, nxt))
        c["end"] = min(c["end"], nxt)
    for c in cues:
        c["start"], c["end"] = round(c["start"], 3), round(c["end"], 3)
    return [c for c in cues if c["end"] > c["start"]]


# ---------- main ----------

def kebab(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def scene_folder(slug: str, n: int, name: str) -> Path | None:
    base = ROOT / "video" / "src" / slug / "scenes"
    if not base.is_dir():
        return None
    folders = [p for p in base.iterdir() if p.is_dir()]
    want = kebab(name)
    hits = [p for p in folders if want and p.name.lower() == want]
    if not hits:
        pre = (f"{n}-", f"scene-{n}", f"scene{n}", f"0{n}-", f"0{n}_", f"{n}_")
        hits = [p for p in folders if p.name.lower().startswith(pre) or p.name.lower() == f"scene-{n}"]
    return hits[0] if len(hits) == 1 else None


def run_one(words_path: Path, script: Path, scene: int | None, out: Path | None, fmt: str, a, sections, skipped) -> int:
    if scene is None:
        if len(sections) != 1:
            die(f"{script} has scenes {sorted(sections)}: pass --scene N or --all")
        scene = next(iter(sections))
    if scene not in sections:
        die(f"{script} has no '## Scene {scene}' heading (found: {sorted(sections)})")
    lines = sections[scene]["lines"]
    if not lines:
        die(f"scene {scene} of {script} has no voiceover lines")
    if not words_path.exists():
        die(f"word times not found: {words_path} (run words.py on the voice take first)")
    wj = json.loads(words_path.read_text(encoding="utf-8"))
    words = wj.get("words") or []
    if not words:
        die(f"{words_path} has no words (was it made with --no-whisper?)")
    voice = (float(wj.get("voice_start", words[0]["start"])), float(wj.get("voice_end", words[-1]["end"])))
    end_limit = float(wj.get("composition_s") or voice[1] + 0.5)

    per_line, share, extra, replaced = align(lines, words, voice)
    dropped = [lines[i] for i, s in enumerate(share) if s < 0.3 and len(lines[i].split()) >= 2]
    if dropped:  # lines the voice never says (a title, a note): leave them out and align again
        lines = [l for i, l in enumerate(lines) if not (share[i] < 0.3 and len(l.split()) >= 2)]
        if not lines:
            die("no script line matches the voice: is this the right words.json for this scene?", 1)
        per_line, share, extra, replaced = align(lines, words, voice)

    spec = FORMATS.get(fmt) or FORMATS["long-horizontal"]
    vertical = spec["height"] > spec["width"]
    row_chars = 24 if vertical else 40
    max_chars = a.max_chars or (40 if vertical else 64)
    cues = make_cues(per_line, max_chars, row_chars, a.max_dur, end_limit)

    n_parts = sum(len(parts(w)) for l in lines for w in l.split())
    matched = sum(s * sum(len(parts(w)) for w in l.split()) for s, l in zip(share, lines)) / max(n_parts, 1)
    differs = [{"line": l, "found": round(s, 2)} for s, l in zip(share, lines) if s < 0.7]
    cps = [(len(c["text"]) / max(c["end"] - c["start"], 1e-3), c["text"]) for c in cues]
    fastest = max(cps, default=(0.0, ""))
    check = {"script_words_found": round(matched, 3), "lines": len(lines), "cues": len(cues),
             "max_chars_per_s": round(fastest[0], 1), "differs": differs, "left_out": dropped + skipped,
             "voice_words_not_in_script": extra[:40], "script_vs_voice": replaced[:40]}
    rel = lambda p: str(p.resolve().relative_to(ROOT)) if p.resolve().is_relative_to(ROOT) else str(p)
    data = {"source": {"words": rel(words_path), "script": rel(script), "scene": scene or None},
            "format": fmt, "max_chars": max_chars, "cues": cues, "check": check}

    label = f"scene {scene}" if scene else "script"
    print(f"{label}: {len(cues)} cues from {len(lines)} lines, {matched:.0%} of script words found in the voice, "
          f"fastest {fastest[0]:.1f} chars/s")
    for c in cues:
        print(f"  {c['start']:7.2f}-{c['end']:7.2f}  {c['text']}")
    status = 0
    for d in differs:
        print(f"  warn: voice and script differ ({d['found']:.0%} found): {d['line']}")
        if d["found"] < 0.5:
            status = 1
    for l in dropped:
        print(f"  left out (not in the voice): {l}")
    if fastest[0] > MAX_CPS:
        print(f"  warn: {fastest[0]:.1f} chars/s is fast to read: {fastest[1]!r} (lower --max-chars or slow the line)")
    if extra:
        print(f"  note: the voice has words the script does not: {' '.join(extra[:12])}")
    for r in replaced[:12]:
        print(f"  check: script / voice: {r}  (fine for a number or a name Whisper misspells; otherwise the voice "
              f"said something else and the subtitle shows the script)")
    if a.dry_run:
        print("  (dry run, nothing written)")
    elif out is None:
        die("no output path: pass -o video/src/<slug>/scenes/<folder>/subtitles.json")
    else:
        write_json(out, data)
        print(f"  -> {rel(out)}")
    return status


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("words", nargs="?", help="words.json from words.py (default from --slug)")
    ap.add_argument("--slug")
    ap.add_argument("--script", help="script.md (default shorts/<slug>/script.md)")
    ap.add_argument("--scene", type=int, help="scene number (the '## Scene N' heading)")
    ap.add_argument("--all", action="store_true", help="every scene of the script (with --slug)")
    ap.add_argument("-o", "--out")
    ap.add_argument("--format", help="short | long-horizontal (default: meta.json, else long-horizontal)")
    ap.add_argument("--max-chars", type=int, default=0, help="longest cue (default 64 for 16:9, 40 for 9:16)")
    ap.add_argument("--max-dur", type=float, default=5.0, help="longest cue in seconds")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if not a.slug and not (a.words and a.script):
        ap.error("pass --slug SLUG, or WORDS.json with --script")
    meta = read_meta(a.slug) if a.slug else {}
    fmt = a.format or meta.get("format") or "long-horizontal"
    if fmt not in FORMATS:
        die(f"unknown format {fmt!r} (use {', '.join(FORMATS)})")
    script = Path(a.script) if a.script else ROOT / "shorts" / a.slug / "script.md"
    if not script.exists():
        die(f"script not found: {script}")
    sections, skipped = parse_script(script)
    vo = ROOT / "video" / "public" / (a.slug or "") / "vo"

    if a.all:
        if not a.slug:
            die("--all needs --slug")
        status = 0
        for n in sorted(k for k in sections if k):
            folder = scene_folder(a.slug, n, sections[n]["name"])
            out = folder / "subtitles.json" if folder else None
            if out is None and not a.dry_run:
                die(f"scene {n} ({sections[n]['name']!r}): no single matching folder in video/src/{a.slug}/scenes/; "
                    f"run it alone with --scene {n} -o PATH")
            status |= run_one(vo / f"scene-{n}.words.json", script, n, out, fmt, a, sections, skipped)
        sys.exit(status)

    scene = a.scene
    if a.words:
        words_path = Path(a.words)
    elif scene:
        words_path = vo / f"scene-{scene}.words.json"
    else:
        words_path = vo / "words.json"
    if a.out:
        out = Path(a.out)
    elif scene and a.slug:
        folder = scene_folder(a.slug, scene, sections.get(scene, {}).get("name", ""))
        out = folder / "subtitles.json" if folder else None
    elif a.slug:
        out = ROOT / "video" / "src" / a.slug / "subtitles.json"
    else:
        out = None
    sys.exit(run_one(words_path, script, scene, out, fmt, a, sections, skipped))


if __name__ == "__main__":
    main()
