#!/usr/bin/env python3
"""Check that the ElevenLabs plan has enough credits for this voice BEFORE any take is made.

  python voice_budget.py --slug SLUG [--scene N] [--model eleven_v4] [--margin 0.15] [--offline]

Counts the characters the voice step will send (script.md's lines exactly as written, audio tags included: ElevenLabs
bills every character of the text), times the model's credit rate (eleven_v4 = 1 credit per character; GET
/v1/models gives the live rate), plus a margin for retakes, and compares it with what is left on the plan this month
(GET /v1/user/subscription). --scene N checks one scene's take only.

  exit 0  enough credits (or the quota could not be read: then it prints the estimate only)
  exit 3  not enough: stop and report (upgrade the plan, wait for the monthly reset, or shorten the script)

A 20-30 s Short needs about 400 credits, a 2-3 minute video 2,000-3,000, an 8-10 minute long-midroll video
8,000-10,000. Writes voice.planned_chars and voice.planned_credits to meta.json. On your own computer the key is
ELEVENLABS_API_KEY from .env; in a cloud session on the yt-automate environment the key is added to requests to
api.elevenlabs.io automatically, so none is needed. The key is never printed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, die, load_env, read_meta, short_dir, write_meta

API = "https://api.elevenlabs.io/v1/"
FALLBACK_RATE = {"eleven_v4": 1.0, "eleven_v3": 1.0, "eleven_multilingual_v2": 1.0, "eleven_v4_turbo": 0.5,
                 "eleven_flash_v2_5": 0.5, "eleven_turbo_v2_5": 0.5}


def get(path: str):
    headers = {"Accept": "application/json"}
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:
        headers["xi-api-key"] = key
    with urllib.request.urlopen(urllib.request.Request(API + path, headers=headers), timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def takes(slug: str, scene: int | None) -> dict[int, str]:
    """{scene number (0 = a Short / one take): the text sent to ElevenLabs}."""
    from subtitles import parse_script
    script = short_dir(slug) / "script.md"
    if not script.exists():
        die(f"no script: {script.relative_to(ROOT)}")
    sections, _ = parse_script(script)
    out = {n: "\n".join(sec["lines"]) for n, sec in sorted(sections.items()) if sec["lines"]}
    if scene is not None:
        if scene not in out:
            die(f"script.md has no scene {scene} (scenes: {', '.join(map(str, out)) or 'none'})")
        out = {scene: out[scene]}
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--scene", type=int, help="only this scene's take")
    ap.add_argument("--model", default="eleven_v4")
    ap.add_argument("--margin", type=float, default=0.15, help="extra share for retakes (default 0.15)")
    ap.add_argument("--offline", action="store_true", help="do not ask ElevenLabs: print the estimate only")
    a = ap.parse_args()

    texts = takes(a.slug, a.scene)
    chars = sum(len(t) for t in texts.values())
    load_env()
    rate, quota = FALLBACK_RATE.get(a.model, 1.0), None
    if not a.offline:
        try:
            for m in get("models"):
                if m.get("model_id") == a.model:
                    rate = float((m.get("model_rates") or {}).get("character_cost_multiplier") or rate)
            quota = get("user/subscription")
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            code = getattr(e, "code", "")
            print(f"could not read the ElevenLabs quota ({'HTTP ' + str(code) if code else type(e).__name__}): "
                  f"estimate only. Without a key or connector access check the plan at elevenlabs.io.")
    need = math.ceil(chars * rate * (1 + a.margin))
    what = f"scene {a.scene}" if a.scene is not None else (f"{len(texts)} scene takes" if len(texts) > 1 else "one take")
    print(f"{a.slug}: {what}, {chars:,} characters x {rate:g} ({a.model}) + {a.margin:.0%} for retakes = {need:,} credits")

    meta = read_meta(a.slug)
    voice = dict(meta.get("voice") or {})
    if a.scene is None:
        voice["planned_chars"], voice["planned_credits"] = chars, need
        meta["voice"] = voice
        write_meta(a.slug, meta)

    if not quota:
        sys.exit(0)
    used, limit = int(quota.get("character_count") or 0), int(quota.get("character_limit") or 0)
    left = max(0, limit - used)
    reset = quota.get("next_character_count_reset_unix")
    when = dt.datetime.fromtimestamp(reset, dt.timezone.utc).strftime("%d %b") if reset else "the next reset"
    extend = bool(quota.get("can_extend_character_limit") or quota.get("allowed_to_extend_character_limit"))
    tier = quota.get("tier", "?")
    print(f"ElevenLabs {tier} plan: {left:,} of {limit:,} credits left until {when}"
          + (f" (about {left // need} like this)" if need else ""))
    if need > left:
        if extend:
            print(f"warning: needs {need - left:,} credits beyond the plan: they will be billed as usage-based extra")
            sys.exit(0)
        print(f"NOT ENOUGH: needs {need:,}, {left:,} left and this plan cannot go over. Upgrade the plan, wait until "
              f"{when}, or shorten the script. No take was made.")
        sys.exit(3)
    print("ok")


if __name__ == "__main__":
    main()
