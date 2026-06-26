/* ============================================================
   UI ELEMENTS
============================================================ */
const loadingScreen   = document.getElementById("loading-screen");
const padOverlay      = document.getElementById("pad-overlay");
const settingsOverlay = document.getElementById("settings-overlay");
const figuresContainer = document.getElementById("figures");
const padOutput       = document.getElementById("pad-output");
const fpsCounter      = document.getElementById("fps-counter");

/* Buttons */
document.getElementById("open-pad-btn").onclick   = () => padOverlay.style.display = "flex";
document.getElementById("close-pad-btn").onclick  = () => padOverlay.style.display = "none";
document.getElementById("open-settings-btn").onclick  = () => settingsOverlay.style.display = "flex";
document.getElementById("close-settings-btn").onclick = () => settingsOverlay.style.display = "none";

/* Settings controls */
const toggleShadows      = document.getElementById("toggle-shadows");
const renderScale        = document.getElementById("render-scale");
const toggleCameraRotate = document.getElementById("toggle-camera-rotate");
const toggleFPS          = document.getElementById("toggle-fps");

/* ============================================================
   FIGURES + ZONES
============================================================ */
const figures = {
  batman:   { name: "Batman",   color: 0x000000 },
  gandalf:  { name: "Gandalf",  color: 0xcccccc },
  robot:    { name: "Robot",    color: 0xffd600 },
  wyldstyle:{ name: "Wyldstyle",color: 0xff4081 }
};

let selectedFigureId = null;
const zoneState = { left: null, middle: null, right: null };

/* Render figures in Toy Pad */
function renderFigures() {
  figuresContainer.innerHTML = "";
  for (const [id, fig] of Object.entries(figures)) {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;

    btn.onclick = () => {
      selectedFigureId = id;
      padOutput.textContent = `${fig.name} geselecteerd. Klik een zone.`;

      document.querySelectorAll(".figure").forEach(el =>
        el.classList.toggle("active", el.textContent === fig.name)
      );
    };

    figuresContainer.appendChild(btn);
  }
}

/* Zones klikken */
document.querySelectorAll(".zone").forEach(zone => {
  zone.onclick = () => {
    if (!selectedFigureId) return;
    const zoneId = zone.dataset.zone;
    placeFigureOnZone(selectedFigureId, zoneId);
  };
});

function placeFigureOnZone(figureId, zoneId) {
  const fig = figures[figureId];
  zoneState[zoneId] = figureId;

  const zoneEl = document.querySelector(`.zone[data-zone="${zoneId}"]`);
  zoneEl.querySelector("span").textContent = fig.name;
  zoneEl.style.borderColor = "#fff";
  zoneEl.style.boxShadow = "0 0 16px rgba(255,255,255,0.6)";

  padOutput.textContent = `${fig.name} geplaatst op zone ${zoneId}.`;
  spawnFigure(figureId);
}

/* ============================================================
   INPUT (KEYBOARD + MOUSE)
============================================================ */
let keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;

  // Editor toggle
  if (e.key === "e") {
    editorMode = !editorMode;
    editorStatus.textContent = editorMode ? "Editor: AAN" : "Editor: UIT";
  }

  // Delete last object
  if (e.key === "Backspace" && editorMode) {
    const last = placedObjects.pop();
    if (last) scene.remove(last.mesh);
  }
});
window.addEventListener("keyup",   e => keys[e.key] = false);

/* Muisbesturing */
let mouseDown = false;
let cameraYaw = 0;

window.addEventListener("mousedown", e => {
  if (e.button === 2) mouseDown = true;
});
window.addEventListener("mouseup", e => {
  if (e.button === 2) mouseDown = false;
});
window.addEventListener("contextmenu", e => e.preventDefault());

window.addEventListener("mousemove", e => {
  if (!mouseDown) return;
  const deltaX = e.movementX || 0;
  cameraYaw -= deltaX * 0.003;
  camera.rotation.y = cameraYaw;
});

/* ============================================================
   JOY‑CONS
============================================================ */
let joyconLeft = null;
let joyconRight = null;
let joyconConnected = false;

