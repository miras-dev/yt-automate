// Scene 1 "Zero euros" (7:00). Scene seconds; the voice starts at 0.1 (vo/scene-1.words.json).
export const VO_FILE = 'vo/scene-1.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 31.34;
export const DURATION = 31.84;
export const GAP_AFTER = 0.3;
export const T = {
  student: 0.36, // "This student"
  waking: 0.94, // alarm rings, eyes open
  university: 2.62,
  jump: 3.62, // out of bed (pause 3.46-3.80)
  tuition: 4.06, // tuition bill drops in
  zero: 5.48, // "zero euros" stamp
  most: 7.66, // pan out to the university
  noTuition: 9.88,
  abroad: 11.64,
  exceptions: 13.7,
  bw: 14.54,
  tum: 16.08,
  outside: 18.54, // "students from outside the EU"
  back: 20.5, // pan back to the room (pause 20.32-20.70)
  fee: 22.2, // semester fee card
  few: 24.02,
  hides: 27.72, // gift box
  bonus: 28.46,
  what: 30.92, // "?"
} as const;
