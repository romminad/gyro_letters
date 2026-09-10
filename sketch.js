let Engine = Matter.Engine;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;

let engine;
let world;

let walls = [];
let discs = [];
let fontMain;


// Colours
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

// Background colour
const BG_COLOR = "#ff1a0d";

// Circle colours
const DISC_BLACK = "#000000";
const DISC_WHITE = "#ffffff";

// fill color for letters
const LETTER_COLOR = "#ff1a0d";


// Circle size
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

const SIZE_MULTIPLIER = 1.15;


// Letter size
// Increase this to make only letters bigger
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

const LETTER_SIZE_MULTIPLIER = 1.55;


// Letter vertical offset ( - = move up / + = move down)
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

const LETTER_Y_OFFSET = 0.001;


// Bounce – Increase for more bounce
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

const DISC_BOUNCE = 0.65;

const WALL_BOUNCE = 0.40;

// Lower number - keeps moving longer
const AIR_DRAG = 0.016;

const WALL_THICKNESS = 140;


// Screen limits - Increase number to move that edge inward
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

const SAFE_BOUNDS_MOBILE = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};

const SAFE_BOUNDS_DESKTOP = {
  left: 18,
  right: 18,
  top: 18,
  bottom: 18
};


// Phone motion
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

let rawGamma = 0;
let rawBeta = 0;

let neutralGamma = 0;
let neutralBeta = 0;

let motionEnabled = false;
let hasOrientationData = false;
let sensorStarted = false;


// Ui
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

let canvas;

let motionButton;
let calibrateButton;
let inputField;
let updateButton;
let resetButton;

let uiHint;

let uiVisible = true;
let uiElements = [];


// Preload
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

function preload() {

  fontMain = loadFont(
    "QuasarRoundedUnlicensedTrialVersion-120.otf"
  );

}


// Setup
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

function setup() {

  canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);

  textFont(fontMain);
  textAlign(CENTER, CENTER);

  noStroke();


  // double tap on mobile
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  canvas.elt.style.touchAction = "none";

  canvas.elt.style.webkitTapHighlightColor =
    "transparent";

    
  // Matter
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  engine = Engine.create();

  world = engine.world;

  world.gravity.scale = 0.0014;

  world.gravity.x = 0;
  world.gravity.y = 0;

  createWalls();

  setupEdgeCollisions();

  createUI();

  setupUIToggle();

  rebuildDiscs("TS2A8");

}


// Draw
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

function draw() {

  background(BG_COLOR);

  updateGravity();

  Engine.update(
    engine,
    1000 / 60
  );

  drawDiscs();

}

// Ui
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

