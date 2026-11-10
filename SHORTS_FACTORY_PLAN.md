# Shorts Factory: cut-out cartoon YouTube Shorts from one repo

A single GitHub repository that takes a Short from "find a topic" to "finished 4K MP4" with Claude Code, and has a small
dashboard listing every Short you made, what it cost and how it performed.

No Higgsfield. The tools are:

| Job | Tool |
|---|---|
| Topic research + script | Claude Code (web search) |
| Character / prop / set pictures | Gemini API (`GEMINI_API_KEY`), Nano Banana Pro or Nano Banana 2, then keyed to transparent PNGs in code |
| Voice | ElevenLabs (connector or API) |
| Finding sound effects | `openverse-sfx` skill (Varnan-Tech/opendirectory): free CC0 / CC-BY / public-domain audio + credits.txt |
| Placing sound effects on the exact frame | `real-sfx` skill (Clipwing/skills) |
| Listening / checking the mix | `earshot` (Leonxlnx/earshot): MCP server + skills |
| Animation + render | Remotion 4 (React/TypeScript) |
| Dashboard | Next.js app in the same repo |

How to use this file: create an empty repo, open it in Claude Code, paste **Part 0** as your first message. Claude Code
builds the whole repo from Parts 1–5. After that, every new video is just `/new-short`.

---

## Part 0 - Bootstrap prompt (paste this into Claude Code in the empty repo)

```
Read SHORTS_FACTORY_PLAN.md in this repo (it is the file I just added) and build the repository it describes:

1. Create the folder structure in Part 1 exactly.
2. Write CLAUDE.md, README.md and .env.example from Part 1.
3. Write the skills/commands from Parts 2, 3, 4 and 7 into the paths given there, with every script file they list
   (gen_image.py, key.py, sheet.py, prep.py, words.py, register.py). Make the scripts runnable; test each one on a tiny
   dummy input. Make the Remotion helpers and register.py support every format in Part 7 from the start.
4. Install the three external skills from their ORIGINAL repos only (Part 1, "External skills"), read each one's
   SKILL.md / README, and note in CLAUDE.md the exact commands and file formats each one expects.
5. Create the Remotion project in video/ and the Next.js dashboard in dashboard/ (Part 5).
6. Set up .gitignore so renders, raw pictures and downloaded sounds are not committed.
7. Do NOT generate any pictures or voice yet. Stop when `npm run dashboard` shows an empty list and
   `python scripts/check_setup.py` reports which keys / tools are still missing.

Tell me what you built and what I still have to do by hand (keys, logins).
```

(Save this whole document into the repo as `SHORTS_FACTORY_PLAN.md` first.)

---

## Part 1 - Repository layout

```
shorts-factory/
├─ CLAUDE.md                     # rules Claude Code always follows in this repo
├─ README.md
├─ SHORTS_FACTORY_PLAN.md        # this document
├─ .env.example                  # GEMINI_API_KEY=, ELEVENLABS_API_KEY= (optional), YOUTUBE_API_KEY= (optional)
├─ .claude/
│  ├─ commands/
│  │  ├─ new-short.md            # Part 4: the one command that makes a Short
│  │  └─ new-video.md            # Part 7: 1-3.5 minute videos (16:9 landscape, subtitles)
│  └─ skills/
│     ├─ short-script/SKILL.md   # Part 2: topic research + script
│     ├─ cutout-cartoon-shorts/  # Part 3: pictures, voice, animation, sound, render
│     │  ├─ SKILL.md
│     │  └─ scripts/ gen_image.py  key.py  sheet.py  prep.py  words.py  register.py
│     ├─ real-sfx/               # external, copied from Clipwing/skills
│     ├─ openverse-sfx/          # external, copied from Varnan-Tech/opendirectory
│     └─ earshot/ ...            # external, from Leonxlnx/earshot (plus its MCP server)
├─ data/
│  ├─ topics.json                # every topic ever used (so ideas never repeat)
│  └─ shorts.json                # index the dashboard reads (built by register.py)
├─ shorts/
│  └─ <yyyy-mm-dd>-<slug>/
│     ├─ meta.json               # status, topic, category, cost, durations, files, YouTube URL, stats
│     ├─ script.md               # final voiceover + one-line idea + word count
│     ├─ sources.md              # links that support the fact
│     ├─ beats.md                # beat sheet table
│     ├─ prompts.md              # every picture prompt
│     ├─ credits.txt             # sound attributions (paste into the YouTube description)
│     ├─ images/ ref/ raw/       # (gitignored) source pictures
│     └─ qa/                     # contact sheet, pop-scan report, earshot report (small PNG/JSON, committed)
├─ library/
│  └─ characters/<name>/         # reusable keyed poses + hero.png + poses.json (Part 7), committed
├─ sfx-library/                  # (gitignored) sounds downloaded from Openverse, by category
│  └─ music/                     # (gitignored) CC0 / CC-BY music beds for long videos
├─ video/                        # Remotion 4 project
│  ├─ src/Root.tsx               # registers one composition per Short
│  ├─ src/lib/                   # shared: Layer, camera, physics, effects, faces, sound cues
│  ├─ src/<slug>/                # per-Short composition, sprites.ts, T table
│  └─ public/<slug>/             # trimmed sprites, vo/, sfx/
├─ out/                          # (gitignored) final 4K MP4s
├─ dashboard/                    # Next.js app (Part 5)
└─ scripts/check_setup.py        # checks keys, python libs, ffmpeg, GPU, external skills
```

