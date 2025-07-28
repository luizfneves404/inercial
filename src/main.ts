import "./style.css";
import {
  Engine,
  Render,
  Bodies,
  Composite,
  Events,
  Vector,
  Body,
  Query,
  type IBodyDefinition,
} from "matter-js";
import { PolySynth, Synth } from "tone";
import { Pane } from "tweakpane";

const BALL_RADIUS = 5;
const LINE_WIDTH = 5;

// Musical note frequencies (A4 = 440Hz)
const NOTE_FREQUENCIES = {
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
const SCALES = {
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

// Convert frequency to line length using the existing formula
const frequencyToLineLength = (freq: number) => 20000 / (freq - 200);

// ======== SETUP ========
const canvas = document.getElementById("app") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const { width, height } = canvas;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1;

const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: width,
    height: height,
    wireframes: false,
    background: "#f4f4f8",
  },
});

Render.run(render);

// Physics loop
(function run() {
  const physicsFps = 240;
  const physicsInterval = 1000 / physicsFps;
  setInterval(() => {
    Engine.update(engine, physicsInterval);
  }, physicsInterval);
})();

// ======== AUDIO SETUP ========
const polySynth = new PolySynth({
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

// ======== PARAMETERS ========
const PARAMS = {
  gravity: 1,
  friction: 0,
  frictionAir: 0,
  restitution: 1,
  spawnInterval: 500,
  collision: false,
};

// ======== UI SETUP ========
const pane = new Pane();

// --- Physics Controls ---
const physicsFolder = pane.addFolder({ title: "Physics" });
physicsFolder
  .addBinding(PARAMS, "gravity", { min: 0, max: 3 })
  .on("change", (ev) => {
    engine.gravity.y = ev.value;
  });

physicsFolder
  .addBinding(PARAMS, "friction", { min: 0, max: 1 })
  .on("change", (ev) => {
    updateAllBodies("friction", ev.value);
  });

physicsFolder
  .addBinding(PARAMS, "frictionAir", { min: 0, max: 1 })
  .on("change", (ev) => {
    updateAllBodies("frictionAir", ev.value);
  });

physicsFolder
  .addBinding(PARAMS, "restitution", { min: 0, max: 1 })
  .on("change", (ev) => {
    updateAllBodies("restitution", ev.value);
  });

physicsFolder
  .addBinding(PARAMS, "collision", { label: "Ball Collision" })
  .on("change", () => {
    updateCollisionFilter();
  });

// --- Spawner Controls ---
const spawnerFolder = pane.addFolder({ title: "Spawners" });
spawnerFolder
  .addBinding(PARAMS, "spawnInterval", {
    label: "Spawn Rate (ms)",
    min: 50,
    max: 2000,
    step: 10,
  })
  .on("change", () => {
    setupSpawningInterval();
  });

// --- Sound Controls ---
const soundFolder = pane.addFolder({ title: "Sound Controls" });

soundFolder.addButton({ title: "Setup Chromatic Scale" }).on("click", () => {
  setupScale("chromatic");
});

soundFolder.addButton({ title: "Play Demo Song" }).on("click", () => {
  playDemo();
});

soundFolder.addButton({ title: "Stop Song" }).on("click", () => {
  stopSong();
});

soundFolder.addButton({ title: "Clear All" }).on("click", () => {
  clearAll();
});

// ======== SPAWNER & SONG LOGIC ========
let spawners: { id: number; position: { x: number; y: number } }[] = [];
let musicalSpawners: {
  id: number;
  position: { x: number; y: number };
  note: keyof typeof NOTE_FREQUENCIES;
}[] = []; // For song mode
let spawnerIdCounter = 0;
let spawnIntervalId: number | null = null;
let songTimeouts: number[] = [];

const updateAllBodies = (property: string, value: number) => {
  const allBodies = Composite.allBodies(world).filter(
    (b) => b.label === "ball"
  );
  for (const body of allBodies) {
    Body.set(body, property, value);
  }
};

const updateCollisionFilter = () => {
  const newGroup = PARAMS.collision ? 0 : -1;
  const allBalls = Composite.allBodies(world).filter((b) => b.label === "ball");
  for (const ball of allBalls) {
    ball.collisionFilter.group = newGroup;
  }
};

const setupSpawningInterval = () => {
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(() => {
    for (const spawner of spawners) {
      addBall(spawner.position.x, spawner.position.y);
    }
  }, PARAMS.spawnInterval);
};

// ======== OBJECTS ========
const addBall = (x: number, y: number, disposable = false) => {
  const ball = Bodies.circle(x, y, BALL_RADIUS, {
    restitution: PARAMS.restitution,
    friction: PARAMS.friction,
    frictionAir: PARAMS.frictionAir,
    render: { fillStyle: disposable ? "#E64980" : "#E64980" },
    label: "ball",
    collisionFilter: { group: PARAMS.collision ? 0 : -1 },
    disposable: disposable,
  });
  Body.setInertia(ball, Infinity);
  Composite.add(world, ball);
};

const wallOptions = {
  isStatic: true,
  restitution: PARAMS.restitution,
  friction: PARAMS.friction,
  frictionAir: PARAMS.frictionAir,
  render: { fillStyle: "#495057" },
};

// Add walls (no ground) do not change this comment.
Composite.add(world, [
  Bodies.rectangle(width / 2, 0, width, 50, wallOptions),
  Bodies.rectangle(0, height / 2, 50, height, wallOptions),
  Bodies.rectangle(width, height / 2, 50, height, wallOptions),
]);

// ======== MUSICAL FUNCTIONS ========
const setupScale = (scaleType: keyof typeof SCALES) => {
  clearAll();
  const scale = SCALES[scaleType];

  const notesPerRow = 6;
  const verticalSpacing = 220;
  const spawnerOffsetY = 150;
  const startY = height * 0.2;
  const horizontalPadding = 200;

  const horizontalSpacing = (width - horizontalPadding) / (notesPerRow - 1);

  scale.forEach((note: keyof typeof NOTE_FREQUENCIES, i: number) => {
    const rowIndex = Math.floor(i / notesPerRow);
    const colIndex = i % notesPerRow;

    const x = horizontalPadding / 2 + colIndex * horizontalSpacing;
    const lineY = startY + rowIndex * verticalSpacing;

    if (lineY > height - 50) {
      console.warn(
        "Note layout exceeds screen height. Some notes may not be visible."
      );
      return;
    }

    const freq = NOTE_FREQUENCIES[note];
    const lineLength = frequencyToLineLength(freq);

    const line = Bodies.rectangle(x, lineY, lineLength, LINE_WIDTH, {
      isStatic: true,
      render: { fillStyle: "#4C6EF5" },
      label: "line",
      customLength: lineLength,
      restitution: PARAMS.restitution,
      friction: PARAMS.friction,
    });
    Composite.add(world, line);

    musicalSpawners.push({
      id: spawnerIdCounter++,
      position: { x: x, y: lineY - spawnerOffsetY },
      note: note,
    });
  });
};

const playDemo = () => {
  if (musicalSpawners.length === 0) {
    setupScale("chromatic");
  }

  const melody: { note: string; time: number }[] = [
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
  ];

  stopSong();

  melody.forEach(({ note, time }) => {
    const timeout = setTimeout(() => {
      const spawner = musicalSpawners.find((s) => s.note === note);
      if (spawner) {
        addBall(spawner.position.x, spawner.position.y, true);
      }
    }, time);
    songTimeouts.push(timeout);
  });
};

const stopSong = () => {
  songTimeouts.forEach((timeout) => clearTimeout(timeout));
  songTimeouts = [];
};

const clearAll = () => {
  stopSong();
  spawners = [];
  musicalSpawners = [];
  const allBodies = Composite.allBodies(world);
  const toRemove = allBodies.filter(
    (b) => b.label === "ball" || b.label === "line"
  );
  Composite.remove(world, toRemove);
};

// ======== USER INTERACTION ========
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

let startPoint: Vector | null = null;
let currentMousePosition: Vector | null = null;
let isDrawing = false;

canvas.addEventListener("mousedown", (event) => {
  const mousePos = Vector.create(event.offsetX, event.offsetY);

  if (event.button === 2) {
    const spawnerToRemoveIndex = spawners.findIndex(
      (s) => Vector.magnitude(Vector.sub(s.position, mousePos)) < 12
    );
    if (spawnerToRemoveIndex > -1) {
      spawners.splice(spawnerToRemoveIndex, 1);
      return;
    }

    const musicalSpawnerToRemoveIndex = musicalSpawners.findIndex(
      (s) => Vector.magnitude(Vector.sub(s.position, mousePos)) < 12
    );
    if (musicalSpawnerToRemoveIndex > -1) {
      musicalSpawners.splice(musicalSpawnerToRemoveIndex, 1);
      return;
    }

    const allLines = Composite.allBodies(world).filter(
      (b) => b.label === "line"
    );
    const clickedLines = Query.point(allLines, mousePos);
    if (clickedLines.length > 0) {
      Composite.remove(world, clickedLines[0]);
    }

    const allBalls = Composite.allBodies(world).filter(
      (b) => b.label === "ball"
    );
    const clickedBalls = Query.point(allBalls, mousePos);
    if (clickedBalls.length > 0) {
      Composite.remove(world, clickedBalls[0]);
    }

    return;
  }

  if (event.button === 0) {
    if (event.shiftKey) {
      spawners.push({ id: spawnerIdCounter++, position: mousePos });
    } else {
      isDrawing = true;
      startPoint = mousePos;
      currentMousePosition = mousePos;
    }
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    currentMousePosition = Vector.create(event.offsetX, event.offsetY);
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (isDrawing && startPoint && currentMousePosition) {
    const endPoint = currentMousePosition;
    const length = Vector.magnitude(Vector.sub(endPoint, startPoint));

    if (length < 10) {
      addBall(event.offsetX, event.offsetY);
    } else {
      const center = Vector.div(Vector.add(startPoint, endPoint), 2);
      const angle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x
      );

      const line = Bodies.rectangle(center.x, center.y, length, LINE_WIDTH, {
        isStatic: true,
        angle: angle,
        render: { fillStyle: "#4C6EF5" },
        label: "line",
        customLength: length,
        restitution: PARAMS.restitution,
        friction: PARAMS.friction,
      });
      Composite.add(world, line);
    }
  }

  isDrawing = false;
  startPoint = null;
  currentMousePosition = null;
});

canvas.addEventListener("mouseleave", () => {
  if (isDrawing) {
    isDrawing = false;
    startPoint = null;
    currentMousePosition = null;
  }
});

// ======== COLLISION AND SOUND ========
Events.on(engine, "collisionStart", (event) => {
  const pairs = event.pairs;
  for (const pair of pairs) {
    let lineBody: IBodyDefinition | null = null;
    let ballBody: IBodyDefinition | null = null;

    if (pair.bodyA.label === "line" && pair.bodyB.label === "ball") {
      lineBody = pair.bodyA;
      ballBody = pair.bodyB;
    } else if (pair.bodyB.label === "line" && pair.bodyA.label === "ball") {
      lineBody = pair.bodyB;
      ballBody = pair.bodyA;
    }

    if (lineBody && ballBody) {
      const lineLength = lineBody.customLength;
      if (!lineLength) return;
      const pitch = 200 + 20000 / lineLength;

      polySynth.triggerAttackRelease(pitch, "8n");

      if (ballBody.disposable) {
        setTimeout(() => {
          Composite.remove(world, ballBody);
        }, 100);
      }
    }
  }
});

// ======== RENDERING ========
Events.on(render, "afterRender", () => {
  const context = render.context;

  if (isDrawing && startPoint && currentMousePosition) {
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(currentMousePosition.x, currentMousePosition.y);
    context.strokeStyle = "rgba(76, 110, 245, 0.7)";
    context.lineWidth = LINE_WIDTH;
    context.lineCap = "round";
    context.stroke();
  }

  for (const spawner of spawners) {
    context.beginPath();
    context.arc(spawner.position.x, spawner.position.y, 10, 0, 2 * Math.PI);
    context.fillStyle = "rgba(76, 110, 245, 0.2)";
    context.fill();
    context.strokeStyle = "rgba(76, 110, 245, 0.8)";
    context.lineWidth = 2;
    context.stroke();
  }

  for (const spawner of musicalSpawners) {
    context.beginPath();
    context.arc(spawner.position.x, spawner.position.y, 12, 0, 2 * Math.PI);
    context.fillStyle = "rgba(230, 73, 128, 0.3)";
    context.fill();
    context.strokeStyle = "rgba(230, 73, 128, 0.8)";
    context.lineWidth = 2;
    context.stroke();

    if (spawner.note) {
      context.fillStyle = "#495057";
      context.font = "10px sans-serif";
      context.textAlign = "center";
      context.fillText(
        spawner.note,
        spawner.position.x,
        spawner.position.y - 20
      );
    }
  }
});

// ======== GARBAGE COLLECTION ========
Events.on(engine, "beforeUpdate", () => {
  const allBodies = Composite.allBodies(world);
  for (const body of allBodies) {
    if (body.label === "ball" && body.position.y > height + 200) {
      Composite.remove(world, body);
    }
  }
});

// ======== INITIALIZATION ========
setupSpawningInterval();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
});
