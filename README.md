# Shorts Factory

Cut-out cartoon YouTube Shorts (and 1-3 minute videos) made in one repository with Claude Code: topic research and
script, Gemini pictures keyed to transparent cut-outs, an ElevenLabs voice, Remotion animation, real Openverse sound
effects, a verified 4K MP4, and a small dashboard that lists every video with its cost and results.

The full design is in [SHORTS_FACTORY_PLAN.md](SHORTS_FACTORY_PLAN.md). The rules Claude Code follows are in
[CLAUDE.md](CLAUDE.md).

## Set up once

```bash
npm install                      # installs video/ (Remotion) and dashboard/ (Next.js)
```

```bash
pip install -r requirements.txt  # google-genai, pillow, numpy, opencv, faster-whisper
```

```bash
cp .env.example .env             # then put your GEMINI_API_KEY in .env
```

```bash
uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"
```

```bash
earshot doctor --fetch           # earshot's two models, about 1.1 GB
```

```bash
python scripts/check_setup.py    # says what is still missing
```

You also need: Node 18+, Python 3.10+, ffmpeg in PATH, a GPU for fast renders, and ElevenLabs connected in Claude
Code (or `ELEVENLABS_API_KEY` in `.env`). The first Remotion render downloads its own headless browser.

## Make a video

In Claude Code, in this folder:

| Command | Makes |
|---|---|
| `/new-short` | one 20-30 s vertical Short on a new topic |
| `/new-short why don't we throw trash into volcanoes` | a Short on your topic |
| `/new-video long-vertical` | a 1-3 minute vertical video (stays under 3:00) |
| `/new-video long-horizontal` | a 16:9 video just over 3 minutes |

The finished MP4 is in `out/`. Everything else about the video is in `shorts/<date>-<slug>/`.

## Dashboard

```bash
npm run dashboard
```

Open http://localhost:3000. It reads `data/shorts.json`, which `python scripts/register.py` rebuilds from every
`shorts/*/meta.json`. After uploading, paste the YouTube URL into that video's `meta.json` (`youtube.url`), set
`status` to `published`, and run `register.py` again. View counts are typed into `meta.json` (`stats`) for now;
automatic refresh from the YouTube API is a later step (Part 5 of the plan).

## Layout

```
.claude/commands/     /new-short, /new-video
.claude/skills/       short-script, cutout-cartoon-shorts (+ scripts), and the external real-sfx, openverse-sfx, earshot
data/                 topics.json (topics used), shorts.json (dashboard index)
shorts/<slug>/        meta.json, script.md, sources.md, beats.md, prompts.md, credits.txt, qa/
library/characters/   reusable character poses for long videos
video/                Remotion project (src/lib = shared helpers, src/_template = example scene)
dashboard/            Next.js dashboard
scripts/              check_setup.py, register.py
out/, sfx-library/    renders and downloaded sounds (not committed)
```

## Preview and render by hand

```bash
npm run studio
```

```bash
cd video && node scripts/render.mjs template-short --preview
```

`template-short`, `template-long-vertical` and `template-long-horizontal` are a code-only test scene (no pictures, no
sound) that proves the animation helpers work in every format. Without a GPU add `--gl=swangle`.

## External skills

real-sfx (Clipwing/skills), openverse-sfx (Varnan-Tech/opendirectory) and earshot (Leonxlnx/earshot) are copied
unchanged from their original repositories; sources and commits are in
[.claude/skills/EXTERNAL_SOURCES.md](.claude/skills/EXTERNAL_SOURCES.md).