### External skills (install from these repos only)

- real-sfx: `https://github.com/Clipwing/skills` → copy `skills/real-sfx` into `.claude/skills/real-sfx`
- openverse-sfx: `https://github.com/Varnan-Tech/opendirectory` → copy `skills/openverse-sfx` into `.claude/skills/openverse-sfx`
- earshot: `https://github.com/Leonxlnx/earshot` → follow its README for the MCP server and its skills (ignore forks)
- Openverse audio itself: only `api.openverse.org`

Read each SKILL.md and its scripts before first use.

### CLAUDE.md (write this file)

```markdown
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
```

### .gitignore additions

```
.env
out/
sfx-library/
shorts/*/images/
video/public/*/
node_modules/
```

---

## Part 2 - Skill `short-script` (was STEP 1)

Path: `.claude/skills/short-script/SKILL.md`

```markdown
---
name: short-script
description: Research a surprising fact or curious question and write one 20-30 second YouTube Shorts voiceover
  (50-70 words) for a simple 2D cut-out cartoon. Use when making a new Short or when asked for a Shorts script or topic.
---

# Short script

## 1. Pick a topic
- Read data/topics.json first. Never reuse a topic or a close variation of one, and rotate categories
  (science, animals, history, human body, space, engineering, everyday mysteries). Pick a category that is not
  among the last 3 used.
- Search the web for 5-8 candidate ideas. Good ones look like "Why don't we throw trash into volcanoes?": a simple
  solution people assume would work, and a surprising reason it doesn't. Other good shapes: an everyday mystery,
  a strange animal ability, an engineering choice that looks wrong but isn't.
- Score each idea 1-5 on: surprising answer, explainable in 25 seconds, easy to show with simple 2D cut-outs
  (one character + 1-3 objects + one setting), needs no background knowledge. Keep the highest total.

## 2. Verify
- Confirm the central fact in at least two reliable sources: original research, universities, museums, government
  agencies, established science organisations. Encyclopedias / news only as a cross-check.
- Do not invent facts, numbers, quotes or consequences. Where the science is uncertain, say so in the script
  ("probably", "most of it").
- If you cannot browse, say so and stop. Never pretend to have researched.

## 3. Write the voiceover (50-70 words, 20-30 s, 6-9 short lines)
- Line 1 is a specific question or surprising statement that names what we see in frame 0. No greeting.
- Build curiosity: what would happen, why the obvious answer is wrong, what makes it odd. Then a clear, satisfying
  answer near the end. The payoff lands on the last words.
- Plain, spoken English, short connected sentences. Casual words ("so", "basically", "right?") are allowed where
  they sound natural, never required. Every sentence adds information.
- Banned: "Did you know", "This will blow your mind", "You won't believe", "here's the thing", "but here's the part",
  hype words (incredible, shocking, amazing, insane), "!" lines, calls to action, AI-sounding phrases.
- Original wording only; never copy another creator's script.

## 4. Output (write files, then show the user)
- shorts/<date>-<slug>/script.md: one-sentence idea, the voiceover (one line per beat, no scene directions),
  word count.
- shorts/<date>-<slug>/sources.md: the links, each with one line on what it supports.
- shorts/<date>-<slug>/meta.json: {slug, date, title, category, topic, status: "script", word_count}.
- Append {slug, topic, category, date} to data/topics.json. Run scripts/register.py.
```

