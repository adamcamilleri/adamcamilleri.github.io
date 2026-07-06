/* A drivable medieval market town. Original low-poly geometry with
   canvas-painted textures: half-timbered houses, steep tiled roofs,
   a cobblestone square, market stalls, barrels, hanging flower
   baskets, and a spiral-stair tower. Four trades stand in for the
   site's sections. Drive with WASD or arrows; buildings are solid;
   roll up to a shop and press Space to open its page, or up to a
   curio to read a note about my life. */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('city');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch (e) { document.getElementById('fallback').style.display = 'flex'; throw e; }
window.__cityBooted = true;

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- warm daytime sky ---------- */
const SKY = new THREE.Color('#a9ceeb');
const scene = new THREE.Scene();
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 250, 640);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 1600);
camera.position.set(0, 40, 60);

scene.add(new THREE.HemisphereLight('#cfe6ff', '#6a5a40', 0.8));
const sun = new THREE.DirectionalLight('#ffeecb', 2.05);
sun.position.set(-80, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
const sc = sun.shadow.camera;
sc.left = -150; sc.right = 150; sc.top = 150; sc.bottom = -150; sc.near = 10; sc.far = 460;
scene.add(sun); scene.add(sun.target);
scene.add(new THREE.DirectionalLight('#bcd4ff', 0.25).translateX(90).translateY(40).translateZ(-70));

/* drifting clouds */
const clouds = [];
for (let i = 0; i < 8; i++) {
  const c = new THREE.Group();
  for (let j = 0; j < 4; j++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(10 + Math.random() * 8, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, fog: false }));
    puff.position.set(j * 12 - 18 + Math.random() * 6, Math.random() * 4, Math.random() * 8);
    puff.scale.y = 0.5; c.add(puff);
  }
  c.position.set(-260 + Math.random() * 520, 150 + Math.random() * 40, -260 + Math.random() * 520);
  clouds.push(c); scene.add(c);
}

/* ---------- canvas textures ---------- */
function canv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return [c, c.getContext('2d')]; }
function repeatTex(c, rx, ry) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx); return t; }

