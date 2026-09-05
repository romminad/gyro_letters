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

// ----------------------------------------------------
// DISC SETTINGS
// ----------------------------------------------------

// circles are 15% bigger
const SIZE_MULTIPLIER = 1.15;

// vertical optical adjustment for letters
// negative = move letter up
// positive = move letter down
const LETTER_Y_OFFSET = 0.001;

// physics wall thickness
const WALL_THICKNESS = 140;


// ----------------------------------------------------
// SCREEN LIMITS
// Adjust these if you want to fine-tune phone edges
// ----------------------------------------------------

const SAFE_BOUNDS_MOBILE = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 10
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

  // Typeface used INSIDE the circles
  fontMain = loadFont(
    "QuasarRoundedUnlicensedTrialVersion-120.otf"
  );
}


// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);

  textFont(fontMain);
  textAlign(CENTER, CENTER);

  noStroke();


  // --------------------------------------------------
  // MATTER.JS
  // --------------------------------------------------

  engine = Engine.create();
  world = engine.world;

  world.gravity.scale = 0.0014;
  world.gravity.x = 0;
  world.gravity.y = 0;


  createWalls();

  createUI();


  // Initial letters
  rebuildDiscs("TS2A8");
}


// ----------------------------------------------------
// UI
// ----------------------------------------------------

function createUI() {

  // Load UI font + CSS
  installUIStyles();


  // --------------------------------------------------
  // PHONE MOTION BUTTON
  // --------------------------------------------------

  motionButton = createButton(
    "Enable Phone Motion"
  );

  motionButton.position(
    27,
    29
  );

  motionButton.mousePressed(
    toggleMotion
  );

  motionButton.addClass(
    "ui-button"
  );


  // --------------------------------------------------
  // CALIBRATE
  // --------------------------------------------------

  calibrateButton = createButton(
    "Calibrate"
  );

  calibrateButton.position(
    27,
    80
  );

  calibrateButton.mousePressed(
    calibrateMotion
  );

  calibrateButton.addClass(
    "ui-button"
  );


  // --------------------------------------------------
  // TEXT INPUT
  // --------------------------------------------------

  inputField = createInput("");

  inputField.position(
    27,
    131
  );

  inputField.attribute(
    "maxlength",
    "15"
  );

  inputField.attribute(
    "placeholder",
    "Insert text (max.15)"
  );

  inputField.addClass(
    "ui-input"
  );


  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  updateButton = createButton(
    "Update"
  );

  updateButton.position(
    27,
    183
  );

  updateButton.mousePressed(
    () => {
      rebuildDiscs(
        inputField.value()
      );
    }
  );

  updateButton.addClass(
    "ui-button"
  );


  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  resetButton = createButton(
    "Reset"
  );

  resetButton.position(
    149,
    183
  );

  resetButton.mousePressed(
    () => {

      // reset physics using current text
      rebuildDiscs(
        inputField.value()
      );
    }
  );

  resetButton.addClass(
    "ui-button"
  );
}


// ----------------------------------------------------
// UI CSS
// ----------------------------------------------------

