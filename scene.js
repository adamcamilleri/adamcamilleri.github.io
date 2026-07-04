/* The landscape — an isometric SVG scene, vectr-style. White low-poly
   buildings on a pale ice-blue ground, a glowing beam flowing through,
   and four hoverable clusters that map to the site's sections:
     pizza   -> the bakery (oven chimney, smoke)
     data    -> the nightly-run plant (sawtooth roof, three smokestacks)
     invest  -> the market skyline (towers ascending like a bar chart)
     archive -> the workshop (billboard, containers)
   Hovering a building activates its step in the left list and vice
   versa. Click or Enter navigates. Idle motion (smoke, beam) respects
   prefers-reduced-motion. */
(function () {
  'use strict';

  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TOP = '#fbfdff', LEFT = '#eef4fa', RIGHT = '#d8e3ee';
  var SHADOW = 'rgba(70, 100, 135, 0.10)';
  var BEAM = '#43c8f5', BEAM_SOFT = '#9fe2fb', DOT = '#7cc9e8';

  function P(x, y, z) {
    return [800 + (x - y) * 0.866, 505 + (x + y) * 0.5 - z];
  }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pts(list) {
    return list.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
  }
  function face(parent, corners, fill) {
    return el('polygon', { points: pts(corners), fill: fill }, parent);
  }
  /* A box at plan position (x,y), footprint w×d, height h, base z0. */
  function box(parent, x, y, w, d, h, z0) {
    z0 = z0 || 0;
    face(parent, [P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x + w, y + d, z0), P(x + w, y, z0)], RIGHT);
    face(parent, [P(x, y + d, z0 + h), P(x + w, y + d, z0 + h), P(x + w, y + d, z0), P(x, y + d, z0)], LEFT);
    face(parent, [P(x, y, z0 + h), P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)], TOP);
  }
  function shadow(parent, x, y, w, d, grow) {
    var c = P(x + w / 2, y + d / 2, 0);
    var r = ((w + d) / 2) * 0.9 + (grow || 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: r, ry: r * 0.5, fill: SHADOW }, parent);
  }
  function smokeStack(parent, x, y, s, h) {
    box(parent, x, y, s, s, h);
    box(parent, x - 1.5, y - 1.5, s + 3, s + 3, 5, h);
    var top = P(x + s / 2, y + s / 2, h + 5);
    for (var i = 0; i < 3; i++) {
      var c = el('circle', {
        cx: top[0], cy: top[1] - 6, r: 4 + i * 2.4,
        fill: '#ffffff', opacity: reduced ? 0.35 : 0, 'class': 'smoke'
      }, parent);
      if (!reduced) c.style.animationDelay = (i * 1.3) + 's';
    }
  }
  function person(parent, x, y) {
    var c = P(x, y, 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: 6, ry: 3, fill: SHADOW }, parent);
    box(parent, x - 2.5, y - 2.5, 5, 5, 11);
    box(parent, x - 2, y - 2, 4, 4, 4.5, 12);
  }

  /* ---------- static scaffolding ---------- */
  var root = el('g', {}, svg);
  var deco = el('g', { 'aria-hidden': 'true' }, root);

  /* ground shadows (kept out of the lifting groups) */
  var shadows = el('g', { 'aria-hidden': 'true' }, deco);
  shadow(shadows, -280, -180, 110, 75, 8);   /* workshop */
  shadow(shadows, -50, -262, 46, 46, 6);     /* water tower */
  shadow(shadows, 122, -168, 176, 60, 10);   /* towers */
  shadow(shadows, -268, 58, 160, 92, 10);    /* bakery */
  shadow(shadows, 148, 62, 196, 82, 12);     /* plant */
  shadow(shadows, 372, -60, 64, 46, 4);      /* containers */

  /* ---------- the beam + halftone field ---------- */
  var beamPlan = [[-560, 150], [-300, 120], [-60, 55], [140, 95], [330, 115], [580, 85]];
  var beamPts = beamPlan.map(function (p) { return P(p[0], p[1], 2); });
  var samples = [];
  for (var b = 0; b < beamPlan.length - 1; b++) {
    for (var t = 0; t < 12; t++) {
      var u = t / 12;
      samples.push([
        beamPlan[b][0] + (beamPlan[b + 1][0] - beamPlan[b][0]) * u,
        beamPlan[b][1] + (beamPlan[b + 1][1] - beamPlan[b][1]) * u
      ]);
    }
  }
  var dots = el('g', { 'aria-hidden': 'true' }, deco);
  for (var gx = -170; gx <= 320; gx += 26) {
    for (var gy = -30; gy <= 200; gy += 26) {
      var best = 1e9;
      for (var si = 0; si < samples.length; si++) {
        var dx = gx - samples[si][0], dy = gy - samples[si][1];
        var dd = dx * dx + dy * dy;
        if (dd < best) best = dd;
      }
      var dist = Math.sqrt(best);
      if (dist < 95) {
        var r = 3.4 * (1 - dist / 95);
        if (r > 0.5) {
          var dp = P(gx, gy, 0);
          el('circle', { cx: dp[0], cy: dp[1], r: r.toFixed(2), fill: DOT, opacity: 0.55 }, dots);
        }
      }
    }
  }
  el('polyline', { points: pts(beamPts), fill: 'none', stroke: BEAM_SOFT, 'stroke-width': 14, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.35 }, deco);
  el('polyline', { points: pts(beamPts), fill: 'none', stroke: BEAM, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.9 }, deco);
  var flow = el('polyline', { points: pts(beamPts), fill: 'none', stroke: '#ffffff', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.8, 'class': 'beam-flow' }, deco);
  if (reduced) flow.remove();

  /* ---------- decorative structures ---------- */
  var backDeco = el('g', { 'aria-hidden': 'true' }, root);
  /* water tower */
  box(backDeco, -46, -258, 6, 6, 34);
  box(backDeco, -14, -258, 6, 6, 34);
  box(backDeco, -46, -226, 6, 6, 34);
  box(backDeco, -14, -226, 6, 6, 34);
  box(backDeco, -50, -262, 46, 46, 26, 34);
  box(backDeco, -42, -254, 30, 30, 6, 60);
  /* pallets near the bakery */
  box(backDeco, -320, 170, 26, 20, 6);
  box(backDeco, -318, 172, 22, 16, 6, 6);
  box(backDeco, -286, 182, 26, 20, 6);

  /* ---------- hoverable clusters ---------- */
  function cluster(key, label, href) {
    var g = el('g', { 'class': 'hotspot', tabindex: '0', role: 'link', 'aria-label': label, 'data-key': key }, root);
    g.dataset.href = href;
    return g;
  }

  /* 04 · workshop (projects archive) */
  var gArch = cluster('archive', 'The workshop: cookbook and project archive', '#archive');
  box(gArch, -280, -180, 100, 70, 34);
  box(gArch, -272, -174, 30, 24, 10, 34);            /* roof unit */
  box(gArch, -190, -186, 5, 5, 46);                  /* billboard post */
  box(gArch, -206, -188, 38, 4, 22, 40);             /* billboard panel */
  box(gArch, -238, -196, 18, 14, 12);                /* crate */

  /* 03 · market skyline (investing) */
  var gInv = cluster('invest', 'The market skyline: The Long Position, feature 03', 'investing/');
  box(gInv, 122, -168, 44, 44, 52);
  box(gInv, 182, -158, 44, 44, 88);
  box(gInv, 242, -148, 44, 44, 128);
  box(gInv, 252, -138, 24, 24, 8, 128);              /* penthouse */
  box(gInv, 262, -128, 4, 4, 26, 136);               /* antenna */

  /* 01 · bakery (pizza) */
  var gPza = cluster('pizza', 'The bakery: The 72-Hour Pie, feature 01', 'pizza/');
  box(gPza, -268, 58, 110, 82, 42);
  box(gPza, -258, 66, 26, 20, 8, 42);                /* roof vent */
  /* the oven: stepped dome + chimney */
  box(gPza, -148, 78, 52, 52, 26);
  box(gPza, -140, 86, 36, 36, 12, 26);
  box(gPza, -132, 94, 20, 20, 8, 38);
  smokeStack(gPza, -122, 60, 12, 64);

  /* 02 · the nightly-run plant (data) */
  var gDat = cluster('data', 'The plant: The Nightly Run, feature 02', 'work/');
  box(gDat, 148, 62, 150, 82, 38);
  box(gDat, 156, 68, 22, 18, 9, 38);                 /* sawtooth roof units */
  box(gDat, 192, 68, 22, 18, 9, 38);
  box(gDat, 228, 68, 22, 18, 9, 38);
  box(gDat, 264, 68, 22, 18, 9, 38);
  smokeStack(gDat, 306, 70, 13, 78);
  smokeStack(gDat, 306, 100, 13, 90);
  smokeStack(gDat, 306, 130, 13, 70);

  /* containers, front right */
  var frontDeco = el('g', { 'aria-hidden': 'true' }, root);
  box(frontDeco, 372, -60, 30, 20, 12);
  box(frontDeco, 372, -36, 30, 20, 12);
  box(frontDeco, 374, -58, 26, 16, 10, 12);
  person(frontDeco, -60, 130);
  person(frontDeco, 90, 40);
  person(frontDeco, 210, 150);

  /* ---------- interaction: scene <-> steps ---------- */
  var steps = document.querySelectorAll('.scene-steps .step');
  var spots = svg.querySelectorAll('.hotspot');

  function setActive(key) {
    steps.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
    spots.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
  }

  spots.forEach(function (g) {
    g.addEventListener('mouseenter', function () { setActive(g.dataset.key); });
    g.addEventListener('focus', function () { setActive(g.dataset.key); });
    g.addEventListener('click', function () { window.location.href = g.dataset.href; });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = g.dataset.href; }
    });
  });
  steps.forEach(function (s) {
    s.addEventListener('mouseenter', function () { setActive(s.dataset.key); });
    s.addEventListener('focus', function () { setActive(s.dataset.key); });
  });

  setActive('pizza');

  /* gentle pointer parallax on the whole scene */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * -14;
      ty = (e.clientY / window.innerHeight - 0.5) * -8;
      if (!raf) raf = requestAnimationFrame(drift);
    }, { passive: true });
    function drift() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      root.setAttribute('transform', 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')');
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(drift) : null;
    }
  }
})();
