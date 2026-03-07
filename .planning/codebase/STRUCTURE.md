# Codebase Structure

**Analysis Date:** 2026-03-06

## Directory Layout

```
adamcamilleri.github.io/        # Repo root — also the GitHub Pages web root
├── index.html                  # Portfolio single-page site entry point
├── style.css                   # Portfolio stylesheet (55 KB)
├── server.js                   # Express dev server (local only; not used in production)
├── package.json                # Root deps: express, mongodb, jest, cypress, typescript
├── tsconfig.json               # TypeScript config: src-ts/ → dist/
├── vercel.json                 # Vercel routing rules (OAuth rewrites, SPA fallback)
├── cypress.config.js           # Cypress E2E config
├── Dockerfile                  # Docker image for local full-stack dev
├── docker-compose.yml          # Compose: portfolio + API
├── CNAME                       # GitHub Pages custom domain (adamcamilleri.com)
│
├── api/                        # Vercel serverless functions (one file = one endpoint)
│   ├── _lib/                   # Shared utilities (not exposed as endpoints)
│   │   ├── mongodb.js          # Singleton MongoClient helper
│   │   ├── api-key.js          # Optional X-API-Key header validation
│   │   └── html-response.js    # LLM response HTML extraction + image sanitization
│   ├── chat.js                 # POST /api/chat — Groq LLM for Handoff design generation
│   ├── deploy.js               # POST /api/deploy — deploy HTML to Vercel
│   ├── oauth.js                # GET /api/auth/* — Vercel OAuth PKCE flow (authorize/callback/status)
│   ├── save-design.js          # POST /api/save-design — persist design HTML to MongoDB
│   ├── get-designs.js          # GET /api/get-designs — list saved designs from MongoDB
│   ├── get-design.js           # GET /api/get-design — fetch single design by ID
│   ├── create-payment-link.js  # POST /api/create-payment-link — Stripe payment link
│   ├── soundcloud-daily.js     # GET /api/soundcloud-daily — Songdle daily song picker
│   ├── songdle-stream.js       # GET /api/songdle-stream — Spotify audio stream proxy
│   ├── songdle-songs.js        # GET /api/songdle-songs — song list for autocomplete
│   ├── spotify-preview.js      # GET /api/spotify-preview — Spotify preview fetch
│   ├── health.js               # GET /api/health — liveness check
│   └── auth/vercel/            # Empty dir (Vercel OAuth redirect placeholder)
│
├── src-ts/                     # TypeScript source (compiled to dist/)
│   └── validation.ts           # validateSaveDesignPayload() — typed request body validator
│
├── dist/                       # Compiled JS output from tsc (gitignored in dev, built in CI)
│   └── validation.js           # Runtime output consumed by api/save-design.js
│
├── projects/                   # Self-contained mini-app demos
│   ├── handoff/                # AI website builder (main demo app)
│   │   ├── index.html          # Handoff UI shell
│   │   ├── script.js           # All Handoff client logic (34 KB)
│   │   ├── styles.css          # Handoff stylesheet
│   │   ├── README.md
│   │   ├── HANDOFF_SETUP.md
│   │   └── Handoff-API.postman_collection.json
│   ├── songdle/                # Daily song guessing game
│   │   ├── index.html
│   │   ├── script.js           # Game logic + API calls (33 KB)
│   │   ├── style.css
│   │   ├── songs.json          # Song pool (90 KB, ~300+ tracks with metadata)
│   │   └── [build scripts]     # add-songs.js, enrich-spotify-ids.js, enrich-youtube.js, etc.
│   ├── taskmaster/             # Full-stack Next.js 14 task manager (separate app)
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── globals.css
│   │   │   │   ├── api/
│   │   │   │   │   ├── tasks/route.ts          # GET + POST /api/tasks
│   │   │   │   │   ├── tasks/[id]/route.ts     # PATCH + DELETE /api/tasks/:id
│   │   │   │   │   ├── auth/login/route.ts
│   │   │   │   │   └── auth/register/route.ts
│   │   │   │   ├── tasks/                      # Tasks page
│   │   │   │   └── login/                      # Login page
│   │   │   ├── components/
│   │   │   │   ├── TaskForm.tsx
│   │   │   │   └── TaskList.tsx
│   │   │   ├── models/
│   │   │   │   ├── Task.ts                     # Mongoose Task schema
│   │   │   │   └── User.ts                     # Mongoose User schema
│   │   │   ├── hooks/
│   │   │   │   ├── useTasks.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── lib/
│   │   │   │   ├── mongodb.ts                  # Mongoose connection helper
│   │   │   │   └── jwt.ts                      # JWT sign/verify
│   │   │   └── types/
│   │   │       ├── task.ts
│   │   │       └── react.d.ts
│   │   └── [Next.js config, package.json, etc.]
│   ├── studybuddy/             # Static study tool demo
│   │   ├── index.html
│   │   ├── script.js
│   │   └── styles.css
│   ├── connect-four/           # Static Connect Four game
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   └── adams-cookbook/         # Static recipe app
│       ├── index.html
│       ├── script.js
│       └── styles.css
│
├── assets/                     # Static portfolio assets
│   └── resumeAdamCamilleri.pdf
├── images/                     # Portfolio image assets
│
├── __tests__/                  # Jest unit tests (root-level)
│   ├── api-validation.test.js  # Supertest integration tests for API endpoints
│   └── html-response.test.js   # Unit tests for html-response.js helper
│
├── cypress/                    # Cypress E2E tests
│   └── e2e/
│       ├── portfolio.cy.js     # Portfolio page smoke tests
│       └── handoff.cy.js       # Handoff app interaction tests
│
├── jmeter/                     # JMeter load test plans
│   └── handoff-load-test-local.jmx
│
├── .github/
│   └── workflows/
│       └── ci.yml              # CI: validate API structure, build TS, Jest, Cypress, JMeter load
│
├── .planning/                  # GSD planning docs (not deployed)
│   └── codebase/
│
├── handoff/                    # Stub redirect pages (index.html only)
├── songdle/                    # Stub redirect pages (index.html only)
├── studybuddy/                 # Stub redirect pages (index.html only)
├── connect-four/               # Stub redirect pages (index.html only)
└── adams-cookbook/             # Stub redirect pages (index.html only)
```