function installUIStyles() {

  let style =
    document.createElement("style");


  style.innerHTML = `

    /* -----------------------------------------
       UI TYPEFACE
    ----------------------------------------- */

    @font-face {
      font-family: "G2TGRMono";

      src:
        url("9_G2TGR-Mono-TRIAL.ttf")
        format("truetype");

      font-weight: normal;
      font-style: normal;
    }


    /* -----------------------------------------
       SHARED
    ----------------------------------------- */

    .ui-button,
    .ui-input {

      font-family:
        "G2TGRMono",
        monospace;

      font-size: 22px;
      font-weight: normal;

      line-height: 1;

      box-sizing: border-box;

      border: none;
      border-radius: 0;

      -webkit-appearance: none;
      appearance: none;
    }


    /* -----------------------------------------
       BUTTON
    ----------------------------------------- */

    .ui-button {

      height: 43px;

      padding:
        10px
        17px
        10px
        17px;

      background: #000000;
      color: #ffffff;

      cursor: pointer;

      white-space: nowrap;
    }


    .ui-button:active {

      background: #ffffff;
      color: #000000;
    }


    /* -----------------------------------------
       INPUT
    ----------------------------------------- */

    .ui-input {

      width: 326px;
      height: 45px;

      padding:
        8px
        14px;

      background: #ffffff;
      color: #000000;

      outline: none;

      text-transform: uppercase;
    }


    .ui-input::placeholder {

      color: #000000;

      opacity: 1;

      text-transform: none;
    }


    /* -----------------------------------------
       REMOVE IOS INPUT STYLING
    ----------------------------------------- */

    input {

      -webkit-border-radius: 0;
      border-radius: 0;
    }


    /* -----------------------------------------
       MOBILE
    ----------------------------------------- */

    @media (max-width: 600px) {

      .ui-button,
      .ui-input {

        font-size: 17px;
      }


      .ui-button {

        height: 38px;

        padding:
          9px
          13px;
      }


      .ui-input {

        width: 275px;
        height: 40px;
      }

    }

  `;


  document.head.appendChild(
    style
  );
}


// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {

  background(
    BG_COLOR
  );


  updateGravity();


  Engine.update(
    engine,
    1000 / 60
  );


  drawDiscs();
}


// ----------------------------------------------------
// BUILD DISCS
// ----------------------------------------------------

function rebuildDiscs(rawText) {

  clearDiscs();


  let chars =
    sanitizeText(rawText);


  if (chars.length === 0) {

    chars = ["A"];
  }


  let radius =
    getDiscRadius(chars.length)
    * SIZE_MULTIPLIER;


  let spacing =
    radius * 1.72;


  let cols =
    ceil(
      sqrt(chars.length)
    );


  let rows =
    ceil(
      chars.length / cols
    );


  let startX =
    width * 0.5
    -
    ((cols - 1) * spacing)
    * 0.5;


  let startY =
    height * 0.5
    -
    ((rows - 1) * spacing)
    * 0.5;


  for (
    let i = 0;
    i < chars.length;
    i++
  ) {

    let col =
      i % cols;


    let row =
      floor(
        i / cols
      );


    let x =
      startX
      +
      col * spacing
      +
      random(-8, 8);


    let y =
      startY
      +
      row * spacing
      +
      random(-8, 8);


    let body =
      Bodies.circle(
        x,
        y,
        radius,
        {

          // --------------------------------------
          // BOUNCINESS
          // --------------------------------------

          restitution: 0.28,

          friction: 0.04,

          frictionStatic: 0.25,

          frictionAir: 0.025,

          density: 0.0014
        }
      );


    World.add(
      world,
      body
    );


    discs.push({

      body: body,

      char: chars[i],

      radius: radius,

      outlined:
        i % 2 === 1,

      // --------------------------------------
      // LETTER SIZE
      //
      // Increase 1.55 if you want
      // ONLY the letter bigger.
      // --------------------------------------

      textSize:
        radius * 1.55
    });
  }
}


// ----------------------------------------------------
// CLEAR DISCS
// ----------------------------------------------------

function clearDiscs() {

  for (
    let d of discs
  ) {

    World.remove(
      world,
      d.body
    );
  }


  discs = [];
}


// ----------------------------------------------------
// TEXT CLEANUP
// ----------------------------------------------------

function sanitizeText(value) {

  return value

    .toUpperCase()

    .replace(
      /\s+/g,
      ""
    )

    .split("")

    .filter(
      ch =>
        /[A-Z0-9]/.test(ch)
    )

    // MAXIMUM 15 CHARACTERS
    .slice(0, 15);
}


// ----------------------------------------------------
// RESPONSIVE DISC SIZE
// ----------------------------------------------------

function getDiscRadius(count) {

  let base =
    min(
      width,
      height
    );


  if (count <= 4) {

    return base * 0.12;

  }


  if (count <= 6) {

    return base * 0.108;

  }


  if (count <= 8) {

    return base * 0.098;

  }


  if (count <= 10) {

    return base * 0.088;

  }


  if (count <= 12) {

    return base * 0.080;

  }


  // 13–15 characters
  return base * 0.074;
}


