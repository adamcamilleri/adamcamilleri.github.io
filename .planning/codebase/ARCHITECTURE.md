# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Multi-application monorepo — a GitHub Pages portfolio site hosting several independent mini-apps, backed by a shared Vercel serverless API layer.

**Key Characteristics:**
- Static HTML/CSS/JS portfolio shell served from the repo root via GitHub Pages
- Serverless API functions in `api/` deployed to Vercel (production) or Express (`server.js`) for local dev
- Each project under `projects/` is self-contained (its own HTML, JS, CSS); they share the Vercel API layer
- One sub-project (`projects/taskmaster/`) is a separate Next.js 14 App Router app with its own build, models, and routes
- TypeScript is used only for a thin validation layer (`src-ts/`) compiled to `dist/`

## Layers

**Static Frontend (Portfolio Shell):**
- Purpose: Personal portfolio page rendered entirely in the browser
- Location: `index.html`, `style.css`, `assets/`
- Contains: Single-page HTML with sections (hero, about, certificates, projects, contact), vanilla JS for animations and EmailJS contact form
- Depends on: External CDN (Font Awesome, Google Fonts, EmailJS)
- Used by: Direct browser visits to `adamcamilleri.github.io`

**Mini-App Projects:**
- Purpose: Standalone interactive demo apps linked from the portfolio
- Location: `projects/handoff/`, `projects/songdle/`, `projects/studybuddy/`, `projects/connect-four/`, `projects/adams-cookbook/`
- Contains: Each project has its own `index.html`, `script.js`, `styles.css`/`style.css`; no shared component library
- Depends on: The Vercel API layer for dynamic features; fully static projects are self-contained
- Used by: Portfolio project links, direct URL access

**Serverless API Layer:**
- Purpose: Backend functions for Handoff (AI chat, design persistence, OAuth, deploy) and Songdle (daily song, song list, Spotify preview)
- Location: `api/` — all files are individual Vercel serverless function handlers
- Contains: One JS file per endpoint; each exports a single `async function handler(req, res)`
- Depends on: `api/_lib/` shared utilities; external APIs (Groq, Vercel, MongoDB, Stripe, Spotify)
- Used by: `projects/handoff/script.js`, `projects/songdle/script.js`, `server.js` (dev adapter)

**API Shared Utilities (`_lib/`):**
- Purpose: Cross-cutting concerns reused across API handlers
- Location: `api/_lib/`
- Contains:
  - `api/_lib/mongodb.js` — singleton MongoDB client with connection caching for serverless reuse
  - `api/_lib/api-key.js` — optional `X-API-Key` header validation
  - `api/_lib/html-response.js` — HTML extraction and image placeholder sanitization from LLM responses
- Depends on: Nothing internal
- Used by: Multiple `api/*.js` handlers via `require('./_lib/...')`

**TypeScript Validation Layer:**
- Purpose: Typed payload validation compiled to CommonJS for use by API handlers at runtime
- Location: `src-ts/validation.ts` → compiled to `dist/validation.js`
- Contains: `validateSaveDesignPayload()` — validates `{ html, name }` shape and size before MongoDB insert
- Depends on: Nothing (pure functions, no imports)
- Used by: `api/save-design.js` with a JS fallback if `dist/` is absent

**TaskMaster (Next.js Sub-App):**
- Purpose: A full-stack task management demo running as an independent Next.js 14 App Router application
- Location: `projects/taskmaster/`
- Contains: App Router pages, API route handlers, Mongoose models, React components, custom hooks, JWT lib
- Depends on: Its own `node_modules`, MongoDB (via Mongoose), JWT auth
- Used by: Standalone deployment; referenced from portfolio as a project demo

## Data Flow

**Handoff AI Chat Flow:**

