/* A 3D drivable version of the portfolio city. Original low-poly
   geometry, dusk lighting, soft shadows, and bloom on the lamps,
   signs, and headlights. Four districts match the flat map: pizzeria
   (west), MCAP office (north), exchange (northeast), workshop
   (southeast). Drive with WASD or arrows; buildings are solid; roll up
   to one and press Enter to open its page. */

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
renderer.toneMappingExposure = 1.0;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- scene, fog, camera ---------- */
const DUSK = new THREE.Color('#2b2350');
const scene = new THREE.Scene();
scene.background = DUSK;
scene.fog = new THREE.Fog(DUSK, 150, 380);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 1400);
camera.position.set(0, 40, 60);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight('#9a8fff', '#241d3a', 0.7));

const sun = new THREE.DirectionalLight('#ffb37a', 1.55);
sun.position.set(-70, 90, 44);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
const sc = sun.shadow.camera;
sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 10; sc.far = 420;
scene.add(sun); scene.add(sun.target);

const fill = new THREE.DirectionalLight('#6f7bff', 0.4);
fill.position.set(80, 40, -60);
scene.add(fill);

/* ---------- procedural textures ---------- */
function noiseTile(base, spread, size, cell) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const b = new THREE.Color(base);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const v = (Math.random() - 0.5) * spread;
      g.fillStyle = 'rgb(' + Math.round((b.r * 255) + v * 255) + ',' + Math.round((b.g * 255) + v * 255) + ',' + Math.round((b.b * 255) + v * 255) + ')';
      g.fillRect(x, y, cell - 1, cell - 1);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const groundTex = noiseTile('#5f5878', 0.05, 256, 32);
groundTex.repeat.set(40, 40);
const asphaltTex = noiseTile('#33304a', 0.04, 128, 16);
asphaltTex.repeat.set(6, 60);

function windowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#2c2a44'; g.fillRect(0, 0, 64, 64);
  for (let y = 4; y < 64; y += 12) {
    for (let x = 4; x < 64; x += 10) {
      const lit = ((x * 7 + y * 13) % 5) === 0;
      g.fillStyle = lit ? '#ffd76a' : '#4a4870';
      g.fillRect(x, y, 6, 8);
    }
  }
  g.strokeStyle = '#211f36'; g.lineWidth = 1.5;
  for (let i = 0; i < 64; i += 10) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); }
  for (let i = 0; i < 64; i += 12) { g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const winTex = windowTexture();

/* ---------- materials ---------- */
function emissive(hex, intensity) {
  return new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity, roughness: 0.4 });
}
const mat = {
  ground: new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }),
  road: new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 1 }),
  lane: new THREE.MeshStandardMaterial({ color: '#c9c6e6', roughness: 1 }),
  curb: new THREE.MeshStandardMaterial({ color: '#8a86a6', roughness: 0.9 }),
  wall: new THREE.MeshStandardMaterial({ color: '#c8c3e0', roughness: 0.85 }),
  wallB: new THREE.MeshStandardMaterial({ color: '#a49fc4', roughness: 0.85 }),
  wallC: new THREE.MeshStandardMaterial({ color: '#b6b1d2', roughness: 0.85 }),
  roof: new THREE.MeshStandardMaterial({ color: '#7d789c', roughness: 0.9 }),
  trunk: new THREE.MeshStandardMaterial({ color: '#5b4a54', roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#3f7d63', roughness: 1 }),
  leafB: new THREE.MeshStandardMaterial({ color: '#356b55', roughness: 1 }),
  red: new THREE.MeshStandardMaterial({ color: '#d8493c', roughness: 0.7 }),
  cream: new THREE.MeshStandardMaterial({ color: '#f2ede0', roughness: 0.7 }),
  green: new THREE.MeshStandardMaterial({ color: '#37a06b', emissive: '#124a2c', emissiveIntensity: 0.6, roughness: 0.6 }),
  navy: new THREE.MeshStandardMaterial({ color: '#23306e', roughness: 0.6 }),
  gray: new THREE.MeshStandardMaterial({ color: '#a7abb4', roughness: 0.6 }),
  glass: new THREE.MeshStandardMaterial({ color: '#2b3350', roughness: 0.25, metalness: 0.4 }),
  tire: new THREE.MeshStandardMaterial({ color: '#15131f', roughness: 0.85 }),
  rim: new THREE.MeshStandardMaterial({ color: '#8b8fa6', roughness: 0.4, metalness: 0.6 }),
  metal: new THREE.MeshStandardMaterial({ color: '#4a4658', roughness: 0.5, metalness: 0.5 })
};
const lampMat = emissive('#ffc861', 3.2);
const headMat = emissive('#fff2cc', 3.6);
const barMat = emissive('#eaf3ff', 3.4);
const signGreen = emissive('#4fe08a', 1.6);

/* ---------- geometry helpers ---------- */
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const obstacles = [];

function block(parent, w, h, d, material, x, z, y, cast) {
  const m = new THREE.Mesh(boxGeo, material);
  m.scale.set(w, h, d);
  m.position.set(x, (y || 0) + h / 2, z);
  m.castShadow = cast !== false; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function solid(parent, w, h, d, material, x, z, y) {
  const m = block(parent, w, h, d, material, x, z, y);
  obstacles.push({ minX: x - w / 2 - 1, maxX: x + w / 2 + 1, minZ: z - d / 2 - 1, maxZ: z + d / 2 + 1 });
  return m;
}
function tower(parent, w, h, d, x, z) {
  const tex = winTex.clone();
  tex.repeat.set(Math.max(2, Math.round(w / 5)), Math.max(3, Math.round(h / 5)));
  const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.15 }));
  m.scale.set(w, h, d); m.position.set(x, h / 2, z);
  m.castShadow = true; m.receiveShadow = true; parent.add(m);
  block(parent, w + 1, 1, d + 1, mat.roof, x, z, h);             // roof cap
  block(parent, w * 0.4, 2.5, d * 0.4, mat.metal, x, z, h + 1);  // rooftop unit
  obstacles.push({ minX: x - w / 2 - 1, maxX: x + w / 2 + 1, minZ: z - d / 2 - 1, maxZ: z + d / 2 + 1 });
  return m;
}
function tree(parent, x, z, s) {
  s = s || 1;
  const g = new THREE.Group();
  block(g, 0.8 * s, 3 * s, 0.8 * s, mat.trunk, x, z);
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.8 * s, 6 * s, 7), mat.leaf);
  c1.position.set(x, 6 * s, z); c1.castShadow = true; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(2 * s, 4 * s, 7), mat.leafB);
  c2.position.set(x, 8.5 * s, z); c2.castShadow = true; g.add(c2);
  parent.add(g);
}
function bush(parent, x, z) {
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), mat.leafB);
  b.position.set(x, 1.3, z); b.scale.y = 0.8; b.castShadow = true; parent.add(b);
}
function lamp(parent, x, z) {
  block(parent, 0.5, 8, 0.5, mat.wallB, x, z);
  block(parent, 2, 0.4, 0.5, mat.wallB, x + 0.9, z, 7.6, false);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), lampMat);
  head.position.set(x + 1.7, 7.2, z); parent.add(head);
  const p = new THREE.PointLight('#ffc861', 16, 32, 2);
  p.position.set(x + 1.7, 7, z); parent.add(p);
}
function hydrant(parent, x, z) {
  block(parent, 0.9, 1.6, 0.9, mat.red, x, z);
  block(parent, 1.3, 0.3, 0.5, mat.red, x, z, 0.9, false);
}
function bench(parent, x, z) {
  block(parent, 4, 0.3, 1.2, mat.trunk, x, z, 1);
  block(parent, 4, 1, 0.3, mat.trunk, x, z - 0.5, 1);
}
function tireStack(parent, x, z) {
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.5, 8, 14), mat.tire);
    t.rotation.x = Math.PI / 2; t.position.set(x + (i % 2) * 0.3, 0.6 + i * 1, z); t.castShadow = true;
    parent.add(t);
  }
}

