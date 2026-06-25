// ====== TOY PAD LOGICA ======
const figures = {
  batman: {
    name: "Batman",
    power: "speed",
    description: "Verhoogt loopsnelheid.",
    color: "#00bcd4"
  },
  gandalf: {
    name: "Gandalf",
    power: "teleport",
    description: "Teleporteert naar portals / toren.",
    color: "#9c27b0"
  },
  robot: {
    name: "Robot",
    power: "jump",
    description: "Geeft extra hoge sprong.",
    color: "#4caf50"
  }
};

let selectedFigureId = null;
const zoneState = { left: null, middle: null, right: null };

const padOverlay = document.getElementById("pad-overlay");
const openPadBtn = document.getElementById("open-pad-btn");
const closePadBtn = document.getElementById("close-pad-btn");
const figuresContainer = document.getElementById("figures");
const padOutput = document.getElementById("pad-output");

openPadBtn.addEventListener("click", () => {
  padOverlay.style.display = "flex";
});

closePadBtn.addEventListener("click", () => {
  padOverlay.style.display = "none";
});

function renderFigures() {
  figuresContainer.innerHTML = "";
  Object.entries(figures).forEach(([id, fig]) => {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;
    btn.style.borderColor = fig.color;
    btn.style.color = fig.color;
    btn.dataset.id = id;

    btn.addEventListener("click", () => {
      selectFigure(id);
    });

    figuresContainer.appendChild(btn);
  });
}

function selectFigure(id) {
  selectedFigureId = id;
  document.querySelectorAll(".figure").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });
  const fig = figures[id];
  padOutput.textContent =
    `${fig.name} geselecteerd.\nPower: ${fig.power}\n${fig.description}\nKlik nu op een zone.`;
}

document.querySelectorAll(".zone").forEach((zoneEl) => {
  zoneEl.addEventListener("click", () => {
    const zoneId = zoneEl.dataset.zone;
    if (!selectedFigureId) {
      padOutput.textContent = "Selecteer eerst een figuur.";
      return;
    }
    placeFigureOnZone(selectedFigureId, zoneId);
  });
});

function placeFigureOnZone(figureId, zoneId) {
  const fig = figures[figureId];
  zoneState[zoneId] = figureId;

  const zoneEl = document.querySelector(`.zone[data-zone="${zoneId}"]`);
  const label = zoneEl.querySelector("span");
  const glow = zoneEl.querySelector(".zone-glow");

  label.textContent = fig.name;
  zoneEl.classList.add("has-figure");
  glow.style.background = `
    radial-gradient(circle at 30% 30%, ${fig.color}, transparent 60%)
  `;
  zoneEl.style.borderColor = fig.color;
  zoneEl.style.boxShadow = `0 0 16px ${fig.color}55`;

  padOutput.textContent =
    `${fig.name} geplaatst op zone: ${zoneId.toUpperCase()}.\n` +
    `Power: ${fig.power}\n${fig.description}`;

  applyPowersFromZones();
}

// ====== 3D GAME (THREE.JS) ======
let scene, camera, renderer;
let player, floor, portal1, portal2;
let keys = {};
let velocityY = 0;
let onGround = true;

const baseSpeed = 0.08;
let speedMultiplier = 1;
let jumpStrength = 0.18;
let canTeleport = false;

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050509);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 3, 6);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(3, 5, 2);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  // Vloer
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x222831,
    side: THREE.DoubleSide
  });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Speler
  const playerGeo = new THREE.BoxGeometry(0.5, 1, 0.5);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b });
  player = new THREE.Mesh(playerGeo, playerMat);
  player.position.set(0, 0.5, 0);
  scene.add(player);

  // Portal 1
  const portalGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32);
  const portalMat = new THREE.MeshStandardMaterial({
    color: 0x00bcd4,
    emissive: 0x0097a7,
    emissiveIntensity: 0.8
  });
  portal1 = new THREE.Mesh(portalGeo, portalMat);
  portal1.rotation.x = -Math.PI / 2;
  portal1.position.set(2.5, 0.01, -2.5);
  scene.add(portal1);

  // Portal 2
  const portal2Mat = new THREE.MeshStandardMaterial({
    color: 0xff4081,
    emissive: 0xf50057,
    emissiveIntensity: 0.8
  });
  portal2 = new THREE.Mesh(portalGeo, portal2Mat);
  portal2.rotation.x = -Math.PI / 2;
  portal2.position.set(-2.5, 0.01, -2.5);
  scene.add(portal2);

  // Muren rondom
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x37474f });
  for (let i = -5; i <= 5; i++) {
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat);
    wall1.position.set(i, 0.5, -5);
    scene.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(i, 0.5, 5);
    scene.add(wall2);
  }
  for (let i = -5; i <= 5; i++) {
    const wall3 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat);
    wall3.position.set(-5, 0.5, i);
    scene.add(wall3);

    const wall4 = wall3.clone();
    wall4.position.set(5, 0.5, i);
    scene.add(wall4);
  }

  // Pilaren
  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x546e7a });

  const pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
  pillar1.position.set(-2, 1.5, -2);
  scene.add(pillar1);

  const pillar2 = pillar1.clone();
  pillar2.position.set(2, 1.5, 2);
  scene.add(pillar2);

  // Toren
  const towerGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x455a64 });

  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.set(-3.5, 2, 3.5);
  scene.add(tower);

  // Brug (zwevend platform)
  const bridgeGeo = new THREE.BoxGeometry(4, 0.3, 1);
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });

  const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge.position.set(0, 1.5, 0);
  scene.add(bridge);

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer(delta) {
  let moveX = 0;
  let moveZ = 0;
  const speed = baseSpeed * speedMultiplier;

  if (keys["w"] || keys["W"] || keys["ArrowUp"]) moveZ -= speed;
  if (keys["s"] || keys["S"] || keys["ArrowDown"]) moveZ += speed;
  if (keys["a"] || keys["A"] || keys["ArrowLeft"]) moveX -= speed;
  if (keys["d"] || keys["D"] || keys["ArrowRight"]) moveX += speed;

  player.position.x += moveX;
  player.position.z += moveZ;

  if (keys[" "] && onGround) {
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

  camera.position.x = player.position.x + 3;
  camera.position.z = player.position.z + 4;
  camera.lookAt(player.position);

  // Portal interactie
  const dist1 = player.position.distanceTo(portal1.position);
  const dist2 = player.position.distanceTo(portal2.position);

  if (canTeleport) {
    if (dist1 < 0.8) {
      player.position.set(-3.5, 0.5, 3.5); // naar toren
    }
    if (dist2 < 0.8) {
      player.position.set(3.5, 0.5, -3.5); // andere hoek
    }
  }

  portal1.rotation.y += 0.02;
  portal2.rotation.y -= 0.02;
}

let lastTime = 0;
function animate(time) {
  requestAnimationFrame(animate);
  const delta = (time - lastTime) / 16.67;
  lastTime = time;

  updatePlayer(delta);
  renderer.render(scene, camera);
}

// Powers uit zones toepassen
function applyPowersFromZones() {
  speedMultiplier = 1;
  jumpStrength = 0.18;
  canTeleport = false;

  const activePowers = Object.values(zoneState)
    .filter(Boolean)
    .map((id) => figures[id].power);

  if (activePowers.includes("speed")) {
    speedMultiplier = 2;
  }
  if (activePowers.includes("jump")) {
    jumpStrength = 0.28;
  }
  if (activePowers.includes("teleport")) {
    canTeleport = true;
  }
}

// Init
renderFigures();
init3D();
