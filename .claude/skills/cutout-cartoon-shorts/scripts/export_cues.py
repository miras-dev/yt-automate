#!/usr/bin/env python3
"""Bridge between the T table (timing.ts), the cue list (cues.json) and real-sfx.

  python export_cues.py --slug SLUG [--scene s1] [--video out/preview.mp4]      # T + cues.json -> real-sfx files
  python export_cues.py --slug SLUG [--scene s1] --apply RESULT_resolved_cues.json   # real-sfx placement -> cues.json

timing.ts stays the only source of times. video/src/<slug>/cues.json names each sound and the T key it belongs to:

  [{"cue": "throw", "key": "release", "dt": 0, "role": "whoosh", "f": "whoosh_short", "db": -28},
   {"cue": "plop",  "key": "land",    "role": "hit",    "f": "plop",         "db": -16}]

  cue   name (also the label real-sfx reports)        key   a key of T        dt   optional shift in seconds
  role  real-sfx role: whoosh | hit | riser | water | ambience | pop | click ... (impacts land by onset, whooshes by peak)
  f     file stem in video/public/<slug>/sfx/ (trimmed, peak-normalised)      db   level in dB under full scale

Export writes two files to shorts/<slug>/qa/:
  sfx-sheet.json    a real-sfx cue sheet for mix.py (explicit files; real-sfx finds onset / peak and places them)
  sfx-events.json   the same moments as a typed event list for from_cues.py (when real-sfx should pick the sounds)
--apply reads real-sfx's *_resolved_cues.json and stores, per cue, "lead": seconds from the start of the file to the
point that must land on T. The Remotion <SoundCues> component then starts each file at T[key] + dt - lead.
For long videos give --scene NAME: the files are video/src/<slug>/scenes/<NAME>/timing.ts and cues.json.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, die, read_json, short_dir, write_json

TYPE_OF_ROLE = {"hit": "hit", "impact": "hit", "blast": "hit", "whoosh": "whoosh", "bed": "ambience",
                "ambience": "ambience", "riser": "riser", "water": "water", "pop": "pop", "click": "click",
                "chime": "chime", "thump": "thump", "glass": "glass", "magic": "magic", "paper": "paper"}


def read_T(ts: Path) -> dict[str, float]:
    """Parse `export const T = { name: 1.23, ... }` (numbers, or simple arithmetic on numbers)."""
    if not ts.exists():
        die(f"not found: {ts}")
    src = re.sub(r"//.*", "", ts.read_text(encoding="utf-8"))
    m = re.search(r"export\s+const\s+T\s*=\s*\{(.*?)\}", src, re.S)
    if not m:
        die(f"{ts}: no `export const T = {{...}}`")
    T: dict[str, float] = {}
    for name, expr in re.findall(r"([A-Za-z_]\w*)\s*:\s*([^,\n}]+)", m.group(1)):
        expr = expr.strip()
        if not re.fullmatch(r"[\w\s.+\-*/()]+", expr):
            die(f"{ts}: cannot read T.{name} = {expr!r} (use plain numbers)")
        try:
            T[name] = float(eval(expr, {"__builtins__": {}}, dict(T)))  # numbers and earlier keys only
        except Exception:
            die(f"{ts}: cannot evaluate T.{name} = {expr!r}")
    return T


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--scene", help="scene folder name for long videos")
    ap.add_argument("--offset", type=float, default=0.0, help="scene start on the full timeline (seconds)")
    ap.add_argument("--video", help="preview MP4 the sounds are placed against")
    ap.add_argument("--apply", help="real-sfx *_resolved_cues.json to read the placement from")
    a = ap.parse_args()

    base = ROOT / "video" / "src" / a.slug / (f"scenes/{a.scene}" if a.scene else "")
    T = read_T(base / "timing.ts")
    cues_path = base / "cues.json"
    cues = read_json(cues_path)
    if cues is None:
        die(f"not found: {cues_path}")
    sfx_dir = ROOT / "video" / "public" / a.slug / "sfx"
    tag = f"-{a.scene}" if a.scene else ""

    def when(c):
        if c["key"] not in T:
            die(f"cue {c['cue']!r}: T has no key {c['key']!r} (keys: {', '.join(T)})")
        return round(T[c["key"]] + float(c.get("dt", 0)), 4)

    if a.apply:
        resolved = read_json(Path(a.apply)) or {}
        by_label = {r.get("label"): r for r in resolved.get("cues", [])}
        n = 0
        for c in cues:
            r = by_label.get(c["cue"])
            if not r:
                print(f"  {c['cue']}: not in the real-sfx result (kept lead {c.get('lead', 0)})")
                continue
            c["lead"] = round(float(r["t"]) - float(r["start"]), 4)
            c["anchor"] = r.get("anchor")
            n += 1
            print(f"  {c['cue']}: {r.get('anchor')} lands on T.{c['key']} -> lead {c['lead']} s")
        write_json(cues_path, cues)
        print(f"{cues_path.relative_to(ROOT)}: placement stored for {n}/{len(cues)} cues")
        return

    sheet, events, missing = [], [], []
    for c in cues:
        t = round(when(c) + a.offset, 4)
        f = next((p for p in (sfx_dir / f"{c['f']}.wav", sfx_dir / f"{c['f']}.mp3") if p.exists()), None)
        role = c.get("role", "hit")
        if f is None:
            missing.append(c["f"])
        else:
            sheet.append({"t": t, "label": c["cue"], "file": str(f), "role": TYPE_OF_ROLE.get(role, role)
                          if role in ("impact", "blast", "bed") else role})
        ev = {"t": t, "type": TYPE_OF_ROLE.get(role, role), "label": c["cue"]}
        if c.get("len"):
            ev["len"] = c["len"]
        events.append(ev)
    qa = short_dir(a.slug) / "qa"
    doc = {"keep_audio": "auto", "cues": sorted(sheet, key=lambda x: x["t"])}
    if a.video:
        doc["video"] = str(Path(a.video).resolve())
    write_json(qa / f"sfx-sheet{tag}.json", doc)
    write_json(qa / f"sfx-events{tag}.json", sorted(events, key=lambda x: x["t"]))
    print(f"{len(events)} cues from {len(T)} T keys -> shorts/{a.slug}/qa/sfx-sheet{tag}.json, sfx-events{tag}.json")
    for c in cues:
        print(f"  {when(c) + a.offset:7.3f} s  {c['cue']:<14} T.{c['key']:<12} {c.get('role', 'hit'):<8} {c['f']}  {c.get('db', '')} dB")
    if missing:
        print(f"warning: no file in video/public/{a.slug}/sfx/ for: {', '.join(sorted(set(missing)))}")


if __name__ == "__main__":
    main()