let joyLX = 0, joyLY = 0;
let joyRX = 0, joyRY = 0;

async function connectJoyCons() {
  try {
    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: 0x057e }]
    });

    for (const device of devices) {
      await device.open();

      if (device.productId === 0x2006) joyconLeft = device;
      if (device.productId === 0x2007) joyconRight = device;
    }

    joyconConnected = true;
    document.getElementById("joycon-text").textContent = "Gamepad: Joy‑Cons verbonden";
    document.getElementById("joycon-icon").textContent = "🟩";

    startJoyConLoop();

  } catch (err) {
    console.error("Joy‑Con fout:", err);
  }
}

document.getElementById("joycon-status").onclick = connectJoyCons;

function startJoyConLoop() {
  if (!joyconConnected) return;

  setInterval(() => {
    if (joyconLeft) joyconLeft.receiveFeatureReport(0x30).then(parseJoyConLeft);
    if (joyconRight) joyconRight.receiveFeatureReport(0x30).then(parseJoyConRight);
  }, 16);
}

function parseJoyConLeft(data) {
  joyLX = (data.getUint8(6) - 128) / 128;
  joyLY = (data.getUint8(7) - 128) / 128;
}

function parseJoyConRight(data) {
  joyRX = (data.getUint8(6) - 128) / 128;
  joyRY = (data.getUint8(7) - 128) / 128;
}

/* ============================================================
   LEVEL EDITOR
============================================================ */
let editorMode = false;
let placedObjects = [];
let currentType = "block";

let editorStatus;

function createEditorUI() {
  const ui = document.createElement("div");
  ui.id = "editor-ui";
  ui.style.position = "fixed";
  ui.style.top = "10px";
  ui.style.right = "10px";
  ui.style.background = "rgba(0,0,0,0.7)";
  ui.style.padding = "10px";
  ui.style.borderRadius = "8px";
  ui.style.color = "#fff";
  ui.style.fontSize = "12px";
  ui.style.zIndex = "50";

  editorStatus = document.createElement("div");
  editorStatus.textContent = "Editor: UIT";
  ui.appendChild(editorStatus);

  const types = [
    { id: "block", label: "Blok (groen)", color: 0x00ff00 },
    { id: "wall",  label: "Muur (grijs)", color: 0x888888 },
    { id: "lava",  label: "Lava (rood)",  color: 0xff0000 }
  ];

  const typeRow = document.createElement("div");
  typeRow.style.marginTop = "6px";

  types.forEach(t => {
    const btn = document.createElement("button");
    btn.textContent = t.label;
    btn.style.marginRight = "4px";
    btn.style.fontSize = "11px";
    btn.onclick = () => {
      currentType = t.id;
    };
    typeRow.appendChild(btn);
  });

  ui.appendChild(typeRow);

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save level";
  saveBtn.style.marginTop = "6px";
  saveBtn.style.fontSize = "11px";
  saveBtn.onclick = saveLevel;
  ui.appendChild(saveBtn);

  const loadBtn = document.createElement("button");
  loadBtn.textContent = "Load level";
  loadBtn.style.marginLeft = "4px";
  loadBtn.style.fontSize = "11px";
  loadBtn.onclick = loadLevel;
  ui.appendChild(loadBtn);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear level";
  clearBtn.style.marginLeft = "4px";
  clearBtn.style.fontSize = "11px";
  clearBtn.onclick = clearLevel;
  ui.appendChild(clearBtn);

  document.body.appendChild(ui);
}

window.addEventListener("click", e => {
  if (!editorMode) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const point = intersects[0].point;

    const { mesh, type } = createEditorObject(currentType, point);
    scene.add(mesh);
    placedObjects.push({ mesh, type });
  }
});

function createEditorObject(type, point) {
  let color = 0x00ff00;
  let size = new THREE.Vector3(1,1,1);

  if (type === "wall") {
    color = 0x888888;
    size.set(1,2,0.3);
  } else if (type === "lava") {
    color = 0xff0000;
    size.set(1,0.2,1);
  }

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshLambertMaterial({ color })
  );

  mesh.position.set(
    Math.round(point.x),
    type === "wall" ? 1 : 0.1,
    Math.round(point.z)
  );

  return { mesh, type };
}

