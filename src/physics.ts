import { Engine, Render, Runner, Composite, Bodies } from "matter-js";
import { PARAMS } from "./config";

// ======== SETUP ========
const canvas = document.getElementById("app") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

export const engine = Engine.create();
export const world = engine.world;
engine.gravity.y = PARAMS.gravity;

export const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: canvas.width,
    height: canvas.height,
    wireframes: false,
    background: "#f4f4f8",
  },
});

const physicsFps = 240;
const physicsInterval = 1000 / physicsFps;

export const runner = Runner.create({ delta: physicsInterval });

// Add walls (no ground)
const wallOptions = {
  isStatic: true,
  restitution: PARAMS.restitution,
  friction: PARAMS.friction,
  render: { fillStyle: "#495057" },
};

Composite.add(world, [
  Bodies.rectangle(canvas.width / 2, 0, canvas.width, 50, wallOptions), // Top
  Bodies.rectangle(0, canvas.height / 2, 50, canvas.height, wallOptions), // Left
  Bodies.rectangle(
    canvas.width,
    canvas.height / 2,
    50,
    canvas.height,
    wallOptions
  ), // Right
]);

// Handle window resizing
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
  // Note: You might need to reposition walls here if you want them to stick to the edges perfectly on resize.
});
