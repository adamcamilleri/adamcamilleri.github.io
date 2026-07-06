/* A drivable Tokyo-at-night city. Original low-poly geometry with
   canvas-painted neon: packed skyscrapers dressed in glowing signs and
   lit windows, dark wet asphalt with scramble crosswalks, vending
   machines, traffic lights, utility poles, a bus, and pedestrians.
   Signs use abstract neon glyphs and generic category words, not real
   brands. Drive with WASD or arrows; buildings are solid; roll up to a
   shop and press Space to open its page, or to a curio to read a note. */

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
renderer.toneMappingExposure = 0.82;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- night sky with light-pollution glow ---------- */
const NIGHT = new THREE.Color('#0c0b1a');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#171326', 130, 460);
// gradient sky dome: deep navy up top, warm violet haze near the streets
const skyGeo = new THREE.SphereGeometry(700, 24, 16);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, fog: false,
  uniforms: { top: { value: new THREE.Color('#080714') }, bot: { value: new THREE.Color('#2a1a3e') } },
  vertexShader: 'varying vec3 vp; void main(){ vp=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'varying vec3 vp; uniform vec3 top; uniform vec3 bot; void main(){ float h=clamp((normalize(vp).y+0.15)/0.6,0.0,1.0); gl_FragColor=vec4(mix(bot,top,h),1.0); }'
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2000);
camera.position.set(0, 40, 60);

/* mostly-dark base light; the city is lit by its own neon */
scene.add(new THREE.HemisphereLight('#3a4066', '#0a0a14', 0.6));
const moon = new THREE.DirectionalLight('#95a6d8', 0.5);
moon.position.set(-70, 110, 50);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.03;
const sc = moon.shadow.camera; sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 10; sc.far = 460;
scene.add(moon); scene.add(moon.target);

/* ---------- textures ---------- */
function canv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return [c, c.getContext('2d')]; }
function repeatTex(c, rx, ry) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx); return t; }
const NEON = ['#ff2e63', '#14e0d6', '#ffcf3f', '#ff7a2f', '#4dff88', '#ff5edf', '#4d9bff', '#ff1e4d'];

