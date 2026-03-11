# Feature Research

**Domain:** Developer portfolio with animation/polish layer and Claude Code developer tooling
**Researched:** 2026-03-11
**Confidence:** HIGH (animation/accessibility patterns), MEDIUM (Claude Code tooling patterns — official docs verified)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that recruiters, clients, and peers expect from a 2026 developer portfolio. Missing these signals lack of care.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Smooth section scroll with active nav highlighting | Any modern site has this; jarring jumps feel broken | LOW | Already partially present — needs tightening |
| Button/link hover feedback | Standard affordance; bare states feel unfinished | LOW | CSS `transition` on `transform` + `opacity`; 150-200ms duration |
| Loading/skeleton states on async operations | Chat, deploy, and song-fetch all hit APIs; blank states feel broken | MEDIUM | Handoff chat, Songdle fetch, TaskMaster API calls all need this |
| Mobile-responsive layout with touch-friendly targets | 50%+ of portfolio viewers are on mobile | LOW | Existing layout needs audit for min tap-target size (44px WCAG) |
| `prefers-reduced-motion` support | WCAG 2.3.3; vestibular disorder users; also signals craft | LOW | Wrap all animation in `@media (prefers-reduced-motion: no-preference)` — default to no animation |
| Consistent visual feedback on form submission | Contact form success/error state must be explicit | LOW | EmailJS already present; need clear success UI |
| Page/section entrance animations (fade/slide-in) | Standard baseline for polished sites since 2020 | LOW | Intersection Observer + CSS class toggle is sufficient for portfolio shell |
| Smooth image/card hover states on project grid | Users expect project cards to respond to hover | LOW | CSS `transform: translateY` + `box-shadow` transition |

---

### Differentiators (Competitive Advantage)

Features that make a portfolio memorable and demonstrate front-end engineering depth. Align with PROJECT.md core value: "visitor immediately thinks this person ships quality work."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hero curtain/reveal entrance animation (already built) | Memorable first impression; signals custom craft over template | MEDIUM | Already exists (`hero-curtain`, `animate-reveal` classes) — refine timing and easing |
| Spring-physics micro-interactions on interactive elements | Feels alive; distinguishes hand-built from library-default | HIGH | GSAP with `elastic` ease, or CSS `spring()` (limited support) — target: Handoff chat send button, Songdle guess submit |
| Scroll-triggered content reveals with staggered timing | Makes scrolling feel narrative and intentional | MEDIUM | GSAP ScrollTrigger OR native CSS scroll-driven animations (Chrome-only currently); GSAP safer for cross-browser |
| Skeleton/shimmer loading UI on project demos | Shows loading state feels polished, not broken | MEDIUM | CSS `@keyframes` shimmer — implement on Songdle audio load, Handoff generation, TaskMaster list fetch |
| Gesture-driven interactions (drag-to-reveal, swipe on mobile) | Demonstrates advanced UI thinking — rare in portfolios | HIGH | Only worth adding to Connect Four or Songdle; avoid overuse |
| Audio waveform visualizer in Songdle | Shows off audio API capability; highly memorable demo | HIGH | Web Audio API `AnalyserNode` + Canvas; applies directly to Songdle's domain |
| Real-time animated deploy progress in Handoff | Makes AI builder feel premium vs competitors | HIGH | Vercel streaming response + animated step indicator |
| Custom cursor or cursor-follow effect | Signals creative developer identity | MEDIUM | Only tasteful if subtle (dim orb, not full cursor replacement); skip if it hurts mobile |
| CLAUDE.md with deep project context | Enables instant AI-assisted development; demonstrates modern workflow | LOW | Single file; wire it and it's done |
| Custom Claude Code skills for project tasks | Makes project maintenance demonstrably easier; can showcase in portfolio | MEDIUM | Slash commands for `/deploy`, `/test`, `/add-project` — concrete workflow value |
| MCP server integrations (GitHub, Vercel, MongoDB) | Claude Code can read issues, trigger deploys, query data — removes friction permanently | MEDIUM | `.mcp.json` committed to repo; tokens in local scope; GitHub MCP via HTTP (`https://api.githubcopilot.com/mcp/`) |
| Project scaffold CLI or template | Makes "add new demo" trivial — directly addresses PROJECT.md active requirement | MEDIUM | Shell script or Node script; no framework needed |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full WebGL / Three.js 3D hero background | Looks impressive in inspiration galleries | 2-4MB bundle, CPU/GPU intensive, kills mobile performance, distracts from project demos which are the actual product | Subtle CSS `clip-path` animation or SVG morphing for the hero curtain — same visual pop at 1% of the cost |
| Particle systems (tsParticles, particles.js) | Trendy; "adds life" | Heavy DOM manipulation, cause scroll jank, hurt Core Web Vitals, look dated by 2026 | CSS `radial-gradient` animation on the hero is lighter and more tasteful |
| Auto-playing background video | High visual impact | Bandwidth-intensive, inaccessible, can trigger motion sensitivity, annoying on repeat visits | Use a looping CSS animation or a poster image with a play-on-hover video |
| Scroll hijacking / full-page scroll snap forced on desktop | Agency portfolio trend | Disorienting, breaks browser back/forward, penalized by Google's CLS metrics, infuriating on non-optimal scroll speeds | Use scroll-triggered reveals that enhance natural scrolling rather than replacing it |
| Complete animation framework (Framer Motion, React Spring) on portfolio shell | "The right tool for animations" | Portfolio shell is vanilla HTML/JS — adding React as a dependency to animate the landing page is extreme over-engineering | GSAP works framework-agnostically and is already the industry standard for vanilla JS animation; or use CSS scroll-driven animations |
| Animated background music / ambient sound | "Immersive" | Universally disliked unless the site is specifically audio-themed; Songdle is audio-themed but portfolio shell is not | None needed |
| AI chatbot that talks about the portfolio owner | Seems innovative | Requires ongoing LLM cost, security considerations for a public endpoint, and often feels gimmicky vs. actually impressive demos | The Handoff project already demonstrates AI capability far better |
| CMS / admin panel for updating content | "Makes updates easier" | Adds auth surface, complexity, hosting cost — PROJECT.md explicitly rules this out | Content managed via code + CLAUDE.md so Claude can make updates via PR |

