let Engine = Matter.Engine;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;

let engine;
let world;

let walls = [];
let discs = [];

let fontMain;

let rawGamma = 0;
let rawBeta = 0;
let neutralGamma = 0;
let neutralBeta = 0;

let motionEnabled = false;
let hasOrientationData = false;
let sensorStarted = false;

let motionButton;
let calibrateButton;
let inputField;
let updateButton;
let resetButton;

const BG_COLOR = "#ff1a0d";
const FG_COLOR = "#000000";

// 15% bigger
const SIZE_MULTIPLIER = 1.15;

// stronger screen boundaries
const WALL_THICKNESS = 140;

// keeps circles away from phone edges / safari bar
const SAFE_BOUNDS_MOBILE = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 15
};

const SAFE_BOUNDS_DESKTOP = {
  left: 18,
  right: 18,
  top: 18,
  bottom: 18
};


// ----------------------------------------------------
// PRELOAD
// ----------------------------------------------------

function preload() {
  fontMain = loadFont("QuasarRoundedUnlicensedTrialVersion-120.otf");
  // If you prefer the other font file, use:
  // fontMain = loadFont("QuasarRoundedUnlicensedTrialVersion-100.otf");
}


// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont(fontMain);
  textAlign(CENTER, CENTER);
  noStroke();

  engine = Engine.create();
  world = engine.world;

  world.gravity.scale = 0.0014;
  world.gravity.x = 0;
  world.gravity.y = 0;

  createWalls();
  createUI();

  rebuildDiscs("TS2A8");
}


// ----------------------------------------------------
// UI
// ----------------------------------------------------

function createUI() {
  motionButton = createButton("ENABLE PHONE MOTION");
  motionButton.position(18, 20);
  motionButton.mousePressed(toggleMotion);
  styleButton(motionButton);

  calibrateButton = createButton("CALIBRATE");
  calibrateButton.position(18, 58);
  calibrateButton.mousePressed(calibrateMotion);
  styleButton(calibrateButton);
  calibrateButton.hide();

  let typeLabel = createDiv("TYPE");
  typeLabel.position(18, 104);
  styleLabel(typeLabel);

  inputField = createInput("TS2A8");
  inputField.position(18, 126);
  inputField.attribute("maxlength", "10");
  inputField.style("text-transform", "uppercase");

  updateButton = createButton("UPDATE");
  updateButton.position(176, 126);
  updateButton.mousePressed(() => {
    rebuildDiscs(inputField.value());
  });
  styleButton(updateButton);

  resetButton = createButton("RESET STACK");
  resetButton.position(18, 164);
  resetButton.mousePressed(() => {
    rebuildDiscs(inputField.value());
  });
  styleButton(resetButton);
}


// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {
  background(BG_COLOR);

  updateGravity();
  Engine.update(engine, 1000 / 60);

  drawDiscs();
}


// ----------------------------------------------------
// BUILD DISCS
// ----------------------------------------------------

function rebuildDiscs(rawText) {
  clearDiscs();

  let chars = sanitizeText(rawText);

  if (chars.length === 0) {
    chars = ["A"];
  }

  let radius = getDiscRadius(chars.length) * SIZE_MULTIPLIER;
  let spacing = radius * 1.72;

  let cols = ceil(sqrt(chars.length));
  let rows = ceil(chars.length / cols);

  let startX = width * 0.5 - ((cols - 1) * spacing) * 0.5;
  let startY = height * 0.5 - ((rows - 1) * spacing) * 0.5;

  for (let i = 0; i < chars.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);

    let x = startX + col * spacing + random(-8, 8);
    let y = startY + row * spacing + random(-8, 8);

    let body = Bodies.circle(x, y, radius, {
      restitution: 0.28,
      friction: 0.04,
      frictionStatic: 0.25,
      frictionAir: 0.025,
      density: 0.0014
    });

    World.add(world, body);

    discs.push({
      body: body,
      char: chars[i],
      radius: radius,
      outlined: i % 2 === 1,
      textSize: radius * 1.02
    });
  }
}

function clearDiscs() {
  for (let d of discs) {
    World.remove(world, d.body);
  }
  discs = [];
}

function sanitizeText(value) {
  return value
    .toUpperCase()
    .replace(/\s+/g, "")
    .split("")
    .filter(ch => /[A-Z0-9]/.test(ch))
    .slice(0, 10);
}

function getDiscRadius(count) {
  let base = min(width, height);

  if (count <= 4) return base * 0.12;
  if (count <= 6) return base * 0.108;
  if (count <= 8) return base * 0.098;
  return base * 0.088;
}


// ----------------------------------------------------
// DRAW DISCS
// ----------------------------------------------------

function drawDiscs() {
  for (let d of discs) {
    let x = d.body.position.x;
    let y = d.body.position.y;
    let a = d.body.angle;
    let diameter = d.radius * 2;
    let outlineW = max(4, d.radius * 0.07);

    push();
    translate(x, y);
    rotate(a);

    if (d.outlined) {
      noFill();
      stroke(FG_COLOR);
      strokeWeight(outlineW);
      circle(0, 0, diameter);

      noStroke();
      fill(FG_COLOR);
    } else {
      noStroke();
      fill(FG_COLOR);
      circle(0, 0, diameter);

      fill(BG_COLOR);
    }

    textFont(fontMain);
    textSize(d.textSize);
    textAlign(CENTER, CENTER);
    text(d.char, 0, d.radius * 0.05);

    pop();
  }
}


