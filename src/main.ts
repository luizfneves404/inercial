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
import { Synth } from "tone";
import { Pane } from "tweakpane";

const BALL_RADIUS = 5;
const LINE_WIDTH = 5;

// ======== 1. INITIAL SETUP ========
const canvas = document.getElementById("app") as HTMLCanvasElement;
const { width, height } = canvas.getBoundingClientRect();

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

(function run() {
  const physicsFps = 240;
  const physicsInterval = 1000 / physicsFps;

  setInterval(() => {
    // Update the engine with a fixed delta time
    Engine.update(engine, physicsInterval);
  }, physicsInterval);
})();

// ======== 2. AUDIO & UI SETUP 🔈 ========
const synth = new Synth().toDestination();

// A helper function to update a property on all dynamic bodies
const updateAllBodies = (property: string, value: any) => {
  // We only want to update balls, not static walls or lines
  const allBodies = Composite.allBodies(world).filter(
    (b) => b.label === "ball"
  );
  for (const body of allBodies) {
    Body.set(body, property, value);
  }
};

const updateCollisionFilter = () => {
  // If true, set group to 0 (default behavior).
  // If false, set group to -1 (balls won't collide with each other).
  const newGroup = PARAMS.collision ? 0 : -1;
  const allBalls = Composite.allBodies(world).filter((b) => b.label === "ball");
  for (const ball of allBalls) {
    ball.collisionFilter.group = newGroup;
  }
};

const PARAMS = {
  gravity: 1,
  friction: 0,
  frictionAir: 0,
  restitution: 1,
  mode: "draw", // New: 'draw' or 'spawner'
  spawnInterval: 500, // New: spawn rate in ms
  collision: false, // New: collision filter
};

const pane = new Pane();

pane.addBinding(PARAMS, "gravity", { min: 0, max: 3 }).on("change", (ev) => {
  engine.gravity.y = ev.value;
});

pane.addBinding(PARAMS, "friction", { min: 0, max: 1 }).on("change", (ev) => {
  updateAllBodies("friction", ev.value);
});

pane
  .addBinding(PARAMS, "frictionAir", { min: 0, max: 1 })
  .on("change", (ev) => {
    updateAllBodies("frictionAir", ev.value);
  });

pane
  .addBinding(PARAMS, "restitution", { min: 0, max: 1 })
  .on("change", (ev) => {
    updateAllBodies("restitution", ev.value);
  });

// New UI controls for spawner mode and rate
pane.addBinding(PARAMS, "mode", {
  label: "Mode",
  options: {
    "Draw Lines": "draw",
    "Add Spawners": "spawner",
  },
});

pane
  .addBinding(PARAMS, "spawnInterval", {
    label: "Spawn Rate (ms)",
    min: 50,
    max: 2000,
    step: 10,
  })
  .on("change", () => {
    // Reset the interval when the rate changes
    setupSpawningInterval();
  });

pane
  .addBinding(PARAMS, "collision", { label: "Ball Collision" })
  .on("change", () => {
    updateCollisionFilter();
  });

// ======== 3. SPAWNER LOGIC 💧 ========
let spawners: { id: number; position: Vector }[] = [];
let spawnerIdCounter = 0;
let spawnIntervalId: number | null = null;

const setupSpawningInterval = () => {
  // Clear any existing interval
  if (spawnIntervalId) {
    clearInterval(spawnIntervalId);
  }
  // Create a new interval that spawns balls from each spawner
  spawnIntervalId = setInterval(() => {
    for (const spawner of spawners) {
      addBall(spawner.position.x, spawner.position.y);
    }
  }, PARAMS.spawnInterval);
};

// ======== 4. OBJECTS AND WALLS ========
const addBall = (x: number, y: number) => {
  const ball = Bodies.circle(x, y, BALL_RADIUS, {
    restitution: PARAMS.restitution,
    friction: PARAMS.friction,
    frictionAir: PARAMS.frictionAir,
    render: { fillStyle: "#E64980" },
    label: "ball",
    collisionFilter: {
      group: PARAMS.collision ? 0 : -1,
    },
  });
  Body.setInertia(ball, Infinity);
  Composite.add(world, ball);
};

// Initial objects
addBall(width / 2, 100);