function cobbleTexture() {
  const [c, g] = canv(256);
  g.fillStyle = '#8f7f60'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 6 + Math.random() * 7;
    const l = 58 + Math.random() * 22;
    g.fillStyle = 'hsl(' + (36 + Math.random() * 8) + ',' + (24 + Math.random() * 12) + '%,' + l + '%)';
    g.beginPath(); g.ellipse(x, y, r, r * 0.8, Math.random() * 3, 0, 7); g.fill();
  }
  return repeatTex(c, 26, 26);
}
function pathTexture() {
  const [c, g] = canv(128);
  g.fillStyle = '#b6a17a'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) { g.fillStyle = 'hsl(38,28%,' + (62 + Math.random() * 16) + '%)'; g.beginPath(); g.ellipse(Math.random() * 128, Math.random() * 128, 5, 4, Math.random() * 3, 0, 7); g.fill(); }
  return repeatTex(c, 8, 30);
}
function timberTexture(plaster) {
  const [c, g] = canv(128);
  g.fillStyle = plaster || '#d6c49e'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#43301e';
  g.fillRect(0, 0, 128, 13); g.fillRect(0, 115, 128, 13); g.fillRect(0, 58, 128, 10);  // rails
  g.fillRect(0, 0, 13, 128); g.fillRect(115, 0, 13, 128);                               // posts
  g.fillRect(40, 0, 9, 128); g.fillRect(79, 0, 9, 128);                                 // studs
  g.strokeStyle = '#43301e'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(13, 58); g.lineTo(40, 13); g.stroke();
  g.beginPath(); g.moveTo(88, 13); g.lineTo(115, 58); g.stroke();
  return repeatTex(c);
}
function stoneTexture() {
  const [c, g] = canv(128);
  g.fillStyle = '#9c917b'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#8a7f68';
  for (let y = 0; y < 128; y += 20) { const off = ((y / 20) % 2) ? 16 : 0; for (let x = -16; x < 128; x += 30) { g.fillRect(x + off + 1, y + 1, 28, 18); } }
  return repeatTex(c, 2, 2);
}
function roofTexture(hue) {
  const [c, g] = canv(128);
  g.fillStyle = 'hsl(' + hue + ',52%,34%)'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 14) {
    for (let x = 0; x < 128; x += 14) {
      g.fillStyle = 'hsl(' + hue + ',' + (48 + Math.random() * 14) + '%,' + (34 + Math.random() * 12) + '%)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y); g.lineTo(x + 14, y + 9); g.arc(x + 7, y + 9, 7, 0, Math.PI); g.lineTo(x, y + 9); g.closePath(); g.fill();
    }
  }
  return repeatTex(c, 3, 3);
}
function plankTexture() {
  const [c, g] = canv(128);
  for (let i = 0; i < 8; i++) { g.fillStyle = 'hsl(28,42%,' + (28 + Math.random() * 12) + '%)'; g.fillRect(0, i * 16, 128, 15); }
  return repeatTex(c);
}
function signTexture(text) {
  const [c, g] = canv(256, 96);
  g.fillStyle = '#4a3320'; g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#2f2013'; g.fillRect(6, 6, 244, 84);
  g.fillStyle = '#f0d9a8'; g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 52);
  return new THREE.CanvasTexture(c);
}
function crestTexture() {
  const [c, g] = canv(256);
  g.fillStyle = '#f4f5fb'; g.fillRect(0, 0, 256, 256);
  const cx = 128, cy = 120, r = 92, p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)], C = [cx, cy];
  const T = p(-Math.PI / 2), TR = p(-Math.PI / 6), BR = p(Math.PI / 6), B = p(Math.PI / 2), BL = p(5 * Math.PI / 6), TL = p(7 * Math.PI / 6);
  const poly = (pp, f) => { g.beginPath(); g.moveTo(pp[0][0], pp[0][1]); pp.slice(1).forEach(q => g.lineTo(q[0], q[1])); g.closePath(); g.fillStyle = f; g.fill(); };
  poly([T, TL, C], '#23306e'); poly([C, BR, B], '#23306e'); poly([TR, T, C], '#a7abb4'); poly([BL, B, C], '#a7abb4');
  poly([TL, BL, C], '#a7abb4'); poly([TR, BR, C], '#23306e');
  poly([[cx, cy - 40], [cx + 34, cy], [cx, cy + 40], [cx - 34, cy]], '#f4f5fb');
  return new THREE.CanvasTexture(c);
}
function screenTex(kind) {
  const [c, g] = canv(128);
  if (kind === 'code') { g.fillStyle = '#0d1326'; g.fillRect(0, 0, 128, 128); const cols = ['#7fd0ff', '#c792ea', '#c3e88d', '#ffcb6b']; for (let y = 10, i = 0; y < 120; y += 12, i++) { g.fillStyle = cols[i % 4]; g.fillRect(10, y, 30 + Math.random() * 70, 5); } }
  else if (kind === 'game') { g.fillStyle = '#101830'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { g.fillStyle = ['#57d97e', '#ff7a59', '#5aa0ff', '#ffd23f'][i % 4]; g.fillRect(Math.random() * 116, Math.random() * 116, 12, 12); } }
  else { const grd = g.createLinearGradient(0, 0, 0, 128); grd.addColorStop(0, '#7fa9d8'); grd.addColorStop(1, '#3a5a8e'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); g.fillStyle = '#e8c9a0'; g.beginPath(); g.arc(64, 52, 18, 0, 7); g.fill(); g.fillStyle = '#2b2436'; g.fillRect(44, 74, 40, 44); }
  return new THREE.CanvasTexture(c);
}
const TX = { crest: crestTexture(), scrCode: screenTex('code'), scrGame: screenTex('game'), scrPhoto: screenTex('photo') };

/* ---------- materials ---------- */
function M(o) { return new THREE.MeshStandardMaterial(o); }
const mat = {
  cobble: M({ map: cobbleTexture(), roughness: 1 }),
  path: M({ map: pathTexture(), roughness: 1 }),
  stone: M({ map: stoneTexture(), roughness: 0.95 }),
  timber: M({ map: timberTexture('#e9dfc6'), roughness: 0.9 }),
  timber2: M({ map: timberTexture('#dcc9a0'), roughness: 0.9 }),
  timber3: M({ map: timberTexture('#cdb894'), roughness: 0.9 }),
  wood: M({ map: plankTexture(), roughness: 0.85 }),
  dark: M({ color: '#4a3320', roughness: 0.8 }),
  beam: M({ color: '#5a3d26', roughness: 0.8 }),
  leaf: M({ color: '#4f7d43', roughness: 1 }),
  leaf2: M({ color: '#3f6b38', roughness: 1 }),
  glass: M({ color: '#5a76a0', roughness: 0.3, metalness: 0.2 }),
  gold: M({ color: '#e7b64a', emissive: '#5a4010', emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.6 }),
  cloth: M({ color: '#b8442f', roughness: 0.9 }),
  clothW: M({ color: '#efe6d2', roughness: 0.9 }),
  clothG: M({ color: '#3f8f5a', roughness: 0.9 }),
  metal: M({ color: '#4a4658', roughness: 0.5, metalness: 0.5 })
};
const ROOFS = [M({ map: roofTexture(12), roughness: 0.9 }), M({ map: roofTexture(20), roughness: 0.9 }), M({ map: roofTexture(28), roughness: 0.9 })];
const TIMBERS = [mat.timber, mat.timber2, mat.timber3];
const flowerCols = ['#e05a6b', '#e8a13c', '#d64ba0', '#f2d24b', '#8f5ad0', '#e8785a'];

