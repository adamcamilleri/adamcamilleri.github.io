/**
 * Shared Animation Foundation — ES Module
 *
 * Provides prefers-reduced-motion guard, GSAP ScrollTrigger helpers,
 * skeleton loading utilities, and a main init entry point.
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
 *   <script type="module">
 *     import { initScrollAnimations } from '/shared/animations.js';
 *     initScrollAnimations({ sections: '.section', cards: '.card' });
 *   </script>
 */

/* --------------------------------------------------------------------------
   1. Reduced-motion guard (ANIM-01 JS layer)
   -------------------------------------------------------------------------- */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Returns true if the user has NOT requested reduced motion.
 * All animation functions call this and return early when false.
 */
export function shouldAnimate() {
  return !prefersReducedMotion.matches;
}

/* --------------------------------------------------------------------------
   2. Timing constants (match CSS custom property values)
   -------------------------------------------------------------------------- */

const TIMING = {
  interaction: 0.2,
  entrance: 0.6,
  staggerDelay: 0.1,
};

const EASING = 'power2.out';

/* --------------------------------------------------------------------------
   3. GSAP availability check
   -------------------------------------------------------------------------- */

function gsapAvailable() {
  if (typeof gsap === 'undefined') {
    console.warn('[animations.js] GSAP not found on window. Load GSAP CDN before this module.');
    return false;
  }
  return true;
}

/* --------------------------------------------------------------------------
   4. Scroll reveal functions (ANIM-04 foundation)
   -------------------------------------------------------------------------- */

/**
 * Fade-and-slide elements into view as user scrolls.
 * @param {string} selector - CSS selector for target elements
 * @param {Object} [options={}] - Merged into ScrollTrigger config
 */
export function revealOnScroll(selector, options = {}) {
  if (!shouldAnimate()) return;
  if (!gsapAvailable()) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.from(selector, {
    opacity: 0,
    y: 30,
    duration: TIMING.entrance,
    ease: EASING,
    scrollTrigger: {
      trigger: selector,
      start: 'top 85%',
      once: true,
      ...options,
    },
  });
}

/**
 * Stagger-reveal a batch of card elements using ScrollTrigger.batch.
 * @param {string} selector - CSS selector for card elements
 */
export function staggerCards(selector) {
  if (!shouldAnimate()) return;
  if (!gsapAvailable()) return;

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.batch(selector, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) => {
      gsap.from(batch, {
        opacity: 0,
        y: 30,
        duration: TIMING.entrance,
        ease: EASING,
        stagger: TIMING.staggerDelay,
      });
    },
  });
}

/* --------------------------------------------------------------------------
   5. Skeleton loading utilities (ANIM-03 foundation)
   -------------------------------------------------------------------------- */

const SKELETON_MIN_DISPLAY_MS = 400;

/**
 * Show skeleton loading state on a container.
 * @param {HTMLElement} container - Element to mark as loading
 * @returns {number} Timestamp (Date.now()) for use with hideSkeleton
 */
export function showSkeleton(container) {
  container.classList.add('is-loading');
  container.classList.remove('is-loaded');
  return Date.now();
}

/**
 * Hide skeleton loading state, enforcing 400ms minimum display.
 * @param {HTMLElement} container - Element to mark as loaded
 * @param {number} startTime - Timestamp returned by showSkeleton
 */
export function hideSkeleton(container, startTime) {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, SKELETON_MIN_DISPLAY_MS - elapsed);

  setTimeout(() => {
    container.classList.remove('is-loading');
    container.classList.add('is-loaded');
  }, remaining);
}

/* --------------------------------------------------------------------------
   6. Init helper — main entry point for pages
   -------------------------------------------------------------------------- */

/**
 * Initialize scroll animations for a page.
 *
 * @param {Object} config
 * @param {string} [config.sections] - Selector for section elements to reveal
 * @param {string} [config.cards] - Selector for card elements to stagger
 * @param {string} [config.afterEvent] - CSS selector; wait for transitionend on
 *   this element before initializing (e.g., hero curtain)
 */
export function initScrollAnimations(config = {}) {
  if (!shouldAnimate()) return;

  function init() {
    if (config.sections) {
      revealOnScroll(config.sections);
    }
    if (config.cards) {
      staggerCards(config.cards);
    }
  }

  if (config.afterEvent) {
    const trigger = document.querySelector(config.afterEvent);
    if (trigger) {
      trigger.addEventListener('transitionend', () => init(), { once: true });
    } else {
      // Element not found — init immediately rather than never
      init();
    }
  } else {
    init();
  }
}
