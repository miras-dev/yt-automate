// Scene 5 "Rent and Pfand" (18:00). Scene seconds; the voice starts at 0.1 (vo/scene-5.words.json).
export const VO_FILE = 'vo/scene-5.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 33.32;
export const DURATION = 33.82;
export const GAP_AFTER = 0.3;
export const T = {
  rent: 0.82, // coins fly into the window
  wg: 3.66,
  price: 5.6, // 512 a month
  munich: 8.46,
  home: 10.0, // pan to the supermarket (pause 9.70-10.58)
  bottles: 11.94,
  singleUse: 14.64, // bottle 1
  bottle: 15.8, // bottle 2
  can: 16.34, // bottle 3
  cents: 17.28, // +0.25
  pfand: 19.0,
  shops: 20.38,
  shopping: 22.74,
  sundays: 25.28, // SUNDAY card
  closed: 28.38, // shutter down, CLOSED
  year: 31.68,
  cost: 32.7,
} as const;