1. User completes onboarding in `projects/handoff/index.html` and types a chat message
2. `projects/handoff/script.js` sends `POST /api/chat` with `{ messages, currentHtml, formEmail }` and optional `X-API-Key` header
3. `api/chat.js` validates the key via `api/_lib/api-key.js`, enforces payload size limits, then builds a prompt from the designer system prompt + conversation history
4. `api/chat.js` calls Groq API (`llama-3.3-70b-versatile`, max 8192 tokens) and receives raw LLM text
5. `api/_lib/html-response.js` extracts HTML from the response and sanitizes image references
6. Response `{ reply, html, summary }` is returned; `script.js` renders the HTML in a sandboxed `<iframe>`

**Handoff Deploy Flow:**

1. User clicks Deploy in `projects/handoff/script.js`
2. `POST /api/deploy` is called with `{ html }`; the Vercel OAuth `vercel_access_token` cookie (set by OAuth flow) is read as the auth token, falling back to `VERCEL_TOKEN` env var
3. `api/deploy.js` calls `https://api.vercel.com/v13/deployments` with the HTML as `index.html` under a shared project name (`HANDOFF_DEPLOY_PREFIX` env var, default `handoff`)
4. Deployment URL is returned and shown to the user

**Handoff OAuth Flow:**

1. `GET /api/auth/authorize` (rewritten to `api/oauth.js?action=authorize`) generates a PKCE code challenge + state + nonce and sets HttpOnly cookies, then redirects to `https://vercel.com/oauth/authorize`
2. Vercel redirects to `/callback` (rewritten to `api/oauth.js?action=callback`): state and nonce are verified, tokens exchanged, `vercel_access_token` and `vercel_refresh_token` cookies set
3. `GET /api/auth/status` (rewritten to `api/oauth.js?action=status`) returns `{ connected: bool }` by checking presence of `vercel_access_token` cookie

**Songdle Daily Song Flow:**

1. `projects/songdle/script.js` calls `GET /api/soundcloud-daily?date=YYYY-MM-DD&genre=all|rock|hip-hop`
2. `api/soundcloud-daily.js` reads `projects/songdle/songs.json` from disk and picks today's song using a deterministic date+genre hash
3. Song metadata (with `preview_url` or `spotifyId`) is returned; client plays a Spotify embed or iTunes audio preview

**State Management:**
- Portfolio shell: no persistent state; scroll and animation managed via vanilla JS DOM manipulation
- Handoff client: plain JS `var state = { previewHtml, history, editModeOn, ... }` object inside an IIFE; daily usage counter persisted to `localStorage`
- TaskMaster: React state in components + custom hooks (`useTasks.ts`, `useAuth.ts`); JWT stored as a cookie set by the Next.js API route

## Key Abstractions

**Serverless Handler Pattern:**
- Purpose: Each API endpoint is a single exported async function matching Vercel's function signature, also compatible with Express
- Examples: `api/chat.js`, `api/deploy.js`, `api/save-design.js`, `api/oauth.js`
- Pattern: `module.exports = async function handler(req, res) { ... }` — works identically in Vercel serverless and as an Express handler in `server.js`

**MongoDB Singleton:**
- Purpose: Reuse a single connected `MongoClient` across warm serverless invocations to avoid re-connecting on every request
- File: `api/_lib/mongodb.js`
- Pattern: Module-level `let cached = null`; `getDb()` returns the cached db or creates a new connection; database name is hardcoded as `'handoff'`

**CORS Guard (duplicated pattern):**
- Purpose: Validate `Origin` header against an allowlist before setting CORS response headers
- Pattern: Each API handler defines its own `ALLOWED_ORIGINS` array and a local `corsHeaders(req)` helper — this pattern is duplicated across `api/chat.js`, `api/deploy.js`, `api/save-design.js`, and `api/oauth.js`

**Vercel Rewrites for OAuth:**
- Purpose: Expose clean URL paths for OAuth without creating extra API files
- Files: `vercel.json` (production rewrites), `server.js` lines 39-41 (dev route aliases with query param injection)
- Pattern: `/api/auth/authorize` → `api/oauth.js?action=authorize`; single handler dispatches on `?action=` query param

