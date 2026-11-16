# Sound check (earshot + measurements)

Nobody has listened to this mix yet: everything below is measured. Listen to the five moments at the end before publishing.

## Shipped file: out/2026-11-10-environmental-engineer-pay-4K.mp4

| check | result |
|---|---|
| integrated loudness (earshot measure) | **-16.3 LUFS** (target -16) |
| true peak | **-4.4 dBTP** (target under -4 dBTP after AAC) |
| loudness range | 3.0 LU, short-term max -14.2 LUFS, no clipped samples |
| openverse-sfx verify_mix.py | loudness_ok, peak_ok, frames_ok (7 cue frame pairs in qa/verify/) |
| streams | 2160x3840, 60 fps, 8399 frames, 139.98 s video / 139.97 s audio (AAC 256k, 48 kHz) |

Mastering: Remotion mix rendered to WAV (`--codec=wav`) -> two-pass ffmpeg loudnorm I -16 / TP -4.5 / LRA 11 (pass 2 measured
-16.33 LUFS, -4.50 dBTP; loudnorm used its dynamic mode because a linear gain could not meet the peak target) -> muxed
onto the 4K render with `-c:v copy`. Before mastering the Remotion mix measured -19.7 LUFS / -5.2 dBTP: Remotion plays the
mono voice takes about 3 dB under their file level (pan law).

## Sync and balance (earshot timeline on the mastered mix, 106 cues from the T tables)

- Sync to the 106 cues: **97 % have a sound onset within 100 ms** (chance 81 %), 37 % within one frame (chance 19 %),
  median offset 24 ms. No cue without a sound; 3 are met only by a level rise (0:03.45 bubble drop, 0:31.04 squelch under
  the voice, 1:48.74 boing on the third step).
- Sync to the 27 picture cuts / whips: 96 % within 100 ms, median 22 ms.
- Sections stay between -15 and -17 LUFS across all five scene joins (0:20.70, 0:54.87, 1:28.30, 1:54.40): no level
  jumps at the joins.
- Voice: ElevenLabs takes measure -16.1 to -16.8 LUFS each; voice-over narration detected through every section.
- Music bed: "September_Hords_Loop" normalised to -20 LUFS, played 13 dB down (about -33 LUFS before mastering), 3.5 dB
  lower on continuous speech and 2 dB up in the joins, so it sits about 13-17 LU under the voice; faded over the last
  2.5 s. The 107 s loop is crossfaded with itself (3 s) at 1:44.5 so there is no seam.
- Preview mix check (before the last changes): one cue without a hit (0:13.40, the "x 2.1" pop under the word
  "double"); it was raised 3 dB and is now detected (+4 ms).

## Pop scan (preview, qa/popscan.json)

434 frame jumps flagged, 124 at listed swap/cut times. The rest were checked by time: whip pans at the four joins,
the two whip-tilts in scene 3 and the whip to the desk in scene 4, label pop-ins, stamp / ticket slams, the beam slam,
pose swaps and camera glides. Two real problems were found and fixed before the 4K render: the stadium appeared inside the
frame instead of falling in from above (scene 4, 6.2 s), and the money counter label changed width as digits were added
(scene 1, 10.4 s). Not frozen at the end.

## Listen to these five moments (headphones, then once on a phone speaker)

1. 0:05.1-0:06.0: cash bundles landing (paper, paper, paper, thump, coins) while the voice says "well for it": too busy?
2. 0:21.5: the law book slam on "law": is the thump too loud right on the word?
3. 0:49.5-0:50.1: the balance beam slam on "costs more": does it cover the words?
4. 1:35.6: the stadium boom on "fit": too big under the voice?
5. 2:16.9-2:19.9: the final pour into the glass, the chime and the music fade on "won't hurt you".