/* ---------- geometry helpers ---------- */
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const obstacles = [];
function block(parent, w, h, d, material, x, z, y, cast) {
  const m = new THREE.Mesh(boxGeo, material);
  m.scale.set(w, h, d); m.position.set(x, (y || 0) + h / 2, z);
  m.castShadow = cast !== false; m.receiveShadow = true; parent.add(m); return m;
}
function addObstacle(x, z, w, d) { obstacles.push({ minX: x - w / 2 - 1, maxX: x + w / 2 + 1, minZ: z - d / 2 - 1, maxZ: z + d / 2 + 1 }); }

function litPanel(parent, w, h, tex, x, y, z, intensity) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: intensity || 0.4, roughness: 0.7 }));
  m.position.set(x, y, z); parent.add(m); return m;
}
function signPanel(parent, w, h, tex, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: tex, roughness: 0.8 }));
  m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}

/* steep tiled gable roof (ridge along x), with overhang */
function gableRoof(parent, x, z, w, d, y, roofMat) {
  const rh = d * 0.55;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rh, rh, w + 2.4, 3, 1), roofMat);
  roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2;
  roof.position.set(x, y + rh * 0.5, z); roof.castShadow = true; roof.receiveShadow = true;
  parent.add(roof);
}

/* a half-timbered house: stone ground floor, jettied timber upper
   floors, steep tiled roof, little windows */
function timberHouse(x, z, w, d, floors, roofMat) {
  const g = new THREE.Group();
  const fh = 6;
  block(g, w, fh, d, mat.stone, x, z, 0);
  windowRow(g, x, z, w, d, 2.6, fh);
  let y = fh, ww = w, dd = d;
  for (let i = 1; i < floors; i++) {
    ww += 1.3; dd += 1.3;
    block(g, ww, fh, dd, TIMBERS[(i + Math.round(x + z)) % 3], x, z, y);
    windowRow(g, x, z, ww, dd, y + 2.6, fh);
    y += fh;
  }
  gableRoof(g, x, z, ww, dd, y, roofMat[0] ? roofMat : ROOFS[Math.abs(Math.round(x - z)) % 3]);
  scene.add(g);
  addObstacle(x, z, w, d);
  return { top: y, w: ww, d: dd };
}
/* dark-glass windows with a timber frame on the +z and -z faces */
function windowRow(g, x, z, w, d, y, fh) {
  const n = Math.max(1, Math.floor(w / 6));
  for (let i = 0; i < n; i++) {
    const wx = x - w / 2 + (i + 0.5) * (w / n);
    [d / 2 + 0.06, -d / 2 - 0.06].forEach(zz => {
      block(g, 2.2, 2.6, 0.3, mat.beam, wx, z + zz, y - 1.3, false);
      block(g, 1.5, 1.9, 0.2, mat.glass, wx, z + (zz > 0 ? zz + 0.12 : zz - 0.12), y - 1.3, false);
    });
  }
}

