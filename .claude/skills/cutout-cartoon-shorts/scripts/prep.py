#!/usr/bin/env python3
"""Trim, measure and register keyed cut-outs so Remotion can swap poses without anything jumping.

  python prep.py --slug SLUG [--obj lava,rock] [--pair pose_bag:pose_empty] [--profile volcano]
                 [--use-library NAME[:pose1,pose2]] [--max-side 2400]
  python prep.py --library NAME --src DIR            # build library/characters/NAME/ (Part 7.2)

Per Short: reads shorts/<slug>/images/cut/*.png, writes trimmed sprites to video/public/<slug>/ and the measurements
to video/src/<slug>/sprites.ts.
Library: writes trimmed poses + poses.json to library/characters/NAME/ (committed, reused by every later video).

Measured per picture
  box     trim offset and size (alpha box + 12 px)
  head    largest inscribed disc of the hole-filled silhouette (characters): x, y, r
  feet    middle of the opaque pixels in the bottom 3.5 % of rows (full-body poses)
  scale   factor that makes this pose's head radius equal the reference head radius -> swaps keep the head size
  grips   extreme points of the silhouette: topRight = argmax(x - y) (a raised hand), topLeft, right, left, top
  align   --pair A:B  ECC affine on the head region, as a CSS matrix that draws A inside B's canvas
  profile --profile NAME  top edge of a set piece every 25 px (so falling things land on the surface) and the
          ellipse of its opening when one is found

Which pictures are characters comes from images/manifest.json (written by gen_image.py); --obj overrides it.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from common import ROOT, die, read_json, short_dir, write_json

PAD = 12


def load_rgba(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"))


def trim(rgba: np.ndarray):
    a = rgba[..., 3] > 8
    if not a.any():
        return None
    ys, xs = np.where(a)
    x0, x1 = max(0, xs.min() - PAD), min(rgba.shape[1], xs.max() + 1 + PAD)
    y0, y1 = max(0, ys.min() - PAD), min(rgba.shape[0], ys.max() + 1 + PAD)
    return rgba[y0:y1, x0:x1], (int(x0), int(y0))


def head_disc(alpha: np.ndarray):
    """Largest inscribed disc of the hole-filled silhouette = the head of a big-headed character."""
    h, w = alpha.shape
    a8 = (alpha > 128).astype(np.uint8)
    a8 = cv2.copyMakeBorder(a8, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)  # so the flood fill always starts outside
    ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return float(hx - 1), float(hy - 1), float(dt[hy, hx])


def feet_point(alpha: np.ndarray):
    a = alpha > 128
    ys, xs = np.where(a)
    bottom, top = ys.max(), ys.min()
    band = max(2, int(round((bottom - top + 1) * 0.035)))
    sel = ys >= bottom - band + 1
    return float((xs[sel].min() + xs[sel].max()) / 2.0), float(bottom)


def grip_points(alpha: np.ndarray) -> dict:
    ys, xs = np.where(alpha > 128)
    pick = lambda score: [float(xs[score.argmax()]), float(ys[score.argmax()])]
    return {"topRight": pick(xs - ys), "topLeft": pick(-xs - ys), "right": pick(xs), "left": pick(-xs),
            "top": pick(-ys), "bottomRight": pick(xs + ys), "bottomLeft": pick(-xs + ys)}


def widest_dark_row(rgba: np.ndarray) -> float:
    """Width of the widest row of opaque pixels: used to match a flying prop to the one drawn in a pose."""
    return float((rgba[..., 3] > 128).sum(axis=1).max())


def top_profile(alpha: np.ndarray, step: int = 25):
    a = alpha > 128
    prof = []
    for x in range(0, a.shape[1], step):
        col = np.where(a[:, x])[0]
        if len(col):
            prof.append([int(x), int(col.min())])
    return prof


def opening_ellipse(rgba: np.ndarray):
    """The opening of a set piece (crater, cup, pipe): the biggest hole or inner-colour blob in the top third."""
    a = (rgba[..., 3] > 128).astype(np.uint8)
    h = a.shape[0]
    top = a[: max(8, h // 3)]
    rgb = rgba[: top.shape[0], :, :3].astype(np.float32)
    lum = rgb.mean(2)
    # inner colour band = bright, saturated pixels (lava, water) inside the outline
    sat = rgb.max(2) - rgb.min(2)
    cand = ((sat > 70) & (lum > 60) & (top > 0)).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cand, connectivity=8)
    if n < 2:
        return None
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    if stats[i, cv2.CC_STAT_AREA] < 200:
        return None
    x, y, w, hh = (int(stats[i, k]) for k in (cv2.CC_STAT_LEFT, cv2.CC_STAT_TOP, cv2.CC_STAT_WIDTH, cv2.CC_STAT_HEIGHT))
    return {"cx": round(x + w / 2, 1), "cy": round(y + hh / 2, 1), "rx": round(w / 2, 1), "ry": round(hh / 2, 1)}


def ecc_align(a_rgba: np.ndarray, b_rgba: np.ndarray, head_a, head_b):
    """Affine that draws picture A inside picture B's canvas so the heads coincide (CSS matrix a,b,c,d,e,f)."""
    hh, ww = max(a_rgba.shape[0], b_rgba.shape[0]), max(a_rgba.shape[1], b_rgba.shape[1])

    def gray(x):
        pad = np.zeros((hh, ww, 4), np.uint8)
        pad[: x.shape[0], : x.shape[1]] = x
        g = cv2.cvtColor(np.ascontiguousarray(pad[..., :3]), cv2.COLOR_RGB2GRAY).astype(np.float32)
        al = pad[..., 3].astype(np.float32) / 255.0
        return g * al + 255.0 * (1 - al)

    A, B = gray(a_rgba), gray(b_rgba)
    mask = np.zeros((hh, ww), np.uint8)
    cv2.circle(mask, (int(head_b[0]), int(head_b[1])), int(head_b[2] * 1.15), 255, -1)
    # start from the translation that puts the two head centres on each other (warp maps B -> A)
    warp = np.array([[1, 0, head_a[0] - head_b[0]], [0, 1, head_a[1] - head_b[1]]], np.float32)
    try:
        cc, warp = cv2.findTransformECC(B, A, warp, cv2.MOTION_AFFINE,
                                        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 500, 1e-6), mask, 5)
    except cv2.error as e:
        return None, 0.0, str(e).splitlines()[-1][:120]
    inv = cv2.invertAffineTransform(warp)  # warp maps B -> A; the inverse draws A in B's canvas
    m = [float(inv[0, 0]), float(inv[1, 0]), float(inv[0, 1]), float(inv[1, 1]), float(inv[0, 2]), float(inv[1, 2])]
    return [round(v, 5) for v in m], float(cc), None