function asphaltTexture() {
  const [c, g] = canv(128);
  g.fillStyle = '#14131c'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(' + (30 + Math.random() * 30) + ',' + (30 + Math.random() * 30) + ',' + (40 + Math.random() * 30) + ',0.5)'; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
  return repeatTex(c, 8, 8);
}
function windowsTexture() {
  const [c, g] = canv(64);
  g.fillStyle = '#0b0d18'; g.fillRect(0, 0, 64, 64);
  for (let y = 3; y < 64; y += 7) for (let x = 3; x < 64; x += 6) {
    const r = Math.random();
    g.fillStyle = r < 0.55 ? '#10121e' : (r < 0.78 ? '#ffdf9a' : (r < 0.92 ? '#bcd4ff' : '#ff9a6a'));
    g.fillRect(x, y, 4, 5);
  }
  return repeatTex(c);
}
function neonText(text, color, vertical) {
  const [c, g] = canv(vertical ? 96 : 256, vertical ? 256 : 96);
  g.fillStyle = '#08060f'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 22;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) { g.font = 'bold 52px Arial'; text.split('').forEach((ch, i) => g.fillText(ch, 48, 34 + i * 46)); }
  else { g.font = 'bold 64px Arial'; g.fillText(text, 128, 52); }
  return new THREE.CanvasTexture(c);
}
/* abstract vertical neon "characters" (original strokes, not real text) */
function neonGlyphs(color) {
  const [c, g] = canv(96, 256);
  g.fillStyle = '#08060f'; g.fillRect(0, 0, 96, 256);
  g.strokeStyle = color; g.shadowColor = color; g.shadowBlur = 16; g.lineWidth = 8; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const y = 30 + i * 46;
    g.beginPath(); g.moveTo(22, y); g.lineTo(74, y); g.stroke();
    g.beginPath(); g.moveTo(48, y - 16); g.lineTo(48, y + 16); g.stroke();
    if (i % 2) { g.beginPath(); g.moveTo(28, y - 12); g.lineTo(68, y + 12); g.stroke(); }
    else { g.beginPath(); g.moveTo(30, y + 12); g.lineTo(66, y - 12); g.stroke(); }
  }
  return new THREE.CanvasTexture(c);
}
function screenTexture(kind) {
  const [c, g] = canv(128);
  if (kind === 'crest') {
    g.fillStyle = '#0a1030'; g.fillRect(0, 0, 128, 128);
    const cx = 64, cy = 58, r = 40, p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)], C = [cx, cy];
    const T = p(-Math.PI / 2), TR = p(-Math.PI / 6), BR = p(Math.PI / 6), B = p(Math.PI / 2), BL = p(5 * Math.PI / 6), TL = p(7 * Math.PI / 6);
    const poly = (pp, f) => { g.beginPath(); g.moveTo(pp[0][0], pp[0][1]); pp.slice(1).forEach(q => g.lineTo(q[0], q[1])); g.closePath(); g.fillStyle = f; g.fill(); };
    poly([T, TL, C], '#3448a8'); poly([C, BR, B], '#3448a8'); poly([TR, T, C], '#c7cbe0'); poly([BL, B, C], '#c7cbe0'); poly([TL, BL, C], '#c7cbe0'); poly([TR, BR, C], '#3448a8');
    poly([[cx, cy - 16], [cx + 14, cy], [cx, cy + 16], [cx - 14, cy]], '#eef1ff');
    g.fillStyle = '#8fa6ff'; g.font = 'bold 20px Arial'; g.textAlign = 'center'; g.fillText('DATA', 64, 112);
  } else if (kind === 'ticker') {
    g.fillStyle = '#05130a'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#4dff88'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 90);
    for (let x = 6; x < 122; x += 10) g.lineTo(x, 90 - Math.random() * 60); g.stroke();
    g.fillStyle = '#4dff88'; g.font = 'bold 22px Arial'; g.textAlign = 'left'; g.fillText('+4.8%', 10, 24);
  } else { // arcade
    g.fillStyle = '#12061f'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 30; i++) { g.fillStyle = NEON[i % NEON.length]; g.fillRect(Math.random() * 116, Math.random() * 116, 10, 10); }
  }
  return new THREE.CanvasTexture(c);
}

function M(o) { return new THREE.MeshStandardMaterial(o); }
function emis(hex, i) { return M({ color: hex, emissive: hex, emissiveIntensity: i || 2, roughness: 0.4 }); }
const mat = {
  road: M({ map: asphaltTexture(), roughness: 0.42, metalness: 0.5, color: '#3a3a48' }),
  ground: M({ map: asphaltTexture(), roughness: 0.7, metalness: 0.2, color: '#26242e' }),
  stripe: M({ color: '#d8dae8', roughness: 0.6 }),
  win: M({ map: windowsTexture(), emissiveMap: windowsTexture(), emissive: '#ffffff', emissiveIntensity: 0.32, roughness: 0.5, metalness: 0.2 }),
  concrete: M({ color: '#2c2b36', roughness: 0.9 }),
  concrete2: M({ color: '#35333f', roughness: 0.9 }),
  dark: M({ color: '#171620', roughness: 0.7, metalness: 0.3 }),
  metal: M({ color: '#3a3a48', roughness: 0.5, metalness: 0.6 }),
  glass: M({ color: '#20304a', roughness: 0.25, metalness: 0.4 })
};
const winMats = [mat.win,
  M({ map: mat.win.map, emissiveMap: mat.win.map, emissive: '#ffe6c0', emissiveIntensity: 0.34, roughness: 0.5 }),
  M({ map: mat.win.map, emissiveMap: mat.win.map, emissive: '#cfe0ff', emissiveIntensity: 0.3, roughness: 0.5 })];

