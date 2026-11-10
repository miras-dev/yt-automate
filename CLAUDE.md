# Shorts Factory - rules

- Every Short lives in shorts/<date>-<slug>/ and has a meta.json. Update meta.json after every stage
  (status: idea → script → voice → pictures → animation → sound → qa → rendered → published).
- Run scripts/register.py after any change to meta.json so data/shorts.json and the dashboard stay current.
- Never print, paste or commit API keys. Keys live in .env only.
- Facts in the voiceover must be backed by sources.md. Cartoon exaggeration is only for what characters do.
- One timing source: the T table in video/src/<slug>/timing.ts. Sound cues, beats and camera all read from it.
- Sounds: only CC0, CC-BY or public-domain from Openverse; no NC, no ND. Every CC-BY sound goes into credits.txt.
- Large files (raw pictures, renders, sfx-library) are gitignored. Commit prompts, scripts, code, meta and qa sheets.
- Don't ask questions mid-run. Choose sensible defaults and report them at the end. Stop only if a key, login or
  tool is missing, or if picture spend would pass the budget in meta.json (default 40 images).

## Where things are

| What | Where |
|---|---|
| Make a Short (9:16) / a 1-3.5 minute video (16:9) | `/new-short`, `/new-video` (.claude/commands/; both run on Opus 5.5 at max effort) |
| Topic + script rules | .claude/skills/short-script/SKILL.md |
| Pictures, voice, animation, sound, render | .claude/skills/cutout-cartoon-shorts/SKILL.md (+ scripts/) |
| Full design document | SHORTS_FACTORY_PLAN.md |
| Remotion project | video/ (helpers in video/src/lib/, example in video/src/_template/, list of videos in video/src/registry.ts) |
| Dashboard | dashboard/ (`npm run dashboard`, reads data/shorts.json and shorts/*) |
| Setup check | `python scripts/check_setup.py` |

Formats (meta.json `format`): anything over one minute is landscape. `short` 9:16 20-30 s · `long-horizontal` 16:9
1:00-3:30 (aim 2:00-3:00) with burned-in subtitles. A 16:9 upload is never a Short, so no 3:00 rule. `long-vertical`
is retired (kept only so older videos still build). Default picture budget: 40 for a Short, 60 for a long video.
Model: .claude/settings.json pins Opus 5.5 (`model`) at max effort (`CLAUDE_CODE_EFFORT_LEVEL=max`) for this repo.

Run every command from the repository root unless it says `video/`. Scripts (all have `--help`), in
.claude/skills/cutout-cartoon-shorts/scripts/:

| Script | Job |
|---|---|
| gen_image.py NAME ASPECT "PROMPT" --kind char\|obj --slug SLUG [--ref ...] | one Gemini picture on the key colour; logs prompt, count, cost; exit 3 = budget reached |
| key.py --all RAW_DIR CUT_DIR | key colour → transparent cut-outs, no fringe |
| sheet.py --slug SLUG [--hero ...] | qa/sheet.png to check every cut-out by eye |
| prep.py --slug SLUG ... / --library NAME --src DIR | trim + measure → video/public/<slug>/ and video/src/<slug>/sprites.ts, or library/characters/NAME/poses.json |
| words.py VO.mp3 [--ts timing.ts] | word times snapped to real pauses → words.json |
| subtitles.py --slug SLUG [--scene N -o .../subtitles.json \| --all] | script words on the voice's word times → subtitles.json (long videos) |
| export_cues.py --slug SLUG [--apply RESOLVED.json] | T table + cues.json ⇄ real-sfx |
| popscan.py PREVIEW.mp4 --expect ... | finds picture jumps that are not planned swaps or cuts |
| register.py (also scripts/register.py) | rebuilds data/shorts.json |

In video/: `node scripts/contact.mjs <CompId> --slug SLUG --times all-T` (contact sheet + frame 0),
`node scripts/render.mjs <CompId> [--preview]` (render + verify; `--gl=swangle` without a GPU),
`npx remotion studio src/index.ts` (preview).

## External skills: exact commands and file formats

Copied unchanged from their original repos (sources and commits: .claude/skills/EXTERNAL_SOURCES.md). Read each
SKILL.md before first use in a session. None of them can hear for you: report measurements, never "it sounds good".

### openverse-sfx (.claude/skills/openverse-sfx) - finding free sounds and music
- Needs ffmpeg; `pip install librosa matplotlib numpy scipy` only for beat_grid.py / verify_mix.py.
- Search (no API key; about 200 anonymous searches a day, so ONE search per kind of sound):
  `python .claude/skills/openverse-sfx/scripts/sfx_search.py --query "whoosh" [--max-results 8] [--min-ms 0] [--max-ms 8000]`
  → JSON list: `id, title, creator, license, license_url, source, duration_s, audio_url, landing_url, attribution`.
  The script only returns `license=cc0,by,pdm` from `source=freesound,jamendo`. Do not bypass it. Host: api.openverse.org only.
- Download + credit: `python .claude/skills/openverse-sfx/scripts/sfx_fetch.py --audio-url URL --name STEM
  --attribution "TEXT" --dir sfx-library/<category> --credits shorts/<slug>/credits.txt`
  (the `attribution` field goes in verbatim; its defaults `sfx/` and `credits.txt` are wrong for this repo, always pass both).
- Normalise: `python .claude/skills/openverse-sfx/scripts/sfx_normalize.py SRC DST [--mode peak|lufs] [--target N] [--max-peak -1]`.
  One-shots: `--mode peak --target -1` here (the skill's own default is -3 dBTP). Music bed: `--mode lufs --target -20`.
  Never run ffmpeg `loudnorm` on a short sound.
- Music only: `beat_grid.py MUSIC [--out beats.json] [--plot beatgrid.png]`. Final check of an MP4:
  `verify_mix.py VIDEO --cue T ... [--target -16] [--outdir verify]` (ebur128 loudness + true peak + frames at cues).
- Its own targets (-16 LUFS, true peak under -4 dBFS on the shipped MP4) match ours (peak around -4 dBFS).

### real-sfx (.claude/skills/real-sfx) - placing sounds on the exact frame
- Run its scripts from the repo root with `REAL_SFX_CONFIG=sfx-library/real-sfx-config.json` (set for Claude Code in
  .claude/settings.json). Health check: `python .claude/skills/real-sfx/scripts/setup.py check`.
  Once per machine: `python .claude/skills/real-sfx/scripts/setup.py init --library openverse="$(pwd)/sfx-library" --index`;
  after new downloads: `python .claude/skills/real-sfx/scripts/build_index.py`.
- It never synthesizes sound. Its bundled uisfx pack (78 CC0 UI sounds, synthesized) is for interface moments only;
  for cartoons pass `--ui library` to from_cues.py.
- Typed event list (references/typed-cues.md), a JSON list or `{"cues": [...]}` of
  `{"t": seconds, "type": kind, "g": 1.0, "len": seconds}` (synonyms: `time|at|start`, `name|kind|event|sound`,
  `gain|volume`, `dur|duration`). Kinds: whoosh, wipe, hit, thump, riser, drop, click, pop, tick, chime, success,
  glass, shatter, magic, water, coins, key, glitch, error, camera, paper, data, ambience. Unknown kinds stay silent.
  `python .claude/skills/real-sfx/scripts/from_cues.py EVENTS.json --video PREVIEW.mp4 --out work/cues.json --ui library`
- Cue sheet for mix.py (schema in the header of scripts/mix.py):
  `{"video": "abs/path.mp4", "keep_audio": "auto", "cues": [{"t": 1.2, "label": "plop", "file": "abs/path.wav",
  "role": "hit", "gain_db": 0, "anchor": "start|peak|arrive|end", "max_dur": 1.5}]}`.
  The sound is given by `file`, `id` (from search.py), `uisfx` or `pick`. Default anchor depends on the role
  (hits by their arrival / onset, whooshes and risers by their peak).
- Mix: `python .claude/skills/real-sfx/scripts/mix.py SHEET.json --out work/<slug>/sfx.mp4 --voice-safe [--plan]`
  writes `sfx.mp4`, `sfx_sfx_track.wav`, `sfx_cue_report.md` and `sfx_resolved_cues.json`
  (per cue: `t, label, file, role, anchor, start, seg, gain_applied_db, peak_time`). `--voice-safe` dips effects
  under speech; `--duck` is for music-led films.
- In this repo: `export_cues.py --slug SLUG` writes both files above from timing.ts + cues.json, and
  `export_cues.py --slug SLUG --apply work/<slug>/sfx_resolved_cues.json` stores `lead = t - start` per cue, which
  the Remotion `<SoundCues>` component uses. The final audio is mixed by Remotion, not by mix.py.
- Checks on a result: `verify.py RESOLVED.json WAV`, `critique.py RESOLVED.json WAV`, `review.py RESOLVED.json WAV --out review.png`.

### earshot (.claude/skills/earshot, MCP server in .mcp.json) - listening
- Program (not vendored): `uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"`, then
  `earshot doctor --fetch` (two models, about 1.1 GB, CPU only). MCP: `.mcp.json` runs `earshot mcp`; prefer the MCP
  tools for more than a few calls (each CLI call reloads the models, 20-40 s). Slow machine: start Claude Code with
  `MCP_TIMEOUT=60000`.
- Picking a sound: `earshot rank "QUERY" FILES...` (best candidate), `earshot match FILE "QUERY" --alts "..."`
  (verdict strong / plausible / weak / no match, with z), `earshot find FILE "QUERY" --top 4` (cleanest moments as
  start / end seconds), `earshot describe FILE` (tags: rule out music or voices under an effect).
- Checking the mix: `earshot timeline FILE --video V [--cues C]` (events, loudness, sync to cuts and cue frames),
  `earshot measure FILE` (LUFS, true peak, LRA; no models), `earshot sheet FILE -o out.png` (annotated picture for
  reading), `earshot critique FILE --video V` (scorecard against launch films: read it as hints, a cartoon Short is
  not a launch film). Every command takes `--json` and `--out f.json`.
- Quote the numbers in qa/earshot.md ("strong match, z +3.9; -14.2 LUFS; true peak -4.1 dBFS").
- `earshot forge / fit / sfx / kit` make sounds in code: NOT used here (sounds must be real Openverse recordings).
- The repo also holds earshot's second skill, .claude/skills/real-sound (a full soundtrack process). This repo's
  pipeline is openverse-sfx → real-sfx → earshot; use real-sound only as reference (its licences.md is useful).
