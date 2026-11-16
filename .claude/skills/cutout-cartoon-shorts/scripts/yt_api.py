"""Small YouTube Data API v3 client shared by find_topics.py and youtube_stats.py (an API key, public data only).

Quota: a project gets 10,000 units a day (it resets at midnight Pacific time). search.list costs 100 units;
videos.list and channels.list cost 1 unit per call of up to 50 ids. The key is YOUTUBE_API_KEY from .env or the
environment; it is never printed (error messages leave the URL out).
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://www.googleapis.com/youtube/v3/"
COST = {"search": 100, "videos": 1, "channels": 1}


class YouTubeError(RuntimeError):
    pass


class Client:
    def __init__(self, key: str | None = None):
        self.key = key or os.environ.get("YOUTUBE_API_KEY") or ""
        self.units = 0
        if not self.key:
            raise YouTubeError("YOUTUBE_API_KEY is not set: put it in .env (Google Cloud console > APIs & Services > "
                               "enable YouTube Data API v3 > Credentials > API key)")

    def get(self, endpoint: str, **params) -> dict:
        params = {k: v for k, v in params.items() if v not in (None, "")}
        url = API + endpoint + "?" + urllib.parse.urlencode({**params, "key": self.key}, doseq=True)
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "shorts-factory/1.0"})
        last: Exception | None = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    self.units += COST.get(endpoint, 1)
                    return json.loads(r.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", "replace")
                if e.code >= 500 and attempt < 2:
                    last = e
                    time.sleep(2 ** attempt)
                    continue
                if "quotaExceeded" in body or "dailyLimitExceeded" in body:
                    raise YouTubeError("YouTube API quota used up for today (10,000 units; resets at midnight "
                                       "Pacific time)") from None
                raise YouTubeError(f"YouTube API {endpoint}: HTTP {e.code} {_reason(body)}") from None
            except (urllib.error.URLError, TimeoutError) as e:
                last = e
                time.sleep(2 ** attempt)
        raise YouTubeError(f"YouTube API {endpoint}: network error {type(last).__name__}: {str(last)[:200]}")

    def videos(self, ids: list[str], parts: str = "snippet,statistics,contentDetails") -> list[dict]:
        out: list[dict] = []
        for i in range(0, len(ids), 50):
            out += self.get("videos", part=parts, id=",".join(ids[i:i + 50]), maxResults=50).get("items", [])
        return out

    def channels(self, ids: list[str]) -> dict[str, dict]:
        out: dict[str, dict] = {}
        uniq = list(dict.fromkeys(ids))
        for i in range(0, len(uniq), 50):
            for it in self.get("channels", part="snippet,statistics", id=",".join(uniq[i:i + 50]),
                               maxResults=50).get("items", []):
                out[it["id"]] = it
        return out


def _reason(body: str) -> str:
    try:
        err = json.loads(body).get("error", {})
        return f"{err.get('message', '')} ({', '.join(e.get('reason', '') for e in err.get('errors', []))})"
    except ValueError:
        return body[:200]


def iso_seconds(d: str | None) -> int:
    """ISO 8601 duration (PT1H2M3S, P1DT2H) to seconds; 0 when missing (live streams)."""
    m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?", d or "")
    if not m:
        return 0
    days, h, mi, s = (int(x or 0) for x in m.groups())
    return ((days * 24 + h) * 60 + mi) * 60 + s


def parse_time(s: str) -> dt.datetime:
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))


def video_id_from(url_or_id: str) -> str:
    g = re.search(r"(?:shorts/|v=|youtu\.be/|embed/|live/)([A-Za-z0-9_-]{11})", url_or_id or "")
    if g:
        return g.group(1)
    return url_or_id if re.fullmatch(r"[A-Za-z0-9_-]{11}", url_or_id or "") else ""


def clock(seconds: float) -> str:
    seconds = int(round(seconds))
    return f"{seconds // 3600}:{seconds // 60 % 60:02d}:{seconds % 60:02d}" if seconds >= 3600 else f"{seconds // 60}:{seconds % 60:02d}"
