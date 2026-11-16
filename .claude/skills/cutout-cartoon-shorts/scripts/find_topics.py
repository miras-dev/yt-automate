#!/usr/bin/env python3
"""Find outlier videos (far more views than their channel usually gets) as a TOPIC signal, and check a planned title
for lookalikes. Other channels' videos only show what people want to watch right now: never copy their titles,
thumbnails, scripts or transcripts (CLAUDE.md, originality).

  python find_topics.py --query "why don't we" --query "what would happen if" [--for short|long-horizontal|long-midroll]
        [--days 365] [--order viewCount|relevance|date] [--region US] [--lang en] [--per-query 50] [--min-x 3]
        [--min-views 20000] [--top 25] [--out FILE] [--sheet PNG]
  python find_topics.py --similar "Why don't we throw trash into volcanoes?" [--for short] [--out FILE] [--sheet PNG]
  python find_topics.py --from-json FILE [--for ...] [--min-x 3] [--top 25]   # re-score a saved run: no key, no quota

Outlier score x = a video's views / the average views of the channel's OTHER videos (lifetime: channel views minus
this video, over its other uploads). x 3 or more means the topic or the title pulled far beyond that channel's usual
audience: that is the signal worth a new angle of our own. Also shown: views per day since upload, channel size.
--for filters by length: short = 3:00 or less (Shorts can be up to 3:00; a 16:9 video that short is not a Short, so
treat it as a hint), long-horizontal = 1:00-4:00, long-midroll = 7:00-20:00.
--similar searches the planned title and lists the closest existing videos. A near-identical title (similarity 0.75
or more) on a video with 100,000+ views means: change the angle or the wording (exit code 4).
--sheet saves the top thumbnails as one picture (downloads from i.ytimg.com), to check that our mascot and our
thumbnail idea look like none of them.

Quota: 100 units per query (search) + 1 unit per 50 videos and per 50 channels; a project has 10,000 units a day.
Output: a table, and JSON (default work/topics/<date>-<query>.json; work/ is not committed). YOUTUBE_API_KEY comes
from .env or the environment. Exit codes: 0 ok, 1 error, 2 no key, 4 lookalike found.
"""
from __future__ import annotations

import argparse
import datetime as dt
import difflib
import io
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, die, load_env, read_json, write_json
from yt_api import Client, YouTubeError, clock, iso_seconds, parse_time

# --for: (min seconds, max seconds, YouTube search videoDuration: short = under 4 min, medium = 4-20 min)
LENGTHS = {"short": (1, 180, "short"), "long-horizontal": (60, 240, "short"), "long-midroll": (420, 1200, "medium")}
LOOKALIKE_SIM = 0.75
POPULAR_VIEWS = 100_000
STOP = set("""a an the of to in on at for and or but is are was were be been it its this that these those with as by
from we you i he she they them our your my his her their do does did why what how when where who which if than then so
not no can could would should will just about into out up down over vs there here all any""".split())


def rows_from(videos: list[dict], channels: dict[str, dict]) -> list[dict]:
    now = dt.datetime.now(dt.timezone.utc)
    rows = []
    for v in videos:
        sn, st, cd = v.get("snippet", {}), v.get("statistics", {}), v.get("contentDetails", {})
        cst = (channels.get(sn.get("channelId", "")) or {}).get("statistics", {})
        views = int(st.get("viewCount") or 0)
        ch_views, ch_videos = int(cst.get("viewCount") or 0), int(cst.get("videoCount") or 0)
        subs = None if cst.get("hiddenSubscriberCount") or "subscriberCount" not in cst else int(cst["subscriberCount"])
        others = (max(ch_views - views, 0) / (ch_videos - 1)) if ch_videos > 1 else 0
        published = sn.get("publishedAt", "")
        age = max(1, (now - parse_time(published)).days) if published else None
        thumbs = sn.get("thumbnails", {})
        rows.append({
            "id": v.get("id", ""), "url": f"https://www.youtube.com/watch?v={v.get('id', '')}",
            "title": sn.get("title", ""), "channel": sn.get("channelTitle", ""), "channel_id": sn.get("channelId", ""),
            "published": published[:10], "age_days": age, "duration_s": iso_seconds(cd.get("duration")),
            "views": views, "likes": int(st["likeCount"]) if "likeCount" in st else None,
            "comments": int(st["commentCount"]) if "commentCount" in st else None,
            "channel_subs": subs, "channel_videos": ch_videos, "channel_avg_views": round(others),
            "x_channel": round(views / others, 1) if others >= 1 else None,
            "views_per_day": round(views / age) if age else None,
            "thumbnail": (thumbs.get("medium") or thumbs.get("high") or thumbs.get("default") or {}).get("url", ""),
        })
    return rows


