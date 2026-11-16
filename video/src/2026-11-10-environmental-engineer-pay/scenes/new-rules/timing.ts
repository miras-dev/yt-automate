// Scene 3 "New rules". Times in SCENE seconds (voice starts at 0.1). From vo/scene-3.words.json.
export const VO_FILE = 'vo/scene-3.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 32.64;
export const DURATION = 33.14;
export const GAP_AFTER = 0.3;

export const T = {
  y2024: 0.28, // "2024" label
  epa: 1.72, // "the EPA"
  limits: 3.6, // "first national limits"
  forever: 4.24, // critters pop into the stream
  tap: 5.44, // "tap water"
  two: 6.82, // two critters step forward
  bestKnown: 7.24,
  four: 9.04, // "4 parts per trillion"
  trillion: 10.12,
  pools: 11.24, // cut to the pools
  drop: 12.1, // the drop falls
  five: 12.74,
  olympic: 13.26, // the drop lands
  sameYear: 15.28, // cut to the street section
  tenYears: 17.92, // calendar
  replace: 18.96, // lead pipe yanked out
  all: 19.66, // new pipe drops in
  leadPipes: 20.3,
  law2021: 22.18, // "2021 law"
  fifty: 23.96, // money rain + "$50 billion"
  fixing: 25.78, // sparkles
  projects: 28.34,
  plans: 29.78, // blueprint unrolls (engineering@29.22)
  who: 31.02, // pen hovers
  sign: 32.06,
} as const;