function tree(x, z, s) {
  s = s || 1;
  const g = new THREE.Group();
  block(g, 1, 4 * s, 1, mat.beam, x, z);
  [[0, 4], [0, 6.4], [0, 8.4]].forEach((o, i) => { const c = new THREE.Mesh(new THREE.ConeGeometry((3.4 - i * 0.7) * s, (4 - i * 0.4) * s, 8), i % 2 ? mat.leaf2 : mat.leaf); c.position.set(x, (o[1]) * s, z); c.castShadow = true; g.add(c); });
  scene.add(g);
}
function barrel(x, z) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.95, 2.4, 12), mat.wood); b.position.set(x, 1.2, z); b.castShadow = true; g.add(b);
  [0.5, 1.9].forEach(hy => { const h = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.08, 6, 14), mat.dark); h.rotation.x = Math.PI / 2; h.position.set(x, hy, z); g.add(h); });
  scene.add(g); addObstacle(x, z, 2, 2);
}
function crate(x, z) { block(scene, 2, 2, 2, mat.wood, x, z); addObstacle(x, z, 2, 2); }
function flowerBox(x, z, w) {
  block(scene, w || 4, 1, 1.4, mat.wood, x, z, 0, false);
  for (let i = 0; i < (w || 4) * 1.5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), M({ color: flowerCols[i % flowerCols.length], roughness: 0.9 })); f.position.set(x - (w || 4) / 2 + Math.random() * (w || 4), 1.2, z - 0.5 + Math.random()); scene.add(f); }
}
function hangingBasket(parent, x, y, z) {
  block(parent, 0.2, 0.2, 1.4, mat.beam, x, z - 0.7, y, false);        // bracket
  const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1, 8), mat.wood); bowl.position.set(x, y - 1.2, z - 1.3); parent.add(bowl);
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), M({ color: flowerCols[i % flowerCols.length], roughness: 0.9 })); f.position.set(x + (Math.random() - 0.5), y - 0.5, z - 1.3 + (Math.random() - 0.5)); parent.add(f); }
}
function woodLamp(x, z) {
  const g = new THREE.Group();
  block(g, 0.5, 9, 0.5, mat.beam, x, z);
  block(g, 1.4, 0.4, 1.4, mat.beam, x, z, 8.7, false);
  const lantern = new THREE.Mesh(boxGeo, M({ color: '#ffd98a', emissive: '#ffb347', emissiveIntensity: 1.4, roughness: 0.5 }));
  lantern.scale.set(1, 1.4, 1); lantern.position.set(x, 8, z); g.add(lantern);
  const p = new THREE.PointLight('#ffcf80', 6, 26, 2); p.position.set(x, 8, z); g.add(p);
  scene.add(g);
}
function marketStall(x, z, awn) {
  const g = new THREE.Group();
  [[-3, -2], [3, -2], [-3, 2], [3, 2]].forEach(p => block(g, 0.4, 5, 0.4, mat.wood, x + p[0], z + p[1]));
  block(g, 7.2, 0.4, 4.6, mat.wood, x, z, 2.6);
  for (let i = 0; i < 8; i++) block(g, 0.95, 0.3, 5.4, i % 2 ? awn : mat.clothW, x - 3.1 + i * 0.9, z, 5.4, false);
  block(g, 7.4, 1.2, 0.3, awn, x, z - 2.7, 4.6, false);                 // valance
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(boxGeo, M({ color: flowerCols[(i * 2) % flowerCols.length], roughness: 0.9 })); c.scale.set(0.8, 0.8, 0.8); c.position.set(x - 2.6 + i * 1.3, 3.2, z); c.castShadow = true; g.add(c); }
  scene.add(g); addObstacle(x, z, 7, 5);
}
/* wrought bracket + hanging shop sign */
function hangingSign(parent, x, y, z, tex) {
  block(parent, 3.2, 0.2, 0.2, mat.beam, x + 1.6, z, y, false);
  block(parent, 0.15, 1.4, 0.15, mat.beam, x + 3, z, y - 0.7, false);
  const s = signPanel(parent, 3, 1.8, tex, x + 3, y - 1.8, z + 0.02);
  s.rotation.y = 0;
}
/* central spiral-stair tower landmark */
function spiralTower(x, z) {
  const g = new THREE.Group();
  block(g, 3, 40, 3, mat.wood, x, z);
  for (let i = 0; i < 44; i++) {
    const a = i * 0.5, r = 5;
    const step = block(g, 4, 0.5, 2.4, mat.wood, x + Math.cos(a) * r, z + Math.sin(a) * r, 1 + i * 0.85, true);
    step.rotation.y = -a;
    if (i % 3 === 0) block(g, 0.3, 3, 0.3, mat.beam, x + Math.cos(a) * (r + 1.8), z + Math.sin(a) * (r + 1.8), 1 + i * 0.85, false);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(7, 10, 8), ROOFS[0]); cone.position.set(x, 44, z); cone.castShadow = true; g.add(cone);
  scene.add(g); addObstacle(x, z, 7, 7);
}
function archGate(x, z) {
  const g = new THREE.Group();
  block(g, 6, 16, 8, mat.stone, x - 10, z); block(g, 6, 16, 8, mat.stone, x + 10, z);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(7, 3, 8, 16, Math.PI), mat.stone);
  arch.position.set(x, 16, z); g.add(arch);
  block(g, 26, 3, 9, mat.stone, x, z, 18);
  scene.add(g); addObstacle(x - 10, z, 6, 8); addObstacle(x + 10, z, 6, 8);
}

/* ---------- ground: cobble square with lighter cart-paths ---------- */
const PLATE = 150;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), mat.cobble);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
function path(w, d, x, z) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.path); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); m.receiveShadow = true; scene.add(m); }
path(20, PLATE * 2, -55, 0); path(20, PLATE * 2, 55, 0);
path(PLATE * 2, 20, 0, -55); path(PLATE * 2, 20, 0, 55);

