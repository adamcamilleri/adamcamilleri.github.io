/* Shared behavior for the editorial site: run-log stamping + section reveals.
   Everything degrades to fully-visible content without JS or IntersectionObserver. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduced) {
    document.querySelectorAll('.runlog li').forEach(function (el) { el.classList.add('logged'); });
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
    return;
  }

  /* Run-log entries stamp in one by one, like lines being committed. */
  var logs = document.querySelectorAll('.runlog ol');
  logs.forEach(function (list) {
    var items = list.querySelectorAll('li');
    var logObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        items.forEach(function (item, i) {
          setTimeout(function () { item.classList.add('logged'); }, i * 110);
        });
        obs.disconnect();
      });
    }, { threshold: 0.1 });
    logObserver.observe(list);
  });

  /* Article sections reveal on scroll. */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
})();
