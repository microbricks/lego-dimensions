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
});
window.addEventListener("keyup",   e => {
  keys[e.key] = false;
});

/* Muisbesturing (camera yaw) */
let mouseDown = false;
let cameraYaw = 0;

window.addEventListener("mousedown", e => {
  if (e.button === 2) mouseDown = true; // rechter muisknop
});
window.addEventListener("mouseup", e => {
  if (e.button === 2) mouseDown = false;
});
window.addEventListener("contextmenu", e => e.preventDefault());

window.addEventListener("mousemove", e => {
  if (!mouseDown) return;
  const deltaX = e.movementX || 0;
  cameraYaw -= deltaX * 0.003; // gevoeligheid
  camera.rotation.y = cameraYaw;
});

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

  toggleCameraRotate.onchange = () => {
    // hier kun je eventueel camera rotatie uitzetten, maar we gebruiken muis
  };

  toggleFPS.onchange = () => {
    fpsCounter.style.display = toggleFPS.checked ? "block" : "none";
  };

  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => loadingScreen.remove(), 300);
  }, 500);

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

  // speler beweegt in camerazicht
  if (keys["w"]) move.z -= 1;
  if (keys["s"]) move.z += 1;
  if (keys["a"]) move.x -= 1;
  if (keys["d"]) move.x += 1;

  if (move.length() > 0) {
    move.normalize();
    move.applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
    player.position.add(move.multiplyScalar(speed));
  }

  // springen
  if (keys[" "] && onGround) {
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

  // camera volgt speler
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