/* ---------- districts (trades) ---------- */
const targets = [];
function district(key, href, label, cx, cz, r, build) { const g = new THREE.Group(); build(g); scene.add(g); targets.push({ key, href, label, x: cx, z: cz, r }); }

/* BAKERY -> pizza */
district('pizza', '../pizza/', 'Pizza', -105, 0, 30, (g) => {
  timberHouse(-105, 0, 22, 16, 3, ROOFS[0]);
  block(g, 8, 8, 8, mat.stone, -86, 0);                                // oven house
  block(g, 2.4, 14, 2.4, mat.stone, -80, -4);                          // chimney
  for (let i = 0; i < 8; i++) block(g, 3, 0.4, 3, i % 2 ? mat.cloth : mat.clothW, -116 + i * 3, 8.2, 9, false);
  hangingSign(g, -96, 10, 9.5, signTexture('BAKERY'));
  hangingBasket(g, -117, 9, 8.6); hangingBasket(g, -93, 9, 8.6);
  marketStall(-124, 14, mat.cloth); barrel(-128, 6); tree(-126, -16, 1.1);
});

/* GUILD HALL -> work (MCAP crest banner) */
district('data', '../work/', 'Work', 0, -105, 32, (g) => {
  timberHouse(0, -110, 26, 20, 4, ROOFS[1]);
  block(g, 30, 4, 24, mat.stone, 0, -110, 0);                          // grand base
  signPanel(g, 10, 14, TX.crest, 0, 22, -99.4);                        // hanging crest banner
  block(g, 12, 1, 1, mat.beam, 0, 30, -99.6, false);
  hangingSign(g, -14, 12, -99, signTexture('GUILD'));
  block(g, 1, 24, 1, mat.beam, 22, -99); const flag = new THREE.Mesh(boxGeo, mat.clothG); flag.scale.set(0.2, 3, 5); flag.position.set(22, 22, -96); g.add(flag);
  hangingBasket(g, -13, 9, -99.4); hangingBasket(g, 13, 9, -99.4);
  woodLamp(-18, -92); barrel(16, -94);
});

/* COUNTING HOUSE -> invest */
district('invest', '../investing/', 'Investing', 100, -100, 34, (g) => {
  timberHouse(100, -100, 24, 18, 3, ROOFS[2]);
  block(g, 28, 6, 22, mat.stone, 100, -100, 0);
  for (let i = 0; i < 5; i++) block(g, 2, 7, 2, mat.stone, 90 + i * 5, -90, 6);   // little arcade
  // stacked coin piles (green money = gold here)
  [4, 7, 11].forEach((h, i) => { const col = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, h, 12), mat.gold); col.position.set(120 + i * 5, h / 2, -86 + i * 2); col.castShadow = true; g.add(col); });
  hangingSign(g, 90, 11, -90.5, signTexture('BANK'));
  hangingBasket(g, 112, 9, -90.4); woodLamp(120, -80); barrel(86, -86);
});

/* CARPENTER -> workshop/archive */
district('archive', '#', 'Everything else', 100, 100, 30, (g) => {
  timberHouse(100, 100, 24, 18, 2, ROOFS[0]);
  block(g, 10, 7, 0.6, mat.wood, 100, 109.4, 2, false);               // big door
  hangingSign(g, 90, 10, 109.6, signTexture('WORKS'));
  // lumber pile
  for (let i = 0; i < 4; i++) block(g, 12, 1, 1.2, mat.wood, 118, 92 + i * 0.2, i * 1.1, false);
  crate(84, 112); crate(86, 114); barrel(120, 114); hangingBasket(g, 112, 9, 109.4);
});

/* ---------- filler town: half-timbered houses packed into blocks ---------- */
const HOUSES = [
  [-110, 105, 16, 14, 3], [-92, 122, 14, 12, 2], [-126, 86, 14, 12, 3], [-70, 108, 15, 13, 4],
  [-108, -108, 16, 14, 3], [-124, -90, 14, 12, 2], [-88, -122, 15, 12, 3], [-70, -104, 14, 12, 4],
  [110, 108, 15, 13, 3], [126, 90, 14, 12, 2], [88, 122, 14, 12, 3], [70, 104, 15, 13, 4],
  [-40, 42, 13, 11, 2], [-72, 40, 14, 12, 3], [40, -42, 13, 11, 2], [42, 72, 14, 12, 3],
  [-42, -72, 13, 11, 3], [72, 42, 14, 12, 2], [-70, -42, 14, 12, 3], [44, 40, 13, 11, 2],
  [-44, 70, 13, 12, 3], [70, -44, 14, 12, 2], [-30, 118, 13, 11, 2], [30, -118, 13, 11, 3],
  [118, -40, 14, 12, 3], [-118, 40, 14, 12, 2]
];
HOUSES.forEach((h, i) => {
  const r = timberHouse(h[0], h[1], h[2], h[3], h[4], ROOFS[i % 3]);
  if (i % 3 === 0) hangingBasket(scene, h[0] - h[2] / 2, r.top - 3, h[1] + h[3] / 2 + 0.3);
});

