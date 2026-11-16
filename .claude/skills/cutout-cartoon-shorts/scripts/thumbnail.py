#!/usr/bin/env python3
"""Make the YouTube thumbnail: generated with Gemini from the packaging concept and the channel mascot, or made from a
rendered frame; short text in the channel's font; a readability preview at phone sizes.

  python thumbnail.py --slug SLUG [--variants 3] [--concept "TEXT"] [--text "WORDS" | --no-text] [--side left|right]
                      [--ref PROP.png ...] [--model pro|flash] [--size 2K] [--dry-run]
  python thumbnail.py --slug SLUG --still PATH [--text "WORDS" | --no-text] [--side left|right]   # free
  python thumbnail.py --slug SLUG --pick N        # use variant N as the thumbnail

The concept and the text come from shorts/<slug>/packaging.md ("Thumbnail:" and "Thumbnail text:", written in the
packaging step); --concept / --text override them. The mascot reference is the hero of the channel mascot
(data/channel.json mascot.library, else the first library/characters/*/hero.png); add the video's own cut-outs with
--ref (at most 3 references in all). The picture is generated WITHOUT text: the words are set here in Nunito
ExtraBold (the subtitle font) with a dark outline, in the top third on --side, away from YouTube's length badge
(bottom right). At most data/channel.json packaging.thumbnail_max_words words.

Output: 16:9 videos 1280x720, Shorts 1080x1920 (a Short's thumbnail is normally its frame 0: use --still with
qa/frame0.png). Variants go to shorts/<slug>/images/thumbs/ (not committed); the chosen one (variant 1 unless
--pick) to shorts/<slug>/qa/thumbnail.jpg (committed, under 2 MB) and meta.json files.thumbnail. qa/thumbnail-preview.png
shows every variant large and at the sizes a phone shows them (246 and 168 px wide): the subject and the words must
read at the smallest one. Generated variants count toward image_budget (exit code 3 when it is used up) and are
logged in prompts.md like every picture.
"""
from __future__ import annotations

import argparse
import datetime as dt
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (DEFAULT_BUDGET, FORMATS, ROOT, die, load_env, read_channel, read_meta, read_packaging, short_dir,
                    write_meta)
from gen_image import MODELS, call_gemini, est_usd, style_block