function createUI() {

  installUIStyles();


  // Phone motion
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  motionButton =
    createButton(
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


  // Calibrate
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  calibrateButton =
    createButton(
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


  // Input
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  inputField =
    createInput("");

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


  // Update
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  updateButton =
    createButton(
      "Update"
    );

  updateButton.position(
    25,
    158
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

updateButton.addClass(
    "ui-action-button"
  );
  // Reset
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  resetButton =
    createButton(
      "Reset"
    );

  resetButton.position(
    132,
    158
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


  // DOUBLE TAP NOTE
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  uiHint =
    createDiv(
      "Double Tap UI on/off"
    );

  uiHint.addClass(
    "ui-hint"
  );


  // Ui elements
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––

  uiElements = [

    motionButton,
    calibrateButton,
    inputField,
    updateButton,
    resetButton,
    uiHint

  ];

}


// Ui styles
// –––––––––––––––––––––––––––––––––––––––––––––––––––––

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


    /* –––––––––––––––––––––––––––––––––––––––––––––––––––––
       Button
    –––––––––––––––––––––––––––––––––––––––––––––––––––––*/

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

      touch-action:
        manipulation;

    }


    .ui-button:active {

      background:
        #ffffff;

      color:
        #000000;

    }


    /* –––––––––––––––––––––––––––––––––––––––––––––––––––––
       INPUT
       RED BOX + BLACK OUTLINE
    ––––––––––––––––––––––––––––––––––––––––––––––––––––– */

    .ui-input {

      width:
        198px;

      height:
        38px;

      padding:
        7px 11px;

      background:
        ${BG_COLOR};

      color:
        #000000;

      border:
        2px solid #000000;

      border-radius:
        0;

      outline:
        0;

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


    /* Double tap message
    –––––––––––––––––––––––––––––––––––––––––––––––––––––––– */

    .ui-hint {

      position:
        fixed;

      left:
        25px;

      top:
        202px;

      color:
        #000000;

      font-size:
        13px;

      pointer-events:
        none;

    }


    /* Mobile
    –––––––––––––––––––––––––––––––––––––––––––––––––––––––– */

    @media (max-width: 600px) {

      .ui-button {

        font-size:
          17px;

        height:
          34px;

        padding:
          7px 10px;

      }

      .ui-action-button {
      
         width: 99px;

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

        left:
          25px;

        top:
          202px;

        right: auto; 

        font-size:
          17px;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


// Double tap
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function setupUIToggle() {

  let lastTapTime = 0;

  let lastTapX = 0;
  let lastTapY = 0;


  const DOUBLE_TAP_TIME = 450;

  const DOUBLE_TAP_DISTANCE = 80;


  canvas.elt.addEventListener(

    "pointerup",

    function(event) {

      let now =
        Date.now();


      let timeDifference =
        now - lastTapTime;


      let dx =
        event.clientX - lastTapX;


      let dy =
        event.clientY - lastTapY;


      let distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );


      // Double tap
      // ––––––––––––––––––––––––––––––––––––––––––––––––––––

      if (

        timeDifference > 40

        &&

        timeDifference <
        DOUBLE_TAP_TIME

        &&

        distance <
        DOUBLE_TAP_DISTANCE

      ) {

        event.preventDefault();

        toggleUI();

        lastTapTime = 0;

        return;

      }


      lastTapTime = now;

      lastTapX =
        event.clientX;

      lastTapY =
        event.clientY;

    }

  );

}


// Show / Hide Ui
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function toggleUI() {

  uiVisible =
    !uiVisible;


  for (
    let el of uiElements
  ) {

    if (
      uiVisible
    ) {

      el.show();

    }

    else {

      el.hide();

    }

  }

}


// Create discs
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function rebuildDiscs(rawText) {

  clearDiscs();


  let chars =
    sanitizeText(
      rawText
    );


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
    *
    0.5;


  let startY =
    height * 0.5

    -

    (
      (rows - 1)
      *
      spacing
    )
    *
    0.5;


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

      random(
        -8,
        8
      );


    let y =
      startY

      +

      row * spacing

      +

      random(
        -8,
        8
      );


    let body =
      Bodies.circle(

        x,
        y,
        radius,

        {

          // Used for edge collision detection
          label:
            "disc",


          restitution:
            DISC_BOUNCE,


          friction:
            0.04,


          frictionStatic:
            0.22,


          frictionAir:
            AIR_DRAG,


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


      // Every circle starts black ( Top - white / Bottom - black )
      // ––––––––––––––––––––––––––––––––––––––––––––––––––––

      edgeColor:
        DISC_BLACK,


      textSize:
        radius
        *
        LETTER_SIZE_MULTIPLIER

    });

  }

}


// Clear discs
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Text cleanup
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Responsive circle size
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


  return base * 0.074;

}


// Draw discs
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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

        d.radius *
        0.07

      );


    push();


    translate(
      x,
      y
    );


    rotate(
      angle
    );


    // Outline discs (Top – white outline + white letter / Bottom – black outline + black letter)
    // ––––––––––––––––––––––––––––––––––––––––––––––––––––

    if (
      d.outlined
    ) {

      noFill();


      stroke(
        d.edgeColor
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


      // letter matches outline

      fill(
        d.edgeColor
      );

    }


   
    // Filled discs (Top – white fill + red letter / Bottom – black fill + red letter)
    // ––––––––––––––––––––––––––––––––––––––––––––––––––––

    else {

      noStroke();


      fill(
        d.edgeColor
      );


      circle(
        0,
        0,
        diameter
      );


      fill(
        LETTER_COLOR
      );

    }


    // Letter
    // ––––––––––––––––––––––––––––––––––––––––––––––––––––

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

      d.radius *
      LETTER_Y_OFFSET

    );


    pop();

  }

}