/* market square dressing */
[[-30, 30, mat.cloth], [30, 30, mat.clothG], [30, -30, mat.cloth], [-30, -30, mat.clothG], [-20, 66, mat.cloth], [66, 20, mat.clothG], [-66, -20, mat.cloth], [20, -66, mat.clothG]]
  .forEach(s => marketStall(s[0], s[1], s[2]));
[[-24, 24], [24, 24], [-24, -24], [24, -24], [-64, 40], [64, -40], [-40, -64], [40, 64], [-68, 68], [68, -68], [68, 68], [-68, -68]].forEach(p => tree(p[0], p[1], 1 + (Math.abs(p[0] + p[1]) % 3) * 0.14));
[[-46, 46], [46, -46], [-46, -46], [46, 46], [-64, 20], [20, 64], [64, -20], [-20, -64]].forEach(p => woodLamp(p[0], p[1]));
[[-38, 38], [38, -38], [-62, -30], [30, 62], [62, 30], [-30, -62]].forEach(p => flowerBox(p[0], p[1], 4));
[[-42, 40], [40, -42], [-40, -40], [40, 40], [-60, 44], [44, -60]].forEach(p => barrel(p[0], p[1]));

spiralTower(0, 0);
archGate(0, 128); archGate(128, 0);

/* ---------- easter eggs (curios that pop a card) ---------- */
const gold = mat.gold;
const eggProp = {
  computer(g, x, z) { block(g, 3, 1.4, 1.6, mat.metal, x, z, 2.2, false); litPanel(g, 2.4, 1.1, TX.scrGame, x, 2.9, z + 0.85, 1.6); block(g, 0.5, 1, 0.5, mat.metal, x, z, 1.2, false); block(g, 2.6, 0.3, 1, mat.dark, x, z + 1.4, 1.1, false); },
  code(g, x, z) { litPanel(g, 3.4, 2.4, TX.scrCode, x, 3.4, z, 1.5); block(g, 3.8, 2.8, 0.3, mat.dark, x, z, 2, false); },
  chef(g, x, z) { const band = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1, 16), mat.clothW); band.position.set(x, 2.4, z); band.castShadow = true; g.add(band); const puff = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 10), mat.clothW); puff.position.set(x, 3.6, z); puff.scale.y = 0.8; puff.castShadow = true; g.add(puff); },
  photo(g, x, z) { block(g, 0.5, 3.5, 0.5, mat.metal, x, z, 0); block(g, 4.4, 3.4, 0.4, mat.dark, x, z, 3.4, false); litPanel(g, 3.6, 2.6, TX.scrPhoto, x, 5.1, z + 0.25, 1.1); },
  arcade(g, x, z) { block(g, 2.6, 6, 2.2, mat.dark, x, z, 0); litPanel(g, 2, 1.6, TX.scrGame, x, 4.4, z + 1.15, 1.5); block(g, 2.6, 0.8, 2.2, mat.cloth, x, z, 6, false); },
  trophy(g, x, z) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.7, 2.4, 14), gold); cup.position.set(x, 3, z); cup.castShadow = true; g.add(cup); block(g, 1.6, 1, 1.6, gold, x, z, 1.2, false); },
  book(g, x, z) { ['#c15b5b', '#5b7bc1', '#5bc187'].forEach((col, i) => block(g, 3, 0.8, 2.2, M({ color: col, roughness: 0.8 }), x, z, 1.2 + i * 0.8, false)); }
};
const EGGS = [
  ['computer', 'Gaming', 'CS:GO, Overwatch, Minecraft', 'Thousands of hours. The aim reflexes and the redstone logic both fed into everything else. (rewrite in your own words)', -30, 12],
  ['code', 'Coding', 'Where this whole town comes from', 'JavaScript, SQL, and whatever a project needs. This city included. (rewrite in your own words)', 30, -12],
  ['chef', 'Cooking', 'Twenty recipes and a pizza obsession', 'Recipes on TikTok and a three-day dough habit. See the bakery. (rewrite in your own words)', -12, -30],
  ['photo', 'Convocation', 'BSc Computer Science, Laurier', '(Adam: drop in the real story of this event.)', 12, 30],
  ['arcade', 'Console era', 'Before the PC', '(Adam: add the consoles and games that raised you.)', -50, 12],
  ['book', 'Studying', 'Comp Sci, Wilfrid Laurier', 'Four years of theory that still shows up in the day job. (rewrite)', 50, -12],
  ['trophy', 'A proud moment', 'Something worth a shelf', '(Adam: what goes on the trophy shelf?)', 12, 50],
  ['computer', 'Building PCs', 'Hardware tinkering', '(Adam: your rig / the first PC you built.)', -12, -50],
  ['photo', 'A trip', 'Somewhere that stuck', '(Adam: a place and why it mattered.)', 50, 12],
  ['code', 'First program', 'The one that hooked you', '(Adam: what was the first thing you built?)', -50, -12],
  ['chef', 'Signature dish', 'The one people request', '(Adam: name the dish.)', 12, -50],
  ['trophy', 'MCAP', 'The day job that pays for the hobbies', 'Data analyst, Reporting & Analytics. (rewrite)', -12, 50]
];
EGGS.forEach(([kind, kicker, title, body, x, z], i) => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 1.2, 12), mat.stone); b.position.set(x, 0.6, z); b.receiveShadow = true; g.add(b);
  const halo = new THREE.PointLight('#ffe6a0', 3.5, 14, 2); halo.position.set(x, 3, z); g.add(halo);
  (eggProp[kind] || eggProp.trophy)(g, x, z + 0.0);
  g.children.forEach(c => { if (c.position && c.position.y !== undefined) c.position.y += 1.2; });
  scene.add(g);
  targets.push({ key: 'egg-' + i, egg: true, kicker, title, body, x, z, r: 10 });
});

