---
name: cutout-cartoon-shorts
description: Turn a short script into a vertical 2D cut-out cartoon Short (style of "Can we throw trash in a volcano?"):
  Gemini cut-out pictures keyed to transparency, the channel's ElevenLabs voice (Zephrael), Remotion animation (2.5D multiplane
  camera, squash-swap poses, real physics, code-drawn effects, faces on objects), real Openverse sound effects placed
  with real-sfx and checked with earshot, 4K render. Two formats: short (9:16, 20-30 s) and long-horizontal (16:9,
  1:00-3:30, scenes, burned-in subtitles): anything over one minute is landscape. Use for any cartoon / cut-out Short
  or video in this repo.
---

# Cut-out cartoon Shorts

Output: 1080x1920 composition, 60 fps, rendered at 2160x3840. A flat cartoon character (thick black outlines, flat
colours) acts out the script. Every pose and expression is its own picture; motion, camera, physics, effects and timing
are code. Read the whole file once, then follow the order. Update meta.json status after each section
(voice -> pictures -> animation -> sound -> qa -> rendered) and run `python scripts/register.py` each time.

Where things are
- Scripts: `.claude/skills/cutout-cartoon-shorts/scripts/`. Each has `--help`.
- Remotion project: `video/`. Shared helpers: `video/src/lib/` (import from `'../lib'`). A working code-only example
  that uses most helpers: `video/src/_template/` (compositions `template-short` and `template-long-horizontal`, the
  second with subtitles). Copy it to `video/src/<slug>/` to start, then add the video to `video/src/registry.ts`.
- Formats (`meta.json` "format"): `short` 1080x1920 (20-30 s) and `long-horizontal` 1920x1080 (every video over one
  minute: 1:00-3:30); both 60 fps, rendered at scale 2. `long-vertical` (1080x1920) is retired: it stays in the code
  only so videos made before the landscape rule still build; never pick it for a new video. Sizes come from `FORMATS` in
  `video/src/lib/formats.ts`; never hard-code 540 / 960: use `FORMATS[format]`, `safeArea(format)` and
  `subtitleBand(format)`. Sections 1-11 describe a Short; section 12 is scene mode for long videos.

## 0. Setup check
Run `python scripts/check_setup.py`. It needs: GEMINI_API_KEY in .env; ElevenLabs connector (tools
creative_list_voices / creative_generate_speech / creative_get_flow_run_status) or ELEVENLABS_API_KEY (in a cloud
session on the yt-automate environment the key is saved there instead: check_setup.py cannot see it and warns, so test
it with `curl -sS -o /dev/null -w '%{http_code}' https://api.elevenlabs.io/v1/voices/BpZ8aKvwvbZf602CLu11`: 200 = fine);
python libs `google-genai pillow numpy opencv-python faster-whisper`; ffmpeg (Remotion ships one in
node_modules/@remotion/compositor-*); the real-sfx, openverse-sfx and earshot skills. Stop and report if any is missing.
First video on this machine: point real-sfx at the sound folder once (its per-machine config is kept out of git in
sfx-library/; `.claude/settings.json` sets REAL_SFX_CONFIG to it, in a plain shell export it yourself):
`REAL_SFX_CONFIG=sfx-library/real-sfx-config.json python .claude/skills/real-sfx/scripts/setup.py init --library
openverse="$(pwd)/sfx-library" --index`. After downloading new sounds: `python .claude/skills/real-sfx/scripts/build_index.py`.

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
- With the ElevenLabs connector: creative_generate_speech with that voice id, poll creative_get_flow_run_status,
  download content_url to video/public/<slug>/vo/take1.mp3.
  No connector: the ElevenLabs HTTP API, `POST https://api.elevenlabs.io/v1/text-to-speech/BpZ8aKvwvbZf602CLu11?output_format=mp3_44100_128`
  with `{"text": ..., "model_id": "eleven_v4"}`. On your own computer the key is ELEVENLABS_API_KEY from .env (header
  `xi-api-key`). In a cloud session on the yt-automate environment the key is saved on the environment and added to
  every request to api.elevenlabs.io automatically: send no key (or a placeholder where a tool insists on one).
