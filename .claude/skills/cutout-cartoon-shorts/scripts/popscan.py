#!/usr/bin/env python3
"""Pop scan: find frames where the picture jumps (a swap or cut), so every jump can be checked as intended.

  python popscan.py PREVIEW.mp4 [-o shorts/<slug>/qa/popscan.json] [--factor 2.2] [--expect 2.05,3.7]

Frames are scaled to 270 px on the short side, blurred, and compared with the frame before (mean absolute
difference). A frame is flagged when its difference is above FACTOR x the local median (1 s window) and above a small
floor. --expect lists the times (seconds) of planned swaps and cuts; flags within 2 frames of one are "planned".
Exit code 1 when unplanned flags remain (only if --expect was given).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(num) / float(den)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("-o", "--out")
    ap.add_argument("--factor", type=float, default=2.2)
    ap.add_argument("--floor", type=float, default=1.2, help="minimum difference (0-255) to count at all")
    ap.add_argument("--expect", default="", help="comma list of planned swap / cut times in seconds")
    a = ap.parse_args()

    w, h, fps = probe(a.video)
    k = 270.0 / min(w, h)
    sw, sh = int(round(w * k / 2) * 2), int(round(h * k / 2) * 2)
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={sw}:{sh}", "-pix_fmt", "gray",
                             "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    prev, diffs = None, []
    while True:
        buf = proc.stdout.read(sw * sh)
        if len(buf) < sw * sh:
            break
        f = cv2.GaussianBlur(np.frombuffer(buf, np.uint8).reshape(sh, sw), (0, 0), 2.0).astype(np.float32)
        diffs.append(0.0 if prev is None else float(np.abs(f - prev).mean()))
        prev = f
    proc.wait()
    d = np.array(diffs)
    half = max(2, int(round(fps / 2)))
    expect = [float(x) for x in a.expect.split(",") if x.strip()]
    flags = []
    for i in range(1, len(d)):
        lo, hi = max(1, i - half), min(len(d), i + half + 1)
        med = float(np.median(d[lo:hi]))
        if d[i] > a.floor and d[i] > a.factor * max(med, 0.15):
            t = i / fps
            planned = any(abs(t - e) <= 2.5 / fps for e in expect)
            flags.append({"frame": i, "t": round(t, 3), "diff": round(float(d[i]), 2), "local_median": round(med, 2),
                          "ratio": round(float(d[i]) / max(med, 0.15), 1), "planned": planned})
    still_end = bool(len(d) > half and float(d[-half:].max()) < 0.02)
    res = {"video": str(a.video), "fps": fps, "frames": len(d), "factor": a.factor, "flags": flags,
           "unplanned": sum(1 for f in flags if not f["planned"]), "frozen_at_end": still_end}
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(f"{len(d)} frames at {fps:g} fps: {len(flags)} jumps flagged, {res['unplanned']} not in --expect"
          + ("; the picture is frozen at the end" if still_end else ""))
    for f in flags:
        print(f"  {f['t']:7.3f} s  frame {f['frame']:5d}  x{f['ratio']}" + ("  planned" if f["planned"] else ""))
    sys.exit(1 if expect and res["unplanned"] else 0)


if __name__ == "__main__":
    main()