/* ---------- helpers ---------- */
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const obstacles = [];
const glowLights = [];
function block(parent, w, h, d, material, x, z, y, cast) {
  const m = new THREE.Mesh(boxGeo, material); m.scale.set(w, h, d); m.position.set(x, (y || 0) + h / 2, z);
  m.castShadow = cast !== false; m.receiveShadow = true; parent.add(m); return m;
}
function addObstacle(x, z, w, d) { obstacles.push({ minX: x - w / 2 - 1, maxX: x + w / 2 + 1, minZ: z - d / 2 - 1, maxZ: z + d / 2 + 1 }); }
function litPanel(parent, w, h, tex, x, y, z, intensity, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: intensity || 1.4, roughness: 0.6 }));
  m.position.set(x, y, z); if (ry) m.rotation.y = ry; parent.add(m); return m;
}
function neonBar(parent, w, h, x, y, z, color, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), emis(color, 2.4));
  m.position.set(x, y, z); if (ry) m.rotation.y = ry; parent.add(m); return m;
}
function colorLight(x, y, z, color) { if (glowLights.length > 26) return; const p = new THREE.PointLight(color, 8, 40, 2); p.position.set(x, y, z); scene.add(p); glowLights.push(p); }

/* a skyscraper caked in neon, signs facing +z (the street) */
const WORDS = ['RAMEN', 'BAR', 'SUSHI', 'KARAOKE', 'GAMES', 'CLUB', 'COFFEE', 'HOTEL', 'SAKE', 'NOODLE', 'OPEN', '24H'];
function tower(x, z, w, d, h, faceZ) {
  const g = new THREE.Group();
  block(g, w, h, d, winMats[Math.abs(Math.round(x + z)) % 3], x, z);
  block(g, w + 1, 1.5, d + 1, mat.dark, x, z, h);
  block(g, w * 0.3, 4, d * 0.3, mat.metal, x, z, h + 1.5, false); // rooftop unit
  const fz = z + (faceZ === -1 ? -d / 2 - 0.2 : d / 2 + 0.2);
  const ry = faceZ === -1 ? Math.PI : 0;
  // vertical neon signs climbing the facade
  const nSigns = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nSigns; i++) {
    const col = NEON[Math.floor(Math.random() * NEON.length)];
    const sx = x - w / 2 + 2 + Math.random() * (w - 4);
    const sh = 6 + Math.random() * 8, sy = 6 + Math.random() * (h - sh - 4);
    litPanel(g, 2.4, sh, neonGlyphs(col), sx, sy, fz + 0.3 * (faceZ === -1 ? -1 : 1), 1.7, ry);
  }
  // a horizontal marquee near the base
  const word = WORDS[Math.floor((x * 3 + z) % WORDS.length + WORDS.length) % WORDS.length];
  const wc = NEON[Math.floor((x + z) % NEON.length + NEON.length) % NEON.length];
  litPanel(g, Math.min(w - 1, 8), 2.4, neonText(word, wc), x, 5, fz + 0.3 * (faceZ === -1 ? -1 : 1), 1.7, ry);
  // rooftop box sign
  if (Math.random() < 0.6) { const rc = NEON[Math.floor(Math.random() * NEON.length)]; neonBar(g, w * 0.7, 3, x, h + 3.5, fz * 0.5 + z * 0.5, rc, ry); }
  colorLight(x, 8, fz, wc);
  scene.add(g); addObstacle(x, z, w, d);
  return g;
}

/* ---------- ground, roads, crosswalks ---------- */
const PLATE = 150;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), mat.ground);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
function road(w, d, x, z) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.road); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z); m.receiveShadow = true; scene.add(m); }
road(20, PLATE * 2, -55, 0); road(20, PLATE * 2, 55, 0); road(PLATE * 2, 20, 0, -55); road(PLATE * 2, 20, 0, 55);
function dash(x, z, vert) { const m = new THREE.Mesh(new THREE.PlaneGeometry(vert ? 0.8 : 5, vert ? 5 : 0.8), M({ color: '#c9b24a', roughness: 0.6 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); scene.add(m); }
for (let t = -PLATE; t < PLATE; t += 12) { if (Math.abs(t + 55) > 14 && Math.abs(t - 55) > 14) { dash(-55, t, true); dash(55, t, true); dash(t, -55, false); dash(t, 55, false); } }
/* scramble crosswalks at the four intersections */
function crosswalk(cx, cz, along) {
  for (let i = -7; i <= 7; i += 1.8) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(along === 'x' ? 1.1 : 16, along === 'x' ? 16 : 1.1), mat.stripe);
    s.rotation.x = -Math.PI / 2; s.position.set(along === 'x' ? cx + i : cx, 0.07, along === 'x' ? cz : cz + i); scene.add(s);
  }
}
[[-55, -55], [-55, 55], [55, -55], [55, 55]].forEach(([ix, iz]) => {
  crosswalk(ix, iz - 13, 'x'); crosswalk(ix, iz + 13, 'x'); crosswalk(ix - 13, iz, 'z'); crosswalk(ix + 13, iz, 'z');
});

