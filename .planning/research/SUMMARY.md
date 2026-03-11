# Project Research Summary

**Project:** Adam Camilleri Portfolio — Animation & Developer Tooling Milestone
**Domain:** Vanilla JS monorepo portfolio with serverless API (GitHub Pages + Vercel)
**Researched:** 2026-03-11
**Confidence:** HIGH (animation patterns, pitfalls from codebase audit), MEDIUM (Claude Code MCP tooling — rapidly evolving ecosystem)

## Executive Summary

This is an existing, functioning developer portfolio that needs two distinct improvements delivered in parallel: a motion/animation polish layer that elevates the UX from functional to memorable, and a Claude Code developer tooling setup that makes future AI-assisted development faster and more reliable. The codebase is vanilla HTML/CSS/JS with no build step, which shapes every technology decision — the correct animation stack is GSAP (CDN-loaded, no bundler) plus native browser APIs (View Transitions, CSS Scroll-Driven Animations), not React-ecosystem libraries like Framer Motion.

The recommended approach is to sequence work so foundational infrastructure precedes polish: extract shared CORS utility and fix MongoDB reconnect issues first, then establish CLAUDE.md and MCP config for developer tooling, then implement animations starting from the shared utilities layer outward to individual projects. This order matters because the shared `animations.js` module, the `api/_lib/cors.js` extractor, and the CLAUDE.md are all referenced by subsequent work — building them first removes friction for everything else. The codebase audit identified concrete security issues (XSS in Handoff, JWT secret bypass, usage limit disabled) that must be addressed before the portfolio is public-facing with live demos.

The key risks are over-animating the portfolio shell at the expense of demo discoverability, ignoring `prefers-reduced-motion` which affects roughly 35% of users, and letting CLAUDE.md become stale after the tech debt phase changes the exact patterns it describes. All three are avoidable with discipline: define a motion budget before writing animation code, wrap every animation in the reduced-motion media query from the start, and schedule a CLAUDE.md update pass immediately after tech debt work lands.

## Key Findings

### Recommended Stack

The portfolio's no-build-step constraint is a feature, not a limitation. GSAP 3.14.2 via CDN is the right choice for orchestrated animations — it is framework-agnostic, works without a bundler, and all premium plugins (ScrollTrigger, Flip, TextPlugin) are now fully free following the Webflow acquisition in November 2024. For simpler single-element reveals, Motion's vanilla JS `inView` (0.5kb) wraps Intersection Observer cleanly. Native browser APIs (View Transitions API at ~85% coverage, CSS Scroll-Driven Animations at ~70% coverage) should be used as progressive enhancement for zero-weight effects. No library should be added speculatively — each has a clear decision boundary in the stack research.

For developer tooling, the three MCP servers (GitHub, Vercel, MongoDB) are all now official and stable enough to use. CLAUDE.md is the dependency that makes MCP integrations worthwhile — Claude needs project context to use tools effectively.

**Core technologies:**
- GSAP 3.14.2 (CDN): Orchestrated sequences, scroll timelines, staggered entrances — framework-agnostic, free including all plugins
- Motion vanilla `inView`: Single-element scroll reveals — 0.5kb, wraps Intersection Observer, use for simple cases
- View Transitions API: Zero-JS page transitions — native, progressive enhancement, ~85% browser coverage
- CSS Scroll-Driven Animations: Parallax and progress bars — native, treat as progressive enhancement (~70% coverage)
- GSAP ScrollTrigger: Complex scroll-linked sequences — bundled free with GSAP 3.14.2
- CLAUDE.md: Claude Code onboarding context — foundational dependency for all AI tooling features

### Expected Features

The features research draws a clear line between what a 2026 portfolio must have (table stakes) and what separates standout portfolios from mid-tier ones (differentiators). The most impactful observation: recruiters spend under two minutes on a portfolio, so entrance animations that delay content visibility are actively harmful, not impressive.

