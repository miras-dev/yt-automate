---
description: Make one cut-out cartoon video in 16:9 landscape with subtitles (1-3.5 minutes, or 8-12 minutes for mid-roll ads), research to verified 4K MP4.
argument-hint: [optional "8min" for the 8-12 minute mid-roll format] [optional topic, or the slug of an older vertical video to re-make in 16:9] [optional character name from library/characters]
model: claude-opus-5-5
effort: max
---

Make a longer video in this repo. Input: $ARGUMENTS. Anything over one minute is landscape: 16:9, 1920x1080 rendered
at 3840x2160, with burned-in subtitles. Two formats:
- `long-horizontal` (the default): 1:00-3:30, aim for 2:00-3:00, 4-6 scenes, 60 new pictures.
- `long-midroll`: 8:00-12:00, aim for 8:20-10:00, 10-16 scenes, 100 new pictures. It exists for mid-roll ads, which
  YouTube allows only from 8:00. Use it when the input says "8min", "midroll", "mid-roll" or "long-midroll", or asks
  for 8 minutes or more. Its voice takes 8,000-10,000 ElevenLabs credits.
Ignore a "long-vertical" / "vertical" word in the input (that format is retired) and say so in the report.
The character is the channel mascot (data/channel.json mascot.library, else the first in library/characters); if no
mascot is chosen yet or the library is empty, design and build it first (section 12.1 of the cutout-cartoon-shorts
skill, Part 7.2 of SHORTS_FACTORY_PLAN.md).

1. Topic, package, script: short-script skill in long mode (`--format long-horizontal` or `--format long-midroll`):
   the title and the thumbnail idea first (packaging.md, checked with find_topics.py --similar), then the script that
   delivers them, then voice_budget.py (exit 3: stop and report). Show me the title, the thumbnail idea, the other
   titles, the scene list, the full lines, the word count and the sources, then continue without waiting.
2. Build: cutout-cartoon-shorts skill in scene mode (its section 12; Part 7.3-7.5 of the plan): per-scene voice
   (Zephrael, the same settings for every scene) and timing, library poses first, only new props/sets/special poses
   generated (wide 3:2 / 16:9 set pieces), scenes in <Series> laid out on thirds with faces and payoffs above the
   subtitle band, subtitles per scene from the script and the word times (subtitles.py, section 12.3), music bed +
   sound effects, per-scene checks, full render at 4K 16:9, verified (length inside the format's range, a
   long-midroll video never under 8:00; 3840x2160; subtitles present). Then the thumbnail (section 13.1).
3. Finish: update meta.json (with scenes.durations), run scripts/register.py and `upload.py --slug <slug> --dry-run`
   (it uploads nothing; for long-midroll it suggests ad breaks at scene joins), then report the MP4 path, Remotion
   Studio link, file locations, the title, the thumbnail (qa/thumbnail-preview.png), anything upload.py reports as
   blocked, and what you chose (format, character, scenes, voice, audio tags, new pictures + approximate cost,
   ElevenLabs credits used and left, music and sounds + licences, subtitle checks: share of script words found in
   the voice, any lines where voice and script differ, fastest reading speed, any audio tag read out loud or skipped).
   Publish only when I ask (upload.py, skill section 13.2).

Re-making an older 9:16 video (the input names an existing slug in shorts/ whose format is `long-vertical`): keep its
script, sources, voice takes, word times, sound cues, music and library poses; set meta.json `format` to
`long-horizontal` and `aspect` to `16:9`, move its registry.ts entry to `long-horizontal`, re-lay out every scene for
16:9 against `safeArea` / `subtitleBand` (wider camera framing, sets widened or regenerated as 3:2 / 16:9 set pieces
inside the picture budget), add subtitles, write packaging.md (title + thumbnail idea) and make the thumbnail, then
check and render as above. Keep the old vertical MP4; the new one replaces it in meta.json.

Don't ask questions; stop only if a key/tool is missing, the picture budget (default 60 new images, 100 for
long-midroll) would be exceeded, or voice_budget.py says the ElevenLabs credits would run out.
