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
  DEMO_SONGS,
  type Melody,
  type PlayableNote,
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

let isRecording = false;
let recordingStartTime = 0;
let recordedMelody: Melody = [];

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

const addBall = (x: number, y: number) => {
  const ball = Bodies.circle(x, y, BALL_RADIUS, {
    restitution: PARAMS.restitution,
    friction: PARAMS.friction,
    frictionAir: PARAMS.frictionAir,
    render: { fillStyle: "#E64980" },
    label: "ball",
    collisionFilter: { group: PARAMS.collision ? 0 : -1 },
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

const setupScale = (notes: readonly (keyof typeof NOTE_FREQUENCIES)[]) => {
  clearAll();

  const noteCount = notes.length;

  // Dynamic layout calculation based on note count
  const getOptimalLayout = (count: number): number => {
    if (count <= 6) {
      return count;
    } else if (count <= 12) {
      return Math.ceil(count / 2);
    } else if (count <= 18) {
      return 6;
    } else {
      return 6;
    }
  };

  const notesPerRow = getOptimalLayout(noteCount);
  const actualRows = Math.ceil(noteCount / notesPerRow);

  // Dynamic spacing based on screen size and note count
  const minHorizontalPadding = 100;
  const maxHorizontalPadding = 300;
  const horizontalPadding = Math.min(
    maxHorizontalPadding,
    Math.max(minHorizontalPadding, render.options.width! * 0.1)
  );

  // Calculate horizontal spacing to use available width efficiently
  const availableWidth = render.options.width! - horizontalPadding;
  const horizontalSpacing =
    notesPerRow > 1 ? availableWidth / (notesPerRow - 1) : 0;

  // Dynamic vertical spacing based on available height and number of rows
  const availableHeight = render.options.height! * 0.6; // Use 60% of screen height
  const baseVerticalSpacing =
    actualRows > 1 ? availableHeight / (actualRows - 1) : 0;
  const verticalSpacing = Math.max(180, Math.min(250, baseVerticalSpacing));

  // Center the entire grid vertically
  const totalGridHeight = (actualRows - 1) * verticalSpacing;
  const startY = (render.options.height! - totalGridHeight) / 2;

  const spawnerOffsetY = 150;

  notes.forEach((note: keyof typeof NOTE_FREQUENCIES, i: number) => {
    const rowIndex = Math.floor(i / notesPerRow);
    const colIndex = i % notesPerRow;

    // For the last row, center any remaining notes if it's not full
    const notesInThisRow =
      rowIndex === actualRows - 1
        ? noteCount - rowIndex * notesPerRow
        : notesPerRow;

    let x: number;
    if (notesInThisRow < notesPerRow && actualRows > 1) {
      // Center the notes in the last row if it's not full
      const rowWidth = (notesInThisRow - 1) * horizontalSpacing;
      const rowStartX = (render.options.width! - rowWidth) / 2;
      x = rowStartX + colIndex * horizontalSpacing;
    } else {
      // Use the standard positioning
      x = horizontalPadding / 2 + colIndex * horizontalSpacing;
    }

    const lineY = startY + rowIndex * verticalSpacing;
    const lineLength = frequencyToLineLength(NOTE_FREQUENCIES[note]);

    const line = Bodies.rectangle(x, lineY, lineLength, LINE_WIDTH, {
      isStatic: true,
      render: { fillStyle: "#4C6EF5" },
      label: "line",
      customLength: lineLength,
      restitution: PARAMS.restitution,
      friction: PARAMS.friction,
      lineTemplate: note,
    });

    Composite.add(world, line);

    musicalSpawners.push({
      id: spawnerIdCounter++,
      position: { x: x, y: lineY - spawnerOffsetY },
      note: note,
    });
  });
};
const playSong = (melody: ReadonlyArray<PlayableNote>) => {
  // make a custom scale that has only the notes in the melody
  const customScale = Array.from(new Set(melody.map(({ note }) => note))).sort(
    (a, b) => NOTE_FREQUENCIES[a] - NOTE_FREQUENCIES[b]
  );
  setupScale(customScale);

  // Stop any previously playing song.
  stopSong();

  // Schedule each note in the melody.
  melody.forEach(({ note, time }) => {
    const timeout = setTimeout(() => {
      const spawner = musicalSpawners.find((s) => s.note === note);
      if (spawner) {
        addBall(spawner.position.x, spawner.position.y);
      }
    }, time);
    songTimeouts.push(timeout);
  });
};

const toggleRecording = () => {
  isRecording = !isRecording;
  if (isRecording) {
    // Start recording
    recordedMelody = [];
    recordingStartTime = performance.now();
    console.log("🔴 Recording started...");
  } else {
    // Stop recording
    console.log("✅ Recording finished. Melody is ready for export.");
  }
};

const copyRecordedSong = () => {
  if (recordedMelody.length === 0) {
    alert("Nothing to export! Record a melody first.");
    return;
  }

  // Format the melody to a pretty-printed JSON string
  const melodyJSON = JSON.stringify(recordedMelody, null, 2);

  // Copy to clipboard
  navigator.clipboard.writeText(melodyJSON).then(
    () => {
      alert("📋 Recorded song copied to clipboard!");
      console.log("Your recorded song:\n", melodyJSON);
    },
    (err) => {
      console.error("Failed to copy song: ", err);
      // Fallback for older browsers or if permissions fail
      console.log("Your recorded song:\n", melodyJSON);
      alert(
        "Could not copy to clipboard. Check the browser console for your song."
      );
    }
  );
};

const findClosestNote = (pitch: number): keyof typeof NOTE_FREQUENCIES => {
  let closestNote: keyof typeof NOTE_FREQUENCIES = "C4";
  let smallestDiff = Infinity;

  for (const note in NOTE_FREQUENCIES) {
    const frequency = NOTE_FREQUENCIES[note as keyof typeof NOTE_FREQUENCIES];
    const diff = Math.abs(pitch - frequency);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestNote = note as keyof typeof NOTE_FREQUENCIES;
    }
  }
  return closestNote;
};

const handlePasteAndPlay = async () => {
  try {
    // Read the text content from the user's clipboard
    const text = await navigator.clipboard.readText();
    if (!text) {
      alert("Copie uma música primeiro.");
      return;
    }

    // Parse the text as a JSON object
    const melody: Melody = JSON.parse(text);

    // Basic validation to ensure it's a valid song format
    if (
      !Array.isArray(melody) ||
      melody.length === 0 ||
      !melody.every((item) => "note" in item && "time" in item)
    ) {
      throw new Error("Invalid or empty song format.");
    }

    // If valid, play the song
    playSong(melody);
  } catch (error) {
    console.error("Failed to paste or play song:", error);
    alert(
      "Não deu certo. Verifique se você copiou uma música válida em formato JSON."
    );
  }
};

// ======== UI HANDLERS ========
setupUI({
  onGravityChange: (value) => (engine.gravity.y = value),
  onFrictionChange: (value) => updateAllBodies("friction", value),
  onFrictionAirChange: (value) => updateAllBodies("frictionAir", value),
  onRestitutionChange: (value) => updateAllBodies("restitution", value),
  onCollisionChange: updateCollisionFilter,
  onSpawnIntervalChange: setupSpawningInterval,
  setupScale: (scaleType: keyof typeof SCALES) => setupScale(SCALES[scaleType]),
  stopSong: stopSong,
  clearAll: clearAll,
  toggleRecording: toggleRecording,
  copyRecordedSong: copyRecordedSong,
  onPasteAndPlay: handlePasteAndPlay,
  onPlayDemoSong: (songName: keyof typeof DEMO_SONGS) =>
    playSong(DEMO_SONGS[songName]),
});

// ======== EVENT LISTENERS ========
const canvas = render.canvas;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (event) => {
  const mousePos = Vector.create(event.offsetX, event.offsetY);
  if (event.button === 2) {
    // Right click for deleting
    // Check for spawners first
    const spawnerToRemoveIndex = spawners.findIndex(
      (s) => Vector.magnitude(Vector.sub(s.position, mousePos)) < 12
    );
    if (spawnerToRemoveIndex > -1) {
      spawners.splice(spawnerToRemoveIndex, 1);
      return;
    }
    // Check for musical spawners
    const musicalSpawnerToRemoveIndex = musicalSpawners.findIndex(
      (s) => Vector.magnitude(Vector.sub(s.position, mousePos)) < 12
    );
    if (musicalSpawnerToRemoveIndex > -1) {
      musicalSpawners.splice(musicalSpawnerToRemoveIndex, 1);
      return;
    }
    // Check for balls
    const clickedBalls = Query.point(
      Composite.allBodies(world).filter((b) => b.label === "ball"),
      mousePos
    );
    if (clickedBalls.length > 0) {
      Composite.remove(world, clickedBalls[0]);
      return;
    }
    // Check for lines
    const clickedLines = Query.point(
      Composite.allBodies(world).filter((b) => b.label === "line"),
      mousePos
    );
    if (clickedLines.length > 0) Composite.remove(world, clickedLines[0]);
    return;
  }
  if (event.button === 0) {
    // Left click
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click (or Cmd+Click on Mac) to add spawners
      spawners.push({ id: spawnerIdCounter++, position: mousePos });
    } else if (event.shiftKey) {
      // Shift+Click to start drawing lines
      isDrawing = true;
      startPoint = mousePos;
      currentMousePosition = mousePos;
    } else {
      // Regular left click to add balls
      addBall(mousePos.x, mousePos.y);
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
    if (length >= MIN_LINE_LENGTH) {
      const angle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x
      );
      let lineLength = length;
      let center = Vector.div(Vector.add(startPoint, endPoint), 2);

      if (PARAMS.lineTemplate !== "Custom Length") {
        const note = PARAMS.lineTemplate;
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
          lineTemplate: PARAMS.lineTemplate,
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
      if (isRecording) {
        const note = findClosestNote(pitch);
        const time = Math.round(performance.now() - recordingStartTime);
        recordedMelody.push({ note, time });
      }
      if (lineBody.lineTemplate !== "Custom Length")
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
      const note = PARAMS.lineTemplate;
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
