"""Shared helpers for the Shorts Factory scripts (paths, .env, meta.json)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def repo_root() -> Path:
    """The repository root: the nearest parent that holds CLAUDE.md and data/."""
    here = Path(__file__).resolve()
    for p in here.parents:
        if (p / "CLAUDE.md").exists() and (p / "data").is_dir():
            return p
    return Path.cwd()


ROOT = repo_root()

FORMATS = {
    # name: composition size, render scale, length limits in seconds (min_s-max_s), the length to aim for (aim_s),
    # burned-in subtitles on by default.
    # Anything over one minute is landscape: a Short is 9:16 (20-30 s); a longer video is 16:9, either
    # long-horizontal (1:00-3:30, an explainer) or long-midroll (8:00-12:00: YouTube places mid-roll ads only in
    # videos of 8:00 or more, so it must never end under 8:00). YouTube never treats a 16:9 upload as a Short.
    # long-vertical is retired: it stays only so videos made before the landscape rule still register.
    "short": {"width": 1080, "height": 1920, "scale": 2, "aspect": "9:16", "min_s": 20, "max_s": 30,
              "aim_s": (22, 28), "subtitles": False},
    "long-horizontal": {"width": 1920, "height": 1080, "scale": 2, "aspect": "16:9", "min_s": 60, "max_s": 210,
                        "aim_s": (120, 180), "subtitles": True},
    "long-midroll": {"width": 1920, "height": 1080, "scale": 2, "aspect": "16:9", "min_s": 480, "max_s": 720,
                     "aim_s": (500, 600), "subtitles": True, "midroll": True},
    "long-vertical": {"width": 1080, "height": 1920, "scale": 2, "aspect": "9:16", "min_s": 60, "max_s": 179.5,
                      "aim_s": (60, 170), "subtitles": True, "retired": True},
}
FPS = 60
MIDROLL_MIN_S = 480  # YouTube allows mid-roll ads only in videos of 8:00 or longer
WORDS_PER_MIN = 150  # speaking rate used for every length estimate before the voice exists
STATUSES = ["idea", "script", "voice", "pictures", "animation", "sound", "qa", "rendered", "published"]
DEFAULT_BUDGET = {"short": 40, "long-horizontal": 60, "long-midroll": 100, "long-vertical": 60}
LONG_FORMATS = [f for f, spec in FORMATS.items() if spec["aspect"] == "16:9"]


def load_env() -> None:
    """Read KEY=VALUE lines from .env into os.environ (does not overwrite, never prints)."""
    f = ROOT / ".env"
    if not f.exists():
        return
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        if v and k.strip() not in os.environ:
            os.environ[k.strip()] = v


def short_dir(slug: str) -> Path:
    return ROOT / "shorts" / slug


def read_json(path: Path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def read_meta(slug: str) -> dict:
    return read_json(short_dir(slug) / "meta.json", {}) or {}


def write_meta(slug: str, meta: dict) -> None:
    write_json(short_dir(slug) / "meta.json", meta)


CHANNEL_FILE = ROOT / "data" / "channel.json"


def read_channel() -> dict:
    """data/channel.json: the channel's own identity (mascot, packaging style, upload settings). {} when missing."""
    return read_json(CHANNEL_FILE, {}) or {}


def read_packaging(slug: str) -> dict:
    """The `Key: value` lines at the top of shorts/<slug>/packaging.md (before the first ## heading), keys in lower
    case: title, thumbnail, thumbnail text, frame 0, promise, description. {} when the file does not exist."""
    f = short_dir(slug) / "packaging.md"
    if not f.exists():
        return {}
    out: dict[str, str] = {}
    for line in f.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            break
        if ":" in line and not line.startswith("#"):
            k, v = line.split(":", 1)
            k = k.strip().strip("*_- ").lower()
            if k and len(k) <= 24:
                out[k] = v.strip()
    return out


def die(msg: str, code: int = 1):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)
