/* A 3D drivable version of the portfolio city. Original low-poly
   geometry, dusk lighting, soft shadows, and bloom on the lamps and
   headlights. Same four districts as the flat map: pizzeria (west),
   MCAP office (north), exchange (northeast), workshop (southeast).
   Drive with WASD or arrows; roll up to a building to enter its page. */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('city');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  document.getElementById('fallback').style.display = 'flex';
  throw e;
}
window.__cityBooted = true;

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- scene, fog, camera ---------- */
const DUSK = new THREE.Color('#2b2350');
const scene = new THREE.Scene();
scene.background = DUSK;
scene.fog = new THREE.Fog(DUSK, 120, 340);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 1200);
camera.position.set(0, 46, 66);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight('#9a8fff', '#241d3a', 0.75));

const sun = new THREE.DirectionalLight('#ffb37a', 1.5);
sun.position.set(-70, 90, 44);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
const sc = sun.shadow.camera;
sc.left = -220; sc.right = 220; sc.top = 220; sc.bottom = -220; sc.near = 10; sc.far = 460;
scene.add(sun);

/* a cool fill from the opposite side keeps the shadows from going black */
const fill = new THREE.DirectionalLight('#6f7bff', 0.35);
fill.position.set(80, 40, -60);
scene.add(fill);

/* ---------- palette + shared materials ---------- */
const mat = {
  ground: new THREE.MeshStandardMaterial({ color: '#5f5878', roughness: 1 }),
  road: new THREE.MeshStandardMaterial({ color: '#39344f', roughness: 1 }),
  lane: new THREE.MeshStandardMaterial({ color: '#c9c6e6', roughness: 1 }),
  wall: new THREE.MeshStandardMaterial({ color: '#c8c3e0', roughness: 0.85 }),
  wallDark: new THREE.MeshStandardMaterial({ color: '#a49fc4', roughness: 0.85 }),
  roof: new THREE.MeshStandardMaterial({ color: '#8f8ab0', roughness: 0.9 }),
  trunk: new THREE.MeshStandardMaterial({ color: '#5b4a54', roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#3f7d63', roughness: 1 }),
  red: new THREE.MeshStandardMaterial({ color: '#d8493c', roughness: 0.7 }),
  cream: new THREE.MeshStandardMaterial({ color: '#f2ede0', roughness: 0.7 }),
  green: new THREE.MeshStandardMaterial({ color: '#37a06b', emissive: '#124a2c', emissiveIntensity: 0.6, roughness: 0.6 }),
  navy: new THREE.MeshStandardMaterial({ color: '#23306e', roughness: 0.6 }),
  gray: new THREE.MeshStandardMaterial({ color: '#a7abb4', roughness: 0.6 }),
  glass: new THREE.MeshStandardMaterial({ color: '#3a4668', roughness: 0.3, metalness: 0.2 })
};

/* emissive materials (bloom picks these up) */
function emissive(hex, intensity) {
  return new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity, roughness: 0.4 });
}
const lampMat = emissive('#ffc861', 3.2);
const headMat = emissive('#fff2cc', 3.5);
const litWindow = emissive('#ffca3a', 1.8);

/* a window texture: mostly dark glass with a scattering of lit panes */
function windowTexture(litColor) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#33314f';
  g.fillRect(0, 0, 64, 64);
  for (let y = 6; y < 64; y += 14) {
    for (let x = 6; x < 64; x += 12) {
      // deterministic scatter so it doesn't reshuffle every rebuild
      const lit = ((x * 7 + y * 13) % 5) === 0;
      g.fillStyle = lit ? litColor : '#4a4870';
      g.fillRect(x, y, 7, 9);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const winTex = windowTexture('#ffd76a');

/* ---------- geometry helpers ---------- */
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function block(w, h, d, material, x, z, y) {
  const m = new THREE.Mesh(boxGeo, material);
  m.scale.set(w, h, d);
  m.position.set(x, (y || 0) + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function windowedTower(w, h, d, x, z) {
  const g = new THREE.Group();
  const tex = winTex.clone();
  tex.repeat.set(Math.max(2, Math.round(w / 6)), Math.max(3, Math.round(h / 6)));
  const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.15 }));
  m.scale.set(w, h, d);
  m.position.set(x, h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  return g;
}
function tree(x, z, s) {
  s = s || 1;
  const g = new THREE.Group();
  g.add(block(0.8 * s, 3 * s, 0.8 * s, mat.trunk, x, z));
  const c = new THREE.Mesh(new THREE.ConeGeometry(2.6 * s, 6 * s, 7), mat.leaf);
  c.position.set(x, 3 * s + 3 * s, z); c.castShadow = true;
  g.add(c);
  return g;
}
function lamp(x, z) {
  const g = new THREE.Group();
  g.add(block(0.5, 8, 0.5, mat.wallDark, x, z));
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), lampMat);
  head.position.set(x, 8.4, z);
  g.add(head);
  const p = new THREE.PointLight('#ffc861', 18, 34, 2);
  p.position.set(x, 8, z);
  g.add(p);
  return g;
}

