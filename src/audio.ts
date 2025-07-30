import { PolySynth, Synth } from "tone";

export const polySynth = new PolySynth({
  maxPolyphony: 128,
  voice: Synth,
  options: {
    volume: -10,
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.1,
      release: 0.5,
    },
  },
}).toDestination();
