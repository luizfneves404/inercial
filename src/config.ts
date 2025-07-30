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
};

// App constants
export const BALL_RADIUS = 5;
export const LINE_WIDTH = 5;
export const MIN_LINE_LENGTH = 10;

// Tweakpane parameters
export const PARAMS = {
  gravity: 1,
  friction: 0,
  frictionAir: 0,
  restitution: 1,
  spawnInterval: 500,
  collision: false,
  lineTemplate: "Custom Length",
};

// Helper function
export const frequencyToLineLength = (freq: number) => 20000 / (freq - 200);
