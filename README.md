# Shorts Factory

Cut-out cartoon YouTube Shorts (and 16:9 videos of 1-3.5 or 8-12 minutes) made in one repository with Claude Code:
topic research, the title and thumbnail first, a fact-checked script, Gemini pictures of the channel's own mascot
keyed to transparent cut-outs, an ElevenLabs voice, Remotion animation, real Openverse sound effects, a verified 4K
MP4 with its thumbnail, publishing through Zernio when you ask, and a small dashboard that lists every video with its
cost and results and tracks the YouTube Partner Program thresholds.

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

Optional keys in `.env`: `YOUTUBE_API_KEY` (topic research, the title lookalike check and view counts; free) and
`ZERNIO_API_KEY` (publishing; free for up to 2 accounts).

Before the first upload, decide two settings in [data/channel.json](data/channel.json) (`upload`): `made_for_kids`
(are children the main audience?) and `contains_synthetic_media` (could anything be mistaken for real?). They are
`null` until you set them, and `upload.py` refuses to publish until then. The same file holds the channel's mascot:
the first video designs one if none is chosen yet and tells you what it picked; change it there if you want another.

## Make a video

In Claude Code, in this folder:

| Command | Makes |
|---|---|
| `/new-short` | one 20-30 s vertical Short on a new topic |
| `/new-short why don't we throw trash into volcanoes` | a Short on your topic |
| `/new-video` | a 1-3.5 minute 16:9 landscape video with subtitles on a new topic |
| `/new-video what does a forward-deployed engineer do` | a 16:9 video on your topic |
| `/new-video 8min what would happen if the Moon disappeared` | an 8-12 minute 16:9 video (long enough for mid-roll ads) |

Anything over one minute is landscape (16:9) and shows burned-in subtitles; only the 20-30 s Shorts are vertical.
Both commands run on Opus 5.5 at max effort (`.claude/settings.json` and the commands' frontmatter). Every video
starts with its package (title and thumbnail idea, checked against existing videos) and checks the ElevenLabs
credits before the voice is made: an 8-12 minute voice takes 8,000-10,000 credits.

The finished MP4 is in `out/`, the thumbnail in `shorts/<date>-<slug>/qa/thumbnail.jpg`, everything else about the
video in `shorts/<date>-<slug>/`.

## Publish

Nothing is uploaded unless you ask. Every build ends with a dry run that shows the title, the thumbnail, the
description (written to `description.txt`) and, for 8-12 minute videos, ad break suggestions:

```bash
python .claude/skills/cutout-cartoon-shorts/scripts/upload.py --slug 2026-11-20-my-video --dry-run
```

To publish, ask Claude, or run it yourself with a time (or `--now`):

```bash
python .claude/skills/cutout-cartoon-shorts/scripts/upload.py --slug 2026-11-20-my-video --when "2026-11-21 17:30" --tz America/New_York
```

Then `upload.py --slug ... --status` fills in the YouTube URL, and once a day:

```bash
python scripts/youtube_stats.py
```

## Dashboard

```bash
npm run dashboard
```

Open http://localhost:3000. It reads `data/shorts.json`, which `python scripts/register.py` rebuilds from every
`shorts/*/meta.json`. `upload.py` and `youtube_stats.py` keep the YouTube URL, status and view counts up to date
(without them, paste the URL into `meta.json` `youtube.url` and type the numbers into `stats`). The Partner Program
panel shows subscribers, Shorts views in the last 90 days and estimated watch hours against YouTube's thresholds,
including the doubled ones for new applicants from 1 February 2027. Watch hours need the average percentage viewed,
which only YouTube Studio shows: copy it into `stats.avg_view_pct` now and then.

## Layout

```
.claude/commands/     /new-short, /new-video
.claude/skills/       short-script, cutout-cartoon-shorts (+ scripts), and the external real-sfx, openverse-sfx, earshot
data/                 channel.json (mascot, packaging style, upload settings), topics.json (topics used),
                      shorts.json (dashboard index), youtube_channel.json (subscribers, from youtube_stats.py)
shorts/<slug>/        meta.json, packaging.md, script.md, sources.md, beats.md, prompts.md, credits.txt,
                      description.txt, qa/ (sheets, thumbnail.jpg)
library/characters/   the mascot's reusable poses (every video uses them)
video/                Remotion project (src/lib = shared helpers, src/_template = example scene)
dashboard/            Next.js dashboard
scripts/              check_setup.py, register.py, youtube_stats.py
out/, sfx-library/    renders and downloaded sounds (not committed)
work/                 scratch output such as find_topics.py results (not committed)
```

## Preview and render by hand

```bash
npm run studio
```

```bash
cd video && node scripts/render.mjs template-short --preview
```

`template-short` and `template-long-horizontal` are a code-only test scene (no pictures, no sound) that proves the
animation helpers and the subtitles work in both formats. Without a GPU add `--gl=swangle`.

## External skills

real-sfx (Clipwing/skills), openverse-sfx (Varnan-Tech/opendirectory) and earshot (Leonxlnx/earshot) are copied
unchanged from their original repositories; sources and commits are in
[.claude/skills/EXTERNAL_SOURCES.md](.claude/skills/EXTERNAL_SOURCES.md).
