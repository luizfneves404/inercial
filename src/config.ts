// Musical note frequencies (A4 = 440Hz)
export const NOTE_FREQUENCIES = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5": 554.37,
  D5: 587.33,
  "D#5": 622.25,
  E5: 659.25,
  F5: 698.46,
  "F#5": 739.99,
  G5: 783.99,
  "G#5": 830.61,
  A5: 880.0,
  "A#5": 932.33,
  B5: 987.77,
};

// Musical scales
export const SCALES = {
  // A 1-octave chromatic scale starting at C4
  chromatic: [
    "C4",
    "C#4",
    "D4",
    "D#4",
    "E4",
    "F4",
    "F#4",
    "G4",
    "G#4",
    "A4",
    "A#4",
    "B4",
    "C5",
  ] as const,
  // A 2-octave chromatic scale starting at C4
  bigChromatic: [
    "C4",
    "C#4",
    "D4",
    "D#4",
    "E4",
    "F4",
    "F#4",
    "G4",
    "G#4",
    "A4",
    "A#4",
    "B4",
    "C5",
    "C#5",
    "D5",
    "D#5",
    "E5",
    "F5",
    "F#5",
    "G5",
    "G#5",
    "A5",
    "A#5",
    "B5",
  ] as const,

  major: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"] as const,
  minor: ["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4", "C5"] as const,
  pentatonic: ["C4", "D4", "E4", "G4", "A4", "C5"] as const,
  blues: ["C4", "D#4", "F4", "F#4", "G4", "A#4", "C5"] as const,
  harmonicMinor: ["C4", "D4", "D#4", "F4", "G4", "G#4", "B4", "C5"] as const,
  melodicMinor: ["C4", "D4", "D#4", "F4", "G4", "A4", "B4", "C5"] as const,
  ionian: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"] as const,
};

// App constants
export const BALL_RADIUS = 5;
export const LINE_WIDTH = 5;
export const MIN_LINE_LENGTH = 10;

export type PlayableNote = {
  readonly note: keyof typeof NOTE_FREQUENCIES;
  readonly time: number; // in milliseconds
};

export type Melody = PlayableNote[];

export const DEMO_SONGS = {
  "Parabéns pra você": [
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
  "Brilha, brilha, estrelinha": [
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
} as const;

// Tweakpane parameters
export const PARAMS = {
  gravity: 1,
  friction: 0,
  frictionAir: 0,
  restitution: 1,
  spawnInterval: 500,
  collision: false,
  lineTemplate: "Custom Length" as
    | keyof typeof NOTE_FREQUENCIES
    | "Custom Length",
  selectedSong: Object.keys(DEMO_SONGS)[0] as keyof typeof DEMO_SONGS,
  scaleType: "chromatic" as keyof typeof SCALES,
};

// Helper function
export const frequencyToLineLength = (freq: number) => 20000 / (freq - 200);