// ----------------------------------------------------
// DRAW DISCS
// ----------------------------------------------------

function drawDiscs() {

  for (
    let d of discs
  ) {

    let x =
      d.body.position.x;


    let y =
      d.body.position.y;


    let a =
      d.body.angle;


    let diameter =
      d.radius * 2;


    let outlineW =
      max(
        4,
        d.radius * 0.07
      );


    push();


    translate(
      x,
      y
    );


    rotate(
      a
    );


    // ------------------------------------------------
    // OUTLINED DISC
    // ------------------------------------------------

    if (d.outlined) {

      noFill();

      stroke(
        FG_COLOR
      );

      strokeWeight(
        outlineW
      );

      circle(
        0,
        0,
        diameter
      );


      noStroke();

      fill(
        FG_COLOR
      );

    }


    // ------------------------------------------------
    // FILLED DISC
    // ------------------------------------------------

    else {

      noStroke();

      fill(
        FG_COLOR
      );

      circle(
        0,
        0,
        diameter
      );


      fill(
        BG_COLOR
      );
    }


    // ------------------------------------------------
    // LETTER
    // ------------------------------------------------

    textFont(
      fontMain
    );


    textSize(
      d.textSize
    );


    textAlign(
      CENTER,
      CENTER
    );


    text(
      d.char,
      0,
      d.radius
      * LETTER_Y_OFFSET
    );


    pop();
  }
}


// ----------------------------------------------------
// WALLS / SCREEN LIMITS
// ----------------------------------------------------

function createWalls() {

  clearWalls();


  let t =
    WALL_THICKNESS;


  let safe =
    getSafeBounds();


  let left =
    safe.left;


  let right =
    width
    -
    safe.right;


  let top =
    safe.top;


  let bottom =
    height
    -
    safe.bottom;


  // --------------------------------------------------
  // TOP WALL
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      (left + right) * 0.5,

      top - t * 0.5,

      (right - left)
      +
      t * 2,

      t,

      {

        isStatic: true,

        restitution: 0.18,

        friction: 0.05

      }

    )

  );


  // --------------------------------------------------
  // BOTTOM WALL
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      (left + right) * 0.5,

      bottom + t * 0.5,

      (right - left)
      +
      t * 2,

      t,

      {

        isStatic: true,

        restitution: 0.18,

        friction: 0.05

      }

    )

  );


  // --------------------------------------------------
  // LEFT WALL
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      left - t * 0.5,

      (top + bottom) * 0.5,

      t,

      (bottom - top)
      +
      t * 2,

      {

        isStatic: true,

        restitution: 0.18,

        friction: 0.05

      }

    )

  );


  // --------------------------------------------------
  // RIGHT WALL
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      right + t * 0.5,

      (top + bottom) * 0.5,

      t,

      (bottom - top)
      +
      t * 2,

      {

        isStatic: true,

        restitution: 0.18,

        friction: 0.05

      }

    )

  );


  World.add(
    world,
    walls
  );
}


// ----------------------------------------------------
// CLEAR WALLS
// ----------------------------------------------------

function clearWalls() {

  for (
    let w of walls
  ) {

    World.remove(
      world,
      w
    );
  }


  walls = [];
}


// ----------------------------------------------------
// SAFE BOUNDS
// ----------------------------------------------------