/* ---------- districts ---------- */
const targets = [];
function district(key, href, label, cx, cz, r, build) { const g = new THREE.Group(); build(g); scene.add(g); targets.push({ key, href, label, x: cx, z: cz, r }); }

district('pizza', '../pizza/', 'Pizza', -105, 0, 30, (g) => {
  tower(-105, 0, 22, 16, 30, 1);
  litPanel(g, 12, 4, neonText('PIZZA', '#ff2e63'), -105, 12, 8.4, 2.4);
  litPanel(g, 3, 9, neonGlyphs('#ffcf3f'), -118, 10, 8.4, 1.9);
  // red paper-lantern row
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), emis('#ff3b3b', 1.6)); l.scale.y = 1.2; l.position.set(-116 + i * 2.4, 6, 9.2); g.add(l); }
  colorLight(-105, 8, 12, '#ff2e63');
});
district('data', '../work/', 'Work', 0, -105, 32, (g) => {
  tower(0, -110, 24, 20, 46, 1);
  litPanel(g, 16, 16, screenTexture('crest'), 0, 26, -99.4, 1.5);  // big screen with MCAP crest
  litPanel(g, 10, 3, neonText('DATA', '#4d9bff'), 0, 8, -99.4, 2.2);
  colorLight(0, 12, -96, '#4d9bff');
});
district('invest', '../investing/', 'Investing', 100, -100, 34, (g) => {
  tower(100, -100, 22, 18, 40, 1);
  litPanel(g, 14, 8, screenTexture('ticker'), 100, 24, -90.4, 1.6);
  litPanel(g, 10, 3, neonText('MARKET', '#4dff88'), 100, 8, -90.4, 2.2);
  colorLight(100, 12, -86, '#4dff88');
});
district('archive', '#', 'Everything else', 100, 100, 30, (g) => {
  tower(100, 100, 22, 18, 34, 1);
  litPanel(g, 12, 10, screenTexture('arcade'), 100, 20, 109.4, 1.6);
  litPanel(g, 10, 3, neonText('ARCADE', '#ff5edf'), 100, 7, 109.4, 2.4);
  colorLight(100, 12, 106, '#ff5edf');
});

/* ---------- packed filler skyscrapers ---------- */
const TOWERS = [
  [-112, 108, 18, 16, 40], [-90, 124, 14, 12, 30], [-128, 88, 15, 13, 52], [-70, 110, 16, 14, 44], [-108, -110, 18, 16, 46], [-126, -90, 14, 12, 34], [-88, -124, 15, 13, 40], [-70, -104, 16, 14, 56],
  [112, 110, 16, 14, 42], [128, 90, 14, 12, 50], [88, 124, 15, 12, 32], [70, 106, 16, 14, 48],
  [-40, 42, 14, 12, 34, -1], [-72, 40, 15, 13, 44], [40, -42, 14, 12, 30, -1], [42, 72, 15, 12, 40, -1], [-42, -72, 14, 12, 46], [72, 42, 15, 13, 36], [-70, -42, 15, 12, 50], [44, 40, 14, 12, 32, -1],
  [-44, 70, 14, 12, 42, -1], [70, -44, 15, 12, 38], [-30, 118, 13, 11, 30, -1], [30, -118, 13, 11, 44], [118, -40, 14, 12, 48], [-118, 40, 14, 12, 40]
];
TOWERS.forEach(t => tower(t[0], t[1], t[2], t[3], t[4], t[5] || 1));