def keep(rows: list[dict], fmt: str | None, min_views: int) -> list[dict]:
    lo, hi = (LENGTHS[fmt][0], LENGTHS[fmt][1]) if fmt else (0, 10 ** 9)
    seen, out = set(), []
    for r in rows:
        if r["id"] in seen or r["views"] < min_views or not (lo <= r["duration_s"] <= hi):
            continue
        seen.add(r["id"])
        out.append(r)
    return out


def words(t: str) -> list[str]:
    return re.sub(r"[^a-z0-9 ]+", " ", t.lower().replace("'", "").replace("’", "")).split()


def stem(w: str) -> str:
    """A rough stem so 'volcanoes' / 'volcano' and 'throwing' / 'throw' count as the same word."""
    for suf in ("ing", "es", "ed", "s"):
        if len(w) > len(suf) + 3 and w.endswith(suf):
            return w[: -len(suf)]
    return w


def similarity(a: str, b: str) -> float:
    wa, wb = words(a), words(b)
    seq = difflib.SequenceMatcher(None, " ".join(wa), " ".join(wb)).ratio()
    ca, cb = {stem(w) for w in wa if w not in STOP}, {stem(w) for w in wb if w not in STOP}
    jac = len(ca & cb) / len(ca | cb) if ca | cb else 0.0
    return round(max(seq, jac), 2)


def short_num(n: int | None) -> str:
    if n is None:
        return "?"
    for div, suf in ((1e9, "B"), (1e6, "M"), (1e3, "K")):
        if n >= div:
            return f"{n / div:.1f}".rstrip("0").rstrip(".") + suf
    return str(n)


def print_table(rows: list[dict], top: int, sim: bool = False) -> None:
    head = " sim " if sim else "    x"
    print(f"{head}   views   /day   age   len  channel (subs)              title")
    for r in rows[:top]:
        lead = f"{r['sim']:>5.2f}" if sim else (f"{r['x_channel']:>5.1f}" if r["x_channel"] is not None else "    -")
        ch = f"{r['channel'][:18]} ({short_num(r['channel_subs'])})"
        print(f"{lead} {short_num(r['views']):>7} {short_num(r['views_per_day']):>6} {str(r['age_days'] or '?'):>4}d "
              f"{clock(r['duration_s']):>5}  {ch:<26}  {r['title'][:70]}")


