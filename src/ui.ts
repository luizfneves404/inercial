// src/ui.ts
import { Pane } from "tweakpane";
import { PARAMS, SCALES, DEMO_SONGS } from "./config";

// Define a type for the handlers that the UI will call
interface UIHandlers {
  onGravityChange: (value: number) => void;
  onFrictionChange: (value: number) => void;
  onFrictionAirChange: (value: number) => void;
  onRestitutionChange: (value: number) => void;
  onCollisionChange: () => void;
  onSpawnIntervalChange: () => void;
  setupScale: (scaleType: keyof typeof SCALES) => void;
  stopSong: () => void;
  clearAll: () => void;
  toggleRecording: () => void;
  copyRecordedSong: () => void;
  onPasteAndPlay: () => void;
  onPlayDemoSong: (songName: keyof typeof DEMO_SONGS) => void;
}

export const setupUI = (handlers: UIHandlers) => {
  const pane = new Pane({ title: "Controles" });

  const physicsFolder = pane.addFolder({ title: "Física" });
  physicsFolder
    .addBinding(PARAMS, "gravity", { min: 0, max: 3, label: "Gravidade" })
    .on("change", (ev) => handlers.onGravityChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "friction", { min: 0, max: 1, label: "Atrito" })
    .on("change", (ev) => handlers.onFrictionChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "frictionAir", {
      min: 0,
      max: 1,
      label: "Atrito do Ar",
    })
    .on("change", (ev) => handlers.onFrictionAirChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "restitution", {
      min: 0,
      max: 1.5,
      label: "Restituição",
    })
    .on("change", (ev) => handlers.onRestitutionChange(ev.value));
  physicsFolder
    .addBinding(PARAMS, "collision", { label: "Colisão das Bolas" })
    .on("change", handlers.onCollisionChange);

  const spawnerFolder = pane.addFolder({ title: "Spawners" });
  spawnerFolder
    .addBinding(PARAMS, "spawnInterval", {
      label: "Taxa de Spawn (ms)",
      min: 50,
      max: 2000,
      step: 10,
    })
    .on("change", handlers.onSpawnIntervalChange);

  const drawingFolder = pane.addFolder({ title: "Desenho" });
  const lineTemplateOptions = {
    "Tamanho Personalizado": "Custom Length",
    ...Object.fromEntries(SCALES.chromatic.map((note) => [note, note])),
  };
  drawingFolder.addBinding(PARAMS, "lineTemplate", {
    label: "Template de Linha",
    options: lineTemplateOptions,
  });

  const soundFolder = pane.addFolder({ title: "Som" });

  const scaleOptions = Object.fromEntries(
    Object.entries(SCALES).map(([key]) => [key, key])
  );
  soundFolder.addBinding(PARAMS, "scaleType", {
    label: "Escala musical",
    options: scaleOptions,
  });
  soundFolder
    .addButton({ title: "Configurar Escala" })
    .on("click", () => handlers.setupScale(PARAMS.scaleType));

  soundFolder
    .addButton({ title: "Parar Música" })
    .on("click", handlers.stopSong);
  soundFolder
    .addButton({ title: "Limpar Tudo" })
    .on("click", handlers.clearAll);

  const demoSongsOptions = Object.fromEntries(
    Object.entries(DEMO_SONGS).map(([key]) => [key, key])
  );

  soundFolder.addBinding(PARAMS, "selectedSong", {
    label: "Música Demo",
    options: demoSongsOptions,
  });

  soundFolder
    .addButton({ title: "Tocar Música Selecionada 🎵" })
    .on("click", () => {
      handlers.onPlayDemoSong(PARAMS.selectedSong);
    });

  const recordingFolder = pane.addFolder({ title: "Gravação" });
  const startStopButton = recordingFolder
    .addButton({ title: "Iniciar Gravação" })
    .on("click", () => {
      handlers.toggleRecording();
      startStopButton.title =
        startStopButton.title === "Iniciar Gravação"
          ? "Parar Gravação"
          : "Iniciar Gravação";
    });

  recordingFolder
    .addButton({ title: "Copiar Música Gravada" })
    .on("click", handlers.copyRecordedSong);

  recordingFolder
    .addButton({ title: "Colar e Tocar Música" })
    .on("click", handlers.onPasteAndPlay);

  return pane;
};
