---
description: Make one complete cut-out cartoon Short, from topic research to verified 4K MP4.
argument-hint: [optional topic or "script:<path>"] [optional reference picture path]
model: claude-opus-5-5
effort: max
---

Make a new YouTube Short in this repo. Input: $ARGUMENTS (may be empty). A Short is 9:16 and 20-30 s; anything over
one minute is a 16:9 video made with /new-video instead.

1. Script: if no script was given, run the short-script skill (it picks a new topic using data/topics.json).
   If a topic was given, research and verify it with the same skill. Show me the idea, the final lines, the word
   count and the sources, then continue without waiting.
2. Build: follow the cutout-cartoon-shorts skill section by section:
   - Format: 1080x1920, 60 fps; final 2160x3840 MP4 with voice and sound effects mixed. Length follows the voice
     (20-30 s).
   - Voice: ElevenLabs, a normal natural English male voice (not deep, not a narrator), one take, eleven_v4, word
     times, every beat timed to its word.
   - Beat sheet: one beat per line on the exact word; frame 0 = premise like a thumbnail; one funny gag per beat;
     last frame loops to the first.
   - Pictures: Gemini, keyed to transparent cut-outs, 4K. Every pose/expression, every moving prop and every set piece
     as its own picture, same character and flat style everywhere. Hero picture first if no reference was given.
     Check every cut-out on the sheet and fix glitches before animating.
   - Animation: 2.5D camera with real depth, poses swapped inside motion, real physics, all effects drawn in code in
     the same flat style, depth-of-field on close-ups, gentle shake on impacts. Characters breathe and react; objects
     get faces when it makes the joke better. No motion blur, no fades between drawings.
   - Sound: Openverse sounds via openverse-sfx, placed with real-sfx on the T table, checked with earshot; quiet under
     the voice; big sounds in pauses; credits.txt written.
   - Check: contact sheet + pop scan + earshot mix check; fix anything off.
   - Render 4K on the GPU and verify it (video/scripts/render.mjs).
3. Finish: update meta.json, run scripts/register.py, and tell me:
   the MP4 path, the Remotion Studio link (npx remotion studio in video/), where the files are, and what you chose
   (voice, beats, pictures + model + approximate cost, sounds + licences, ElevenLabs credits).
Don't ask me questions; choose sensible defaults. Stop only if a key/login/tool is missing or the picture budget in
meta.json would be exceeded.