/* ---------- ground + roads ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), mat.ground);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const PLATE = 150;
function road(w, d, x, z, y) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.road);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z);
  m.receiveShadow = true; scene.add(m);
}
// streets sit a hair above avenues so the four crossings never z-fight
road(16, PLATE * 2, -55, 0, 0.06); road(16, PLATE * 2, 55, 0, 0.06);
road(PLATE * 2, 16, 0, -55, 0.055); road(PLATE * 2, 16, 0, 55, 0.055);

// curbs, broken at every intersection so no strip runs across a road
const SEG = [[-PLATE, -63], [-47, 47], [63, PLATE]];
function curbH(zc) { SEG.forEach(s => block(scene, s[1] - s[0], 0.6, 1.2, mat.curb, (s[0] + s[1]) / 2, zc, 0.02, false)); }
function curbV(xc) { SEG.forEach(s => block(scene, 1.2, 0.6, s[1] - s[0], mat.curb, xc, (s[0] + s[1]) / 2, 0.02, false)); }
[-55, 55].forEach(z => { curbH(z - 8.6); curbH(z + 8.6); });
[-55, 55].forEach(x => { curbV(x - 8.6); curbV(x + 8.6); });

// lane dashes down the middle of each road
for (let t = -PLATE; t < PLATE; t += 14) {
  if (Math.abs(t + 55) > 12 && Math.abs(t - 55) > 12) {
    [-55, 55].forEach(x => { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5), mat.lane); a.rotation.x = -Math.PI / 2; a.position.set(x, 0.09, t); scene.add(a); });
    [-55, 55].forEach(z => { const a = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), mat.lane); a.rotation.x = -Math.PI / 2; a.position.set(t, 0.09, z); scene.add(a); });
  }
}

/* ---------- districts ---------- */
const targets = [];
function district(key, href, label, cx, cz, r, build) {
  const g = new THREE.Group();
  build(g);
  scene.add(g);
  targets.push({ key, href, label, x: cx, z: cz, r: r });
}

/* PIZZERIA (west) */
district('pizza', '../pizza/', 'Pizza', -105, 0, 30, (g) => {
  solid(g, 24, 12, 18, mat.wall, -105, 0);
  block(g, 25, 1.2, 19, mat.roof, -105, 0, 12);
  for (let i = 0; i < 8; i++) block(g, 3, 1.2, 4, i % 2 ? mat.red : mat.cream, -116 + i * 3, 9, 12.6, false);
  solid(g, 9, 9, 9, mat.wallB, -86, 0);                     // oven
  block(g, 2.4, 13, 2.4, mat.wallB, -80, -4);               // chimney
  block(g, 1, 12, 1, mat.wallB, -120, 8);                   // sign pole
  const sign = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.8, 20), emissive('#e7a545', 1.6));
  sign.rotation.x = Math.PI / 2; sign.position.set(-120, 15, 8.5); g.add(sign);
  tireStack(g, -128, 14); tree(g, -126, -14, 1);
});

/* MCAP OFFICE (north) */
district('data', '../work/', 'Work', 0, -105, 32, (g) => {
  tower(g, 20, 46, 20, 0, -110);
  solid(g, 14, 11, 12, mat.wall, -2, -86);
  block(g, 16, 8, 1, mat.cream, 0, 34, -99.4);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.6, 6), mat.navy);
  hex.rotation.x = Math.PI / 2; hex.position.set(0, 34, -98.8); g.add(hex);
  const hex2 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.7, 6), mat.gray);
  hex2.rotation.x = Math.PI / 2; hex2.position.set(0, 34, -98.6); g.add(hex2);
  tower(g, 15, 28, 15, 26, -92);
  lamp(g, -20, -78); bench(g, -14, -76); hydrant(g, 14, -78);
});

