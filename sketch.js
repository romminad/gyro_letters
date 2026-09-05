let Engine = Matter.Engine;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;

let engine;
let world;

let walls = [];
let discs = [];

let fontMain;

// ----------------------------------------------------
// PHONE MOTION
// ----------------------------------------------------

let rawGamma = 0;
let rawBeta = 0;

let neutralGamma = 0;
let neutralBeta = 0;

let motionEnabled = false;
let hasOrientationData = false;
let sensorStarted = false;


// ----------------------------------------------------
// UI
// ----------------------------------------------------

let canvas;

let motionButton;
let calibrateButton;
let inputField;
let updateButton;
let resetButton;

let uiHint;

let uiVisible = true;
let uiElements = [];


// ----------------------------------------------------
// COLOURS
// ----------------------------------------------------

const BG_COLOR = "#ff1a0d";
const FG_COLOR = "#000000";


// ----------------------------------------------------
// DISC SETTINGS
// ----------------------------------------------------

// overall circle size
const SIZE_MULTIPLIER = 1.15;

// letter vertical position
// negative = higher
// positive = lower
const LETTER_Y_OFFSET = 0.001;

// letter size INSIDE circle
const LETTER_SIZE_MULTIPLIER = 1.55;


// ----------------------------------------------------
// PHYSICS
// ----------------------------------------------------

const WALL_THICKNESS = 140;


// ----------------------------------------------------
// SCREEN LIMITS
//
// Increase a number to push that boundary inward.
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

  // Typeface used inside circles
  fontMain = loadFont(
    "QuasarRoundedUnlicensedTrialVersion-120.otf"
  );
}


// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {

  canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);

  textFont(fontMain);
  textAlign(CENTER, CENTER);

  noStroke();


  // --------------------------------------------------
  // MATTER
  // --------------------------------------------------

  engine = Engine.create();
  world = engine.world;

  world.gravity.scale = 0.0014;

  world.gravity.x = 0;
  world.gravity.y = 0;


  createWalls();

  createUI();

  setupUIToggle();


  // Initial example
  rebuildDiscs("TS2A8");
}


// ----------------------------------------------------
// UI
// ----------------------------------------------------