**TypeScript Validation with JS Fallback:**
- Purpose: Provide typed validation in `api/save-design.js` while staying deployable even if `dist/` is absent
- File: `api/save-design.js` lines 47-55
- Pattern: `try { require('../dist/validation.js') } catch { /* inline JS fallback */ }`

**Mongoose Singleton Model (TaskMaster):**
- Purpose: Prevent Mongoose model re-registration during Next.js dev hot-reload
- Examples: `projects/taskmaster/src/models/Task.ts`, `projects/taskmaster/src/models/User.ts`
- Pattern: `mongoose.models.Task || mongoose.model('Task', TaskSchema)`

## Entry Points

**Portfolio Shell:**
- Location: `index.html`
- Triggers: Browser navigation to `https://adamcamilleri.github.io/`
- Responsibilities: Renders full single-page portfolio; loads `style.css`, EmailJS, Google Fonts; inline JS initializes scroll restoration and entrance animations

**Local Dev Server:**
- Location: `server.js`
- Triggers: `npm run dev` → `node server.js`
- Responsibilities: Express app wiring all `api/*.js` handlers to routes; serves static files from repo root via `express.static`; not used in production (Vercel handles routing there)

**Vercel Serverless Functions:**
- Location: `api/*.js` — each file is its own entry point
- Triggers: HTTP requests to `/api/<filename>` on Vercel
- Responsibilities: Individual handlers for chat, deploy, OAuth, design CRUD, Songdle data, health check

**Handoff App:**
- Location: `projects/handoff/index.html` + `projects/handoff/script.js`
- Triggers: Browser navigation to `/projects/handoff/`
- Responsibilities: Multi-step onboarding wizard, AI chat UI, live preview iframe, element click-to-edit mode, deploy flow, Vercel OAuth connect

**Songdle App:**
- Location: `projects/songdle/index.html` + `projects/songdle/script.js`
- Triggers: Browser navigation to `/projects/songdle/`
- Responsibilities: Daily song guessing game UI, genre picker, autocomplete guess input, audio playback via Spotify embed or iTunes preview

**TaskMaster App:**
- Location: `projects/taskmaster/src/app/layout.tsx`, `projects/taskmaster/src/app/page.tsx`
- Triggers: Next.js App Router; `npm run dev` inside `projects/taskmaster/`
- Responsibilities: JWT-authenticated task CRUD app with login, register, task list, create, and delete

## Error Handling

**Strategy:** Early-return pattern — validate inputs and return error JSON before any side effects; catch blocks on all async external calls.

**Patterns:**
- `api/chat.js`, `api/deploy.js`, `api/save-design.js`: Validate body fields → check env vars → call external API in `try/catch` → return `{ error, details }` with appropriate HTTP status (400, 401, 405, 413, 500)
- `api/oauth.js`: Errors redirect to `${handoffUrl}?error=<code>` rather than returning JSON, because the endpoint drives browser redirects
- MongoDB operations: Wrapped in `try/catch`; 500 with `err.message` propagated if connection or query fails
- TypeScript validation fallback in `api/save-design.js`: If compiled `dist/` is missing, inline JS validation runs instead of failing hard

## Cross-Cutting Concerns

**CORS:** Each API handler implements its own allowlist and `corsHeaders()` helper — no shared middleware. This is a duplication concern (see CONCERNS.md).

**API Key Auth:** `api/_lib/api-key.js` `checkApiKey()` is called manually at the top of handlers that protect it (`chat.js`, `deploy.js`, `save-design.js`). If the `API_KEYS` env var is not set, all requests pass through.

**Validation:** Input size limits are checked inline in each handler. Payload shape validation for `save-design` uses the compiled TypeScript helper with a JS fallback.

**Logging:** `console.error()` in catch blocks only — no structured logging framework.

---

*Architecture analysis: 2026-03-06*