/* EXCHANGE (northeast) */
district('invest', '../investing/', 'Investing', 100, -100, 34, (g) => {
  solid(g, 34, 3, 26, mat.wall, 100, -100);
  solid(g, 28, 11, 20, mat.wallC, 100, -100, 3);
  for (let i = 0; i < 6; i++) block(g, 2, 12, 2, mat.cream, 88 + i * 5, -90, 3);
  block(g, 30, 3, 22, mat.wall, 100, -100, 14);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 30, 3), mat.wall);
  ped.rotation.z = Math.PI / 2; ped.rotation.y = Math.PI / 2; ped.position.set(100, 18.5, -100); ped.scale.z = 0.9; ped.castShadow = true; g.add(ped);
  [4, 7, 11, 16, 22].forEach((h, i) => block(g, 4, h, 4, mat.green, 122 + i * 6, -84 + i * 2));
  const flag = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 4), signGreen);
  flag.rotation.z = -Math.PI / 2; flag.position.set(102, 22, -100); g.add(flag);
  tower(g, 15, 32, 15, 82, -120);
  lamp(g, 120, -80);
});

/* WORKSHOP (southeast) */
district('archive', '#', 'Everything else', 100, 100, 30, (g) => {
  solid(g, 26, 10, 20, mat.wall, 100, 100);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 28, 3), mat.roof);
  roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.set(100, 12, 100); roof.scale.z = 0.95; roof.castShadow = true; g.add(roof);
  block(g, 10, 6, 0.6, mat.metal, 100, 110.2, 3, false);
  block(g, 0.8, 10, 0.8, mat.wallB, 118, 92);
  block(g, 9, 5, 0.6, mat.cream, 118, 88, 8);
  tireStack(g, 82, 112); tireStack(g, 120, 116);
  lamp(g, 80, 82);
});

/* ---------- residential + props ---------- */
function house(x, z, rot) {
  const g = new THREE.Group();
  solid(g, 11, 7, 9, mat.wall, x, z);
  const r = new THREE.Mesh(new THREE.ConeGeometry(8.5, 5, 4), mat.roof);
  r.rotation.y = Math.PI / 4; r.position.set(x, 9.5, z); r.castShadow = true; g.add(r);
  block(g, 2, 3.5, 0.4, mat.glass, x, z + 4.6, 1.5, false);   // door
  if (rot) g.rotation.y = rot;
  scene.add(g);
}
[[-110, 100], [-95, 118], [-125, 82], [-100, -105], [-120, -88], [12, 100], [-14, 118], [30, 92], [118, -40], [-42, 118]]
  .forEach(p => house(p[0], p[1]));
[[-68, 68], [68, 68], [-68, -68], [68, -68], [-26, 26], [30, -26], [26, 30], [-34, -30], [42, 42], [-44, 40], [-40, -44], [40, -40]]
  .forEach(p => tree(scene, p[0], p[1], 1 + ((Math.abs(p[0]) + Math.abs(p[1])) % 3) * 0.14));
[[-64, -24], [64, 24], [-24, 64], [24, -64], [-64, 64], [64, -64], [-64, -64], [64, 64]].forEach(p => lamp(scene, p[0], p[1]));
[[-40, 40], [40, -40], [-64, -30], [30, 64], [-30, -64], [64, 42]].forEach(p => bush(scene, p[0], p[1]));
[[-66, 40], [40, -66], [64, -40]].forEach(p => hydrant(scene, p[0], p[1]));

