// src/ui.ts

import { Pane } from "tweakpane";
import { PARAMS, SCALES } from "./config";

// Define a type for the handlers that the UI will call
interface UIHandlers {
  onGravityChange: (value: number) => void;
  onFrictionChange: (value: number) => void;
  onFrictionAirChange: (value: number) => void;
  onRestitutionChange: (value: number) => void;
  onCollisionChange: () => void;
  onSpawnIntervalChange: () => void;
  setupChromaticScale: () => void;
  playDemoSong: () => void;
  stopSong: () => void;
  clearAll: () => void;
}

export const setupUI = (handlers: UIHandlers) => {
  const pane = new Pane();

  const physicsFolder = pane.addFolder({ title: "Physics" });
  physicsFolder
    .addBinding(PARAMS, "gravity", { min: 0, max: 3 })
    .on("change", (ev) => handlers.onGravityChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "friction", { min: 0, max: 1 })
    .on("change", (ev) => handlers.onFrictionChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "frictionAir", { min: 0, max: 1 })
    .on("change", (ev) => handlers.onFrictionAirChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "restitution", { min: 0, max: 1.5 })
    .on("change", (ev) => handlers.onRestitutionChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "collision", { label: "Ball Collision" })
    .on("change", handlers.onCollisionChange);

  const spawnerFolder = pane.addFolder({ title: "Spawners" });
  spawnerFolder
    .addBinding(PARAMS, "spawnInterval", {
      label: "Spawn Rate (ms)",
      min: 50,
      max: 2000,
      step: 10,
    })
    .on("change", handlers.onSpawnIntervalChange);

  const drawingFolder = pane.addFolder({ title: "Drawing Controls" });
  const lineTemplateOptions = {
    "Custom Length": "Custom Length",
    ...Object.fromEntries(SCALES.chromatic.map((note) => [note, note])),
  };
  drawingFolder.addBinding(PARAMS, "lineTemplate", {
    label: "Line Template",
    options: lineTemplateOptions,
  });

  const soundFolder = pane.addFolder({ title: "Sound Controls" });
  soundFolder
    .addButton({ title: "Setup Chromatic Scale" })
    .on("click", handlers.setupChromaticScale);
  soundFolder
    .addButton({ title: "Play Demo Song" })
    .on("click", handlers.playDemoSong);
  soundFolder.addButton({ title: "Stop Song" }).on("click", handlers.stopSong);
  soundFolder.addButton({ title: "Clear All" }).on("click", handlers.clearAll);
};
