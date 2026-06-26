/* ============================================================
   UI ELEMENTS
============================================================ */
const padOverlay = document.getElementById("pad-overlay");
const settingsOverlay = document.getElementById("settings-overlay");
const figuresContainer = document.getElementById("figures");
const skinsContainer = document.getElementById("skins");
const padOutput = document.getElementById("pad-output");
const fpsCounter = document.getElementById("fps-counter");

/* Buttons */
document.getElementById("open-pad-btn").onclick = () => padOverlay.style.display = "flex";
document.getElementById("close-pad-btn").onclick = () => padOverlay.style.display = "none";
document.getElementById("open-settings-btn").onclick = () => settingsOverlay.style.display = "flex";
document.getElementById("close-settings-btn").onclick = () => settingsOverlay.style.display = "none";

/* ============================================================
   CHARACTER + SKIN DATA
============================================================ */
const figures = {
  batman: {
    name: "Batman",
    skins: ["classic", "blue", "dark"]
  },
  superman: {
    name: "Superman",
    skins: ["classic", "black"]
  },
  flash: {
    name: "The Flash",
    skins: ["classic", "yellow"]
  },
  joker: {
    name: "Joker",
    skins: ["classic", "purple"]
  }
};

let selectedFigure = null;
let selectedSkin = null;

/* ============================================================
   RENDER FIGURES
============================================================ */
function renderFigures() {
  figuresContainer.innerHTML = "";

  for (const [id, fig] of Object.entries(figures)) {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = fig.name;

    btn.onclick = () => {
      selectedFigure = id;
      selectedSkin = fig.skins[0];
      renderSkins(id);
      padOutput.textContent = `${fig.name} geselecteerd. Kies een skin.`;
    };

    figuresContainer.appendChild(btn);
  }
}

/* ============================================================
   RENDER SKINS
============================================================ */
function renderSkins(figureId) {
  skinsContainer.innerHTML = "";

  const fig = figures[figureId];

  fig.skins.forEach(skinId => {
    const btn = document.createElement("button");
    btn.className = "figure";
    btn.textContent = skinId;

    btn.onclick = () => {
      selectedSkin = skinId;
      padOutput.textContent = `Skin "${skinId}" geselecteerd. Klik een zone.`;
    };

    skinsContainer.appendChild(btn);
  });
}

/* ============================================================
   PLACE FIGURE ON ZONE
============================================================ */
document.querySelectorAll(".zone").forEach(zone => {
  zone.onclick = () => {
    if (!selectedFigure || !selectedSkin) return;

    const className = `skin-${selectedFigure}-${selectedSkin}`;
    const color = getSkinColor(selectedFigure, selectedSkin);

    zone.style.boxShadow = `0 0 16px ${color}`;
    zone.style.borderColor = color;
    zone.querySelector("span").textContent =
      `${figures[selectedFigure].name} (${selectedSkin})`;

    spawnFigure(selectedFigure, selectedSkin);
  };
});

/* ============================================================
   GET SKIN COLOR FROM CSS
============================================================ */
function getSkinColor(figureId, skinId) {
  const temp = document.createElement("div");
  temp.className = `skin-${figureId}-${skinId}`;
  document.body.appendChild(temp);

  const color = getComputedStyle(temp).getPropertyValue("--skin-color").trim();
  temp.remove();

  return color;
}

/* ============================================================
   SPAWN FIGURE IN 3D WORLD
============================================================ */
let player;

function spawnFigure(figureId, skinId) {
  if (player) scene.remove(player);

  const color = getSkinColor(figureId, skinId);

  player = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.1, 0.6),
    new THREE.MeshLambertMaterial({ color })
  );

  player.position.y = 0.55;
  scene.add(player);
}

/* ============================================================
   THREE.JS SETUP
============================================================ */
let scene, camera, renderer;

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

  animate();
}

/* ============================================================
   ANIMATION LOOP
============================================================ */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

/* ============================================================
   START
============================================================ */
window.onload = () => {
  renderFigures();
  init3D();
};