---

## Feature Dependencies

```
prefers-reduced-motion support
    └──required-by──> ALL animation features (no exceptions)

Intersection Observer scroll reveals
    └──enables──> Staggered entrance animations
    └──enables──> Scroll-triggered reveals

GSAP ScrollTrigger
    └──requires──> GSAP core (~23KB gzip)
    └──enables──> Scroll-triggered content reveals
    └──enables──> Spring/physics micro-interactions (via GSAP tweens)

Skeleton loading states
    └──requires──> Knowledge of which elements are async (API audit needed)

CLAUDE.md
    └──required-by──> Custom Claude Code skills (skills reference project context)
    └──required-by──> MCP server integrations (Claude needs project context to use tools well)
    └──required-by──> Claude Code being useful on this project at all

Custom Claude Code skills (/deploy, /test, /add-project)
    └──requires──> CLAUDE.md (for project context)
    └──enhances──> MCP server integrations (skills can call MCP tools)

MCP server integrations
    └──requires──> CLAUDE.md (for Claude to know what to do with the tools)
    └──independent-of──> Animation work (can be done in parallel)

Project scaffold template
    └──requires──> Understanding of existing project patterns (codebase audit exists)
    └──independent-of──> Animation work
```

### Dependency Notes

- **All animations require prefers-reduced-motion:** This is not optional. Implement it first or wrap every animation in it from the start.
- **CLAUDE.md is foundational for all Claude Code features:** Skills and MCP integrations become significantly less useful without a well-written CLAUDE.md establishing project context, naming conventions, and constraints.
- **GSAP requires a single upfront install decision:** The portfolio shell is vanilla HTML/JS. Adding GSAP via CDN (or npm + bundler) is the one architectural choice that affects all animation work. Decide before implementing any scroll-triggered or spring animations.
- **Skeleton states require async audit first:** Before implementing skeletons, enumerate every async call in every project (Handoff chat, Songdle fetch, TaskMaster CRUD, deploy pipeline). This is an information-gathering step, not a build step.

---

## MVP Definition

This is a *subsequent milestone* on an existing portfolio. "MVP" here means the minimum that meaningfully moves the needle on wow-factor.

### Launch With (v1 — animation milestone)

- [ ] `prefers-reduced-motion` wrapper on ALL existing and new animations — accessibility foundation
- [ ] Consistent button/interactive element hover feedback across all projects — raises baseline quality floor fast
- [ ] Loading/skeleton states on Handoff chat, Songdle audio fetch, TaskMaster list — async states are the most common "feels broken" moment for visitors
- [ ] Refine hero entrance animation timing — already built, just needs polish pass
- [ ] Scroll-triggered entrance reveals on portfolio shell sections — narrative scrolling

### Add After Validation (v1.x — deeper animation + tooling)

- [ ] CLAUDE.md with full project context — trigger: before starting any further AI-assisted work
- [ ] Custom Claude Code skills for `/deploy`, `/test`, `/add-project` — trigger: after CLAUDE.md lands
- [ ] MCP server integrations (GitHub, Vercel) — trigger: after CLAUDE.md and skills are working
- [ ] Spring-physics micro-interactions on key CTAs (Handoff send button, Songdle submit) — trigger: after baseline interactions are solid
- [ ] Project scaffold template — trigger: when adding a new project demo