/* ---------- the car: a chunky SUV ---------- */
const car = new THREE.Group();
const bodyMat = M({ color: '#7a2233', roughness: 0.4, metalness: 0.35 });
const trimMat = M({ color: '#1b1622', roughness: 0.6, metalness: 0.3 });
block(car, 4.6, 1.6, 8.4, bodyMat, 0, 0, 1.5);
block(car, 4.4, 1, 2.6, bodyMat, 0, 2.6, 2.7, false);
block(car, 4.2, 1.7, 4.2, trimMat, 0, -0.4, 3);
block(car, 3.9, 1.3, 3.8, mat.glass, 0, -0.4, 3.35, false);
block(car, 4.3, 0.4, 4.2, trimMat, 0, -0.4, 4.7, false);
const bar = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 0.6), M({ color: '#eaf3ff', emissive: '#eaf3ff', emissiveIntensity: 2, roughness: 0.4 }));
bar.position.set(0, 5, 1.4); car.add(bar);
block(car, 4.8, 1, 0.8, trimMat, 0, 4.2, 1.6, false);
block(car, 4.8, 1, 0.8, trimMat, 0, -4.2, 1.6, false);
[[-1.3, 4.4], [1.3, 4.4]].forEach(h => block(car, 0.4, 1.6, 1, trimMat, h[0], 4.4, 1.8, false));
[[-2.3, 2.8], [2.3, 2.8], [-2.3, -2.8], [2.3, -2.8]].forEach(w => {
  block(car, 1.6, 0.8, 2.8, trimMat, w[0] * 0.85, w[1], 2.3, false);
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.9, 14), M({ color: '#15131f', roughness: 0.85 }));
  tire.rotation.z = Math.PI / 2; tire.position.set(w[0], 1.25, w[1]); tire.castShadow = true; car.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.95, 8), M({ color: '#8b8fa6', roughness: 0.4, metalness: 0.6 }));
  rim.rotation.z = Math.PI / 2; rim.position.set(w[0], 1.25, w[1]); car.add(rim);
});
[[-1.4, 4.25], [1.4, 4.25]].forEach(h => block(car, 0.9, 0.7, 0.3, M({ color: '#fff2cc', emissive: '#fff2cc', emissiveIntensity: 2, roughness: 0.4 }), h[0], h[1], 2.2, false));
[[-1.5, -4.25], [1.5, -4.25]].forEach(h => block(car, 0.8, 0.6, 0.3, M({ color: '#ff3b52', emissive: '#ff3b52', emissiveIntensity: 1.6, roughness: 0.4 }), h[0], h[1], 2.2, false));
car.position.set(-95, 0, 45); car.rotation.y = Math.PI;
scene.add(car);

