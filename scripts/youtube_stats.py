#!/usr/bin/env python3
"""Refresh YouTube views / likes / comments into every published meta.json. See the cutout-cartoon-shorts skill's
youtube_stats.py."""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent.parent / ".claude/skills/cutout-cartoon-shorts/scripts/youtube_stats.py"),
               run_name="__main__")