FONTS = [
    ROOT / "video/node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff",
    ROOT / "video/node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff2",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("C:/Windows/Fonts/arialbd.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    Path("/Library/Fonts/Arial Bold.ttf"),
]

THUMB_RULES = (
    "A YouTube thumbnail, one bold picture that reads at a glance even very small: one focal point, the subject big "
    "and close (at least 40 percent of the picture), a clear emotion on the face, strong contrast between the subject "
    "and a simple flat background in one or two bold colours. Keep {calm} calm and plain (a title is added there "
    "later) and keep the bottom-right corner free of anything important. No text, no letters, no numbers, no logos, "
    "no watermark, no border, no frame, no arrows unless the concept asks for one."
)


def calm_area(side: str, vertical: bool) -> str:
    return "the top fifth of the picture" if vertical else f"the {side} third of the top half"


def out_size(fmt: str) -> tuple[int, int]:
    return (1080, 1920) if FORMATS.get(fmt, FORMATS["short"])["aspect"] == "9:16" else (1280, 720)


def mascot_refs() -> list[Path]:
    lib = ((read_channel().get("mascot") or {}).get("library") or "").strip()
    chars = ROOT / "library" / "characters"
    candidates = ([chars / lib / "hero.png"] if lib else []) + sorted(chars.glob("*/hero.png"))
    return [c for c in candidates if c.exists()][:1]


def font(size: int):
    from PIL import ImageFont
    for f in FONTS:
        if f.exists():
            try:
                return ImageFont.truetype(str(f), size)
            except OSError:
                continue
    return ImageFont.load_default(size)


def fit_cover(img, w: int, h: int):
    """Scale to cover w x h and crop the middle (no bars)."""
    from PIL import Image
    s = max(w / img.width, h / img.height)
    img = img.convert("RGB").resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def wrap(words: list[str], fnt, max_w: int, draw) -> list[str]:
    """At most two balanced lines."""
    text = " ".join(words)
    if len(words) < 2 or draw.textlength(text, font=fnt) <= max_w:
        return [text]
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        width = max(draw.textlength(a, font=fnt), draw.textlength(b, font=fnt))
        if best is None or width < best[0]:
            best = (width, [a, b])
    return best[1]


def add_text(img, text: str, side: str, colours: tuple[str, str]):
    from PIL import ImageDraw
    if not text.strip():
        return img
    img = img.copy()
    d = ImageDraw.Draw(img)
    w, h = img.size
    vertical = h > w
    max_w = int(w * (0.86 if vertical else 0.46))
    max_h = int(h * (0.16 if vertical else 0.36))
    words = text.split()
    size = int(h * (0.075 if vertical else 0.19))
    while size > 18:
        fnt = font(size)
        stroke = max(3, size // 9)
        lines = wrap(words, fnt, max_w, d)
        line_h = int(size * 1.08)
        if max(d.textlength(l, font=fnt) for l in lines) + 2 * stroke <= max_w and line_h * len(lines) <= max_h:
            break
        size = int(size * 0.92)
    fill, outline = colours
    y = int(h * (0.07 if vertical else 0.06))
    for line in lines:
        lw = d.textlength(line, font=fnt)
        if vertical:
            x = (w - lw) / 2
        else:
            x = int(w * 0.045) if side == "left" else w - int(w * 0.045) - lw
        d.text((x, y), line, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=outline)
        y += line_h
    return img


def preview(variants: list, out: Path) -> None:
    """Every variant large and at the sizes a phone shows it."""
    from PIL import Image, ImageDraw
    big_w = 640
    rows = []
    for img in variants:
        ar = img.height / img.width
        big = img.resize((big_w, round(big_w * ar)), Image.LANCZOS)
        mid = img.resize((246, round(246 * ar)), Image.LANCZOS)
        small = img.resize((168, round(168 * ar)), Image.LANCZOS)
        rows.append((big, mid, small))
    pad = 16
    width = pad + big_w + pad + 246 + pad + 168 + pad
    height = pad + sum(r[0].height + 28 + pad for r in rows)
    sheet = Image.new("RGB", (width, height), "#16181d")
    d = ImageDraw.Draw(sheet)
    y = pad
    for i, (big, mid, small) in enumerate(rows, 1):
        d.text((pad, y), f"variant {i}: large / 246 px (phone feed) / 168 px (search, suggestions)", fill="#cfd3dc",
               font=font(15))
        y += 24
        sheet.paste(big, (pad, y))
        sheet.paste(mid, (pad + big_w + pad, y))
        sheet.paste(small, (pad + big_w + pad + 246 + pad, y))
        y += big.height + pad + 4
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def choose(slug: str, src: Path) -> Path:
    from PIL import Image
    dst = short_dir(slug) / "qa" / "thumbnail.jpg"
    dst.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGB")
    quality = 92
    while True:  # YouTube takes thumbnails up to 2 MB
        img.save(dst, "JPEG", quality=quality, optimize=True)
        if dst.stat().st_size < 1_900_000 or quality <= 60:
            break
        quality -= 8
    meta = read_meta(slug)
    meta.setdefault("files", {})["thumbnail"] = f"shorts/{slug}/qa/thumbnail.jpg"
    write_meta(slug, meta)
    return dst


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--variants", type=int, default=3)
    ap.add_argument("--concept", help="what the picture shows (default: packaging.md 'Thumbnail:')")
    ap.add_argument("--text", help="the words on the thumbnail (default: packaging.md 'Thumbnail text:')")
    ap.add_argument("--no-text", action="store_true")
    ap.add_argument("--side", choices=["left", "right"], default="left", help="where the words go (16:9)")
    ap.add_argument("--ref", action="append", default=[], help="extra reference: a cut-out of this video's prop/set")
    ap.add_argument("--still", help="make it from this rendered frame instead of generating (free)")
    ap.add_argument("--pick", type=int, help="use variant N (from images/thumbs/) as the thumbnail")
    ap.add_argument("--model", choices=list(MODELS), default="pro")
    ap.add_argument("--size", default="2K", help="Gemini image_size (2K is plenty for 1280x720)")
    ap.add_argument("--dry-run", action="store_true", help="print the prompt and what would happen, spend nothing")
    a = ap.parse_args()

    d = short_dir(a.slug)
    if not d.is_dir():
        die(f"no folder shorts/{a.slug}")
    meta = read_meta(a.slug)
    fmt = meta.get("format", "short")
    W, H = out_size(fmt)
    thumbs = d / "images" / "thumbs"
    channel = read_channel()
    pk_style = channel.get("packaging") or {}
    colours = (pk_style.get("text_colour") or "#FFFFFF", pk_style.get("text_outline") or "#111111")

    if a.pick:
        src = thumbs / f"thumb-{a.pick}.jpg"
        if not src.exists():
            die(f"{src.relative_to(ROOT)} does not exist (variants: "
                f"{', '.join(p.name for p in sorted(thumbs.glob('thumb-*.jpg'))) or 'none'})")
        print(choose(a.slug, src).relative_to(ROOT))
        return

    pk = read_packaging(a.slug)
    text = "" if a.no_text else (a.text if a.text is not None else pk.get("thumbnail text", ""))
    if text.strip().lower() in ("none", "-", "no text"):
        text = ""
    max_words = int(pk_style.get("thumbnail_max_words") or 4)
    if len(text.split()) > max_words:
        print(f"warning: {len(text.split())} words on the thumbnail; at most {max_words} read at phone size")

    from PIL import Image
    if a.still:
        still = Path(a.still)
        if not still.exists():
            die(f"frame not found: {still}")
        img = add_text(fit_cover(Image.open(still), W, H), text, a.side, colours)
        thumbs.mkdir(parents=True, exist_ok=True)
        src = thumbs / "thumb-still.jpg"
        img.save(src, "JPEG", quality=92)
        preview([img], d / "qa" / "thumbnail-preview.png")
        print(f"{choose(a.slug, src).relative_to(ROOT)} (from {still.name}; preview qa/thumbnail-preview.png)")
        return

    concept = (a.concept or pk.get("thumbnail") or "").strip()
    if not concept:
        die("no thumbnail concept: write 'Thumbnail: ...' in packaging.md (short-script skill, section 1.2) or pass --concept")
    refs = mascot_refs() + [Path(r) for r in a.ref]
    for r in refs:
        if not r.exists():
            die(f"reference not found: {r}")
    if len(refs) > 3:
        die("at most 3 references (the mascot hero + 2 cut-outs of this video)")
    if not mascot_refs():
        print("warning: no mascot hero in library/characters yet: the mascot is drawn from data/channel.json words only")
    prompt = (f"{concept.rstrip('.')}. {THUMB_RULES.format(calm=calm_area(a.side, H > W))} "
              f"{pk_style.get('thumbnail_style', '')} {style_block('char', bool(refs), key=None)}").replace("  ", " ")

    count = int((meta.get("images") or {}).get("count") or 0)
    budget = int(meta.get("image_budget") or DEFAULT_BUDGET.get(fmt, 40))
    n = max(1, min(6, a.variants))
    cost = n * est_usd(a.model, a.size)
    if a.dry_run:
        print(f"[dry-run] {n} variant(s), {MODELS[a.model]} {a.size} {'9:16' if H > W else '16:9'}, "
              f"refs: {', '.join(str(r) for r in refs) or 'none'}")
        print(f"[dry-run] text: {text!r} on the {a.side}; about ${cost:.2f}; budget {count}/{budget} -> {count + n}/{budget}")
        print(prompt)
        return
    if count + n > budget:
        die(f"picture budget: {count} + {n} thumbnails > {budget}. Raise image_budget in meta.json or use --still.", 3)

    load_env()
    thumbs.mkdir(parents=True, exist_ok=True)
    made = []
    aspect = "9:16" if H > W else "16:9"
    for i in range(1, n + 1):
        data = call_gemini(MODELS[a.model], prompt, refs, aspect, a.size.upper())
        raw = Image.open(io.BytesIO(data)).convert("RGB")
        raw.save(thumbs / f"thumb-{i}-raw.png")
        img = add_text(fit_cover(raw, W, H), text, a.side, colours)
        img.save(thumbs / f"thumb-{i}.jpg", "JPEG", quality=92)
        made.append(img)
        print(f"variant {i}: {(thumbs / f'thumb-{i}.jpg').relative_to(ROOT)}")

    meta = read_meta(a.slug)
    images = meta.get("images") or {}
    images["count"] = int(images.get("count") or 0) + n
    images["est_usd"] = round(float(images.get("est_usd") or 0) + cost, 2)
    images["model"] = images.get("model") or MODELS[a.model]
    meta["images"] = images
    write_meta(a.slug, meta)
    log = d / "prompts.md"
    if not log.exists():
        log.write_text("# Picture prompts\n", encoding="utf-8")
    with log.open("a", encoding="utf-8") as f:
        f.write(f"\n## thumbnail ({n} variants)\n- {dt.datetime.now():%Y-%m-%d %H:%M} · {MODELS[a.model]} · {a.size} · "
                f"{aspect} · refs: {', '.join(r.name for r in refs) or 'none'} · text: {text or 'none'}\n\n```\n{prompt}\n```\n")
    preview(made, d / "qa" / "thumbnail-preview.png")
    dst = choose(a.slug, thumbs / "thumb-1.jpg")
    print(f"{dst.relative_to(ROOT)} = variant 1 (about ${cost:.2f}). Look at qa/thumbnail-preview.png and pick the one "
          f"that reads best at 168 px: thumbnail.py --slug {a.slug} --pick N")


if __name__ == "__main__":
    main()
