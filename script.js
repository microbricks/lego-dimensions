// ====== TOY PAD LOGICA ======
const figures = {
  batman: { name: "Batman", power: "speed", description: "Verhoogt loopsnelheid.", color: "#00bcd4" },
  gandalf: { name: "Gandalf", power: "teleport", description: "Teleporteert naar portals / toren.", color: "#9c27b0" },
  robot: { name: "Robot", power: "jump", description: "Geeft extra hoge sprong.", color: "#4caf50" }
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
  Object.entries(figures).forEach(([id, fig]) => {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;
    btn.style.borderColor = fig.color;
    btn.style.color = fig.color;
    btn.dataset.id = id;
    btn.onclick = () => selectFigure(id);
    figuresContainer.appendChild(btn);
  });
}

function selectFigure(id) {
  selectedFigureId = id;
  document.querySelectorAll(".figure").forEach(el => el.classList.toggle("active", el.dataset.id === id));
  const fig = figures[id];
  padOutput.textContent = `${fig.name} geselecteerd.\nPower: ${fig.power}\n${fig.description}\nKlik nu op een zone.`;
}

document.querySelectorAll(".zone").forEach(zoneEl => {
  zoneEl.onclick = () => {
    if (!selectedFigureId) return padOutput.textContent = "Selecteer eerst een figuur.";
    placeFigureOnZone(selectedFigureId, zoneEl.dataset.zone);
  };
});

function placeFigureOnZone(figureId, zoneId) {
  const fig = figures[figureId];
  zoneState[zoneId] = figureId;

  const zoneEl = document.querySelector(`.zone[data-zone="${zoneId}"]`);
  const label = zoneEl.querySelector("span");
  const glow = zoneEl.querySelector(".zone-glow");

  label.textContent = fig.name;
  zoneEl.classList.add("has-figure");
  glow.style.background = `radial-gradient(circle at 30% 30%, ${fig.color}, transparent 60%)`;
  zoneEl.style.borderColor = fig.color;
  zoneEl.style.boxShadow = `0 0 16px ${fig.color}55`;

  padOutput.textContent = `${fig.name} geplaatst op zone: ${zoneId.toUpperCase()}.\nPower: ${fig.power}\n${fig.description}`;

  applyPowersFromZones();
}

// ====== 3D GAME ======
let scene, camera, renderer;
let player, portal1, portal2;
let keys = {};
let velocityY = 0;
let onGround = true;

const baseSpeed = 0.08;
let speedMultiplier = 1;
let jumpStrength = 0.18;
let canTeleport = false;

function init3D() {
  console.log("init3D gestart");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1d2333);
  scene.fog = new THREE.Fog(0x1d2333, 8, 25);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 3, 6);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x202020, 1.2);
  scene.add(light);

  // ====== MATERIALS ======
  const matFloor = new THREE.MeshLambertMaterial({ color: 0x1b1f2b, flatShading: true });
  const matPlayer = new THREE.MeshLambertMaterial({ color: 0xffe74c, flatShading: true });
  const matWall = new THREE.MeshLambertMaterial({ color: 0x3b4252, flatShading: true });
  const matPillar = new THREE.MeshLambertMaterial({ color: 0x4c566a, flatShading: true });
  const matTower = new THREE.MeshLambertMaterial({ color: 0x434c5e, flatShading: true });
  const matBridge = new THREE.MeshLambertMaterial({ color: 0xa36a4f, flatShading: true });
  const matPortal1 = new THREE.MeshLambertMaterial({ color: 0x5ad1ff, flatShading: true });
  const matPortal2 = new THREE.MeshLambertMaterial({ color: 0xff6fae, flatShading: true });

  // ====== FLOOR ======
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 10), matFloor);
  floor.position.y = -0.1;
  scene.add(floor);

  // ====== PLAYER ======
  player = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), matPlayer);
  player.position.set(0, 0.5, 0);
  scene.add(player);

  // ====== PORTALS ======
  portal1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), matPortal1);
  portal1.rotation.x = -Math.PI / 2;
  portal1.position.set(2.5, 0.01, -2.5);
  scene.add(portal1);

  portal2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), matPortal2);
  portal2.rotation.x = -Math.PI / 2;
  portal2.position.set(-2.5, 0.01, -2.5);
  scene.add(portal2);

  // ====== WALLS ======
  for (let i = -5; i <= 5; i++) {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matWall);
    w1.position.set(i, 0.5, -5);
    scene.add(w1);

    const w2 = w1.clone();
    w2.position.set(i, 0.5, 5);
    scene.add(w2);
  }
  for (let i = -5; i <= 5; i++) {
    const w3 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matWall);
    w3.position.set(-5, 0.5, i);
    scene.add(w3);

    const w4 = w3.clone();
    w4.position.set(5, 0.5, i);
    scene.add(w4);
  }

  // ====== PILLARS ======
  const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 8), matPillar);
  pillar1.position.set(-2, 1.5, -2);
  scene.add(pillar1);

  const pillar2 = pillar1.clone();
  pillar2.position.set(2, 1.5, 2);
  scene.add(pillar2);

  // ====== TOWER ======
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 1.5), matTower);
  tower.position.set(-3.5, 2, 3.5);
  scene.add(tower);

  // ====== BRIDGE ======
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 1), matBridge);
  bridge.position.set(0, 1.5, 0);
  scene.add(bridge);

  // ====== DEBUG CUBE ======
  const debugCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshLambertMaterial({ color: 0xff0000, flatShading: true })
  );
  debugCube.position.set(0, 2, 0);
  scene.add(debugCube);

  window.onresize = onWindowResize;
  window.onkeydown = e => keys[e.key] = true;
  window.onkeyup = e => keys[e.key] = false;

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

  if (keys["w"] || keys["ArrowUp"]) moveZ -= speed;
  if (keys["s"] || keys["ArrowDown"]) moveZ += speed;
  if (keys["a"] || keys["ArrowLeft"]) moveX -= speed;
  if (keys["d"] || keys["ArrowRight"]) moveX += speed;

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

  camera.position.lerp(
    new THREE.Vector3(
      player.position.x + 2.5,
      player.position.y + 2.0,
      player.position.z + 3.5
    ),
    0.15
  );
  camera.lookAt(player.position);

  const dist1 = player.position.distanceTo(portal1.position);
  const dist2 = player.position.distanceTo(portal2.position);

  if (canTeleport) {
    if (dist1 < 0.8) player.position.set(-3.5, 0.5, 3.5);
    if (dist2 < 0.8) player.position.set(3.5, 0.5, -3.5);
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

// ====== POWERS ======
function applyPowersFromZones() {
  speedMultiplier = 1;
  jumpStrength = 0.18;
  canTeleport = false;

  const activePowers = Object.values(zoneState)
    .filter(Boolean)
    .map(id => figures[id].power);

  if (activePowers.includes("speed")) speedMultiplier = 2;
  if (activePowers.includes("jump")) jumpStrength = 0.28;
  if (activePowers.includes("teleport")) canTeleport = true;
}

// Init
renderFigures();
init3D();
