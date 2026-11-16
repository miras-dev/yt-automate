// One timing source for this Short. Every beat, sound cue and camera move reads from T (seconds on the video timeline).
// Word times: video/public/2026-11-10-airplane-windows-corners/vo/words.json (python .../scripts/words.py). Big sounds go into pauses.
export const FPS = 60;
export const VO_OFFSET = 0.1;          // the voice starts here
export const VO_END = 28.66;
export const DURATION = 29.16;         // voice end + 0.5 s
export const DURATION_FRAMES = Math.round(DURATION * FPS);

// Pauses in the voice (start, end): 1.76-2.02, 3.48-3.76, 7.92-8.28, 11.6-11.82, 14.92-15.14, 17.58-17.82, 21.6-21.84, 24.66-24.88
export const T = {
  // 1. "Look at any plane window. It has no corners." - frame 0 premise: hero points at a round window.
  look: 0.10,            // "Look" - first visible word
  noCorners: 2.74,       // "no" - highlight the roundness
  // 2. "That shape isn't a design choice." - camera glides out to show the whole plane
  cameraOut: 3.76,       // after the first pause: start the glide
  designChoice: 5.26,    // "choice" - subtitle-ish label bumps
  // 3. "It's a fix for a disaster." - zoom back on one round window; "NOT A CHOICE" stamp
  disaster: 7.18,        // "disaster" lands with a thump; stamp hits
  // 4. "The first jet airliner, the Comet, had square windows."
  comet: 9.70,           // "Comet" - year label 1954 pops in
  square: 10.46,         // "square" - round windows SWAP to square (pop)
  // 5. (We keep the square-window plane)
  // 6. "Every flight, the cabin pressurised and relaxed."
  pressurised: 13.06,    // the plane inflates (scale up 1.06) with an inhale whoosh
  relaxed: 14.18,        // deflates with an exhale whoosh
  // 7. "Tiny cracks grew at the corners."
  cracks: 15.50,         // zig-zag cracks draw at the corners of a close-up square window
  corners2: 16.94,       // emphasis on "corners"
  // 8. "In 1954, two of them tore open mid-flight."
  in1954: 17.82,         // year card
  tore: 19.86,           // the window tears
  midflight: 20.94,      // last word before the pause
  tearBoom: 21.60,       // BIG tear + impact INSIDE the pause (pause 21.6-21.84)
  // 9. "Round windows spread that stress evenly."
  round: 22.20,          // cut to demo: square and round side by side
  spread: 22.72,         // arrows start distributing around the round
  evenly: 23.92,         // soft chime, green highlight
  // 10. "So no corner ever gets the chance to rip the plane apart."
  resolution: 24.88,     // after the pause - back to the plane with round windows, flying calmly
  apart: 28.00,          // "apart" - last frame = frame 0 (hero + round window close)
  end: 28.66,
} as const;