def contact_sheet(rows: list[dict], out: Path, cols: int = 5) -> int:
    """The top thumbnails in one picture, each with its title. Returns how many could be downloaded."""
    from PIL import Image, ImageDraw, ImageFont
    cells = []
    for r in rows:
        if not r.get("thumbnail"):
            continue
        try:
            req = urllib.request.Request(r["thumbnail"], headers={"User-Agent": "shorts-factory/1.0"})
            with urllib.request.urlopen(req, timeout=20) as f:
                cells.append((Image.open(io.BytesIO(f.read())).convert("RGB").resize((320, 180)), r))
        except Exception:  # noqa: BLE001 - a missing thumbnail only leaves a gap
            continue
    if not cells:
        return 0
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
    w, h = 320, 180 + 40
    rows_n = (len(cells) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows_n * h + (rows_n + 1) * 8), "#1b1d22")
    d = ImageDraw.Draw(sheet)
    for i, (img, r) in enumerate(cells):
        x, y = 8 + (i % cols) * (w + 8), 8 + (i // cols) * (h + 8)
        sheet.paste(img, (x, y))
        caption = f"{short_num(r['views'])} · {r['title']}"
        d.text((x + 2, y + 184), caption[:46], fill="#e8e8e8", font=font)
        d.text((x + 2, y + 200), caption[46:92], fill="#e8e8e8", font=font)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    return len(cells)


def default_out(label: str) -> Path:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")[:40] or "run"
    return ROOT / "work" / "topics" / f"{dt.date.today().isoformat()}-{slug}.json"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--query", action="append", default=[], help="a search; repeat for several (100 units each)")
    ap.add_argument("--similar", help="a planned title: list the closest existing videos (lookalike check)")
    ap.add_argument("--from-json", help="re-score a JSON this script saved earlier (no API calls)")
    ap.add_argument("--for", dest="fmt", choices=list(LENGTHS), help="keep only videos of this format's length")
    ap.add_argument("--days", type=int, default=365, help="only videos uploaded in the last N days (0 = any)")
    ap.add_argument("--order", choices=["viewCount", "relevance", "date"], default="viewCount")
    ap.add_argument("--region", default="", help="regionCode, e.g. US (default: none)")
    ap.add_argument("--lang", default="en", help="relevanceLanguage (default en)")
    ap.add_argument("--per-query", type=int, default=50, help="search results per query, at most 50")
    ap.add_argument("--min-x", type=float, default=3.0, help="outlier threshold (views / channel average)")
    ap.add_argument("--min-views", type=int, default=20_000)
    ap.add_argument("--top", type=int, default=25)
    ap.add_argument("--out", help="JSON output (default work/topics/<date>-<query>.json)")
    ap.add_argument("--sheet", help="also save a contact sheet of the top thumbnails to this PNG")
    a = ap.parse_args()
    if not (a.query or a.similar or a.from_json):
        ap.error("pass --query (one or more), --similar TITLE or --from-json FILE")

    load_env()
    raw: dict = {"videos": [], "channels": {}}
    units = 0
    mode = "similar" if a.similar else "outliers"
    if a.from_json:
        saved = read_json(Path(a.from_json), None)
        if not saved or "raw" not in saved:
            die(f"{a.from_json} is not a JSON this script saved (no 'raw' part)")
        raw, mode = saved["raw"], saved.get("mode", mode)
        a.similar = a.similar or saved.get("similar")
        queries = saved.get("queries", [])
    else:
        try:
            client = Client()
        except YouTubeError as e:
            die(str(e), 2)
        queries = [a.similar] if a.similar else a.query
        ids: list[str] = []
        try:
            for q in queries:
                after = None
                if a.days and not a.similar:
                    after = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=a.days)).strftime("%Y-%m-%dT%H:%M:%SZ")
                res = client.get("search", part="snippet", q=q, type="video",
                                 order="relevance" if a.similar else a.order,
                                 maxResults=25 if a.similar else max(1, min(50, a.per_query)), publishedAfter=after,
                                 videoDuration=LENGTHS[a.fmt][2] if a.fmt else None, regionCode=a.region,
                                 relevanceLanguage=a.lang)
                ids += [it["id"]["videoId"] for it in res.get("items", []) if it.get("id", {}).get("videoId")]
            ids = list(dict.fromkeys(ids))
            raw["videos"] = client.videos(ids)
            chans = client.channels([v["snippet"]["channelId"] for v in raw["videos"] if v.get("snippet")])
            raw["channels"] = {k: {"statistics": v.get("statistics", {})} for k, v in chans.items()}
        except YouTubeError as e:
            die(str(e))
        units = client.units

    rows = rows_from(raw["videos"], raw["channels"])
    status = 0
    if mode == "similar":
        rows = keep(rows, a.fmt, 0)
        for r in rows:
            r["sim"] = similarity(a.similar, r["title"])
        rows.sort(key=lambda r: (r["sim"], r["views"]), reverse=True)
        print(f'Closest existing videos to: "{a.similar}"')
        print_table(rows, a.top, sim=True)
        hits = [r for r in rows if r["sim"] >= LOOKALIKE_SIM]
        popular = [r for r in hits if r["views"] >= POPULAR_VIEWS]
        if popular:
            r = popular[0]
            print(f"\nLOOKALIKE: \"{r['title']}\" ({short_num(r['views'])} views, similarity {r['sim']}) - change the "
                  f"angle or the wording so ours is clearly a different video")
            status = 4
        elif hits:
            print(f"\nclose titles exist ({len(hits)}) but none with {short_num(POPULAR_VIEWS)}+ views: fine, keep ours distinct")
        else:
            print(f"\nno close title (all under {LOOKALIKE_SIM} similarity): ok")
    else:
        rows = keep(rows, a.fmt, a.min_views)
        rows.sort(key=lambda r: (r["x_channel"] is not None, r["x_channel"] or 0, r["views"]), reverse=True)
        outliers = [r for r in rows if (r["x_channel"] or 0) >= a.min_x]
        print(f"{len(rows)} videos for {', '.join(repr(q) for q in queries)}; {len(outliers)} outliers (x >= {a.min_x:g})")
        print_table(outliers or rows, a.top)

    if not a.from_json:
        out = Path(a.out) if a.out else default_out(queries[0] if queries else "run")
        write_json(out, {"generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "mode": mode,
                         "queries": queries, "similar": a.similar, "for": a.fmt, "days": a.days, "units": units,
                         "rows": rows, "raw": raw})
        print(f"\n{out.relative_to(ROOT) if out.is_relative_to(ROOT) else out} ({units} quota units used)")
    if a.sheet:
        n = contact_sheet(rows[:a.top], Path(a.sheet))
        print(f"{a.sheet}: {n} thumbnails" if n else "no thumbnails could be downloaded (i.ytimg.com unreachable?)")
    sys.exit(status)


if __name__ == "__main__":
    main()