---

## Part 3 - Skill `cutout-cartoon-shorts` (was STEP 2, rewritten without Higgsfield)

Path: `.claude/skills/cutout-cartoon-shorts/SKILL.md`

````markdown
---
name: cutout-cartoon-shorts
description: Turn a short script into a vertical 2D cut-out cartoon Short (style of "Can we throw trash in a volcano?"):
  Gemini cut-out pictures keyed to transparency, the channel's ElevenLabs voice (Zephrael), Remotion animation (2.5D multiplane
  camera, squash-swap poses, real physics, code-drawn effects, faces on objects), real Openverse sound effects placed
  with real-sfx and checked with earshot, 4K vertical render. Use for any cartoon / cut-out Short in this repo.
---

# Cut-out cartoon Shorts

Output: 1080x1920 composition, 60 fps, rendered at 2160x3840. A flat cartoon character (thick black outlines, flat
colours) acts out the script. Every pose and expression is its own picture; motion, camera, physics, effects and timing
are code. Read the whole file once, then follow the order. Update meta.json status after each section.

## 0. Setup check
Run `python scripts/check_setup.py`. It needs: GEMINI_API_KEY in .env; ElevenLabs connector (tools
creative_list_voices / creative_generate_speech / creative_get_flow_run_status) or ELEVENLABS_API_KEY;
python libs `google-genai pillow numpy opencv-python faster-whisper`; ffmpeg (Remotion ships one in
node_modules/@remotion/compositor-*); the real-sfx, openverse-sfx and earshot skills. Stop and report if any is missing.

## 1. Script → beat sheet
- Input: shorts/<slug>/script.md (from short-script). Keep the lines; only fix words that would make a voice over-act.
- 20-30 s = 6-9 lines. One visual beat per line, landing on the exact word ("throw" = the throw).
- Frame 0 = the premise (character + the thing + the setting), centred, readable like a thumbnail. No intro.
- As few cuts as possible; one continuous camera move is best. A cut only for a new shot (e.g. reaction close-up).
- One gag per beat a kid would laugh at: an object opens its eyes, inhales before a blast, "> <" eyes, sweat drop,
  smug smoke ring, the thing comes back. The last frame loops to frame 0.
- List every picture needed (section 3).
- Done = shorts/<slug>/beats.md: table of time / words / on screen / picture / sound.

## 2. Voice + word times
- Voice: Zephrael (ElevenLabs voice id BpZ8aKvwvbZf602CLu11), the channel's own cloned voice (English, young
  female), for every Short and every long video unless the user names another voice for that video. Natural delivery,
  plain text (no tags that make it over-act). Model eleven_v4, generations_count 1, the same voice settings for every
  take. If Zephrael is not on the account, stop and report; never swap in another voice silently.
- Poll creative_get_flow_run_status, download content_url to video/public/<slug>/vo/take1.mp3.
- Word times: `python scripts/words.py <mp3>` (faster-whisper word_timestamps=True). Whisper edges are ±0.2 s, so
  words.py also finds real pauses by loudness (RMS every 20 ms, silence < -42 dB for ≥ 0.18 s) and snaps to them.
- Voice starts at 0.1 s. Write every beat as a constant in video/src/<slug>/timing.ts:
  `export const T = {turn: 2.05, release: 3.7, land: 4.8, ...}`. Composition length = voice end + 0.5 s.
  Big sounds go into pauses, not on top of words.
- Done = take1.mp3 + words.json + timing.ts.

## 3. Pictures (Gemini → keyed transparent cut-outs)
Gemini image models do not output real transparency, so every picture is generated on a flat key colour and keyed
in code.

- Model: `gemini-3-pro-image-preview` (best) or `gemini-3.1-flash-image-preview` (cheaper). image_size "4K"
  (uppercase K). Aspect: full body 2:3, waist-up 4:5, props 1:1, wide set pieces 3:2.
- References: pass 1-2 crops with `--ref` (one panel each, never a whole collage). No reference? Make ONE hero
  picture of the main character, check it, then use it as the reference for every other pose.
- Key colour: light blue #9BCFFD by default; if the subject contains blue, use green #3CD070.
- Prompt = what is different in THIS picture + a fixed STYLE block (same words every time):