def measure(path: Path, kind: str, framing: str, max_side: int):
    rgba = load_rgba(path)
    t = trim(rgba)
    if t is None:
        return None
    img, (ox, oy) = t
    src_h, src_w = rgba.shape[:2]
    resize = min(1.0, max_side / max(img.shape[:2]))
    if resize < 1.0:
        img = cv2.resize(img, (max(1, round(img.shape[1] * resize)), max(1, round(img.shape[0] * resize))),
                         interpolation=cv2.INTER_AREA)
    alpha = img[..., 3]
    m = {"file": path.stem + ".png", "kind": kind, "framing": framing, "w": int(img.shape[1]), "h": int(img.shape[0]),
         "trim": {"x": ox, "y": oy, "srcW": src_w, "srcH": src_h, "resize": round(resize, 5)},
         "grips": {k: [round(v[0], 1), round(v[1], 1)] for k, v in grip_points(alpha).items()},
         "maxRow": round(widest_dark_row(img), 1)}
    if kind == "char":
        hx, hy, hr = head_disc(alpha)
        m["head"] = {"x": round(hx, 1), "y": round(hy, 1), "r": round(hr, 1)}
        if framing == "full":
            fx, fy = feet_point(alpha)
            m["feet"] = {"x": round(fx, 1), "y": round(fy, 1)}
    return img, m


def normalise(sprites: dict, ref: str | None):
    """scale = factor that brings every character pose to the reference head radius."""
    chars = {k: v for k, v in sprites.items() if v["kind"] == "char" and v.get("head")}
    if not chars:
        return None
    if ref and ref in chars:
        r0 = chars[ref]["head"]["r"]
    else:
        full = [v["head"]["r"] for v in chars.values() if v["framing"] == "full"] or [v["head"]["r"] for v in chars.values()]
        r0 = float(np.median(full))
    for v in chars.values():
        v["scale"] = round(r0 / v["head"]["r"], 5)
    for v in sprites.values():
        v.setdefault("scale", 1.0)
    return r0