/* Save / Load / Clear */
function saveLevel() {
  const data = placedObjects.map(o => ({
    type: o.type,
    x: o.mesh.position.x,
    y: o.mesh.position.y,
    z: o.mesh.position.z
  }));
  localStorage.setItem("lego_level", JSON.stringify(data));
}

function loadLevel() {
  clearLevel();
  const raw = localStorage.getItem("lego_level");
  if (!raw) return;
  const data = JSON.parse(raw);
  data.forEach(d => {
    const { mesh, type } = createEditorObject(d.type, new THREE.Vector3(d.x, d.y, d.z));
    mesh.position.set(d.x, d.y, d.z);
    scene.add(mesh);
    placedObjects.push({ mesh, type });
  });
}

function clearLevel() {
  placedObjects.forEach(o => scene.remove(o.mesh));
  placedObjects = [];
}

/* ============================================================
   THREE.JS
============================================================ */
let scene, camera, renderer, player;
let velocityY = 0;
let onGround = true;

function createFigureMesh(fig) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.1, 0.6),
    new THREE.MeshLambertMaterial({ color: fig.color })
  );
  mesh.position.y = 0.55;
  return mesh;
}

function spawnFigure(id) {
  if (player) scene.remove(player);
  const fig = figures[id];
  player = createFigureMesh(fig);
  scene.add(player);
}

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050814);

  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 3, 6);
  cameraYaw = camera.rotation.y;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x202020, 1.2);
  scene.add(light);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 20),
    new THREE.MeshLambertMaterial({ color: 0x111633 })
  );
  floor.position.y = -0.1;
  scene.add(floor);

  spawnFigure("batman");

  toggleShadows.onchange = () => {
    renderer.shadowMap.enabled = toggleShadows.checked;
  };

  renderScale.onchange = () => {
    renderer.setPixelRatio(window.devicePixelRatio * parseFloat(renderScale.value));
    renderer.setSize(innerWidth, innerHeight);
  };

  toggleFPS.onchange = () => {
    fpsCounter.style.display = toggleFPS.checked ? "block" : "none";
  };

  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => loadingScreen.remove(), 300);
  }, 500);

  createEditorUI();
  animate();
}

/* ============================================================
   UPDATE + ANIMATE
============================================================ */
let last = performance.now();
let frames = 0;
let lastFPSUpdate = 0;

function updatePlayer(delta) {
  if (!player) return;

  const speed = 0.08;
  const move = new THREE.Vector3();

  // Keyboard movement
  if (keys["w"]) move.z -= 1;
  if (keys["s"]) move.z += 1;
  if (keys["a"]) move.x -= 1;
  if (keys["d"]) move.x += 1;

  // Joy‑Con movement
  if (Math.abs(joyLX) > 0.1) move.x += joyLX;
  if (Math.abs(joyLY) > 0.1) move.z += joyLY;

  if (move.length() > 0) {
    move.normalize();
    move.applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
    player.position.add(move.multiplyScalar(speed));
  }

  // Jump (keyboard + Joy‑Con)
  if ((keys[" "] || joyRY < -0.5) && onGround) {
    velocityY = 0.22;
    onGround = false;
  }

  velocityY -= 0.008;
  player.position.y += velocityY;

  if (player.position.y <= 0.55) {
    player.position.y = 0.55;
    velocityY = 0;
    onGround = true;
  }

  // Joy‑Con camera rotation
  if (Math.abs(joyRX) > 0.1) {
    cameraYaw -= joyRX * 0.05;
    camera.rotation.y = cameraYaw;
  }

  // Camera follow
  const offset = new THREE.Vector3(0, 3, 6);
  const rotatedOffset = offset.clone().applyAxisAngle(
    new THREE.Vector3(0,1,0),
    camera.rotation.y
  );
  camera.position.copy(player.position.clone().add(rotatedOffset));

  camera.lookAt(player.position);
}

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