- Word times: `python .claude/skills/cutout-cartoon-shorts/scripts/words.py video/public/<slug>/vo/take1.mp3 --ts video/src/<slug>/timing.ts`
  (faster-whisper word_timestamps=True; `--ts` writes a starter timing.ts with the voice end and the pauses). Whisper edges are ±0.2 s, so
  words.py also finds real pauses by loudness (RMS every 20 ms, silence < -42 dB for ≥ 0.18 s) and snaps to them.
- Voice starts at 0.1 s. Write every beat as a constant in video/src/<slug>/timing.ts:
  `export const T = {turn: 2.05, release: 3.7, land: 4.8, ...}`. Composition length = voice end + 0.5 s.
  Big sounds go into pauses, not on top of words.
- Done = take1.mp3 + words.json (next to the mp3) + timing.ts.

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
- Generate: `python .claude/skills/cutout-cartoon-shorts/scripts/gen_image.py NAME ASPECT "PROMPT" --kind char|obj --slug <slug> [--ref a.png --ref b.png]
  [--model pro|flash] [--key blue|green]` → shorts/<slug>/images/raw/NAME.png. Run several in parallel (background
  jobs + wait). The script adds the STYLE block itself (pass only what is different in this picture), logs the prompt
  in prompts.md, counts the picture and its cost in meta.json, and exits with code 3 when `image_budget` is used up:
  then stop and report. `--dry-run` prints the full prompt without spending anything.
- Key: `python .claude/skills/cutout-cartoon-shorts/scripts/key.py --all shorts/<slug>/images/raw shorts/<slug>/images/cut` (or one file: `key.py raw/NAME.png
  cut/NAME.png`). Flat background connected to the border → transparent; enclosed pockets of key colour too; the
  outline edge is un-blended so no blue fringe is left. A warning about key-like colour inside the drawing means:
  regenerate that picture with `--key green`.
- Picture list for one gag: every pose the story needs (each its own picture); every prop that moves on its own,
  alone; set pieces alone; small dressing in one picture, split later.
