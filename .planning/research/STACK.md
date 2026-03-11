# Stack Research

**Domain:** Portfolio site — animation/motion layer + developer tooling
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (core animation libs verified via npm/official sources; MCP servers are rapidly evolving ecosystem, some details LOW confidence)

---

## Context: What This Adds to the Existing Stack

The existing site is vanilla HTML/CSS/JS on GitHub Pages + Vercel serverless (Node.js 20, Express, MongoDB). No build step for the frontend. No framework. This research covers only the **additive layer**: animation tools, performance tooling, and Claude Code developer setup. Nothing here requires rebuilding the existing stack.

---

## Recommended Stack

### Core Animation Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| GSAP (GreenSock) | 3.14.2 | Orchestrated sequences, scroll-based timelines, complex staggered entrances | Framework-agnostic, DOM-direct, best-in-class for sequencing. Works in vanilla JS with zero build step. 2.7M weekly downloads. Now fully free including premium plugins (Webflow acquisition, Nov 2024). |
| Motion (vanilla API) | 12.x (`npm i motion`) | Declarative animate/inView calls, scroll-triggered reveals on individual elements | Successor to Framer Motion, now has a proper vanilla JS API. Tiny `inView` (0.5kb, wraps Intersection Observer). Use for simple element entrances; use GSAP when you need sequencing. |
| View Transitions API | Native browser API | Zero-JS page transitions between project views | Baseline Newly Available (Oct 2025). Chrome 111+, Edge 111+, Firefox 133+, Safari 18+. `document.startViewTransition()` covers ~85%+ of browsers. No library needed. |
| CSS Scroll-Driven Animations | Native browser API | Parallax, progress bars, simple scroll-linked effects | Chrome 115+, Edge 115+, Firefox (flag), Safari 26. Use for purely visual scroll effects that don't need JS orchestration. Degrades gracefully with `@supports`. |

### Supporting Animation Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GSAP ScrollTrigger plugin | Bundled with GSAP 3.14.2 | Scroll-linked timelines, pinning, scrubbing | When CSS scroll-driven animations aren't enough — complex sequences tied to scroll position, pinned sections, scrubbed reveals |
| GSAP Flip plugin | Bundled with GSAP 3.14.2 | Smooth layout transitions (e.g., project card expanding to full view) | Animating layout changes that would otherwise be impossible with CSS transitions |
| GSAP TextPlugin | Bundled with GSAP 3.14.2 | Typewriter text effects | Only if used sparingly in hero or project titles |

### Performance Tooling

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Squoosh CLI | Latest | Convert PNG/JPEG assets to WebP/AVIF | Run once on all static images in the portfolio. Free, Chrome team maintained. |
| Lighthouse CI | Latest (`npm i -D @lhci/cli`) | Automated Lighthouse scoring in CI or local | Run as npm script before deploy. Surfaces LCP, INP, CLS regressions. |
| Chrome DevTools Performance panel | Browser built-in | Profiling animation frame drops, layout thrash | Use when an animation feels janky — identify compositor-thread vs main-thread bottlenecks |

### Claude Code Developer Tooling

| Tool | Purpose | Notes |
|------|---------|-------|
| CLAUDE.md (project root) | Persistent project context for every Claude Code session | 100–200 line sweet spot. Include: project purpose, repo structure, key files, common tasks, gotchas. One file at root, sub-files in `projects/*/` if needed. |
| `.claude/commands/` directory | Custom slash commands (project-scoped) | Markdown files. Filename becomes `/command-name`. Use `$ARGUMENTS` placeholder. Committed to git so the whole team (you + future you) gets them. |
| GitHub MCP server (`github/github-mcp-server`) | Claude Code reads issues, manages PRs, searches repo from chat | Official GitHub MCP server. Install via `claude mcp add github`. |
| Vercel MCP server (official, `@vercel/mcp-adapter`) | Claude Code reads deployment status, build logs, runtime logs | Public Beta. OAuth-compliant. Read-only — no accidental deploys. Install via `claude mcp add vercel`. |
| MongoDB MCP server (`mongodb-mcp-server`) | Claude Code queries Atlas data, diagnoses connection issues | Official MongoDB Labs package. `npx -y mongodb-mcp-server@latest`. Requires `MONGODB_URI` env var. |

