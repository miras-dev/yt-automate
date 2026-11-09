---
description: Make one 2-3 minute cut-out cartoon video (vertical Short or horizontal video), research to verified 4K MP4.
argument-hint: [long-vertical|long-horizontal] [optional topic] [optional character name from library/characters]
---

Make a longer video in this repo. Input: $ARGUMENTS. Default format long-vertical; default character = the first in
library/characters (if the library is empty, build it first: section 12.1 of the cutout-cartoon-shorts skill,
Part 7.2 of SHORTS_FACTORY_PLAN.md).

1. Script: short-script skill in long mode for the chosen format. Show me the idea, scene list, full lines, word count
   and sources, then continue without waiting.
2. Build: cutout-cartoon-shorts skill in scene mode (its section 12; Part 7.3-7.5 of the plan): per-scene voice and timing, library poses first,
   only new props/sets/special poses generated, scenes in <Series>, music bed + sound effects, per-scene checks,
   full render at 4K for the format, verified (including the 3:00 rule).
3. Finish: update meta.json, run scripts/register.py, report the MP4 path, Remotion Studio link, file locations, and
   what you chose (format, character, scenes, voice, new pictures + approximate cost, music and sounds + licences).
Don't ask questions; stop only if a key/tool is missing or the picture budget (default 60 new images) would be exceeded.
