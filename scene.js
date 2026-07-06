/* The city: a free-roam isometric town on a street grid. Drag in any
   direction to pan (with inertia), arrow keys pan when the map is
   focused, and the step list flies the camera to a district. Clickable
   things enlarge slightly on hover and navigate on click; a drag over
   a building never counts as a click.

   Nine blocks around two avenues and two streets:
     downtown north: MCAP office block and the exchange
     west main street: the pizzeria
     center: the park (pond, water tower)
     southeast: the workshop yard
     the rest: residential filler
   Project placeholders are scattered through the blocks and clickable
   whenever they are on screen. Reduced motion gets a static fitted
   view of the whole city. */
(function () {
  'use strict';

  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TOP = '#fbfdff', LEFTF = '#eef4fa', RIGHTF = '#d8e3ee';
  var WIN_R = '#b9c9da', WIN_L = '#cfdde9';
  var PLATE = '#cbdeea', ROAD = '#bdd3e3', POND = '#b7d8ea';
  var SHADOW = 'rgba(70, 100, 135, 0.10)';
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
  function flat(parent, x, y, w, d, fill, z) {
    z = z || 0.4;
    face(parent, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill);
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
  function car(parent, x, y, vertical) {
    if (vertical) {
      box(parent, x, y, 9, 17, 5);
      box(parent, x + 1, y + 3.5, 7, 9, 4, 5);
    } else {
      box(parent, x, y, 17, 9, 5);
      box(parent, x + 3.5, y + 1, 9, 7, 4, 5);
    }
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
  function tree(parent, x, y) {
    var c = P(x, y, 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: 8, ry: 4, fill: SHADOW }, parent);
    box(parent, x - 1.5, y - 1.5, 3, 3, 8);
    box(parent, x - 5, y - 5, 10, 10, 9, 8);
    box(parent, x - 3, y - 3, 6, 6, 6, 17);
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
     THE CITY PLATE AND STREETS
     Blocks: x and y in [-430,-150], [-100,100], [150,430]
     Roads:  x and y in [-150,-100] and [100,150]
     ============================================================ */
  var root = el('g', {}, svg);
  var world = el('g', {}, root);

  var EXT = 430;
  var ANCHORS = {
    pizza: [-275, 0],
    data: [0, -275],
    invest: [275, -275],
    archive: [275, 275]
  };

  var ground = el('g', { 'aria-hidden': 'true' }, world);

  /* the plate the whole city sits on, with a thin visible edge */
  face(ground, [P(-EXT, -EXT, 0), P(EXT, -EXT, 0), P(EXT, -EXT, -6), P(-EXT, -EXT, -6)], RIGHTF);
  face(ground, [P(EXT, -EXT, 0), P(EXT, EXT, 0), P(EXT, EXT, -6), P(EXT, -EXT, -6)], RIGHTF);
  face(ground, [P(-EXT, EXT, 0), P(EXT, EXT, 0), P(EXT, EXT, -6), P(-EXT, EXT, -6)], LEFTF);
  face(ground, [P(-EXT, -EXT, 0), P(-EXT, EXT, 0), P(-EXT, EXT, -6), P(-EXT, -EXT, -6)], LEFTF);
  flat(ground, -EXT, -EXT, EXT * 2, EXT * 2, PLATE, 0);

  /* roads */
  flat(ground, -EXT, -150, EXT * 2, 50, ROAD, 0.4);
  flat(ground, -EXT, 100, EXT * 2, 50, ROAD, 0.4);
  flat(ground, -150, -EXT, 50, EXT * 2, ROAD, 0.4);
  flat(ground, 100, -EXT, 50, EXT * 2, ROAD, 0.4);

  /* lane dashes, skipping the intersections */
  function inRoad(v) { return (v > -160 && v < -90) || (v > 90 && v < 160); }
  for (var dx = -EXT + 20; dx < EXT - 20; dx += 70) {
    if (!inRoad(dx)) {
      flat(ground, dx, -128, 26, 6, '#ffffff', 0.8);
      flat(ground, dx, 122, 26, 6, '#ffffff', 0.8);
    }
  }
  for (var dy = -EXT + 20; dy < EXT - 20; dy += 70) {
    if (!inRoad(dy)) {
      flat(ground, -128, dy, 6, 26, '#ffffff', 0.8);
      flat(ground, 122, dy, 6, 26, '#ffffff', 0.8);
    }
  }

  /* ============================================================
     PIECES: every structure becomes its own group, depth-sorted
     back to front (isometric painter's order) before it enters
     the DOM, so nothing floats over a building that should hide
     it. depth = frontmost world corner (x + y); larger = nearer.
     ============================================================ */
  var pieces = [];
  function pc(depth, appear, hot) {
    var g = el('g', hot
      ? { 'class': 'hotspot pop', tabindex: '0', role: 'link', 'aria-label': hot.label, 'data-key': hot.key }
      : { 'aria-hidden': 'true', 'class': 'pop' }, null);
    if (hot) g.dataset.href = hot.href;
    g.dataset.appear = appear;
    pieces.push({ depth: depth, g: g });
    return g;
  }
  function Ph(a, x, y, w, d, h) { house(pc((x + w) + (y + d), a), x, y, w, d, h); }
  function Pt(a, x, y) { tree(pc(x + y, a), x, y); }
  function Pp(a, x, y) { person(pc(x + y, a), x, y); }
  function Pcar(a, x, y, v) { car(pc(x + y, a), x, y, v); }
  function Pl(a, x, y) { streetlight(pc(x + y, a), x, y); }
  function Pu(a, x, y) { umbrella(pc(x + y, a), x, y); }

  /* terrain: flat ground cover, always under the 3D city */
  flat(ground, -90, -390, 70, 110, ROAD, 0.5);            /* office parking */
  flat(ground, -95, -95, 190, 190, '#c3e0d8', 0.5);       /* park lawn */
  (function () {
    var c = P(30, 30, 0);
    el('ellipse', { cx: c[0], cy: c[1], rx: 50, ry: 25, fill: PLATE }, ground);
    el('ellipse', { cx: c[0], cy: c[1], rx: 44, ry: 22, fill: POND }, ground);
  })();

  /* shadows sit above terrain, under every structure */
  function gshadow(appear) {
    var g = el('g', { 'aria-hidden': 'true', 'class': 'pop' }, ground);
    g.dataset.appear = appear;
    return g;
  }
  [
    [-380, -20, 130, 90, 10, 0],       /* pizzeria */
    [-215, 20, 70, 55, 6, 0],          /* neighbor shop */
    [-45, -290, 110, 90, 12, 0.15],    /* office tower */
    [55, -190, 55, 55, 8, 0.15],       /* second tower */
    [175, -300, 160, 90, 10, 0.3],     /* exchange */
    [350, -200, 50, 50, 6, 0.3],       /* fin tower 1 */
    [180, -180, 54, 54, 8, 0.3],       /* fin tower 2 */
    [190, 190, 115, 80, 10, 0.45],     /* workshop */
    [330, 300, 55, 45, 6, 0.45],       /* shed */
    [-30, -25, 46, 46, 6, 0.2],        /* water tower */
    [-350, -350, 60, 50, 5, 0.25],     /* houses */
    [-230, -290, 55, 45, 5, 0.25],
    [-350, 200, 60, 50, 5, 0.35],
    [-240, 300, 55, 45, 5, 0.35],
    [-40, 200, 60, 50, 5, 0.4],
    [40, 300, 55, 45, 5, 0.4],
    [190, 30, 55, 45, 5, 0.35],
    [300, 20, 50, 42, 5, 0.35]
  ].forEach(function (s) {
    shadow(gshadow(s[5]), s[0], s[1], s[2], s[3], s[4]);
  });

  /* ============================================================
     BLOCKS (drawn back to front by x+y)
     ============================================================ */

  /* NW block: residential */
  Ph(0.25, -350, -350, 60, 50, 22);
  Ph(0.25, -230, -290, 55, 45, 20);
  Ph(0.25, -390, -230, 55, 45, 20);
  Pt(0.25, -270, -350);
  Pt(0.25, -180, -220);
  Pp(0.25, -280, -240);
  Pl(0.25, -170, -170);

  /* N block: MCAP office district (parking is terrain, above) */
  (function () {
    var g = pc(-25, 0.15);                          /* second tower */
    box(g, 55, -190, 55, 55, 82);
    windows(g, 55, -190, 55, 55, 82, 0, null);
  })();
  Pcar(0.15, -80, -378);
  Pcar(0.15, -80, -350);
  Pcar(0.15, -80, -322, true);
  Pp(0.15, -30, -180);
  Pp(0.15, 40, -240);
  Pt(0.15, -90, -170);

  var gDat = pc(-194, 0.15, { key: 'data', label: 'The office: what I do for a living', href: 'work/' });
  box(gDat, -45, -290, 66, 66, 132);
  windows(gDat, -45, -290, 66, 66, 132, 0, { side: 'front', index: 22, color: LAMP });
  box(gDat, -43, -288, 20, 14, 8, 132);
  box(gDat, -11, -260, 4, 4, 26, 132);
  box(gDat, -45, -224, 42, 30, 34);
  box(gDat, -31, -224, 22, 8, 10);
  (function () {
    /* MCAP sign: a white panel slab proud of the facade */
    box(gDat, -41, -224, 58, 3, 26, 104);
    face(gDat, [P(-41, -221, 130), P(17, -221, 130), P(17, -221, 104), P(-41, -221, 104)], '#ffffff');
    var c = P(-12, -221, 117);
    mcapSign(gDat, c[0], c[1], 10);
  })();

  /* NE block: financial district */
  (function () {
    var g = pc(250, 0.3);
    box(g, 350, -200, 50, 50, 66);
    windows(g, 350, -200, 50, 50, 66, 0, null);
  })();
  (function () {
    var g = pc(108, 0.3);
    box(g, 180, -180, 54, 54, 92);
    windows(g, 180, -180, 54, 54, 92, 0, null);
  })();
  Pp(0.3, 260, -160);
  Pl(0.3, 170, -170);

  var gInv = pc(82, 0.3, { key: 'invest', label: 'The exchange: how I invest', href: 'investing/' });
  box(gInv, 175, -300, 120, 84, 8);
  box(gInv, 187, -292, 96, 62, 34, 8);
  for (var col = 0; col < 6; col++) {
    box(gInv, 183 + col * 19, -225, 7, 7, 36, 8);
  }
  box(gInv, 173, -302, 124, 88, 7, 44);
  wedge(gInv, 173, -302, 124, 88, 22, 51);
  (function () {
    box(gInv, 284, -259, 3, 3, 16, 73);
    var f = P(285.5, -257.5, 87);
    face(gInv, [f, [f[0] + 15, f[1] + 4], [f[0] + 2, f[1] + 8]], GREEN);
  })();
  (function () {
    /* the rising chart sits well forward of the hall, so it is its own
       piece: leaving it inside gInv pushed the whole hall's sort depth
       forward and made it paint over the tower standing in front of it */
    var gChart = pc(137, 0.3);
    var bx = 320, by = -255, tops = [];
    [12, 22, 34, 50, 68].forEach(function (h, i) {
      box(gChart, bx + i * 18, by - i * 7, 14, 14, h);
      face(gChart, [P(bx + i * 18, by - i * 7, h + 2.5), P(bx + i * 18 + 14, by - i * 7, h + 2.5), P(bx + i * 18 + 14, by - i * 7 + 14, h + 2.5), P(bx + i * 18, by - i * 7 + 14, h + 2.5)], GREEN);
      tops.push(P(bx + i * 18 + 7, by - i * 7 + 7, h + 5));
    });
    el('polyline', { points: pts(tops), fill: 'none', stroke: GREEN, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gChart);
    var last = tops[tops.length - 1], prev = tops[tops.length - 2];
    var ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    el('polygon', {
      points: pts([[last[0] + Math.cos(ang) * 10, last[1] + Math.sin(ang) * 10],
        [last[0] + Math.cos(ang + 2.5) * 7, last[1] + Math.sin(ang + 2.5) * 7],
        [last[0] + Math.cos(ang - 2.5) * 7, last[1] + Math.sin(ang - 2.5) * 7]]),
      fill: GREEN
    }, gChart);
  })();

  /* W block: the pizzeria on main street */
  (function () {
    var g = pc(-70, 0);                             /* neighbor shop */
    box(g, -215, 20, 70, 55, 26);
    box(g, -207, 26, 22, 16, 7, 26);
  })();
  (function () {
    var g = pc(-314, 0);                            /* pallet crate */
    box(g, -420, 60, 26, 20, 6);
    box(g, -418, 62, 22, 16, 6, 6);
  })();
  Pu(0, -250, -60);
  Pu(0, -215, -75);
  Pp(0, -260, -30);
  Pp(0, -170, 40);
  Pt(0, -410, -80);
  Pl(0, -170, 80);

  var gPza = pc(-170, 0, { key: 'pizza', label: 'The pizzeria: how I make pizza', href: 'pizza/' });
  box(gPza, -380, -20, 110, 76, 34);
  (function () {
    var ax = -380, ay = 56, aw = 110;
    for (var s = 0; s < 10; s++) {
      var x0 = ax + (aw / 10) * s, x1 = ax + (aw / 10) * (s + 1);
      face(gPza, [P(x0, ay, 26), P(x1, ay, 26), P(x1, ay + 12, 20), P(x0, ay + 12, 20)],
        s % 2 ? '#e2695c' : '#fbfdff');
    }
  })();
  box(gPza, -370, -12, 24, 18, 8, 34);
  box(gPza, -258, -12, 50, 50, 24);
  box(gPza, -250, -4, 34, 34, 11, 24);
  box(gPza, -242, 4, 18, 18, 7, 35);
  smokeStack(gPza, -232, -28, 12, 58);
  (function () {
    box(gPza, -400, 48, 5, 5, 48);
    var c = P(-397.5, 50.5, 60);
    el('circle', { cx: c[0], cy: c[1], r: 21, fill: '#ecc27f' }, gPza);
    el('circle', { cx: c[0], cy: c[1], r: 16, fill: '#e2695c' }, gPza);
    [[-7, -4], [5, -8], [7, 5], [-4, 7]].forEach(function (o) {
      el('circle', { cx: c[0] + o[0], cy: c[1] + o[1], r: 2.6, fill: '#a63d33' }, gPza);
    });
    el('path', { d: 'M' + c[0] + ' ' + c[1] + ' L' + (c[0] + 6) + ' ' + (c[1] - 21) + ' A21 21 0 0 1 ' + (c[0] + 16) + ' ' + (c[1] - 13) + ' Z', fill: '#fbfdff' }, gPza);
  })();

  /* C block: the park (lawn and pond are terrain, above) */
  (function () {
    var g = pc(-30, 0.2);                           /* water tower */
    box(g, -34, -80, 6, 6, 34);
    box(g, -2, -80, 6, 6, 34);
    box(g, -34, -48, 6, 6, 34);
    box(g, -2, -48, 6, 6, 34);
    box(g, -38, -84, 46, 46, 26, 34);
    box(g, -30, -76, 30, 30, 6, 60);
  })();
  Pt(0.2, -70, 40);
  Pt(0.2, -50, 75);
  Pt(0.2, 80, -50);
  Pt(0.2, 55, -75);
  Pp(0.2, -20, 60);
  Pp(0.2, 70, 10);

  /* E block: apartments */
  (function () {
    var g = pc(320, 0.35);
    box(g, 190, 30, 55, 45, 58);
    windows(g, 190, 30, 55, 45, 58, 0, null);
  })();
  Ph(0.35, 300, 20, 50, 42, 18);
  (function () {
    var g = pc(500, 0.35);
    box(g, 320, 80, 55, 45, 44);
    windows(g, 320, 80, 55, 45, 44, 0, null);
  })();
  Pt(0.35, 260, 80);
  Pp(0.35, 240, 60);
  Pl(0.35, 170, 170);

  /* SW block: residential */
  Ph(0.35, -350, 200, 60, 50, 22);
  Ph(0.35, -240, 300, 55, 45, 20);
  Ph(0.35, -390, 320, 55, 45, 20);
  Pt(0.35, -280, 250);
  Pp(0.35, -300, 320);
  Pl(0.35, -170, 170);

  /* S block: residential */
  Ph(0.4, -40, 200, 60, 50, 22);
  Ph(0.4, 40, 300, 55, 45, 20);
  Ph(0.4, -80, 320, 55, 45, 20);
  Pt(0.4, 40, 220);
  Pp(0.4, 0, 280);

  /* SE block: the workshop yard */
  Ph(0.45, 330, 300, 55, 45, 20);
  (function () {
    var g = pc(574, 0.45);                          /* container stack */
    box(g, 180, 320, 30, 20, 12);
    box(g, 180, 344, 30, 20, 12);
    box(g, 182, 322, 26, 16, 10, 12);
  })();
  (function () {
    var g = pc(632, 0.45);                          /* mast */
    box(g, 390, 220, 5, 5, 44);
    box(g, 376, 218, 34, 4, 3, 30);
  })();
  Pp(0.45, 250, 280);

  var gArch = pc(556, 0.45, { key: 'archive', label: 'The workshop: everything else I build', href: '#archive' });
  box(gArch, 190, 190, 104, 72, 34);
  wedge(gArch, 186, 186, 112, 80, 18, 34);
  face(gArch, [P(210, 262, 24), P(252, 262, 24), P(252, 262, 0), P(210, 262, 0)], '#c3d2e0');
  face(gArch, [P(210, 262, 20), P(252, 262, 20), P(252, 262, 18), P(210, 262, 18)], '#aebfd0');
  face(gArch, [P(210, 262, 12), P(252, 262, 12), P(252, 262, 10), P(210, 262, 10)], '#aebfd0');
  box(gArch, 302, 184, 5, 5, 42);
  box(gArch, 286, 182, 40, 4, 20, 38);
  box(gArch, 200, 168, 18, 14, 12);
  box(gArch, 222, 164, 14, 12, 9);

  /* street traffic */
  Pcar(0.5, -220, -132);
  Pcar(0.5, 60, 122);
  Pcar(0.5, 118, -40, true);
  Pcar(0.5, -128, 220, true);

  /* ---------- project placeholders ----------
     PLACEHOLDER OBJECTS scattered through the blocks, one per project,
     clickable whenever they are on screen. Plinth + plain cube until
     Adam picks a real object per project: swap the two box() calls at
     a call site and the wiring keeps working. */
  function projectSpot(key, label, href, x, y, appear) {
    var g = pc((x + 12) + (y + 12), appear, { key: key, label: label + ' (project)', href: href });
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
  /* cookbook beside the pizzeria, handoff behind the office, housing
     among the southwest houses, songdle in the park */
  projectSpot('proj-cookbook', "Adam's Cookbook", 'projects/adams-cookbook/', -185, -60, 0.1);
  projectSpot('proj-handoff', 'Handoff', 'projects/handoff/', 60, -370, 0.2);
  projectSpot('proj-housing', 'Housing Dashboard', 'projects/housing-dashboard/', -300, 390, 0.4);
  projectSpot('proj-songdle', 'Songdle', 'projects/songdle/', 70, -30, 0.25);

  /* sort every piece back to front, then add to the world */
  pieces.sort(function (a, b) { return a.depth - b.depth; });
  pieces.forEach(function (p) { world.appendChild(p.g); });

  /* ============================================================
     FREE-ROAM CAMERA
     ============================================================ */
  var steps = document.querySelectorAll('.scene-steps .step');
  var spots = svg.querySelectorAll('.hotspot');
  var pops = world.querySelectorAll('.pop');

  var VIEW = [800, 460];
  var camX = 0, camY = 0;
  var targetX = 0, targetY = 0;
  var flying = false;
  var vx = 0, vy = 0;
  var dragging = false;
  var dragDist = 0;
  var lastPX = 0, lastPY = 0;

  /* the plate is a diamond in screen space, so clamp the camera to a
     shrunken diamond rather than a rectangle: no dragging into empty sky */
  var EXTPX = EXT * 2 * 0.866, EXTPY = EXT;
  var ROAM = 0.72;

  function clampCam() {
    var k = Math.abs(camX) / EXTPX + Math.abs(camY) / EXTPY;
    if (k > ROAM) {
      var f = ROAM / k;
      camX *= f;
      camY *= f;
    }
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

  /* step click flies the camera there; a second click once centered
     follows the link */
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
    root.setAttribute('transform',
      'translate(' + VIEW[0] + ' ' + (VIEW[1] - 40) + ') scale(0.85)');
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