---

## Installation

```bash
# Animation — add to package.json or load via CDN (no build step required)
# CDN approach (recommended for this no-build-step portfolio):
# <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
# <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>

# If you add a build step later:
npm install gsap
npm install motion

# Performance dev tooling
npm install -D @lhci/cli

# MCP servers (run once, global Claude Code config)
claude mcp add github -- npx -y @github/mcp-server
claude mcp add vercel -- npx -y @vercel/mcp-adapter
claude mcp add mongodb -- npx -y mongodb-mcp-server@latest
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GSAP 3.14.2 | Anime.js | If you need a smaller bundle for very simple tweens only and don't need ScrollTrigger. Anime.js is ~17kb but lacks GSAP's plugin ecosystem and sequencing power. |
| GSAP 3.14.2 | Web Animations API (native) | If you're doing a single isolated animation with no sequence. WAAPI is sufficient; GSAP adds value at 3+ coordinated animations. |
| Motion vanilla API | Intersection Observer API (raw) | Motion's `inView` is a thin wrapper over Intersection Observer — use raw IO if you want zero dependencies and the pattern is simple (one class toggle). |
| View Transitions API | Barba.js | Barba.js adds page transition routing (~14kb). The native View Transitions API achieves the same result with zero dependencies. Only use Barba if you need IE11 or very old Safari support. |
| CSS Scroll-Driven Animations | ScrollMagic | ScrollMagic is effectively unmaintained (last commit 2020). Never use it. |
| Lighthouse CI | Manual Lighthouse runs | Lighthouse CI gives you a number to track over time and fails PRs if score drops. Manual runs are fine for a personal project but less consistent. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Framer Motion (React) | This portfolio is vanilla JS, not React. Framer Motion only works in React component trees. | Motion vanilla API (`import { animate, inView } from "motion"`) |
| ScrollMagic | Last meaningful update was 2020. Broken with modern GSAP. Requires jQuery-style DOM patterns. | GSAP ScrollTrigger |
| AOS (Animate On Scroll) | Bakes animation state into CSS classes, fights with custom animations. Limited control. | Motion `inView` + CSS transitions, or GSAP ScrollTrigger |
| anime.js for scroll-based work | No built-in scroll timeline. You'd re-implement what ScrollTrigger already does. | GSAP + ScrollTrigger |
| `will-change: transform` everywhere | Promotes every element to its own compositor layer, consuming GPU memory. Causes jank at scale. | Apply `will-change` only to elements mid-animation, remove via JS after animation completes. |
| Community Vercel MCP (nganiet/mcp-vercel) | Unofficial, community-maintained. Vercel ships their own official MCP now. | Official Vercel MCP (`@vercel/mcp-adapter`) |
| Three.js / WebGL for portfolio polish | Overkill for a portfolio. Adds ~500kb+ and requires significant animation expertise to not look bad. | GSAP + CSS for 99% of portfolio wow-factor |

---

## Stack Patterns by Variant

**For scroll-reveal animations (elements entering on scroll):**
- Use Motion `inView` for single-element fade/slide reveals
- Use GSAP ScrollTrigger `batch()` for staggered card grid reveals
- Because: Motion `inView` is 0.5kb for simple cases; GSAP batch handles many elements efficiently

**For page/view transitions between project demos:**
- Use native View Transitions API with `document.startViewTransition()`
- Add CSS `view-transition-name` to the project card and the project header
- Because: Zero library weight, graceful degradation, browser-native performance

**For micro-interactions (hover, button press, loading):**
- Use CSS transitions/animations for hover states (no JS overhead)
- Use GSAP `gsap.to()` only when the interaction requires choreography (e.g., button ripple + icon swap + label change)
- Because: CSS transitions run on the compositor thread — faster, no JS parse cost

**For the CLAUDE.md file:**
- Single root CLAUDE.md covering: project purpose, monorepo structure, API conventions, env vars needed, common npm scripts, known issues, and a list of available custom slash commands
- Sub-CLAUDE.md in `projects/handoff/`, `projects/songdle/` covering project-specific context
- Because: Hierarchical files keep root file under 200 lines while giving Claude full context when working in a subfolder

**For custom Claude Code commands:**
- Store in `.claude/commands/` (committed to git, project-scoped)
- Create: `/deploy` (trigger Vercel deploy check), `/test` (run Jest + Cypress), `/add-project` (scaffold new project demo), `/fix-cors` (remind Claude of shared CORS utility pattern)
- Because: Encodes your project's workflows so you don't re-explain them every session

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| gsap@3.14.2 | Vanilla JS, no bundler required | CDN-loadable. ScrollTrigger is a separate CDN file: `gsap/ScrollTrigger.min.js` |
| motion@12.x | Modern browsers (no IE11) | Vanilla JS API via `import { animate, inView } from "motion"`. Needs ESM — either a bundler or `<script type="module">`. |
| View Transitions API | Chrome 111+, Edge 111+, Firefox 133+, Safari 18+ | ~85% browser coverage as of 2026. Degrades gracefully — DOM updates work, animation is skipped. |
| CSS Scroll-Driven Animations | Chrome 115+, Edge 115+ (Firefox behind flag, Safari 26) | Use `@supports (animation-timeline: scroll())` guard. ~70% coverage. Treat as progressive enhancement. |
| mongodb-mcp-server | MongoDB Atlas free tier | Needs `MONGODB_URI` in env. Works with existing `api/_lib/mongodb.js` connection string. |

---

## Licensing Notes

**GSAP:** Fully free including all premium plugins (ScrollTrigger, Flip, etc.) since Webflow acquisition (Nov 2024). Standard license covers personal portfolios, commercial sites, and web apps. The only prohibited use is building a Webflow competitor. This portfolio is clearly permitted. Confidence: HIGH (verified via gsap.com/community/standard-license/).

**Motion:** MIT licensed. No restrictions. Confidence: HIGH.

---

## Sources

- [GSAP vs Motion comparison — motion.dev](https://motion.dev/docs/gsap-vs-motion) — library positioning, performance claims
- [GSAP on npm — npmjs.com](https://www.npmjs.com/package/gsap) — version 3.14.2 confirmed, 2.7M weekly downloads
- [Motion on npm — npmjs.com](https://www.npmjs.com/package/motion) — package name `motion`, version 12.x
- [motion.dev inView docs](https://motion.dev/docs/inview) — vanilla JS API confirmed, 0.5kb claim
- [GSAP standard license — gsap.com](https://gsap.com/community/standard-license/) — license restrictions verified HIGH confidence
- [GSAP is now free — webflow.com](https://webflow.com/blog/gsap-becomes-free) — premium plugins free confirmed
- [View Transitions API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) — browser support matrix
- [CSS scroll-driven animations — caniuse.com](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — browser support
- [CSS scroll-triggered animations Chrome 145 — developer.chrome.com](https://developer.chrome.com/blog/scroll-triggered-animations) — upcoming feature
- [Vercel MCP — vercel.com/docs](https://vercel.com/docs/agent-resources/vercel-mcp) — official server, read-only, Public Beta
- [GitHub MCP server — github/github-mcp-server](https://github.com/github/github-mcp-server) — official GitHub MCP
- [MongoDB MCP server — mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server) — official MongoDB MCP
- [CLAUDE.md best practices — humanlayer.dev](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — 100-200 line guideline, hierarchical structure
- [Claude Code slash commands — code.claude.com](https://code.claude.com/docs/en/slash-commands) — `.claude/commands/` directory, `$ARGUMENTS` syntax
- [LogRocket best React animation libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/) — ecosystem validation MEDIUM confidence

---

*Stack research for: portfolio animation layer + Claude Code developer tooling*
*Researched: 2026-03-11*
