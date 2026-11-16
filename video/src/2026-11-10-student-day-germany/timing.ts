// Scene joins on the full timeline (seconds), from the <Series> frame layout (scenes.ts / lib/scenes.tsx).
// Only the whip whooshes at the joins read from here; everything inside a scene reads its own scene T.
export const T = {
  join1: 32.1333,
  join2: 64.2,
  join3: 97.6667,
  join4: 127.85,
  join5: 161.9667,
} as const;