function createUI() {

  installUIStyles();


  // --------------------------------------------------
  // PHONE MOTION
  // --------------------------------------------------

  motionButton = createButton(
    "Phone Motion Off"
  );

  motionButton.position(
    25,
    24
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
    25,
    68
  );

  calibrateButton.mousePressed(
    calibrateMotion
  );

  calibrateButton.addClass(
    "ui-button"
  );


  // --------------------------------------------------
  // INPUT
  // --------------------------------------------------

  inputField = createInput("");

  inputField.position(
    25,
    112
  );

  inputField.attribute(
    "maxlength",
    "15"
  );

  inputField.attribute(
    "placeholder",
    "Insert text"
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
    25,
    156
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
  //
  // Clears input AND removes all circles.
  // --------------------------------------------------

  resetButton = createButton(
    "Reset"
  );

  resetButton.position(
    132,
    156
  );

  resetButton.mousePressed(
    () => {

      inputField.value("");

      clearDiscs();

      world.gravity.x = 0;
      world.gravity.y = 0;

    }
  );

  resetButton.addClass(
    "ui-button"
  );


  // --------------------------------------------------
  // DOUBLE TAP MESSAGE
  // --------------------------------------------------

  uiHint = createDiv(
    "Double Tap UI on/off"
  );

  uiHint.addClass(
    "ui-hint"
  );


  // --------------------------------------------------
  // STORE UI ELEMENTS
  // --------------------------------------------------

  uiElements = [
    motionButton,
    calibrateButton,
    inputField,
    updateButton,
    resetButton,
    uiHint
  ];
}


// ----------------------------------------------------
// UI STYLE
// ----------------------------------------------------

function installUIStyles() {

  let style =
    document.createElement(
      "style"
    );


  style.innerHTML = `

    @font-face {

      font-family:
        "G2TGRMono";

      src:
        url("9_G2TGR-Mono-TRIAL.ttf")
        format("truetype");

      font-weight:
        normal;

      font-style:
        normal;

    }


    .ui-button,
    .ui-input,
    .ui-hint {

      font-family:
        "G2TGRMono",
        monospace;

      font-weight:
        normal;

      box-sizing:
        border-box;

    }


    /* -----------------------------------------
       BUTTONS
    ----------------------------------------- */

    .ui-button {

      background:
        #000000;

      color:
        #ffffff;

      border:
        0;

      border-radius:
        0;

      height:
        36px;

      padding:
        8px 11px;

      font-size:
        19px;

      line-height:
        1;

      cursor:
        pointer;

      white-space:
        nowrap;

      -webkit-appearance:
        none;

      appearance:
        none;

    }


    .ui-button:active {

      background:
        #ffffff;

      color:
        #000000;

    }


    /* -----------------------------------------
       INPUT
    ----------------------------------------- */

    .ui-input {

      width:
        198px;

      height:
        38px;

      padding:
        7px 11px;

      border:
        0;

      border-radius:
        0;

      outline:
        0;

      background:
        #ffffff;

      color:
        #000000;

      font-size:
        19px;

      -webkit-appearance:
        none;

      appearance:
        none;

      text-transform:
        uppercase;

    }


    .ui-input::placeholder {

      color:
        #000000;

      opacity:
        1;

      text-transform:
        none;

    }


    /* -----------------------------------------
       UI HINT
    ----------------------------------------- */

    .ui-hint {

      position:
        fixed;

      right:
        18px;

      top:
        24px;

      color:
        #000000;

      font-size:
        13px;

      pointer-events:
        none;

    }


    /* -----------------------------------------
       MOBILE
    ----------------------------------------- */

    @media (max-width: 600px) {

      .ui-button {

        font-size:
          17px;

        height:
          34px;

        padding:
          7px 10px;

      }


      .ui-input {

        width:
          196px;

        height:
          36px;

        font-size:
          17px;

      }


      .ui-hint {

        right:
          12px;

        top:
          20px;

        font-size:
          11px;

      }

    }

  `;


  document.head.appendChild(
    style
  );
}


// ----------------------------------------------------
// DOUBLE TAP UI
// ----------------------------------------------------

function setupUIToggle() {

  let lastTap = 0;


  // --------------------------------------------------
  // PHONE DOUBLE TAP
  // --------------------------------------------------

  canvas.elt.addEventListener(

    "touchend",

    function(event) {

      let now =
        Date.now();


      let tapLength =
        now - lastTap;


      if (
        tapLength < 300 &&
        tapLength > 0
      ) {

        event.preventDefault();

        toggleUI();

      }


      lastTap =
        now;

    },

    {
      passive: false
    }

  );


  // --------------------------------------------------
  // DESKTOP DOUBLE CLICK
  // --------------------------------------------------

  canvas.elt.addEventListener(

    "dblclick",

    function() {

      toggleUI();

    }

  );
}


// ----------------------------------------------------
// SHOW / HIDE UI
// ----------------------------------------------------

function toggleUI() {

  uiVisible =
    !uiVisible;


  for (
    let el of uiElements
  ) {

    if (uiVisible) {

      el.show();

    }

    else {

      el.hide();

    }

  }
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
// REBUILD DISCS
// ----------------------------------------------------

function rebuildDiscs(rawText) {

  clearDiscs();


  let chars =
    sanitizeText(rawText);


  // IMPORTANT:
  // If text is empty, leave sketch empty.
  // No automatic "A".
  if (
    chars.length === 0
  ) {

    return;
  }


  let radius =
    getDiscRadius(
      chars.length
    )
    *
    SIZE_MULTIPLIER;


  let spacing =
    radius * 1.72;


  let cols =
    ceil(
      sqrt(
        chars.length
      )
    );


  let rows =
    ceil(
      chars.length /
      cols
    );


  let startX =
    width * 0.5
    -
    (
      (cols - 1)
      *
      spacing
    )
    * 0.5;


  let startY =
    height * 0.5
    -
    (
      (rows - 1)
      *
      spacing
    )
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
          // BOUNCE
          // --------------------------------------

          restitution:
            0.28,

          friction:
            0.04,

          frictionStatic:
            0.25,

          frictionAir:
            0.025,

          density:
            0.0014

        }

      );


    World.add(
      world,
      body
    );


    discs.push({

      body:
        body,

      char:
        chars[i],

      radius:
        radius,

      outlined:
        i % 2 === 1,

      textSize:
        radius
        *
        LETTER_SIZE_MULTIPLIER

    });
  }
}


