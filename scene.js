/* The city: a free-roam isometric world. Drag in any direction to pan
   (with inertia), arrow keys pan when the map is focused, and the step
   list flies the camera to each neighborhood. Buildings navigate on
   click; a drag over a building never counts as a click.
     pizza   -> pizzeria block: striped awning, round pizza sign, smoking oven
     data    -> office district: MCAP sign, one lit window, parking lot
     invest  -> financial district: columned exchange, market-green chart
     archive -> workshop yard: garage, shed, containers, mast
   Project placeholders are scattered near fitting neighborhoods and
   clickable whenever they are on screen. Reduced motion gets a static
   fitted view of the whole city. */
(function () {
  'use strict';

  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TOP = '#fbfdff', LEFTF = '#eef4fa', RIGHTF = '#d8e3ee';
  var WIN_R = '#b9c9da', WIN_L = '#cfdde9';
  var PAD = '#cbdeea', POND = '#b7d8ea';
  var SHADOW = 'rgba(70, 100, 135, 0.10)';
  var BEAM = '#43c8f5', BEAM_SOFT = '#9fe2fb', DOT = '#7cc9e8';
  var GREEN = '#35a06b';                 /* the market, up and to the right */
  var LAMP = '#ffca3a';                  /* the one office light still on */
  var MCAP_NAVY = '#23306E', MCAP_GRAY = '#A7ABB4';

  function P(x, y, z) {
    return [(x - y) * 0.866, (x + y) * 0.5 - z];
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
  function box(parent, x, y, w, d, h, z0) {
    z0 = z0 || 0;
    face(parent, [P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x + w, y + d, z0), P(x + w, y, z0)], RIGHTF);
    face(parent, [P(x, y + d, z0 + h), P(x + w, y + d, z0 + h), P(x + w, y + d, z0), P(x, y + d, z0)], LEFTF);
    face(parent, [P(x, y, z0 + h), P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)], TOP);
  }
  function wedge(parent, x, y, w, d, h, z0) {
    z0 = z0 || 0;
    var r1 = P(x, y + d / 2, z0 + h), r2 = P(x + w, y + d / 2, z0 + h);
    face(parent, [P(x + w, y, z0), P(x + w, y + d, z0), r2], RIGHTF);
    face(parent, [P(x, y, z0), P(x + w, y, z0), r2, r1], TOP);
    face(parent, [P(x, y + d, z0), P(x + w, y + d, z0), r2, r1], LEFTF);
  }
  function pad(parent, x, y, w, d, fill) {
    face(parent, [P(x, y, 0.4), P(x + w, y, 0.4), P(x + w, y + d, 0.4), P(x, y + d, 0.4)], fill || PAD);
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
  function house(parent, x, y, w, d, h) {
    box(parent, x, y, w, d, h);
    wedge(parent, x - 2, y - 2, w + 4, d + 4, h * 0.45, h);
  }
  function car(parent, x, y) {
    box(parent, x, y, 17, 9, 5);
    box(parent, x + 3.5, y + 1, 9, 7, 4, 5);
  }
  function umbrella(parent, x, y) {
    box(parent, x - 1.5, y - 1.5, 3, 3, 17);
    var c = P(x, y, 19);
    el('ellipse', { cx: c[0], cy: c[1], rx: 13, ry: 6.5, fill: '#fbfdff' }, parent);
    el('ellipse', { cx: c[0], cy: c[1], rx: 13, ry: 6.5, fill: 'none', stroke: '#d8e3ee', 'stroke-width': 1 }, parent);
  }
  function streetlight(parent, x, y) {
    box(parent, x - 1.5, y - 1.5, 3, 3, 26);
    var c = P(x, y, 28);
    el('circle', { cx: c[0], cy: c[1], r: 5, fill: LAMP, opacity: 0.25 }, parent);
    el('circle', { cx: c[0], cy: c[1], r: 2.2, fill: LAMP }, parent);
  }
  function pond(parent, x, y, rx, ry) {
    var c = P(x, y, 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: rx + 4, ry: (rx + 4) * 0.5, fill: PAD }, parent);
    el('ellipse', { cx: c[0], cy: c[1], rx: rx, ry: rx * 0.5, fill: POND }, parent);
  }
  /* lit: null, or { side: 'front' | 'right', index: n, color: '#hex' } */
  function windows(parent, x, y, w, d, h, z0, lit) {
    var idxR = 0, idxF = 0;
    for (var z = z0 + 10; z < z0 + h - 8; z += 14) {
      for (var a = 6; a < d - 8; a += 14) {
        var fillR = (lit && lit.side === 'right' && idxR === lit.index) ? lit.color : WIN_R;
        face(parent, [P(x + w, y + a, z + 8), P(x + w, y + a + 8, z + 8), P(x + w, y + a + 8, z), P(x + w, y + a, z)], fillR);
        idxR++;
      }
      for (var b = 6; b < w - 8; b += 14) {
        var fillF = (lit && lit.side === 'front' && idxF === lit.index) ? lit.color : WIN_L;
        face(parent, [P(x + b, y + d, z + 8), P(x + b + 8, y + d, z + 8), P(x + b + 8, y + d, z), P(x + b, y + d, z)], fillF);
        idxF++;
      }
    }
  }

  /* the MCAP hexagon: navy upper-left + lower-right, gray upper-right +
     lower-left, white diamond through the middle */
  function mcapSign(parent, cx, cy, r) {
    var T = [cx, cy - r], B = [cx, cy + r];
    var TL = [cx - r * 0.866, cy - r * 0.5], TR = [cx + r * 0.866, cy - r * 0.5];
    var BL = [cx - r * 0.866, cy + r * 0.5], BR = [cx + r * 0.866, cy + r * 0.5];
    var ML = [cx - r * 0.866, cy], MR = [cx + r * 0.866, cy];
    var L = [cx - r * 0.4, cy], R = [cx + r * 0.4, cy];
    face(parent, [T, TL, ML, L], MCAP_NAVY);
    face(parent, [MR, BR, B, R], MCAP_NAVY);
    face(parent, [T, TR, MR, R], MCAP_GRAY);
    face(parent, [ML, BL, B, L], MCAP_GRAY);
  }

  /* ============================================================
     THE CITY
     ============================================================ */
  var root = el('g', {}, svg);
  var world = el('g', {}, root);

  var ANCHORS = {
    pizza: [-750, 205],
    data: [-140, 55],
    invest: [480, -105],
    archive: [1030, -290]
  };

  var beamPlan = [
    [-950, 300], [-800, 260], [-650, 215], [-500, 170], [-350, 125],
    [-200, 80], [-50, 30], [100, -15], [250, -55], [400, -95],
    [550, -135], [700, -175], [850, -215], [1000, -255], [1180, -305]
  ];

  /* ---------- ground layer ---------- */
  var ground = el('g', { 'aria-hidden': 'true' }, world);

  function popGroup(parent, appear) {
    var g = el('g', { 'aria-hidden': 'true', 'class': 'pop' }, parent);
    g.dataset.appear = appear;
    return g;
  }

  /* plazas */
  pad(popGroup(ground, 0), -880, 130, 300, 190);
  pad(popGroup(ground, 0.2), -260, -30, 290, 190);
  pad(popGroup(ground, 0.4), 320, -230, 320, 200);
  pad(popGroup(ground, 0.6), 900, -370, 300, 190);

  /* shadows pop with their structures */
  [
    [-830, 170, 150, 95, 10, 0],
    [-660, 190, 80, 60, 6, 0],
    [-855, 90, 60, 50, 5, 0],
    [-190, 10, 120, 95, 12, 0.2],
    [-70, 40, 60, 60, 8, 0.2],
    [80, -80, 46, 46, 6, 0.3],
    [420, -150, 170, 95, 10, 0.4],
    [380, -215, 50, 50, 6, 0.4],
    [560, -230, 54, 54, 8, 0.4],
    [980, -330, 120, 80, 10, 0.6],
    [1110, -280, 55, 45, 6, 0.6],
    [-470, 130, 60, 50, 5, 0.1],
    [190, -30, 60, 50, 5, 0.3],
    [760, -220, 60, 50, 5, 0.5]
  ].forEach(function (s) {
    shadow(popGroup(ground, s[5]), s[0], s[1], s[2], s[3], s[4]);
  });

  /* halftone dots hugging the beam */
  var samples = [];
  for (var b = 0; b < beamPlan.length - 1; b++) {
    for (var t = 0; t < 6; t++) {
      var u = t / 6;
      samples.push([
        beamPlan[b][0] + (beamPlan[b + 1][0] - beamPlan[b][0]) * u,
        beamPlan[b][1] + (beamPlan[b + 1][1] - beamPlan[b][1]) * u
      ]);
    }
  }
  for (var gx = -930; gx <= 1160; gx += 32) {
    for (var gy = -320; gy <= 320; gy += 32) {
      var best = 1e9;
      for (var si = 0; si < samples.length; si++) {
        var ddx = gx - samples[si][0], ddy = gy - samples[si][1];
        var dd = ddx * ddx + ddy * ddy;
        if (dd < best) best = dd;
      }
      var dist = Math.sqrt(best);
      if (dist < 85) {
        var r = 3.2 * (1 - dist / 85);
        if (r > 0.5) {
          var dp = P(gx, gy, 0);
          el('circle', { cx: dp[0], cy: dp[1], r: r.toFixed(2), fill: DOT, opacity: 0.5 }, ground);
        }
      }
    }
  }

  /* the beam: fully drawn, with a slow marching-light overlay */
  var beamPts = beamPlan.map(function (p) { return P(p[0], p[1], 2); });
  el('polyline', { points: pts(beamPts), fill: 'none', stroke: BEAM_SOFT, 'stroke-width': 14, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.3 }, ground);
  el('polyline', { points: pts(beamPts), fill: 'none', stroke: BEAM, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.9 }, ground);
  if (!reduced) {
    el('polyline', { points: pts(beamPts), fill: 'none', stroke: '#ffffff', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.8, 'class': 'beam-flow' }, ground);
  }

  /* ---------- far filler (drawn early, sits behind) ---------- */
  var dFar = popGroup(world, 0.15);
  pond(dFar, -380, -140, 46);
  house(dFar, -560, -40, 55, 45, 22);
  box(dFar, -60, -190, 40, 40, 56);
  windows(dFar, -60, -190, 40, 40, 56, 0, null);
  box(dFar, 10, -155, 34, 34, 40);
  streetlight(dFar, -500, 80);
  streetlight(dFar, -80, -40);
  streetlight(dFar, 520, -180);
  person(dFar, -420, -100);

  /* ---------- pizzeria block ---------- */
  var nPza = popGroup(world, 0);
  house(nPza, -855, 90, 60, 50, 22);
  box(nPza, -660, 190, 80, 60, 26);
  box(nPza, -652, 196, 22, 16, 7, 26);
  box(nPza, -905, 210, 26, 20, 6);
  box(nPza, -903, 212, 22, 16, 6, 6);
  umbrella(nPza, -690, 145);
  umbrella(nPza, -655, 128);
  person(nPza, -700, 170);
  person(nPza, -600, 230);

  function cluster(key, label, href, appear) {
    var g = el('g', { 'class': 'hotspot pop', tabindex: '0', role: 'link', 'aria-label': label, 'data-key': key }, world);
    g.dataset.href = href;
    g.dataset.appear = appear;
    return g;
  }

  var gPza = cluster('pizza', 'The pizzeria: how I make pizza', 'pizza/', 0);
  box(gPza, -830, 170, 110, 76, 34);
  (function () {
    var ax = -830, ay = 246, aw = 110;
    for (var s = 0; s < 10; s++) {
      var x0 = ax + (aw / 10) * s, x1 = ax + (aw / 10) * (s + 1);
      face(gPza, [P(x0, ay, 26), P(x1, ay, 26), P(x1, ay + 12, 20), P(x0, ay + 12, 20)],
        s % 2 ? '#e2695c' : '#fbfdff');
    }
  })();
  box(gPza, -820, 178, 24, 18, 8, 34);
  box(gPza, -708, 178, 50, 50, 24);
  box(gPza, -700, 186, 34, 34, 11, 24);
  box(gPza, -692, 194, 18, 18, 7, 35);
  smokeStack(gPza, -682, 162, 12, 58);
  (function () {
    box(gPza, -850, 238, 5, 5, 48);
    var c = P(-847.5, 240.5, 60);
    el('circle', { cx: c[0], cy: c[1], r: 21, fill: '#ecc27f' }, gPza);
    el('circle', { cx: c[0], cy: c[1], r: 16, fill: '#e2695c' }, gPza);
    [[-7, -4], [5, -8], [7, 5], [-4, 7]].forEach(function (o) {
      el('circle', { cx: c[0] + o[0], cy: c[1] + o[1], r: 2.6, fill: '#a63d33' }, gPza);
    });
    el('path', { d: 'M' + c[0] + ' ' + c[1] + ' L' + (c[0] + 6) + ' ' + (c[1] - 21) + ' A21 21 0 0 1 ' + (c[0] + 16) + ' ' + (c[1] - 13) + ' Z', fill: '#fbfdff' }, gPza);
  })();

  /* ---------- route filler ---------- */
  var f1 = popGroup(world, 0.1);
  house(f1, -470, 130, 60, 50, 22);
  box(f1, -395, 165, 18, 14, 10);
  person(f1, -420, 200);
  streetlight(f1, -300, 170);

  /* ---------- office district ---------- */
  var nDat = popGroup(world, 0.2);
  box(nDat, -70, 40, 50, 50, 78);
  windows(nDat, -70, 40, 50, 50, 78, 0, null);
  pad(nDat, -240, 120, 130, 70);
  car(nDat, -228, 132);
  car(nDat, -200, 146);
  car(nDat, -172, 160);
  person(nDat, -110, 130);
  person(nDat, -30, 110);

  var gDat = cluster('data', 'The office: what I do for a living', 'work/', 0.2);
  box(gDat, -190, 10, 66, 66, 132);
  windows(gDat, -190, 10, 66, 66, 132, 0, { side: 'front', index: 22, color: LAMP });
  box(gDat, -188, 12, 20, 14, 8, 132);
  box(gDat, -156, 40, 4, 4, 26, 132);
  box(gDat, -190, 76, 42, 30, 34);
  box(gDat, -176, 76, 22, 8, 10);
  (function () {
    /* MCAP sign: a white panel slab proud of the facade */
    box(gDat, -186, 76, 58, 3, 26, 104);
    face(gDat, [P(-186, 79, 130), P(-128, 79, 130), P(-128, 79, 104), P(-186, 79, 104)], '#ffffff');
    var c = P(-157, 79, 117);
    mcapSign(gDat, c[0], c[1], 10);
  })();

  /* ---------- mid filler ---------- */
  var f2 = popGroup(world, 0.3);
  box(f2, 84, -76, 6, 6, 34);
  box(f2, 116, -76, 6, 6, 34);
  box(f2, 84, -44, 6, 6, 34);
  box(f2, 116, -44, 6, 6, 34);
  box(f2, 80, -80, 46, 46, 26, 34);
  box(f2, 88, -72, 30, 30, 6, 60);
  house(f2, 190, -30, 60, 50, 22);
  house(f2, -20, 190, 55, 45, 20);
  streetlight(f2, 200, 30);
  person(f2, 150, 20);
  person(f2, 260, -60);

  /* ---------- financial district ---------- */
  var nInv = popGroup(world, 0.4);
  box(nInv, 380, -215, 50, 50, 66);
  windows(nInv, 380, -215, 50, 50, 66, 0, null);
  box(nInv, 560, -230, 54, 54, 92);
  windows(nInv, 560, -230, 54, 54, 92, 0, null);
  house(nInv, 420, 120, 55, 45, 20);
  person(nInv, 480, -60);
  person(nInv, 560, -110);

  var gInv = cluster('invest', 'The exchange: how I invest', 'investing/', 0.4);
  box(gInv, 420, -150, 120, 84, 8);
  box(gInv, 432, -142, 96, 62, 34, 8);
  for (var col = 0; col < 6; col++) {
    box(gInv, 428 + col * 19, -75, 7, 7, 36, 8);
  }
  box(gInv, 418, -152, 124, 88, 7, 44);
  wedge(gInv, 418, -152, 124, 88, 22, 51);
  (function () {
    box(gInv, 529, -109, 3, 3, 16, 73);
    var f = P(530.5, -107.5, 87);
    face(gInv, [f, [f[0] + 15, f[1] + 4], [f[0] + 2, f[1] + 8]], GREEN);
  })();
  (function () {
    var bx = 562, by = -105, tops = [];
    [12, 22, 34, 50, 68].forEach(function (h, i) {
      box(gInv, bx + i * 20, by - i * 8, 14, 14, h);
      face(gInv, [P(bx + i * 20, by - i * 8, h + 2.5), P(bx + i * 20 + 14, by - i * 8, h + 2.5), P(bx + i * 20 + 14, by - i * 8 + 14, h + 2.5), P(bx + i * 20, by - i * 8 + 14, h + 2.5)], GREEN);
      tops.push(P(bx + i * 20 + 7, by - i * 8 + 7, h + 5));
    });
    el('polyline', { points: pts(tops), fill: 'none', stroke: GREEN, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gInv);
    var last = tops[tops.length - 1], prev = tops[tops.length - 2];
    var ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    el('polygon', {
      points: pts([[last[0] + Math.cos(ang) * 10, last[1] + Math.sin(ang) * 10],
        [last[0] + Math.cos(ang + 2.5) * 7, last[1] + Math.sin(ang + 2.5) * 7],
        [last[0] + Math.cos(ang - 2.5) * 7, last[1] + Math.sin(ang - 2.5) * 7]]),
      fill: GREEN
    }, gInv);
  })();

  /* ---------- outer filler ---------- */
  var f3 = popGroup(world, 0.5);
  house(f3, 760, -220, 60, 50, 22);
  house(f3, 620, -280, 50, 42, 18);
  box(f3, 840, -180, 30, 20, 12);
  box(f3, 842, -178, 26, 16, 10, 12);
  person(f3, 800, -150);

  /* ---------- workshop yard ---------- */
  var nArc = popGroup(world, 0.6);
  house(nArc, 1110, -280, 55, 45, 20);
  box(nArc, 940, -390, 30, 20, 12);
  box(nArc, 940, -366, 30, 20, 12);
  box(nArc, 942, -388, 26, 16, 10, 12);
  box(nArc, 1150, -370, 5, 5, 44);
  box(nArc, 1136, -372, 34, 4, 3, 30);
  person(nArc, 1060, -240);

  var gArch = cluster('archive', 'The workshop: everything else I build', '#archive', 0.6);
  box(gArch, 980, -330, 104, 72, 34);
  wedge(gArch, 976, -334, 112, 80, 18, 34);
  face(gArch, [P(1000, -258, 24), P(1042, -258, 24), P(1042, -258, 0), P(1000, -258, 0)], '#c3d2e0');
  face(gArch, [P(1000, -258, 20), P(1042, -258, 20), P(1042, -258, 18), P(1000, -258, 18)], '#aebfd0');
  face(gArch, [P(1000, -258, 12), P(1042, -258, 12), P(1042, -258, 10), P(1000, -258, 10)], '#aebfd0');
  box(gArch, 1092, -336, 5, 5, 42);
  box(gArch, 1076, -338, 40, 4, 20, 38);
  box(gArch, 990, -352, 18, 14, 12);
  box(gArch, 1012, -356, 14, 12, 9);

  /* front-of-scene filler */
  var f4 = popGroup(world, 0.7);
  house(f4, 940, -60, 55, 45, 20);
  person(f4, 900, -20);

  /* ---------- project placeholders ----------
     PLACEHOLDER OBJECTS scattered around the map, one per project,
     clickable whenever they are on screen. Plinth + plain cube until
     Adam picks a real object per project: swap the two box() calls at
     a call site and the wiring keeps working. */
  function projectSpot(key, label, href, x, y, appear) {
    var g = cluster(key, label + ' (project)', href, appear);
    var c = P(x, y, 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: 22, ry: 11, fill: SHADOW }, g);
    box(g, x - 12, y - 12, 24, 24, 6);
    box(g, x - 7, y - 7, 14, 14, 14, 6);
    var t = el('text', {
      x: c[0], y: c[1] - 48,
      'text-anchor': 'middle',
      'class': 'spot-label'
    }, g);
    t.textContent = label;
    return g;
  }
  projectSpot('proj-cookbook', "Adam's Cookbook", 'projects/adams-cookbook/', -640, 90, 0.1);
  projectSpot('proj-handoff', 'Handoff', 'projects/handoff/', -260, -80, 0.2);
  projectSpot('proj-housing', 'Housing Dashboard', 'projects/housing-dashboard/', 300, 60, 0.4);
  projectSpot('proj-songdle', 'Songdle', 'projects/songdle/', 760, -300, 0.5);

  /* ============================================================
     FREE-ROAM CAMERA
     ============================================================ */
  var steps = document.querySelectorAll('.scene-steps .step');
  var spots = svg.querySelectorAll('.hotspot');
  var pops = world.querySelectorAll('.pop');

  var VIEW = [800, 460];
  var camX = 0, camY = 0;             /* current camera center, world px */
  var targetX = 0, targetY = 0;       /* eased toward when flying */
  var flying = false;
  var vx = 0, vy = 0;                 /* inertia */
  var dragging = false;
  var dragDist = 0;
  var lastPX = 0, lastPY = 0;

  var xs = beamPts.map(function (p) { return p[0]; });
  var ys = beamPts.map(function (p) { return p[1]; });
  var MINX = Math.min.apply(null, xs) - 220, MAXX = Math.max.apply(null, xs) + 220;
  var MINY = Math.min.apply(null, ys) - 320, MAXY = Math.max.apply(null, ys) + 240;

  function clampCam() {
    camX = Math.max(MINX, Math.min(MAXX, camX));
    camY = Math.max(MINY, Math.min(MAXY, camY));
  }
  function anchorPoint(key) {
    var a = ANCHORS[key];
    return P(a[0], a[1], 0);
  }

  var hoverKey = null;
  var nearKey = 'pizza';

  function paint() {
    var key = hoverKey || nearKey;
    steps.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
    spots.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
  }

  function nearestAnchor() {
    var bestKey = 'pizza', bestD = 1e12;
    for (var k in ANCHORS) {
      var p = anchorPoint(k);
      var dx = p[0] - camX, dy = p[1] - camY;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; bestKey = k; }
    }
    return bestKey;
  }

  function render() {
    root.setAttribute('transform',
      'translate(' + (VIEW[0] - camX).toFixed(2) + ' ' + (VIEW[1] - camY).toFixed(2) + ')');
  }

  function frame() {
    var moved = false;
    if (flying) {
      camX += (targetX - camX) * 0.08;
      camY += (targetY - camY) * 0.08;
      if (Math.abs(targetX - camX) + Math.abs(targetY - camY) < 0.6) flying = false;
      moved = true;
    } else if (!dragging && (Math.abs(vx) > 0.08 || Math.abs(vy) > 0.08)) {
      camX -= vx; camY -= vy;
      vx *= 0.94; vy *= 0.94;
      moved = true;
    }
    if (moved) {
      clampCam();
      render();
      var k = nearestAnchor();
      if (k !== nearKey) { nearKey = k; paint(); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- interactions ---------- */
  spots.forEach(function (g) {
    g.addEventListener('mouseenter', function () { hoverKey = g.dataset.key; paint(); });
    g.addEventListener('mouseleave', function () { hoverKey = null; paint(); });
    g.addEventListener('focus', function () { hoverKey = g.dataset.key; paint(); });
    g.addEventListener('blur', function () { hoverKey = null; paint(); });
    g.addEventListener('click', function () {
      if (dragDist > 6) return;       /* it was a pan, not a click */
      window.location.href = g.dataset.href;
    });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = g.dataset.href; }
    });
  });

  /* step click flies the camera there; a second click (already active
     and centered) follows the link */
  steps.forEach(function (s) {
    s.addEventListener('mouseenter', function () { hoverKey = s.dataset.key; paint(); });
    s.addEventListener('mouseleave', function () { hoverKey = null; paint(); });
    s.addEventListener('focus', function () { hoverKey = s.dataset.key; paint(); });
    s.addEventListener('blur', function () { hoverKey = null; paint(); });
    s.addEventListener('click', function (e) {
      var key = s.dataset.key;
      if (nearKey !== key || flying) {
        e.preventDefault();
        var p = anchorPoint(key);
        targetX = p[0]; targetY = p[1];
        flying = true;
        hoverKey = null;
        nearKey = key;
        paint();
      }
      /* else: already here, let the link navigate */
    });
  });

  if (!reduced) {
    svg.style.cursor = 'grab';
    svg.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      flying = false;
      dragDist = 0;
      vx = 0; vy = 0;
      lastPX = e.clientX; lastPY = e.clientY;
      svg.setPointerCapture(e.pointerId);
      svg.style.cursor = 'grabbing';
    });
    svg.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastPX, dy = e.clientY - lastPY;
      lastPX = e.clientX; lastPY = e.clientY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      /* svg viewBox units vs CSS px: scale by viewBox width over element width */
      var scale = 1600 / svg.getBoundingClientRect().width;
      camX -= dx * scale; camY -= dy * scale;
      vx = dx * scale; vy = dy * scale;
      clampCam();
      render();
    });
    var endDrag = function () {
      dragging = false;
      svg.style.cursor = 'grab';
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    /* arrow keys pan when the map itself is focused */
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-label', 'Map of the city. Use arrow keys to pan.');
    svg.addEventListener('keydown', function (e) {
      var step = 60;
      if (e.key === 'ArrowLeft') camX -= step;
      else if (e.key === 'ArrowRight') camX += step;
      else if (e.key === 'ArrowUp') camY -= step;
      else if (e.key === 'ArrowDown') camY += step;
      else return;
      e.preventDefault();
      clampCam();
      render();
      var k = nearestAnchor();
      if (k !== nearKey) { nearKey = k; paint(); }
    });
  }

  /* ---------- boot ---------- */
  if (reduced) {
    /* static fitted view of the whole city */
    var midX = (MINX + MAXX) / 2, midY = (MINY + MAXY) / 2;
    root.setAttribute('transform',
      'translate(' + (VIEW[0] - midX * 0.5) + ' ' + (VIEW[1] - midY * 0.5) + ') scale(0.5)');
    pops.forEach(function (g) { g.classList.add('on'); });
    paint();
    return;
  }

  var start = anchorPoint('pizza');
  camX = start[0]; camY = start[1];
  render();

  /* the city builds itself outward from the pizzeria on load */
  pops.forEach(function (g) {
    setTimeout(function () { g.classList.add('on'); },
      300 + parseFloat(g.dataset.appear) * 2400);
  });

  paint();
  requestAnimationFrame(frame);
})();
