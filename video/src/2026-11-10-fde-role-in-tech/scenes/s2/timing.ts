// Scene 2 - "What they actually do"
export const SCENE_NAME = 's2';
export const VO_FILE = 'vo/scene-2.mp3';
export const FPS = 60;
export const VO_OFFSET = 0.1;
export const VO_END = 24.34;
export const DURATION = 24.84;

export const T = {
  lands: 0.40,      // "She lands"
  walks: 1.02,      // walk cycle
  office: 1.80,     // reveal the empty desk
  laptop: 2.98,     // open the laptop
  question: 6.76,   // "the hard question"
  trying: 9.02,     // "trying to do?"
  ship: 11.22,      // "starts shipping"
  dashboards: 12.52, // dashboards appear
  model: 14.12,     // data model block
  workflow: 14.78,   // workflow arrows
  code: 18.22,      // "writes code on the customer's infrastructure" (approx)
  fix: 22.20,       // "commits a fix back to it" (approx)
} as const;
