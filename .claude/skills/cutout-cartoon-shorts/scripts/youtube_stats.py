#!/usr/bin/env python3
"""Refresh views, likes and comments of every published video from the YouTube Data API into its meta.json, and the
channel's subscriber count into data/youtube_channel.json, then rebuild data/shorts.json (register.py).

  python youtube_stats.py [--slug SLUG] [--dry-run]

For each shorts/*/meta.json with a YouTube URL or video id: stats.{views, likes, comments, updated},
youtube.published (when empty), duration_s (when empty), status "published", and one snapshot per day in
stats_history. The dashboard's history table and its Partner Program progress (Shorts views in the last 90 days)
come from these snapshots, so run it once a day; a scheduled task is fine. Cost: 1 quota unit per 50 videos + 1 for
the channel. Private and scheduled videos are not visible to an API key and are skipped until they are public.
Average view percentage and watch time need the YouTube Analytics API (OAuth): copy stats.avg_view_pct by hand from
YouTube Studio (Analytics > the video > Average percentage viewed); the watch-hours estimate uses it.
"""
from __future__ import annotations

import argparse
import datetime as dt
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, die, load_env, read_json, write_json
from yt_api import Client, YouTubeError, iso_seconds, video_id_from


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug", help="only this video")
    ap.add_argument("--dry-run", action="store_true", help="print the new numbers, write nothing")
    a = ap.parse_args()

    metas: dict[str, tuple[Path, dict]] = {}
    for p in sorted((ROOT / "shorts").glob("*/meta.json")):
        if a.slug and p.parent.name != a.slug:
            continue
        m = read_json(p, {}) or {}
        yt = m.get("youtube") or {}
        vid = yt.get("video_id") or video_id_from(yt.get("url", ""))
        if vid:
            metas[vid] = (p, m)
    if not metas:
        print("no video with a YouTube URL or video id in meta.json yet (upload.py --status fills them in)")
        return

    load_env()
    try:
        client = Client()
        items = {it["id"]: it for it in client.videos(list(metas), parts="snippet,statistics,contentDetails")}
        channel_ids = sorted({it["snippet"]["channelId"] for it in items.values()})
        channels = client.channels(channel_ids) if channel_ids else {}
    except YouTubeError as e:
        die(str(e), 2 if "not set" in str(e) else 1)

    today = dt.date.today().isoformat()
    for vid, (path, m) in metas.items():
        it = items.get(vid)
        slug = path.parent.name
        if not it:
            print(f"{slug}: {vid} is not public (private, scheduled or removed): skipped")
            continue
        st, sn = it.get("statistics", {}), it.get("snippet", {})
        stats = dict(m.get("stats") or {})
        new = {"views": int(st.get("viewCount") or 0), "likes": int(st.get("likeCount") or 0),
               "comments": int(st.get("commentCount") or 0)}
        print(f"{slug}: {stats.get('views', 0)} -> {new['views']} views, {new['likes']} likes, {new['comments']} comments")
        if a.dry_run:
            continue
        stats.update(new, updated=today)
        m["stats"] = stats
        yt = dict(m.get("youtube") or {})
        yt["video_id"] = vid
        yt.setdefault("url", "")
        yt["url"] = yt["url"] or f"https://www.youtube.com/watch?v={vid}"
        yt["published"] = yt.get("published") or sn.get("publishedAt", "")[:10]
        yt["status"] = "published"
        m["youtube"] = yt
        if not m.get("duration_s"):
            m["duration_s"] = iso_seconds(it.get("contentDetails", {}).get("duration")) or None
        m["status"] = "published"
        hist = [h for h in (m.get("stats_history") or []) if h.get("date") != today]
        hist.append({"date": today, **new, "avg_view_pct": stats.get("avg_view_pct")})
        m["stats_history"] = sorted(hist, key=lambda h: h.get("date", ""))
        write_json(path, m)

    if not a.dry_run and channels:
        write_json(ROOT / "data" / "youtube_channel.json", {"updated": today, "channels": [
            {"id": cid, "title": c.get("snippet", {}).get("title", ""),
             "subscribers": None if c.get("statistics", {}).get("hiddenSubscriberCount")
             else int(c.get("statistics", {}).get("subscriberCount") or 0),
             "views": int(c.get("statistics", {}).get("viewCount") or 0),
             "videos": int(c.get("statistics", {}).get("videoCount") or 0)} for cid, c in channels.items()]})
    print(f"{len(items)} of {len(metas)} videos refreshed ({client.units} quota units)")
    if not a.dry_run:
        subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "register.py")], check=False)


if __name__ == "__main__":
    main()
