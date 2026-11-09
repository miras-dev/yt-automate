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
    # name: composition size, render scale, length limits in seconds
    "short": {"width": 1080, "height": 1920, "scale": 2, "aspect": "9:16", "min_s": 20, "max_s": 30},
    "long-vertical": {"width": 1080, "height": 1920, "scale": 2, "aspect": "9:16", "min_s": 60, "max_s": 179.5},
    "long-horizontal": {"width": 1920, "height": 1080, "scale": 2, "aspect": "16:9", "min_s": 185, "max_s": 210},
}
FPS = 60
STATUSES = ["idea", "script", "voice", "pictures", "animation", "sound", "qa", "rendered", "published"]
DEFAULT_BUDGET = {"short": 40, "long-vertical": 60, "long-horizontal": 60}


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


def die(msg: str, code: int = 1):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)
