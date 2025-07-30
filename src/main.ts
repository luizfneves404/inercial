import "./style.css";
import {
  Bodies,
  Body,
  Composite,
  Events,
  Query,
  Runner,
  Render,
  Vector,
  type IBodyDefinition,
} from "matter-js";
import { setupUI } from "./ui";
import { polySynth } from "./audio";
import { engine, world, render, runner } from "./physics";
import {
  BALL_RADIUS,
  LINE_WIDTH,
  MIN_LINE_LENGTH,
  NOTE_FREQUENCIES,
  PARAMS,
  SCALES,
  frequencyToLineLength,
} from "./config";

// ======== STATE ========
let spawners: { id: number; position: { x: number; y: number } }[] = [];
let musicalSpawners: {
  id: number;
  position: { x: number; y: number };
  note: keyof typeof NOTE_FREQUENCIES;
}[] = [];
let spawnerIdCounter = 0;
let spawnIntervalId: number | null = null;
let songTimeouts: number[] = [];
let startPoint: Vector | null = null;
let currentMousePosition: Vector | null = null;
let isDrawing = false;

// ======== CORE LOGIC ========
const updateAllBodies = (property: string, value: number) => {
  Composite.allBodies(world)
    .filter((b) => b.label === "ball")
    .forEach((body) => Body.set(body, property, value));
};

const updateCollisionFilter = () => {
  const newGroup = PARAMS.collision ? 0 : -1;
  Composite.allBodies(world)
    .filter((b) => b.label === "ball")
    .forEach((ball) => (ball.collisionFilter.group = newGroup));
};

const setupSpawningInterval = () => {
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(() => {
    for (const spawner of spawners) {
      addBall(spawner.position.x, spawner.position.y);
    }
  }, PARAMS.spawnInterval);
};

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

const stopSong = () => {
  songTimeouts.forEach(clearTimeout);
  songTimeouts = [];
};

const clearAll = () => {
  stopSong();
  spawners = [];
  musicalSpawners = [];
  const toRemove = Composite.allBodies(world).filter(
    (b) => b.label === "ball" || b.label === "line"
  );
  Composite.remove(world, toRemove);
};

const setupScale = (scaleType: keyof typeof SCALES) => {
  clearAll();
  const scale = SCALES[scaleType];
  const notesPerRow = 6;
  const verticalSpacing = 220;
  const spawnerOffsetY = 150;
  const startY = render.options.height! * 0.2;
  const horizontalPadding = 200;
  const horizontalSpacing =
    (render.options.width! - horizontalPadding) / (notesPerRow - 1);

  scale.forEach((note: keyof typeof NOTE_FREQUENCIES, i: number) => {
    const rowIndex = Math.floor(i / notesPerRow);
    const colIndex = i % notesPerRow;
    const x = horizontalPadding / 2 + colIndex * horizontalSpacing;
    const lineY = startY + rowIndex * verticalSpacing;
    const lineLength = frequencyToLineLength(NOTE_FREQUENCIES[note]);

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
  if (musicalSpawners.length === 0) setupScale("chromatic");
  const melody = [
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
      if (spawner) addBall(spawner.position.x, spawner.position.y, true);
    }, time);
    songTimeouts.push(timeout);
  });
};

// ======== UI HANDLERS ========
setupUI({
  onGravityChange: (value) => (engine.gravity.y = value),
  onFrictionChange: (value) => updateAllBodies("friction", value),
  onFrictionAirChange: (value) => updateAllBodies("frictionAir", value),
  onRestitutionChange: (value) => updateAllBodies("restitution", value),
  onCollisionChange: updateCollisionFilter,
  onSpawnIntervalChange: setupSpawningInterval,
  setupChromaticScale: () => setupScale("chromatic"),
  playDemoSong: playDemo,
  stopSong: stopSong,
  clearAll: clearAll,
});

