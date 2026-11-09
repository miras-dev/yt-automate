#!/usr/bin/env python3
"""Key a picture drawn on a flat background colour to a transparent PNG cut-out.

  python key.py raw/NAME.png cut/NAME.png [--key auto|#9BCFFD] [--tol 30] [--band 3] [--keep-holes]
  python key.py --all shorts/<slug>/images/raw shorts/<slug>/images/cut

How it works
  1. Key colour = median of the border pixels (or --key).
  2. Background = pixels close to the key colour that are CONNECTED TO THE BORDER, so a blue prop detail inside the
     drawing is kept. Enclosed pockets of key colour (the gap between an arm and the body) are removed too, unless
     --keep-holes.
  3. Edge un-blend: in a thin band around the background each pixel is a mix of key colour and the outline. Its alpha
     is solved from that mix and its colour is replaced by the nearest solid drawing colour, so no blue fringe is left.

Prints a one-line report per picture. Exit code 1 if the result looks wrong (nothing keyed, or everything keyed).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def hex_to_rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def border_key(rgb: np.ndarray) -> np.ndarray:
    b = max(2, min(rgb.shape[:2]) // 100)
    edge = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
                           rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    return np.median(edge, axis=0).astype(np.float32)


def key_image(rgb: np.ndarray, key: np.ndarray, tol: float = 30.0, band: int = 3, holes: bool = True,
              min_hole: int = 150):
    """rgb uint8 HxWx3 -> (rgba uint8, info dict)."""
    h, w = rgb.shape[:2]
    f = rgb.astype(np.float32)
    dist = np.linalg.norm(f - key, axis=2)
    near = (dist < tol).astype(np.uint8)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    border = border[border != 0]
    bg = np.isin(labels, border)
    hole_px = 0
    if holes:
        for i in range(1, n):
            if i in border or stats[i, cv2.CC_STAT_AREA] < min_hole:
                continue
            bg |= labels == i
            hole_px += int(stats[i, cv2.CC_STAT_AREA])

    # edge band: a few pixels of drawing next to the background, where key colour is blended in
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * band + 1, 2 * band + 1))
    grown = cv2.dilate(bg.astype(np.uint8), k).astype(bool)
    edge = grown & ~bg
    interior = ~grown

    alpha = np.where(bg, 0.0, 1.0).astype(np.float32)
    out = f.copy()
    if edge.any() and interior.any():
        # nearest solid drawing pixel for every pixel
        _, lab = cv2.distanceTransformWithLabels((~interior).astype(np.uint8), cv2.DIST_L2, 5,
                                                 labelType=cv2.DIST_LABEL_PIXEL)
        lut = np.zeros(lab.max() + 1, np.int64)
        lut[lab[interior]] = np.flatnonzero(interior)
        nearest = lut[lab[edge]]
        fg = f.reshape(-1, 3)[nearest]                     # estimated true colour (usually the black outline)
        p = f[edge]
        d = fg - key
        den = (d * d).sum(1)
        a = np.where(den > 12.0 ** 2, ((p - key) * d).sum(1) / np.maximum(den, 1e-6), 1.0)
        a = np.clip(a, 0.0, 1.0)
        a = np.where(a > 0.96, 1.0, np.where(a < 0.04, 0.0, a))
        alpha[edge] = a
        out[edge] = fg
    out[bg] = 0
    rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), np.round(alpha * 255).astype(np.uint8)])

    solid = alpha > 0.5
    leftover = int(((dist < tol * 1.6) & interior).sum())  # key-like colour left inside the drawing
    info = {
        "key": "#%02X%02X%02X" % tuple(int(round(v)) for v in key),
        "transparent_pct": round(100.0 * float((alpha == 0).mean()), 1),
        "hole_px": hole_px,
        "keylike_inside_px": leftover,
        "bbox": cv2.boundingRect(solid.astype(np.uint8)) if solid.any() else None,
    }
    return rgba, info


def run(src: Path, dst: Path, a) -> bool:
    rgb = np.array(Image.open(src).convert("RGB"))
    key = border_key(rgb) if a.key == "auto" else hex_to_rgb(a.key)
    rgba, info = key_image(rgb, key, a.tol, a.band, not a.keep_holes)
    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(dst)
    ok = 3.0 < info["transparent_pct"] < 99.0
    warn = []
    if not ok:
        warn.append("NOTHING KEYED - wrong key colour?" if info["transparent_pct"] <= 3 else "EVERYTHING KEYED")
    if info["keylike_inside_px"] > 0.002 * rgb.shape[0] * rgb.shape[1]:
        warn.append(f"{info['keylike_inside_px']} px of key-like colour inside the drawing (use --key green set?)")
    print(f"{src.name}: key {info['key']}, {info['transparent_pct']}% transparent, holes {info['hole_px']} px"
          + ("  WARNING: " + "; ".join(warn) if warn else ""))
    return ok


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--all", action="store_true", help="src and dst are folders: key every PNG in src")
    ap.add_argument("--key", default="auto", help="auto (median of the border) or a hex colour")
    ap.add_argument("--tol", type=float, default=30.0, help="RGB distance that still counts as background")
    ap.add_argument("--band", type=int, default=3, help="edge band width in px (4K pictures: 3)")
    ap.add_argument("--keep-holes", action="store_true", help="keep enclosed pockets of key colour")
    a = ap.parse_args()
    if a.all:
        files = sorted(Path(a.src).glob("*.png"))
        if not files:
            sys.exit(f"no PNG files in {a.src}")
        results = [run(f, Path(a.dst) / f.name, a) for f in files]
        sys.exit(0 if all(results) else 1)
    sys.exit(0 if run(Path(a.src), Path(a.dst), a) else 1)


if __name__ == "__main__":
    main()
