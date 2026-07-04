/* The line scene — vectr-style flowing 3D lines on a pale panel, fixed
   behind the hero. Red and blue curves drift in perspective; scroll
   scrubs how far each has drawn plus the camera drift, and the pointer
   adds parallax. Content below the hero covers the canvas as you scroll.
   Renders one static frame under prefers-reduced-motion. */
(function () {
  'use strict';

  var canvas = document.querySelector('.linefield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BG = '#D0E1EB';
  var RED = '#ff4d67';
  var BLUE = '#0e94fb';

  /* Each line lives in 3D: x runs across, y waves, z gives depth. */
  var LINES = [
    { color: RED,  y: -0.16, z: 1.9, a1: 0.34, f1: 1.6, s1: 0.00030, a2: 0.10, f2: 4.2, s2: -0.00052, w: 1.6 },
    { color: RED,  y: -0.05, z: 3.1, a1: 0.28, f1: 1.2, s1: -0.00022, a2: 0.13, f2: 3.1, s2: 0.00040, w: 1.2 },
    { color: RED,  y:  0.14, z: 4.6, a1: 0.42, f1: 0.9, s1: 0.00017, a2: 0.08, f2: 5.0, s2: -0.00033, w: 0.9 },
    { color: BLUE, y:  0.05, z: 1.6, a1: 0.30, f1: 1.4, s1: -0.00027, a2: 0.11, f2: 3.7, s2: 0.00047, w: 1.7 },
    { color: BLUE, y:  0.20, z: 2.8, a1: 0.36, f1: 1.1, s1: 0.00021, a2: 0.09, f2: 4.6, s2: -0.00038, w: 1.2 },
    { color: BLUE, y: -0.22, z: 4.1, a1: 0.26, f1: 1.8, s1: -0.00016, a2: 0.12, f2: 2.8, s2: 0.00029, w: 0.9 }
  ];
  var SEGMENTS = 130;

  var W = 0, H = 0;
  var mx = 0.5, my = 0.5, px = 0.5, py = 0.5;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced) draw(0);
  }

  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, window.scrollY / max) : 0;
  }

  /* Perspective projection: world (u across [-1..1], y, z) -> screen. */
  function project(u, y, z, camY) {
    var f = 1.9 / z;
    return {
      x: W * (0.5 + u * 0.62 * (0.6 + f * 0.4)),
      y: H * (0.52 + (y - camY) * f),
      f: f
    };
  }

  function draw(t) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    px += (mx - px) * 0.04;
    py += (my - py) * 0.04;
    var scroll = reduced ? 0.5 : progress();
    var frac = reduced ? 1 : Math.min(1, 0.30 + 0.70 * Math.min(1, scroll * 1.6));
    var camY = (py - 0.5) * 0.10 + scroll * 0.16;
    var camX = (px - 0.5) * 0.06;

    /* far lines first so near lines layer over them */
    var order = LINES.slice().sort(function (a, b) { return b.z - a.z; });

    for (var i = 0; i < order.length; i++) {
      var L = order[i];
      var pts = [];
      var n = Math.max(2, Math.floor(SEGMENTS * frac));
      for (var s = 0; s <= n; s++) {
        var u = -1.15 + (s / SEGMENTS) * 2.3;
        var y = L.y +
          L.a1 * 0.22 * Math.sin(u * L.f1 * Math.PI + t * L.s1 * 8 + L.z) +
          L.a2 * 0.22 * Math.sin(u * L.f2 * Math.PI + t * L.s2 * 8 + L.z * 2.3);
        var z = L.z + Math.sin(u * 1.3 + t * 0.00018 * 8 + L.z) * 0.5;
        pts.push(project(u + camX, y, z, camY));
      }

      /* glow pass, then core */
      ctx.beginPath();
      for (var k = 0; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.strokeStyle = L.color;
      ctx.lineWidth = L.w * 6;
      ctx.globalAlpha = 0.07;
      ctx.stroke();
      ctx.lineWidth = L.w * 1.5;
      ctx.globalAlpha = 0.28 + 0.30 / L.z;
      ctx.stroke();

      /* the bright head at the drawn tip */
      if (!reduced && frac < 1) {
        var tip = pts[pts.length - 1];
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 9 * tip.f, 0, Math.PI * 2);
        ctx.fillStyle = L.color;
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 2.6 * tip.f, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  window.addEventListener('resize', resize);
  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX / Math.max(1, W);
      my = e.clientY / Math.max(1, H);
    }, { passive: true });
  }

  resize();
  if (!reduced) {
    (function loop(now) {
      /* skip work once the hero has fully scrolled past */
      if (window.scrollY < window.innerHeight * 1.4) draw(now);
      requestAnimationFrame(loop);
    })(0);
  }
})();
