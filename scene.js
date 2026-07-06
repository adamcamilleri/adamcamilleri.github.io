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
     DRIVING: a car you steer around the city, camera following
     ============================================================ */
  var steps = document.querySelectorAll('.scene-steps .step');
  var spots = svg.querySelectorAll('.hotspot');
  var pops = world.querySelectorAll('.pop');

  var spotByKey = {};
  spots.forEach(function (g) { spotByKey[g.dataset.key] = g; });

  var VIEW = [800, 460];
  var camX = 0, camY = 0;

  function render() {
    root.setAttribute('transform',
      'translate(' + (VIEW[0] - camX).toFixed(2) + ' ' + (VIEW[1] - camY).toFixed(2) + ')');
  }

  /* clickable destinations in world space (buildings + projects) */
  var TARGETS = [
    { key: 'pizza', x: -320, y: 10, r: 95, href: 'pizza/' },
    { key: 'data', x: -12, y: -257, r: 95, href: 'work/' },
    { key: 'invest', x: 235, y: -258, r: 100, href: 'investing/' },
    { key: 'archive', x: 242, y: 226, r: 95, href: '#archive' },
    { key: 'proj-cookbook', x: -185, y: -60, r: 58, href: 'projects/adams-cookbook/' },
    { key: 'proj-handoff', x: 60, y: -370, r: 58, href: 'projects/handoff/' },
    { key: 'proj-housing', x: -300, y: 390, r: 58, href: 'projects/housing-dashboard/' },
    { key: 'proj-songdle', x: 70, y: -30, r: 55, href: 'projects/songdle/' }
  ];

  var hoverKey = null;
  var nearTarget = null;

  function paint() {
    var key = hoverKey || (nearTarget && nearTarget.key);
    steps.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
    spots.forEach(function (s) { s.classList.toggle('hot', s.dataset.key === key); });
  }

  /* mouse users keep hover + click; keyboard Enter still opens a focused one */
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
  });

  /* ---------- reduced motion: static city, no car ---------- */
  if (reduced) {
    root.setAttribute('transform',
      'translate(' + VIEW[0] + ' ' + (VIEW[1] - 40) + ') scale(0.85)');
    pops.forEach(function (g) { g.classList.add('on'); });
    paint();
    return;
  }

  pops.forEach(function (g) {
    setTimeout(function () { g.classList.add('on'); },
      300 + parseFloat(g.dataset.appear) * 2400);
  });

  /* ---------- the car ---------- */
  var carG = el('g', { 'aria-hidden': 'true' }, world);
  var CAR_TOP = '#4038d8', CAR_SIDE = '#2a2496';
  var CAB_TOP = '#dfe7f5', CAB_SIDE = '#aebfd4';

  function carBox(cx, cy, hd, hl, hw, z0, h, topFill, sideFill) {
    var cos = Math.cos(hd), sin = Math.sin(hd);
    function corner(fl, fw, z) {
      return P(cx + fl * cos - fw * sin, cy + fl * sin + fw * cos, z);
    }
    /* only the two camera-facing side walls (outward normal toward the
       viewer, i.e. nx + ny > 0) are drawn, so a turning car looks solid */
    var walls = [
      [hl, -hw, hl, hw, cos, sin],       /* front */
      [-hl, hw, -hl, -hw, -cos, -sin],   /* back */
      [-hl, -hw, hl, -hw, sin, -cos],    /* right */
      [hl, hw, -hl, hw, -sin, cos]       /* left */
    ];
    walls.forEach(function (w) {
      if (w[4] + w[5] <= 0) return;
      face(carG, [corner(w[0], w[1], z0 + h), corner(w[2], w[3], z0 + h),
        corner(w[2], w[3], z0), corner(w[0], w[1], z0)], sideFill);
    });
    face(carG, [corner(hl, -hw, z0 + h), corner(hl, hw, z0 + h),
      corner(-hl, hw, z0 + h), corner(-hl, -hw, z0 + h)], topFill);
  }

  function drawCar(cx, cy, hd) {
    while (carG.firstChild) carG.removeChild(carG.firstChild);
    var s = P(cx, cy, 0);
    el('ellipse', { cx: s[0], cy: s[1], rx: 20, ry: 10, fill: SHADOW }, carG);
    carBox(cx, cy, hd, 15, 8, 2, 6, CAR_TOP, CAR_SIDE);
    carBox(cx - 2 * Math.cos(hd), cy - 2 * Math.sin(hd), hd, 8, 6.5, 8, 5, CAB_TOP, CAB_SIDE);
  }

  /* keep the car depth-sorted so it drives behind buildings in front of it */
  var lastIdx = -1;
  function placeCar(cx, cy) {
    var depth = cx + cy;
    var idx = pieces.length;
    for (var i = 0; i < pieces.length; i++) {
      if (pieces[i].depth > depth) { idx = i; break; }
    }
    if (idx === lastIdx) return;
    lastIdx = idx;
    if (idx >= pieces.length) world.appendChild(carG);
    else world.insertBefore(carG, pieces[idx].g);
  }

  /* ---------- physics ---------- */
  var car = { x: -300, y: 130, hd: -0.6, sp: 0 };
  var input = { fwd: 0, turn: 0 };
  var MAXF = 300, MAXR = 140, ACC = 520, BRK = 460;

  function driveStep(dt) {
    if (input.fwd > 0) car.sp = Math.min(MAXF, car.sp + ACC * dt);
    else if (input.fwd < 0) car.sp = Math.max(-MAXR, car.sp - BRK * dt);
    else car.sp -= car.sp * Math.min(1, 3 * dt);
    car.sp *= (1 - Math.min(1, 0.55 * dt));
    if (input.fwd === 0 && Math.abs(car.sp) < 1.5) car.sp = 0;

    var grip = Math.max(-1, Math.min(1, car.sp / 80));
    car.hd += input.turn * 2.6 * dt * grip;

    car.x += Math.cos(car.hd) * car.sp * dt;
    car.y += Math.sin(car.hd) * car.sp * dt;

    var k = Math.abs(car.x) / (EXT - 30) + Math.abs(car.y) / (EXT - 30);
    if (k > 1) { car.x /= k; car.y /= k; car.sp *= 0.4; }
  }

  /* ---------- parked-on-a-destination hint ---------- */
  var hint = document.getElementById('driveHint');
  function checkNear() {
    var best = null, bestD = 1e9;
    for (var i = 0; i < TARGETS.length; i++) {
      var t = TARGETS[i], dx = car.x - t.x, dy = car.y - t.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < t.r && d < bestD) { bestD = d; best = t; }
    }
    if ((best && best.key) === (nearTarget && nearTarget.key)) return;
    nearTarget = best;
    paint();
    if (!hint) return;
    if (best) {
      var g = spotByKey[best.key];
      var label = g ? g.getAttribute('aria-label').replace(' (project)', '').split(':')[0] : '';
      hint.textContent = 'Press Enter to open ' + label;
      hint.classList.add('show');
    } else {
      hint.classList.remove('show');
    }
  }

  /* ---------- input (keys drive only while the map is in view) ---------- */
  var pressed = {};
  var sceneActive = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      sceneActive = e[0].intersectionRatio > 0.4;
      if (!sceneActive) { pressed = {}; readInput(); }
    }, { threshold: [0, 0.4, 0.8] }).observe(document.querySelector('.scene-journey'));
  }
  function readInput() {
    input.fwd = (pressed.up ? 1 : 0) - (pressed.down ? 1 : 0);
    input.turn = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0);
  }
  function keyDir(k) {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up';
    if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left';
    if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right';
    return null;
  }
  window.addEventListener('keydown', function (e) {
    if (!sceneActive || (e.target && e.target.matches && e.target.matches('input, textarea'))) return;
    if (e.key === 'Enter' && nearTarget) { window.location.href = nearTarget.href; return; }
    var d = keyDir(e.key);
    if (!d) return;
    pressed[d] = true; readInput(); e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    var d = keyDir(e.key);
    if (!d) return;
    pressed[d] = false; readInput();
  });

  /* touch d-pad */
  document.querySelectorAll('.pad-btn').forEach(function (btn) {
    var d = btn.dataset.dir;
    var on = function (e) { e.preventDefault(); pressed[d] = true; readInput(); };
    var off = function (e) { e.preventDefault(); pressed[d] = false; readInput(); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  });
  var goBtn = document.getElementById('padGo');
  if (goBtn) goBtn.addEventListener('click', function () { if (nearTarget) window.location.href = nearTarget.href; });

  /* ---------- loop ---------- */
  var cs0 = P(car.x, car.y, 0);
  camX = cs0[0]; camY = cs0[1];
  render();
  drawCar(car.x, car.y, car.hd);
  placeCar(car.x, car.y);

  var prev = 0;
  function frame(ts) {
    var dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
    prev = ts;
    driveStep(dt);
    drawCar(car.x, car.y, car.hd);
    placeCar(car.x, car.y);
    var cs = P(car.x, car.y, 0);
    camX += (cs[0] - camX) * 0.12;
    camY += (cs[1] - camY) * 0.12;
    render();
    checkNear();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
