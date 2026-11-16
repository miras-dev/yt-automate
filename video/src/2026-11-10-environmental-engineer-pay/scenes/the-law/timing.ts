// Scene 2 "The law". Times in SCENE seconds (voice starts at 0.1). From vo/scene-2.words.json.
export const VO_FILE = 'vo/scene-2.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 33.36;
export const DURATION = 33.86;
export const GAP_AFTER = 0.3;

export const T = {
  law: 0.82, // the law book lands
  seventies: 2.14, // "1970s"
  airAct: 3.66, // "Clean Air Act"
  waterAct: 4.8, // "Clean Water Act"
  limited: 6.16, // limit line draws
  factories: 6.86, // smoke squashes under the line
  cities: 7.68,
  factory: 9.44, // camera to the factory and river
  pipe: 10.34, // waste gushes into the river
  river: 11.74, // the river squeezes its eyes
  permit: 13.02, // permit lands on the wall
  treatment: 13.68, // tank drops in
  keeps: 14.58, // waste into the tank, clean water out
  limits: 15.92, // river smiles
  breakLimits: 16.98, // a hidden pipe spews
  fines: 18.2, // first fine ticket
  day: 20.94,
  violation: 21.82, // more tickets (every@21.82 violation@22.46)
  violation2: 22.46,
  companies: 23.86, // balance scale appears
  hire: 24.48, // salary on the left pan
  nice: 26.3,
  breaking: 28.3, // fines pile onto the right pan
  rules: 28.9,
  costs: 29.32, // beam slams down on the fines side
  more: 29.82,
  why: 31.42, // engineer thinking
  growing: 32.38, // demand arrow grows
  now: 32.94,
} as const;
