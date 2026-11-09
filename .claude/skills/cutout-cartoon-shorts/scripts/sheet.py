#!/usr/bin/env python3
"""Put every keyed cut-out on one sheet with a coloured background, to check them by eye.

  python sheet.py --slug SLUG                       # shorts/<slug>/images/cut -> shorts/<slug>/qa/sheet.png
  python sheet.py DIR_OR_FILES... -o sheet.png [--hero library/characters/<name>/hero.png] [--cols 5]

Each cell shows the cut-out twice: on magenta (shows fringe and holes) and on dark grey (shows light halos).
With --hero the library hero is the first cell, so style drift is visible next to it.
Also prints numbers per picture: half-transparent fill (should be ~0 %), loose specks, enclosed holes.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from common import short_dir

BG_A, BG_B = (255, 0, 200), (38, 38, 44)


def measure(rgba: np.ndarray) -> dict:
    a = rgba[..., 3]
    solid = (a > 128).astype(np.uint8)
    if not solid.any():
        return {"empty": True}
    # half-transparent pixels that are NOT on the edge = a fill that was keyed by mistake
    k = np.ones((7, 7), np.uint8)
    edge = cv2.dilate(solid, k) - cv2.erode(solid, k)
    semi = ((a > 20) & (a < 235) & (edge == 0)).sum()
    n, _, stats, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    areas = sorted((int(s[cv2.CC_STAT_AREA]) for s in stats[1:]), reverse=True)
    specks = sum(1 for x in areas[1:] if x < 0.002 * areas[0])
    hn, _, hstats, _ = cv2.connectedComponentsWithStats(1 - solid, connectivity=4)
    holes = max(0, sum(1 for s in hstats[1:] if s[cv2.CC_STAT_AREA] > 40) - 1)  # minus the outside
    return {"empty": False, "semi_pct": round(100.0 * semi / solid.sum(), 2), "parts": len(areas), "specks": specks,
            "holes": holes}


def cell(img: Image.Image, name: str, size: int) -> Image.Image:
    c = Image.new("RGB", (size * 2, size + 34), (20, 20, 24))
    thumb = img.copy()
    thumb.thumbnail((size - 16, size - 16), Image.LANCZOS)
    for i, bg in enumerate((BG_A, BG_B)):
        tile = Image.new("RGB", (size, size), bg)
        tile.paste(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2), thumb)
        c.paste(tile, (i * size, 0))
    ImageDraw.Draw(c).text((8, size + 10), name[:60], fill=(235, 235, 235))
    return c


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="*", help="folders or PNG files")
    ap.add_argument("--slug")
    ap.add_argument("-o", "--out")
    ap.add_argument("--hero", help="library hero picture to put first")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--size", type=int, default=360, help="tile size in px")
    a = ap.parse_args()

    if a.slug and not a.inputs:
        a.inputs = [str(short_dir(a.slug) / "images" / "cut")]
        a.out = a.out or str(short_dir(a.slug) / "qa" / "sheet.png")
    if not a.inputs or not a.out:
        ap.error("give --slug SLUG, or inputs and -o OUT")
    files: list[Path] = []
    for i in a.inputs:
        p = Path(i)
        files += sorted(p.glob("*.png")) if p.is_dir() else [p]
    if a.hero:
        files = [Path(a.hero)] + [f for f in files if f.resolve() != Path(a.hero).resolve()]
    if not files:
        sys.exit("no pictures found")

    cells, bad = [], 0
    for f in files:
        img = Image.open(f).convert("RGBA")
        m = measure(np.array(img))
        flags = []
        if m.get("empty"):
            flags.append("EMPTY")
        else:
            if m["semi_pct"] > 0.5:
                flags.append(f"half-transparent fill {m['semi_pct']}%")
            if m["specks"]:
                flags.append(f"{m['specks']} loose specks")
        bad += bool(flags)
        label = f.stem + ("  (hero)" if a.hero and f == files[0] else "") + ("  !" if flags else "")
        print(f"{f.name}: " + (", ".join(flags) if flags else f"ok (parts {m['parts']}, holes {m['holes']})"))
        cells.append(cell(img, label, a.size))

    cols = max(1, min(a.cols, len(cells)))
    rows = -(-len(cells) // cols)
    cw, ch = cells[0].size
    sheet = Image.new("RGB", (cols * cw, rows * ch), (20, 20, 24))
    for i, c in enumerate(cells):
        sheet.paste(c, ((i % cols) * cw, (i // cols) * ch))
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out)
    print(f"sheet: {a.out}  ({len(cells)} pictures, {bad} flagged). Open it and look: fringe, holes, wrong hands, "
          f"style drift.")


if __name__ == "__main__":
    main()
