/* Adam's Town: a walkable top-down pixel town rendered from a cozy
   RPG asset pack (generic houses, trees, terrain). A central plaza
   with shops around it, each a portfolio stop; walk with WASD/arrows,
   press Space at a door to enter, or at a curio to read a note. */
(function () {
  'use strict';

  var TS = 16, SCALE = 3, DS = TS * SCALE;
  var cvs = document.getElementById('game');
  var ctx = cvs.getContext('2d');
  function resize() { cvs.width = window.innerWidth; cvs.height = window.innerHeight; ctx.imageSmoothingEnabled = false; }
  window.addEventListener('resize', resize); resize();

  /* ---------- asset loading ---------- */
  var IMG = {};
  var manifest = { grass: 'assets/grass.png', sand: 'assets/sand.png', house1: 'assets/house1.png', house2: 'assets/house2.png', house3: 'assets/house3.png', house4: 'assets/house4.png', tree1: 'assets/tree1.png', tree2: 'assets/tree2.png' };
  var need = Object.keys(manifest).length + 1, got = 0, ready = false;
  function loaded() { if (++got >= need) ready = true; }
  Object.keys(manifest).forEach(function (k) { var im = new Image(); im.onload = loaded; im.src = manifest[k]; IMG[k] = im; });

  // dog sprite sheet, recolored white
  var DOGROW = { down: 3, left: 2, right: 1, up: 0 };
  var dogSheet = null, dogImg = new Image();      // Finn: sprite sheet drawn by Adam (finn-made-by-adam), sliced into a 96px 4x4 grid
  dogImg.onload = function () { dogSheet = dogImg; loaded(); };
  dogImg.src = 'dog-white.png';

  /* ---------- tiny procedural sprites (signs, curios) ---------- */
  function make(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
  function drawIcon(g, key, x, y) {
    switch (key) {
      case 'pizza': R(g, x + 2, y + 1, 8, 6, '#e7b34a'); R(g, x + 3, y + 2, 6, 4, '#c0453a'); R(g, x + 4, y + 3, 1, 1, '#7a241a'); R(g, x + 7, y + 3, 1, 1, '#7a241a'); R(g, x + 5, y + 4, 1, 1, '#7a241a'); break;
      case 'data': R(g, x + 1, y + 1, 10, 6, '#3a3340'); R(g, x + 2, y + 2, 8, 4, '#5aa0ff'); R(g, x + 5, y + 7, 2, 1, '#3a3340'); break;
      case 'invest': R(g, x + 3, y + 1, 6, 6, '#e7b34a'); R(g, x + 5, y + 2, 1, 4, '#8a6420'); R(g, x + 4, y + 2, 3, 1, '#8a6420'); R(g, x + 4, y + 4, 3, 1, '#8a6420'); break;
      case 'archive': R(g, x + 3, y + 1, 5, 2, '#9aa0ac'); R(g, x + 5, y + 2, 2, 5, '#7a5230'); break;
      case 'arcade': R(g, x + 2, y + 5, 8, 2, '#2a2430'); R(g, x + 5, y + 1, 1, 4, '#4a4658'); R(g, x + 4, y, 3, 2, '#e05a6b'); break;
      case 'diner': R(g, x + 2, y + 4, 8, 3, '#eef0f6'); R(g, x + 3, y + 1, 1, 3, '#c8a86a'); R(g, x + 4, y + 1, 1, 3, '#c8a86a'); break;
      case 'studio': R(g, x + 2, y + 3, 1, 1, '#57d97e'); R(g, x + 3, y + 2, 1, 1, '#57d97e'); R(g, x + 3, y + 4, 1, 1, '#57d97e'); R(g, x + 9, y + 3, 1, 1, '#57d97e'); R(g, x + 8, y + 2, 1, 1, '#57d97e'); R(g, x + 8, y + 4, 1, 1, '#57d97e'); R(g, x + 6, y + 1, 1, 5, '#ffcf3f'); break;
      default: R(g, x + 3, y + 2, 6, 4, '#c8a86a');
    }
  }
  function signSprite(key) { var r = make(TS, TS + 12), c = r[0], g = r[1]; R(g, 7, 10, 2, TS + 2, '#6a4626'); R(g, 6, 10, 1, TS + 2, '#7d5836'); R(g, 0, 0, 16, 12, '#4a3320'); R(g, 1, 1, 14, 10, '#c8a86a'); R(g, 1, 1, 14, 2, '#d8bd82'); drawIcon(g, key, 2, 2); return c; }
  function curioSprite(kind) {
    var r = make(TS, TS + 4), c = r[0], g = r[1]; R(g, 3, TS - 2, 10, 6, '#3a3340');
    if (kind === 'pc') { R(g, 2, 2, 12, 9, '#2a2430'); R(g, 3, 3, 10, 6, '#5aa0ff'); R(g, 3, 3, 10, 2, '#8fd0ef'); R(g, 6, 11, 4, 2, '#3a3340'); }
    else if (kind === 'books') { R(g, 3, 10, 10, 3, '#c15b5b'); R(g, 3, 7, 10, 3, '#5b7bc1'); R(g, 3, 4, 10, 3, '#5bc187'); }
    else if (kind === 'trophy') { R(g, 5, 2, 6, 5, '#e7b34a'); R(g, 4, 2, 1, 3, '#e7b34a'); R(g, 11, 2, 1, 3, '#e7b34a'); R(g, 7, 7, 2, 3, '#c8922e'); R(g, 5, 10, 6, 2, '#c8922e'); }
    else { R(g, 2, 4, 12, 8, '#2a2430'); R(g, 6, 6, 5, 5, '#5aa0ff'); R(g, 7, 7, 3, 3, '#1a2436'); R(g, 4, 3, 3, 2, '#3a3340'); }
    return c;
  }

  /* ---------- map ---------- */
  var MW = 64, MH = 64, CX = 32, CY = 33;
  var ground = [], solid = [], objects = [], targets = [];
  for (var y = 0; y < MH; y++) { ground[y] = []; solid[y] = []; for (var x = 0; x < MW; x++) { ground[y][x] = 'g'; solid[y][x] = 0; } }
  function setG(x, y, t) { if (x >= 0 && y >= 0 && x < MW && y < MH) ground[y][x] = t; }

  // plaza (sand) + ring
  for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) { var d = Math.hypot(x - CX, y - CY); if (d < 7.5) ground[y][x] = 's'; }

  // buildings: image, bottom-center door tile (bx,by), visual size, target
  var SHOPS = [
    ['house1', 27, 25, 5, 5, 'pizza', "Adam's Pizzeria", 'Countless hours have been spent researching how to make the best pizza, and the culmination of that work lives here!.', '../pizza/', 0],
    ['house2', 38, 25, 6, 6, 'data', 'MCAP', 'My workplace! I am a Data Analyst.', '../work/', 0],
    ['house3', 20, 34, 5, 5, 'invest', 'The Bank', 'My stock investments, mainly for personal use.', '../investing/', 0],
    ['house4', 46, 34, 6, 6, 'archive', 'The Workshop', 'Every other project I have built.', '../#archive', 0],
    ['house1', 25, 45, 5, 5, 'arcade', 'Game room', 'List of my favourite games of all time, how long I played them for, and a rating out of 10.', '', 1],
    ['house3', 44, 45, 5, 5, 'diner', 'The Scorch (Restaurant)', 'I wanted to be a chef as a kid, and chose this name to be the name of my restaurant. This houses all my recipes, including many from my TikTok.', '', 1],
    ['house2', 34, 47, 6, 6, 'studio', 'Computer Lab', 'The host of my nerdy interests including SQL, Python, JavaScript, automation, and more.', '', 1]
  ];
  SHOPS.forEach(function (s) {
    var img = s[0], bx = s[1], by = s[2], bw = s[3], bh = s[4];
    objects.push({ kind: 'building', img: img, bx: bx, by: by, bw: bw, bh: bh, base: (by + 1) * TS });
    // footprint solid (bottom 2 rows), door tile walkable
    for (var ix = -(bw >> 1); ix <= (bw >> 1); ix++) for (var iy = -1; iy <= 0; iy++) { var gx = bx + ix, gy = by + iy; if (gx === bx && gy === by) continue; if (gy >= 0 && gy < MH && gx >= 0 && gx < MW) solid[gy][gx] = 1; }
    // sand path from the door to the central plaza (radial spoke, 2 tiles wide)
    var px = bx, py = by + 1, guard = 0;
    while (Math.hypot(px - CX, py - CY) > 6.5 && guard++ < 60) {
      setG(px, py, 's'); setG(px + 1, py, 's');
      if (Math.abs(CY - py) >= Math.abs(CX - px)) py += Math.sign(CY - py) || 0;
      else px += Math.sign(CX - px) || 0;
    }
    objects.push({ kind: 'sign', img: signSprite(s[5]), x: (bx + 1) * TS + 4, y: by * TS - 4, base: (by + 1) * TS + 6 });
    targets.push({ x: bx, y: by + 1, key: s[5], name: s[6], body: s[7], href: s[8], egg: s[9], kicker: s[9] ? 'Curio' : 'Shop' });
  });

  // curios ringing the plaza
  [['pc', 45, 'placeholder', 'placeholder'],
   ['books', 135, 'placeholder', 'placeholder'],
   ['trophy', 225, 'placeholder', 'placeholder'],
   ['camera', 315, 'placeholder', 'placeholder']
  ].forEach(function (cu) {
    var a = cu[1] * Math.PI / 180, rr = 5, tx = Math.round(CX + Math.cos(a) * rr), ty = Math.round(CY + Math.sin(a) * rr);
    objects.push({ kind: 'curio', img: curioSprite(cu[0]), x: tx * TS, y: ty * TS - 4, base: ty * TS + TS });
    solid[ty][tx] = 1;
    targets.push({ x: tx, y: ty, key: 'egg-' + cu[0], kicker: cu[2], name: cu[3], body: cu[4], egg: 1 });
  });

  // seeded RNG so the world is identical on every load (no tree jitter on refresh)
  var _seed = 0x1a2b3c4d >>> 0;
  function rnd() { _seed = (_seed + 0x6d2b79f5) | 0; var t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

  // scattered trees (deterministic placement)
  for (var i = 0; i < 70; i++) {
    var tx = (rnd() * MW) | 0, ty = (rnd() * MH) | 0, dd = Math.hypot(tx - CX, ty - CY);
    if (dd < 10 || solid[ty][tx] || ground[ty][tx] !== 'g') continue;
    objects.push({ kind: 'tree', img: (i % 2 ? 'tree1' : 'tree2'), x: tx * TS, y: ty * TS, base: ty * TS + TS });
    solid[ty][tx] = 1;
  }

  /* ---------- character ---------- */
  var ch = { x: CX * TS, y: (CY + 9) * TS, dir: 'down', moving: false, anim: 0, frame: 0 };
  var SPD = 0.75;
  function tileSolid(px, py) { var tx = Math.floor(px / TS), ty = Math.floor(py / TS); if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true; return !!solid[ty][tx]; }
  function canMove(nx, ny) { var l = nx + 3, r = nx + 13, t = ny + 16, b = ny + 21; return !(tileSolid(l, t) || tileSolid(r, t) || tileSolid(l, b) || tileSolid(r, b)); }
  function drawChar(sx, sy, dir, frame) {
    var CELL = 96, D = 70, cx = sx + 8 * SCALE, feetY = sy + 18 * SCALE;
    if (!dogSheet) return;  // Finn's art (finn-made-by-adam) has its own baked shadow, so no drawn ellipse
    // snap to whole pixels so the sprite isn't resampled (blur) at sub-pixel positions
    var dx = Math.round(cx - D / 2), dy = Math.round(feetY - D * 0.9375);
    ctx.drawImage(dogSheet, frame * CELL, (DOGROW[dir] || 0) * CELL, CELL, CELL, dx, dy, D, D);
  }

  /* ---------- interaction ---------- */
  var box = document.getElementById('box'), bK = document.getElementById('boxKicker'), bT = document.getElementById('boxTitle'), bB = document.getElementById('boxBody'), bC = document.getElementById('boxCta');
  var nearT = null;
  function refreshNear() {
    var ptx = Math.round(ch.x / TS), pty = Math.round((ch.y + 18) / TS), best = null;
    for (var i = 0; i < targets.length; i++) { var t = targets[i]; if (Math.abs(t.x - ptx) <= 1 && Math.abs(t.y - pty) <= 1) { best = t; break; } }
    if (best === nearT) return;
    nearT = best;
    if (best) { bK.textContent = best.kicker; bT.textContent = best.name; bB.textContent = best.body; bC.textContent = best.egg ? '' : 'Press Space to enter'; box.classList.add('show'); }
    else box.classList.remove('show');
  }
  function act() { if (nearT && !nearT.egg && nearT.href) location.href = nearT.href === '' ? '../#archive' : nearT.href; }

  /* ---------- input ---------- */
  var keys = {};
  function kd(k) { if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up'; if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down'; if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left'; if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right'; return null; }
  window.addEventListener('keydown', function (e) { if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); act(); return; } var d = kd(e.key); if (d) { keys[d] = 1; e.preventDefault(); } });
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
    if (ch.moving) { ch.anim += 0.04; ch.frame = Math.floor(ch.anim) % 4; } else { ch.frame = 0; ch.anim = 0; }
    refreshNear();
  }
  function render() {
    var camX = Math.round(ch.x + 8 - cvs.width / (2 * SCALE)), camY = Math.round(ch.y + 10 - cvs.height / (2 * SCALE));
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#7bbf4c'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    if (!ready) return;
    var x0 = Math.floor(camX / TS) - 1, y0 = Math.floor(camY / TS) - 1;
    var xN = x0 + Math.ceil(cvs.width / DS) + 2, yN = y0 + Math.ceil(cvs.height / DS) + 2;
    for (var ty = y0; ty < yN; ty++) for (var tx = x0; tx < xN; tx++) {
      if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
      ctx.drawImage(ground[ty][tx] === 's' ? IMG.sand : IMG.grass, (tx * TS - camX) * SCALE, (ty * TS - camY) * SCALE, DS, DS);
    }
    var charBase = ch.y + 20, draw = objects.slice().sort(function (a, b) { return a.base - b.base; }), placed = false;
    for (var i = 0; i < draw.length; i++) {
      if (!placed && draw[i].base > charBase) { drawChar((ch.x - camX) * SCALE, (ch.y - camY) * SCALE, ch.dir, ch.frame); placed = true; }
      var o = draw[i];
      if (o.kind === 'building') {
        var wpx = o.bw * TS, hpx = o.bh * TS, left = o.bx * TS - wpx / 2, top = (o.by + 1) * TS - hpx;
        ctx.drawImage(IMG[o.img], (left - camX) * SCALE, (top - camY) * SCALE, wpx * SCALE, hpx * SCALE);
      } else if (o.kind === 'tree') {
        var tw = 2.4 * TS, th = 3.4 * TS;
        ctx.drawImage(IMG[o.img], (o.x + TS / 2 - tw / 2 - camX) * SCALE, (o.y + TS - th - camY) * SCALE, tw * SCALE, th * SCALE);
      } else {
        ctx.drawImage(o.img, (o.x - camX) * SCALE, (o.y - camY) * SCALE, o.img.width * SCALE, o.img.height * SCALE);
      }
    }
    if (!placed) drawChar((ch.x - camX) * SCALE, (ch.y - camY) * SCALE, ch.dir, ch.frame);
  }
  function loop() { update(); render(); requestAnimationFrame(loop); }
  loop();
})();
