// One timing source. In a real video these come from words.json (python .../scripts/words.py --ts ...).
export const FPS = 60;
export const DURATION = 6;
export const T = {
  eyes: 0.7, // the mound opens its eyes
  release: 1.6, // the throw
  land: 2.6, // the rock lands in the crater
  inhale: 3.1,
  blast: 3.7,
  smug: 4.9,
} as const;