function getSafeBounds() {

  if (
    isTouchDevice()
  ) {

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


  // --------------------------------------------------
  // PHONE
  // --------------------------------------------------

  if (
    motionEnabled
    &&
    hasOrientationData
  ) {

    let diffGamma =
      rawGamma
      -
      neutralGamma;


    let diffBeta =
      rawBeta
      -
      neutralBeta;


    gx =
      constrain(
        diffGamma / 22,
        -1,
        1
      );


    // tilt down = circles fall down
    // tilt up   = circles fall up

    gy =
      constrain(
        diffBeta / 22,
        -1,
        1
      );

  }


  // --------------------------------------------------
  // DESKTOP MOUSE FALLBACK
  // --------------------------------------------------

  else if (
    !isTouchDevice()
  ) {

    let nx =
      (
        mouseX
        -
        width * 0.5
      )
      /
      (
        width * 0.5
      );


    let ny =
      (
        mouseY
        -
        height * 0.5
      )
      /
      (
        height * 0.5
      );


    gx =
      constrain(
        nx,
        -1,
        1
      );


    gy =
      constrain(
        ny,
        -1,
        1
      );

  }


  // --------------------------------------------------
  // PHONE MOTION OFF
  // --------------------------------------------------

  else {

    gx = 0;
    gy = 0;
  }


  // --------------------------------------------------
  // SMOOTH GRAVITY
  // --------------------------------------------------

  world.gravity.x =
    lerp(
      world.gravity.x,
      gx,
      0.14
    );


  world.gravity.y =
    lerp(
      world.gravity.y,
      gy,
      0.14
    );
}


// ----------------------------------------------------
// PHONE ORIENTATION
// ----------------------------------------------------

function handleOrientation(event) {

  if (
    event.gamma === null
    ||
    event.beta === null
  ) {

    return;
  }


  rawGamma =
    event.gamma;


  rawBeta =
    event.beta;


  hasOrientationData =
    true;
}


// ----------------------------------------------------
// CALIBRATE
// ----------------------------------------------------

function calibrateMotion() {

  if (
    !hasOrientationData
  ) {

    return;
  }


  neutralGamma =
    rawGamma;


  neutralBeta =
    rawBeta;


  world.gravity.x = 0;
  world.gravity.y = 0;


  freezeDiscs();


  calibrateButton.html(
    "Calibrated"
  );


  setTimeout(

    () => {

      calibrateButton.html(
        "Calibrate"
      );

    },

    800

  );
}


// ----------------------------------------------------
// TOGGLE PHONE MOTION
// ----------------------------------------------------

async function toggleMotion() {

  // --------------------------------------------------
  // TURN OFF
  // --------------------------------------------------

  if (
    motionEnabled
  ) {

    motionEnabled = false;


    motionButton.html(
      "Enable Phone Motion"
    );


    world.gravity.x = 0;
    world.gravity.y = 0;


    freezeDiscs();


    return;
  }


  // --------------------------------------------------
  // TURN ON
  // --------------------------------------------------

  try {

    if (
      !sensorStarted
    ) {

      if (
        typeof DeviceOrientationEvent
        !==
        "undefined"
        &&
        typeof DeviceOrientationEvent.requestPermission
        ===
        "function"
      ) {

        let permission =
          await
          DeviceOrientationEvent.requestPermission();


        if (
          permission
          !==
          "granted"
        ) {

          motionButton.html(
            "Motion Denied"
          );

          return;
        }
      }


      window.addEventListener(
        "deviceorientation",
        handleOrientation
      );


      sensorStarted =
        true;
    }


    motionEnabled =
      true;


    motionButton.html(
      "Disable Phone Motion"
    );


    // ------------------------------------------------
    // AUTO CALIBRATE
    // ------------------------------------------------

    setTimeout(

      () => {

        if (
          hasOrientationData
        ) {

          calibrateMotion();
        }

      },

      400

    );

  }


  catch (error) {

    console.error(
      error
    );


    motionButton.html(
      "Motion Error"
    );
  }
}


// ----------------------------------------------------
// FREEZE DISCS
// ----------------------------------------------------

function freezeDiscs() {

  for (
    let d of discs
  ) {

    Body.setVelocity(
      d.body,
      {
        x: 0,
        y: 0
      }
    );


    Body.setAngularVelocity(
      d.body,
      0
    );
  }
}


// ----------------------------------------------------
// TOUCH DEVICE
// ----------------------------------------------------

function isTouchDevice() {

  return (

    "ontouchstart"
    in window

    ||

    navigator.maxTouchPoints
    >
    0

    ||

    navigator.msMaxTouchPoints
    >
    0

  );
}


// ----------------------------------------------------
// RESIZE
// ----------------------------------------------------

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  createWalls();


  rebuildDiscs(
    inputField.value()
  );
}