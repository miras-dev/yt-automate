# Beat sheet: Why don't airplane windows have corners?

One visual beat per line, landing on the exact word. Frame 0 = premise. Last frame loops to frame 0.
Times are approximate until words.py writes timing.ts.

## Scene / world

- Character: our white cartoon guy, pointing at a plane window (his finger on the glass).
- Setting: the fuselage of a passenger jet, seen from the side, big windows in a row, blue sky behind.
- One continuous camera move: start close on the hero + window, glide out to the plane shot, nudge in on the
  square window as it cracks, pull back for the fix.

## Beats

| # | approx t | word  | on screen                                              | picture              | sound                    |
|---|----------|-------|--------------------------------------------------------|----------------------|--------------------------|
| 1 | 0.1      | Look  | Hero (left of frame) points at a round plane window on the fuselage. Blue sky. | hero_point_right, fuselage_round | ambience_air_bed in from 0.0 |
| 2 | 1.6      | corners | Camera glides out; the whole plane is in frame, all round windows with faces blinking idle. | plane_side (with round windows) | (bed only) |
| 3 | 3.1      | choice | Zoom back in on one window; it morphs to show a label "NOT A CHOICE". | fuselage_round (close) | ui_tick on morph |
| 4 | 5.1      | disaster | Cut: an archive-style card "1954 — de Havilland Comet". The round windows pop out and square ones pop in. | plane_side_square, label_1954 | pop on swap |
| 5 | 7.2      | windows | Hero pointing at the SQUARE window; the window has a surprised face. | fuselage_square (close), face_scared | gulp/boing on face appear |
| 6 | 9.1      | relaxed | The plane breathes: fuselage inflates (scale up 1.06) then deflates on the words "pressurised" / "relaxed". | plane_side_square (same) | inhale_woosh then exhale_woosh |
| 7 | 11.8     | corners | Cracks (zig-zag) draw at each corner of a square window. Hero's eyebrows up. | crack_overlay (code) | glass_crack ticks |
| 8 | 14.5     | mid-flight | 1954 — the square window TEARS open; a dark hole and speed lines; the plane flies out of frame. | plane_side_square (broken), speed_lines (code) | BIG tear + impact (in the pause after "mid-flight") |
| 9 | 18.0     | evenly | Cut: a demo diagram — two windows side by side (square and round). Stress arrows bash the square corners, then arrows spread evenly around the round. | demo_square, demo_round, arrows (code) | hits on arrows, soft chime on "evenly" |
| 10 | 22.5    | apart | Back to the whole plane with ROUND windows flying calmly across the sky. Last frame = same as frame 0 (hero + round window close). | plane_side (round, happy), hero_point_right | ambience fade, final soft chime |

## Picture list (to generate)

Characters:
- hero_point_right (full body, our cartoon guy, pointing to the right with the right hand, calm face)
- hero_shrug (full body, hands up, shrug, eyebrows tilted up — reaction shot)

Props / set pieces:
- plane_side_round (side profile of a passenger jet, round windows, flat cartoon style, no background)
- plane_side_square (same plane, with SQUARE windows instead of round — same angle, same scale)
- fuselage_round_closeup (a close-up of 3 round windows on the fuselage, waist-wide crop)
- fuselage_square_closeup (same, but square windows)
- demo_window_square (one square window on a fuselage panel, centred, large enough for arrows)
- demo_window_round (one round window on a fuselage panel, centred, same scale)

Effects drawn in code (not generated):
- crack_overlay: zig-zag SVG lines from each corner of the square window
- stress_arrows: outlined cartoon arrows (red for concentrated, green for spread)
- speed_lines, tear burst, air puffs
- year label "1954" (text layer)
- faces (eyes, brows, mouths on the windows and plane)
