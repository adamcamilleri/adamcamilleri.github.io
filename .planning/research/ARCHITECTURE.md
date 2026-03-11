# Architecture Research

**Domain:** Vanilla JS multi-app monorepo portfolio with serverless API
**Researched:** 2026-03-11
**Confidence:** HIGH (existing codebase confirmed, patterns verified against current ecosystem)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPER TOOLING LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  CLAUDE.md   │  │  .mcp.json   │  │  Project Scaffold    │  │
│  │ (onboarding) │  │(GitHub/Vercel│  │  Template System     │  │
│  │              │  │  /MongoDB)   │  │  (new-project.sh)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   STATIC FRONTEND LAYER                          │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │ Portfolio    │  │          Mini-App Projects               │ │
│  │ Shell        │  │  ┌─────────┐ ┌─────────┐ ┌──────────┐   │ │
│  │ index.html   │  │  │ Handoff │ │ Songdle │ │TaskMaster│   │ │
│  │ style.css    │  │  │ /handoff│ │/songdle │ │(Next.js) │   │ │
│  │ (GSAP CDN)   │  │  └────┬────┘ └────┬────┘ └──────────┘   │ │
│  └──────┬───────┘  └───────┼────────────┼─────────────────────┘ │
│         │                  │            │                         │
├─────────┼──────────────────┼────────────┼─────────────────────── │
│         │        SHARED FRONTEND UTILITIES                        │
│  ┌──────▼──────────────────▼────────────▼──────────────────────┐ │
│  │  shared/                                                      │ │
│  │  ├── animations.js  (GSAP entrance/scroll helpers)           │ │
│  │  ├── utils.js       (debounce, throttle, formatters)         │ │
│  │  └── transitions.js (page-level transition helpers)          │ │
│  └──────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    SERVERLESS API LAYER (Vercel)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  api/                                                        │  │
│  │  ├── _lib/cors.js     (NEW: extracted shared CORS utility)  │  │
│  │  ├── _lib/mongodb.js  (singleton connection cache)          │  │
│  │  ├── _lib/api-key.js  (optional key validation)             │  │
│  │  ├── _lib/rate-limit.js (NEW: per-IP rate limiting)         │  │
│  │  ├── chat.js          (Groq LLM, uses _lib/cors)            │  │
│  │  ├── deploy.js        (Vercel deploy, uses _lib/cors)       │  │
│  │  ├── oauth.js         (PKCE flow, uses _lib/cors)           │  │
│  │  ├── save-design.js   (MongoDB write, uses _lib/cors)       │  │
│  │  └── soundcloud-daily.js (song cache, uses _lib/cors)       │  │
│  └────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      EXTERNAL SERVICES                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  MongoDB  │  │   Groq   │  │  Vercel  │  │  Spotify /   │   │
│  │  Atlas    │  │   API    │  │ Deploy   │  │  iTunes API  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current State |
|-----------|----------------|---------------|
| Portfolio Shell (`index.html`) | Single-page portfolio with scroll-based entrance animations | Exists; inline JS for animations |
| Mini-app projects (`projects/*/`) | Self-contained HTML/JS/CSS interactive demos | Exist; no shared animation utilities |
| Shared Frontend Utils (`shared/`) | Reusable animation, transition, and DOM helpers shared via ES Module or CDN include | Does not exist yet — must build |
| API handlers (`api/*.js`) | One Vercel serverless function per endpoint | Exist; CORS duplicated across 4+ handlers |
| API shared utilities (`api/_lib/`) | Cross-cutting concerns for all handlers | Exists partially; CORS missing |
| CLAUDE.md | Persistent context file for Claude Code onboarding | Does not exist yet — must build |
| `.mcp.json` | Project-scoped MCP server configuration (GitHub, Vercel, MongoDB) | Does not exist yet — must build |
| Project scaffold template | Repeatable structure for adding new project demos | Does not exist yet — must build |

## Recommended Project Structure