// Create walls
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function createWalls() {

  clearWalls();


  let t =
    WALL_THICKNESS;


  let safe =
    getSafeBounds();


  let left =
    safe.left;


  let right =
    width -
    safe.right;


  let top =
    safe.top;


  let bottom =
    height -
    safe.bottom;


  // Top (all circles → white)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

  walls.push(

    Bodies.rectangle(

      (
        left +
        right
      )
      *
      0.5,

      top -
      t * 0.5,

      (
        right -
        left
      )
      +
      t * 2,

      t,

      {

        label:
          "wall-top",

        isStatic:
          true,

        restitution:
          WALL_BOUNCE,

        friction:
          0.05

      }

    )

  );


  // Bottom (All circles → black)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

  walls.push(

    Bodies.rectangle(

      (
        left +
        right
      )
      *
      0.5,

      bottom +
      t * 0.5,

      (
        right -
        left
      )
      +
      t * 2,

      t,

      {

        label:
          "wall-bottom",

        isStatic:
          true,

        restitution:
          WALL_BOUNCE,

        friction:
          0.05

      }

    )

  );


  // Left (no colour change)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

  walls.push(

    Bodies.rectangle(

      left -
      t * 0.5,

      (
        top +
        bottom
      )
      *
      0.5,

      t,

      (
        bottom -
        top
      )
      +
      t * 2,

      {

        label:
          "wall-left",

        isStatic:
          true,

        restitution:
          WALL_BOUNCE,

        friction:
          0.05

      }

    )

  );


  // Right (no colour change)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

  walls.push(

    Bodies.rectangle(

      right +
      t * 0.5,

      (
        top +
        bottom
      )
      *
      0.5,

      t,

      (
        bottom -
        top
      )
      +
      t * 2,

      {

        label:
          "wall-right",

        isStatic:
          true,

        restitution:
          WALL_BOUNCE,

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


// Clear walls
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Screen bounds
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function getSafeBounds() {

  if (
    isTouchDevice()
  ) {

    return SAFE_BOUNDS_MOBILE;

  }


  return SAFE_BOUNDS_DESKTOP;

}


// Edge collisions ( Top → White / Bottom → Black )
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function setupEdgeCollisions() {

  Matter.Events.on(

    engine,

    "collisionStart",

    function(event) {

      for (
        let pair of event.pairs
      ) {

        let a =
          pair.bodyA;


        let b =
          pair.bodyB;


        let wall =
          null;


        let discBody =
          null;


        // Find disc and wall
        // ––––––––––––––––––––––––––––––––––––––––––––––––––––

        if (

          a.label === "disc"

          &&

          b.label.startsWith(
            "wall-"
          )

        ) {

          discBody =
            a;


          wall =
            b;

        }


        else if (

          b.label === "disc"

          &&

          a.label.startsWith(
            "wall-"
          )

        ) {

          discBody =
            b;


          wall =
            a;

        }


        if (
          !wall ||
          !discBody
        ) {

          continue;

        }


        // Find visual disc
        // ––––––––––––––––––––––––––––––––––––––––––––––––––––

        let d =
          discs.find(

            item =>
              item.body ===
              discBody

          );


        if (
          !d
        ) {

          continue;

        }


        // Top Wall → White
        // ––––––––––––––––––––––––––––––––––––––––––––––––––––

        if (
          wall.label ===
          "wall-top"
        ) {

          d.edgeColor =
            DISC_WHITE;

        }


        // Bottom Wall → Black
        // ––––––––––––––––––––––––––––––––––––––––––––––––––––

        else if (
          wall.label ===
          "wall-bottom"
        ) {

          d.edgeColor =
            DISC_BLACK;

        }


      }

    }

  );

}


// Gravity
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function updateGravity() {

  let gx = 0;
  let gy = 0;


  // Phone motion
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

  if (

    motionEnabled

    &&

    hasOrientationData

  ) {

    let diffGamma =
      rawGamma -
      neutralGamma;


    let diffBeta =
      rawBeta -
      neutralBeta;


    gx =
      constrain(

        diffGamma /
        22,

        -1,

        1

      );


    gy =
      constrain(

        diffBeta /
        22,

        -1,

        1

      );

  }


  // Desktop mouse gravity
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

  else if (
    !isTouchDevice()
  ) {

    let nx =

      (
        mouseX -
        width * 0.5
      )

      /

      (
        width * 0.5
      );


    let ny =

      (
        mouseY -
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


  else {

    gx = 0;
    gy = 0;

  }


  // Smooth gravity transition
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Device orientation
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Calibrate phone motion
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Phone motion toggle
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

async function toggleMotion() {

  // Turn off
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


  // Turn on
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––

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
          permission !==
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


    // Automatic calibration 
    // ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Freeze discs (stop movement)
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

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


// Touch device detection
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function isTouchDevice() {

  return (

    "ontouchstart"
    in window

    ||

    navigator.maxTouchPoints >
    0

  );

}


// Resize
// ––––––––––––––––––––––––––––––––––––––––––––––––––––

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  createWalls();

}