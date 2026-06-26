/* ============================================================
   TOY PAD – simpele versie
============================================================ */
const figures = {
  batman: { name: "Batman", power: "speed", description: "Verhoogt loopsnelheid.", color: "#29b6f6" },
  gandalf: { name: "Gandalf", power: "teleport", description: "Teleporteert naar portals.", color: "#ab47bc" },
  robot: { name: "Robot", power: "jump", description: "Geeft extra hoge sprong.", color: "#ffd600" }
};

let selectedFigureId = null;
const zoneState = { left: null, middle: null, right: null };

const padOverlay = document.getElementById("pad-overlay");
const openPadBtn = document.getElementById("open-pad-btn");
const closePadBtn = document.getElementById("close-pad-btn");
const figuresContainer = document.getElementById("figures");
const padOutput = document.getElementById("pad-output");
const joyIcon = document.getElementById("joycon-icon");
const joyText = document.getElementById("joycon-text");
const debugBox = document.getElementById("debug-box");

openPadBtn.onclick = () => padOverlay.style.display = "flex";
closePadBtn.onclick = () => padOverlay.style.display = "none";

function renderFigures() {
  figuresContainer.innerHTML = "";
  Object.entries(figures).forEach(([id, fig]) => {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;
    btn.dataset.id = id;
    btn.style.borderColor = fig.color;
    btn.onclick = () => selectFigure(id);
    figuresContainer.appendChild(btn);
  });
}

function selectFigure(id) {
  selectedFigureId = id;
  document.querySelectorAll(".figure").forEach(el =>
    el.classList.toggle("active", el.dataset.id === id)
  );
  const fig = figures[id];
  padOutput.textContent =
    `${fig.name} geselecteerd.\nPower: ${fig.power}\n${fig.description}\nKlik nu op een zone.`;
}

document.querySelectorAll(".zone").forEach(zoneEl => {
  zoneEl.onclick = () => {
    if (!selectedFigureId) {
      padOutput.textContent = "Selecteer eerst een figuur.";
      return;
    }
    placeFigureOnZone(selectedFigureId, zoneEl.dataset.zone);
  };
});

function placeFigureOnZone(figureId, zoneId) {
  const fig = figures[figureId];
  zoneState[zoneId] = figureId;

  const zoneEl = document.querySelector(`.zone[data-zone="${zoneId}"]`);
  const label = zoneEl.querySelector("span");

  label.textContent = fig.name;
  zoneEl.classList.add("has-figure");
  zoneEl.style.borderColor = fig.color;
  zoneEl.style.boxShadow = `0 0 16px ${fig.color}55`;

  padOutput.textContent =
    `${fig.name} geplaatst op zone: ${zoneId.toUpperCase()}.\nPower: ${fig.power}\n${fig.description}`;

  applyPowersFromZones();
}

/* ============================================================
   Powers uit Toy Pad
============================================================ */
let speedMultiplier = 1;
let jumpStrength = 0.18;
let canTeleport = false;

function applyPowersFromZones() {
  speedMultiplier = 1;
  jumpStrength = 0.18;
  canTeleport = false;

  Object.values(zoneState).forEach(id => {
    if (!id) return;
    if (id === "batman") speedMultiplier *= 1.4;
    if (id === "robot") jumpStrength *= 1.4;
    if (id === "gandalf") canTeleport = true;
  });
}

/* ============================================================
   Keyboard + (optioneel) Gamepad
============================================================ */
let keys = {};
window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

let joy = {
  lx: 0, ly: 0,
  rx: 0, ry: 0,
  a: false
};

function updateJoyConStatus() {
  const pads = navigator.getGamepads?.();
  if (!pads) {
    joyIcon.textContent = "🟥";
    joyText.textContent = "Gamepad: geen verbonden";
    return;
  }

  let found = false;
  let debugText = "";

  for (const pad of pads) {
    if (!pad) continue;
    debugText += `${pad.id}\n`;
    pad.axes.forEach((v, i) => debugText += `axis[${i}]: ${v.toFixed(2)}\n`);
    pad.buttons.forEach((b, i) => debugText += `btn[${i}]: ${b.pressed ? "1" : "0"} `);
    debugText += "\n----------------------\n";

    if (pad.id.includes("Joy-Con")) {
      found = true;
      joy.lx = pad.axes[0] ?? 0;
      joy.ly = pad.axes[1] ?? 0;
      joy.rx = pad.axes[2] ?? 0;
      joy.ry = pad.axes[3] ?? 0;
      joy.a  = pad.buttons[0]?.pressed || false;
    }
  }

  debugBox.innerText = debugText || "Joy-Con debug...";
  if (found) {
    joyIcon.textContent = "🟩";
    joyText.textContent = "Joy-Cons verbonden (optioneel)";
  } else {
    joyIcon.textContent = "🟥";
    joyText.textContent = "Gamepad: geen verbonden";
  }
}

function pollGamepads() {
  updateJoyConStatus();
  requestAnimationFrame(pollGamepads);
}
pollGamepads();

