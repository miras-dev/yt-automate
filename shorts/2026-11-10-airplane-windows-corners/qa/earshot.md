# earshot audio QA — 2026-11-10-airplane-windows-corners

Measured on `out/2026-11-10-airplane-windows-corners-preview.mp4` (540x960 preview, 29.184 s).

## Loudness and peaks
- Integrated: **-16.1 LUFS** (Shorts target is -16; we're bang on)
- True peak: **-2.5 dBTP** (plenty of headroom under -1 dBFS)
- LRA: 2.1 LU (conversational)
- Noise floor: -50.8 dBFS (clean)
- Loudest 3 s: 0:18-0:21 at -14.8 LUFS short-term (the 1954 / mid-flight beat; the tear boom at 21.6 lands inside the pause at 21.6-21.84 — big hit, voice protected)

## Sync to picture (earshot timeline)
- 168 total events (5.8 / s), 20 tagged
- Voice-over narration detected across 83% of the film (as expected for a Short)
- 12 cut lines detected on the video
- 83% have an onset within 100 ms, 25% within 1 frame (chance 19%), median |offset| 32 ms
- 58% of visual events have a **salient hit within ±100 ms** (reference p10-p90 is 8-49%; we're above the reference)
- Strongest accents: 0:22.08 +40 dB (the tear boom), 0:02.67 +39 dB (opening word "corners"), 0:08.31 +39 dB (disaster stamp)

## Realness
- p_real 0.95 (real or pro-produced), 0/8 windows lean synthesized — all SFX are real recordings from Openverse.

## Mix notes
- Voice-safe mode dipped SFX by 5.6 dB on average under the voice
- Big sound (boom at T.tearBoom = 21.6) placed inside the pause 21.6-21.84, so it does not step on the voice
- Ambience bed (-30 dB) under the whole film

## Credits
- CC BY sounds: ambience `air_bed.wav`, chime `chime.wav`, crack `crack.wav` — see `credits.txt`
- CC0 sounds: whoosh, pop, boom, stamp, inhale, exhale

## Flags still worth watching
- One cut at 0:24.75 lacks a dedicated SFX hit (demo scene arrows fading out before the resolve stage). The chime at 0:23.92 is close but ring-out ends by then. Acceptable: it's a soft dissolve rather than a hard cut.
