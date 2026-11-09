#!/usr/bin/env python3
"""Word times for a voice take: Whisper words, snapped to the real pauses found by loudness.

  python words.py video/public/<slug>/vo/take1.mp3 [-o words.json] [--model small.en] [--ts timing.ts]
                  [--offset 0.1] [--no-whisper]

Whisper word edges are only good to about +-0.2 s. So the script also measures loudness (RMS every 20 ms) and finds
real pauses (below -42 dB relative to the voice peak for at least 0.18 s). A word edge that lies within 0.25 s of a
pause edge is moved onto it.

Writes words.json next to the MP3:
  {"file", "duration", "offset", "voice_start", "voice_end", "composition_s",
   "words": [{"w", "start", "end", "snapped"}], "pauses": [{"start", "end", "dur"}]}
All times are on the VIDEO timeline: the voice starts at --offset (0.1 s), so they can go straight into the T table.
--ts PATH writes a starter timing.ts (only if it does not exist yet). --no-whisper gives pauses only.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 16000
HOP = 0.02


def decode(path: Path) -> np.ndarray:
    try:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                             capture_output=True, check=True).stdout
    except FileNotFoundError:
        sys.exit("ffmpeg not found in PATH")
    except subprocess.CalledProcessError as e:
        sys.exit(f"ffmpeg could not read {path}: {e.stderr.decode(errors='ignore')[:200]}")
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def find_pauses(x: np.ndarray, floor_db: float = -42.0, min_len: float = 0.18):
    hop = int(SR * HOP)
    n = len(x) // hop
    if n == 0:
        return [], np.zeros(0)
    rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms / max(float(rms.max()), 1e-9))
    quiet = db < floor_db
    pauses, start = [], None
    for i, q in enumerate(np.append(quiet, False)):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if (i - start) * HOP >= min_len:
                pauses.append((round(start * HOP, 3), round(i * HOP, 3)))
            start = None
    return pauses, db


def whisper_words(path: Path, model: str):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper missing: pip install -r requirements.txt  (or use --no-whisper)")
    m = WhisperModel(model, device="auto", compute_type="auto")
    try:
        segments, _ = m.transcribe(str(path), word_timestamps=True, language="en", vad_filter=False)
        segments = list(segments)
    except Exception:  # GPU without the right libraries: fall back to CPU
        m = WhisperModel(model, device="cpu", compute_type="int8")
        segments, _ = m.transcribe(str(path), word_timestamps=True, language="en", vad_filter=False)
        segments = list(segments)
    return [{"w": w.word.strip(), "start": float(w.start), "end": float(w.end)} for s in segments for w in (s.words or [])]


def snap(words, pauses, duration, tol=0.25):
    """Move word edges onto pause edges: a word that follows a pause starts where the pause ends, and so on."""
    starts = [p[1] for p in pauses if p[1] < duration - 0.02]   # voice resumes
    ends = [p[0] for p in pauses if p[0] > 0.02]                # voice stops
    for w in words:
        w["snapped"] = False
        for edge, cands in (("start", starts), ("end", ends)):
            if cands:
                c = min(cands, key=lambda t: abs(t - w[edge]))
                if abs(c - w[edge]) <= tol:
                    w[edge], w["snapped"] = c, True
    for a, b in zip(words, words[1:]):          # keep order
        if b["start"] < a["start"]:
            b["start"] = a["start"]
        if a["end"] > b["start"]:
            a["end"] = b["start"]
    for w in words:
        w["end"] = max(w["end"], w["start"])
    return words


TS = """// One timing source for this Short. Every beat, sound cue and camera move reads from T (seconds on the video timeline).
// Word times: video/public/{slug}/vo/words.json (python .../scripts/words.py). Big sounds go into pauses.
export const FPS = 60;
export const VO_OFFSET = {offset};          // the voice starts here
export const VO_END = {vo_end};
export const DURATION = {dur};        // voice end + 0.5 s
export const DURATION_FRAMES = Math.round(DURATION * FPS);

// Pauses in the voice (start, end): {pauses}
export const T = {{
  // name: seconds,   e.g. turn: 2.05, release: 3.7, land: 4.8
}} as const;
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("-o", "--out")
    ap.add_argument("--model", default="small.en", help="faster-whisper model (small.en is enough for a clean voice)")
    ap.add_argument("--offset", type=float, default=0.1, help="where the voice starts on the video timeline")
    ap.add_argument("--floor-db", type=float, default=-42.0)
    ap.add_argument("--min-pause", type=float, default=0.18)
    ap.add_argument("--ts", help="write a starter timing.ts here if it does not exist")
    ap.add_argument("--no-whisper", action="store_true")
    a = ap.parse_args()

    path = Path(a.audio)
    if not path.exists():
        sys.exit(f"not found: {path}")
    x = decode(path)
    duration = len(x) / SR
    pauses, db = find_pauses(x, a.floor_db, a.min_pause)
    loud = np.where(db > a.floor_db)[0]
    v0, v1 = (loud[0] * HOP, (loud[-1] + 1) * HOP) if len(loud) else (0.0, duration)

    words = [] if a.no_whisper else snap(whisper_words(path, a.model), pauses, duration)
    if words:
        words[0]["start"] = max(words[0]["start"], 0.0)
    off = a.offset
    inner = [p for p in pauses if p[0] > v0 and p[1] < v1]     # pauses inside the speech, not lead-in / tail
    out = {
        "file": path.name, "duration": round(duration, 3), "offset": off,
        "voice_start": round(v0 + off, 3), "voice_end": round(v1 + off, 3),
        "composition_s": round(v1 + off + 0.5, 2),
        "words": [{"w": w["w"], "start": round(w["start"] + off, 3), "end": round(w["end"] + off, 3),
                   "snapped": w["snapped"]} for w in words],
        "pauses": [{"start": round(p[0] + off, 3), "end": round(p[1] + off, 3), "dur": round(p[1] - p[0], 3)} for p in inner],
    }
    dst = Path(a.out) if a.out else path.with_name("words.json")
    dst.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"{path.name}: {duration:.2f} s, voice {out['voice_start']:.2f}-{out['voice_end']:.2f} s, "
          f"{len(words)} words, {len(inner)} pauses -> {dst}")
    for p in out["pauses"]:
        print(f"  pause {p['start']:.2f}-{p['end']:.2f}  ({p['dur']:.2f} s)")
    if a.ts:
        ts = Path(a.ts)
        if ts.exists():
            print(f"{ts} exists - not overwritten")
        else:
            ts.parent.mkdir(parents=True, exist_ok=True)
            slug = ts.parent.name
            ts.write_text(TS.format(slug=slug, offset=off, vo_end=out["voice_end"], dur=out["composition_s"],
                                    pauses=", ".join(f"{p['start']}-{p['end']}" for p in out["pauses"]) or "none"),
                          encoding="utf-8")
            print(f"starter timing table: {ts}")


if __name__ == "__main__":
    main()