### Future Consideration (v2+)

- [ ] Audio waveform visualizer for Songdle — high effort, high reward, defer until core polish is done
- [ ] Real-time animated deploy progress in Handoff — requires streaming API work, significant effort
- [ ] Gesture-driven interactions — only if a specific project (Connect Four drag) warrants it
- [ ] Custom cursor effect — only if brand direction calls for it; review after v1 is live

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `prefers-reduced-motion` wrapper | HIGH (accessibility + craft signal) | LOW | P1 |
| Button/link hover feedback across all projects | HIGH (baseline polish) | LOW | P1 |
| Loading/skeleton states on async operations | HIGH (removes "feels broken") | MEDIUM | P1 |
| Hero entrance animation refinement | MEDIUM (first impression) | LOW | P1 |
| Scroll-triggered section reveals | MEDIUM (narrative feel) | LOW-MEDIUM | P1 |
| CLAUDE.md setup | HIGH (enables all AI tooling) | LOW | P1 |
| Custom Claude Code skills | HIGH (developer workflow) | MEDIUM | P2 |
| MCP server integrations | MEDIUM (workflow efficiency) | MEDIUM | P2 |
| Project scaffold template | MEDIUM (extensibility) | MEDIUM | P2 |
| Spring-physics micro-interactions | MEDIUM (wow factor) | HIGH | P2 |
| Staggered entrance animations | LOW-MEDIUM (polish) | LOW | P2 |
| Audio waveform visualizer (Songdle) | HIGH (memorable demo) | HIGH | P3 |
| Animated deploy progress (Handoff) | HIGH (premium feel) | HIGH | P3 |
| Gesture-driven interactions | LOW-MEDIUM (novelty) | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone to land
- P2: Should have, include when capacity allows
- P3: Nice to have, future milestone

---

## Competitor Feature Analysis

Reference: analysis of standout developer portfolios in 2026 based on community research (Elementor, Colorlib, Hostinger roundups).

| Feature | Mid-tier Portfolio | Standout Portfolio | This Portfolio's Plan |
|---------|-------------------|-------------------|----------------------|
| Hover effects | CSS opacity change | Spring-physics transform + shadow | CSS transitions P1; GSAP spring P2 |
| Section entrances | Hard cut or CSS fade | Staggered Intersection Observer reveals | Intersection Observer + CSS (no framework needed) |
| Loading states | Blank div or spinner | Shimmer skeleton matching content shape | CSS shimmer skeleton P1 |
| Page-level transitions | Hard navigation | View Transitions API (progressive enhancement) | CSS scroll-driven + View Transitions where supported |
| Animation accessibility | None | `prefers-reduced-motion` with full fallback | Required P1 |
| Developer tooling (CLAUDE.md) | Not present | Present in modern AI-forward portfolios | CLAUDE.md P1 |
| Animation library | jQuery or none | GSAP (vanilla) or Framer Motion (React) | GSAP for portfolio shell + any React projects |

---

## Sources

- [Motion Design & Micro-Interactions: What Users Expect in 2026](https://www.techqware.com/blog/motion-design-micro-interactions-what-users-expect) — motion expectations baseline
- [UI/UX Evolution 2026: Micro-Interactions & Motion](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/) — industry trend confirmation
- [15 website scroll animations for a captivating experience](https://www.creativecorner.studio/blog/website-scroll-animations) — scroll animation patterns
- [GSAP vs Motion: A detailed comparison](https://motion.dev/docs/gsap-vs-motion) — animation library analysis (MEDIUM confidence — single comparison site, but aligns with wider ecosystem)
- [Why I Switched from Framer Motion to GSAP](https://dev.to/worapon_jintajirakul/why-i-switched-from-framer-motion-to-gsap-597b) — real-world usage rationale
- [The Web Animation Performance Tier List](https://motion.dev/magazine/web-animation-performance-tier-list) — performance guidance for animation choices
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — HIGH confidence, official spec
- [Design accessible animation and movement — Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — WCAG 2.3.3 implementation guidance
- [Extend Claude with skills — Claude Code official docs](https://code.claude.com/docs/en/skills) — HIGH confidence, official Anthropic documentation
- [Connect Claude Code to tools via MCP — Claude Code official docs](https://code.claude.com/docs/en/mcp) — HIGH confidence, official Anthropic documentation
- [Using CLAUDE.MD files — Anthropic blog](https://claude.com/blog/using-claude-md-files) — HIGH confidence, official source
- [Best Practices for Claude Code — Claude Code Docs](https://code.claude.com/docs/en/best-practices) — HIGH confidence, official source

---

*Feature research for: Developer portfolio animation + Claude Code tooling milestone*
*Researched: 2026-03-11*
