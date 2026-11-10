#!/usr/bin/env python3
"""Check the ElevenLabs audio tags in script.md before the voice is made (and the tag list subtitles.py uses).

  python audio_tags.py --slug SLUG [--script SCRIPT.md] [--format short|long-horizontal]

Audio tags are lower-case words in square brackets that Eleven v4 performs instead of reading: [excited],
[whispering], [pause], [gasping] ... They stay in script.md exactly where they are performed. subtitles.py leaves them
out of the subtitles and reports when each one happened in the take.

Rules (short-script skill, section 3):
  error    a sound-effect tag ([dog barking], [applause], [drum roll] ...): every sound in a video is a real Openverse
           recording placed on its frame by the sound step, never a sound made by the voice model
  warning  a character voice ([witch voice] ...) on a line without a quoted part
  warning  more than one tag on a line; more than 3 tags in a Short; more than about one tag per 2 lines in a scene
           of a long video; the same tag twice in a row
  warning  a tag that is not in the lists below (tags are open-ended, so it may still work: check the spelling)
Prints every tag with its line, the spoken word count (tags left out) and an estimated length (150 words a minute,
plus about half a second per vocalization or pause). Exit code 1 when there is an error.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import FORMATS, ROOT, die, read_meta

TAG_RE = re.compile(r"\[([^\[\]]+)\]")

KINDS = {
    "emotion": {"weak", "angry", "bored", "menacing", "playful", "tired", "excited", "happy", "sad", "curious",
                "sarcastic", "surprised", "nervous", "mischievously", "thoughtful", "annoyed", "impressed",
                "relieved", "confused", "scared"},
    "delivery": {"whispering", "whispers", "singing", "sings", "slowly", "softly", "quietly", "voice breaking",
                 "shouting", "dramatically", "deadpan", "hesitantly", "matter-of-fact", "rushed"},
    "pause": {"pause", "short pause", "long pause"},
    "vocalization": {"clears throat", "coughing", "coughs", "chuckling", "chuckles", "sighing", "sighs", "sniffling",
                     "sniffs", "yawning", "yawns", "laughing", "laughs", "laughs harder", "starts laughing",
                     "giggling", "giggles", "sharp exhale", "exhales", "scoffing", "scoffs", "humming", "hums",
                     "panting", "gasping", "gasps", "gulps", "snorts", "crying", "sobbing", "wheezing", "groaning",
                     "groans"},
    "character": {"sleepy drowsy voice", "witch voice", "drunken voice"},
    "sound-effect": {"keyboard typing", "echoing", "knocking on door", "bell ringing", "phone ringing", "dog barking",
                     "crowd cheering", "applause", "rain falling", "drum roll", "heartbeat", "engine starting",
                     "explosion", "gunshot", "footsteps", "door creaking", "door slam", "thunder", "wind blowing",
                     "clapping", "birds chirping", "car horn", "glass breaking", "splash", "whoosh", "music"},
}
SOUNDING = {"vocalization", "pause"}  # tags that take time of their own in the take


def classify(tag: str) -> str:
    t = re.sub(r"\s+", " ", tag.strip().lower())
    for kind, names in KINDS.items():
        if t in names:
            return kind
    if t.endswith(" voice"):
        return "character"
    return "unknown"


def tags_in(line: str) -> list[str]:
    return [re.sub(r"\s+", " ", t.strip().lower()) for t in TAG_RE.findall(line)]


def spoken(line: str) -> str:
    """The line as it is said and shown in subtitles: tags removed."""
    return re.sub(r"\s+", " ", TAG_RE.sub(" ", line)).strip()


def has_quote(line: str) -> bool:
    return bool(re.search(r"[\"“”]", spoken(line)))


def lint(sections: dict[int, dict], fmt: str):
    """Return (rows, errors, warnings, spoken word count, sounding tag count)."""
    rows, errors, warnings = [], [], []
    words = sounding = total = 0
    last = None
    for n, sec in sorted(sections.items()):
        where = f"scene {n}" if n else "script"
        lines = sec["lines"]
        spoken_lines = [l for l in lines if spoken(l)]
        count = 0
        for i, line in enumerate(lines, 1):
            words += len(spoken(line).split())
            tags = tags_in(line)
            if len(tags) > 1:
                warnings.append(f"{where} line {i}: {len(tags)} tags on one line (one at most): {line}")
            for t in tags:
                kind = classify(t)
                count += 1
                total += 1
                sounding += kind in SOUNDING
                rows.append((where, i, t, kind, line))
                if kind == "sound-effect":
                    errors.append(f"{where} line {i}: sound-effect tag [{t}]: every sound comes from Openverse and is "
                                  f"placed by the sound step; take it out of the script")
                elif kind == "character" and not has_quote(line):
                    warnings.append(f"{where} line {i}: character voice [{t}] belongs on a quoted line only")
                elif kind == "unknown":
                    warnings.append(f"{where} line {i}: [{t}] is not in the known tag list; check the spelling")
                if t == last:
                    warnings.append(f"{where} line {i}: [{t}] twice in a row")
                last = t
        if n and count > max(1, len(spoken_lines) // 2):
            warnings.append(f"{where}: {count} tags in {len(spoken_lines)} lines (about one every 2-3 lines)")
    if fmt == "short" and total > 3:
        warnings.append(f"{total} tags in a Short (1-3)")
    return rows, errors, warnings, words, sounding


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug")
    ap.add_argument("--script", help="script.md (default shorts/<slug>/script.md)")
    ap.add_argument("--format", help="short | long-horizontal (default: meta.json, else from the script)")
    a = ap.parse_args()
    if not a.slug and not a.script:
        ap.error("pass --slug SLUG or --script SCRIPT.md")
    from subtitles import parse_script  # same reading of script.md as the subtitles

    script = Path(a.script) if a.script else ROOT / "shorts" / a.slug / "script.md"
    if not script.exists():
        die(f"script not found: {script}")
    sections, _ = parse_script(script)
    meta = read_meta(a.slug) if a.slug else {}
    fmt = a.format or meta.get("format") or ("long-horizontal" if any(sections) else "short")
    if fmt not in FORMATS:
        die(f"unknown format {fmt!r} (use {', '.join(FORMATS)})")

    rows, errors, warnings, words, sounding = lint(sections, fmt)
    est = words / 150 * 60 + 0.5 * sounding
    lo, hi = FORMATS[fmt]["min_s"], FORMATS[fmt]["max_s"]
    print(f"{script.name} ({fmt}): {words} spoken words, {len(rows)} tags, about {est:.0f} s")
    for where, i, t, kind, line in rows:
        print(f"  {where} line {i:<2} [{t}] {kind}: {spoken(line)[:70]}")
    if not lo - 2 <= est <= hi + 2:
        warnings.append(f"about {est:.0f} s is outside {lo}-{hi} s for {fmt}")
    for e in errors:
        print(f"  error: {e}")
    for w in warnings:
        print(f"  warn: {w}")
    print("  ok" if not errors and not warnings else f"  {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
