---
description: Make one 1-3.5 minute cut-out cartoon video in 16:9 landscape with subtitles, research to verified 4K MP4.
argument-hint: [optional topic, or the slug of an older vertical video to re-make in 16:9] [optional character name from library/characters]
model: claude-opus-5-5
effort: max
---

Make a longer video in this repo. Input: $ARGUMENTS. Anything over one minute is landscape: the format is always
`long-horizontal` (16:9, 1920x1080 rendered at 3840x2160, 1:00-3:30, aim for 2:00-3:00), with burned-in subtitles.
Ignore a "long-vertical" / "vertical" word in the input (that format is retired) and say so in the report.
Default character = the first in library/characters (if the library is empty, build it first: section 12.1 of the
cutout-cartoon-shorts skill, Part 7.2 of SHORTS_FACTORY_PLAN.md).

1. Script: short-script skill in long mode (`--format long-horizontal`). Show me the idea, scene list, full lines, word
   count and sources, then continue without waiting.
2. Build: cutout-cartoon-shorts skill in scene mode (its section 12; Part 7.3-7.5 of the plan): per-scene voice
   (Zephrael, the same settings for every scene) and timing, library poses first, only new props/sets/special poses
   generated (wide 3:2 / 16:9 set pieces), scenes in <Series> laid out on thirds with faces and payoffs above the
   subtitle band, subtitles per scene from the script and the word times (subtitles.py, section 12.3), music bed +
   sound effects, per-scene checks, full render at 4K 16:9, verified (length 1:00-3:30, 3840x2160, subtitles present).
3. Finish: update meta.json, run scripts/register.py, report the MP4 path, Remotion Studio link, file locations, and
   what you chose (character, scenes, voice, new pictures + approximate cost, music and sounds + licences, subtitle
   checks: share of script words found in the voice, any lines where voice and script differ, fastest reading speed).

Re-making an older 9:16 video (the input names an existing slug in shorts/ whose format is `long-vertical`): keep its
script, sources, voice takes, word times, sound cues, music and library poses; set meta.json `format` to
`long-horizontal` and `aspect` to `16:9`, move its registry.ts entry to `long-horizontal`, re-lay out every scene for
16:9 against `safeArea` / `subtitleBand` (wider camera framing, sets widened or regenerated as 3:2 / 16:9 set pieces
inside the picture budget), add subtitles, then check and render as above. Keep the old vertical MP4; the new one
replaces it in meta.json.

Don't ask questions; stop only if a key/tool is missing or the picture budget (default 60 new images) would be exceeded.