/* ---------- street furniture ---------- */
function streetLamp(x, z) {
  const g = new THREE.Group();
  block(g, 0.4, 10, 0.4, mat.metal, x, z);
  block(g, 3, 0.3, 0.4, mat.metal, x + 1.3, z, 9.6, false);
  const head = new THREE.Mesh(boxGeo, emis('#eaf0ff', 2)); head.scale.set(1.4, 0.4, 0.8); head.position.set(x + 2.4, 9.4, z); g.add(head);
  const p = new THREE.PointLight('#dfe8ff', 5, 24, 2); p.position.set(x + 2.4, 9, z); g.add(p);
  scene.add(g);
}
function trafficLight(x, z) {
  const g = new THREE.Group();
  block(g, 0.4, 8, 0.4, mat.dark, x, z);
  block(g, 4, 0.3, 0.3, mat.dark, x + 1.6, z, 7.6, false);
  block(g, 1.2, 2.6, 0.6, mat.dark, x + 3, z, 6.6, false);
  const r = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), emis('#ff3b3b', 2.4)); r.position.set(x + 3, 8.4, z + 0.3); g.add(r);
  scene.add(g);
}
function vending(x, z) {
  const g = new THREE.Group();
  block(g, 3, 5, 1.6, mat.dark, x, z);
  litPanel(g, 2.4, 4, neonText(['DRINKS', 'SODA', 'TEA'][Math.floor(Math.random() * 3)], NEON[Math.floor(Math.random() * NEON.length)]), x, 3, z + 0.85, 1.6);
  scene.add(g); addObstacle(x, z, 3, 1.6);
}
function utilityPole(x, z) { block(scene, 0.5, 16, 0.5, mat.dark, x, z); block(scene, 4, 0.3, 0.3, mat.dark, x, z, 13, false); block(scene, 4, 0.3, 0.3, mat.dark, x, z, 14.5, false); }
function wire(x1, z1, x2, z2, y) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 4), mat.dark);
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.rotation.z = Math.PI / 2; m.rotation.y = Math.atan2(z2 - z1, x2 - x1); scene.add(m);
}
function ped(x, z) {
  const g = new THREE.Group();
  const col = ['#e8e8f0', '#3a3a48', '#c15b5b', '#5b7bc1', '#d8b64a'][Math.floor(Math.random() * 5)];
  block(g, 1, 2.4, 0.8, M({ color: col, roughness: 0.8 }), x, z, 0.6);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), M({ color: '#e8c9a0', roughness: 0.9 })); head.position.set(x, 3.4, z); g.add(head);
  scene.add(g);
}
function bus(x, z) {
  const g = new THREE.Group();
  block(g, 5, 5, 14, M({ color: '#d8dae2', roughness: 0.5, metalness: 0.3 }), x, z, 0.6);
  for (let i = 0; i < 5; i++) litPanel(g, 0.9, 1.4, neonText(' ', '#ffe6a0'), x + 2.55, 4, z - 5 + i * 2.4, 0.8, Math.PI / 2);
  block(g, 5.1, 1.4, 2, emis('#ffe6a0', 0.9), x, z - 6.9, 3.4, false);
  scene.add(g); addObstacle(x, z, 5, 14);
}

// place furniture along the sidewalks and crossings
[[-46, 46], [46, -46], [-46, -46], [46, 46], [-64, 22], [22, 64], [64, -22], [-22, -64], [-46, 20], [20, 46]].forEach(p => streetLamp(p[0], p[1]));
[[-46, -66], [66, 46], [-66, 46], [46, -66]].forEach(p => trafficLight(p[0], p[1]));
[[-64, 40], [64, -40], [-40, -64], [40, 64], [-44, 42], [42, -44], [-42, -42], [42, 42]].forEach(p => vending(p[0], p[1]));
const POLES = [[-64, 20], [-64, 5], [-64, -12], [-64, -30], [64, -20], [64, -5], [64, 12], [64, 30]];
POLES.forEach(p => utilityPole(p[0], p[1]));
for (let i = 0; i < POLES.length - 1; i++) if (Math.abs(POLES[i][0] - POLES[i + 1][0]) < 2) { wire(POLES[i][0], POLES[i][1], POLES[i + 1][0], POLES[i + 1][1], 13); wire(POLES[i][0], POLES[i][1], POLES[i + 1][0], POLES[i + 1][1], 14.5); }
[[-55, -42], [-48, -55], [55, 44], [48, 55], [-55, 44], [44, -55], [-42, 55], [55, -48], [-52, -52], [52, 52]].forEach(p => ped(p[0], p[1]));
bus(-55, 30); bus(55, -34);

