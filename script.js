/* ============================================================
   UI ELEMENTS
============================================================ */
const loadingScreen = document.getElementById("loading-screen");
const padOverlay = document.getElementById("pad-overlay");
const settingsOverlay = document.getElementById("settings-overlay");
const figuresContainer = document.getElementById("figures");
const padOutput = document.getElementById("pad-output");
const fpsCounter = document.getElementById("fps-counter");

/* Buttons */
document.getElementById("open-pad-btn").onclick = () => padOverlay.style.display = "flex";
document.getElementById("close-pad-btn").onclick = () => padOverlay.style.display = "none";
document.getElementById("open-settings-btn").onclick = () => settingsOverlay.style.display = "flex";
document.getElementById("close-settings-btn").onclick = () => settingsOverlay.style.display = "none";

/* Settings controls */
const toggleShadows = document.getElementById("toggle-shadows");
const renderScale = document.getElementById("render-scale");
const toggleCameraRotate = document.getElementById("toggle-camera-rotate");
const toggleFPS = document.getElementById("toggle-fps");

/* ============================================================
   FIGURE DATA
============================================================ */
const figures = {
  batman:      { name: "Batman",      power: "speed",       color: "#29b6f6" },
  gandalf:     { name: "Gandalf",     power: "teleport",    color: "#ab47bc" },
  robot:       { name: "Robot",       power: "jump",        color: "#ffd600" },
  wyldstyle:   { name: "Wyldstyle",   power: "build",       color: "#ff4081" },
  superman:    { name: "Superman",    power: "fly",         color: "#3f51b5" },
  flash:       { name: "The Flash",   power: "ultraspeed",  color: "#ff1744" },
  joker:       { name: "Joker",       power: "chaos",       color: "#8bc34a" },
  emmet:       { name: "Emmet",       power: "buildboost",  color: "#ff9800" },
  cyberninja:  { name: "Cyber Ninja", power: "stealthjump", color: "#00e5ff" }
};

let selectedFigureId = null;
const zoneState = { left: null, middle: null, right: null };

/* ============================================================
   RENDER FIGURES IN TOYPAD
============================================================ */
function renderFigures() {
  figuresContainer.innerHTML = "";
  for (const [id, fig] of Object.entries(figures)) {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;
    btn.style.borderColor = fig.color;
    btn.onclick = () => selectFigure(id);
    figuresContainer.appendChild(btn);
  }
}

function selectFigure(id) {
  selectedFigureId = id;
  document.querySelectorAll(".figure").forEach(el =>
    el.classList.toggle("active", el.textContent === figures[id].name)
  );
  padOutput.textContent = `${figures[id].name} geselecteerd. Klik een zone.`;
}

/* ============================================================
   PLACE FIGURE ON ZONE
============================================================ */
document.querySelectorAll(".zone").forEach(zone => {
  zone.onclick = () => {
    if (!selectedFigureId) return;
    placeFigureOnZone(selectedFigureId, zone.dataset.zone);
  };
});

function placeFigureOnZone(id, zone) {
  zoneState[zone] = id;

  const zoneEl = document.querySelector(`.zone[data-zone="${zone}"]`);
  zoneEl.querySelector("span").textContent = figures[id].name;
  zoneEl.style.borderColor = figures[id].color;
  zoneEl.style.boxShadow = `0 0 16px ${figures[id].color}`;

  padOutput.textContent = `${figures[id].name} geplaatst op ${zone}.`;

  applyPowers();
  spawnFigure(id);
}

/* ============================================================
   POWERS
============================================================ */
let speedMultiplier = 1;
let jumpStrength = 0.18;
let canTeleport = false;

function applyPowers() {
  speedMultiplier = 1;
  jumpStrength = 0.18;
  canTeleport = false;

  for (const id of Object.values(zoneState)) {
    if (!id) continue;
    const p = figures[id].power;

    if (p === "speed") speedMultiplier = 1.4;
    if (p === "jump") jumpStrength = 0.28;
    if (p === "teleport") canTeleport = true;
    if (p === "ultraspeed") speedMultiplier = 2.2;
    if (p === "stealthjump") jumpStrength = 0.35;
  }
}