// ----------------------------------------------------
// WALLS / SCREEN LIMITS
// ----------------------------------------------------

function createWalls() {
  clearWalls();

  let t = WALL_THICKNESS;
  let safe = getSafeBounds();

  let left = safe.left;
  let right = width - safe.right;
  let top = safe.top;
  let bottom = height - safe.bottom;

  walls.push(
    Bodies.rectangle(
      (left + right) * 0.5,
      top - t * 0.5,
      (right - left) + t * 2,
      t,
      { isStatic: true
        restitution: 0.18,
        friction: 0.05
      }
    )
  );

  walls.push(
    Bodies.rectangle(
      (left + right) * 0.5,
      bottom + t * 0.5,
      (right - left) + t * 2,
      t,
      { isStatic: true
        restitution: 0.18,
        friction: 0.05
      }
    )
  );

  walls.push(
    Bodies.rectangle(
      left - t * 0.5,
      (top + bottom) * 0.5,
      t,
      (bottom - top) + t * 2,
      { isStatic: true
        restitution: 0.18,
        friction: 0.05
      }
    )
  );

  walls.push(
    Bodies.rectangle(
      right + t * 0.5,
      (top + bottom) * 0.5,
      t,
      (bottom - top) + t * 2,
      { isStatic: true
        restitution: 0.18,
        friction: 0.05
      }
    )
  );

  World.add(world, walls);
}

function clearWalls() {
  for (let w of walls) {
    World.remove(world, w);
  }
  walls = [];
}

function getSafeBounds() {
  if (isTouchDevice()) {
    return SAFE_BOUNDS_MOBILE;
  }
  return SAFE_BOUNDS_DESKTOP;
}


// ----------------------------------------------------
// GRAVITY
// ----------------------------------------------------

function updateGravity() {
  let gx = 0;
  let gy = 0;

  if (motionEnabled && hasOrientationData) {
    let diffGamma = rawGamma - neutralGamma;
    let diffBeta = rawBeta - neutralBeta;

    gx = constrain(diffGamma / 22, -1, 1);

    // FIXED vertical direction:
    // tilt down -> fall down
    // tilt up -> fall up
    gy = constrain(diffBeta / 22, -1, 1);
  } else if (!isTouchDevice()) {
    // desktop mouse fallback
    let nx = (mouseX - width * 0.5) / (width * 0.5);
    let ny = (mouseY - height * 0.5) / (height * 0.5);

    gx = constrain(nx, -1, 1);
    gy = constrain(ny, -1, 1);
  } else {
    gx = 0;
    gy = 0;
  }

  world.gravity.x = lerp(world.gravity.x, gx, 0.14);
  world.gravity.y = lerp(world.gravity.y, gy, 0.14);
}


// ----------------------------------------------------
// PHONE ORIENTATION
// ----------------------------------------------------

function handleOrientation(event) {
  if (event.gamma === null || event.beta === null) return;

  rawGamma = event.gamma;
  rawBeta = event.beta;
  hasOrientationData = true;
}

function calibrateMotion() {
  if (!hasOrientationData) return;

  neutralGamma = rawGamma;
  neutralBeta = rawBeta;

  world.gravity.x = 0;
  world.gravity.y = 0;

  freezeDiscs();

  calibrateButton.html("CALIBRATED");

  setTimeout(() => {
    calibrateButton.html("CALIBRATE");
  }, 800);
}


// ----------------------------------------------------
// TOGGLE PHONE MOTION
// same button ON / OFF
// ----------------------------------------------------

async function toggleMotion() {
  // if already on -> turn off
  if (motionEnabled) {
    motionEnabled = false;
    motionButton.html("ENABLE PHONE MOTION");

    world.gravity.x = 0;
    world.gravity.y = 0;

    freezeDiscs();
    return;
  }

  // turn on
  try {
    if (!sensorStarted) {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        let permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== "granted") {
          motionButton.html("MOTION DENIED");
          return;
        }
      }

      window.addEventListener("deviceorientation", handleOrientation);
      sensorStarted = true;
    }

    motionEnabled = true;
    motionButton.html("PHONE MOTION ON");
    calibrateButton.show();

    setTimeout(() => {
      if (hasOrientationData) {
        calibrateMotion();
      }
    }, 400);

  } catch (error) {
    console.error(error);
    motionButton.html("MOTION ERROR");
  }
}

function freezeDiscs() {
  for (let d of discs) {
    Body.setVelocity(d.body, { x: 0, y: 0 });
    Body.setAngularVelocity(d.body, 0);
  }
}


// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}


// ----------------------------------------------------
// RESIZE
// ----------------------------------------------------

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createWalls();
  rebuildDiscs(inputField.value());
}


// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

function styleLabel(el) {
  el.style("color", "black");
  el.style("font-family", "Arial, sans-serif");
  el.style("font-size", "11px");
  el.style("letter-spacing", "1px");
  el.style("font-weight", "bold");
}

function styleButton(el) {
  el.style("background", "white");
  el.style("color", "black");
  el.style("font-family", "Arial, sans-serif");
}