- Two poses that must line up (same pose with/without the object): make the second as an EDIT of the first
  (`--ref raw/first.png`, prompt "the same picture with the bag removed, the hand now empty and open, everything else
  identical, same background colour"), then align them (section 4).
- Check: `python .claude/skills/cutout-cartoon-shorts/scripts/sheet.py --slug <slug>` → qa/sheet.png (all cut-outs on magenta and on dark grey). Open the PNG. Look for fringe, holes,
  half-transparent fills, wrong hands, style drift. Regenerate failures.
- gen_image.py logs every prompt in prompts.md and the image count + model + cost estimate in meta.json (Pro 4K ≈
  $0.24/image, Flash ≈ $0.15; check current Gemini pricing).
- Done = every picture passes the sheet check.

## 4. Prep (scripts/prep.py → video/src/<slug>/sprites.ts)
Run: `python .claude/skills/cutout-cartoon-shorts/scripts/prep.py --slug <slug> [--obj rock,volcano] [--waist closeup_scared] [--ref-pose idle]
[--pair pose_bag:pose_empty] [--profile volcano] [--use-library <name>[:idle,point_right]]`. It does everything below
and writes `SPRITES` (file, size, scale, head, feet, grips, align, profile, opening) plus `HEAD_R`. In Remotion draw a
pose with `<Sprite s={SPRITES.idle} x={feetX} y={feetY} anchor="feet" />`; `spritePoint()` gives the world position
of a grip point; `headWorld()` gives where a waist-up pose's head goes (`anchor="head"`). What prep.py does:
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
Helpers: `Layer`, `Sky`, `GroundBand` (Layer.tsx); `camPath`, `shake`, `addShake`, `dofBlur`, `DEPTH` (camera.ts).
The real Layer centres on the composition (width / 2, height / 2), so it works in every format; the listing below shows
the 1080x1920 numbers.
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
Helpers in video/src/lib/poses.ts: `turnSwap`, `actionSwap`, `throwSwap`, `catchSwap`, `poseAt`, `breathe`, `tremble`,
`wordBounce`, `blinking`, `idleSway`, `talkShape`; `ContactShadow` in sprites.tsx.
- NEVER cross-fade two drawings. Swap on a frame where motion hides it:
  turn = squash scaleX 0.8 (scaleY 1.03) about the feet, swap at narrowest; action = anticipation squash (Y 0.94,
  X 1.04) → swap → stretch 1.03 → damped spring; throw = swap to follow-through at release, lean -5° → +5° → settle;
  catch = swap to the holding pose the frame the object reaches the hand, plus a small weight dip.
- Life on holds: breathing (scaleY 1 ± 0.9 % at ~0.6 Hz), tremble when scared (1-2 px sines), bounce on a key word.
- Contact shadow under full-body poses: soft ellipse rgba(72, 54, 42, 0.26), 3 px blur.

## 7. Props with real physics
Helpers in video/src/lib/physics.ts: `projectile(from, to, flight, apexFrac)`, `ballistic`, `sink`, `surfaceY`;
`ClipAbove` in effects.tsx.
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
Helpers in video/src/lib/effects.tsx: `Cloud`, `Puff`, `SmokeRing`, `Burst`, `Crown`, `Impact`, `SpeedLines`,
`SweatDrop`, `ZigZag`, `Glow`, `Flow`, `ClipAbove`, `Label`; faces in faces.tsx: `Eyes`, `eyesPop`, `blink`,
`inhaleBlast`, `Mouth`. Write a new effect in the Short's own folder when none fits, by the same rules.
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
Read the three external SKILL.md files once per session (`.claude/skills/openverse-sfx`, `real-sfx`, `earshot`); the
exact commands and formats are also summarised in CLAUDE.md. You cannot hear: every choice is backed by a measurement.

1. From beats.md list the sound cues in `video/src/<slug>/cues.json`: one object per sound,
   `{"cue": "plop", "key": "land", "dt": 0, "role": "hit", "f": "plop", "db": -16}` (cue = name, key = a key of T,
   role = whoosh | hit | riser | water | ambience | pop ..., f = file stem, db = level).
   Levels under the voice: whooshes -25 to -31 dB, impacts -14 to -19 dB, beds -26 to -33 dB, a big blast -8 to -10 dB
   inside a pause.
2. Find sounds with the openverse-sfx skill: ONE search per kind of sound (anonymous Openverse allows about 200 a
   day), licences CC0 / CC-BY / public domain only (the script enforces cc0,by,pdm; no NC, no ND). 3-5 candidates per
   cue into sfx-library/<category>/. Reuse the library before downloading more.
   `python .claude/skills/openverse-sfx/scripts/sfx_search.py --query "whoosh" --max-ms 8000`
   `python .claude/skills/openverse-sfx/scripts/sfx_fetch.py --audio-url URL --name whoosh_01 --attribution "..."
   --dir sfx-library/whoosh --credits shorts/<slug>/credits.txt`
3. Pick the best candidate per cue with earshot (`rank` / `match` for the description, `find` for the cleanest moment,
   `describe` to rule out music or voices under it; right length, clean onset). Trim to the moment `find` gives, then
   peak-normalise to -1 dBFS and save as WAV:
   `python .claude/skills/openverse-sfx/scripts/sfx_normalize.py IN OUT.wav --mode peak --target -1`
   → video/public/<slug>/sfx/<f>.wav. Never run ffmpeg `loudnorm` on a short sound.
4. Let real-sfx place each sound on its frame (impacts by onset, whooshes by peak); timing.ts stays the only source of
   times:
   - `python .claude/skills/cutout-cartoon-shorts/scripts/export_cues.py --slug <slug> --video out/<slug>-preview.mp4` writes `shorts/<slug>/qa/sfx-sheet.json`
     (a real-sfx cue sheet with our files and the T times) and `sfx-events.json` (the same moments as a typed event
     list `[{"t", "type"}]` for `from_cues.py`, for when real-sfx should choose from the library itself).
   - `python .claude/skills/real-sfx/scripts/mix.py shorts/<slug>/qa/sfx-sheet.json --out work/<slug>/sfx.mp4
     --voice-safe --plan` (look at the plan), then again without `--plan`.
   - `python .claude/skills/cutout-cartoon-shorts/scripts/export_cues.py --slug <slug> --apply work/<slug>/sfx_resolved_cues.json` stores each cue's `lead`
     (seconds from the start of the file to the onset / peak) in cues.json.
5. Render the cue list in Remotion with `<Voice slug={slug} />` and `<SoundCues slug={slug} cues={cues} T={T} />`
   (video/src/lib/sound.tsx). It starts every file at `T[key] + dt - lead` at its `db`:

```tsx
<Sequence from={Math.round(c.at * FPS)} layout="none">
  <Audio src={staticFile(`${slug}/sfx/${c.f}.wav`)}
    volume={(f) => 10 ** (dbAt((Math.round(c.at * FPS) + f) / FPS) / 20)} />
</Sequence>
```
6. Write every CC-BY attribution into shorts/<slug>/credits.txt, verbatim (sfx_fetch.py appends them; log CC0 sounds
   too). List the sounds in meta.json `sounds: [{cue, source: "openverse", license, title}]`.

## 10. Check, then render
All render commands run in `video/`. On a machine without a GPU add `--gl=swangle` (slow).
- Contact sheet: `node scripts/contact.mjs <CompId> --slug <slug> --times all-T` (renderStill at every beat, scale 0.5,
  one grid) → qa/contact.png and qa/frame0.png (the dashboard thumbnail). Check frame 0, every swap, every
  gag, the last frame.
- Pop scan: `node scripts/render.mjs <CompId> --preview` (0.5x MP4 in out/), then
  `python .claude/skills/cutout-cartoon-shorts/scripts/popscan.py out/<slug>-preview.mp4 -o shorts/<slug>/qa/popscan.json --expect <swap and cut times>`:
  mean frame-to-frame difference (blurred, 270 px), flags frames above 2.2x the local median. Every flag must be an
  intended swap or cut.
- Mix check: earshot on the preview (`earshot timeline`, `earshot measure`, and `earshot sheet` for a picture of it;
  quote the numbers) → qa/earshot.md (voice clear, effects under it, blast in the pause, peak around
  -4 dBFS, no clipping).
- Render: `node scripts/render.mjs <CompId>` (bundles once to video/build, then the same as `npx remotion render
  src/index.ts <CompId> ../out/<slug>-4K.mp4 --scale=2 --gl=angle --image-format=png --crf=16 --pixel-format=yuv420p`).
- Verify: render.mjs prints a JSON report and exits 1 when something is off: 2160x3840 (3840x2160 for horizontal),
  60 fps, frames = duration × 60, audio present and as long as the picture. Also check it is still moving at the end
  (popscan reports "frozen at the end").
- Update meta.json (status "rendered", duration, image count, model, voice id, ElevenLabs credits, sounds used,
  render path), run register.py.

## 11. Rules that keep it hand-made
- Frame 0 = premise, centred, big; the first line names what you see.
- Centred and balanced on holds; nothing important cut by the edge.
- No motion blur, no cross-fades between drawings, no random jitter; every move eased.
- One focal action at a time.
- Every visual on its word; payoff on the last word; last frame loops to the first.
- Real facts only in the voiceover.

## 12. Scene mode (long videos: 16:9 with subtitles)
The same pipeline, with scenes. Everything above still applies inside a scene. Every video over one minute is
`long-horizontal`: 16:9, 1920x1080 rendered at 3840x2160, 1:00-3:30, burned-in subtitles. YouTube treats only square
or vertical uploads of 3:00 or less as Shorts, so a 16:9 video is a normal video at any length; no 3:00 rule applies.

### 12.1 Character library (do this once, reuse forever)
- Make the hero character, check it, then the standard pose set, each with `--ref <hero>`: idle, talk_a, talk_b (two
  mouth shapes), point_left, point_right, shrug, thinking, scared, happy, surprised, walk_a, walk_b, holding (empty
  hand open to receive a prop), closeup_talk, closeup_react. Generate into a work folder with
  `gen_image.py ... --out library/characters/<name>/raw` (name the hero picture `hero`; raw/ and cut/ are
  gitignored), key them with `key.py --all library/characters/<name>/raw library/characters/<name>/cut`, then
  `python .claude/skills/cutout-cartoon-shorts/scripts/prep.py --library <name> --src library/characters/<name>/cut
  --waist closeup_talk,closeup_react --ref-pose idle`. Pictures made with `--out` are not counted in any meta.json:
  note the library's picture count and cost in your report.
- Result: library/characters/<name>/ with the trimmed poses, hero.png and poses.json (file, framing, head, feet, grips,
  prompt used). Fill in the `prompt` of each pose in poses.json. Commit the folder.
- A new video reuses library poses (`prep.py --slug <slug> --use-library <name>`) and only generates the props, set
  pieces and special poses it needs, each special pose as an EDIT of a library pose (`--ref` that pose) so it matches.
  That keeps a 3-minute video to roughly 2-3x the picture cost of a Short (budget: 60 new images).
- Style drift check: every new picture goes on the sheet next to the library hero before use:
  `python .claude/skills/cutout-cartoon-shorts/scripts/sheet.py --slug <slug> --hero library/characters/<name>/hero.png`.

### 12.2 Build
- Composition size from the format (registry.ts `format: 'long-horizontal'`). Lay out against `safeArea(format)`: thirds
  and wider sets (3:2 / 16:9 set pieces, more ground bands); a character on one third, the thing it talks about on the
  other. The bottom of the frame belongs to the subtitles: faces, labels and payoffs stay above
  `subtitleBand(format).top` (about 82 % of the height); feet, ground and props may sit behind the subtitles.
- One component per scene in video/src/<slug>/scenes/<name>/ (Scene.tsx, timing.ts, cues.json), played with `<Scenes>`
  (video/src/lib/scenes.tsx, a `<Series>`). Each scene has its own T table (times relative to the scene start; inside
  a scene `useT()` gives scene seconds) and its own camera plan. `sceneLayout(scenes)` gives every scene's start on
  the full timeline and the total length for registry.ts.
- Voice: one ElevenLabs take per scene (same voice, same settings) → vo/scene-N.mp3, so one scene can be fixed alone.
  Word times per scene (`words.py vo/scene-N.mp3 -o vo/scene-N.words.json --ts .../scenes/<name>/timing.ts`). Join
  with 0.25-0.4 s gaps (`gapAfter`); the scene boundaries are where cuts go.
- Cuts are normal now: a hard cut or a quick whip (`whip()` camera pan with a whoosh) between scenes; still no
  cross-fades between drawings. Inside a scene keep the "one continuous move" rule.
- Variety without new pictures: change camera distance per scene (wide → medium → close), recolour the sky, reuse set
  pieces from new angles (mirror with `flip`), let props and code effects carry the new information. A simple
  on-screen label or number (`Label`) is allowed in long videos when it helps the explanation.
- Life over time: `blinking()` on long holds, `talkShape()` to swap the two talking mouth shapes on voiced words,
  `idleSway()` / small idle moves every few seconds so nothing freezes.

### 12.3 Subtitles (every long video)
- Burned-in, in the flat style: white Nunito ExtraBold (bundled with the video, `lib/fonts.ts`) with a black outline,
  centred at the bottom, at most two balanced rows, screen space (camera moves and shake never move them). No
  fades, no word-by-word animation: a subtitle is on or off.
- Text = the script's own words (spelling of names, acronyms and numbers as written), timing = the voice's word times.
  Per scene, after words.py:
  `python .claude/skills/cutout-cartoon-shorts/scripts/subtitles.py --slug <slug> --scene N -o video/src/<slug>/scenes/<name>/subtitles.json`
  (`--all` does every scene when the scene folders are named after the script's scene names or start with "N-"). It
  aligns script.md's `## Scene N` lines to vo/scene-N.words.json, cuts them into phrases (at most 64 characters, 5 s,
  broken at sentence ends, commas and real pauses) and prints every cue plus the checks. A Short or a single-take video:
  `subtitles.py --slug <slug>` → video/src/<slug>/subtitles.json.
- Read its output: "voice and script differ" (the take does not say the line as written: fix the script line to match
  the take, or regenerate the take), `check: script / voice` pairs (fine for numbers and names Whisper spells another
  way, otherwise the same fix), "left out" (lines the voice never says), and reading speed over 20 characters a second
  (lower `--max-chars` or slow the line). Re-run it whenever a take or a script line changes.
- In each scene, last child, next to `<SoundCues>`: `import subs from './subtitles.json';` and
  `<Subtitles format={format} cues={subs.cues} />` (video/src/lib/subtitles.tsx; on by default in long videos, off in
  Shorts unless `on`). Its times are scene seconds, the same timeline as the scene's T table.
- Check them on the contact sheets: every subtitle readable, never over a face or a payoff, two rows at most.

### 12.4 Sound
- Music bed: instrumental, calm, CC0 or CC-BY only (Openverse music / Jamendo through openverse-sfx:
  `sfx_search.py --query "calm instrumental" --min-ms 60000`), saved in sfx-library/music/, normalised to -20 LUFS
  (`sfx_normalize.py IN OUT --mode lufs --target -20`), played with `<MusicBed>` at -30 to -34 dB under the voice,
  ducked 3-4 dB more on dense lines (`dense`), raised slightly in scene gaps (`gaps`), faded only at the very end.
  Attribution in credits.txt.
- Sound effects as before, cues per scene: `export_cues.py --slug <slug> --scene <name> --offset <scene start>`;
  each scene's `<SoundCues>` sits inside the scene, so its times stay relative.
- earshot on the full mix: voice clarity across the whole length, music never fighting the voice, no level jumps at
  scene joins.

### 12.5 Checks, render, dashboard
- Contact sheet per scene (`contact.mjs <CompId> --slug <slug> --times ... --name contact-scene-N`) + one overview
  strip (`--name contact`). Pop scan on the whole preview; every flag must be a planned cut or swap (pass the scene
  joins in `--expect`).
- Render time scales with length (a 13 s Short took about 2 min on the GPU, so plan 20-30 min for 3 min). Render
  scenes separately while iterating (`render.mjs <CompId> --preview --frames A-B`); render the full video once.
- Verify duration against the format range, 1:00-3:30 (register.py warns), plus size (3840x2160), fps and audio
  length, and that subtitles.json exists for every scene (register.py warns when it is missing).
- meta.json gets `format`, `aspect`, `scenes: {count, durations}`, `subtitles: true` and `files.thumbnail`: a
  separate 1280x720 thumbnail from the best frame with a big readable subject
  (`npx remotion still src/index.ts <CompId> ../shorts/<slug>/qa/thumbnail.png --frame N --scale 0.6667`).
