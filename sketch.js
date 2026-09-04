let Engine = Matter.Engine;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;
let Composite = Matter.Composite;

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

let motionButton;
let calibrateButton;
let inputField;
let updateButton;
let resetButton;

const BG_COLOR = "#ff1a0d";
const FG_COLOR = "#000000";

// If top / bottom motion feels reversed on your phone,
// switch this true/false.
const INVERT_Y = true;

// ----------------------------------------------------
// PRELOAD
// ----------------------------------------------------

function preload() {
  fontMain = loadFont("QuasarRoundedUnlicensedTrialVersion-80.otf");
  // If you prefer the other file, change to:
  // loadFont("QuasarRoundedUnlicensedTrialVersion-100.otf");
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

  // Matter gravity uses x/y direction + scale
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
  motionButton.mousePressed(enableMotion);
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

  let radius = getDiscRadius(chars.length);
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
      restitution: 0.15,
      friction: 0.03,
      frictionStatic: 0.2,
      frictionAir: 0.03,
      density: 0.0012
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

    // disc
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
// WALLS
// ----------------------------------------------------

function createWalls() {
  clearWalls();

  let t = 120;

  walls.push(Bodies.rectangle(width * 0.5, -t * 0.5, width + t * 2, t, { isStatic: true }));
  walls.push(Bodies.rectangle(width * 0.5, height + t * 0.5, width + t * 2, t, { isStatic: true }));
  walls.push(Bodies.rectangle(-t * 0.5, height * 0.5, t, height + t * 2, { isStatic: true }));
  walls.push(Bodies.rectangle(width + t * 0.5, height * 0.5, t, height + t * 2, { isStatic: true }));

  World.add(world, walls);
}

function clearWalls() {
  for (let w of walls) {
    World.remove(world, w);
  }
  walls = [];
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
    gy = constrain(diffBeta / 22, -1, 1);

    if (INVERT_Y) gy *= -1;
  } else {
    // desktop mouse fallback
    let nx = (mouseX - width * 0.5) / (width * 0.5);
    let ny = (mouseY - height * 0.5) / (height * 0.5);

    gx = constrain(nx, -1, 1);
    gy = constrain(ny, -1, 1);
  }

  world.gravity.x = lerp(world.gravity.x, gx, 0.12);
  world.gravity.y = lerp(world.gravity.y, gy, 0.12);
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

  for (let d of discs) {
    Body.setVelocity(d.body, { x: 0, y: 0 });
    Body.setAngularVelocity(d.body, 0);
  }

  calibrateButton.html("CALIBRATED");

  setTimeout(() => {
    calibrateButton.html("CALIBRATE");
  }, 800);
}

async function enableMotion() {
  try {
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

    motionEnabled = true;
    motionButton.html("PHONE MOTION ON");
    calibrateButton.show();

    setTimeout(() => {
      if (hasOrientationData) calibrateMotion();
    }, 500);

  } catch (error) {
    console.error(error);
    motionButton.html("MOTION ERROR");
  }
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