/* The line field — three flowing lines behind the cover, one per clock:
   honey (dough time), phosphor (job time), wafer (market time).
   Each line drifts continuously; how far across the screen it has drawn
   is scrubbed by scroll progress, with a bright "now" head at the tip.
   Static single frame under prefers-reduced-motion. */
(function () {
  'use strict';

  var canvas = document.querySelector('.linefield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LINES = [
    { color: '#C97C1B', base: 0.30, a1: 46, f1: 0.0038, s1: 0.00022, a2: 14, f2: 0.011, s2: -0.00035 },
    { color: '#57B78C', base: 0.54, a1: 34, f1: 0.0031, s1: -0.00018, a2: 18, f2: 0.009, s2: 0.00028 },
    { color: '#8FA3DE', base: 0.76, a1: 52, f1: 0.0026, s1: 0.00015, a2: 10, f2: 0.013, s2: -0.00024 }
  ];

  var W = 0, H = 0, DPR = 1;
  var mouseY = 0.5, driftY = 0.5;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (reduced) draw(0);
  }

  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var frac = reduced ? 1 : Math.min(1, 0.32 + 0.68 * Math.min(1, progress() * 1.5));
    driftY += (mouseY - driftY) * 0.04;
    var parallax = (driftY - 0.5) * 26;

    for (var i = 0; i < LINES.length; i++) {
      var L = LINES[i];
      var endX = W * frac;
      var yFor = function (x) {
        return H * L.base + parallax * (i - 1) +
          L.a1 * Math.sin(x * L.f1 + t * L.s1 + i * 2.1) +
          L.a2 * Math.sin(x * L.f2 + t * L.s2 + i * 4.7);
      };

      ctx.beginPath();
      for (var x = 0; x <= endX; x += 7) ctx.lineTo(x, yFor(x));
      ctx.lineTo(endX, yFor(endX));
      ctx.strokeStyle = L.color;
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      /* the "now" head at the tip of each clock */
      var hy = yFor(endX);
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.arc(endX, hy, 7, 0, Math.PI * 2);
      ctx.fillStyle = L.color;
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(endX, hy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  window.addEventListener('resize', resize);
  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      mouseY = e.clientY / Math.max(1, H);
    }, { passive: true });
  }

  resize();
  if (!reduced) {
    (function loop(now) {
      draw(now);
      requestAnimationFrame(loop);
    })(0);
  }
})();