// ======== EVENT LISTENERS ========
const canvas = render.canvas;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (event) => {
  const mousePos = Vector.create(event.offsetX, event.offsetY);
  if (event.button === 2) {
    // Right click for deleting
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
    const clickedLines = Query.point(
      Composite.allBodies(world).filter((b) => b.label === "line"),
      mousePos
    );
    if (clickedLines.length > 0) Composite.remove(world, clickedLines[0]);
    return;
  }
  if (event.button === 0) {
    // Left click
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
  if (isDrawing)
    currentMousePosition = Vector.create(event.offsetX, event.offsetY);
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && startPoint && currentMousePosition) {
    const endPoint = currentMousePosition;
    const length = Vector.magnitude(Vector.sub(endPoint, startPoint));
    if (length < MIN_LINE_LENGTH) {
      addBall(startPoint.x, startPoint.y);
    } else {
      const angle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x
      );
      let lineLength = length;
      let center = Vector.div(Vector.add(startPoint, endPoint), 2);

      if (PARAMS.lineTemplate !== "Custom Length") {
        const note = PARAMS.lineTemplate as keyof typeof NOTE_FREQUENCIES;
        lineLength = frequencyToLineLength(NOTE_FREQUENCIES[note]);
        const centerOffsetX = (lineLength / 2) * Math.cos(angle);
        const centerOffsetY = (lineLength / 2) * Math.sin(angle);
        center = Vector.create(
          startPoint.x + centerOffsetX,
          startPoint.y + centerOffsetY
        );
      }

      const line = Bodies.rectangle(
        center.x,
        center.y,
        lineLength,
        LINE_WIDTH,
        {
          isStatic: true,
          angle: angle,
          render: { fillStyle: "#4C6EF5" },
          label: "line",
          customLength: lineLength,
          restitution: PARAMS.restitution,
          friction: PARAMS.friction,
        }
      );
      Composite.add(world, line);
    }
  }
  isDrawing = false;
  startPoint = null;
  currentMousePosition = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  startPoint = null;
  currentMousePosition = null;
});

Events.on(engine, "collisionStart", (event) => {
  for (const pair of event.pairs) {
    const lineBody: IBodyDefinition | null =
      pair.bodyA.label === "line"
        ? pair.bodyA
        : pair.bodyB.label === "line"
        ? pair.bodyB
        : null;
    const ballBody: Body | null =
      pair.bodyA.label === "ball"
        ? pair.bodyA
        : pair.bodyB.label === "ball"
        ? pair.bodyB
        : null;

    if (lineBody && ballBody) {
      const lineLength = lineBody.customLength;
      if (!lineLength) return;
      const pitch = 200 + 20000 / lineLength;
      polySynth.triggerAttackRelease(pitch, "8n");
      if ((ballBody as any).disposable)
        setTimeout(() => Composite.remove(world, ballBody), 100);
    }
  }
});

Events.on(render, "afterRender", () => {
  const context = render.context;
  if (
    isDrawing &&
    startPoint &&
    currentMousePosition &&
    Vector.magnitude(Vector.sub(currentMousePosition, startPoint)) >
      MIN_LINE_LENGTH
  ) {
    let previewEndPoint = currentMousePosition;
    if (PARAMS.lineTemplate !== "Custom Length") {
      const note = PARAMS.lineTemplate as keyof typeof NOTE_FREQUENCIES;
      const length = frequencyToLineLength(NOTE_FREQUENCIES[note]);
      const angle = Math.atan2(
        currentMousePosition.y - startPoint.y,
        currentMousePosition.x - startPoint.x
      );
      previewEndPoint = Vector.create(
        startPoint.x + length * Math.cos(angle),
        startPoint.y + length * Math.sin(angle)
      );
    }
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(previewEndPoint.x, previewEndPoint.y);
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
    context.fillStyle = "#495057";
    context.font = "10px sans-serif";
    context.textAlign = "center";
    context.fillText(spawner.note, spawner.position.x, spawner.position.y - 20);
  }
});

Events.on(engine, "beforeUpdate", () => {
  const allBodies = Composite.allBodies(world);
  for (const body of allBodies) {
    if (
      body.label === "ball" &&
      body.position.y > render.options.height! + 200
    ) {
      Composite.remove(world, body);
    }
  }
});

// ======== INITIALIZATION ========
Render.run(render);
Runner.run(runner, engine);
setupSpawningInterval();
