/* Kinetic type engine — one splitter, four behaviors, each keyed to its page's
   subject via data-kinetic on the headline:
     "dough"    letters squish + soften near the cursor (Fraunces wght/SOFT axes)
     "decode"   terminal boot: chars cycle mono glyphs, settle left to right
     "compound" chars gain weight on an accelerating curve; hold to keep compounding
     "wave"     hover ripple (used on the cover's TOC titles)
   Everything is skipped under prefers-reduced-motion; headlines keep their
   full text in an aria-label so splitting never changes what screen readers hear. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE_OUT = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- splitter ---------- */
  function split(el) {
    if (el.dataset.ktDone) return [];
    el.dataset.ktDone = '1';
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var chars = [];
    var i = 0;

    function walk(node, target) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          child.textContent.split('').forEach(function (c) {
            if (/\s/.test(c)) { frag.appendChild(document.createTextNode(c)); return; }
            var s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            s.style.setProperty('--i', i++);
            frag.appendChild(s);
            chars.push(s);
          });
          target.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child, child);
        }
      });
    }

    var wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    while (el.firstChild) wrap.appendChild(el.firstChild);
    el.appendChild(wrap);
    el.setAttribute('aria-label', label);
    walk(wrap, wrap);
    el.classList.add('kt');
    return chars;
  }

  /* ---------- entrance: per-char 3D flip ---------- */
  function flipIn(el, chars, done) {
    el.classList.add('kt-persp', 'kt-enter');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('kt-go');
        var total = chars.length * 26 + 750;
        setTimeout(function () {
          el.classList.remove('kt-enter', 'kt-go');
          if (done) done();
        }, total);
      });
    });
  }

  /* ---------- dough: cursor-proximity squish ---------- */
  function dough(el, chars) {
    if (!finePointer) return;
    var R = 150;
    var state = chars.map(function () { return 0; });
    var mx = -9999, my = -9999, raf = null, idleFrames = 0;

    function frame() {
      var active = false;
      for (var k = 0; k < chars.length; k++) {
        var r = chars[k].getBoundingClientRect();
        var dx = mx - (r.left + r.width / 2);
        var dy = my - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy);
        var target = Math.max(0, 1 - d / R);
        state[k] += (target - state[k]) * 0.16;
        var v = state[k];
        if (v > 0.004) {
          active = true;
          chars[k].style.fontVariationSettings =
            '"opsz" 144, "SOFT" ' + (60 + 40 * v).toFixed(1) + ', "wght" ' + (640 + 150 * v).toFixed(0);
          chars[k].style.transform =
            'translateY(' + (0.07 * v).toFixed(3) + 'em) scaleY(' + (1 - 0.11 * v).toFixed(3) + ')';
        } else if (chars[k].style.transform) {
          chars[k].style.fontVariationSettings = '';
          chars[k].style.transform = '';
        }
      }
      idleFrames = active ? 0 : idleFrames + 1;
      raf = idleFrames < 30 ? requestAnimationFrame(frame) : null;
    }

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* ---------- decode: terminal glyph scramble ---------- */
  function decode(el, chars) {
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&+=*/';
    var finals = chars.map(function (c) { return c.textContent; });
    var settled = chars.map(function () { return false; });
    var t0 = null;

    chars.forEach(function (c) { c.classList.add('scr'); });

    function frame(now) {
      if (!t0) t0 = now;
      var elapsed = now - t0;
      var allDone = true;
      for (var k = 0; k < chars.length; k++) {
        if (settled[k]) continue;
        if (elapsed > 380 + k * 55) {
          settled[k] = true;
          chars[k].textContent = finals[k];
          chars[k].classList.remove('scr');
        } else {
          allDone = false;
          if (Math.random() < 0.5) {
            chars[k].textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
      }
      if (!allDone) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- compound: weight grows on an accelerating curve ---------- */
  function compound(el, chars) {
    var BASE = 300, REST = 640, MAX = 900, DUR = 900;
    var w = chars.map(function () { return BASE; });
    var target = chars.map(function () { return REST; });
    var start = chars.map(function (_, k) { return 250 * Math.pow(1.12, k); });
    var holding = false, raf = null, t0 = null;

    function apply(k) {
      chars[k].style.fontVariationSettings =
        '"opsz" 144, "SOFT" 60, "wght" ' + w[k].toFixed(0);
    }
    chars.forEach(function (_, k) { apply(k); });

    function frame(now) {
      if (!t0) t0 = now;
      var elapsed = now - t0;
      var busy = false;
      for (var k = 0; k < chars.length; k++) {
        if (holding) target[k] = Math.min(MAX, target[k] + 1.6);
        var p = Math.min(1, Math.max(0, (elapsed - start[k]) / DUR));
        var eased = BASE + (target[k] - BASE) * EASE_OUT(p);
        if (p < 1 || Math.abs(eased - w[k]) > 0.5 || holding) {
          w[k] = p < 1 ? eased : w[k] + (target[k] - w[k]) * 0.1;
          apply(k);
          busy = true;
        }
      }
      raf = (busy || holding) ? requestAnimationFrame(frame) : null;
    }
    function ensure() { if (!raf) raf = requestAnimationFrame(frame); }
    ensure();

    /* Hold to keep compounding — pointer or keyboard. Gains are never reset. */
    el.classList.add('kt-holdable');
    el.setAttribute('tabindex', '0');
    var down = function (e) { holding = true; ensure(); if (e.type === 'keydown') e.preventDefault(); };
    var up = function () { holding = false; };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') down(e); });
    el.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') up(); });
  }

  /* ---------- wire up ---------- */
  document.querySelectorAll('[data-kinetic]').forEach(function (el) {
    var mode = el.dataset.kinetic;
    var chars = split(el);
    if (!chars.length) return;
    if (mode === 'dough') {
      flipIn(el, chars, function () { dough(el, chars); });
    } else if (mode === 'decode') {
      decode(el, chars);
    } else if (mode === 'compound') {
      compound(el, chars);
    } else if (mode === 'wave') {
      /* CSS-driven hover ripple; splitting is all it needs */
    } else {
      flipIn(el, chars);
    }
  });
})();