```
STYLE_CHAR = "Flat 2D cartoon in exactly the same drawing style as the reference images: the same simple white
character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with
rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side,
small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue only when the
mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border. On a plain flat solid
light-blue background (#9BCFFD), nothing else: no sky, no ground, no floor shadow, no checkerboard."
STYLE_OBJ = "Flat 2D cartoon in exactly the same drawing style as the reference images: thick smooth black outlines of
even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no
characters. On a plain flat solid light-blue background (#9BCFFD), nothing else: no sky, no ground, no floor shadow,
no checkerboard."
```

- Pose prompt: framing ("Full body, three-quarter view facing to the right") + expression ("scared: eyebrows tilted
  up in the middle, wide eyes, mouth wide open") + exact hands ("the hand on the RIGHT side of the image holds ...")
  + "Whole body in frame with a margin". Say "on the left side of the image", never "his left".
- Generate: `python scripts/gen_image.py NAME ASPECT "PROMPT" --kind char|obj [--ref a.png --ref b.png]
  [--model pro|flash]` → shorts/<slug>/images/raw/NAME.png. Run several in parallel (background jobs + wait).
- Key: `python scripts/key.py raw/NAME.png cut/NAME.png` (flat background connected to the border → transparent;
  un-blend the black outline edge so no blue fringe).
- Picture list for one gag: every pose the story needs (each its own picture); every prop that moves on its own,
  alone; set pieces alone; small dressing in one picture, split later.
- Two poses that must line up (same pose with/without the object): make the second as an EDIT of the first
  (`--ref raw/first.png`, prompt "the same picture with the bag removed, the hand now empty and open, everything else
  identical, same background colour"), then align them (section 4).
- Check: `python scripts/sheet.py` → qa/sheet.png (all cut-outs on a coloured background). Look for fringe, holes,
  half-transparent fills, wrong hands, style drift. Regenerate failures.
- Log every prompt in prompts.md and the image count + model in meta.json (cost estimate: Pro 4K ≈ $0.24/image,
  check current Gemini pricing).
- Done = every picture passes the sheet check.

## 4. Prep (scripts/prep.py → video/src/<slug>/sprites.ts)
- Trim each PNG to its alpha box + 12 px, save to video/public/<slug>/, keep the trim offset.
- HEAD = largest inscribed disc of the hole-filled silhouette; scale every pose so head radius matches → swaps never
  change head size:

```python
a8 = (alpha > 128).astype(np.uint8); ff = a8.copy()
cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
solid = np.where(ff == 2, 0, 1).astype(np.uint8)
dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
hy, hx = np.unravel_index(dt.argmax(), dt.shape); head = (hx, hy, dt[hy, hx])
```
- FEET = middle of opaque pixels in the bottom 3.5 % rows; full-body poses share the world feet point; waist-up poses
  put their head where the full-body head is.
- Grip points: alpha extreme points (argmax(x - y) = raised hand top-right) or a marked-up sheet. Flying-object
  sprites are scaled to match the object drawn in the pose (widest dark row).
- Edited pose pairs: ECC affine on the head region:

```python
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(B_gray, A_gray, warp, cv2.MOTION_AFFINE, (3, 500, 1e-6), head_mask, 5)
# warp maps B -> A; invert it and draw A inside B's canvas with CSS matrix(a, b, c, d, e, f)
```
- Set pieces: measure what effects need (an opening = ellipse of its inner colour band; the top profile every 25 px
  so falling things land on the surface).

## 5. The world: 2.5D multiplane camera (video/src/lib/Layer.tsx)
Each picture is a flat layer at depth Z; camera (x, y, z); layer scale k = F / (Z - z), F = 1000. At camera
(540, 960, 0) a layer at Z 1000 shows 1 world px as 1 screen px.

```tsx
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children: React.ReactNode}> =
  ({cam, z, blur = 0, minDepth = 300, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
      <div style={{position: 'absolute', transformOrigin: '0 0',
        transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
```
- Depths: foreground 650, character 1000, mid ground 1800, set piece + horizon 3000; sky = screen-space gradient.
  Ground = flat bands, only the far one has the black horizon line; the far band covers the set piece's base.
- Camera: piecewise eased moves; interpolate scale in log space; easeInOutCubic for glides, easeOutCubic for a blast
  pull-back; holds perfectly still. Camera glides ≥ 1 s.
- Depth of field: blur far layers 2.5-3.6 px only while close on the character.
- Flying past the character: hide layers closer than ~300; tilt up slightly ahead of the dolly.
- After a hard cut you may shift far layers so the important thing shows beside the head (shift anything that comes
  from there the same way).
- Shake = sums of sines (13.3 + 7.1 Hz ...) × envelope. Never random per-frame jumps.

## 6. Animating cut-out poses
- NEVER cross-fade two drawings. Swap on a frame where motion hides it:
  turn = squash scaleX 0.8 (scaleY 1.03) about the feet, swap at narrowest; action = anticipation squash (Y 0.94,
  X 1.04) → swap → stretch 1.03 → damped spring; throw = swap to follow-through at release, lean -5° → +5° → settle;
  catch = swap to the holding pose the frame the object reaches the hand, plus a small weight dip.
- Life on holds: breathing (scaleY 1 ± 0.9 % at ~0.6 Hz), tremble when scared (1-2 px sines), bounce on a key word.
- Contact shadow under full-body poses: soft ellipse rgba(72, 54, 42, 0.26), 3 px blur.

## 7. Props with real physics
- Thrown objects are their own sprite at their own depth. Swing a few frames along an arc behind the head, then a 3D
  projectile: x and z at constant speed, y on a gravity parabola with the apex at a chosen fraction of the flight:

```ts
const g = (2 * (y0 - y1)) / (ta * ta - (T - ta) * (T - ta)); // ta = apex time, T = flight time
const ya = y0 - 0.5 * g * ta * ta;
const y = (tau: number) => ya + 0.5 * g * (tau - ta) * (tau - ta);
```
- Spin ~1 turn; perspective does the shrinking. Sinking into liquid: clip at the surface with an overflow-hidden
  wrapper, keep moving down with a wobble. A return flight ends EXACTLY on the object drawn in the next pose.

## 8. Effects in code (flat cartoon look; pick what the topic needs)
General rules: same outline weight as the pictures; flat colours; no gradients on characters; outlined things grow
and SHRINK away, never fade; effects stop when their beat is over.
- Liquids (water, lava, slime): flat shapes without outline, a deep edge colour + a lighter core; drops are blobs
  with gravity, stretched along velocity, leaving a shrinking splat.
- Gas (smoke, steam, breath, dust): circle clusters with ONE merged outline (all ink circles first, then all fills).
  White = steam, mid-grey = smoke. Pulses with gaps, different speeds per jet.
- Particles (sparks, crumbs, bubbles, snow): bursts with random angle/speed, gravity or buoyancy, short life.
- Energy (electricity, heat, light): zig-zag polylines redrawn every few frames, radial-gradient glows at low opacity.
- Flows: thick round-capped paths revealed along their length (deep under, main, hot core on top), routed around faces.
- Impacts: a few speed lines + a flat star burst for 4-6 frames + shake bump.
- Eruptions/blasts: a "crown" of pulsing fingers fanning out + spray + dark smoke + sky glow, never one tall column.
- Faces on objects: white ellipses + black pupils + glint; eyelids clipped to the eye with a black lid line (tilt =
  angry); thick round brows; pop open with overshoot; blink; look at the action; "> <" when squeezed; smug = half
  lids. Objects can inhale (stretch up 6 %) before a blast and squash to 0.9 on it.
- Sweat drop: light-blue outlined teardrop with a glint; pops on, slides, pops off.
Example: the volcano Short used lava (#FF6A2B, edge #E2501E, core #FFA445 / #FFC867), smoke rings, a lava crown.

## 9. Sound (Openverse → real-sfx → earshot)
1. From beats.md list the sound cues: name, T key, kind (whoosh / impact / bed / blast), target dB.
   Levels under the voice: whooshes -25 to -31 dB, impacts -14 to -19 dB, beds -26 to -33 dB, a big blast -8 to -10 dB
   inside a pause.
2. Find sounds with the openverse-sfx skill: sound_effect category, licences CC0 / CC-BY / public domain only
   (commercial use, no NC, no ND). 3-5 candidates per cue into sfx-library/<category>/. Reuse the library before
   downloading more.
3. Pick the best candidate per cue with earshot (clean onset, no music or voices under it, right length). Trim,
   peak-normalise to -1 dBFS, copy to video/public/<slug>/sfx/.
4. Export the cues from timing.ts in the format real-sfx expects (read its SKILL.md) and let real-sfx place each
   sound on its frame: impacts by onset, whooshes by peak. timing.ts stays the only source of times.
5. Render the cue list in Remotion:

```tsx
<Sequence from={Math.round(c.at * FPS)} layout="none">
  <Audio src={staticFile(`${slug}/sfx/${c.f}.wav`)}
    volume={(f) => 10 ** (dbAt((Math.round(c.at * FPS) + f) / FPS) / 20)} />
</Sequence>
```
6. Write every CC-BY attribution into shorts/<slug>/credits.txt.

## 10. Check, then render
- Contact sheet: renderStill at every beat (scale 0.5) in one grid → qa/contact.png. Check frame 0, every swap, every
  gag, the last frame.
- Pop scan: 0.5x preview MP4, mean frame-to-frame difference (blurred, 270x480), flag frames above 2.2x the local
  median → qa/popscan.json. Every flag must be an intended swap or cut.
- Mix check: earshot on the preview → qa/earshot.md (voice clear, effects under it, blast in the pause, peak around
  -4 dBFS, no clipping).
- Render: `npx remotion render src/index.ts <CompId> ../out/<slug>-4K.mp4 --scale=2 --gl=angle --image-format=png
  --crf=16 --pixel-format=yuv420p` (bundle once to a fixed outDir in scripts).
- Verify: 2160x3840, 60 fps, frames = duration × 60, audio present and as long as the picture, still moving at the end.
- Update meta.json (status "rendered", duration, image count, model, voice id, ElevenLabs credits, sounds used,
  render path), run register.py.

## 11. Rules that keep it hand-made
- Frame 0 = premise, centred, big; the first line names what you see.
- Centred and balanced on holds; nothing important cut by the edge.
- No motion blur, no cross-fades between drawings, no random jitter; every move eased.
- One focal action at a time.
- Every visual on its word; payoff on the last word; last frame loops to the first.
- Real facts only in the voiceover.
````

---

## Part 4 - Command `/new-short` (was STEP 3)

Path: `.claude/commands/new-short.md`

```markdown
---
description: Make one complete cut-out cartoon Short, from topic research to verified 4K MP4.
argument-hint: [optional topic or "script:<path>"] [optional reference picture path]
---

Make a new YouTube Short in this repo. Input: $ARGUMENTS (may be empty).

1. Script: if no script was given, run the short-script skill (it picks a new topic using data/topics.json).
   If a topic was given, research and verify it with the same skill. Show me the idea, the final lines, the word
   count and the sources, then continue without waiting.
2. Build: follow the cutout-cartoon-shorts skill section by section:
   - Format: 1080x1920, 60 fps; final 2160x3840 MP4 with voice and sound effects mixed. Length follows the voice
     (20-30 s).
   - Voice: ElevenLabs, Zephrael (voice id BpZ8aKvwvbZf602CLu11, the channel's own voice), natural delivery, one
     take, eleven_v4, word times, every beat timed to its word.
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
   - Render 4K on the GPU and verify it.
3. Finish: update meta.json, run scripts/register.py, and tell me:
   the MP4 path, the Remotion Studio link (npx remotion studio in video/), where the files are, and what you chose
   (voice, beats, pictures + model + approximate cost, sounds + licences, ElevenLabs credits).
Don't ask me questions; choose sensible defaults. Stop only if a key/login/tool is missing or the picture budget in
meta.json would be exceeded.
```

---

## Part 5 - Dashboard (dashboard/, Next.js)

Goal: one page that shows every Short and how it did, read straight from the repo (no database needed to start).

**Data:** `scripts/register.py` reads every `shorts/*/meta.json` and writes `data/shorts.json`. meta.json fields:

```json
{
  "slug": "2026-11-10-why-dont-ships-sink",
  "title": "Why don't steel ships sink?",
  "category": "engineering",
  "status": "rendered",
  "date": "2026-11-10",
  "duration_s": 24.6,
  "word_count": 63,
  "voice": {"name": "Zephrael", "id": "BpZ8aKvwvbZf602CLu11", "credits": 0},
  "images": {"model": "gemini-3-pro-image-preview", "count": 11, "est_usd": 2.64},
  "sounds": [{"cue": "splash", "source": "openverse", "license": "CC0"}],
  "files": {"render": "out/....mp4", "contact": "shorts/.../qa/contact.png"},
  "youtube": {"url": "", "video_id": "", "published": ""},
  "stats": {"views": 0, "likes": 0, "comments": 0, "avg_view_pct": null, "updated": ""}
}
```

**Pages:**
- `/` - table of all Shorts: thumbnail (frame 0 from qa/contact.png), title, category, status pill, date, duration,
  cost, views, likes. Filters by status and category; totals at the top (Shorts made, total spend, total views,
  average views per Short, best category).
- `/short/[slug]` - script, sources, beat sheet, contact sheet, prompts, credits.txt (copy button for the YouTube
  description), the MP4 player if the file exists locally, and the stats history.
- `/topics` - every topic used, by category, so you can see the rotation.

**Outcomes:** start by pasting the YouTube URL into meta.json after upload. Later, add `scripts/youtube_stats.py`
(YouTube Data API v3, `videos.list` part=statistics) to refresh views/likes/comments for every published Short and
append a dated snapshot to meta.json; run it daily with a scheduled task. Average-view-percentage needs the YouTube
Analytics API (OAuth), so leave it for a later step.

Run: `npm run dashboard` from the repo root (script: `cd dashboard && next dev`). Style: dark, simple, one accent
colour; works on a phone.

---

## Part 6 - (reserved for later: upload automation)

## Part 7 - Longer videos (1-3.5 minutes, 16:9)

The same pipeline, with scenes. Rule: anything over one minute is landscape. Two formats, set in meta.json as
`"format"`:

| format | aspect / size | length | where it shows | use for |
|---|---|---|---|---|
| `short` | 9:16, 1080x1920 → 2160x3840 | 20-30 s | Shorts feed | one surprising fact |
| `long-horizontal` | 16:9, 1920x1080 → 3840x2160 | 1:00-3:30 (aim for 2:00-3:00) | normal video | stories and explainers with 3-6 steps, channel watch time |

Why: YouTube treats only square or vertical uploads of 3 minutes or less as Shorts, so a 16:9 video is a normal video
at any length and needs no 3:00 rule. Long videos show burned-in subtitles (7.3). `long-vertical` (9:16, under 3:00)
was the earlier choice for 1-3 minute videos; it is retired and stays in the code only so videos made with it still
build and register.

### 7.1 Script (short-script skill, long mode)
- Pass `--format long-horizontal`. Topic needs enough depth for 4-6 steps (a chain of causes, a
  "what would happen if" with several stages, a history with a twist). Score ideas on depth as well as surprise.
- ~150 spoken words per minute: 150-520 words (aim for 300-450). Split into 4-6 scenes of 20-40 s. Write files as
  script.md with `Idea:`, `## Scene 1 - <name>` headings, the lines, and `Words: N` per scene. The lines are shown word
  for word as subtitles, so write numbers and names the way they should read on screen.
- Scene 1 opens on the premise like a Short. Every scene ends with a small open question that the next scene answers
  ("so why doesn't that work?"). The main payoff still lands at the end.
- Same research rules: every fact in sources.md, cross-checked; more facts means more checking.

### 7.2 Character library (do this once, reuse forever)
- Make the hero character, then a standard pose set: idle, talking (2 mouth shapes), pointing left, pointing right,
  shrug, thinking, scared, happy, surprised, walking (2 frames), holding-object (empty hand open to receive a prop),
  close-up talking, close-up reacting. All keyed, trimmed and measured (head, feet, grip points) by prep.py.
- Save to library/characters/<name>/ with poses.json (file, framing, head, feet, grips, prompt used).
- New videos reuse library poses and only generate the props, set pieces and any special poses they need
  (as edits of a library pose so they match). This keeps a 3-minute video to roughly 2-3x the picture cost of a Short.
- Style drift check: every new picture goes on the sheet next to the library hero before use.

### 7.3 Build (cutout-cartoon-shorts skill, scene mode)
- Composition size from the format (16:9). Lay out against safe areas: thirds and wider sets (3:2 / 16:9 set pieces,
  more ground bands); faces and payoffs stay above the subtitle band at the bottom.
- Subtitles: burned-in, flat style (white Nunito ExtraBold, black outline, at most two rows, bottom centre, screen
  space). Text = the script's own words, timing = the voice's word times: subtitles.py aligns each scene's script lines
  to its words.json and cuts them into phrases at sentence ends, commas and pauses; it reports lines where the voice
  and the script differ. Each scene shows its subtitles.json with `<Subtitles>`.
- One Remotion component per scene in video/src/<slug>/scenes/, played with `<Series>`. Each scene has its own
  timing.ts T table (times relative to the scene start) and its own camera plan.
- Voice: generate one ElevenLabs take per scene (same voice, same settings) so one scene can be fixed alone. Word times
  per scene. Join with 0.25-0.4 s gaps; the scene boundaries are where cuts go.
- Cuts are normal now: hard cut or a quick whip (camera pan with a whoosh) between scenes, still no cross-fades
  between drawings. Inside a scene keep the "one continuous move" rule.
- Keep variety without new pictures: change camera distance per scene (wide → medium → close), recolour the sky,
  reuse set pieces from new angles (mirror), let props and code effects carry the new information. A simple on-screen
  label or number is allowed in long videos when it helps the explanation (flat style, same outline).
- Life over time: blink on long holds, swap between the two talking mouth shapes on voiced words (from words.json),
  small idle moves every few seconds so nothing freezes.

### 7.4 Sound for long videos
- Add a music bed: instrumental, calm, CC0 or CC-BY only (Openverse music / Jamendo via openverse-sfx), -30 to -34 dB
  under the voice, ducked 3-4 dB more on dense lines, raised slightly in scene gaps, faded only at the very end.
  Attribution in credits.txt.
- Sound effects as before, cues per scene; real-sfx places them from each scene's T table plus the scene offset.
- earshot on the full mix: voice clarity across the whole length, music never fighting the voice, no level jumps at
  scene joins.

### 7.5 Checks, render, dashboard
- Contact sheet per scene (qa/contact-scene-N.png) + one overview strip. Pop scan on the whole preview; every flag must
  be a planned cut or swap.
- Render time scales with length (the 13 s example took ~2 min on the GPU, so plan ~20-30 min for 3 min). Render
  scenes separately while iterating; render the full video once at the end.
- Verify duration against the format range (1:00-3:30), size, fps, audio length, subtitles present.
- meta.json gets `format`, `aspect`, `scenes` (count + durations), `subtitles: true` and a `thumbnail` field:
  make a separate 1280x720 thumbnail from the best frame with a big readable subject.
- Dashboard: filter by format; show average view percentage and retention for long videos when the YouTube
  Analytics API is connected; compare views per minute of runtime across formats.

### 7.6 Command `/new-video`
Path: `.claude/commands/new-video.md`

```markdown
---
description: Make one 1-3.5 minute cut-out cartoon video in 16:9 landscape with subtitles, research to verified 4K MP4.
argument-hint: [optional topic] [optional character name from library/characters]
model: claude-opus-5-5
effort: max
---

Make a longer video in this repo. Input: $ARGUMENTS. Format is always long-horizontal (16:9, 1:00-3:30) with burned-in
subtitles; default character = the first in library/characters (if the library is empty, build it first, Part 7.2 of
SHORTS_FACTORY_PLAN.md).

1. Script: short-script skill in long mode (`--format long-horizontal`). Show me the idea, scene list, full lines,
   word count and sources, then continue without waiting.
2. Build: cutout-cartoon-shorts skill in scene mode (Part 7.3-7.5): per-scene voice and timing, library poses first,
   only new props/sets/special poses generated, scenes in <Series>, music bed + sound effects, per-scene checks,
   subtitles per scene, full render at 4K 16:9, verified (length 1:00-3:30, subtitles present).
3. Finish: update meta.json, run scripts/register.py, report the MP4 path, Remotion Studio link, file locations, and
   what you chose (format, character, scenes, voice, new pictures + approximate cost, music and sounds + licences).
Don't ask questions; stop only if a key/tool is missing or the picture budget (default 60 new images) would be exceeded.
```

---

## Part 8 - Checklist before the first video

- [ ] Gemini API key in `.env` (image generation is billed from the first image)
- [ ] ElevenLabs connected (connector in Claude Code, or `ELEVENLABS_API_KEY`)
- [ ] Node 18+, Python 3.10+, GPU drivers for `--gl=angle`
- [ ] real-sfx, openverse-sfx and earshot installed from their original repos and their SKILL.md files read
- [ ] `python scripts/check_setup.py` all green
- [ ] Then: `/new-short`