const wallOptions = {
  isStatic: true,
  restitution: PARAMS.restitution,
  friction: PARAMS.friction,
  frictionAir: PARAMS.frictionAir,
  render: { fillStyle: "#495057" },
};

Composite.add(world, [
  // SHOULD NOT HAVE GROUND. DO NOT REMOVE THIS COMMENT.
  Bodies.rectangle(width / 2, 0, width, 50, wallOptions),
  Bodies.rectangle(0, height / 2, 50, height, wallOptions),
  Bodies.rectangle(width, height / 2, 50, height, wallOptions),
]);

// ======== 5. USER INTERACTION LOGIC (DRAW & SPAWN) ✍️ ========
let startPoint: Vector | null = null;
let currentMousePosition: Vector | null = null;
let isDrawing = false;

// Prevent right-click menu
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (event) => {
  const mousePos = { x: event.offsetX, y: event.offsetY };

  // --- Right-click (button 2): Universal remove for spawners and lines ---
  if (event.button === 2) {
    // First, try to find and remove a spawner (priority)

    const spawnerToRemoveIndex = spawners.findIndex(
      (s) => Vector.magnitude(Vector.sub(s.position, mousePos)) < 12
    );

    if (spawnerToRemoveIndex > -1) {
      spawners.splice(spawnerToRemoveIndex, 1);

      return; // Spawner removed, stop here.
    }

    // If no spawner was found, try to find and remove a line

    const allLines = Composite.allBodies(world).filter(
      (b) => b.label === "line"
    );

    const clickedLines = Query.point(allLines, mousePos);

    if (clickedLines.length > 0) {
      Composite.remove(world, clickedLines[0]);
    }

    return; // Stop further processing for a right-click
  }

  // --- Left-click (button 0): Action depends on the current mode ---
  if (event.button === 0) {
    if (PARAMS.mode === "spawner") {
      // In 'spawner' mode, add a spawner
      spawners.push({
        id: spawnerIdCounter++,
        position: mousePos,
      });
    } else {
      // In 'draw' mode, start drawing a line or a ball
      isDrawing = true;
      startPoint = mousePos;
      currentMousePosition = mousePos;
    }
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    currentMousePosition = { x: event.offsetX, y: event.offsetY };
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (isDrawing && startPoint && currentMousePosition) {
    const endPoint = currentMousePosition;
    const length = Vector.magnitude(Vector.sub(endPoint, startPoint));

    // If drag is very short, add a ball instead of a line
    if (length < 10) {
      addBall(event.offsetX, event.offsetY);
    } else {
      // Otherwise, add a line
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
        customLength: length, // For audio pitch calculation
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
  // Cancel drawing if mouse leaves canvas
  if (isDrawing) {
    isDrawing = false;
    startPoint = null;
    currentMousePosition = null;
  }
});

// ======== 6. COLLISION AND SOUND LOGIC 💥 ========
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
      if (!lineLength) {
        console.error("Line length is not set");
        return;
      }
      const pitch = 200 + 20000 / lineLength;
      synth.triggerAttackRelease(pitch, "16n");
    }
  }
});

// ======== 7. CUSTOM RENDERING & GARBAGE COLLECTION ✨ ========
Events.on(render, "afterRender", () => {
  const context = render.context;

  // Draw the preview line when user is drawing
  if (isDrawing && startPoint && currentMousePosition) {
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(currentMousePosition.x, currentMousePosition.y);
    context.strokeStyle = "rgba(76, 110, 245, 0.7)";
    context.lineWidth = LINE_WIDTH;
    context.lineCap = "round";
    context.stroke();
  }

  // Draw visual indicators for each spawner
  for (const spawner of spawners) {
    context.beginPath();
    context.arc(spawner.position.x, spawner.position.y, 10, 0, 2 * Math.PI);
    context.fillStyle = "rgba(76, 110, 245, 0.2)";
    context.fill();
    context.strokeStyle = "rgba(76, 110, 245, 0.8)";
    context.lineWidth = 2;
    context.stroke();
  }
});

// Remove balls that fall off the screen to save performance
Events.on(engine, "beforeUpdate", () => {
  const allBodies = Composite.allBodies(world);

  for (const body of allBodies) {
    if (body.label === "ball" && body.position.y > height + 200) {
      Composite.remove(world, body);
    }
  }
});

// ======== 8. START THE SPAWNER ========
setupSpawningInterval();
