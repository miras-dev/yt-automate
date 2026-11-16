// Scene 1 "Dirty job". Times in SCENE seconds (voice starts at 0.1). From vo/scene-1.words.json.
export const VO_FILE = 'vo/scene-1.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 19.9;
export const DURATION = 20.4; // voice end + 0.5 s
export const GAP_AFTER = 0.3;

export const T = {
  engineer: 0.38, // "This engineer"
  sewage: 1.4, // pipe opens its eyes and burps sludge
  smoke: 2.4, // factory puffs
  soil: 3.4, // "poisoned soil": puddle bubbles
  paid: 4.92, // "gets paid": swap to happy, cash starts falling
  cash0: 5.14, // first bundle lands ("well")
  inUS: 6.6, // camera to the pile
  envEng: 7.94, // "environmental engineer" label
  salary: 9.84, // "$107,000" counter
  year: 11.98,
  reveal: 12.92, // "That's more than double": pull back to the worker
  double: 13.4,
  median: 14.02, // worker's number
  workers: 15.16, // worker shrugs
  why: 16.76, // "So why": thinking
  dirty: 17.96, // pipe burps again
  much: 19.2, // "?"
} as const;
