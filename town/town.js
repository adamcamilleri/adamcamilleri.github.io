/* Adam's Town: a walkable top-down pixel town. A round central plaza
   with a landmark clock tower and shops around the ring, each one a
   portfolio stop. All art is drawn procedurally here (original), no
   third-party sprites. Walk with WASD/arrows; press Space at a shop
   door to enter, or at a curio to read a note. */
(function () {
  'use strict';

  var TS = 16, SCALE = 3;                 // 16px tiles, drawn at 3x
  var cvs = document.getElementById('game');
  var ctx = cvs.getContext('2d');
  function resize() { cvs.width = window.innerWidth; cvs.height = window.innerHeight; ctx.imageSmoothingEnabled = false; }
  window.addEventListener('resize', resize); resize();

  /* ---------- tiny pixel-canvas helpers ---------- */
  function make(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
  function dots(g, w, h, n, cols) { for (var i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1, 1); } }

  /* ---------- ground tiles ---------- */
  function grassTile() { var [c, g] = make(TS, TS); R(g, 0, 0, TS, TS, '#5ba149'); dots(g, TS, TS, 22, ['#6cb658', '#4f9440']); for (var i = 0; i < 4; i++) { var x = (Math.random() * 14) | 0, y = (Math.random() * 14) | 0; R(g, x, y, 1, 2, '#3f8236'); R(g, x + 1, y, 1, 2, '#4f9440'); } return c; }
  function pathTile() { var [c, g] = make(TS, TS); R(g, 0, 0, TS, TS, '#d8bf8b'); dots(g, TS, TS, 26, ['#cbae74', '#e3cf9f']); return c; }
  function plazaTile() { var [c, g] = make(TS, TS); R(g, 0, 0, TS, TS, '#cabb98'); g.fillStyle = '#b3a17a'; g.fillRect(0, 0, TS, 1); g.fillRect(0, 8, TS, 1); g.fillRect(0, 0, 1, TS); g.fillRect(8, 0, 1, TS); dots(g, TS, TS, 10, ['#d8caa8', '#bdac86']); return c; }
  function waterTile() { var [c, g] = make(TS, TS); R(g, 0, 0, TS, TS, '#4aa6d8'); R(g, 2, 3, 5, 1, '#8fd0ef'); R(g, 9, 9, 4, 1, '#8fd0ef'); dots(g, TS, TS, 8, ['#3f96c6', '#66b8e2']); return c; }
  var TILE = {};
  function bakeTiles() { TILE.g = grassTile(); TILE.p = pathTile(); TILE.z = plazaTile(); TILE.w = waterTile(); }

  /* ---------- building sprite (storefront) ---------- */
  var PAL = {
    wall: ['#e9d6b0', '#dcc298', '#d3b78c'], wallShade: '#b89a6c',
    roofs: [['#c14b3c', '#a63b2e'], ['#4a76b8', '#3a5f9a'], ['#d98a3c', '#bd7230'], ['#4a9a5c', '#3c8049'], ['#8a5ec0', '#7048a0'], ['#c94f8f', '#a83c74']],
    door: '#5a3d26', doorDk: '#3f2a1a', window: '#8fd0ef', windowFr: '#5a3d26', trim: '#3a2a1a'
  };
  function shopSprite(wt, ht, roof, awn) {
    var W = wt * TS, H = ht * TS, [c, g] = make(W, H);
    var wall = PAL.wall[(wt + ht) % 3];
    var roofH = TS + 6;
    // body
    R(g, 0, roofH, W, H - roofH, wall);
    R(g, 0, roofH, W, 2, PAL.wallShade);
    R(g, 0, H - 2, W, 2, PAL.wallShade);
    // windows
    for (var i = 0; i < wt; i++) { if (i === (wt >> 1)) continue; var wx = i * TS + 4; R(g, wx - 1, roofH + 6, 10, 11, PAL.windowFr); R(g, wx, roofH + 7, 8, 9, PAL.window); R(g, wx, roofH + 7, 8, 3, '#b9e6fb'); }
    // door (center bottom)
    var dx = (wt >> 1) * TS + 3;
    R(g, dx - 1, H - 20, 12, 20, PAL.doorDk);
    R(g, dx, H - 19, 10, 19, PAL.door);
    R(g, dx + 7, H - 11, 2, 2, '#e0c060');
    // striped awning over the door
    for (var s = 0; s < 12; s++) R(g, dx - 3 + s, roofH + (H - roofH) - 24, 1, 5, s % 2 ? roof[0] : '#f2ead6');
    // roof: overhanging, with tile rows + ridge
    R(g, -2, 0, W + 4, roofH, roof[0]);
    R(g, -2, 0, W + 4, 3, roof[1]);
    for (var ry = 5; ry < roofH; ry += 4) R(g, -2, ry, W + 4, 1, roof[1]);
    R(g, -3, roofH - 2, W + 6, 3, '#3a2a1a');       // eave shadow
    // sign board hanging under the eave
    R(g, W / 2 - 12, roofH + 1, 24, 8, '#3a2a1a');
    R(g, W / 2 - 11, roofH + 2, 22, 6, '#c8a86a');
    return c;
  }
  function towerSprite() {
    var W = 5 * TS, H = 12 * TS, [c, g] = make(W, H);
    var wall = '#d9c6a0';
    R(g, 6, 20, W - 12, H - 20, wall);
    R(g, 6, 20, W - 12, 2, '#b89a6c'); R(g, 6, H - 2, W - 12, 2, '#b89a6c');
    for (var fy = 30; fy < H - 16; fy += 18) for (var fx = 12; fx < W - 12; fx += 14) { R(g, fx - 1, fy - 1, 10, 13, PAL.windowFr); R(g, fx, fy, 8, 11, '#8fd0ef'); R(g, fx, fy, 8, 4, '#b9e6fb'); }
    // clock face near top
    R(g, W / 2 - 8, 40, 16, 16, '#f2ead6'); R(g, W / 2 - 8, 40, 16, 16, '#3a2a1a'); R(g, W / 2 - 6, 42, 12, 12, '#f7f0dc');
    R(g, W / 2 - 1, 44, 2, 6, '#3a2a1a'); R(g, W / 2, 48, 5, 2, '#3a2a1a');
    // steep roof + spire
    for (var i = 0; i < 20; i++) { var rw = W - i * 2; R(g, (W - rw) / 2, 20 - i, rw, 1, i % 2 ? '#3a5f9a' : '#4a76b8'); }
    R(g, W / 2 - 1, -6, 2, 8, '#c8a86a'); R(g, W / 2 - 2, -8, 4, 3, '#ffd24b');
    return c;
  }

  /* ---------- props ---------- */
  function tree() { var [c, g] = make(TS, TS + 8); R(g, 7, TS + 2, 2, 6, '#7a5230'); R(g, 3, 2, 10, 12, '#357a40'); R(g, 4, 1, 8, 8, '#458f4c'); R(g, 5, 2, 3, 3, '#5aa658'); return c; }
  function lamp() { var [c, g] = make(8, 20); R(g, 3, 4, 2, 16, '#3a3340'); R(g, 2, 2, 4, 4, '#ffd98a'); R(g, 1, 1, 6, 1, '#2a2430'); return c; }
  function bench() { var [c, g] = make(TS, 8); R(g, 1, 2, 14, 2, '#8a5e34'); R(g, 1, 4, 14, 3, '#6a4626'); R(g, 2, 5, 2, 3, '#4a3018'); R(g, 12, 5, 2, 3, '#4a3018'); return c; }
  function flowers() { var [c, g] = make(TS, TS); R(g, 0, 0, TS, TS, '#4f9440'); ['#e05a6b', '#f2d24b', '#d64ba0', '#8f5ad0'].forEach(function (col, i) { R(g, 3 + i * 3, 6 + (i % 2) * 3, 2, 2, col); R(g, 3 + i * 3, 8 + (i % 2) * 3, 1, 2, '#3f8236'); }); return c; }
  function fountain() { var [c, g] = make(3 * TS, 3 * TS); var W = 3 * TS; R(g, 4, 10, W - 8, W - 14, '#b3a17a'); R(g, 7, 13, W - 14, W - 20, '#4aa6d8'); R(g, 10, 16, W - 20, W - 26, '#66b8e2'); R(g, W / 2 - 3, 6, 6, 20, '#cabb98'); R(g, W / 2 - 5, 2, 10, 6, '#8fd0ef'); return c; }
  var PROP = {};
  function bakeProps() { PROP.tree = tree(); PROP.lamp = lamp(); PROP.bench = bench(); PROP.flowers = flowers(); PROP.fountain = fountain(); }

  /* ---------- character (drawn each frame, 4 dirs + walk bob) ---------- */
  var SKIN = '#e8b48c', HAIR = '#4a3320', SHIRT = '#c14b3c', PANTS = '#3a3a48', SHOE = '#241a12';
  function drawChar(sx, sy, dir, step) {
    var s = SCALE, o = step ? 1 : 0;
    function p(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(sx + x * s, sy + y * s, w * s, h * s); }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx + 3 * s, sy + 19 * s, 10 * s, 3 * s);
    // legs
    p(4, 15 + o, 3, 4 - o, PANTS); p(9, 15 + (o ? 0 : 1), 3, 4 - (o ? 0 : 1), PANTS);
    p(4, 19, 3, 1, SHOE); p(9, 19, 3, 1, SHOE);
    // body
    p(3, 9, 10, 7, SHIRT); p(3, 9, 10, 2, '#a63b2e');
    // arms
    p(2, 9, 2, 5, SKIN); p(12, 9, 2, 5, SKIN);
    // head
    p(4, 2, 8, 8, SKIN);
    if (dir === 'up') { p(3, 1, 10, 6, HAIR); }
    else {
      p(3, 1, 10, 4, HAIR); p(3, 4, 2, 3, HAIR); p(11, 4, 2, 3, HAIR);
      if (dir === 'down') { p(6, 6, 1, 1, '#2a1a10'); p(9, 6, 1, 1, '#2a1a10'); }
      else if (dir === 'left') { p(5, 6, 1, 1, '#2a1a10'); p(4, 5, 1, 4, SKIN); }
      else { p(10, 6, 1, 1, '#2a1a10'); p(11, 5, 1, 4, SKIN); }
    }
  }

  /* ---------- world layout ---------- */
  var MW = 72, MH = 72, CX = 36, CY = 37;
  var ground = [];                        // 'g' grass, 'p' path, 'z' plaza
  var solid = [];                         // collision
  var objects = [];                       // drawables sorted by baseY
  var targets = [];                       // interactables

  function setG(x, y, t) { if (x >= 0 && y >= 0 && x < MW && y < MH) ground[y][x] = t; }
  for (var y = 0; y < MH; y++) { ground[y] = []; solid[y] = []; for (var x = 0; x < MW; x++) { ground[y][x] = 'g'; solid[y][x] = 0; } }

  // circular plaza + ring
  for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) {
    var d = Math.hypot(x - CX, y - CY);
    if (d < 8.5) ground[y][x] = 'z';
    else if (d < 10.5) ground[y][x] = 'p';         // ring road
  }

  // buildings around the ring, each a portfolio stop
  var SHOPS = [
    { ang: -90, roof: 0, key: 'pizza', href: '../pizza/', name: "Adam's Pizzeria", body: 'Three-day dough, baking steel, the works.' },
    { ang: -35, roof: 1, key: 'data', href: '../work/', name: 'MCAP Data Office', body: 'Where I move mortgage data for a living.' },
    { ang: 20, roof: 3, key: 'invest', href: '../investing/', name: 'The Bank', body: 'Chips and index funds, held for decades.' },
    { ang: 70, roof: 2, key: 'archive', href: '../#archive', name: 'The Workshop', body: 'Every other project I have built.' },
    { ang: 130, roof: 4, key: 'arcade', egg: 1, name: 'Arcade', kicker: 'Gaming', body: 'CS:GO, Overwatch, Minecraft. 999 hours in Pokemon X. (rewrite in your own words)' },
    { ang: 175, roof: 5, key: 'diner', egg: 1, name: 'The Diner', kicker: 'Cooking', body: 'Twenty recipes on TikTok. (rewrite)' },
    { ang: 235, roof: 1, key: 'studio', egg: 1, name: 'Code Studio', kicker: 'Coding', body: 'JavaScript, SQL, this town. (rewrite)' }
  ];
  var towerImg = towerSprite();
  var shopImgs = {};
  function placeBuildings() {
    // central clock tower
    var tw = 5, th = 12, tx = CX - 2, ty = CY - 5;
    objects.push({ img: towerImg, x: tx * TS, y: ty * TS, base: (ty + th) * TS });
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) solid[CY - 1 + j][CX - 1 + i] = 1;
    // fountain-ish plaza note: skip (tower is the centerpiece)

    SHOPS.forEach(function (sh, idx) {
      var wt = 5, ht = 6;
      var rr = 15;
      var a = sh.ang * Math.PI / 180;
      var bx = Math.round(CX + Math.cos(a) * rr) - (wt >> 1);
      var by = Math.round(CY + Math.sin(a) * rr) - (ht - 2);
      var img = shopSprite(wt, ht, PAL.roofs[sh.roof]); shopImgs[sh.key] = img;
      objects.push({ img: img, x: bx * TS, y: by * TS, base: (by + ht) * TS });
      // footprint solid (bottom 2 rows), leave the door tile walkable
      var doorX = bx + (wt >> 1), doorY = by + ht - 1;
      for (var ix = 0; ix < wt; ix++) for (var iy = ht - 2; iy < ht; iy++) { var gx = bx + ix, gy = by + iy; if (gx === doorX && gy === doorY) continue; if (gy >= 0 && gy < MH && gx >= 0 && gx < MW) solid[gy][gx] = 1; }
      // path from ring to the door
      var px = doorX, py0 = doorY + 1;
      for (var t = 0; t < rr; t++) { var gx2 = Math.round(CX + Math.cos(a) * (t)), gy2 = Math.round(CY + Math.sin(a) * (t)); if (ground[gy2] && ground[gy2][gx2] === 'g') ground[gy2][gx2] = 'p'; }
      setG(doorX, doorY + 1, 'p'); setG(doorX, doorY + 2, 'p');
      targets.push({ x: doorX, y: doorY + 1, key: sh.key, name: sh.name, kicker: sh.kicker || 'Shop', body: sh.body, href: sh.href, egg: sh.egg });
    });
  }

  // scatter trees / lamps / flowers / benches (avoid solids and plaza)
  var props = [];
  function scatterProps() {
    for (var i = 0; i < 90; i++) {
      var x = (Math.random() * MW) | 0, y = (Math.random() * MH) | 0;
      var d = Math.hypot(x - CX, y - CY);
      if (d < 11 || solid[y][x] || ground[y][x] !== 'g') continue;
      var r = Math.random();
      if (r < 0.5) { props.push({ img: PROP.tree, x: x * TS, y: y * TS - 8, base: y * TS + TS }); solid[y][x] = 1; }
      else if (r < 0.7) { ground[y][x] = 'f'; }
      else if (r < 0.85) { props.push({ img: PROP.lamp, x: x * TS + 4, y: y * TS - 4, base: y * TS + TS }); }
      else { props.push({ img: PROP.bench, x: x * TS, y: y * TS + 6, base: y * TS + TS }); }
    }
    // lamps ringing the plaza
    for (var a = 0; a < 360; a += 45) { var lx = Math.round(CX + Math.cos(a * Math.PI / 180) * 9.5), ly = Math.round(CY + Math.sin(a * Math.PI / 180) * 9.5); props.push({ img: PROP.lamp, x: lx * TS + 4, y: ly * TS - 4, base: ly * TS + TS }); }
  }

  /* ---------- character state ---------- */
  var ch = { x: CX * TS, y: (CY + 9) * TS, dir: 'up', moving: false, anim: 0, step: 0 };
  var SPD = 1.4;
  function tileSolid(px, py) { var tx = Math.floor(px / TS), ty = Math.floor(py / TS); if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true; return !!solid[ty][tx]; }
  function canMove(nx, ny) {
    // feet box
    var l = nx + 3, r = nx + 13, t = ny + 16, b = ny + 21;
    return !(tileSolid(l, t) || tileSolid(r, t) || tileSolid(l, b) || tileSolid(r, b));
  }

  /* ---------- interaction ---------- */
  var box = document.getElementById('box'), bK = document.getElementById('boxKicker'), bT = document.getElementById('boxTitle'), bB = document.getElementById('boxBody'), bC = document.getElementById('boxCta');
  var nearT = null;
  function refreshNear() {
    var ctx2 = { tx: Math.round(ch.x / TS), ty: Math.round((ch.y + 18) / TS) };
    var best = null;
    for (var i = 0; i < targets.length; i++) { var t = targets[i]; if (Math.abs(t.x - ctx2.tx) <= 1 && Math.abs(t.y - ctx2.ty) <= 1) { best = t; break; } }
    if (best === nearT) return;
    nearT = best;
    if (best) { bK.textContent = best.kicker; bT.textContent = best.name; bB.textContent = best.body; bC.textContent = best.egg ? '' : 'Press Space to enter'; box.classList.add('show'); }
    else box.classList.remove('show');
  }
  function act() { if (nearT && !nearT.egg && nearT.href) location.href = nearT.href; }

  /* ---------- input ---------- */
  var keys = {};
  function kd(k) { if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up'; if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down'; if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left'; if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right'; return null; }
  window.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); act(); return; } var d = kd(e.key); if (d) { keys[d] = 1; e.preventDefault(); } });
  window.addEventListener('keyup', function (e) { var d = kd(e.key); if (d) keys[d] = 0; });
  document.querySelectorAll('.pad button[data-dir]').forEach(function (b) { var d = b.dataset.dir; var on = function (e) { e.preventDefault(); keys[d] = 1; }; var off = function (e) { e.preventDefault(); keys[d] = 0; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); });
  var pa = document.getElementById('padA'); if (pa) pa.addEventListener('click', act);

  /* ---------- loop ---------- */
  function update() {
    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    ch.moving = !!(dx || dy);
    if (dy < 0) ch.dir = 'up'; else if (dy > 0) ch.dir = 'down'; else if (dx < 0) ch.dir = 'left'; else if (dx > 0) ch.dir = 'right';
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    if (dx) { var nx = ch.x + dx * SPD; if (canMove(nx, ch.y)) ch.x = nx; }
    if (dy) { var ny = ch.y + dy * SPD; if (canMove(ch.x, ny)) ch.y = ny; }
    if (ch.moving) { ch.anim += 0.18; ch.step = (Math.floor(ch.anim) % 2); } else ch.step = 0;
    refreshNear();
  }

  var TSS = TS * SCALE;
  function render() {
    var camX = Math.round(ch.x + 8 - cvs.width / (2 * SCALE));
    var camY = Math.round(ch.y + 10 - cvs.height / (2 * SCALE));
    ctx.fillStyle = '#3a6b3a'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    // ground
    var x0 = Math.floor(camX / TS) - 1, y0 = Math.floor(camY / TS) - 1;
    var xN = x0 + Math.ceil(cvs.width / TSS) + 2, yN = y0 + Math.ceil(cvs.height / TSS) + 2;
    for (var ty = y0; ty < yN; ty++) for (var tx = x0; tx < xN; tx++) {
      if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
      var t = ground[ty][tx], img = t === 'z' ? TILE.z : t === 'p' ? TILE.p : t === 'w' ? TILE.w : t === 'f' ? PROP.flowers : TILE.g;
      ctx.drawImage(img, (tx * TS - camX) * SCALE, (ty * TS - camY) * SCALE, TSS, TSS);
    }
    // y-sorted objects + character
    var draw = objects.concat(props);
    var charBase = ch.y + 20;
    draw.sort(function (a, b) { return a.base - b.base; });
    var placed = false;
    for (var i = 0; i < draw.length; i++) {
      if (!placed && draw[i].base > charBase) { drawChar((ch.x - camX) * SCALE, (ch.y - camY) * SCALE, ch.dir, ch.step); placed = true; }
      var o = draw[i]; ctx.drawImage(o.img, (o.x - camX) * SCALE, (o.y - camY) * SCALE, o.img.width * SCALE, o.img.height * SCALE);
    }
    if (!placed) drawChar((ch.x - camX) * SCALE, (ch.y - camY) * SCALE, ch.dir, ch.step);
  }

  function loop() { update(); render(); requestAnimationFrame(loop); }

  bakeTiles(); bakeProps(); placeBuildings(); scatterProps();
  loop();
})();