/* ---------- easter eggs (curios that pop a card) ---------- */
const gold = M({ color: '#e7b64a', emissive: '#5a4010', emissiveIntensity: 0.4, roughness: 0.4, metalness: 0.6 });
const scr = { code: screenTexture('arcade'), game: screenTexture('arcade'), photo: screenTexture('crest') };
const eggProp = {
  computer(g, x, z) { block(g, 3, 1.4, 1.6, mat.metal, x, z, 2.2, false); litPanel(g, 2.4, 1.1, scr.game, x, 2.9, z + 0.85, 1.8); block(g, 0.5, 1, 0.5, mat.metal, x, z, 1.2, false); block(g, 2.6, 0.3, 1, mat.dark, x, z + 1.4, 1.1, false); },
  code(g, x, z) { litPanel(g, 3.4, 2.4, scr.code, x, 3.4, z, 1.6); block(g, 3.8, 2.8, 0.3, mat.dark, x, z, 2, false); },
  chef(g, x, z) { const band = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1, 16), M({ color: '#eef0f6', emissive: '#333', emissiveIntensity: 0.3, roughness: 0.7 })); band.position.set(x, 2.4, z); band.castShadow = true; g.add(band); const puff = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 10), band.material); puff.position.set(x, 3.6, z); puff.scale.y = 0.8; puff.castShadow = true; g.add(puff); },
  photo(g, x, z) { block(g, 0.5, 3.5, 0.5, mat.metal, x, z, 0); block(g, 4.4, 3.4, 0.4, mat.dark, x, z, 3.4, false); litPanel(g, 3.6, 2.6, scr.photo, x, 5.1, z + 0.25, 1.3); },
  arcade(g, x, z) { block(g, 2.6, 6, 2.2, mat.dark, x, z, 0); litPanel(g, 2, 1.6, scr.game, x, 4.4, z + 1.15, 1.8); block(g, 2.6, 0.8, 2.2, emis('#ff5edf', 1.4), x, z, 6, false); },
  trophy(g, x, z) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.7, 2.4, 14), gold); cup.position.set(x, 3, z); cup.castShadow = true; g.add(cup); block(g, 1.6, 1, 1.6, gold, x, z, 1.2, false); },
  book(g, x, z) { ['#c15b5b', '#5b7bc1', '#5bc187'].forEach((col, i) => block(g, 3, 0.8, 2.2, M({ color: col, roughness: 0.8 }), x, z, 1.2 + i * 0.8, false)); }
};
const EGGS = [
  ['computer', 'Gaming', 'CS:GO, Overwatch, Minecraft', 'Thousands of hours. The aim reflexes and the redstone logic both fed into everything else. (rewrite in your own words)', -30, 12],
  ['code', 'Coding', 'Where this whole city comes from', 'JavaScript, SQL, and whatever a project needs. This city included. (rewrite in your own words)', 30, -12],
  ['chef', 'Cooking', 'Twenty recipes and a pizza obsession', 'Recipes on TikTok and a three-day dough habit. (rewrite in your own words)', -12, -30],
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
  block(g, 5, 1, 5, mat.dark, x, z);
  const halo = new THREE.PointLight('#8f86ff', 5, 16, 2); halo.position.set(x, 3, z); g.add(halo);
  (eggProp[kind] || eggProp.trophy)(g, x, z);
  scene.add(g);
  targets.push({ key: 'egg-' + i, egg: true, kicker, title, body, x, z, r: 10 });
});

