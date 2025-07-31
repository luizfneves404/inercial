import { NOTE_FREQUENCIES } from "./config";

export type Melody = { note: keyof typeof NOTE_FREQUENCIES; time: number }[];

export type Songs = Record<string, Melody>;

export const DEMO_SONGS: Songs = {
  "Happy Birthday": [
    { note: "C4", time: 250 },
    { note: "C4", time: 750 },
    { note: "D4", time: 1000 },
    { note: "C4", time: 1500 },
    { note: "F4", time: 2000 },
    { note: "E4", time: 2500 },
    { note: "C4", time: 3500 },
    { note: "C4", time: 4000 },
    { note: "D4", time: 4500 },
    { note: "C4", time: 5000 },
    { note: "G4", time: 5500 },
    { note: "F4", time: 6000 },
    { note: "C4", time: 7000 },
    { note: "C4", time: 7500 },
    { note: "C5", time: 8000 },
    { note: "A4", time: 8500 },
    { note: "F4", time: 9000 },
    { note: "E4", time: 9500 },
    { note: "D4", time: 10000 },
    { note: "A#4", time: 10500 },
    { note: "A#4", time: 11000 },
    { note: "A4", time: 11500 },
    { note: "F4", time: 12000 },
    { note: "G4", time: 12500 },
    { note: "F4", time: 13000 },
  ],
  "Twinkle Twinkle": [
    { note: "C4", time: 0 },
    { note: "C4", time: 500 },
    { note: "G4", time: 1000 },
    { note: "G4", time: 1500 },
    { note: "A4", time: 2000 },
    { note: "A4", time: 2500 },
    { note: "G4", time: 3000 },
    { note: "F4", time: 4000 },
    { note: "F4", time: 4500 },
    { note: "E4", time: 5000 },
    { note: "E4", time: 5500 },
    { note: "D4", time: 6000 },
    { note: "D4", time: 6500 },
    { note: "C4", time: 7000 },
  ],
};