/* ============================================================
   INPUT (KEYBOARD + JOY-CON)
============================================================ */
let keys = {};
window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

let joy = { lx:0, ly:0, a:false };

function pollGamepads() {
  const pads = navigator.getGamepads?.();
  let connected = false;

  if (pads) {
    for (const pad of pads) {
      if (!pad) continue;
      if (pad.id.toLowerCase().includes("joy") || pad.id.toLowerCase().includes("gamepad")) {
        joy.lx = pad.axes[0] ?? 0;
        joy.ly = pad.axes[1] ?? 0;
        joy.a  = pad.buttons[0]?.pressed || false;
        connected = true;
      }
    }
  }

  document.getElementById("joycon-text").textContent =
    connected ? "Gamepad: verbonden" : "Gamepad: geen verbonden";
  document.getElementById("joycon-icon").textContent =
    connected ? "🟩" : "🟥";

  requestAnimationFrame(pollGamepads);
}
pollGamepads();

/* ============================================================
   MODELS
============================================================ */
function createBatman() {
  const g = new THREE.Group();
  const black = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const yellow = new THREE.MeshLambertMaterial({ color: 0xffd600 });

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), black);
  head.position.y = 1.3;
  g.add(head);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), black);
  body.position.y = 0.7;
  g.add(body);

  const logo = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.05), yellow);
  logo.position.set(0, 0.75, 0.23);
  g.add(logo);

  g.position.y = 0.5;
  return g;
}

function spawnFigure(id) {
  if (player) scene.remove(player);

  if (id === "batman") {
    player = createBatman();
  } else {
    player = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.1, 0.6),
      new THREE.MeshLambertMaterial({ color: figures[id].color })
    );
    player.position.y = 0.55;
  }

  scene.add(player);
}

/* ============================================================
   THREE.JS SCENE
============================================================ */
let scene, camera, renderer, player;
let velocityY = 0;
let onGround = true;

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
    new THREE.BoxGeometry(20, 0.2, 20),
    new THREE.MeshLambertMaterial({ color: 0x111633 })
  );
  floor.position.y = -0.1;
  scene.add(floor);

  player = createBatman();
  scene.add(player);

  /* Settings */
  toggleShadows.onchange = () => renderer.shadowMap.enabled = toggleShadows.checked;
  renderScale.onchange = () => {
    renderer.setPixelRatio(window.devicePixelRatio * parseFloat(renderScale.value));
    renderer.setSize(innerWidth, innerHeight);
  };
  toggleCameraRotate.onchange = () => cameraRotationEnabled = toggleCameraRotate.checked;
  toggleFPS.onchange = () => fpsCounter.style.display = toggleFPS.checked ? "block" : "none";

  /* Loading fade */
  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => loadingScreen.remove(), 300);
  }, 300);

  animate();
}

/* ============================================================
   PLAYER UPDATE
============================================================ */
let cameraRotationEnabled = true;

function updatePlayer(delta) {
  const speed = 0.08 * speedMultiplier;

  let mx = joy.lx * speed;
  let mz = joy.ly * speed;

  if (keys["w"]) mz -= speed;
  if (keys["s"]) mz += speed;
  if (keys["a"]) mx -= speed;
  if (keys["d"]) mx += speed;

  player.position.x += mx;
  player.position.z += mz;

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

  if (cameraRotationEnabled) {
    if (keys["ArrowLeft"])
      camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), 0.02);
    if (keys["ArrowRight"])
      camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), -0.02);
  }

  camera.lookAt(player.position);
}

/* ============================================================
   ANIMATION LOOP + FPS
============================================================ */
let last = performance.now();
let frames = 0;
let lastFPSUpdate = 0;

function animate(now) {
  requestAnimationFrame(animate);

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
