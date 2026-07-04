/* The journey — an isometric world you scroll through, vectr-style.
   The hero is pinned while scrolling drives a camera along the glowing
   beam. Each stop is a small neighborhood, not a lone building:
     pizza   -> pizzeria block: striped awning, round pizza sign, smoking
                oven, patio umbrellas, a neighbor shop and a house
     data    -> office district: window-grid tower with one lit window,
                a second tower, parking lot with cars
     invest  -> financial district: columned exchange, rising bar chart,
                two background towers
     archive -> workshop yard: garage, shed, container stacks, mast
   Houses, pallets, a water tower, and people fill the route between.
   Hover and scroll both drive the active step; click or Enter navigates.
   Reduced motion gets the whole world as a single static view. */
(function () {
  'use strict';

  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TOP = '#fbfdff', LEFTF = '#eef4fa', RIGHTF = '#d8e3ee';
  var WIN_R = '#b9c9da', WIN_L = '#cfdde9';
  var PAD = '#cbdeea';
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
  function pad(parent, x, y, w, d) {
    face(parent, [P(x, y, 0.4), P(x + w, y, 0.4), P(x + w, y + d, 0.4), P(x, y + d, 0.4)], PAD);
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

  /* the MCAP hexagon, billboarded flat like a mounted facade sign:
     navy upper-left + lower-right, gray upper-right + lower-left,
     white diamond through the middle */
  function mcapSign(parent, cx, cy, r) {
    var T = [cx, cy - r], B = [cx, cy + r];
    var TL = [cx - r * 0.866, cy - r * 0.5], TR = [cx + r * 0.866, cy - r * 0.5];
    var BL = [cx - r * 0.866, cy + r * 0.5], BR = [cx + r * 0.866, cy + r * 0.5];
    var ML = [cx - r * 0.866, cy], MR = [cx + r * 0.866, cy];
    var L = [cx - r * 0.4, cy], R = [cx + r * 0.4, cy];
    el('circle', { cx: cx, cy: cy, r: r * 1.32, fill: '#ffffff' }, parent);
    face(parent, [T, TL, ML, L], MCAP_NAVY);
    face(parent, [MR, BR, B, R], MCAP_NAVY);
    face(parent, [T, TR, MR, R], MCAP_GRAY);
    face(parent, [ML, BL, B, L], MCAP_GRAY);
  }

  /* ============================================================
     WORLD — four neighborhoods spread along a long route
     ============================================================ */
  var root = el('g', {}, svg);
  var world = el('g', {}, root);

  var beamPlan = [
    [-950, 300], [-800, 260], [-650, 215], [-500, 170], [-350, 125],
    [-200, 80], [-50, 30], [100, -15], [250, -55], [400, -95],
    [550, -135], [700, -175], [850, -215], [1000, -255], [1180, -305]
  ];

  /* ---------- ground layer: pads, shadows, dots, beam ---------- */
  var ground = el('g', { 'aria-hidden': 'true' }, world);

  function popGroup(parent, appear, cls) {
    var g = el('g', { 'aria-hidden': 'true', 'class': (cls || '') + ' pop' }, parent);
    g.dataset.appear = appear;
    return g;
  }

  /* plazas under each neighborhood */
  var padPza = popGroup(ground, -1); pad(padPza, -880, 130, 300, 190);
  var padDat = popGroup(ground, 0.12); pad(padDat, -260, -30, 290, 190);
  var padInv = popGroup(ground, 0.42); pad(padInv, 320, -230, 320, 200);
  var padArc = popGroup(ground, 0.68); pad(padArc, 900, -370, 300, 190);

  /* shadows pop with their structures */
  [
    [-830, 170, 150, 95, 10, -1],      /* pizzeria */
    [-660, 190, 80, 60, 6, -1],        /* neighbor shop */
    [-855, 90, 60, 50, 5, -1],         /* pizza house */
    [-190, 10, 120, 95, 12, 0.12],     /* office tower */
    [-70, 40, 60, 60, 8, 0.12],        /* second tower */
    [80, -80, 46, 46, 6, 0.22],        /* water tower */
    [420, -150, 170, 95, 10, 0.42],    /* exchange */
    [380, -215, 50, 50, 6, 0.42],      /* fin tower 1 */
    [560, -230, 54, 54, 8, 0.42],      /* fin tower 2 */
    [980, -330, 120, 80, 10, 0.68],    /* workshop */
    [1110, -280, 55, 45, 6, 0.68],     /* shed */
    [-470, 130, 60, 50, 5, 0.04],      /* route house 1 */
    [190, -30, 60, 50, 5, 0.30],       /* route house 2 */
    [760, -220, 60, 50, 5, 0.56]       /* route house 3 */
  ].forEach(function (s) {
    var g = popGroup(ground, s[5]);
    shadow(g, s[0], s[1], s[2], s[3], s[4]);
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
        var dx = gx - samples[si][0], dy = gy - samples[si][1];
        var dd = dx * dx + dy * dy;
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

  var beamPts = beamPlan.map(function (p) { return P(p[0], p[1], 2); });
  var beamLen = 0;
  for (var bl = 1; bl < beamPts.length; bl++) {
    beamLen += Math.hypot(beamPts[bl][0] - beamPts[bl - 1][0], beamPts[bl][1] - beamPts[bl - 1][1]);
  }
  el('polyline', { points: pts(beamPts), fill: 'none', stroke: BEAM_SOFT, 'stroke-width': 14, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.3 }, ground);
  var beamCore = el('polyline', { points: pts(beamPts), fill: 'none', stroke: BEAM, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.9 }, ground);
  var beamHead = el('circle', { r: 7, fill: '#ffffff', stroke: BEAM, 'stroke-width': 3, opacity: 0.95 }, ground);
  if (!reduced) {
    beamCore.setAttribute('stroke-dasharray', beamLen);
    beamCore.setAttribute('stroke-dashoffset', beamLen);
  } else {
    beamHead.remove();
  }

  function beamPoint(f) {
    var target = f * beamLen, acc = 0;
    for (var i = 1; i < beamPts.length; i++) {
      var seg = Math.hypot(beamPts[i][0] - beamPts[i - 1][0], beamPts[i][1] - beamPts[i - 1][1]);
      if (acc + seg >= target) {
        var u = (target - acc) / seg;
        return [
          beamPts[i - 1][0] + (beamPts[i][0] - beamPts[i - 1][0]) * u,
          beamPts[i - 1][1] + (beamPts[i][1] - beamPts[i - 1][1]) * u
        ];
      }
      acc += seg;
    }
    return beamPts[beamPts.length - 1];
  }

  function cluster(key, label, href, appear) {
    var g = el('g', { 'class': 'hotspot pop', tabindex: '0', role: 'link', 'aria-label': label, 'data-key': key }, world);
    g.dataset.href = href;
    g.dataset.appear = appear;
    return g;
  }

  /* ---------- pizzeria block ---------- */
  var nPza = popGroup(world, -1);                        /* neighbors, not clickable */
  house(nPza, -855, 90, 60, 50, 22);
  box(nPza, -660, 190, 80, 60, 26);                      /* neighbor shop */
  box(nPza, -652, 196, 22, 16, 7, 26);
  box(nPza, -905, 210, 26, 20, 6);                       /* pallets */
  box(nPza, -903, 212, 22, 16, 6, 6);
  umbrella(nPza, -690, 145);
  umbrella(nPza, -655, 128);
  person(nPza, -700, 170);
  person(nPza, -600, 230);

  var gPza = cluster('pizza', 'The pizzeria: how I make pizza', 'pizza/', -1);
  box(gPza, -830, 170, 110, 76, 34);                     /* storefront */
  (function () {
    var ax = -830, ay = 246, aw = 110;
    for (var s = 0; s < 10; s++) {
      var x0 = ax + (aw / 10) * s, x1 = ax + (aw / 10) * (s + 1);
      face(gPza, [P(x0, ay, 26), P(x1, ay, 26), P(x1, ay + 12, 20), P(x0, ay + 12, 20)],
        s % 2 ? '#e2695c' : '#fbfdff');
    }
  })();
  box(gPza, -820, 178, 24, 18, 8, 34);
  box(gPza, -708, 178, 50, 50, 24);                      /* oven, stepped dome */
  box(gPza, -700, 186, 34, 34, 11, 24);
  box(gPza, -692, 194, 18, 18, 7, 35);
  smokeStack(gPza, -682, 162, 12, 58);
  (function () {                                         /* round pizza sign */
    box(gPza, -850, 238, 5, 5, 48);
    var c = P(-847.5, 240.5, 60);
    el('circle', { cx: c[0], cy: c[1], r: 21, fill: '#ecc27f' }, gPza);
    el('circle', { cx: c[0], cy: c[1], r: 16, fill: '#e2695c' }, gPza);
    [[-7, -4], [5, -8], [7, 5], [-4, 7]].forEach(function (o) {
      el('circle', { cx: c[0] + o[0], cy: c[1] + o[1], r: 2.6, fill: '#a63d33' }, gPza);
    });
    el('path', { d: 'M' + c[0] + ' ' + c[1] + ' L' + (c[0] + 6) + ' ' + (c[1] - 21) + ' A21 21 0 0 1 ' + (c[0] + 16) + ' ' + (c[1] - 13) + ' Z', fill: '#fbfdff' }, gPza);
  })();

  /* ---------- route filler 1 ---------- */
  var f1 = popGroup(world, 0.04);
  house(f1, -470, 130, 60, 50, 22);
  box(f1, -395, 165, 18, 14, 10);
  person(f1, -420, 200);

  /* ---------- office district ---------- */
  var nDat = popGroup(world, 0.12);
  box(nDat, -70, 40, 50, 50, 78);                        /* second tower */
  windows(nDat, -70, 40, 50, 50, 78, 0, null);
  pad(nDat, -240, 120, 130, 70);                         /* parking lot */
  car(nDat, -228, 132);
  car(nDat, -200, 146);
  car(nDat, -172, 160);
  person(nDat, -110, 130);
  person(nDat, -30, 110);

  var gDat = cluster('data', 'The office: what I do for a living', 'work/', 0.12);
  box(gDat, -190, 10, 66, 66, 132);                      /* main tower */
  /* one light still on: front face above the entrance, third-highest floor */
  windows(gDat, -190, 10, 66, 66, 132, 0, { side: 'front', index: 22, color: LAMP });
  box(gDat, -188, 12, 20, 14, 8, 132);
  box(gDat, -156, 40, 4, 4, 26, 132);
  box(gDat, -190, 76, 42, 30, 34);                       /* low wing */
  box(gDat, -176, 76, 22, 8, 10);                        /* entrance canopy */
  (function () {                                         /* MCAP sign, top of the front face */
    var c = P(-157, 76, 113);
    mcapSign(gDat, c[0], c[1], 12);
  })();

  /* ---------- water tower + route filler 2 ---------- */
  var f2 = popGroup(world, 0.22);
  box(f2, 84, -76, 6, 6, 34);
  box(f2, 116, -76, 6, 6, 34);
  box(f2, 84, -44, 6, 6, 34);
  box(f2, 116, -44, 6, 6, 34);
  box(f2, 80, -80, 46, 46, 26, 34);
  box(f2, 88, -72, 30, 30, 6, 60);
  var f2b = popGroup(world, 0.30);
  house(f2b, 190, -30, 60, 50, 22);
  person(f2b, 150, 20);
  person(f2b, 260, -60);

  /* ---------- financial district ---------- */
  var nInv = popGroup(world, 0.42);
  box(nInv, 380, -215, 50, 50, 66);                      /* background towers */
  windows(nInv, 380, -215, 50, 50, 66, 0, null);
  box(nInv, 560, -230, 54, 54, 92);
  windows(nInv, 560, -230, 54, 54, 92, 0, null);
  person(nInv, 480, -60);
  person(nInv, 560, -110);

  var gInv = cluster('invest', 'The exchange: how I invest', 'investing/', 0.42);
  box(gInv, 420, -150, 120, 84, 8);                      /* base steps */
  box(gInv, 432, -142, 96, 62, 34, 8);                   /* hall */
  for (var col = 0; col < 6; col++) {
    box(gInv, 428 + col * 19, -75, 7, 7, 36, 8);
  }
  box(gInv, 418, -152, 124, 88, 7, 44);                  /* architrave */
  wedge(gInv, 418, -152, 124, 88, 22, 51);               /* pediment */
  (function () {                                         /* green pennant on the pediment */
    box(gInv, 529, -109, 3, 3, 16, 73);
    var f = P(530.5, -107.5, 87);
    face(gInv, [f, [f[0] + 15, f[1] + 4], [f[0] + 2, f[1] + 8]], GREEN);
  })();
  (function () {                                         /* rising chart, market green */
    var bx = 562, by = -105, tops = [];
    [12, 22, 34, 50, 68].forEach(function (h, i) {
      box(gInv, bx + i * 20, by - i * 8, 14, 14, h);
      /* green gain stripe on top of each bar */
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

  /* ---------- route filler 3 ---------- */
  var f3 = popGroup(world, 0.56);
  house(f3, 760, -220, 60, 50, 22);
  box(f3, 840, -180, 30, 20, 12);
  box(f3, 842, -178, 26, 16, 10, 12);
  person(f3, 800, -150);

  /* ---------- workshop yard ---------- */
  var nArc = popGroup(world, 0.68);
  house(nArc, 1110, -280, 55, 45, 20);                   /* shed */
  box(nArc, 940, -390, 30, 20, 12);                      /* container stacks */
  box(nArc, 940, -366, 30, 20, 12);
  box(nArc, 942, -388, 26, 16, 10, 12);
  box(nArc, 1150, -370, 5, 5, 44);                       /* mast */
  box(nArc, 1136, -372, 34, 4, 3, 30);
  person(nArc, 1060, -240);

  var gArch = cluster('archive', 'The workshop: everything else I build', '#archive', 0.68);
  box(gArch, 980, -330, 104, 72, 34);
  wedge(gArch, 976, -334, 112, 80, 18, 34);
  face(gArch, [P(1000, -258, 24), P(1042, -258, 24), P(1042, -258, 0), P(1000, -258, 0)], '#c3d2e0');
  face(gArch, [P(1000, -258, 20), P(1042, -258, 20), P(1042, -258, 18), P(1000, -258, 18)], '#aebfd0');
  face(gArch, [P(1000, -258, 12), P(1042, -258, 12), P(1042, -258, 10), P(1000, -258, 10)], '#aebfd0');
  box(gArch, 1092, -336, 5, 5, 42);                      /* billboard */
  box(gArch, 1076, -338, 40, 4, 20, 38);
  box(gArch, 990, -352, 18, 14, 12);                     /* crates */
  box(gArch, 1012, -356, 14, 12, 9);

  /* ---------- project placeholders ----------
     PLACEHOLDER OBJECTS: each project gets a plinth + plain cube for
     now. Adam picks the real object per project later — swap the two
     box() calls inside projectSpot() (or per call site) and everything
     else (hover, label, click, keyboard, reveal) keeps working. */
  function projectSpot(key, label, href, x, y) {
    var g = cluster(key, label + ' (project)', href, 0.70);
    var c = P(x, y, 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: 22, ry: 11, fill: SHADOW }, g);
    box(g, x - 12, y - 12, 24, 24, 6);                   /* plinth */
    box(g, x - 7, y - 7, 14, 14, 14, 6);                 /* placeholder cube */
    var t = el('text', {
      x: c[0], y: c[1] - 48,
      'text-anchor': 'middle',
      'class': 'spot-label'
    }, g);
    t.textContent = label;
    return g;
  }
  projectSpot('proj-cookbook', "Adam's Cookbook", 'projects/adams-cookbook/', 890, -140);
  projectSpot('proj-housing', 'Housing Dashboard', 'projects/housing-dashboard/', 965, -115);
  projectSpot('proj-songdle', 'Songdle', 'projects/songdle/', 1045, -95);
  projectSpot('proj-handoff', 'Handoff', 'projects/handoff/', 1125, -120);

  /* ============================================================
     THE JOURNEY
     ============================================================ */
  var journey = document.querySelector('.scene-journey');
  var steps = document.querySelectorAll('.scene-steps .step');
  var spots = svg.querySelectorAll('.hotspot');
  var pops = world.querySelectorAll('.pop');

  var hoverKey = null;
  var scrollKey = 'pizza';

  function paint() {
    var key = hoverKey || scrollKey;
    steps.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
    spots.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
  }

  spots.forEach(function (g) {
    g.addEventListener('mouseenter', function () { hoverKey = g.dataset.key; paint(); });
    g.addEventListener('mouseleave', function () { hoverKey = null; paint(); });
    g.addEventListener('focus', function () { hoverKey = g.dataset.key; paint(); });
    g.addEventListener('blur', function () { hoverKey = null; paint(); });
    g.addEventListener('click', function () { window.location.href = g.dataset.href; });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = g.dataset.href; }
    });
  });
  steps.forEach(function (s) {
    s.addEventListener('mouseenter', function () { hoverKey = s.dataset.key; paint(); });
    s.addEventListener('mouseleave', function () { hoverKey = null; paint(); });
    s.addEventListener('focus', function () { hoverKey = s.dataset.key; paint(); });
    s.addEventListener('blur', function () { hoverKey = null; paint(); });
  });

  var CAM_START = 0.07, CAM_END = 0.96;
  var STEP_AT = { pizza: 0, data: 0.26, invest: 0.54, archive: 0.80 };

  var cx = 0, cy = 0;
  var px = 0, py = 0;

  function progress() {
    if (!journey) return 0;
    var rect = journey.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  function layoutStatic() {
    var mid = beamPoint(0.5);
    root.setAttribute('transform',
      'translate(' + (800 - mid[0] * 0.42) + ' ' + (470 - mid[1] * 0.42) + ') scale(0.42)');
    beamCore.removeAttribute('stroke-dasharray');
    pops.forEach(function (g) { g.classList.add('on'); });
  }

  if (reduced || !journey) {
    layoutStatic();
    paint();
    return;
  }

  function frame() {
    var p = progress();

    var camF = CAM_START + (CAM_END - CAM_START) * p;
    var cam = beamPoint(camF);
    var tx = 800 - cam[0] + px;
    var ty = 460 - cam[1] + py;
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    root.setAttribute('transform', 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')');

    var drawF = Math.min(1, camF + 0.08);
    beamCore.setAttribute('stroke-dashoffset', (beamLen * (1 - drawF)).toFixed(1));
    var head = beamPoint(drawF);
    beamHead.setAttribute('cx', head[0].toFixed(1));
    beamHead.setAttribute('cy', head[1].toFixed(1));

    pops.forEach(function (g) {
      if (p >= parseFloat(g.dataset.appear)) g.classList.add('on');
    });

    var key = 'pizza';
    for (var k in STEP_AT) { if (p >= STEP_AT[k]) key = k; }
    if (key !== scrollKey) { scrollKey = key; paint(); }

    requestAnimationFrame(frame);
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      px = (e.clientX / window.innerWidth - 0.5) * -16;
      py = (e.clientY / window.innerHeight - 0.5) * -9;
    }, { passive: true });
  }

  pops.forEach(function (g) {
    if (parseFloat(g.dataset.appear) < 0) g.classList.add('on');
  });
  paint();
  requestAnimationFrame(frame);
})();
