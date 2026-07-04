/* Lenis-style inertial scrolling, dependency-free.
   Only the wheel is intercepted and lerped; keyboard, touch, scrollbar,
   and anchor navigation stay fully native so accessibility is unaffected.
   Skipped entirely on touch devices and under prefers-reduced-motion. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  var target = window.scrollY;
  var current = target;
  var raf = null;
  var animating = false;

  function maxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }
  function clamp(v) {
    return Math.max(0, Math.min(maxScroll(), v));
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return; /* leave pinch-zoom alone */
    e.preventDefault();
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    target = clamp(target + dy);
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: false });

  /* Keep in sync when scrolling happens natively (keys, scrollbar, anchors). */
  window.addEventListener('scroll', function () {
    if (!animating) current = target = window.scrollY;
  }, { passive: true });

  function step() {
    animating = true;
    current += (target - current) * 0.11;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      window.scrollTo({ top: current, left: 0, behavior: 'instant' });
      raf = null;
      animating = false;
      return;
    }
    window.scrollTo({ top: current, left: 0, behavior: 'instant' });
    raf = requestAnimationFrame(step);
  }
})();