/* ---------- ground + roads ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat.ground);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const PLATE = 150;                 // half-size of the drivable area
const roadY = 0.05;
function road(w, d, x, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.road);
  m.rotation.x = -Math.PI / 2; m.position.set(x, roadY, z);
  m.receiveShadow = true; scene.add(m);
}
// two avenues, two streets
road(PLATE * 2, 16, 0, -55);
road(PLATE * 2, 16, 0, 55);
road(16, PLATE * 2, -55, 0);
road(16, PLATE * 2, 55, 0);
// lane dashes
for (let t = -PLATE; t < PLATE; t += 14) {
  if (Math.abs(t + 55) > 12 && Math.abs(t - 55) > 12) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), mat.lane);
    a.rotation.x = -Math.PI / 2; a.position.set(t, roadY + 0.02, -55); scene.add(a);
    const b = a.clone(); b.position.set(t, roadY + 0.02, 55); scene.add(b);
    const c = a.clone(); c.rotation.z = Math.PI / 2; c.position.set(-55, roadY + 0.02, t); scene.add(c);
    const e = c.clone(); e.position.set(55, roadY + 0.02, t); scene.add(e);
  }
}

/* ---------- districts (each returns its world center) ---------- */
const targets = [];
function district(key, href, label, cx, cz, build) {
  const g = new THREE.Group();
  build(g);
  scene.add(g);
  targets.push({ key, href, label, x: cx, z: cz, r: 34 });
}

/* PIZZERIA (west) */
district('pizza', '../pizza/', 'Pizza', -105, 0, (g) => {
  g.add(block(24, 12, 18, mat.wall, -105, 4));
  // striped awning
  for (let i = 0; i < 8; i++) {
    g.add(block(3, 1.2, 4, i % 2 ? mat.red : mat.cream, -116 + i * 3, 13, 9));
  }
  // brick oven + chimney
  g.add(block(9, 9, 9, mat.wallDark, -86, 6));
  const chim = block(2.4, 12, 2.4, mat.wallDark, -80, 2); g.add(chim);
  // glowing round pizza sign on a pole
  g.add(block(1, 12, 1, mat.wallDark, -120, 12));
  const sign = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.8, 20), emissive('#e7a545', 1.4));
  sign.rotation.x = Math.PI / 2; sign.position.set(-120, 15, 0.5); g.add(sign);
  tree(-128, 18, 1) && g.add(tree(-128, 18, 1));
});

/* MCAP OFFICE (north) */
district('data', '../work/', 'Work', 0, -105, (g) => {
  const tower = windowedTower(20, 44, 20, 0, -110);
  g.add(tower);
  g.add(block(14, 11, 12, mat.wall, -2, -86));           // low wing
  // MCAP sign panel on the facade
  g.add(block(16, 8, 1, mat.cream, 0, -99.4, 34));
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.6, 6), mat.navy);
  hex.rotation.x = Math.PI / 2; hex.position.set(0, 36, -99.2); g.add(hex);
  const hex2 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.7, 6), mat.gray);
  hex2.rotation.x = Math.PI / 2; hex2.position.set(0, 36, -99); g.add(hex2);
  g.add(windowedTower(16, 26, 16, 26, -92));             // neighbor tower
  g.add(lamp(-20, -80));
});