/* ---------- the car ---------- */
const car = new THREE.Group();
const bodyMat = M({ color: '#7a2233', roughness: 0.35, metalness: 0.45 });
const trimMat = M({ color: '#141119', roughness: 0.5, metalness: 0.4 });
block(car, 4.6, 1.6, 8.4, bodyMat, 0, 0, 1.5);
block(car, 4.4, 1, 2.6, bodyMat, 0, 2.6, 2.7, false);
block(car, 4.2, 1.7, 4.2, trimMat, 0, -0.4, 3);
block(car, 3.9, 1.3, 3.8, mat.glass, 0, -0.4, 3.35, false);
block(car, 4.3, 0.4, 4.2, trimMat, 0, -0.4, 4.7, false);
const bar = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 0.6), emis('#eaf3ff', 2.4)); bar.position.set(0, 5, 1.4); car.add(bar);
block(car, 4.8, 1, 0.8, trimMat, 0, 4.2, 1.6, false); block(car, 4.8, 1, 0.8, trimMat, 0, -4.2, 1.6, false);
[[-2.3, 2.8], [2.3, 2.8], [-2.3, -2.8], [2.3, -2.8]].forEach(w => {
  block(car, 1.6, 0.8, 2.8, trimMat, w[0] * 0.85, w[1], 2.3, false);
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.9, 14), M({ color: '#121019', roughness: 0.85 })); tire.rotation.z = Math.PI / 2; tire.position.set(w[0], 1.25, w[1]); tire.castShadow = true; car.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.95, 8), M({ color: '#9498ae', roughness: 0.4, metalness: 0.6 })); rim.rotation.z = Math.PI / 2; rim.position.set(w[0], 1.25, w[1]); car.add(rim);
});
[[-1.4, 4.25], [1.4, 4.25]].forEach(h => block(car, 0.9, 0.7, 0.3, emis('#fff2cc', 2.4), h[0], h[1], 2.2, false));
[[-1.5, -4.25], [1.5, -4.25]].forEach(h => block(car, 0.8, 0.6, 0.3, emis('#ff3b52', 1.8), h[0], h[1], 2.2, false));
const beam = new THREE.SpotLight('#fff0c4', 26, 60, 0.6, 0.5, 1.4); beam.position.set(0, 2.6, 4); beam.target.position.set(0, 0, 26); car.add(beam); car.add(beam.target);
const under = new THREE.PointLight('#ff2f6e', 4, 14, 2); under.position.set(0, 0.5, 0); car.add(under);
car.position.set(-95, 0, 45); car.rotation.y = Math.PI; scene.add(car);

/* ---------- strong bloom for neon ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.55, 0.55));
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
  moon.position.set(st.x - 70, 110, st.z + 50); moon.target.position.set(st.x, 0, st.z); moon.target.updateMatrixWorld();
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
const pressed = {};
function readInput() { input.fwd = (pressed.up ? 1 : 0) - (pressed.down ? 1 : 0); input.turn = (pressed.left ? 1 : 0) - (pressed.right ? 1 : 0); }
function dirOf(k) { if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up'; if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down'; if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left'; if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right'; return null; }
const go = () => { if (near && near.href) location.href = near.href === '#' ? '../#archive' : near.href; };
addEventListener('keydown', (e) => { if ((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && near) { e.preventDefault(); go(); return; } const d = dirOf(e.key); if (!d) return; pressed[d] = true; readInput(); e.preventDefault(); });
addEventListener('keyup', (e) => { const d = dirOf(e.key); if (!d) return; pressed[d] = false; readInput(); });
document.querySelectorAll('.pad button[data-dir]').forEach((b) => { const d = b.dataset.dir; const on = (e) => { e.preventDefault(); pressed[d] = true; readInput(); }; const off = (e) => { e.preventDefault(); pressed[d] = false; readInput(); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); });
const pgo = document.getElementById('pgo'); if (pgo) pgo.addEventListener('click', go);
addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); });
if (reduced) { camera.position.set(0, 150, 180); camera.lookAt(0, 0, 0); }
let prev = 0;
function loop(ts) {
  const dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
  prev = ts;
  if (!reduced) step(dt);
  composer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
