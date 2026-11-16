#!/usr/bin/env python3
"""Publish a finished video to YouTube through Zernio (Part 6), or check what Zernio did with it.

  python upload.py --slug SLUG --dry-run                  # build and show everything, upload nothing
  python upload.py --slug SLUG --when "2026-11-20 17:30" [--tz America/New_York] [--visibility public|unlisted|private]
  python upload.py --slug SLUG --now [--visibility ...]   # publish right away
  python upload.py --slug SLUG --status                   # fetch the YouTube URL and status into meta.json
  python upload.py --accounts                             # list connected accounts (the YouTube account's _id)

Why Zernio: uploads through your own Google API project stay locked as private until YouTube audits that project;
Zernio's app is already approved, and it is free for up to 2 connected accounts. Key: ZERNIO_API_KEY in .env (from
zernio.com, Settings > API keys), never printed. API as in Zernio's official SDK (zernio-sdk 1.4): POST
/v1/media/presign + PUT the file, then POST /v1/posts with the YouTube settings; GET /v1/posts/{id} for the result.

What it sends: the 4K render (meta.json files.render, else out/<slug>-4K.mp4), the thumbnail (files.thumbnail, from
thumbnail.py; YouTube takes custom thumbnails on Shorts too), the title from packaging.md (else meta.json), and a
description built from packaging.md "Description:", sources.md links and credits.txt (CC-BY credits are required).
The description is also written to shorts/<slug>/description.txt (the dashboard's copy button uses it). Settings
come from data/channel.json "upload": made_for_kids and contains_synthetic_media must be set to true or false by a
person first (it refuses to upload while either is null). It refuses a second upload of the same video
(youtube.post_id set) unless --force.
For long-midroll videos it suggests mid-roll ad breaks at scene joins (meta.json ad_breaks): YouTube places them
automatically, or set them by hand in YouTube Studio (Editor > Ad breaks); the API cannot set them.
Exit codes: 0 ok, 1 error, 2 a setting or key is missing.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (FORMATS, MIDROLL_MIN_S, ROOT, die, load_env, read_channel, read_meta, read_packaging, short_dir,
                    write_meta)

API = os.environ.get("ZERNIO_API_BASE", "https://zernio.com/api")  # override only to test against a mock


def api(method: str, path: str, body: dict | None = None) -> dict:
    key = os.environ.get("ZERNIO_API_KEY") or os.environ.get("LATE_API_KEY")
    if not key:
        die("ZERNIO_API_KEY is not set: create a key at zernio.com (Settings > API keys) and put it in .env", 2)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Accept": "application/json",
        "User-Agent": "shorts-factory/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8", "replace")
        try:
            j = json.loads(text)
            msg = j.get("error") or j.get("message") or text
            msg = msg.get("message", msg) if isinstance(msg, dict) else msg
        except ValueError:
            msg = text
        die(f"Zernio {method} {path}: HTTP {e.code} {str(msg)[:400]}")
    except urllib.error.URLError as e:
        die(f"Zernio {method} {path}: {e.reason}")
    return {}


def put_file(path: Path, content_type: str) -> str:
    """Upload one file through a presigned URL; returns its public URL for the post."""
    size = path.stat().st_size
    pre = api("POST", "/v1/media/presign", {"filename": path.name, "contentType": content_type, "size": size})
    upload_url, public_url = pre.get("uploadUrl"), pre.get("publicUrl")
    if not upload_url or not public_url:
        die(f"Zernio presign gave no uploadUrl/publicUrl: {json.dumps(pre)[:300]}")
    print(f"uploading {path.name} ({size / 1e6:.1f} MB)...")
    with path.open("rb") as f:
        req = urllib.request.Request(upload_url, data=f, method="PUT",
                                     headers={"Content-Type": content_type, "Content-Length": str(size)})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                r.read()
        except urllib.error.HTTPError as e:
            die(f"upload of {path.name} failed: HTTP {e.code} {e.read().decode('utf-8', 'replace')[:300]}")
    return public_url


def clean(text: str) -> str:
    """YouTube refuses < and > in titles and descriptions."""
    return text.replace("<", "‹").replace(">", "›")


def description(slug: str, pk: dict, meta: dict) -> str:
    d = short_dir(slug)
    hook = pk.get("description", "").strip()
    if not hook and (d / "script.md").exists():
        m = re.search(r"^Idea:\s*(.+)$", (d / "script.md").read_text(encoding="utf-8"), re.M)
        hook = m.group(1).strip() if m else ""
    parts = [hook or meta.get("title", "")]
    if (d / "sources.md").exists():
        links = []
        for line in (d / "sources.md").read_text(encoding="utf-8").splitlines():
            url = re.search(r"https?://[^\s<>\"]+", line)
            if url:
                link = url.group(0).rstrip(").,];:'")
                label = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", line).replace(url.group(0), "").replace("<>", "")
                label = label.strip(" -*:;·|()[]<>")
                links.append(f"- {label[:90] + ': ' if label else ''}{link}")
        if links:
            parts.append("Sources:\n" + "\n".join(links[:12]))
    if (d / "credits.txt").exists():
        credits = (d / "credits.txt").read_text(encoding="utf-8").strip()
        if credits:
            parts.append("Sound:\n" + credits)
    return clean("\n\n".join(p for p in parts if p))[:5000]


def ad_breaks(meta: dict) -> list[float]:
    """Mid-roll suggestions at scene joins: after the first minute, at least 2 minutes apart, not in the last minute."""
    durs = [float(x) for x in ((meta.get("scenes") or {}).get("durations") or []) if x]
    total = float(meta.get("duration_s") or sum(durs) or 0)
    out, t, last = [], 0.0, 0.0
    for dur in durs[:-1]:
        t += dur
        if t >= 60 and t - last >= 120 and t <= total - 60:
            out.append(round(t, 1))
            last = t
    return out


def clock(t: float) -> str:
    return f"{int(t // 60)}:{int(round(t % 60)):02d}"


def save_status(slug: str, post: dict) -> dict:
    """Copy the YouTube target's state from a Zernio post into meta.json."""
    meta = read_meta(slug)
    yt = dict(meta.get("youtube") or {})
    target = next((p for p in post.get("platforms") or [] if p.get("platform") == "youtube"), {})
    yt["post_id"] = post.get("_id") or yt.get("post_id", "")
    yt["status"] = target.get("status") or post.get("status") or yt.get("status", "")
    if post.get("scheduledFor"):
        yt["scheduled_for"] = post["scheduledFor"]
    if target.get("platformPostId"):
        yt["video_id"] = target["platformPostId"]
    if target.get("platformPostUrl"):
        yt["url"] = target["platformPostUrl"]
    elif yt.get("video_id") and not yt.get("url"):
        yt["url"] = f"https://www.youtube.com/watch?v={yt['video_id']}"
    if yt["status"] == "published":
        yt["published"] = yt.get("published") or (target.get("publishedAt") or dt.date.today().isoformat())[:10]
        meta["status"] = "published"
    if target.get("errorMessage") or target.get("error"):
        yt["error"] = str(target.get("errorMessage") or target.get("error"))[:300]
    meta["youtube"] = yt
    write_meta(slug, meta)
    return yt