/* EXCHANGE (northeast) */
district('invest', '../investing/', 'Investing', 100, -100, (g) => {
  g.add(block(34, 3, 26, mat.wall, 100, -100));          // stepped base
  g.add(block(28, 11, 20, mat.wall, 100, -100, 3));      // hall
  for (let i = 0; i < 6; i++) g.add(block(2, 12, 2, mat.cream, 88 + i * 5, -90, 3)); // colonnade
  // pediment (triangular prism)
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 30, 3), mat.wall);
  ped.rotation.z = Math.PI / 2; ped.rotation.y = Math.PI / 2;
  ped.position.set(100, 15.5, -100); ped.scale.z = 0.9; ped.castShadow = true; g.add(ped);
  // rising green bar chart
  [4, 7, 11, 16, 22].forEach((h, i) => g.add(block(4, h, 4, mat.green, 122 + i * 6, -84 + i * 2)));
  g.add(windowedTower(15, 30, 15, 82, -118));
  g.add(lamp(120, -80));
});

/* WORKSHOP (southeast) */
district('archive', '#', 'Everything else', 100, 100, (g) => {
  g.add(block(26, 10, 20, mat.wall, 100, 100));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 28, 3), mat.roof);
  roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2;
  roof.position.set(100, 12, 100); roof.scale.z = 0.95; roof.castShadow = true; g.add(roof);
  g.add(block(10, 6, 0.6, mat.wallDark, 100, 110.2, 3));  // garage door
  // billboard
  g.add(block(0.8, 10, 0.8, mat.wallDark, 118, 92));
  g.add(block(9, 5, 0.6, mat.cream, 118, 88, 8));
  g.add(lamp(80, 80));
});

/* filler houses + trees + lamps around the residential blocks */
function house(x, z) {
  const g = new THREE.Group();
  g.add(block(11, 7, 9, mat.wall, x, z));
  const r = new THREE.Mesh(new THREE.ConeGeometry(8.5, 5, 4), mat.roof);
  r.rotation.y = Math.PI / 4; r.position.set(x, 9.5, z); r.castShadow = true;
  g.add(r);
  scene.add(g);
}
[[-110, 100], [-95, 118], [-125, 82], [-100, -100], [-118, -86], [12, 100], [-12, 118], [30, 92]]
  .forEach(p => house(p[0], p[1]));
[[-60, 60], [60, 60], [-60, -60], [60, -60], [-20, 20], [30, -20], [18, 30], [-30, -30]]
  .forEach(p => scene.add(tree(p[0], p[1], 1 + ((p[0] + p[1]) % 3) * 0.12)));
[[-55, -20], [55, 20], [-20, 55], [20, -55]].forEach(p => scene.add(lamp(p[0], p[1])));

/* project markers: glowing plinths, one per project */
const PROJECTS = [
  ['proj-cookbook', '../projects/adams-cookbook/', "Adam's Cookbook", -70, 22],
  ['proj-handoff', '../projects/handoff/', 'Handoff', 22, -70],
  ['proj-housing', '../projects/housing-dashboard/', 'Housing Dashboard', -118, 120],
  ['proj-songdle', '../projects/songdle/', 'Songdle', 26, 12]
];
PROJECTS.forEach(([key, href, label, x, z]) => {
  const g = new THREE.Group();
  g.add(block(6, 1.4, 6, mat.wallDark, x, z));
  const cube = new THREE.Mesh(boxGeo, emissive('#6f66ff', 0.8));
  cube.scale.set(3.4, 3.4, 3.4); cube.position.set(x, 3.1, z); cube.castShadow = true;
  g.add(cube);
  scene.add(g);
  targets.push({ key, href, label, x, z, r: 16 });
});

/* ---------- the car ---------- */
const car = new THREE.Group();
const body = block(4.4, 1.7, 8, new THREE.MeshStandardMaterial({ color: '#4038d8', roughness: 0.45, metalness: 0.3 }), 0, 0, 1.1);
body.position.set(0, 1.95, 0);
car.add(body);
const cabin = new THREE.Mesh(boxGeo, mat.glass);
cabin.scale.set(3.8, 1.5, 4); cabin.position.set(0, 3.4, -0.4); cabin.castShadow = true;
car.add(cabin);
// wheels
[[-2.1, 2.6], [2.1, 2.6], [-2.1, -2.6], [2.1, -2.6]].forEach(w => {
  const wh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 12), new THREE.MeshStandardMaterial({ color: '#171526', roughness: 0.8 }));
  wh.rotation.z = Math.PI / 2; wh.position.set(w[0], 1.1, w[1]); wh.castShadow = true;
  car.add(wh);
});
// headlights (emit + real light)
[[-1.3, 4], [1.3, 4]].forEach(h => {
  const hl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.3), headMat);
  hl.position.set(h[0], 2, h[1]); car.add(hl);
});
const beam = new THREE.SpotLight('#fff0c4', 40, 70, 0.6, 0.5, 1.4);
beam.position.set(0, 2.4, 3.5);
beam.target.position.set(0, 0, 24);
car.add(beam); car.add(beam.target);
car.position.set(-105, 0, 40);
car.rotation.y = Math.PI;
scene.add(car);

