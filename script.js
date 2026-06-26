/* ============================================================
   TOY PAD
============================================================ */
const figures = {
  batman:  { name: "Batman",  power: "speed",    color: "#29b6f6" },
  gandalf: { name: "Gandalf", power: "teleport", color: "#ab47bc" },
  robot:   { name: "Robot",   power: "jump",     color: "#ffd600" }
};

let selectedFigureId = null;
const zoneState = { left: null, middle: null, right: null };

const padOverlay = document.getElementById("pad-overlay");
const openPadBtn = document.getElementById("open-pad-btn");
const closePadBtn = document.getElementById("close-pad-btn");
const figuresContainer = document.getElementById("figures");
const padOutput = document.getElementById("pad-output");

openPadBtn.onclick = () => padOverlay.style.display = "flex";
closePadBtn.onclick = () => padOverlay.style.display = "none";

function renderFigures() {
  figuresContainer.innerHTML = "";
  for (const [id, fig] of Object.entries(figures)) {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;
    btn.dataset.id = id;
    btn.style.borderColor = fig.color;
    btn.onclick = () => selectFigure(id);
    figuresContainer.appendChild(btn);
  }
}

function selectFigure(id) {
  selectedFigureId = id;
  document.querySelectorAll(".figure").forEach(el =>
    el.classList.toggle("active", el.dataset.id === id)
  );
  padOutput.textContent = `${figures[id].name} geselecteerd.`;
}

document.querySelectorAll(".zone").forEach(zone => {
  zone.onclick = () => {
    if (!selectedFigureId) return;
    zoneState[zone.dataset.zone] = selectedFigureId;
    zone.querySelector("span").textContent = figures[selectedFigureId].name;
    zone.style.borderColor = figures[selectedFigureId].color;
    applyPowersFromZones();
  };
});

/* ============================================================
   POWERS
============================================================ */
let speedMultiplier = 1;
let jumpStrength = 0.18;
let canTeleport = false;

function applyPowersFromZones() {
  speedMultiplier = 1;
  jumpStrength = 0.18;
  canTeleport = false;

  for (const id of Object.values(zoneState)) {
    if (id === "batman") speedMultiplier = 1.4;
    if (id === "robot") jumpStrength = 0.28;
    if (id === "gandalf") canTeleport = true;
  }
}

/* ============================================================
   INPUT (KEYBOARD + JOY-CON)
============================================================ */
let keys = {};
window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

let joy = { lx:0, ly:0, rx:0, ry:0, a:false };

function pollGamepads() {
  const pads = navigator.getGamepads?.();
  if (pads) {
    for (const pad of pads) {
      if (!pad) continue;
      if (pad.id.includes("Joy-Con")) {
        joy.lx = pad.axes[0] ?? 0;
        joy.ly = pad.axes[1] ?? 0;
        joy.rx = pad.axes[2] ?? 0;
        joy.ry = pad.axes[3] ?? 0;
        joy.a  = pad.buttons[0]?.pressed || false;
      }
    }
  }
  requestAnimationFrame(pollGamepads);
}
pollGamepads();

