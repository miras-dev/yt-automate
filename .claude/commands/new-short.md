---
description: Make one complete cut-out cartoon Short, from topic research and packaging to verified 4K MP4.
argument-hint: [optional topic or "script:<path>"] [optional reference picture path]
model: claude-opus-5-5
effort: max
---

Make a new YouTube Short in this repo. Input: $ARGUMENTS (may be empty). A Short is 9:16 and 20-30 s; anything over
one minute is a 16:9 video made with /new-video instead.

1. Topic, package, script: run the short-script skill (sections 1-4). With no topic it picks a new one using
   data/topics.json (and find_topics.py outliers when YOUTUBE_API_KEY is set); with a topic it researches and verifies
   that one. The title and the frame-0 idea come first (packaging.md), checked against existing videos
   (find_topics.py --similar); the script then delivers them. Show me the title, the frame-0 idea, the other titles,
   the final lines, the word count and the sources, then continue without waiting.
2. Build: follow the cutout-cartoon-shorts skill section by section:
   - Mascot: the channel's own (data/channel.json). If none is chosen yet or the library is empty, design and build
     it first (skill section 12.1) and tell me what you chose.
   - Format: 1080x1920, 60 fps; final 2160x3840 MP4 with voice and sound effects mixed. Length follows the voice
     (20-30 s).
   - Voice: voice_budget.py first (exit 3: stop and report). ElevenLabs, Zephrael (voice id BpZ8aKvwvbZf602CLu11, the
     channel's own voice), natural delivery, the script's audio tags performed as written (checked with audio_tags.py
     first; never sound-effect tags), one take, eleven_v4, word times, every beat timed to its word, every
     vocalization (a gasp, a chuckle) acted on its sound.
   - Beat sheet: one beat per line on the exact word; frame 0 = packaging.md's frame-0 idea, the premise like a
     thumbnail; one funny gag per beat; last frame loops to the first.
   - Pictures: Gemini, keyed to transparent cut-outs, 4K. The mascot hero (or the closest library pose) is the
     reference for every character picture. Every pose/expression, every moving prop and every set piece as its own
     picture, the same flat style everywhere. Check every cut-out on the sheet next to the mascot hero and fix
     glitches before animating.
   - Animation: 2.5D camera with real depth, poses swapped inside motion, real physics, all effects drawn in code in
     the same flat style, depth-of-field on close-ups, gentle shake on impacts. Characters breathe and react; objects
     get faces when it makes the joke better. No motion blur, no fades between drawings.
   - Sound: Openverse sounds via openverse-sfx, placed with real-sfx on the T table, checked with earshot; quiet under
     the voice; big sounds in pauses; credits.txt written.
   - Check: contact sheet + pop scan + earshot mix check; fix anything off.
   - Render 4K on the GPU and verify it (video/scripts/render.mjs).
3. Finish: update meta.json, run scripts/register.py and `upload.py --slug <slug> --dry-run` (it uploads nothing), and
   tell me: the MP4 path, the Remotion Studio link (npx remotion studio in video/), where the files are, the title and
   the description, anything upload.py reports as blocked, and what you chose (voice, audio tags and when they land,
   beats, pictures + model + approximate cost, sounds + licences, ElevenLabs credits used and left). Publish only
   when I ask (upload.py, skill section 13.2).
Don't ask me questions; choose sensible defaults. Stop only if a key/login/tool is missing, the picture budget in
meta.json would be exceeded, or voice_budget.py says the ElevenLabs credits would run out.
