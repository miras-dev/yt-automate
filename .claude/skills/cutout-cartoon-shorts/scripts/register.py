#!/usr/bin/env python3
"""Rebuild data/shorts.json (the index the dashboard reads) from every shorts/*/meta.json.

  python scripts/register.py [--check]

Run it after any change to a meta.json. It fills in defaults (format, aspect, date from the folder name), records
which files exist, and prints warnings: unknown status, a length outside the format's range (a Short 20-30 s, a
16:9 long-horizontal video 1:00-3:30, a long-midroll video 8:00-12:00, and a long-midroll render under 8:00 gets no
mid-roll ads), a video over one minute that is still being made in 9:16 (long-vertical is retired: anything over a
minute is 16:9), a long video without subtitles.json, a video past the script stage without packaging.md (title and
thumbnail come first), a topic missing from data/topics.json.
--check exits with code 1 when there are warnings.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DEFAULT_BUDGET, FORMATS, MIDROLL_MIN_S, ROOT, STATUSES, read_json, write_json

DOCS = ["packaging.md", "script.md", "sources.md", "beats.md", "prompts.md", "credits.txt"]


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
    # youtube: filled by upload.py (post_id, status, scheduled_for) and youtube_stats.py, or by hand after an upload
    m["youtube"] = {"url": "", "video_id": "", "published": "", "status": "", "post_id": "", "scheduled_for": "",
                    **(m.get("youtube") or {})}
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
                          ("thumbnail", f"shorts/{slug}/qa/thumbnail.jpg"), ("thumbnail", f"shorts/{slug}/qa/thumbnail.png"),
                          ("render", f"out/{slug}-4K.mp4")):
        if not files.get(name) and (ROOT / default).exists():
            files[name] = default
    m["has"] = {doc.split(".")[0]: (folder / doc).exists() for doc in DOCS}
    m["has"]["render"] = bool(files.get("render")) and (ROOT / files["render"]).exists()
    m["has"]["contact"] = bool(files.get("contact")) and (ROOT / files["contact"]).exists()
    src = ROOT / "video" / "src" / slug
    m["has"]["subtitles"] = src.is_dir() and any(src.rglob("subtitles.json"))
    m["cost_usd"] = round(float(m["images"].get("est_usd") or 0) + float(m.get("other_cost_usd") or 0), 2)

    stage = STATUSES.index(m["status"]) if m["status"] in STATUSES else 0
    lim = FORMATS[fmt]
    if lim.get("retired") and stage < STATUSES.index("rendered"):
        warn(f"{slug}: format {fmt} is retired - anything over one minute is made 16:9: set format "
             f"\"long-horizontal\" or \"long-midroll\" (aspect 16:9) before the pictures and layout are made")
    if lim.get("subtitles") and STATUSES.index("qa") <= stage < STATUSES.index("published") and not m["has"]["subtitles"]:
        warn(f"{slug}: long videos show subtitles, but video/src/{slug}/ has no subtitles.json (run subtitles.py)")
    if STATUSES.index("voice") <= stage and not m["has"]["packaging"] and not m.get("packaging_skipped"):
        warn(f"{slug}: no packaging.md - title and thumbnail come before the script (short-script skill, section 1.2)")
    dur = m.get("duration_s")
    if dur and stage >= STATUSES.index("rendered"):
        if fmt == "long-vertical" and dur >= 180:
            warn(f"{slug}: {dur} s - a vertical video must stay UNDER 3:00 to be treated as a Short")
        elif lim.get("midroll") and dur < MIDROLL_MIN_S:
            warn(f"{slug}: {dur} s is under {MIDROLL_MIN_S // 60}:00 - YouTube shows no mid-roll ads on it; lengthen "
                 f"a scene or make it long-horizontal")
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
            "avg_views": round(views / published) if published else 0, "best_category": best,
            "ypp": partner_progress(shorts)}


# YouTube Partner Program (ad revenue): 1,000 subscribers plus 10M public Shorts views in 90 days OR 4,000 public
# watch hours of long videos in 12 months. From 1 Feb 2027 new applicants need twice the views or hours (reported by
# Tubefilter, 10 Aug 2026; channels already in the programme keep their place). Check YouTube's own page.
YPP_TARGETS = {
    "now": {"subscribers": 1000, "shorts_views_90d": 10_000_000, "watch_hours_365d": 4000},
    "from_2027_02_01": {"subscribers": 1000, "shorts_views_90d": 20_000_000, "watch_hours_365d": 8000},
}


def views_since(s: dict, cutoff: dt.date) -> tuple[int, bool]:
    """Views a published video gained after `cutoff`, from its daily snapshots (youtube_stats.py): (views, exact)."""
    now_views = int(s["stats"].get("views") or 0)
    try:
        pub = dt.date.fromisoformat((s["youtube"].get("published") or s.get("date") or "")[:10])
    except ValueError:
        pub = None
    if pub and pub >= cutoff:
        return now_views, True
    before = sorted((h for h in s.get("stats_history") or []
                     if (h.get("date") or "")[:10] <= cutoff.isoformat() and h.get("views") is not None),
                    key=lambda h: h["date"])
    if before:
        return max(0, now_views - int(before[-1]["views"])), True
    return now_views, False  # older than the window with no snapshot from back then: an upper bound


def partner_progress(shorts: list[dict]) -> dict:
    today = dt.date.today()
    pub = [s for s in shorts if s["status"] == "published"]
    shorts_views, shorts_exact = 0, True
    hours, hours_exact, no_pct = 0.0, True, 0
    for s in pub:
        aspect = FORMATS.get(s["format"], FORMATS["short"])["aspect"]
        if aspect == "9:16":  # vertical videos of 3:00 or less are Shorts
            v, ok = views_since(s, today - dt.timedelta(days=90))
            shorts_views += v
            shorts_exact &= ok
        else:  # long videos: watch hours = views x length x average share viewed
            v, ok = views_since(s, today - dt.timedelta(days=365))
            pct, dur = s["stats"].get("avg_view_pct"), s.get("duration_s")
            if pct is None or not dur:
                no_pct += v > 0
                continue
            hours += v * float(dur) * float(pct) / 100 / 3600
            hours_exact &= ok
    channel = read_json(ROOT / "data" / "youtube_channel.json", {}) or {}
    subs = [c.get("subscribers") for c in channel.get("channels", []) if c.get("subscribers") is not None]
    return {"subscribers": sum(subs) if subs else None, "channel_updated": channel.get("updated", ""),
            "shorts_views_90d": shorts_views, "shorts_views_exact": shorts_exact,
            "watch_hours_365d": round(hours, 1), "watch_hours_exact": hours_exact and not no_pct,
            "long_videos_without_avg_view_pct": no_pct, "targets": YPP_TARGETS}


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