## Directory Purposes

**`api/`:**
- Purpose: All serverless backend logic; each `.js` file is one Vercel function
- Contains: Request handlers, CORS logic, input validation, external API calls
- Key files: `api/chat.js` (largest, most complex), `api/oauth.js`, `api/deploy.js`
- Note: `api/_lib/` contains shared utilities and is NOT exposed as an endpoint (Vercel ignores `_` prefixed dirs)

**`api/_lib/`:**
- Purpose: Internal helpers shared by multiple API handlers; not individually routed
- Contains: MongoDB connection singleton, API key checker, HTML extractor
- Key files: `api/_lib/mongodb.js`, `api/_lib/api-key.js`, `api/_lib/html-response.js`

**`src-ts/`:**
- Purpose: TypeScript source files compiled by `tsc` to `dist/`
- Contains: Currently only `validation.ts`; intended to grow as more typed logic is extracted
- Key files: `src-ts/validation.ts`

**`dist/`:**
- Purpose: TypeScript compiler output consumed at runtime by API handlers
- Generated: Yes, by `npm run build` (`tsc`)
- Committed: No (built in CI and at deploy time)

**`projects/`:**
- Purpose: Self-contained mini-app demos; each is a deployable sub-application
- Contains: Static HTML/JS/CSS apps; TaskMaster is a full Next.js app with its own `package.json`
- Note: Apps that need the API point at `/api/...` on the same origin (or `localhost:3000` in dev)

**`projects/songdle/` (build scripts):**
- Purpose: Data pipeline scripts for building and enriching `songs.json`
- Contains: `add-songs.js`, `enrich-spotify-ids.js`, `enrich-youtube.js`, `build-from-artists.js`, etc.
- These are run locally to maintain the song database; not part of the web app's runtime

**`__tests__/`:**
- Purpose: Jest unit and API integration tests
- Contains: Supertest-based tests hitting `server.js` + unit tests for lib helpers
- Key files: `__tests__/api-validation.test.js`, `__tests__/html-response.test.js`

**`cypress/e2e/`:**
- Purpose: Cypress end-to-end browser tests
- Key files: `cypress/e2e/portfolio.cy.js`, `cypress/e2e/handoff.cy.js`

**`jmeter/`:**
- Purpose: JMeter load test plans run against the local dev server in CI
- Key files: `jmeter/handoff-load-test-local.jmx`

**Root-level stub dirs (`handoff/`, `songdle/`, etc.):**
- Purpose: Minimal `index.html` redirect pages at the root level; likely redirect to `/projects/<name>/`
- Contains: A single `index.html` each; not the actual apps

## Key File Locations

**Entry Points:**
- `index.html`: Portfolio site root
- `server.js`: Local Express dev server
- `projects/handoff/index.html` + `projects/handoff/script.js`: Handoff app
- `projects/songdle/index.html` + `projects/songdle/script.js`: Songdle app
- `projects/taskmaster/src/app/layout.tsx`: TaskMaster Next.js app root

**Configuration:**
- `package.json`: Root scripts (`dev`, `build`, `test`, `test:e2e`)
- `tsconfig.json`: TypeScript compiler config (`src-ts/` → `dist/`)
- `vercel.json`: Vercel routing (OAuth rewrites, SPA fallback)
- `cypress.config.js`: Cypress base URL and spec patterns
- `.github/workflows/ci.yml`: Full CI pipeline definition

