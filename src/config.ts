// Musical note frequencies (A4 = 440Hz)
export const NOTE_FREQUENCIES = {
  F3: 174.61,
  "F#3": 185.0,
  G3: 196.0,
  "G#3": 207.65,
  A3: 220.0,
  "A#3": 233.08,
  B3: 246.94,
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
    { note: "C4", time: 0 }, // Pará
    { note: "C4", time: 500 }, // -béns
    { note: "D4", time: 1000 }, // pra
    { note: "C4", time: 1500 }, // vo-
    { note: "F4", time: 2000 }, // -cê
    { note: "E4", time: 2500 }, // (pausa curta depois)
    { note: "C4", time: 3500 }, // Nes-
    { note: "C4", time: 4000 }, // -ta
    { note: "D4", time: 4500 }, // da-
    { note: "C4", time: 5000 }, // -ta
    { note: "G4", time: 5500 }, // que
    { note: "F4", time: 6000 }, // -ri-da
    { note: "C4", time: 7000 }, // Mui-
    { note: "C4", time: 7500 }, // -tas
    { note: "C5", time: 8000 }, // fe-
    { note: "A4", time: 8500 }, // -li-
    { note: "F4", time: 9000 }, // -ci-
    { note: "E4", time: 9500 }, // -da-
    { note: "D4", time: 10000 }, // -des
    { note: "A#4", time: 11000 }, // Mui-
    { note: "A#4", time: 11500 }, // -tos
    { note: "A4", time: 12000 }, // a-
    { note: "F4", time: 12500 }, // -nos
    { note: "G4", time: 13000 }, // de
    { note: "F4", time: 13500 }, // vi-da
  ],

  "Brilha, Brilha Estrelinha": [
    // A1
    { note: "C4", time: 0 },
    { note: "C4", time: 500 },
    { note: "G4", time: 1000 },
    { note: "G4", time: 1500 },
    { note: "A4", time: 2000 },
    { note: "A4", time: 2500 },
    { note: "G4", time: 3000 },
    // A2
    { note: "F4", time: 4000 },
    { note: "F4", time: 4500 },
    { note: "E4", time: 5000 },
    { note: "E4", time: 5500 },
    { note: "D4", time: 6000 },
    { note: "D4", time: 6500 },
    { note: "C4", time: 7000 },
    // B1
    { note: "G4", time: 8000 },
    { note: "G4", time: 8500 },
    { note: "F4", time: 9000 },
    { note: "F4", time: 9500 },
    { note: "E4", time: 10000 },
    { note: "E4", time: 10500 },
    { note: "D4", time: 11000 },
    // B2
    { note: "G4", time: 12000 },
    { note: "G4", time: 12500 },
    { note: "F4", time: 13000 },
    { note: "F4", time: 13500 },
    { note: "E4", time: 14000 },
    { note: "E4", time: 14500 },
    { note: "D4", time: 15000 },
    // A3 (reprise)
    { note: "C4", time: 16000 },
    { note: "C4", time: 16500 },
    { note: "G4", time: 17000 },
    { note: "G4", time: 17500 },
    { note: "A4", time: 18000 },
    { note: "A4", time: 18500 },
    { note: "G4", time: 19000 },
    // A4 (fechamento final)
    { note: "F4", time: 20000 },
    { note: "F4", time: 20500 },
    { note: "E4", time: 21000 },
    { note: "E4", time: 21500 },
    { note: "D4", time: 22000 },
    { note: "D4", time: 22500 },
    { note: "C4", time: 23000 },
  ],

  "Ode à alegria": [
    // =======================================================
    // A TEMPO: 120 BPM
    // Duração das notas:
    // - Semínima (Quarter Note): 500ms
    // - Mínima (Half Note): 1000ms
    // =======================================================

    // --- Primeira Frase (Compassos 1-4) ---

    // Compasso 1: Mi Mi Fá Sol
    { note: "E4", time: 0 }, // Mi (Semínima)
    { note: "E4", time: 500 }, // Mi (Semínima)
    { note: "F4", time: 1000 }, // Fá (Semínima)
    { note: "G4", time: 1500 }, // Sol (Semínima)

    // Compasso 2: Sol Fá Mi Ré
    { note: "G4", time: 2000 }, // Sol (Semínima)
    { note: "F4", time: 2500 }, // Fá (Semínima)
    { note: "E4", time: 3000 }, // Mi (Semínima)
    { note: "D4", time: 3500 }, // Ré (Semínima)

    // Compasso 3: Dó Dó Ré Mi
    { note: "C4", time: 4000 }, // Dó (Semínima)
    { note: "C4", time: 4500 }, // Dó (Semínima)
    { note: "D4", time: 5000 }, // Ré (Semínima)
    { note: "E4", time: 5500 }, // Mi (Semínima)

    // Compasso 4: Mi Ré Ré
    { note: "E4", time: 6000 }, // Mi (Mínima)
    { note: "D4", time: 6750 }, // Ré (Mínima)
    { note: "D4", time: 7000 }, // Ré (Mínima)

    // --- Segunda Frase (Compassos 5-8) ---

    // Compasso 5: Mi Mi Fá Sol
    { note: "E4", time: 8000 }, // Mi (Semínima)
    { note: "E4", time: 8500 }, // Mi (Semínima)
    { note: "F4", time: 9000 }, // Fá (Semínima)
    { note: "G4", time: 9500 }, // Sol (Semínima)

    // Compasso 6: Sol Fá Mi Ré
    { note: "G4", time: 10000 }, // Sol (Semínima)
    { note: "F4", time: 10500 }, // Fá (Semínima)
    { note: "E4", time: 11000 }, // Mi (Semínima)
    { note: "D4", time: 11500 }, // Ré (Semínima)

    // Compasso 7: Dó Dó Ré Mi
    { note: "C4", time: 12000 }, // Dó (Semínima)
    { note: "C4", time: 12500 }, // Dó (Semínima)
    { note: "D4", time: 13000 }, // Ré (Semínima)
    { note: "E4", time: 13500 }, // Mi (Semínima)

    // Compasso 8: Ré Dó Dó
    { note: "D4", time: 14000 }, // Ré (Mínima)
    { note: "C4", time: 14750 }, // Dó (Mínima, nota final)
    { note: "C4", time: 15000 },
  ],

  "Mary Had a Little Lamb": [
    { note: "E4", time: 0 }, // Ma-
    { note: "D4", time: 500 }, // -ry
    { note: "C4", time: 1000 }, // had
    { note: "D4", time: 1500 }, // a
    { note: "E4", time: 2000 }, // lit-
    { note: "E4", time: 2500 }, // -tle
    { note: "E4", time: 3000 }, // lamb
    { note: "D4", time: 4000 }, // lit-
    { note: "D4", time: 4500 }, // -tle
    { note: "D4", time: 5000 }, // lamb
    { note: "E4", time: 6000 }, // lit-
    { note: "G4", time: 6500 }, // -tle
    { note: "G4", time: 7000 }, // lamb
    { note: "E4", time: 8000 }, // Ma-
    { note: "D4", time: 8500 }, // -ry
    { note: "C4", time: 9000 }, // had
    { note: "D4", time: 9500 }, // a
    { note: "E4", time: 10000 }, // lit-
    { note: "E4", time: 10500 }, // -tle
    { note: "E4", time: 11000 }, // lamb
    { note: "E4", time: 11500 }, // its
    { note: "D4", time: 12000 }, // fleece
    { note: "D4", time: 12500 }, // was
    { note: "E4", time: 13000 }, // white
    { note: "D4", time: 13500 }, // as
    { note: "C4", time: 14000 }, // snow
  ],

  "Frère Jacques": [
    { note: "C4", time: 0 }, // Frè-
    { note: "D4", time: 500 }, // -re
    { note: "E4", time: 1000 }, // Jac-
    { note: "C4", time: 1500 }, // -ques
    { note: "C4", time: 2000 }, // Frè-
    { note: "D4", time: 2500 }, // -re
    { note: "E4", time: 3000 }, // Jac-
    { note: "C4", time: 3500 }, // -ques
    { note: "E4", time: 4000 }, // Dor-
    { note: "F4", time: 4500 }, // -mez
    { note: "G4", time: 5000 }, // vous?
    { note: "E4", time: 6000 }, // Dor-
    { note: "F4", time: 6500 }, // -mez
    { note: "G4", time: 7000 }, // vous?
    { note: "G4", time: 8000 }, // Son-
    { note: "A4", time: 8250 }, // -nez
    { note: "G4", time: 8500 }, // les
    { note: "F4", time: 8750 }, // ma-
    { note: "E4", time: 9000 }, // -ti-
    { note: "C4", time: 9500 }, // -nes
    { note: "G4", time: 10000 }, // Son-
    { note: "A4", time: 10250 }, // -nez
    { note: "G4", time: 10500 }, // les
    { note: "F4", time: 10750 }, // ma-
    { note: "E4", time: 11000 }, // -ti-
    { note: "C4", time: 11500 }, // -nes
    { note: "C4", time: 12000 }, // Ding
    { note: "G3", time: 12500 }, // dong
    { note: "C4", time: 13000 }, // ding
    { note: "C4", time: 14000 }, // Ding
    { note: "G3", time: 14500 }, // dong
    { note: "C4", time: 15000 }, // ding
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
export const frequencyToLineLength = (freq: number) => 40000 / (freq - 150);

export const lineLengthToFrequency = (length: number) => 150 + 40000 / length;