```
adamcamilleri.github.io/
├── CLAUDE.md                    # Claude Code onboarding (project WHY/WHAT/HOW)
├── .mcp.json                    # Project-scoped MCP servers (GitHub, Vercel, MongoDB)
├── index.html                   # Portfolio shell
├── style.css                    # Portfolio styles
├── shared/                      # NEW: shared frontend utilities
│   ├── animations.js            # GSAP-based entrance/scroll helpers (ES Module)
│   ├── transitions.js           # Page/view transition helpers
│   └── utils.js                 # debounce, throttle, formatDate, etc.
├── api/
│   ├── _lib/
│   │   ├── cors.js              # NEW: extracted shared CORS middleware
│   │   ├── rate-limit.js        # NEW: per-IP rate limiting for chat/deploy
│   │   ├── mongodb.js           # Existing singleton connection cache
│   │   ├── api-key.js           # Existing optional key validation
│   │   └── html-response.js     # Existing LLM HTML extraction
│   ├── chat.js                  # (refactored to use _lib/cors)
│   ├── deploy.js                # (refactored to use _lib/cors)
│   ├── oauth.js                 # (refactored to use _lib/cors)
│   └── save-design.js           # (refactored to use _lib/cors)
├── projects/
│   ├── handoff/
│   │   ├── index.html           # (add GSAP include + shared/animations.js)
│   │   ├── script.js            # (sanitize innerHTML XSS, restore usage gate)
│   │   └── styles.css
│   ├── songdle/
│   │   ├── index.html           # (add GSAP include + shared/animations.js)
│   │   ├── script.js            # (cache songs.json read)
│   │   └── style.css
│   ├── connect-four/
│   ├── studybuddy/
│   ├── adams-cookbook/
│   └── _template/               # NEW: scaffold template for new project demos
│       ├── index.html
│       ├── script.js
│       └── style.css
└── .planning/                   # Research and planning files
```

### Structure Rationale

- **`shared/`:** ES Modules loaded via `<script type="module">` in each project's HTML — no bundler required. Modern browser support is 97%+ and fits the no-build-step constraint perfectly. Each module can be updated independently and cached by the browser separately.
- **`api/_lib/cors.js`:** Extract the duplicated `ALLOWED_ORIGINS` + `corsHeaders()` pattern from 4 handlers into one place. The wrapper pattern (higher-order function wrapping the handler) is the Vercel-recommended approach.
- **`projects/_template/`:** A copy-paste starting point that already has the GSAP include, the shared utilities import, and consistent section/naming conventions. Reduces new-project friction to minutes.
- **`CLAUDE.md` at root:** Single file at repo root gives Claude Code immediate project context. Under 200 lines. Points to `.planning/` for deeper dives rather than duplicating content inline.

## Architectural Patterns

### Pattern 1: Shared Animations via ES Module

**What:** A `shared/animations.js` ES Module exports a small set of reusable animation helpers — `fadeInOnScroll(selector)`, `staggerEntrances(selector, delay)`, `springHover(el)` — backed by GSAP loaded from CDN. Each project imports only what it uses.

**When to use:** Any project page that needs scroll-triggered entrance animations or hover micro-interactions.

**Trade-offs:** Requires projects to use `<script type="module">` — a breaking change from plain `<script src="">` tags, but safe for this site's target browsers. GSAP loaded from CDN means one shared cached copy across all pages.

**Example:**
```html
<!-- In any project's index.html -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script type="module">
  import { fadeInOnScroll, staggerEntrances } from '/shared/animations.js';
  fadeInOnScroll('.card');
  staggerEntrances('.hero-line', 0.1);
</script>
```

```javascript
// shared/animations.js
gsap.registerPlugin(ScrollTrigger);

export function fadeInOnScroll(selector, options = {}) {
  gsap.from(selector, {
    opacity: 0, y: 30, duration: 0.6,
    stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: selector, start: 'top 85%', ...options }
  });
}
```

### Pattern 2: Shared CORS Middleware Wrapper

**What:** `api/_lib/cors.js` exports a `withCors(handler, options)` higher-order function. Every API handler wraps itself at export time. CORS logic and the allowed-origins list live in exactly one place.

**When to use:** All `api/*.js` handlers — always.

**Trade-offs:** Slightly less explicit per-handler — acceptable tradeoff for eliminating six copies of the same 20-line block and the risk of one copy drifting out of sync.

**Example:**
```javascript
// api/_lib/cors.js
const ALLOWED_ORIGINS = [
  'https://adamcamilleri.github.io',
  'http://localhost:3000',
  // ...
];

function corsHeaders(req) {
  const origin = req.headers.origin;
  const allowed = ALLOWED_ORIGINS.includes(origin)
    || origin?.endsWith('.vercel.app')
    || origin?.startsWith('http://localhost:');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

module.exports.withCors = function withCors(handler) {
  return async function (req, res) {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(204).end();
    return handler(req, res);
  };
};

// api/chat.js (after refactor)
const { withCors } = require('./_lib/cors');
module.exports = withCors(async function handler(req, res) { /* ... */ });
```