TS_HEADER = """// Generated by prep.py - do not edit by hand. Re-run: python .claude/skills/cutout-cartoon-shorts/scripts/prep.py --slug {slug}
import type {{SpriteInfo}} from '../lib/sprites';

export const HEAD_R = {head_r};

export const SPRITES = {body} as const satisfies Record<string, SpriteInfo>;

export type SpriteName = keyof typeof SPRITES;
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug")
    ap.add_argument("--library", help="build library/characters/NAME instead of a Short")
    ap.add_argument("--src", help="folder of keyed PNGs (default shorts/<slug>/images/cut)")
    ap.add_argument("--obj", default="", help="comma list of names that are props / set pieces")
    ap.add_argument("--char", default="", help="comma list of names that are characters (overrides the manifest)")
    ap.add_argument("--waist", default="", help="comma list of waist-up / close-up poses (no feet point)")
    ap.add_argument("--ref-pose", help="pose whose head radius every other pose is scaled to")
    ap.add_argument("--pair", action="append", default=[], help="A:B edited pose pair to align on the head (ECC)")
    ap.add_argument("--profile", action="append", default=[], help="set piece to measure (top profile + opening)")
    ap.add_argument("--use-library", action="append", default=[], help="NAME or NAME:pose1,pose2 to copy library poses")
    ap.add_argument("--max-side", type=int, default=2400, help="downscale sprites whose longest side is larger")
    a = ap.parse_args()
    if bool(a.slug) == bool(a.library):
        ap.error("give exactly one of --slug or --library")

    if a.library:
        src = Path(a.src) if a.src else die("--library needs --src DIR")
        pub = ROOT / "library" / "characters" / a.library
    else:
        src = Path(a.src) if a.src else short_dir(a.slug) / "images" / "cut"
        pub = ROOT / "video" / "public" / a.slug
    manifest = read_json(src.parent / "manifest.json", {}) or {}
    objs, chars, waist = (set(filter(None, s.split(","))) for s in (a.obj, a.char, a.waist))
    pub.mkdir(parents=True, exist_ok=True)

    sprites: dict[str, dict] = {}
    images: dict[str, np.ndarray] = {}
    for f in sorted(src.glob("*.png")) if src.exists() else []:
        man = manifest.get(f.stem, {})
        kind = "obj" if f.stem in objs else "char" if f.stem in chars else man.get("kind", "char" if a.library else "obj")
        framing = "waist" if f.stem in waist else man.get("framing", "full" if kind == "char" else "prop")
        r = measure(f, kind, framing, a.max_side)
        if r is None:
            print(f"skip {f.name}: fully transparent")
            continue
        images[f.stem], sprites[f.stem] = r
        Image.fromarray(r[0], "RGBA").save(pub / f.name)

    # library poses reused in this Short
    if a.slug:
        for spec in a.use_library:
            name, _, only = spec.partition(":")
            lib = ROOT / "library" / "characters" / name
            poses = read_json(lib / "poses.json")
            if not poses:
                die(f"library character not found: {lib}/poses.json")
            want = set(filter(None, only.split(",")))
            for pose, info in poses["poses"].items():
                if want and pose not in want:
                    continue
                if pose in sprites:
                    continue  # a picture made for this Short wins over the library pose
                shutil.copyfile(lib / info["file"], pub / info["file"])
                sprites[pose] = {k: v for k, v in info.items() if k != "prompt"}
                sprites[pose]["library"] = name
            missing = want - set(poses["poses"])
            if missing:
                die(f"library {name} has no pose(s): {', '.join(sorted(missing))}")

    if not sprites:
        die(f"no pictures found in {src}")
    head_r = normalise(sprites, a.ref_pose)

    for pair in a.pair:
        na, _, nb = pair.partition(":")
        if na not in images or nb not in images or "head" not in sprites[na] or "head" not in sprites[nb]:
            die(f"--pair {pair}: both must be character pictures in {src}")
        ha, hb = sprites[na]["head"], sprites[nb]["head"]
        m, cc, err = ecc_align(images[na], images[nb], (ha["x"], ha["y"], ha["r"]), (hb["x"], hb["y"], hb["r"]))
        if err:
            print(f"pair {pair}: ECC failed ({err}); falling back to head-centre alignment")
            continue
        sprites[na]["align"] = {"to": nb, "matrix": m, "cc": round(cc, 4)}
        print(f"pair {pair}: ECC correlation {cc:.3f}  matrix({', '.join(str(v) for v in m)})")

    for name in a.profile:
        if name not in images:
            die(f"--profile {name}: not found in {src}")
        sprites[name]["profile"] = top_profile(images[name][..., 3])
        op = opening_ellipse(images[name])
        if op:
            sprites[name]["opening"] = op

    for name, s in sorted(sprites.items()):
        bits = [f"{s['w']}x{s['h']}", s["kind"], s["framing"], f"scale {s['scale']}"]
        if s.get("head"):
            bits.append(f"head r {s['head']['r']}")
        if s.get("feet"):
            bits.append(f"feet ({s['feet']['x']}, {s['feet']['y']})")
        print(f"{name}: " + ", ".join(bits))

    if a.library:
        old = read_json(pub / "poses.json", {}) or {}
        prompts = {k: v.get("prompt") for k, v in (old.get("poses") or {}).items()}
        for k, v in sprites.items():
            v["prompt"] = prompts.get(k) or manifest.get(k, {}).get("prompt", "")
        write_json(pub / "poses.json", {"name": a.library, "headR": head_r, "poses": sprites})
        print(f"library: {pub.relative_to(ROOT)}/poses.json  ({len(sprites)} poses, head r {head_r})")
        return

    ts_dir = ROOT / "video" / "src" / a.slug
    ts_dir.mkdir(parents=True, exist_ok=True)
    for name, s in sprites.items():
        s["src"] = f"{a.slug}/{s['file']}"
    body = json.dumps(dict(sorted(sprites.items())), indent=2)
    (ts_dir / "sprites.ts").write_text(TS_HEADER.format(slug=a.slug, head_r=json.dumps(head_r), body=body), encoding="utf-8")
    print(f"sprites: video/src/{a.slug}/sprites.ts  ({len(sprites)} pictures) -> video/public/{a.slug}/")


if __name__ == "__main__":
    main()