/* ---------- gentle bloom (just lanterns + car lights) ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.16, 0.5, 0.92));
composer.addPass(new OutputPass());

/* ---------- driving + collision ---------- */
const st = { x: -95, z: 45, hd: Math.PI, sp: 0 };
const input = { fwd: 0, turn: 0 };
const MAXF = 64, MAXR = 26, ACC = 100, BRK = 92, CAR_R = 3;
let near = null;
const promptEl = document.getElementById('prompt');
const card = document.getElementById('eggcard');
const cardK = document.getElementById('eggKicker'), cardT = document.getElementById('eggTitle'), cardB = document.getElementById('eggBody');
function showEgg(t) { cardK.textContent = t.kicker; cardT.textContent = t.title; cardB.textContent = t.body; card.classList.add('show'); }
function hideEgg() { card.classList.remove('show'); }

function resolveCollision() {
  for (const o of obstacles) {
    const nx = Math.max(o.minX, Math.min(st.x, o.maxX)), nz = Math.max(o.minZ, Math.min(st.z, o.maxZ));
    const dx = st.x - nx, dz = st.z - nz, d2 = dx * dx + dz * dz;
    if (d2 > CAR_R * CAR_R) continue;
    if (d2 > 1e-5) { const d = Math.sqrt(d2); st.x += dx / d * (CAR_R - d); st.z += dz / d * (CAR_R - d); }
    else { const l = st.x - o.minX, r = o.maxX - st.x, n = st.z - o.minZ, f = o.maxZ - st.z, m = Math.min(l, r, n, f); if (m === l) st.x = o.minX - CAR_R; else if (m === r) st.x = o.maxX + CAR_R; else if (m === n) st.z = o.minZ - CAR_R; else st.z = o.maxZ + CAR_R; }
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
  st.x += Math.sin(st.hd) * st.sp * dt; st.z += Math.cos(st.hd) * st.sp * dt;
  const lim = PLATE - 6; st.x = Math.max(-lim, Math.min(lim, st.x)); st.z = Math.max(-lim, Math.min(lim, st.z));
  resolveCollision();
  car.position.set(st.x, 0, st.z); car.rotation.y = st.hd;
  const camDist = 32, ease = Math.min(1, 4 * dt);
  camera.position.x += ((st.x - Math.sin(st.hd) * camDist) - camera.position.x) * ease;
  camera.position.z += ((st.z - Math.cos(st.hd) * camDist) - camera.position.z) * ease;
  camera.position.y += (20 - camera.position.y) * ease;
  camera.lookAt(st.x, 3, st.z);
  sun.position.set(st.x - 80, 120, st.z + 60); sun.target.position.set(st.x, 0, st.z); sun.target.updateMatrixWorld();
  let best = null, bd = 1e9;
  for (const t of targets) { const d = Math.hypot(st.x - t.x, st.z - t.z); if (d < t.r && d < bd) { bd = d; best = t; } }
  const key = best && best.key;
  if (key !== (near && near.key)) {
    near = best;
    if (best && best.egg) { showEgg(best); promptEl.classList.remove('show'); }
    else if (best) { hideEgg(); promptEl.innerHTML = 'Press <b>Space</b> to open ' + best.label; promptEl.classList.add('show'); }
    else { hideEgg(); promptEl.classList.remove('show'); }
  }
}

/* ---------- input ---------- */
const pressed = {};
function readInput() { input.fwd = (pressed.up ? 1 : 0) - (pressed.down ? 1 : 0); input.turn = (pressed.left ? 1 : 0) - (pressed.right ? 1 : 0); }
function dirOf(k) { if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up'; if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down'; if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left'; if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right'; return null; }
const go = () => { if (near && near.href) location.href = near.href === '#' ? '../#archive' : near.href; };
addEventListener('keydown', (e) => { if ((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && near) { e.preventDefault(); go(); return; } const d = dirOf(e.key); if (!d) return; pressed[d] = true; readInput(); e.preventDefault(); });
addEventListener('keyup', (e) => { const d = dirOf(e.key); if (!d) return; pressed[d] = false; readInput(); });
document.querySelectorAll('.pad button[data-dir]').forEach((b) => { const d = b.dataset.dir; const on = (e) => { e.preventDefault(); pressed[d] = true; readInput(); }; const off = (e) => { e.preventDefault(); pressed[d] = false; readInput(); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); });
const pgo = document.getElementById('pgo'); if (pgo) pgo.addEventListener('click', go);

/* ---------- resize + loop ---------- */
addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); });
if (reduced) { camera.position.set(0, 150, 180); camera.lookAt(0, 0, 0); }
let prev = 0;
function loop(ts) {
  const dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
  prev = ts;
  if (!reduced) step(dt);
  for (const c of clouds) { c.position.x += 2 * dt; if (c.position.x > 280) c.position.x = -280; }
  composer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
