#!/usr/bin/env python3
"""Rebuild data/shorts.json from every shorts/*/meta.json. See the cutout-cartoon-shorts skill's register.py."""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent.parent / ".claude/skills/cutout-cartoon-shorts/scripts/register.py"),
               run_name="__main__")