**Must have (table stakes):**
- `prefers-reduced-motion` support on ALL animations — accessibility and craft signal; affects ~35% of visitors
- Consistent hover feedback across all interactive elements — bare states feel unfinished
- Loading/skeleton states on Handoff chat, Songdle fetch, TaskMaster API calls — blank states are the #1 "feels broken" moment
- Hero entrance animation refinement — already built, needs timing polish
- Scroll-triggered section reveals on portfolio shell — narrative scrolling baseline
- CLAUDE.md with full project context — required before any further AI-assisted development

**Should have (competitive differentiators):**
- Spring-physics micro-interactions on Handoff send button and Songdle submit — distinguishes hand-built from defaults
- Staggered entrance animations on project grid — demonstrates animation craft without disrupting UX
- Custom Claude Code slash commands (`/deploy`, `/test`, `/add-project`) — workflow efficiency, demonstrable in portfolio
- MCP server integrations (GitHub, Vercel, MongoDB) — removes AI dev friction permanently
- Project scaffold template (`projects/_template/`) — reduces new-project friction to minutes

**Defer (v2+):**
- Audio waveform visualizer for Songdle — high effort, high reward; defer until core polish is done
- Animated real-time deploy progress in Handoff — requires streaming API work
- Gesture-driven interactions — only if a specific project warrants it
- Custom cursor effect — only if brand direction calls for it

### Architecture Approach

The architecture is a layered monorepo with a clear build order defined by dependencies. A new `shared/` frontend utilities layer (ES Modules, no bundler) provides reusable GSAP helpers to all project pages. A new `api/_lib/cors.js` middleware consolidates duplicated CORS logic from six handlers into one place. CLAUDE.md at the repo root provides Claude Code with project context, pointing to `.planning/` for deep dives rather than inlining everything. The `projects/_template/` scaffold should be built last — after conventions are finalized — so it encodes finished decisions, not draft ones.

**Major components:**
1. `shared/animations.js` — GSAP-backed ES Module exporting `fadeInOnScroll`, `staggerEntrances`, `springHover`; imported by any project page
2. `api/_lib/cors.js` — `withCors(handler)` higher-order function; all API handlers wrap with it at export time
3. `CLAUDE.md` + `.mcp.json` — project context and MCP server config; foundational for all AI-assisted work
4. Per-project animation polish — each project (`handoff/`, `songdle/`, etc.) imports from `shared/animations.js`
5. `projects/_template/` — scaffold encoding final conventions; built last

### Critical Pitfalls

