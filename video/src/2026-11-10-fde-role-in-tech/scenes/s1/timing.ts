// Scene 1 - "Enter the FDE". Times in SCENE seconds; useT() gives scene time.
export const SCENE_NAME = 's1';
export const VO_FILE = 'vo/scene-1.mp3';
export const FPS = 60;
export const VO_OFFSET = 0.1;
export const VO_END = 21.7;
export const DURATION = 22.2; // voice end + 0.5 s

export const T = {
  office: 1.60,     // "office" - "not at an office"
  plane: 2.92,      // "plane" - cut to the plane / airplane window
  customer: 4.34,   // "one customer"
  software: 6.80,   // company sells software
  need: 9.86,       // "what they need"
  hq: 11.62,        // HQ engineer with the paper
  request: 13.12,   // feature request pops as paper
  sits: 14.08,      // "She's going to sit next to them"
  code: 15.80,      // "and write the code herself" - (approx)
  job: 17.76,       // "that job has a name" (after the pause)
  fde: 20.40,       // "Forward Deployed Engineer" lands
} as const;