def register() -> None:
    subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "register.py")], check=False)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--when", help='publish time, e.g. "2026-11-20 17:30" (local time in --tz)')
    ap.add_argument("--tz", help="IANA time zone for --when (default: data/channel.json upload.timezone, else UTC)")
    ap.add_argument("--now", action="store_true", help="publish as soon as YouTube has processed it")
    ap.add_argument("--visibility", choices=["public", "unlisted", "private"])
    ap.add_argument("--title", help="override the title")
    ap.add_argument("--video", help="override the MP4")
    ap.add_argument("--thumbnail", help="override the thumbnail (JPG/PNG under 2 MB)")
    ap.add_argument("--first-comment", help="post this as the first comment")
    ap.add_argument("--account", help="Zernio account _id (default: data/channel.json upload.zernio_account_id)")
    ap.add_argument("--status", action="store_true", help="fetch the post's state from Zernio into meta.json")
    ap.add_argument("--accounts", action="store_true", help="list the accounts connected in Zernio")
    ap.add_argument("--force", action="store_true", help="upload again although youtube.post_id is set")
    a = ap.parse_args()
    load_env()

    if a.accounts:
        for acc in api("GET", "/v1/accounts").get("accounts", []):
            print(f"{acc.get('_id')}  {acc.get('platform'):<14} {acc.get('displayName') or acc.get('username') or ''}")
        return
    if not a.slug:
        ap.error("--slug is required")
    d = short_dir(a.slug)
    if not (d / "meta.json").exists():
        die(f"no shorts/{a.slug}/meta.json")
    meta = read_meta(a.slug)

    if a.status:
        post_id = (meta.get("youtube") or {}).get("post_id")
        if not post_id:
            die("this video has no youtube.post_id yet: upload it first")
        res = api("GET", f"/v1/posts/{post_id}")
        yt = save_status(a.slug, res.get("post") or res)
        print(json.dumps({k: yt.get(k) for k in ("status", "url", "video_id", "scheduled_for", "published", "error")
                          if yt.get(k)}, indent=2))
        register()
        return

    channel = read_channel()
    up = channel.get("upload") or {}
    fmt = meta.get("format", "short")
    spec = FORMATS.get(fmt, FORMATS["short"])
    pk = read_packaging(a.slug)
    title = clean((a.title or pk.get("title") or meta.get("title") or "").strip())
    problems, warnings = [], []
    if not title:
        problems.append("no title (packaging.md 'Title:' or meta.json title)")
    if len(title) > 100:
        problems.append(f"the title has {len(title)} characters; YouTube allows 100")
    limit = ((channel.get("packaging") or {}).get("title_max_chars") or {}).get(fmt)
    if limit and len(title) > int(limit):
        warnings.append(f"the title has {len(title)} characters; over {limit} it is cut off on phones")
    video = Path(a.video) if a.video else ROOT / ((meta.get("files") or {}).get("render") or f"out/{a.slug}-4K.mp4")
    if not video.exists():
        problems.append(f"no render at {video.relative_to(ROOT) if video.is_relative_to(ROOT) else video}")
    thumb_rel = a.thumbnail or (meta.get("files") or {}).get("thumbnail")
    thumb = (Path(a.thumbnail) if a.thumbnail else ROOT / thumb_rel) if thumb_rel else None
    if thumb and not thumb.exists():
        warnings.append(f"thumbnail {thumb_rel} not found: YouTube picks a frame")
        thumb = None
    if thumb is None and spec["aspect"] == "16:9":
        warnings.append("no thumbnail: make one with thumbnail.py (long videos live on their thumbnail)")
    if thumb and thumb.stat().st_size > 2_000_000:
        problems.append(f"thumbnail {thumb.name} is over 2 MB")
    dur = meta.get("duration_s")
    if spec.get("midroll") and dur and float(dur) < MIDROLL_MIN_S:
        warnings.append(f"{dur} s is under {MIDROLL_MIN_S // 60}:00: YouTube shows no mid-roll ads on it")
    if spec["aspect"] == "9:16" and dur and float(dur) > 180:
        warnings.append(f"a vertical video over 3:00 ({dur} s) is not treated as a Short")
    settings = {k: up.get(k) for k in ("made_for_kids", "contains_synthetic_media")}
    unset = [k for k, v in settings.items() if not isinstance(v, bool)]
    if unset:
        problems.append(f"data/channel.json upload.{' and upload.'.join(unset)} must be true or false (your decision: "
                        f"made_for_kids = children are the main audience; contains_synthetic_media = something could "
                        f"be mistaken for real)")
    if (meta.get("youtube") or {}).get("post_id") and not a.force:
        problems.append(f"already uploaded (youtube.post_id {meta['youtube']['post_id']}): --status to check, "
                        f"--force to upload again")
    if not a.dry_run and not (a.when or a.now):
        problems.append("say when: --when \"YYYY-MM-DD HH:MM\" (with --tz) or --now")

    desc = description(a.slug, pk, meta)
    (d / "description.txt").write_text(desc + "\n", encoding="utf-8")
    breaks = ad_breaks(meta) if spec.get("midroll") else []
    if breaks:
        meta["ad_breaks"] = breaks
        write_meta(a.slug, meta)
    tz = a.tz or up.get("timezone") or "UTC"
    when = None
    if a.when:
        try:
            when = dt.datetime.fromisoformat(a.when.strip().replace(" ", "T")).isoformat(timespec="minutes")
        except ValueError:
            problems.append(f"--when {a.when!r} is not a date and time like 2026-11-20 17:30")
    playlist = ((up.get("playlists") or {}).get(fmt) or "").strip()
    yt = {"title": title, "visibility": a.visibility or up.get("visibility") or "public",
          "madeForKids": settings["made_for_kids"], "containsSyntheticMedia": settings["contains_synthetic_media"],
          "categoryId": str(up.get("category_id") or "27"), "notifySubscribers": bool(up.get("notify_subscribers", True))}
    for key, val in (("defaultLanguage", up.get("default_language")), ("defaultAudioLanguage", up.get("default_audio_language")),
                     ("playlistId", playlist), ("firstComment", a.first_comment)):
        if val:
            yt[key] = val
    tags = [t for t in dict.fromkeys(list(up.get("tags") or []) + [meta.get("category", "")]) if t]

    print(f"{a.slug} ({fmt}): \"{title}\" ({len(title)} characters)")
    print(f"  video: {video.relative_to(ROOT) if video.is_relative_to(ROOT) else video}"
          f"{f' ({video.stat().st_size / 1e6:.0f} MB)' if video.exists() else ''}")
    print(f"  thumbnail: {thumb.relative_to(ROOT) if thumb and thumb.is_relative_to(ROOT) else thumb or 'none'}")
    print(f"  when: {'now' if a.now else (when + ' ' + tz if when else 'not set')} · {yt['visibility']} · "
          f"category {yt['categoryId']} · made for kids {settings['made_for_kids']} · synthetic {settings['contains_synthetic_media']}")
    print(f"  description: shorts/{a.slug}/description.txt ({len(desc)} characters)")
    if breaks:
        print(f"  ad breaks to set in YouTube Studio (Editor > Ad breaks): {', '.join(clock(t) for t in breaks)}")
    for w in warnings:
        print(f"  warn: {w}")
    for p in problems:
        print(f"  {'blocked' if a.dry_run else 'error'}: {p}")
    if a.dry_run:
        print("dry run: nothing uploaded" + (" (fix the 'blocked' lines before the real upload)" if problems else ""))
        register()
        return
    if problems:
        sys.exit(2)

    account = a.account or (up.get("zernio_account_id") or "").strip()
    if not account:
        accs = [x for x in api("GET", "/v1/accounts").get("accounts", []) if x.get("platform") == "youtube"]
        if len(accs) != 1:
            die(f"{len(accs)} YouTube accounts in Zernio: connect one, or put the right _id in data/channel.json "
                f"upload.zernio_account_id (see --accounts)", 2)
        account = accs[0]["_id"]
        print(f"  using the YouTube account {accs[0].get('displayName') or accs[0].get('username')} ({account}); "
              f"save it in data/channel.json upload.zernio_account_id")

    media = {"type": "video", "url": put_file(video, "video/mp4")}
    if thumb:
        media["thumbnail"] = put_file(thumb, "image/png" if thumb.suffix.lower() == ".png" else "image/jpeg")
    body = {"content": desc, "title": title, "mediaItems": [media], "tags": tags,
            "platforms": [{"platform": "youtube", "accountId": account, "platformSpecificData": yt}]}
    if a.now:
        body["publishNow"] = True
    else:
        body["scheduledFor"], body["timezone"] = when, tz
    res = api("POST", "/v1/posts", body)
    post = res.get("post") or {}
    if not post.get("_id"):
        die(f"Zernio did not return a post: {json.dumps(res)[:300]}")
    state = save_status(a.slug, post)
    print(f"posted to Zernio: post {state.get('post_id')}, YouTube status {state.get('status') or '?'}"
          + (f", {state['url']}" if state.get("url") else "")
          + f". Later: upload.py --slug {a.slug} --status (fills in the YouTube URL), then youtube_stats.py daily.")
    register()


if __name__ == "__main__":
    main()
