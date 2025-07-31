import { PolySynth, Synth, Compressor, Limiter } from "tone";

const compressor = new Compressor(-30, 3);
const limiter = new Limiter(-6);

export const polySynth = new PolySynth({
  maxPolyphony: 64,
  voice: Synth,
  options: {
    volume: -12,
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.005,
      decay: 0.2,
      sustain: 0.05,
      release: 0.3,
    },
  },
})
  .chain(compressor, limiter)
  .toDestination();
