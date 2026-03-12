# Phase 3: Animation Foundation - Research

**Researched:** 2026-03-11
**Domain:** CSS/JS animation infrastructure, accessibility, loading UX
**Confidence:** HIGH

## Summary

Phase 3 builds a shared animation module (`shared/animations.js`) that all portfolio projects import, adding prefers-reduced-motion support, hover/focus micro-interactions, skeleton loading states, scroll-triggered entrance animations, and animated form feedback. The codebase currently has zero prefers-reduced-motion support, no shared animation code, and no skeleton loading patterns. Each project has inline CSS transitions but no coordinated animation system.

The recommended approach is GSAP 3.14.2 via CDN (no build step, no npm install for the portfolio shell) for scroll-triggered animations and orchestrated sequences, with pure CSS for hover/focus states, skeleton shimmers, and form focus rings. This keeps the no-build-step constraint intact while providing professional-grade scroll animation capabilities. TaskMaster (Next.js) is a special case -- it needs React-compatible skeleton components using Tailwind CSS, not the shared animations.js module.

**Primary recommendation:** Use GSAP 3.14.2 from jsDelivr CDN for scroll animations and orchestrated sequences; use pure CSS for everything else (hover states, skeletons, form feedback, prefers-reduced-motion). Create `shared/animations.js` as an ES Module that wraps GSAP helpers with automatic reduced-motion detection.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Motion personality: Smooth easing curves, no spring-physics bounce or overshoot. Consistent with portfolio's existing cubic-bezier(0.22, 1, 0.36, 1). Think Linear/Stripe, not iOS bounce.
- Hover/focus feedback: Subtle lift + shadow (translateY -2px with deepening shadow). No scale or glow effects. All interactive elements must have visible feedback.
- Skeleton loading states: Shimmer bars style with left-to-right sweep. Content-shaped skeletons. Quick crossfade (200-300ms) on content replace. Minimum 400ms display time. Required for: Handoff chat generation, Songdle audio fetch, TaskMaster list load.

### Claude's Discretion
- Animation library choice (GSAP vs CSS-only vs Web Animations API)
- Scroll entrance animation style (fade-up, slide-in, stagger, etc.)
- prefers-reduced-motion implementation approach (remove all motion vs reduce to subtle fades)
- Exact timing values and easing curves per animation type
- How the shared animations.js module is imported/consumed by each project

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANIM-01 | All animations respect prefers-reduced-motion | CSS media query + JS matchMedia detection in shared module; GSAP conditional registration |
| ANIM-02 | All interactive elements have hover/focus feedback | Pure CSS transitions with translateY(-2px) + box-shadow; shared CSS class or CSS custom properties |
| ANIM-03 | Async operations show skeleton/loading states | Pure CSS shimmer animation for vanilla projects; Tailwind skeleton for TaskMaster (React) |
| ANIM-04 | Page sections use scroll-triggered entrance animations | GSAP ScrollTrigger with fade-up pattern in shared/animations.js |
| MICRO-01 | Buttons and cards use spring-physics press/release | CONTEXT overrides: no spring physics. Use smooth press feedback (translateY + shadow) |
| MICRO-02 | Form inputs have animated focus states and validation feedback | Pure CSS focus ring animation + JS validation message transitions |
| MICRO-03 | Navigation transitions are smooth and contextual | CSS transitions on nav state changes; smooth scroll behavior |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.14.2 | Scroll-triggered entrance animations, orchestrated sequences | Framework-agnostic, works with vanilla JS, no build step via CDN. 2.7M weekly npm downloads. All plugins free since Webflow acquisition (Nov 2024). |
| GSAP ScrollTrigger | Bundled with 3.14.2 | Scroll-position-linked animation triggers | Industry standard for scroll animations. Handles viewport intersection, progress-based animation, batched element reveals. |
| CSS Custom Properties | Native | Shared timing/easing tokens across all stylesheets | Already in use (--transition-fast, etc.). Extend with animation-specific tokens. |
| IntersectionObserver | Native browser API | Lightweight scroll detection (for cases where GSAP is overkill) | 97%+ browser support. Zero weight. Used internally by GSAP ScrollTrigger anyway. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS @keyframes | Native | Skeleton shimmer, focus ring pulse | All loading states and form feedback -- no JS needed |
| matchMedia API | Native | JS-side prefers-reduced-motion detection | Controlling GSAP animations that can't be handled by CSS media query alone |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP ScrollTrigger | CSS scroll-driven animations | Only ~70% browser support (no Firefox/Safari stable). GSAP is safer cross-browser. |
| GSAP ScrollTrigger | Motion (vanilla API) inView | Motion's inView is 0.5kb but requires ESM bundler for best results; GSAP CDN simpler for this no-build project |
| Pure CSS skeletons | react-loading-skeleton | Only needed if TaskMaster skeletons get complex; pure Tailwind approach is simpler for a single component |

