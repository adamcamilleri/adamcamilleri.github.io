# Phase 3: Animation Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a shared animation system (shared/animations.js) with prefers-reduced-motion support, consistent hover/focus micro-interactions across all interactive elements, shimmer skeleton loading states for async operations (Handoff, Songdle, TaskMaster), and scroll-triggered entrance animations for the portfolio shell. Every project inherits correct motion behavior from the shared module.

</domain>

<decisions>
## Implementation Decisions

### Motion personality
- Smooth easing curves throughout — no spring-physics bounce or overshoot
- Consistent with portfolio's existing cubic-bezier(0.22, 1, 0.36, 1) curves
- Elegant, professional feel — think Linear/Stripe, not iOS bounce

### Hover/focus feedback
- Subtle lift + shadow: elements rise slightly (translateY -2px) with deepening shadow on hover
- Clean and professional — no scale or glow effects
- All interactive elements (buttons, cards, links) must have visible feedback

### Transition speed
- Claude decides per context — shorter durations (~200ms) for hover/interactive feedback, longer (~500-700ms) for scroll reveals and entrance animations
- Existing CSS custom properties (--transition-fast, --transition-normal, --transition-slow) can be kept or adjusted as needed

### Skeleton loading states
- Shimmer bars style — gray placeholder blocks with left-to-right shimmer sweep
- Content-shaped: skeletons mirror the actual content layout (circles for avatars, narrow bars for text, wide blocks for images)
- Quick crossfade transition (200-300ms) when real content replaces skeleton
- Minimum 400ms display time — prevents jarring flash on fast loads
- Required for: Handoff chat generation, Songdle audio fetch, TaskMaster list load

### Claude's Discretion
- Animation library choice (GSAP vs CSS-only vs Web Animations API) — roadmap mentions GSAP helpers but Claude can use what fits best
- Scroll entrance animation style (fade-up, slide-in, stagger, etc.)
- prefers-reduced-motion implementation approach (remove all motion vs reduce to subtle fades)
- Exact timing values and easing curves per animation type
- How the shared animations.js module is imported/consumed by each project

</decisions>

<specifics>
## Specific Ideas

- Motion should feel like Linear or Stripe — smooth, professional, never bouncy
- Skeleton loading inspired by Facebook/YouTube shimmer pattern
- Portfolio already has a hero curtain load animation and floating keyframes — new scroll animations should complement these, not fight them

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `style.css` CSS custom properties: `--transition-fast` (0.3s), `--transition-normal` (0.5s), `--transition-slow` (0.8s) — shared animation module should use or extend these
- Hero curtain animation (`style.css` lines 593-630): existing page-load animation pattern to build upon
- Floating keyframes (`@keyframes float`): decorative hero animation already in place

### Established Patterns
- All transitions currently inline in individual CSS files — no shared animation code exists
- Each project has its own `style.css` with inline transitions (typically 0.15s for UI feedback)
- No `prefers-reduced-motion` media query anywhere in the codebase
- No animation library (GSAP, etc.) installed — vanilla CSS transitions only
- Handoff has typing bounce keyframes; Songdle has transform-based hover feedback

### Integration Points
- `shared/animations.js` would be a new shared module — no `shared/` directory exists yet
- Portfolio shell: `index.html` + `style.css` for scroll reveals and entrance animations
- Handoff: `projects/handoff/script.js` (34KB) for chat loading skeleton
- Songdle: `projects/songdle/script.js` (33KB) for audio fetch skeleton
- TaskMaster: Next.js app at `projects/taskmaster/` — separate build system, different integration approach needed

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-animation-foundation*
*Context gathered: 2026-03-11*