/* ============================================================
   BATMAN MODEL
============================================================ */
function createBatman() {
  const group = new THREE.Group();
  const black  = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const yellow = new THREE.MeshLambertMaterial({ color: 0xffd600 });

  // MASK
  const mask = new THREE.Group();
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.50, 0.48), black);
  helmet.position.set(0, 1.28, 0);
  mask.add(helmet);

  const earGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
  const earL = new THREE.Mesh(earGeo, black); earL.position.set(-0.18, 1.55, 0);
  const earR = new THREE.Mesh(earGeo, black); earR.position.set( 0.18, 1.55, 0);
  mask.add(earL, earR);

  const eyeGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
  const eyeL = new THREE.Mesh(eyeGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
  eyeL.position.set(-0.12, 1.30, 0.25);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.12;
  mask.add(eyeL, eyeR);

  group.add(mask);

  // BODY
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.35), black);
  body.position.set(0, 0.65, 0);
  group.add(body);

  // LOGO
  const logo = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.02), yellow);
  logo.position.set(0, 0.70, 0.20);
  group.add(logo);

  const bat = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.12, 0.01), black);
  bat.position.set(0, 0.70, 0.21);
  group.add(bat);

  // BELT
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.18, 0.30), yellow);
  belt.position.set(0, 0.40, 0);
  group.add(belt);

  // LEGS
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.35), black);
  legL.position.set(-0.15, 0.25, 0);
  const legR = legL.clone(); legR.position.x = 0.15;
  group.add(legL, legR);

  // ARMS WITH PIVOT
  const armPivotL = new THREE.Group();
  armPivotL.position.set(-0.4, 0.75, 0);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), black);
  armL.position.set(0, -0.275, 0);
  armPivotL.add(armL);

  const armPivotR = new THREE.Group();
  armPivotR.position.set(0.4, 0.75, 0);
  const armR = armL.clone();
  armR.position.set(0, -0.275, 0);
  armPivotR.add(armR);

  group.add(armPivotL, armPivotR);

  // BATARANG
  const batarang = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.10, 0.02), black);
  batarang.position.set(0.55, 0.75, 0);
  batarang.rotation.z = Math.PI * 0.25;
  group.add(batarang);

  // REFERENCES
  group.legL = legL;
  group.legR = legR;
  group.armPivotL = armPivotL;
  group.armPivotR = armPivotR;

  group.position.set(0, 0.5, 0);
  return group;
}

/* ============================================================
   THREE.JS SCENE
============================================================ */
let scene, camera, renderer, player;
let velocityY = 0;
let onGround = true;
let walkCycle = 0;

let fpsCounter = document.getElementById("fps-counter");
let lastFPSUpdate = 0;
let frames = 0;

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050814);

  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 3, 6);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 1.2));

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.2, 10),
    new THREE.MeshLambertMaterial({ color: 0x111633 })
  );
  floor.position.y = -0.1;
  scene.add(floor);

  player = createBatman();
  scene.add(player);

  animate();
}

/* ============================================================
   PLAYER UPDATE
============================================================ */
function updatePlayer(delta) {
  const speed = 0.08 * speedMultiplier;

  let moveX = joy.lx * speed;
  let moveZ = joy.ly * speed;

  if (keys["w"]) moveZ -= speed;
  if (keys["s"]) moveZ += speed;
  if (keys["a"]) moveX -= speed;
  if (keys["d"]) moveX += speed;

  player.position.x += moveX;
  player.position.z += moveZ;

  const moving = Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01;

  if (moving && onGround) {
    walkCycle += delta * 0.25;
    const swing = Math.sin(walkCycle * 10) * 0.6;

    player.armPivotL.rotation.x = swing;
    player.armPivotR.rotation.x = -swing;
    player.legL.rotation.x = -swing;
    player.legR.rotation.x = swing;
  } else if (onGround) {
    player.armPivotL.rotation.x *= 0.8;
    player.armPivotR.rotation.x *= 0.8;
    player.legL.rotation.x *= 0.8;
    player.legR.rotation.x *= 0.8;
  }

  if ((joy.a || keys[" "]) && onGround) {
    velocityY = jumpStrength;
    onGround = false;
  }

  velocityY -= 0.008;
  player.position.y += velocityY;

  if (player.position.y <= 0.5) {
    player.position.y = 0.5;
    velocityY = 0;
    onGround = true;
  }

  // CAMERA ROTATION
  const rotSpeed = 0.02;
  if (keys["ArrowLeft"])  camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),  rotSpeed);
  if (keys["ArrowRight"]) camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), -rotSpeed);

  camera.lookAt(player.position);
}

/* ============================================================
   ANIMATION LOOP + FPS
============================================================ */
let last = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  // FPS COUNTER
  frames++;
  if (now - lastFPSUpdate > 1000) {
    fpsCounter.textContent = "FPS: " + frames;
    frames = 0;
    lastFPSUpdate = now;
  }

  const delta = (now - last) / 16.67;
  last = now;

  updatePlayer(delta);
  renderer.render(scene, camera);
}

/* ============================================================
   START
============================================================ */
window.onload = () => {
  renderFigures();
  init3D();
};