1. **Animating layout properties (width/height/top/margin) instead of transform/opacity** — causes layout reflow on every frame, visible as jank on mobile and low-end hardware; solution: animate only `transform` and `opacity`; use Chrome DevTools Performance panel to confirm no purple Layout events during animations
2. **Omitting `prefers-reduced-motion` support** — approximately 35% of users who have this OS setting enabled will experience motion sickness; solution: wrap every animation in `@media (prefers-reduced-motion: no-preference)` from the start; gate GSAP initialization on `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
3. **Over-animating the portfolio shell** — entrance delays and scroll-pinning frustrate recruiters who are skimming under time pressure; solution: define a motion budget before writing code; shell animations must be under 300ms and invisible when not looked for; save the motion budget for inside project demos
4. **CORS extraction missing call sites** — silent CORS failures after refactor if a handler is missed; solution: grep check after extraction; test OPTIONS preflight on every handler in the browser network tab
5. **CLAUDE.md staleness after tech debt phase** — tech debt phase changes CORS and MongoDB patterns that CLAUDE.md describes; Claude then gives advice based on the old architecture; solution: schedule a CLAUDE.md update pass immediately after tech debt lands

## Implications for Roadmap

Based on the combined research and the build order implications from the architecture file, four phases are recommended in strict sequence. Each phase unblocks the next.

### Phase 1: Tech Debt + Security

**Rationale:** Security issues (XSS, JWT bypass, disabled usage limit) and architectural tech debt (duplicated CORS, stale MongoDB connection) are the foundation everything else sits on. Shipping animations on top of an XSS vulnerability or an unbounded API cost exposure is inadvisable. The CORS extraction also removes the #1 source of API drift risk before new handlers are added.

**Delivers:** Secure, consolidated API layer; MongoDB reconnect resilience; Handoff XSS fix; usage limit restored; `dist/` removed from git

**Addresses features from FEATURES.md:** None directly — this is infrastructure; it enables demo polish to be built safely

**Avoids pitfalls:** CORS extraction miss (Pitfall 4), MongoDB connection storm (Pitfall 5), XSS regression (Pitfall 8), JWT secret bypass

**Specific tasks:**
- Extract `api/_lib/cors.js` with `withCors()` wrapper; refactor all handlers to use it
- Fix MongoDB reconnect guard (ping before reuse, not remove-the-cache)
- Patch Handoff XSS: replace `innerHTML` with DOM construction APIs
- Restore `canGenerate()` usage limit gate
- Remove `dist/validation.js` from git tracking
- Fix JWT secret: throw on startup if `JWT_SECRET` missing in production

### Phase 2: Claude Code Tooling Setup

**Rationale:** CLAUDE.md is the dependency that makes all subsequent AI-assisted development faster and more reliable. The architecture research identifies it as a prerequisite for slash commands and MCP integrations. Setting it up after the tech debt phase means it describes the current (post-refactor) codebase accurately. Writing it before the tech debt phase means it will immediately be wrong about the CORS and MongoDB patterns.

**Delivers:** CLAUDE.md with correct post-refactor architecture; `.mcp.json` with GitHub, Vercel, MongoDB MCP servers; `.claude/commands/` with `/deploy`, `/test`, `/add-project` slash commands

**Uses stack elements:** CLAUDE.md (hierarchical, under 200 lines), `.mcp.json` project-scoped config, `.claude/commands/` directory

**Implements architecture component:** Developer Tooling Layer (CLAUDE.md, .mcp.json, scaffold template prep)

**Avoids pitfalls:** CLAUDE.md staleness (Pitfall 7), MCP token exposure in config

### Phase 3: Animation Foundation

**Rationale:** The shared animation infrastructure must exist before per-project animation polish can be implemented. `shared/animations.js` is the dependency that all four project pages will import. Defining it once with correct `prefers-reduced-motion` handling and `transform`-only patterns means every downstream project inherits correct behavior automatically.

**Delivers:** `shared/animations.js` with GSAP helpers; `prefers-reduced-motion` wrapper applied universally; portfolio shell scroll-triggered reveals; hero animation timing refinement; button/link hover feedback across all projects

**Uses stack elements:** GSAP 3.14.2 via CDN, GSAP ScrollTrigger, Motion `inView` for simple cases

**Implements architecture component:** Shared Frontend Utils (`shared/animations.js`, `shared/transitions.js`)

**Avoids pitfalls:** Layout property animation (Pitfall 1), `prefers-reduced-motion` omission (Pitfall 2), over-animating the shell (Pitfall 3), GSAP ScrollTrigger wrong scroll container (Pitfall 6)

### Phase 4: Per-Project Animation Polish + Skeleton States

**Rationale:** Once `shared/animations.js` is stable, each project can import it and add project-specific polish without duplicating animation infrastructure. Skeleton/shimmer loading states are grouped here because they require an async call audit per project — a prerequisite that is a blocking information-gathering step.

**Delivers:** Skeleton/shimmer loading states on Handoff chat, Songdle audio fetch, TaskMaster list; spring-physics micro-interactions on key CTAs; staggered project grid entrances; `projects/_template/` scaffold with final conventions baked in

**Uses stack elements:** GSAP elastic ease for spring physics, CSS `@keyframes` shimmer for skeletons, View Transitions API for page transitions (progressive enhancement)

**Implements architecture component:** Per-project animation polish, project scaffold template

**Avoids pitfalls:** Animating display:none elements, looping animation without pause control, concurrent animation overload causing scroll jank

### Phase Ordering Rationale

- **Security before everything:** XSS and unbounded API cost are live risks on a public portfolio; they must not ship with added polish on top
- **CLAUDE.md after tech debt, not before:** The file must describe the current codebase accurately or it actively misleads Claude Code; the tech debt phase is the last big architectural change before animation work begins
- **Shared animations before per-project:** The `shared/animations.js` module is a hard dependency for Phases 4 project work; building it first means projects do not need to carry their own animation setup
- **Scaffold template last:** Encodes all final conventions (GSAP CDN URL, ES Module import pattern, `prefers-reduced-motion` wrapper); building it before those are settled means the template becomes outdated immediately

### Research Flags

Phases needing deeper research during planning:
- **Phase 1 (Tech Debt):** The MongoDB reconnect fix pattern needs to be validated against the specific version of `mongodb` driver in use — the ping guard approach differs between driver v4 and v6; check `package.json` before implementing
- **Phase 4 (Per-Project Polish):** The async call inventory for skeleton states requires a codebase read pass before tasks can be scoped — enumerate all `fetch()` calls across `handoff/script.js`, `songdle/script.js`, and TaskMaster before estimating effort

Phases with standard patterns (skip research-phase):
- **Phase 2 (Claude Tooling):** CLAUDE.md structure and MCP setup are well-documented in official Anthropic sources; patterns are directly applicable
- **Phase 3 (Animation Foundation):** GSAP + ScrollTrigger patterns are extensively documented; the shared ES Module architecture is straightforward; no research gap

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core animation libraries verified via npm and official sources; GSAP free licensing confirmed via gsap.com; browser API coverage via MDN and caniuse |
| Features | HIGH | Animation/accessibility patterns verified against WCAG and official motion docs; Claude Code tooling from official Anthropic documentation |
| Architecture | HIGH | Based on direct codebase audit (existing repo confirmed); patterns verified against Vercel, MDN, and GSAP official docs |
| Pitfalls | HIGH | Critical pitfalls (XSS, JWT, usage limit bypass) confirmed by direct codebase audit with file references; animation pitfalls verified against official GSAP and MDN sources |

**Overall confidence:** HIGH

### Gaps to Address

- **MongoDB driver version:** The ping-guard reconnect fix implementation differs between `mongodb` npm driver major versions; confirm version in `package.json` before implementing Phase 1 MongoDB fix
- **MCP ecosystem stability:** MCP servers (especially Vercel MCP in Public Beta) are still evolving; treat MCP integrations as best-effort; if a server breaks, it is a developer convenience issue, not a user-facing regression
- **CSS Scroll-Driven Animations browser coverage:** Currently ~70% (Chrome/Edge only for full support); treat as progressive enhancement only; verify `@supports (animation-timeline: scroll())` guard is in place for every use

## Sources

### Primary (HIGH confidence)
- [GSAP standard license — gsap.com](https://gsap.com/community/standard-license/) — licensing, free plugins confirmed
- [GSAP ScrollTrigger Tips & Mistakes — gsap.com](https://gsap.com/resources/st-mistakes/) — animation pitfall prevention
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — WCAG 2.3.3 implementation
- [MDN: CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) — transform vs layout properties
- [View Transitions API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) — browser support matrix
- [Claude Code official docs — code.claude.com](https://code.claude.com/docs/en/mcp) — MCP configuration, slash commands
- [Vercel MCP — vercel.com/docs](https://vercel.com/docs/agent-resources/vercel-mcp) — official server, read-only, Public Beta
- [GitHub MCP server — github/github-mcp-server](https://github.com/github/github-mcp-server) — official GitHub MCP
- [MongoDB MCP server — mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server) — official MongoDB MCP
- Project codebase audit: `.planning/codebase/CONCERNS.md` — direct source for tech debt and security findings

### Secondary (MEDIUM confidence)
- [Motion.dev: GSAP vs Motion comparison](https://motion.dev/docs/gsap-vs-motion) — library positioning (single comparison site, bias toward Motion)
- [CLAUDE.md best practices — humanlayer.dev](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — 100-200 line guideline
- [CSS scroll-driven animations — caniuse.com](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — browser support (~70%)
- [This Dot Labs: Next.js + MongoDB Connection Storming](https://www.thisdot.co/blog/next-js-mongodb-connection-storming) — reconnect pattern rationale
- [Pope Tech: Accessible animation guidance](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — WCAG-aligned accessibility patterns

### Tertiary (LOW confidence)
- [LogRocket: Best React animation libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/) — ecosystem validation only; not directly applicable to vanilla JS context

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
