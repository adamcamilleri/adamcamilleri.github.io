/* The journey — an isometric SVG landscape you scroll through, vectr-style.
   The homepage hero is pinned while scrolling drives a camera along the
   glowing beam. Buildings pop in as you approach them, the beam draws
   ahead of you, and the step list advances 01 -> 04.

   The stops are literal:
     pizza   -> a pizzeria (striped awning, round pizza sign, smoking oven)
     data    -> an office tower (window grid, one window still lit at night)
     invest  -> an exchange (colonnade + pediment) beside a rising bar chart
     archive -> the workshop (garage door, billboard, crates)

   Hover and scroll both drive the active step; click or Enter navigates.
   Reduced motion gets the whole landscape as a single static view. */
(function () {
  'use strict';

  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TOP = '#fbfdff', LEFTF = '#eef4fa', RIGHTF = '#d8e3ee';
  var WIN_R = '#b9c9da', WIN_L = '#cfdde9';
  var SHADOW = 'rgba(70, 100, 135, 0.10)';
  var BEAM = '#43c8f5', BEAM_SOFT = '#9fe2fb', DOT = '#7cc9e8';

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
  /* gabled roof, ridge running along x */
  function wedge(parent, x, y, w, d, h, z0) {
    z0 = z0 || 0;
    var r1 = P(x, y + d / 2, z0 + h), r2 = P(x + w, y + d / 2, z0 + h);
    face(parent, [P(x + w, y, z0), P(x + w, y + d, z0), r2], RIGHTF);
    face(parent, [P(x, y, z0), P(x + w, y, z0), r2, r1], TOP);
    face(parent, [P(x, y + d, z0), P(x + w, y + d, z0), r2, r1], LEFTF);
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
  /* window grid on the two visible faces of a tower */
  function windows(parent, x, y, w, d, h, z0, litIndex) {
    var idx = 0;
    for (var z = z0 + 10; z < z0 + h - 8; z += 14) {
      for (var a = 6; a < d - 8; a += 14) {
        var fill = (idx === litIndex) ? BEAM : WIN_R;
        face(parent, [P(x + w, y + a, z + 8), P(x + w, y + a + 8, z + 8), P(x + w, y + a + 8, z), P(x + w, y + a, z)], fill);
        idx++;
      }
      for (var b = 6; b < w - 8; b += 14) {
        face(parent, [P(x + b, y + d, z + 8), P(x + b + 8, y + d, z + 8), P(x + b + 8, y + d, z), P(x + b, y + d, z)], WIN_L);
      }
    }
  }

  /* ============================================================
     WORLD LAYOUT — the journey runs SW -> NE along the beam
     ============================================================ */
  var STOPS = {
    pizza: { at: [-450, 150], appear: -1 },
    data: { at: [-40, 40], appear: 0.10 },
    invest: { at: [360, -60], appear: 0.40 },
    archive: { at: [740, -170], appear: 0.66 }
  };
  var beamPlan = [
    [-660, 205], [-520, 170], [-380, 130], [-230, 90], [-90, 55],
    [60, 5], [210, -30], [360, -75], [510, -115], [640, -145], [820, -190]
  ];

  var root = el('g', {}, svg);
  var world = el('g', {}, root);

  /* ---------- ground: shadows, dots, beam ---------- */
  var ground = el('g', { 'aria-hidden': 'true' }, world);
  /* each shadow pops in with its building */
  [
    [-510, 110, 150, 95, 10, -1],     /* pizzeria */
    [-80, 0, 120, 95, 12, 0.10],      /* office */
    [300, -105, 170, 95, 10, 0.40],   /* exchange */
    [690, -210, 120, 80, 10, 0.66],   /* workshop */
    [130, -170, 46, 46, 6, 0.16],     /* water tower */
    [540, -50, 64, 46, 4, 0.5]        /* containers */
  ].forEach(function (s) {
    var g = el('g', { 'aria-hidden': 'true', 'class': 'pop' }, ground);
    g.dataset.appear = s[5];
    shadow(g, s[0], s[1], s[2], s[3], s[4]);
  });

  /* halftone dots hugging the beam */
  var samples = [];
  for (var b = 0; b < beamPlan.length - 1; b++) {
    for (var t = 0; t < 8; t++) {
      var u = t / 8;
      samples.push([
        beamPlan[b][0] + (beamPlan[b + 1][0] - beamPlan[b][0]) * u,
        beamPlan[b][1] + (beamPlan[b + 1][1] - beamPlan[b][1]) * u
      ]);
    }
  }
  for (var gx = -640; gx <= 800; gx += 30) {
    for (var gy = -220; gy <= 230; gy += 30) {
      var best = 1e9;
      for (var si = 0; si < samples.length; si++) {
        var dx = gx - samples[si][0], dy = gy - samples[si][1];
        var dd = dx * dx + dy * dy;
        if (dd < best) best = dd;
      }
      var dist = Math.sqrt(best);
      if (dist < 80) {
        var r = 3.2 * (1 - dist / 80);
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

  /* point at fraction f along the projected beam */
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

  /* ---------- clusters ---------- */
  function cluster(key, label, href, appear) {
    var g = el('g', { 'class': 'hotspot pop', tabindex: '0', role: 'link', 'aria-label': label, 'data-key': key }, world);
    g.dataset.href = href;
    g.dataset.appear = appear;
    return g;
  }

  /* 01 · the pizzeria */
  var gPza = cluster('pizza', 'The pizzeria: how I make pizza', 'pizza/', STOPS.pizza.appear);
  box(gPza, -510, 110, 110, 76, 34);                     /* storefront */
  /* striped awning over the front face */
  (function () {
    var ax = -510, ay = 186, aw = 110;
    for (var s = 0; s < 10; s++) {
      var x0 = ax + (aw / 10) * s, x1 = ax + (aw / 10) * (s + 1);
      face(gPza, [P(x0, ay, 26), P(x1, ay, 26), P(x1, ay + 12, 20), P(x0, ay + 12, 20)],
        s % 2 ? '#e2695c' : '#fbfdff');
    }
  })();
  box(gPza, -500, 118, 24, 18, 8, 34);                   /* roof unit */
  /* the oven: stepped dome + chimney, out back */
  box(gPza, -388, 118, 50, 50, 24);
  box(gPza, -380, 126, 34, 34, 11, 24);
  box(gPza, -372, 134, 18, 18, 7, 35);
  smokeStack(gPza, -362, 102, 12, 58);
  /* round pizza sign on a pole */
  (function () {
    box(gPza, -530, 178, 5, 5, 48);
    var c = P(-527.5, 180.5, 60);
    el('circle', { cx: c[0], cy: c[1], r: 21, fill: '#ecc27f' }, gPza);           /* crust */
    el('circle', { cx: c[0], cy: c[1], r: 16, fill: '#e2695c' }, gPza);           /* sauce */
    [[-7, -4], [5, -8], [7, 5], [-4, 7]].forEach(function (o) {
      el('circle', { cx: c[0] + o[0], cy: c[1] + o[1], r: 2.6, fill: '#a63d33' }, gPza);
    });
    el('path', { d: 'M' + c[0] + ' ' + c[1] + ' L' + (c[0] + 6) + ' ' + (c[1] - 21) + ' A21 21 0 0 1 ' + (c[0] + 16) + ' ' + (c[1] - 13) + ' Z', fill: '#fbfdff' }, gPza); /* missing slice */
  })();

  /* 02 · the office tower */
  var gDat = cluster('data', 'The office: what I do for a living', 'work/', STOPS.data.appear);
  box(gDat, -80, 0, 66, 66, 132);                        /* tower */
  windows(gDat, -80, 0, 66, 66, 132, 0, 7);              /* grid + one lit window */
  box(gDat, -78, 2, 20, 14, 8, 132);                     /* rooftop unit */
  box(gDat, -46, 30, 4, 4, 26, 132);                     /* antenna */
  box(gDat, -80, 66, 42, 30, 34);                        /* low wing */
  box(gDat, -66, 96, 22, 8, 10);                         /* entrance canopy */

  /* 03 · the exchange + rising chart */
  var gInv = cluster('invest', 'The exchange: how I invest', 'investing/', STOPS.invest.appear);
  box(gInv, 300, -105, 120, 84, 8);                      /* base steps */
  box(gInv, 312, -97, 96, 62, 34, 8);                    /* hall behind columns */
  for (var col = 0; col < 6; col++) {                    /* colonnade */
    box(gInv, 308 + col * 19, -30, 7, 7, 36, 8);
  }
  box(gInv, 298, -107, 124, 88, 7, 44);                  /* architrave */
  wedge(gInv, 298, -107, 124, 88, 22, 51);               /* pediment */
  /* the chart: ascending bars + arrow, up and to the right */
  (function () {
    var bx = 440, by = -60, tops = [];
    [12, 22, 34, 50, 68].forEach(function (h, i) {
      box(gInv, bx + i * 20, by - i * 8, 14, 14, h);
      tops.push(P(bx + i * 20 + 7, by - i * 8 + 7, h + 3));
    });
    el('polyline', { points: pts(tops), fill: 'none', stroke: BEAM, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gInv);
    var last = tops[tops.length - 1], prev = tops[tops.length - 2];
    var ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    var a1 = ang + 2.5, a2 = ang - 2.5;
    el('polygon', {
      points: pts([[last[0] + Math.cos(ang) * 10, last[1] + Math.sin(ang) * 10],
        [last[0] + Math.cos(a1) * 7, last[1] + Math.sin(a1) * 7],
        [last[0] + Math.cos(a2) * 7, last[1] + Math.sin(a2) * 7]]),
      fill: BEAM
    }, gInv);
  })();

  /* 04 · the workshop */
  var gArch = cluster('archive', 'The workshop: everything else I build', '#archive', STOPS.archive.appear);
  box(gArch, 690, -210, 104, 72, 34);
  wedge(gArch, 686, -214, 112, 80, 18, 34);              /* gabled roof */
  /* garage door on the front face */
  face(gArch, [P(710, -138, 24), P(752, -138, 24), P(752, -138, 0), P(710, -138, 0)], '#c3d2e0');
  face(gArch, [P(710, -138, 20), P(752, -138, 20), P(752, -138, 18), P(710, -138, 18)], '#aebfd0');
  face(gArch, [P(710, -138, 12), P(752, -138, 12), P(752, -138, 10), P(710, -138, 10)], '#aebfd0');
  box(gArch, 802, -216, 5, 5, 42);                       /* billboard */
  box(gArch, 786, -218, 40, 4, 20, 38);
  box(gArch, 700, -232, 18, 14, 12);                     /* crates */
  box(gArch, 722, -236, 14, 12, 9);

  /* ---------- décor with its own reveal timing ---------- */
  function decoGroup(appear) {
    var g = el('g', { 'aria-hidden': 'true', 'class': 'pop' }, world);
    g.dataset.appear = appear;
    return g;
  }
  var dPallets = decoGroup(-1);
  box(dPallets, -580, 200, 26, 20, 6);
  box(dPallets, -578, 202, 22, 16, 6, 6);
  person(dPallets, -430, 210);

  var dTower = decoGroup(0.16);                          /* water tower */
  box(dTower, 134, -166, 6, 6, 34);
  box(dTower, 166, -166, 6, 6, 34);
  box(dTower, 134, -134, 6, 6, 34);
  box(dTower, 166, -134, 6, 6, 34);
  box(dTower, 130, -170, 46, 46, 26, 34);
  box(dTower, 138, -162, 30, 30, 6, 60);
  person(dTower, 60, 60);

  var dCont = decoGroup(0.5);                            /* containers */
  box(dCont, 540, -50, 30, 20, 12);
  box(dCont, 540, -26, 30, 20, 12);
  box(dCont, 542, -48, 26, 16, 10, 12);
  person(dCont, 480, -80);
  person(dCont, 700, -120);

  /* ============================================================
     THE JOURNEY — scroll drives camera, beam, reveals, steps
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

  /* camera path: from the pizzeria to the workshop along the beam */
  var CAM_START = 0.10, CAM_END = 0.93;

  var cx = 0, cy = 0;   /* current camera translate */
  var px = 0, py = 0;   /* pointer parallax */

  function progress() {
    if (!journey) return 0;
    var rect = journey.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  function layoutStatic() {
    /* reduced motion or no journey: fit the whole world in view */
    var mid = beamPoint(0.5);
    root.setAttribute('transform',
      'translate(' + (800 - mid[0] * 0.62) + ' ' + (470 - mid[1] * 0.62) + ') scale(0.62)');
    beamCore.removeAttribute('stroke-dasharray');
    pops.forEach(function (g) { g.classList.add('on'); });
  }

  if (reduced || !journey) {
    layoutStatic();
    paint();
    return;
  }

  var STEP_AT = { pizza: 0, data: 0.24, invest: 0.52, archive: 0.78 };

  function frame() {
    var p = progress();

    /* camera follows the beam */
    var camF = CAM_START + (CAM_END - CAM_START) * p;
    var cam = beamPoint(camF);
    var tx = 800 - cam[0] + px;
    var ty = 460 - cam[1] + py;
    cx += (tx - cx) * 0.09;
    cy += (ty - cy) * 0.09;
    root.setAttribute('transform', 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')');

    /* the beam draws just ahead of the camera, with a glowing head */
    var drawF = Math.min(1, camF + 0.10);
    beamCore.setAttribute('stroke-dashoffset', (beamLen * (1 - drawF)).toFixed(1));
    var head = beamPoint(drawF);
    beamHead.setAttribute('cx', head[0].toFixed(1));
    beamHead.setAttribute('cy', head[1].toFixed(1));

    /* pop buildings in as the camera approaches */
    pops.forEach(function (g) {
      if (p >= parseFloat(g.dataset.appear)) g.classList.add('on');
    });

    /* advance the active step */
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

  /* start with only the first stop visible */
  pops.forEach(function (g) {
    if (parseFloat(g.dataset.appear) < 0) g.classList.add('on');
  });
  paint();
  requestAnimationFrame(frame);
})();