// ----------------------------------------------------
// CLEAR ALL DISCS
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
// TEXT
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

    .slice(
      0,
      15
    );
}


// ----------------------------------------------------
// DISC SIZE
// ----------------------------------------------------

function getDiscRadius(count) {

  let base =
    min(
      width,
      height
    );


  if (
    count <= 4
  ) {

    return base * 0.12;
  }


  if (
    count <= 6
  ) {

    return base * 0.108;
  }


  if (
    count <= 8
  ) {

    return base * 0.098;
  }


  if (
    count <= 10
  ) {

    return base * 0.088;
  }


  if (
    count <= 12
  ) {

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


    let angle =
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
      angle
    );


    // ------------------------------------------------
    // OUTLINED
    // ------------------------------------------------

    if (
      d.outlined
    ) {

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
    // FILLED
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
      *
      LETTER_Y_OFFSET

    );


    pop();
  }
}


// ----------------------------------------------------
// WALLS
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
  // TOP
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      (
        left + right
      )
      * 0.5,

      top
      -
      t * 0.5,

      (
        right - left
      )
      +
      t * 2,

      t,

      {

        isStatic:
          true,

        restitution:
          0.18,

        friction:
          0.05

      }

    )

  );


  // --------------------------------------------------
  // BOTTOM
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      (
        left + right
      )
      * 0.5,

      bottom
      +
      t * 0.5,

      (
        right - left
      )
      +
      t * 2,

      t,

      {

        isStatic:
          true,

        restitution:
          0.18,

        friction:
          0.05

      }

    )

  );


  // --------------------------------------------------
  // LEFT
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      left
      -
      t * 0.5,

      (
        top + bottom
      )
      * 0.5,

      t,

      (
        bottom - top
      )
      +
      t * 2,

      {

        isStatic:
          true,

        restitution:
          0.18,

        friction:
          0.05

      }

    )

  );


  // --------------------------------------------------
  // RIGHT
  // --------------------------------------------------

  walls.push(

    Bodies.rectangle(

      right
      +
      t * 0.5,

      (
        top + bottom
      )
      * 0.5,

      t,

      (
        bottom - top
      )
      +
      t * 2,

      {

        isStatic:
          true,

        restitution:
          0.18,

        friction:
          0.05

      }

    )

  );


  World.add(
    world,
    walls
  );
}


// ----------------------------------------------------
// REMOVE WALLS
// ----------------------------------------------------

function clearWalls() {

  for (
    let wall of walls
  ) {

    World.remove(
      world,
      wall
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


    // tilt down = gravity down
    // tilt up   = gravity up

    gy =
      constrain(
        diffBeta / 22,
        -1,
        1
      );

  }


  // --------------------------------------------------
  // DESKTOP MOUSE
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
// SENSOR DATA
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
// PHONE MOTION ON / OFF
// ----------------------------------------------------

async function toggleMotion() {

  // --------------------------------------------------
  // TURN OFF
  // --------------------------------------------------

  if (
    motionEnabled
  ) {

    motionEnabled =
      false;


    motionButton.html(
      "Phone Motion Off"
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
      "Phone Motion On"
    );


    // Auto calibrate

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


  catch (
    error
  ) {

    console.error(
      error
    );


    motionButton.html(
      "Motion Error"
    );

  }
}


// ----------------------------------------------------
// FREEZE
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
// TOUCH DEVICE CHECK
// ----------------------------------------------------

function isTouchDevice() {

  return (

    "ontouchstart"
    in window

    ||

    navigator.maxTouchPoints
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