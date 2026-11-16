// Scene 5 "The promise". Times in SCENE seconds (voice starts at 0.1). From vo/scene-5.words.json.
export const VO_FILE = 'vo/scene-5.mp3';
export const VO_OFFSET = 0.1;
export const VO_END = 25.08;
export const DURATION = 25.58;
export const GAP_AFTER = 0;

export const T = {
  skills: 0.7, // "SKILLS"
  chemistry: 2.54, // flask
  biology: 3.44, // microbe
  law: 4.52, // law book ("environmental law")
  mostly: 6.2, // items fly off
  certainty: 6.8, // "CERTAINTY" stamp
  required: 9.18, // checklist row 1 (law@10.04)
  growing: 11.46, // row 2
  signOff: 14.36, // row 3 (fix@15.14)
  required2: 16.78, // stamp REQUIRED
  urgent: 17.8, // stamp URGENT
  rare: 18.46, // stamp RARE
  expensive: 19.68, // price tag + coins
  end: 21.12, // final shot
  promise: 22.5, // holds the glass
  tap: 23.9, // water pours into the glass
  hurt: 24.64, // the water smiles
  you: 24.8,
} as const;