### Pattern 3: CLAUDE.md with Progressive Disclosure

**What:** A root-level `CLAUDE.md` that gives Claude Code the project WHY/WHAT/HOW without overwhelming context. It describes the monorepo layout, key commands, and coding conventions, then references `.planning/` files for detail rather than inlining everything.

**When to use:** Once, at project setup. Updated when architecture changes meaningfully.

**Trade-offs:** Keeping it under 200 lines requires discipline — the temptation is to add more detail. Shorter is consistently better because every line competes for context window.

**Example structure:**
```markdown
# Adam Camilleri Portfolio

## What this is
Personal portfolio + mini-app demos. GitHub Pages (static) + Vercel (serverless API).

## Monorepo layout
- `index.html` — portfolio shell
- `projects/*/` — standalone mini-apps (each has index.html + script.js + style.css)
- `api/` — Vercel serverless functions
- `api/_lib/` — shared utilities (cors, mongodb, api-key)
- `shared/` — frontend utilities shared across projects (animations, utils)

## Key commands
- Local dev: `npm run dev` (Express server on :3000)
- TaskMaster: `cd projects/taskmaster && npm run dev`

## Coding conventions
- API handlers: CommonJS (`module.exports = withCors(async handler)`)
- Frontend: Vanilla JS ES Modules (no bundler)
- Animations: GSAP via CDN + `/shared/animations.js`

## Architecture detail
See `.planning/codebase/ARCHITECTURE.md` and `.planning/research/`
```

## Data Flow

### Animation Trigger Flow

```
Page Load
    ↓
<script type="module"> in project HTML
    ↓
import from /shared/animations.js  (cached by browser after first load)
    ↓
GSAP (from CDN, shared cached copy)
    ↓
ScrollTrigger registers Intersection Observer callbacks
    ↓
User scrolls → element enters viewport → CSS class added OR GSAP tween fires
    ↓
Element animates in (fade, slide, spring)
```

### Shared API Utility Flow

```
HTTP request arrives at Vercel
    ↓
api/chat.js (or other handler)
    ↓
withCors() wrapper in api/_lib/cors.js sets CORS headers on ALL responses
    ↓
OPTIONS preflight? → 204 immediately
    ↓
handler runs: checkApiKey() → validate body → call external API → respond
```

### Claude Code Onboarding Flow

```
Developer opens repo with Claude Code
    ↓
CLAUDE.md loaded automatically at session start
    ↓
Claude knows: repo layout, key commands, coding conventions, where docs live
    ↓
Developer asks task → Claude acts without needing re-orientation
    ↓
For deep context: Claude reads .planning/codebase/* as needed
```

### New Project Scaffold Flow

```
Developer wants to add a new project demo
    ↓
Copy projects/_template/ to projects/<new-name>/
    ↓
Template already has: GSAP CDN include, /shared/animations.js import,
  consistent HTML sections, API call pattern
    ↓
Developer fills in content; animation hooks already wired
    ↓
Link new project from index.html projects section
```

## Scaling Considerations

This is a personal portfolio — scaling to millions of users is not a goal. Relevant scale considerations are load time and maintainability, not throughput.

| Concern | Current | With Milestone Improvements |
|---------|---------|----------------------------|
| Animation JS payload | ~0 (inline, minimal) | ~78KB GSAP from CDN (cached across pages) |
| Shared utilities | Duplicated per-project | Single shared/animations.js cached after first hit |
| CORS code | 4+ copies, drift risk | 1 copy in _lib/cors.js |
| MongoDB cold start | Single connection, no retry | Add retry logic in _lib/mongodb.js |
| Songdle songs.json | Read from disk per request | In-memory cache (module-level variable) |
| Claude onboarding time | Long (no CLAUDE.md) | Near-instant (CLAUDE.md + .mcp.json) |

## Anti-Patterns

### Anti-Pattern 1: Framework Animation Library in Vanilla JS Context

**What people do:** Import Framer Motion or React Spring into a non-React project because they read it's "the best."

**Why it's wrong:** Framer Motion requires React. Using it in a vanilla JS project means pulling in React as a dependency for animations alone — 40KB+ overhead with no other benefit.

**Do this instead:** Use GSAP via CDN for vanilla JS projects. GSAP is framework-agnostic, loads from CDN without a build step, and is free since the Webflow acquisition (2023).

### Anti-Pattern 2: Per-Handler CORS Arrays

**What people do:** Copy the `ALLOWED_ORIGINS` array and `corsHeaders()` function into each new API handler file.

**Why it's wrong:** Origins drift out of sync (one handler allows a domain another doesn't), bugs require fixing in 6 places, and code review misses the duplication. This is the current state — it's already caused inconsistency risk.

**Do this instead:** `api/_lib/cors.js` with `withCors()` wrapper. Every handler picks up the change automatically.

### Anti-Pattern 3: Monolithic Inline JS in project HTML Files

**What people do:** Keep all JS in a single `script.js` or even inline in `<script>` tags, mixing animation setup with application logic.

**Why it's wrong:** Animation helpers become impossible to share. Changing GSAP version or easing defaults requires editing every project file.

**Do this instead:** Animation concern in `shared/animations.js`, application logic in `projects/<name>/script.js`. Projects import the helper; they don't own it.

### Anti-Pattern 4: CLAUDE.md as a Full Codebase Dump

**What people do:** Paste every file path, every function signature, every convention into CLAUDE.md trying to give Claude maximum context.

**Why it's wrong:** Bloated CLAUDE.md competes with task context for limited context window. Claude reads the irrelevant 80% before getting to the task.

**Do this instead:** CLAUDE.md describes the high-level map and key commands (under 200 lines). Deep detail lives in `.planning/` files which Claude reads on demand when a specific question arises.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GSAP (animation) | CDN script tag, no npm required | Free since Webflow acquisition; CDN URL: `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/` |
| Vercel MCP | `.mcp.json` project-scoped config pointing to `https://mcp.vercel.com` | Gives Claude Code deployment visibility during dev sessions |
| GitHub MCP | `.mcp.json` with `github` MCP server | Gives Claude Code PR/issue context |
| MongoDB Atlas | `api/_lib/mongodb.js` singleton | Cold-start reconnect fix needed (add retry on cached client failure) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Portfolio shell ↔ shared/ | ES Module import via `<script type="module">` | One-way: shell imports, shared/ has no knowledge of shell |
| Projects ↔ shared/ | ES Module import via `<script type="module">` | Same pattern; shared/ is a pure utility layer with no project-specific code |
| Projects ↔ api/ | HTTP fetch from browser to Vercel URL | No shared state; each request is stateless from the frontend perspective |
| api/*.js ↔ api/_lib/ | CommonJS `require()` | Synchronous; _lib modules are pure utilities with no cross-lib dependencies |
| TaskMaster ↔ rest of monorepo | None at runtime | TaskMaster is fully isolated (its own node_modules, its own build); only connected via portfolio link |

## Build Order Implications

The dependencies between new components determine the order phases should tackle them:

1. **`api/_lib/cors.js` first** — foundational for all API work; no dependencies; refactoring all handlers to use it unblocks everything else safely
2. **CLAUDE.md + .mcp.json second** — once Claude understands the project structure (post-CORS refactor), all subsequent work goes faster; no code dependencies
3. **`shared/animations.js` third** — depends on GSAP (CDN, no install needed); once it exists, all project animation phases can import it
4. **Per-project animation polish fourth** — depends on `shared/animations.js` being stable; projects are independent of each other
5. **`projects/_template/` last** — should encode the final conventions (GSAP include, shared/ import pattern) so the template reflects finished decisions, not draft ones

## Sources

- GSAP vs Motion One comparison (2026): https://motion.dev/docs/gsap-vs-motion and https://satishkumar.xyz/blogs/gsap-vs-motion-guide-2026
- GSAP ScrollTrigger docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Vercel CORS patterns: https://vercel.com/kb/guide/how-to-enable-cors
- Vercel MCP integration: https://vercel.com/docs/agent-resources/vercel-mcp
- Claude Code MCP configuration: https://code.claude.com/docs/en/mcp
- CLAUDE.md best practices: https://www.humanlayer.dev/blog/writing-a-good-claude-md
- ES Modules without bundler: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- Intersection Observer for scroll animations: https://mroy.club/articles/scroll-animations-techniques-and-considerations-for-2025

---
*Architecture research for: Adam Camilleri Portfolio monorepo*
*Researched: 2026-03-11*