### CDN Installation (no build step)
```html
<!-- Add to each HTML page that needs scroll animations -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
<script type="module" src="/shared/animations.js"></script>
```

## Architecture Patterns

### Recommended Project Structure
```
shared/
├── animations.js        # ES Module: GSAP helpers + reduced-motion guard
├── animations.css       # Shared CSS: skeleton, hover, focus, reduced-motion
└── (future modules)     # Placeholder for shared/ directory

index.html               # Portfolio shell: adds GSAP CDN + shared imports
projects/handoff/         # Adds skeleton markup + imports shared CSS
projects/songdle/         # Adds skeleton markup + imports shared CSS
projects/taskmaster/src/  # React skeleton component (Tailwind, NOT shared/animations.js)
```

### Pattern 1: Reduced-Motion Guard (CSS + JS)
**What:** A two-layer approach: CSS media query removes all CSS animations/transitions for reduced-motion users; JS matchMedia prevents GSAP from running scroll animations.
**When to use:** Always. Every animation in the system goes through this guard.

```css
/* shared/animations.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```javascript
// shared/animations.js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function shouldAnimate() {
  return !prefersReducedMotion.matches;
}

// Guard all GSAP calls
export function fadeInOnScroll(selector, options = {}) {
  if (!shouldAnimate()) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(selector, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: selector,
      start: 'top 85%',
      ...options
    }
  });
}
```

### Pattern 2: Skeleton Loading with Minimum Display Time
**What:** Pure CSS shimmer skeleton shown during async operations. JS enforces 400ms minimum display before crossfade to real content.
**When to use:** Handoff chat generation, Songdle audio fetch, TaskMaster list load.

```css
/* shared/animations.css */
.skeleton {
  background: #e0e0e0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-text { height: 1em; margin-bottom: 0.5em; }
.skeleton-text--short { width: 60%; }
.skeleton-text--full { width: 100%; }
.skeleton-circle { border-radius: 50%; }
.skeleton-block { height: 120px; width: 100%; }
```

```javascript
// Minimum display time pattern
function showSkeleton(container) {
  container.classList.add('is-loading');
  return Date.now();
}

function hideSkeleton(container, startTime) {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, 400 - elapsed);
  setTimeout(() => {
    container.classList.remove('is-loading');
    container.classList.add('is-loaded');
  }, remaining);
}
```

### Pattern 3: Hover/Focus Feedback (Pure CSS)
**What:** Consistent lift + shadow on hover/focus for all interactive elements. Uses CSS custom properties for token consistency.
**When to use:** Every button, card, and link across all projects.

```css
/* shared/animations.css */
:root {
  --hover-lift: -2px;
  --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --focus-ring-color: var(--primary-color, #2196F3);
  --interaction-duration: 0.2s;
  --interaction-easing: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Apply to buttons and cards */
.interactive {
  transition:
    transform var(--interaction-duration) var(--interaction-easing),
    box-shadow var(--interaction-duration) var(--interaction-easing);
}

.interactive:hover {
  transform: translateY(var(--hover-lift));
  box-shadow: var(--hover-shadow);
}

.interactive:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.interactive:active {
  transform: translateY(0);
  box-shadow: none;
}
```

### Pattern 4: Animated Form Focus Rings
**What:** Inputs show a smooth border-color transition and subtle expansion on focus, with animated inline validation.
**When to use:** Contact form on portfolio shell, Handoff onboarding inputs.

```css
input, textarea {
  border: 1px solid #ccc;
  transition:
    border-color var(--interaction-duration) var(--interaction-easing),
    box-shadow var(--interaction-duration) var(--interaction-easing);
}

input:focus, textarea:focus {
  border-color: var(--focus-ring-color);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
  outline: none;
}

.validation-message {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.2s ease;
}

.validation-message.is-visible {
  max-height: 2em;
  opacity: 1;
}
```

### Anti-Patterns to Avoid
- **Spring physics / bounce on hover:** User explicitly rejected this. Use smooth easing only.
- **Scale transforms on hover:** User explicitly wants translateY + shadow, not scale.
- **`will-change` on everything:** Only apply to elements during animation, remove after.
- **Skeleton flash on fast loads:** The 400ms minimum display time prevents this.
- **Animation on `*` selector:** The reduced-motion reset targets duration, not removal -- this prevents layout shifts from elements snapping to final state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-triggered reveals | Custom IntersectionObserver + class toggling | GSAP ScrollTrigger `batch()` | Handles stagger timing, easing, cleanup, and edge cases (fast scrolling, resize) automatically |
| Reduced-motion detection | Manual boolean flag checked everywhere | Centralized `shouldAnimate()` guard + CSS media query | Single source of truth; CSS handles CSS animations, JS handles GSAP |
| Skeleton shimmer animation | JavaScript-animated gradient | CSS `@keyframes` with `transform: translateX()` | Runs on compositor thread, zero JS overhead, works even if JS fails |
| Minimum display timer | Inline setTimeout scattered across fetches | `showSkeleton`/`hideSkeleton` utility pair | Encapsulates the 400ms floor logic in one place |

**Key insight:** CSS handles most animation work in this phase (hover, focus, skeleton, reduced-motion). GSAP is only needed for scroll-triggered entrance animations where timing and stagger matter. Don't reach for JS when CSS does it better.

## Common Pitfalls

### Pitfall 1: Reduced-Motion Breaks Layout
**What goes wrong:** Using `animation: none !important` causes elements that rely on animation for their final position to snap to wrong locations.
**Why it happens:** Some entrance animations set `opacity: 0` or `transform: translateY(30px)` as starting state in CSS, then animate to final state.
**How to avoid:** Never set animation start states in CSS. Set them only via GSAP (which won't fire when reduced-motion is on). Elements default to their natural visible position. The CSS reset uses `animation-duration: 0.01ms` instead of `none` so the animation still completes instantly to its end state.
**Warning signs:** Elements invisible or mispositioned on page load with reduced motion enabled.

### Pitfall 2: Skeleton Flash on Fast Connections
**What goes wrong:** Skeleton appears for 50ms then disappears, creating a jarring flash worse than no skeleton at all.
**Why it happens:** Fetch completes before the skeleton has time to register visually.
**How to avoid:** Enforce 400ms minimum display time (as specified in CONTEXT.md decisions). Track when skeleton was shown, delay content reveal if needed.
**Warning signs:** Testing on localhost where API responses are <50ms.

### Pitfall 3: GSAP CDN Race Condition
**What goes wrong:** `shared/animations.js` executes before GSAP CDN script has loaded, throwing `gsap is not defined`.
**Why it happens:** `<script type="module">` is deferred by default, but if GSAP CDN `<script>` is also deferred or placed after the module, load order isn't guaranteed.
**How to avoid:** Place GSAP CDN scripts (non-module, synchronous) before the module script in HTML. GSAP `<script>` tags load synchronously by default, so they'll be ready before the deferred module executes.
**Warning signs:** Intermittent "gsap is not defined" errors in console.

### Pitfall 4: TaskMaster Integration Mismatch
**What goes wrong:** Trying to import `shared/animations.js` into the Next.js TaskMaster app fails because it expects GSAP on `window`.
**Why it happens:** TaskMaster is a Next.js 14 app with its own build system (Tailwind, TypeScript). It doesn't load scripts from the portfolio root.
**How to avoid:** TaskMaster gets its own skeleton component using Tailwind CSS utilities. Don't try to share the vanilla JS module with a React/Next.js app. The "shared" module is for vanilla HTML projects only.
**Warning signs:** Build errors in TaskMaster, hydration mismatches.

### Pitfall 5: Portfolio Shell Hero Curtain Conflict
**What goes wrong:** New scroll entrance animations fight with the existing hero curtain load animation.
**Why it happens:** The hero curtain uses `position: fixed` and `z-index: 9999` with a timing sequence. If scroll animations initialize before the curtain completes, visible elements animate behind the curtain.
**How to avoid:** Delay GSAP ScrollTrigger initialization until after the hero curtain animation completes. Listen for the curtain's `transitionend` event or use a timeout matching the curtain duration.
**Warning signs:** Elements visibly animating behind or through the dark curtain overlay.

### Pitfall 6: Hardcoded Timing Fights CSS Custom Properties
**What goes wrong:** GSAP animations use hardcoded durations that don't match the CSS custom property values, creating inconsistent motion feel.
**Why it happens:** GSAP `duration` is set in JS, CSS transitions use `var(--transition-fast)`.
**How to avoid:** Define timing constants in `shared/animations.js` that mirror the CSS custom property values. Document the mapping. Consider reading CSS custom property values with `getComputedStyle` if precision matters.
**Warning signs:** Some hover effects feel snappy while scroll animations feel sluggish (or vice versa).

## Code Examples

### Scroll Entrance Animation (Portfolio Shell)
```javascript
// shared/animations.js
// Source: GSAP ScrollTrigger docs + project CONTEXT decisions

const TIMING = {
  interaction: 0.2,    // matches --interaction-duration
  entrance: 0.6,       // scroll reveals
  staggerDelay: 0.1,   // between items in a group
};

const EASING = 'power2.out'; // smooth, no bounce -- matches Linear/Stripe feel

export function revealOnScroll(selector) {
  if (!shouldAnimate()) return;
  gsap.registerPlugin(ScrollTrigger);

  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  gsap.from(elements, {
    opacity: 0,
    y: 30,
    duration: TIMING.entrance,
    stagger: TIMING.staggerDelay,
    ease: EASING,
    scrollTrigger: {
      trigger: elements[0].parentElement || elements[0],
      start: 'top 85%',
      once: true,
    }
  });
}

export function staggerCards(selector) {
  if (!shouldAnimate()) return;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.batch(selector, {
    onEnter: (batch) => {
      gsap.from(batch, {
        opacity: 0,
        y: 30,
        duration: TIMING.entrance,
        stagger: TIMING.staggerDelay,
        ease: EASING,
      });
    },
    start: 'top 85%',
    once: true,
  });
}
```

### Skeleton Markup (Handoff Chat)
```html
<!-- Content-shaped skeleton for Handoff chat response area -->
<div class="chat-skeleton" id="chatSkeleton">
  <div class="skeleton skeleton-circle" style="width:32px;height:32px"></div>
  <div style="flex:1">
    <div class="skeleton skeleton-text skeleton-text--short"></div>
    <div class="skeleton skeleton-text skeleton-text--full"></div>
    <div class="skeleton skeleton-text skeleton-text--full"></div>
    <div class="skeleton skeleton-text skeleton-text--short"></div>
  </div>
</div>
```

### TaskMaster Skeleton (React/Tailwind)
```tsx
// projects/taskmaster/src/components/TaskListSkeleton.tsx
export function TaskListSkeleton() {
  return (
    <div className="space-y-3 py-4" aria-label="Loading tasks">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a1a1a]">
          <div className="w-5 h-5 rounded bg-[#333] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#333] rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Nav Smooth Transitions (MICRO-03)
```css
/* Smooth active state transitions for navigation */
.nav-link {
  position: relative;
  transition: color var(--interaction-duration) var(--interaction-easing);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width var(--interaction-duration) var(--interaction-easing);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AOS / ScrollMagic libraries | GSAP ScrollTrigger or native CSS scroll-driven animations | 2022-2024 | AOS and ScrollMagic are unmaintained; GSAP is actively developed and now free |
| jQuery `.animate()` | GSAP, Web Animations API, CSS transitions | 2018+ | jQuery animation is slow and limited |
| `animation: none` for reduced motion | `animation-duration: 0.01ms` | 2023+ | Prevents layout breaks from animations that set final position |
| Spinner loading indicators | Content-shaped skeleton loaders | 2020+ | Skeletons reduce perceived load time by 20-30% (Facebook research) |
| `outline: none` for focus | `focus-visible` + styled outline | 2023+ | Accessible focus indication without mouse-click outlines |
| GSAP premium plugins (paid) | All plugins free | Nov 2024 | ScrollTrigger, Flip, etc. no longer require license |

**Deprecated/outdated:**
- ScrollMagic: Last commit 2020, broken with modern GSAP
- AOS: Simple but limited, fights custom animation code
- `transition: all` everywhere: Causes unintended property animations, prefer explicit properties

## Open Questions

1. **MICRO-01 spring-physics conflict with CONTEXT decisions**
   - What we know: REQUIREMENTS.md says "spring-physics press/release" but CONTEXT.md says "no spring-physics bounce or overshoot" and "smooth easing curves throughout"
   - What's unclear: Which takes precedence
   - Recommendation: CONTEXT.md was gathered after REQUIREMENTS.md and represents the user's refined preference. Implement smooth press feedback (translateY + shadow reduction on :active) instead of spring physics. The planner should treat CONTEXT.md as the authority.

2. **TaskMaster skeleton scope**
   - What we know: TaskMaster list load shows "Loading..." text. It's a Next.js app with Tailwind.
   - What's unclear: How deep the skeleton integration should go (just the task list? also the login page?)
   - Recommendation: Task list skeleton only (the primary content load). Login "Please wait..." is a button state, not a content load.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + Cypress 13 |
| Config file | package.json (Jest), cypress.config.js (Cypress) |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANIM-01 | Reduced motion disables all animations | e2e | `npx cypress run --spec cypress/e2e/reduced-motion.cy.js` | No -- Wave 0 |
| ANIM-02 | Interactive elements have hover/focus feedback | e2e | `npx cypress run --spec cypress/e2e/interactions.cy.js` | No -- Wave 0 |
| ANIM-03 | Skeleton states shown during async ops | e2e | `npx cypress run --spec cypress/e2e/skeleton-loading.cy.js` | No -- Wave 0 |
| ANIM-04 | Scroll-triggered entrance animations fire | e2e | `npx cypress run --spec cypress/e2e/scroll-animations.cy.js` | No -- Wave 0 |
| MICRO-01 | Press feedback on buttons/cards | e2e | `npx cypress run --spec cypress/e2e/interactions.cy.js` | No -- Wave 0 |
| MICRO-02 | Animated form focus/validation | e2e | `npx cypress run --spec cypress/e2e/form-feedback.cy.js` | No -- Wave 0 |
| MICRO-03 | Smooth nav transitions | manual-only | Visual inspection of nav hover/active states | N/A |

### Sampling Rate
- **Per task commit:** `npm test` (existing tests stay green)
- **Per wave merge:** `npm test && npx cypress run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `cypress/e2e/reduced-motion.cy.js` -- covers ANIM-01 (Cypress can emulate prefers-reduced-motion via `cy.wrap(window).then(win => win.matchMedia(...))` or `Cypress.automation('emulate:media')`)
- [ ] `cypress/e2e/interactions.cy.js` -- covers ANIM-02, MICRO-01 (verify hover/focus CSS changes)
- [ ] `cypress/e2e/skeleton-loading.cy.js` -- covers ANIM-03 (intercept API calls, verify skeleton visible, verify content replaces skeleton)
- [ ] `cypress/e2e/scroll-animations.cy.js` -- covers ANIM-04 (scroll viewport, verify elements become visible)
- [ ] `cypress/e2e/form-feedback.cy.js` -- covers MICRO-02 (focus inputs, check validation message visibility)

## Sources

### Primary (HIGH confidence)
- [GSAP jsDelivr CDN](https://www.jsdelivr.com/package/npm/gsap) -- version 3.14.2 confirmed, CDN URLs verified
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) -- API patterns, batch() method
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) -- media query syntax, browser support
- [W3C WCAG C39 technique](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) -- reduced-motion implementation standard
- Existing project research: `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`

### Secondary (MEDIUM confidence)
- [Pope Tech accessible animation guide (2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) -- reduced-motion best practices
- [CSS-Tricks prefers-reduced-motion](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) -- pattern examples
- [Pure CSS skeleton shimmer (Medium)](https://codewithbilal.medium.com/how-to-create-a-skeleton-loading-shimmer-effect-with-pure-css-7f9041ec9134) -- shimmer implementation pattern

### Tertiary (LOW confidence)
- None -- all findings verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- GSAP version, CDN URLs, and licensing verified via jsDelivr and official docs
- Architecture: HIGH -- patterns derived from existing codebase analysis + GSAP official docs + project CONTEXT decisions
- Pitfalls: HIGH -- identified from codebase inspection (hero curtain, TaskMaster Next.js mismatch, CSS custom property values)
- Validation: MEDIUM -- Cypress reduced-motion emulation approach needs verification during implementation

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable technologies, 30-day window)