/* ---------- bloom compositor ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.55, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- driving ---------- */
const state = { x: -105, z: 40, hd: Math.PI, sp: 0 };
const input = { fwd: 0, turn: 0 };
const MAXF = 62, MAXR = 26, ACC = 96, BRK = 90;
let near = null;
const promptEl = document.getElementById('prompt');

function step(dt) {
  if (input.fwd > 0) state.sp = Math.min(MAXF, state.sp + ACC * dt);
  else if (input.fwd < 0) state.sp = Math.max(-MAXR, state.sp - BRK * dt);
  else state.sp -= state.sp * Math.min(1, 2.6 * dt);
  state.sp *= (1 - Math.min(1, 0.5 * dt));
  if (input.fwd === 0 && Math.abs(state.sp) < 0.4) state.sp = 0;

  const grip = Math.max(-1, Math.min(1, state.sp / 16));
  state.hd += input.turn * 1.7 * dt * grip;

  state.x += Math.sin(state.hd) * state.sp * dt;
  state.z += Math.cos(state.hd) * state.sp * dt;
  const lim = PLATE - 6;
  state.x = Math.max(-lim, Math.min(lim, state.x));
  state.z = Math.max(-lim, Math.min(lim, state.z));

  car.position.set(state.x, 0, state.z);
  car.rotation.y = state.hd;

  // chase camera
  const camDist = 30, camH = 18;
  const tx = state.x - Math.sin(state.hd) * camDist;
  const tz = state.z - Math.cos(state.hd) * camDist;
  const ease = Math.min(1, 4 * dt);
  camera.position.x += (tx - camera.position.x) * ease;
  camera.position.z += (tz - camera.position.z) * ease;
  camera.position.y += (camH + 10 - camera.position.y) * ease;
  camera.lookAt(state.x, 3, state.z);

  // keep the sun shadow centered on the car so shadows stay crisp
  sun.position.set(state.x - 70, 90, state.z + 44);
  sun.target.position.set(state.x, 0, state.z);
  sun.target.updateMatrixWorld();

  // nearest destination
  let best = null, bd = 1e9;
  for (const t of targets) {
    const d = Math.hypot(state.x - t.x, state.z - t.z);
    if (d < t.r && d < bd) { bd = d; best = t; }
  }
  const key = best && best.key;
  if (key !== (near && near.key)) {
    near = best;
    if (best) { promptEl.innerHTML = 'Press <b>Enter</b> to open ' + best.label; promptEl.classList.add('show'); }
    else promptEl.classList.remove('show');
  }
}

/* ---------- input ---------- */
const pressed = {};
function readInput() {
  input.fwd = (pressed.up ? 1 : 0) - (pressed.down ? 1 : 0);
  input.turn = (pressed.left ? 1 : 0) - (pressed.right ? 1 : 0);
}
function dirOf(k) {
  if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up';
  if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down';
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left';
  if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right';
  return null;
}
addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && near) { location.href = near.href === '#' ? '../#archive' : near.href; return; }
  const d = dirOf(e.key);
  if (!d) return;
  pressed[d] = true; readInput(); e.preventDefault();
});
addEventListener('keyup', (e) => {
  const d = dirOf(e.key);
  if (!d) return;
  pressed[d] = false; readInput();
});
document.querySelectorAll('.pad button[data-dir]').forEach((b) => {
  const d = b.dataset.dir;
  const on = (e) => { e.preventDefault(); pressed[d] = true; readInput(); };
  const off = (e) => { e.preventDefault(); pressed[d] = false; readInput(); };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off);
});
const pgo = document.getElementById('pgo');
if (pgo) pgo.addEventListener('click', () => { if (near) location.href = near.href === '#' ? '../#archive' : near.href; });

/* ---------- resize + loop ---------- */
addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

let prev = 0;
function loop(ts) {
  const dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
  prev = ts;
  if (!reduced) step(dt);
  composer.render();
  requestAnimationFrame(loop);
}
if (reduced) {
  camera.position.set(0, 120, 150);
  camera.lookAt(0, 0, 0);
}
requestAnimationFrame(loop);
