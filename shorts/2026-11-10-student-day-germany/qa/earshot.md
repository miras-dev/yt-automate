# Sound check (earshot + measurements)

Nobody has listened to this mix yet: everything below is measured. Listen to the five moments at the end before publishing.

## Shipped file: out/2026-11-10-student-day-germany-4K.mp4

| check | result |
|---|---|
| integrated loudness (earshot measure) | **-16.3 LUFS** (target -16) |
| true peak | **-4.2 dBTP** (target under -4 dBTP after AAC) |
| loudness range | 3.2 LU, short-term max -14.4 LUFS, no clipped samples |
| openverse-sfx verify_mix.py | loudness_ok, peak_ok, frames_ok (7 cue frame pairs in qa/verify/) |
| streams | 3840x2160 H.264, 60 fps, 11443 frames, 190.72 s video / 190.70 s audio (AAC 256k, 48 kHz) |
| 3:00 rule (long-horizontal 3:05-3:30) | **3:10.7**: runs past 3:00 |

Mastering: Remotion mix rendered to WAV (`--codec=wav`) -> two-pass ffmpeg loudnorm I -16 / TP -4.5 / LRA 11 (pass 2
measured -16.31 LUFS, -4.50 dBTP; loudnorm used its dynamic mode because a linear gain could not meet the peak target) ->
muxed onto the 4K render with `-c:v copy`. Before mastering the Remotion mix measured -19.8 LUFS / -4.4 dBTP (the mono voice
takes play about 3 dB under their file level in Remotion's mix).

## Sync and balance (earshot timeline on the mastered mix, 99 cues from the T tables + 5 joins)

- Sync to the 99 cues: **96 % have a sound onset within 100 ms** (chance 87 %), 33 % within one frame (chance 21 %),
  median offset 30 ms. 2 are met only by a level rise (0:37.27 stamp thump on "included", 1:58.77 chime under "hour").
  1 cue without a detected onset: 2:16.31, the small pop on the MUNICH tag. It is placed on the beat (pop.wav onset
  0.081 s, lead 0.084 s) and was raised 3 dB; the word "Munich" masks it.
- Sync to the 39 picture cuts / whips: 92 % within 100 ms, median 45 ms. The one cut without a hit (0:52.35) is the
  price card shrinking away before the map pops in (the map's whoosh follows at 0:52.6).
- Sections stay between -15 and -17 LUFS across all five scene joins (0:32.13, 1:04.20, 1:37.67, 2:07.85, 2:41.97):
  no level jumps at the joins.
- Music bed: "Blue Sky" (Sergmusic, CC0) normalised to -20 LUFS, played 13 dB down (about -33 LUFS before mastering),
  3.5 dB lower on continuous speech, 2 dB up in the joins. It enters on the first downbeat as the student lands out of
  bed (4.02 s). To fill 3:10 the track jumps back twice on its own 28-bar phrase (84.96 s -> 37.64 s, 0.25 s crossfade on
  the bar line): earshot sheet of the first jump shows the beat grid unbroken and the level steady (-20 +-1 LUFS). The
  track's natural ending decays over the last two seconds. The short "drops" in the timeline (-40 to -52 LUFS, 0.3-0.7 s)
  are the music's own quiet bars between spoken lines.

## Picks (earshot rank / find, all CC0 or CC BY from Openverse)

| sound | file | verdict |
|---|---|---|
| alarm clock | sdg_alarm_02 (hookhead, CC0), 0-2.85 s | strong match, z +5.6 |
| desk knocking | sdg_knock_04 (DanaGarcia, CC0) z +3.8 strong; sdg_knock_02 (tbone1999, CC0) 0.94-2.74 s, window z +3.5 strong | layered |
| clock ticking | sdg_tick_03 (florianreichelt, CC0), 0-5 s | strong match, z +4.6 (window z +4.9) |
| roller shutter | sdg_shutter_02 (onda_stazionaria, CC BY), 0.70-1.90 s | strong match, z +3.1 |
| bottle clink | sdg_bottle_02 (Fugeni, CC0) z +4.1; sdg_bottle_01 (twohoursago, CC0) z +4.0 | strong |
| bite | sdg_bite_02 (wadaltmon, CC0) | strong match, z +5.8 |
| snore | sdg_snore_02 (sankalp, CC BY), events 5.32-7.31 s (z +5.8) and 0.48-2.02 s (z +4.6) | strong |
| light switch | sdg_switch_02 (RutgerMuller, CC0) | strong match, z +3.3 |
| tram bell | sdg_trambell_02 (16HPanskaWillheimova_Sara, CC0) | strong match, z +4.3 |
| music | sdg_music_01 "Blue Sky" (Sergmusic, CC0): cheerful ukulele z +3.6, playful and quirky z +3.3, no voice tags | strong |

Two placements were set by hand after real-sfx: the tram bell lands on its first strike (onset 0.348 s, not its
loudest strike at 0.96 s) and the second knock layer on its first knock (0.046 s).

## Pop scan (preview, qa/popscan.json)

474 frame jumps in 69 clusters, all at planned beats: label pop-ins, stamps, card pops, the two cuts to and from the
clock in scene 3 (frame-exact, no fly-through of the desk rows), camera glides, whip pans at the joins and pose swaps.
Six real problems were found in scene 2 and fixed before the 4K render: the bus and train icons on the ticket vanished
in one frame (now they shrink away); the bus, the tram and the regional train started or ended inside the frame (now
they enter and leave fully off-screen); and the three walking students appeared on screen during the camera push (now
they walk in from the right). Not frozen at the end.

## Listen to these five moments (headphones, then once on a phone speaker)

1. 0:00.8-0:03.6: the alarm ringing (-24 dB) under "waking up for a university": does it cover the words?
2. 1:27.0-1:28.6: the desk knocking (two layers): does it read as a lecture hall knocking, or as a door?
3. 1:28.5: the first music loop point (inside the knocking): any audible seam?
4. 2:36.2: the shutter and the CLOSED stamp together: too busy?
5. 2:59.3: the bed's bite on "eat": is the crunch too loud right on the word?