/* project markers (glowing plinths, not solid so you can roll onto them) */
const PROJECTS = [
  ['proj-cookbook', '../projects/adams-cookbook/', "Adam's Cookbook", -70, 24],
  ['proj-handoff', '../projects/handoff/', 'Handoff', 24, -70],
  ['proj-housing', '../projects/housing-dashboard/', 'Housing Dashboard', -120, 122],
  ['proj-songdle', '../projects/songdle/', 'Songdle', 28, 14]
];
PROJECTS.forEach(([key, href, label, x, z]) => {
  const g = new THREE.Group();
  block(g, 6, 1.4, 6, mat.wallB, x, z);
  const cube = new THREE.Mesh(boxGeo, emissive('#6f66ff', 0.9));
  cube.scale.set(3.4, 3.4, 3.4); cube.position.set(x, 3.1, z); cube.castShadow = true; g.add(cube);
  const halo = new THREE.PointLight('#6f66ff', 6, 20, 2); halo.position.set(x, 4, z); g.add(halo);
  scene.add(g);
  targets.push({ key, href, label, x, z, r: 15 });
});

/* ---------- the car: a chunky SUV ---------- */
const car = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: '#7a2233', roughness: 0.4, metalness: 0.35 });
const trimMat = new THREE.MeshStandardMaterial({ color: '#1b1622', roughness: 0.6, metalness: 0.3 });
// chassis + hood + body
block(car, 4.6, 1.6, 8.4, bodyMat, 0, 0, 1.5);
block(car, 4.4, 1, 2.6, bodyMat, 0, 2.6, 2.7, false);        // hood
// greenhouse / cabin with glass
block(car, 4.2, 1.7, 4.2, trimMat, 0, -0.4, 3);
block(car, 3.9, 1.3, 3.8, mat.glass, 0, -0.4, 3.35, false);  // windows
// roof + light bar
block(car, 4.3, 0.4, 4.2, trimMat, 0, -0.4, 4.7, false);
const bar = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 0.6), barMat);
bar.position.set(0, 5, 1.4); car.add(bar);
// bumpers / bull bar
block(car, 4.8, 1, 0.8, trimMat, 0, 4.2, 1.6, false);
block(car, 4.8, 1, 0.8, trimMat, 0, -4.2, 1.6, false);
block(car, 0.4, 1.6, 1, trimMat, -1.3, 4.4, 1.8, false);
block(car, 0.4, 1.6, 1, trimMat, 1.3, 4.4, 1.8, false);
// fenders + wheels
[[-2.3, 2.8], [2.3, 2.8], [-2.3, -2.8], [2.3, -2.8]].forEach(w => {
  block(car, 1.6, 0.8, 2.8, trimMat, w[0] * 0.85, w[1], 2.3, false);   // arch
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.9, 14), mat.tire);
  tire.rotation.z = Math.PI / 2; tire.position.set(w[0], 1.25, w[1]); tire.castShadow = true; car.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.95, 8), mat.rim);
  rim.rotation.z = Math.PI / 2; rim.position.set(w[0], 1.25, w[1]); car.add(rim);
});
// headlights + tail lights
[[-1.4, 4.25], [1.4, 4.25]].forEach(h => block(car, 0.9, 0.7, 0.3, headMat, h[0], h[1], 2.2, false));
[[-1.5, -4.25], [1.5, -4.25]].forEach(h => block(car, 0.8, 0.6, 0.3, emissive('#ff3b52', 2.2), h[0], h[1], 2.2, false));
// forward beam + underglow
const beam = new THREE.SpotLight('#fff0c4', 30, 60, 0.6, 0.5, 1.4);
beam.position.set(0, 2.6, 4); beam.target.position.set(0, 0, 26); car.add(beam); car.add(beam.target);
const under = new THREE.PointLight('#ff2f6e', 5, 14, 2); under.position.set(0, 0.6, 0); car.add(under);
car.position.set(-105, 0, 40); car.rotation.y = Math.PI;
scene.add(car);

/* ---------- bloom ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.65, 0.5, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- driving + collision ---------- */
const st = { x: -105, z: 40, hd: Math.PI, sp: 0 };
const input = { fwd: 0, turn: 0 };
const MAXF = 64, MAXR = 26, ACC = 100, BRK = 92, CAR_R = 3;
let near = null;
const promptEl = document.getElementById('prompt');