/* ============================================================
   LEGO BATMAN SPELER ZONDER CAPE
============================================================ */
function createLegoPlayer() {
  const group = new THREE.Group();

  const yellow = new THREE.MeshLambertMaterial({ color: 0xffd600 });
  const blue   = new THREE.MeshLambertMaterial({ color: 0x1e88e5 });
  const black  = new THREE.MeshLambertMaterial({ color: 0x000000 });

  // BATMAN MASKER
  const mask = new THREE.Group();

  const helmet = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.50, 0.48),
    black
  );
  helmet.position.set(0, 1.28, 0);
  mask.add(helmet);

  const earGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
  const earL = new THREE.Mesh(earGeo, black);
  earL.position.set(-0.18, 1.55, 0);
  mask.add(earL);

  const earR = earL.clone();
  earR.position.set(0.18, 1.55, 0);
  mask.add(earR);

  const eyeGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
  const eyeL = new THREE.Mesh(eyeGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
  eyeL.position.set(-0.12, 1.30, 0.25);
  mask.add(eyeL);

  const eyeR = eyeL.clone();
  eyeR.position.set(0.12, 1.30, 0.25);
  mask.add(eyeR);

  group.add(mask);
  group.mask = mask;

  // LICHAAM + LOGO + BELT
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.35), black);
  body.position.set(0, 0.65, 0);
  group.add(body);

  const logo = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.25, 0.02),
    new THREE.MeshLambertMaterial({ color: 0xffff00 })
  );
  logo.position.set(0, 0.70, 0.20);
  group.add(logo);

  const bat = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.12, 0.01),
    black
  );
  bat.position.set(0, 0.70, 0.21);
  group.add(bat);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.18, 0.30),
    new THREE.MeshLambertMaterial({ color: 0xffd600 })
  );
  belt.position.set(0, 0.40, 0);
  group.add(belt);

  for (let i = -1; i <= 1; i++) {
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      black
    );
    pouch.position.set(i * 0.25, 0.40, 0.18);
    group.add(pouch);
  }

  // BENEN
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.35), black);
  legL.position.set(-0.15, 0.25, 0);
  group.add(legL);

  const legR = legL.clone();
  legR.position.set(0.15, 0.25, 0);
  group.add(legR);

  // ARMEN MET PIVOT
  const armPivotL = new THREE.Group();
  armPivotL.position.set(-0.4, 0.75, 0);
  group.add(armPivotL);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), black);
  armL.position.set(0, -0.275, 0);
  armPivotL.add(armL);

  const armPivotR = new THREE.Group();
  armPivotR.position.set(0.4, 0.75, 0);
  group.add(armPivotR);

  const armR = armL.clone();
  armR.position.set(0, -0.275, 0);
  armPivotR.add(armR);

  // BATARANG
  const batarang = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.10, 0.02),
    black
  );
  batarang.position.set(0.55, 0.75, 0);
  batarang.rotation.z = Math.PI * 0.25;
  group.add(batarang);

  // REFERENTIES
  group.armPivotL = armPivotL;
  group.armPivotR = armPivotR;
  group.armL = armL;
  group.armR = armR;
  group.legL = legL;
  group.legR = legR;

  group.position.set(0, 0.5, 0);
  return group;
}

/* ============================================================
   THREE.JS SCENE
============================================================ */
let scene, camera, renderer;
let player, portal1, portal2;
let velocityY = 0;
let onGround = true;
let walkCycle = 0;

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050814);
  scene.fog = new THREE.Fog(0x050814, 8, 25);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 3, 6);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x202020, 1.2);
  scene.add(light);

  const matFloor = new THREE.MeshLambertMaterial({ color: 0x111633 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 10), matFloor);
  floor.position.y = -0.1;
  scene.add(floor);

  player = createLegoPlayer();
  scene.add(player);

  const matPortal1 = new THREE.MeshLambertMaterial({ color: 0x29b6f6 });
  const matPortal2 = new THREE.MeshLambertMaterial({ color: 0xab47bc });

  portal1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), matPortal1);
  portal1.rotation.x = -Math.PI / 2;
  portal1.position.set(2.5, 0.01, -2.5);
  scene.add(portal1);

  portal2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), matPortal2);
  portal2.rotation.x = -Math.PI / 2;
  portal2.position.set(-2.5, 0.01, -2.5);
  scene.add(portal2);

  window.onresize = onWindowResize;

  renderFigures();
  applyPowersFromZones();

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ============================================================
   PLAYER UPDATE + CAMERA ROTATIE
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

  const isMoving = Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01;

  if (isMoving && onGround) {
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

  const jumpPressed =
    joy.a ||
    keys[" "] ||
    keys["ArrowUp"] && !onGround; // extra check kan weg, maar laat staan

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

  // Teleport als Gandalf-power actief is
  if (canTeleport && keys["t"]) {
    const dist1 = player.position.distanceTo(portal1.position);
    const dist2 = player.position.distanceTo(portal2.position);
    if (dist1 < 1.0) player.position.copy(portal2.position).add(new THREE.Vector3(0, 0.5, 0));
    else if (dist2 < 1.0) player.position.copy(portal1.position).add(new THREE.Vector3(0, 0.5, 0));
  }

  // CAMERA ROTATIE MET ARROW KEYS
  const rotSpeed = 0.02;
  if (keys["ArrowLeft"]) {
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
  }
  if (keys["ArrowRight"]) {
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed);
  }
  camera.lookAt(player.position);
}

/* ============================================================
   ANIMATE LOOP
============================================================ */
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const delta = (now - lastTime) / 16.67;
  lastTime = now;

  updatePlayer(delta);
  renderer.render(scene, camera);
}

/* ============================================================
   START
============================================================ */
window.addEventListener("load", init3D);
