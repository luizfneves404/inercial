import "./style.css";
import {
  Engine,
  Render,
  Bodies,
  Composite,
  Events,
  Vector,
  Body,
  type IBodyDefinition,
} from "matter-js";
import { Synth } from "tone";
import { Pane } from "tweakpane";

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
  let lastTime = performance.now();

  setInterval(() => {
    const currentTime = performance.now();

    // Update the engine with a fixed delta time
    Engine.update(engine, physicsInterval);

    lastTime = currentTime;
  }, physicsInterval);
})();

// ======== 2. AUDIO SETUP 🔈 ========
const synth = new Synth().toDestination();

// pane
const PARAMS = {
  gravity: 1,
  friction: 0,
  frictionAir: 0,
  restitution: 1,
};
const pane = new Pane();
pane.addBinding(PARAMS, "gravity", { min: 0, max: 3 }).on("change", (ev) => {
  engine.gravity.y = ev.value;
});
pane.addBinding(PARAMS, "friction", { min: 0, max: 1 }).on("change", (ev) => {
  engine.friction = ev.value;
});
pane
  .addBinding(PARAMS, "frictionAir", { min: 0, max: 1 })
  .on("change", (ev) => {
    engine.frictionAir = ev.value;
  });
pane
  .addBinding(PARAMS, "restitution", { min: 0, max: 1 })
  .on("change", (ev) => {
    engine.restitution = ev.value;
  });
// ======== 3. OBJECTS AND WALLS ========
const addBall = (x: number, y: number) => {
  const ball = Bodies.circle(x, y, 6, {
    restitution: 1,
    friction: 0,
    frictionAir: 0,
    render: { fillStyle: "#E64980" },
    label: "ball",
  });
  Body.setInertia(ball, Infinity);
  Composite.add(world, ball);
};
addBall(width / 2 - 100, 100);
addBall(width / 2 + 100, 150);
const wallOptions = {
  isStatic: true,
  restitution: 1,
  friction: 0,
  frictionAir: 0,
  render: { fillStyle: "#495057" },
};
Composite.add(world, [
  Bodies.rectangle(width / 2, height, width, 50, wallOptions),
  Bodies.rectangle(width / 2, 0, width, 50, wallOptions),
  Bodies.rectangle(0, height / 2, 50, height, wallOptions),
  Bodies.rectangle(width, height / 2, 50, height, wallOptions),
]);

// ======== 4. USER DRAWING LOGIC (IMPROVED UX) ✍️ ========

let startPoint: Vector | null = null;
let currentMousePosition: Vector | null = null;
let isDrawing = false;

// Listen for mouse down to start drawing a line
canvas.addEventListener("mousedown", (event) => {
  const bodies: Body[] = Composite.allBodies(world);
  const clickedBody = bodies.find(
    (body) =>
      body.label === "ball" &&
      Vector.magnitude(
        Vector.sub(body.position, { x: event.offsetX, y: event.offsetY })
      ) < (body.circleRadius ?? 0)
  );

  if (clickedBody) {
    addBall(Math.random() * width, 100);
  } else {
    isDrawing = true;
    startPoint = { x: event.offsetX, y: event.offsetY };
    currentMousePosition = { x: event.offsetX, y: event.offsetY };
  }
});

// --- NEW: Listen for mouse move to update the preview line ---
canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    currentMousePosition = { x: event.offsetX, y: event.offsetY };
  }
});

// Listen for mouse up to create the line body
canvas.addEventListener("mouseup", (event) => {
  if (isDrawing && startPoint && currentMousePosition) {
    const endPoint = currentMousePosition;
    const length = Vector.magnitude(Vector.sub(endPoint, startPoint));

    // If the mouse moved less than 10px, treat it as a click
    if (length < 10) {
      // <-- ADD THIS BLOCK
      addBall(event.offsetX, event.offsetY);
    }
    // If the mouse moved more, treat it as a drag to draw a line
    else if (length > 10) {
      // <-- ADD "else if"
      const center = Vector.div(Vector.add(startPoint, endPoint), 2);
      const angle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x
      );

      const line = Bodies.rectangle(center.x, center.y, length, 10, {
        isStatic: true,
        angle: angle,
        render: { fillStyle: "#4C6EF5" },
        label: "line",
        customLength: length,
      });
      Composite.add(world, line);
    }
  }

  // Reset drawing state
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

// ======== 5. COLLISION AND SOUND LOGIC 💥 ========
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
      const lineLength = lineBody.customLength || 100;
      const pitch = 200 + 20000 / lineLength;
      synth.triggerAttackRelease(pitch, "16n");
    }
  }
});

// ======== 6. CUSTOM RENDERING FOR PREVIEW LINE ✨ ========
Events.on(render, "afterRender", () => {
  if (isDrawing && startPoint && currentMousePosition) {
    const context = render.context;
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(currentMousePosition.x, currentMousePosition.y);
    context.strokeStyle = "rgba(76, 110, 245, 0.7)";
    context.lineWidth = 2;
    context.stroke();
  }
});
