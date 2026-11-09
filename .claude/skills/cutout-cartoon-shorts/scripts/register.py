#!/usr/bin/env python3
"""Rebuild data/shorts.json (the index the dashboard reads) from every shorts/*/meta.json.

  python scripts/register.py [--check]

Run it after any change to a meta.json. It fills in defaults (format, aspect, date from the folder name), records
which files exist, and prints warnings: unknown status, a length that breaks the format rule (a vertical video must
stay under 3:00, a horizontal one must run past it), a topic missing from data/topics.json.
--check exits with code 1 when there are warnings.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DEFAULT_BUDGET, FORMATS, ROOT, STATUSES, read_json, write_json

DOCS = ["script.md", "sources.md", "beats.md", "prompts.md", "credits.txt"]


def normalise(folder: Path, meta: dict, warn) -> dict:
    slug = folder.name
    m = dict(meta)
    if m.get("slug") and m["slug"] != slug:
        warn(f"{slug}: meta.json slug {m['slug']!r} differs from the folder name; using the folder name")
    m["slug"] = slug
    d = re.match(r"(\d{4}-\d{2}-\d{2})-", slug)
    m.setdefault("date", d.group(1) if d else "")
    m.setdefault("title", slug)
    m.setdefault("category", "uncategorised")
    m.setdefault("topic", m["title"])
    fmt = m.setdefault("format", "short")
    if fmt not in FORMATS:
        warn(f"{slug}: unknown format {fmt!r} (use {', '.join(FORMATS)})")
        fmt = "short"
    m.setdefault("aspect", FORMATS[fmt]["aspect"])
    m.setdefault("image_budget", DEFAULT_BUDGET[fmt])
    if m.setdefault("status", "idea") not in STATUSES:
        warn(f"{slug}: unknown status {m['status']!r} (use {' -> '.join(STATUSES)})")
    m.setdefault("duration_s", None)
    m.setdefault("word_count", None)
    m["voice"] = {"name": "", "id": "", "credits": 0, **(m.get("voice") or {})}
    m["images"] = {"model": "", "count": 0, "est_usd": 0, **(m.get("images") or {})}
    m.setdefault("sounds", [])
    m["files"] = dict(m.get("files") or {})
    m["youtube"] = {"url": "", "video_id": "", "published": "", **(m.get("youtube") or {})}
    m["stats"] = {"views": 0, "likes": 0, "comments": 0, "avg_view_pct": None, "updated": "", **(m.get("stats") or {})}
    m.setdefault("stats_history", [])

    yt = m["youtube"]
    if yt["url"] and not yt["video_id"]:
        g = re.search(r"(?:shorts/|v=|youtu\.be/)([A-Za-z0-9_-]{6,})", yt["url"])
        if g:
            yt["video_id"] = g.group(1)

    # what exists on this machine (renders are gitignored, so "false" is normal on another computer)
    files = m["files"]
    for name, default in (("contact", f"shorts/{slug}/qa/contact.png"), ("thumb", f"shorts/{slug}/qa/frame0.png"),
                          ("render", f"out/{slug}-4K.mp4")):
        if not files.get(name) and (ROOT / default).exists():
            files[name] = default
    m["has"] = {doc.split(".")[0]: (folder / doc).exists() for doc in DOCS}
    m["has"]["render"] = bool(files.get("render")) and (ROOT / files["render"]).exists()
    m["has"]["contact"] = bool(files.get("contact")) and (ROOT / files["contact"]).exists()
    m["cost_usd"] = round(float(m["images"].get("est_usd") or 0) + float(m.get("other_cost_usd") or 0), 2)

    dur = m.get("duration_s")
    if dur and STATUSES.index(m["status"]) >= STATUSES.index("rendered") if m["status"] in STATUSES else False:
        lim = FORMATS[fmt]
        if fmt == "long-vertical" and dur >= 180:
            warn(f"{slug}: {dur} s - a vertical video must stay UNDER 3:00 to be treated as a Short")
        elif fmt == "long-horizontal" and dur <= 180:
            warn(f"{slug}: {dur} s - a horizontal video should run PAST 3:00 (aim for 3:05-3:30)")
        elif not (lim["min_s"] - 2 <= dur <= lim["max_s"] + 2):
            warn(f"{slug}: {dur} s is outside the usual {lim['min_s']}-{lim['max_s']} s for format {fmt}")
    return m


def totals(shorts: list[dict]) -> dict:
    views = sum(int(s["stats"].get("views") or 0) for s in shorts)
    by_cat: dict[str, list[int]] = {}
    for s in shorts:
        if s["status"] == "published":
            by_cat.setdefault(s["category"], []).append(int(s["stats"].get("views") or 0))
    best = max(by_cat.items(), key=lambda kv: sum(kv[1]) / len(kv[1]), default=(None, []))[0]
    published = sum(1 for s in shorts if s["status"] == "published")
    return {"count": len(shorts), "published": published,
            "spend_usd": round(sum(s["cost_usd"] for s in shorts), 2), "views": views,
            "avg_views": round(views / published) if published else 0, "best_category": best}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    warnings: list[str] = []
    shorts = []
    for meta_path in sorted((ROOT / "shorts").glob("*/meta.json")):
        try:
            meta = read_json(meta_path, {})
        except ValueError as e:
            warnings.append(f"{meta_path.parent.name}: meta.json is not valid JSON ({e})")
            continue
        shorts.append(normalise(meta_path.parent, meta, warnings.append))
    shorts.sort(key=lambda s: (s["date"], s["slug"]), reverse=True)

    topics = read_json(ROOT / "data" / "topics.json", []) or []
    known = {t.get("slug") for t in topics}
    for s in shorts:
        if s["slug"] not in known:
            warnings.append(f"{s['slug']}: not in data/topics.json (the topic could be picked again)")

    write_json(ROOT / "data" / "shorts.json", {
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totals": totals(shorts), "shorts": shorts})
    print(f"data/shorts.json: {len(shorts)} videos")
    for w in warnings:
        print("warning:", w)
    sys.exit(1 if a.check and warnings else 0)


if __name__ == "__main__":
    main()