**Core API Logic:**
- `api/chat.js`: AI design generation (most complex handler, ~230 lines)
- `api/oauth.js`: Vercel OAuth PKCE flow (~190 lines)
- `api/deploy.js`: Vercel deployment trigger (~130 lines)
- `api/_lib/mongodb.js`: MongoDB connection singleton
- `api/_lib/html-response.js`: LLM response HTML extraction

**Core Client Logic:**
- `projects/handoff/script.js`: All Handoff UI state and API integration (~34 KB, IIFE pattern)
- `projects/songdle/script.js`: All Songdle game logic (~33 KB)

**Validation:**
- `src-ts/validation.ts`: TypeScript source for payload validation
- `dist/validation.js`: Compiled output used at runtime

**Tests:**
- `__tests__/api-validation.test.js`: API endpoint integration tests (supertest)
- `__tests__/html-response.test.js`: Unit tests for HTML extraction helper
- `cypress/e2e/handoff.cy.js`: Handoff E2E tests
- `cypress/e2e/portfolio.cy.js`: Portfolio E2E tests

## Naming Conventions

**Files:**
- API handlers: `kebab-case.js` matching the URL path segment (e.g., `save-design.js` → `/api/save-design`)
- Client scripts: `script.js` in every project (consistent name across all mini-apps)
- Stylesheets: `style.css` or `styles.css` (inconsistent — both exist across projects)
- Test files: `*.test.js` for Jest; `*.cy.js` for Cypress

**Directories:**
- API utilities that are not endpoints: prefixed with `_` (e.g., `api/_lib/`) — Vercel convention
- Projects: `kebab-case` matching the app name
- TypeScript source: `src-ts/` (non-standard; avoids collision with Next.js `src/`)
- TaskMaster follows standard Next.js App Router conventions: `src/app/`, `src/components/`, `src/models/`, `src/hooks/`, `src/lib/`, `src/types/`

**Functions:**
- API handlers: exported as anonymous or named `handler` function (`module.exports = async function handler(req, res)`)
- Shared lib: named exports (`module.exports = { getDb }`, `module.exports = { checkApiKey }`)

## Where to Add New Code

**New API endpoint:**
- Create `api/<endpoint-name>.js` exporting `async function handler(req, res)`
- Register it in `server.js` with `app.METHOD('/api/<endpoint-name>', (req, res) => handler(req, res))`
- Add structure validation to `.github/workflows/ci.yml` `validate` job
- Follow CORS pattern from `api/chat.js`: define `ALLOWED_ORIGINS` array and local `corsHeaders()` helper

**New shared API utility:**
- Add to `api/_lib/<util-name>.js` with named exports
- Require it inline inside the handler (not at module top) to match existing pattern: `const { util } = require('./_lib/util.js')`

**New TypeScript validation helper:**
- Add to `src-ts/validation.ts` as a new exported function
- Run `npm run build` to compile; `dist/validation.js` is used at runtime

**New portfolio section:**
- Edit `index.html` for markup, `style.css` for styles
- No build step required

**New mini-app project:**
- Create `projects/<app-name>/` with `index.html`, `script.js`, `style.css`
- Add a stub redirect at `<app-name>/index.html` if needed for clean URLs
- If the app needs an API, add handlers under `api/` and register in `server.js`

**New TaskMaster page:**
- Add directory under `projects/taskmaster/src/app/<page>/page.tsx`
- Add API routes under `projects/taskmaster/src/app/api/<route>/route.ts`
- Add Mongoose models to `projects/taskmaster/src/models/`
- Add React components to `projects/taskmaster/src/components/`

**New test:**
- Jest unit/integration: `__tests__/<subject>.test.js`
- Cypress E2E: `cypress/e2e/<subject>.cy.js`

## Special Directories

**`api/_lib/`:**
- Purpose: Shared API utilities
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: TypeScript compiler output
- Generated: Yes (by `npm run build`)
- Committed: No (rebuilt in CI and on deploy)

**`node_modules/`:**
- Purpose: Root npm dependencies
- Generated: Yes (by `npm ci`)
- Committed: No

**`.planning/`:**
- Purpose: GSD planning documents (architecture maps, phase plans, etc.)
- Generated: By GSD commands
- Committed: Yes (part of the developer workflow)

**`projects/taskmaster/`:**
- Purpose: Entirely separate Next.js application with its own `package.json` and `node_modules`
- Note: CI runs TaskMaster build in a separate job with `working-directory: projects/taskmaster`; it is not part of the root npm workspace

---

*Structure analysis: 2026-03-06*
