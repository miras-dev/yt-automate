#!/usr/bin/env python3
"""Generate one cut-out picture with the Gemini image API on a flat key colour.

  python gen_image.py NAME ASPECT "PROMPT" --kind char|obj --slug SLUG
        [--ref a.png --ref b.png] [--model pro|flash] [--key blue|green] [--size 4K]
        [--framing full|waist|close] [--out DIR] [--dry-run]

Writes shorts/<slug>/images/raw/NAME.png (or DIR/NAME.png), appends the full prompt to
shorts/<slug>/prompts.md, records the picture in images/manifest.json and counts it in meta.json.
Stops with exit code 3 when the picture budget in meta.json ("image_budget") would be exceeded.

The prompt you pass is only what is different in THIS picture; the fixed STYLE block is added here. For characters
the look comes from data/channel.json (mascot.look + mascot.signature, the channel's own mascot); without that file
the built-in look below is used. GEMINI_API_KEY comes from .env or the environment and is never printed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import io
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (DEFAULT_BUDGET, ROOT, die, load_env, read_channel, read_json, read_meta, short_dir, write_json,
                    write_meta)

MODELS = {
    "pro": "gemini-3-pro-image-preview",        # Nano Banana Pro (best)
    "flash": "gemini-3.1-flash-image-preview",  # Nano Banana 2 (cheaper)
}
# Rough cost per image in USD by image_size, for the estimate in meta.json only. Pro: Google's standard rate
# ($0.134 at 1K/2K, $0.24 at 4K; the Batch API halves it). Flash: a conservative guess. Check current Gemini pricing.
EST_USD = {"pro": {"1K": 0.134, "2K": 0.134, "4K": 0.24}, "flash": {"1K": 0.15, "2K": 0.15, "4K": 0.15}}
KEYS = {"blue": ("light-blue", "#9BCFFD"), "green": ("green", "#3CD070")}
ASPECTS = {"1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"}

# The built-in character look, used until data/channel.json names the channel's own mascot (mascot.look). Written to
# follow "a" / "the same" so the same words work for the hero picture and for every picture made from a reference.
DEFAULT_LOOK = (
    "simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and "
    "short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft "
    "pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no "
    "clothes, a pink tongue only when the mouth is open"
)
LINEWORK = "Clean vector-like linework, flat colours, no texture, no text, no border."
KEY_BG = ("On a plain flat solid {key_name} background ({key_hex}), nothing else: no sky, no ground, no floor shadow, "
          "no checkerboard.")
STYLE_OBJ = (
    "Flat 2D cartoon in exactly the same drawing style as the reference images: thick smooth black outlines of even "
    "weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no "
    "characters."
)


def mascot() -> tuple[str, str]:
    """(look, signature) of the channel mascot from data/channel.json, else the built-in look and no signature."""
    m = read_channel().get("mascot") or {}
    look = (m.get("look") or "").strip().rstrip(".") or DEFAULT_LOOK
    for lead in ("a ", "an ", "the same "):  # the article is added here
        if look.lower().startswith(lead):
            look = look[len(lead):]
    return look, (m.get("signature") or "").strip().rstrip(".")


def style_block(kind: str, has_refs: bool, key: str | None = "blue") -> str:
    """The fixed STYLE block. key=None leaves out the key-colour background (thumbnails have a real background)."""
    if kind == "char":
        look, signature = mascot()
        article = "an" if look[:1].lower() in "aeiou" else "a"
        style = (f"Flat 2D cartoon in exactly the same drawing style as the reference images: the same {look}."
                 if has_refs else f"Flat 2D cartoon: {article} {look}.")
        if signature:
            style += f" Signature detail, always visible and always the same: {signature}."
        style += f" {LINEWORK}"
    else:
        style = STYLE_OBJ if has_refs else STYLE_OBJ.replace(" in exactly the same drawing style as the reference images:", ":", 1)
    if key:
        key_name, key_hex = KEYS[key]
        style += " " + KEY_BG.format(key_name=key_name, key_hex=key_hex)
    return style


def build_prompt(prompt: str, kind: str, key: str, has_refs: bool) -> str:
    # without references (the hero picture) the style block alone defines the look
    return f"{prompt.strip()} {style_block(kind, has_refs, key)}"


def est_usd(model: str, size: str) -> float:
    return EST_USD[model].get(size.upper(), EST_USD[model]["4K"])


def call_gemini(model: str, prompt: str, refs: list[Path], aspect: str, size: str) -> bytes:
    try:
        from google import genai
        from google.genai import types
        from PIL import Image
    except ImportError:
        die("python libs missing: pip install -r requirements.txt")
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        die("GEMINI_API_KEY is not set (put it in .env)", 2)
    client = genai.Client(api_key=key, http_options=types.HttpOptions(api_version="v1beta"))
    contents: list = [prompt] + [Image.open(r) for r in refs]
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=aspect, image_size=size),
    )
    last = None
    for attempt in range(4):
        try:
            resp = client.models.generate_content(model=model, contents=contents, config=config)
            for cand in resp.candidates or []:
                for part in (cand.content.parts if cand.content else []) or []:
                    if getattr(part, "inline_data", None) and part.inline_data.data:
                        return part.inline_data.data
            last = RuntimeError("the model returned no image (blocked or text-only answer)")
        except Exception as e:  # network / quota / 5xx: retry with backoff
            last = e
        time.sleep(2 ** (attempt + 1))
    die(f"Gemini failed after 4 tries: {type(last).__name__}: {str(last)[:300]}")
    return b""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name")
    ap.add_argument("aspect", help="2:3 full body, 4:5 waist-up, 1:1 props, 3:2 or 16:9 wide set pieces")
    ap.add_argument("prompt")
    ap.add_argument("--kind", choices=["char", "obj"], required=True)
    ap.add_argument("--slug", default=os.environ.get("SHORT_SLUG"), help="shorts/<slug> (or env SHORT_SLUG)")
    ap.add_argument("--ref", action="append", default=[], help="reference crop, one panel each (max 2 advised)")
    ap.add_argument("--model", choices=list(MODELS), default="pro")
    ap.add_argument("--key", choices=list(KEYS), default="blue", help="green when the subject contains blue")
    ap.add_argument("--size", default="4K", help='image_size: "1K", "2K" or "4K" (uppercase K)')
    ap.add_argument("--framing", choices=["full", "waist", "close", "prop", "set"], default=None)
    ap.add_argument("--out", default=None, help="output folder instead of shorts/<slug>/images/raw")
    ap.add_argument("--dry-run", action="store_true", help="print the full prompt, write a key-colour dummy, no API call")
    a = ap.parse_args()

    if a.aspect not in ASPECTS:
        die(f"aspect {a.aspect!r} not supported; use one of {sorted(ASPECTS)}")
    a.size = a.size.upper()
    if not a.slug and not a.out:
        die("give --slug SLUG (or --out DIR for library pictures)")
    refs = [Path(r) for r in a.ref]
    for r in refs:
        if not r.exists():
            die(f"reference not found: {r}")
    out_dir = Path(a.out) if a.out else short_dir(a.slug) / "images" / "raw"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{a.name}.png"
    framing = a.framing or {"2:3": "full", "4:5": "waist", "1:1": "prop"}.get(a.aspect, "set" if a.kind == "obj" else "full")
    full_prompt = build_prompt(a.prompt, a.kind, a.key, bool(refs))

    # budget check (per Short; library pictures made with --out and no --slug are not counted)
    meta = read_meta(a.slug) if a.slug else {}
    images = meta.get("images") or {}
    count = int(images.get("count") or 0)
    budget = int(meta.get("image_budget") or DEFAULT_BUDGET.get(meta.get("format", "short"), 40))
    if a.slug and not a.dry_run and count + 1 > budget:
        die(f"picture budget reached ({count}/{budget}). Raise image_budget in meta.json to continue.", 3)

    if a.dry_run:
        from PIL import Image
        w, h = (int(x) for x in a.aspect.split(":"))
        Image.new("RGB", (w * 100, h * 100), KEYS[a.key][1]).save(out)
        print(f"[dry-run] model={MODELS[a.model]} size={a.size} aspect={a.aspect} refs={len(refs)}")
        print(full_prompt)
        print(f"[dry-run] wrote dummy {out}")
        return

    load_env()
    data = call_gemini(MODELS[a.model], full_prompt, refs, a.aspect, a.size)
    from PIL import Image
    Image.open(io.BytesIO(data)).convert("RGB").save(out)  # always a real PNG, whatever the API sent

    manifest_path = out_dir.parent / "manifest.json"
    manifest = read_json(manifest_path, {}) or {}
    manifest[a.name] = {"kind": a.kind, "aspect": a.aspect, "framing": framing, "key": KEYS[a.key][1],
                        "model": MODELS[a.model], "refs": [str(r) for r in refs]}
    write_json(manifest_path, manifest)

    if a.slug:
        stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
        log = short_dir(a.slug) / "prompts.md"
        if not log.exists():
            log.write_text("# Picture prompts\n", encoding="utf-8")
        with log.open("a", encoding="utf-8") as f:
            f.write(f"\n## {a.name}\n- {stamp} · {MODELS[a.model]} · {a.size} · {a.aspect} · kind {a.kind} · "
                    f"refs: {', '.join(r.name for r in refs) or 'none'}\n\n```\n{full_prompt}\n```\n")
        prev_model = images.get("model")
        images["count"] = count + 1
        images["model"] = MODELS[a.model] if prev_model in (None, MODELS[a.model]) else "mixed"
        images["est_usd"] = round(float(images.get("est_usd") or 0) + est_usd(a.model, a.size), 2)
        meta["images"] = images
        write_meta(a.slug, meta)
        print(f"{out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}  "
              f"({images['count']}/{budget} pictures, about ${images['est_usd']:.2f})")
    else:
        print(out)


if __name__ == "__main__":
    main()
