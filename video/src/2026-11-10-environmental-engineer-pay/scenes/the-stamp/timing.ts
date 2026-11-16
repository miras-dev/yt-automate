// Scene 4 "The stamp". Times in SCENE seconds (voice starts at 0.1). From vo/scene-4.words.json.
export const VO_FILE = 'vo/scene-4.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 25.3;
export const DURATION = 25.8;
export const GAP_AFTER = 0.3;

export const T = {
  small: 0.9, // camera pulls far back: one tiny engineer
  group: 1.6,
  num: 3.84, // "39,000": crowd pops in
  envEngineers: 5.26,
  fit: 7.28, // the crowd flies into the stadium
  stadium: 8.72,
  licensed: 10.24, // license card
  professional: 10.82,
  sign: 12.36, // stamp rises
  seal: 12.98, // stamp slams
  plans: 13.86,
  license: 15.5, // stairs appear
  degree: 16.4, // step 1: cap
  exams: 17.66, // step 2: exams (tough@17.66 exams@18.26)
  work: 19.52, // step 3: years of work
  licensedEng: 21.22, // top: license
  what: 23.0, // thinking
  paying: 24.44, // "?"
} as const;
