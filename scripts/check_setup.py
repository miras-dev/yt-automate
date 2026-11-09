#!/usr/bin/env python3
"""Check that this machine can make a Short: keys, Python libraries, ffmpeg, Node, GPU, external skills.

  python scripts/check_setup.py [--json]

Prints one line per check: ok / MISSING (needed) / warn (optional or cannot be checked from a script).
Exit code 0 when nothing needed is missing, 1 otherwise. Key values are never printed.
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / ".claude" / "skills"
OK, MISSING, WARN = "ok", "MISSING", "warn"
rows: list[tuple[str, str, str, str]] = []  # group, name, state, note


def add(group, name, state, note=""):
    rows.append((group, name, state, note))


def env_keys() -> dict[str, bool]:
    """Which keys are set (in .env or the environment). Values are never read out."""
    found: dict[str, bool] = {}
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)", line)
            if m and not line.lstrip().startswith("#"):
                found[m.group(1)] = bool(m.group(2).strip().strip('"').strip("'"))
    for k in ("GEMINI_API_KEY", "ELEVENLABS_API_KEY", "YOUTUBE_API_KEY"):
        found[k] = found.get(k, False) or bool(os.environ.get(k))
    return found


def run(cmd, timeout=20):
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr).strip()
    except (FileNotFoundError, subprocess.TimeoutExpired, PermissionError) as e:
        return 127, str(e)


def main():
    as_json = "--json" in sys.argv

    # keys ---------------------------------------------------------------------------------------------------------
    keys = env_keys()
    add("keys", ".env file", OK if (ROOT / ".env").exists() else WARN, "" if (ROOT / ".env").exists() else "copy .env.example to .env")
    add("keys", "GEMINI_API_KEY", OK if keys["GEMINI_API_KEY"] else MISSING, "" if keys["GEMINI_API_KEY"] else "pictures need it; put it in .env")
    add("keys", "ElevenLabs", OK if keys["ELEVENLABS_API_KEY"] else WARN,
        "ELEVENLABS_API_KEY set" if keys["ELEVENLABS_API_KEY"] else
        "no ELEVENLABS_API_KEY: fine if the ElevenLabs connector is connected in Claude Code (a script cannot see connectors)")
    add("keys", "YOUTUBE_API_KEY", OK if keys["YOUTUBE_API_KEY"] else WARN, "" if keys["YOUTUBE_API_KEY"] else "optional: only for refreshing view counts later")

    # python -------------------------------------------------------------------------------------------------------
    add("python", "Python 3.10+", OK if sys.version_info >= (3, 10) else MISSING, sys.version.split()[0])
    for mod, pip in (("google.genai", "google-genai"), ("PIL", "pillow"), ("numpy", "numpy"), ("cv2", "opencv-python-headless"),
                     ("faster_whisper", "faster-whisper")):
        try:
            present = importlib.util.find_spec(mod) is not None
        except (ImportError, ValueError):
            present = False
        add("python", pip, OK if present else MISSING, "" if present else "pip install -r requirements.txt")

    # tools --------------------------------------------------------------------------------------------------------
    for tool in ("ffmpeg", "ffprobe"):
        p = shutil.which(tool)
        note = p or ""
        if not p:
            bundled = list((ROOT / "video" / "node_modules" / "@remotion").glob(f"compositor-*/{tool}*"))
            note = f"not in PATH; Remotion ships one: add {bundled[0].parent} to PATH" if bundled else "install ffmpeg and put it in PATH"
        add("tools", tool, OK if p else MISSING, note)
    code, out = run(["node", "--version"])
    major = int(re.sub(r"\D.*", "", out.lstrip("v")) or 0) if code == 0 else 0
    add("tools", "Node 18+", OK if major >= 18 else MISSING, out if code == 0 else "install Node.js 18 or newer")
    for name, d in (("video (Remotion)", "video"), ("dashboard (Next.js)", "dashboard")):
        ok = (ROOT / d / "node_modules").is_dir()
        add("tools", f"{name} packages", OK if ok else MISSING, "" if ok else f"cd {d} && npm install")

    # GPU for --gl=angle -------------------------------------------------------------------------------------------
    code, out = run(["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"])
    if code == 0 and out:
        add("gpu", "GPU", OK, out.splitlines()[0])
    elif sys.platform == "darwin":
        add("gpu", "GPU", OK, "macOS: Metal through ANGLE")
    elif sys.platform == "win32":
        code, out = run(["wmic", "path", "win32_VideoController", "get", "name"])
        names = [x.strip() for x in out.splitlines()[1:] if x.strip()] if code == 0 else []
        add("gpu", "GPU", OK if names else WARN, ", ".join(names) or "could not read the graphics adapter")
    else:
        add("gpu", "GPU", WARN, "no NVIDIA GPU found: renders still work with --gl=swangle (software, much slower)")

    # external skills ----------------------------------------------------------------------------------------------
    for skill, must in (("real-sfx", "scripts/from_cues.py"), ("openverse-sfx", "scripts/sfx_search.py"), ("earshot", "SKILL.md")):
        ok = (SKILLS / skill / must).exists()
        add("skills", f"{skill} skill", OK if ok else MISSING, "" if ok else "copy it again from its original repo (see .claude/skills/EXTERNAL_SOURCES.md)")
    exe = shutil.which("earshot")
    add("skills", "earshot program", OK if exe else MISSING,
        exe or 'uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot" && earshot doctor --fetch')
    add("skills", "earshot MCP server", OK if (ROOT / ".mcp.json").exists() and exe else WARN,
        ".mcp.json starts `earshot mcp`" if exe else "configured in .mcp.json; starts once the earshot program is installed")
    cfg_path = ROOT / "sfx-library" / "real-sfx-config.json"   # per machine, gitignored (REAL_SFX_CONFIG)
    libs = []
    try:
        libs = json.loads(cfg_path.read_text(encoding="utf-8")).get("libraries", [])
    except (OSError, ValueError):
        pass
    add("skills", "real-sfx sound library", OK if libs else WARN,
        f"{len(libs)} library folder(s)" if libs else
        "not set yet (normal before the first video): REAL_SFX_CONFIG=sfx-library/real-sfx-config.json python "
        '.claude/skills/real-sfx/scripts/setup.py init --library openverse="$(pwd)/sfx-library" --index')

    # repo ---------------------------------------------------------------------------------------------------------
    for rel in ("data/topics.json", "data/shorts.json", "CLAUDE.md", ".claude/commands/new-short.md", ".claude/commands/new-video.md",
                ".claude/skills/short-script/SKILL.md", ".claude/skills/cutout-cartoon-shorts/SKILL.md"):
        ok = (ROOT / rel).exists()
        add("repo", rel, OK if ok else MISSING, "" if ok else "missing file")
    chars = [p.parent.name for p in (ROOT / "library" / "characters").glob("*/poses.json")]
    add("repo", "character library", OK if chars else WARN, ", ".join(chars) if chars else "empty: /new-video builds it first (Part 7.2)")

    missing = [r for r in rows if r[2] == MISSING]
    if as_json:
        print(json.dumps({"ok": not missing, "checks": [dict(zip(("group", "name", "state", "note"), r)) for r in rows]}, indent=2))
    else:
        group = None
        for g, name, state, note in rows:
            if g != group:
                print(f"\n{g}")
                group = g
            print(f"  [{state:^7}] {name}" + (f"  - {note}" if note else ""))
        warns = sum(1 for r in rows if r[2] == WARN)
        print(f"\n{'READY' if not missing else 'NOT READY'}: {len(missing)} missing, {warns} to look at, {len(rows) - len(missing) - warns} ok")
        if missing:
            print("Still missing: " + ", ".join(r[1] for r in missing))
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
