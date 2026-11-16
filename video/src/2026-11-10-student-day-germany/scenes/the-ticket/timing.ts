// Scene 2 "The ticket" (8:00). Scene seconds; the voice starts at 0.1 (vo/scene-2.words.json).
export const VO_FILE = 'vo/scene-2.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 31.26;
export const DURATION = 31.76;
export const GAP_AFTER = 0.3;
export const T = {
  ticket: 0.26, // ticket flies out of the box
  bus: 1.58,
  train: 2.1,
  include: 5.14, // INCLUDED stamp
  buses: 8.0, // bus crosses
  trams: 9.04, // tram crosses
  subways: 9.64, // U sign
  regional: 10.5, // regional train crosses far
  germany: 12.02,
  price: 14.12, // 37.80
  sixty: 17.12, // bars: 63 vs 37.80
  cologne: 20.86, // route
  ride: 21.5,
  berlin: 23.32,
  noExtra: 24.06,
  longer: 26.08,
  lecture: 27.68, // LECTURE 8:00 card
  why: 29.5,
  nobody: 30.44,
} as const;
