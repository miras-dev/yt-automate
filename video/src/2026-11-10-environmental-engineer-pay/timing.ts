// Scene joins on the full timeline (seconds), from the scene lengths in scenes/*/timing.ts and the <Series> frame layout.
// Only the whip whooshes at the joins read from here; everything inside a scene reads its own scene T.
export const T = {
  join1: 20.7,
  join2: 54.8667,
  join3: 88.3,
  join4: 114.4,
} as const;