function resolveCollision() {
  for (const o of obstacles) {
    const nx = Math.max(o.minX, Math.min(st.x, o.maxX));
    const nz = Math.max(o.minZ, Math.min(st.z, o.maxZ));
    const dx = st.x - nx, dz = st.z - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 > CAR_R * CAR_R) continue;
    if (d2 > 1e-5) {
      const d = Math.sqrt(d2);
      st.x += dx / d * (CAR_R - d); st.z += dz / d * (CAR_R - d);
    } else {
      const l = st.x - o.minX, r = o.maxX - st.x, n = st.z - o.minZ, f = o.maxZ - st.z;
      const m = Math.min(l, r, n, f);
      if (m === l) st.x = o.minX - CAR_R; else if (m === r) st.x = o.maxX + CAR_R;
      else if (m === n) st.z = o.minZ - CAR_R; else st.z = o.maxZ + CAR_R;
    }
    st.sp *= 0.3;
  }
}

function step(dt) {
  if (input.fwd > 0) st.sp = Math.min(MAXF, st.sp + ACC * dt);
  else if (input.fwd < 0) st.sp = Math.max(-MAXR, st.sp - BRK * dt);
  else st.sp -= st.sp * Math.min(1, 2.6 * dt);
  st.sp *= (1 - Math.min(1, 0.5 * dt));
  if (input.fwd === 0 && Math.abs(st.sp) < 0.4) st.sp = 0;

  const grip = Math.max(-1, Math.min(1, st.sp / 16));
  st.hd += input.turn * 1.7 * dt * grip;

  st.x += Math.sin(st.hd) * st.sp * dt;
  st.z += Math.cos(st.hd) * st.sp * dt;
  const lim = PLATE - 6;
  st.x = Math.max(-lim, Math.min(lim, st.x));
  st.z = Math.max(-lim, Math.min(lim, st.z));
  resolveCollision();

  car.position.set(st.x, 0, st.z);
  car.rotation.y = st.hd;

  const camDist = 32, ease = Math.min(1, 4 * dt);
  camera.position.x += ((st.x - Math.sin(st.hd) * camDist) - camera.position.x) * ease;
  camera.position.z += ((st.z - Math.cos(st.hd) * camDist) - camera.position.z) * ease;
  camera.position.y += (20 - camera.position.y) * ease;
  camera.lookAt(st.x, 3, st.z);

  sun.position.set(st.x - 70, 90, st.z + 44);
  sun.target.position.set(st.x, 0, st.z); sun.target.updateMatrixWorld();

  let best = null, bd = 1e9;
  for (const t of targets) {
    const d = Math.hypot(st.x - t.x, st.z - t.z);
    if (d < t.r && d < bd) { bd = d; best = t; }
  }
  const key = best && best.key;
  if (key !== (near && near.key)) {
    near = best;
    if (best) { promptEl.innerHTML = 'Press <b>Space</b> to open ' + best.label; promptEl.classList.add('show'); }
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
const go = () => { if (near) location.href = near.href === '#' ? '../#archive' : near.href; };
addEventListener('keydown', (e) => {
  if ((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && near) { e.preventDefault(); go(); return; }
  const d = dirOf(e.key); if (!d) return;
  pressed[d] = true; readInput(); e.preventDefault();
});
addEventListener('keyup', (e) => { const d = dirOf(e.key); if (!d) return; pressed[d] = false; readInput(); });
document.querySelectorAll('.pad button[data-dir]').forEach((b) => {
  const d = b.dataset.dir;
  const on = (e) => { e.preventDefault(); pressed[d] = true; readInput(); };
  const off = (e) => { e.preventDefault(); pressed[d] = false; readInput(); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
});
const pgo = document.getElementById('pgo'); if (pgo) pgo.addEventListener('click', go);

/* ---------- resize + loop ---------- */
addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
if (reduced) { camera.position.set(0, 130, 160); camera.lookAt(0, 0, 0); }
let prev = 0;
function loop(ts) {
  const dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
  prev = ts;
  if (!reduced) step(dt);
  composer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
