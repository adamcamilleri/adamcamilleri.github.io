# adamcamilleri.github.io: Project Context

Personal portfolio + mini-app demos. See `.planning/STATE.md` for current phase and progress.

## Monorepo Layout

```
repo root/              Editorial portfolio (index.html, style.css, site.js, kinetic.js, smooth.js, lines.js)
├── pizza/              Feature 01 · The 72-Hour Pie
├── work/               Feature 02 · The Nightly Run (proficiencies, timeline, projects)
├── investing/          Feature 03 · The Long Position
├── api/                Vercel serverless functions (one file = one endpoint)
│   └── _lib/           Shared utilities: NOT endpoints (Vercel ignores _ dirs)
│       ├── cors.js     setCorsHeaders(req, res): CORS for all handlers
│       ├── api-key.js  checkApiKey(req, res): auth for POST endpoints
│       └── mongodb.js  getDb(): ping-guarded MongoClient singleton
├── projects/           Self-contained mini-app demos
│   ├── handoff/        AI website builder (main demo)
│   ├── songdle/        Daily song guessing game
│   ├── taskmaster/     Full Next.js 14 task manager (own package.json)
│   ├── studysmart/     Static study tool
│   ├── connect-four/   Static Connect Four game
│   ├── housing-dashboard/  Ontario housing data viz
│   ├── rose-portfolio/     Legacy portfolio design
│   └── adams-cookbook/  Static recipe app
├── __tests__/          Jest unit + API integration tests
├── cypress/e2e/        Cypress end-to-end tests
└── .planning/          GSD planning docs (not deployed)
```

## api/_lib/ Pattern

When adding an API endpoint, ALWAYS require `cors.js` from `api/_lib/` at the top of the handler body. Require `mongodb.js` the same way if the endpoint needs a database.

**Canonical handler pattern:**

```js
module.exports = async function handler(req, res) {
  const { setCorsHeaders } = require('./_lib/cors.js');
  const { getDb } = require('./_lib/mongodb.js');
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  // method check, validation, business logic...
};
```

Require inside the handler body (not at module top): this matches the existing codebase pattern.

## How to Run Tests

```bash
npm test                              # Jest (root): __tests__/*.test.js
cd projects/taskmaster && npm test    # TaskMaster Jest tests
npm run test:e2e                      # Cypress E2E: cypress/e2e/*.cy.js
```

## Key Env Vars

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Required: Handoff AI generation |
| `MONGODB_URI` | MongoDB persistence |
| `VERCEL_TOKEN` | Programmatic deploy button |

See `.env.example` for the full list.

## Adding Code

**New API endpoint:**
1. Create `api/<name>.js` exporting `async function handler(req, res)`
2. Require `cors.js` from `_lib/` as the first line inside the handler
3. Register the route in `server.js` for local dev

**New mini-app project:**
1. Create `projects/<name>/` with `index.html`, `script.js`, `style.css`
2. If the app needs an API, add handlers under `api/` and register in `server.js`

## Bug Reports

When a bug is reported, do not start by trying to fix it. Instead:
1. Write a test that reproduces the bug first
2. Have subagents attempt the fix
3. Prove the fix works via a passing test

## Security Rules

- No hardcoded secrets: always use `process.env.*`
- All API request bodies must be validated (type, size, required fields)
- XSS prevention: use DOM APIs (`textContent`, `createElement`), never `innerHTML` with user-supplied content
- Auth checks must run before any protected operation

## Deep Context

For detailed architecture docs, see:
- [Requirements](.planning/REQUIREMENTS.md): what needs to be built and why
- [Roadmap](.planning/ROADMAP.md): phase sequence and progress
- [State](.planning/STATE.md): current phase, decisions, blockers
- [Structure](.planning/codebase/STRUCTURE.md): full directory tree and file purposes
- [Conventions](.planning/codebase/CONVENTIONS.md): coding patterns and style
- [Integrations](.planning/codebase/INTEGRATIONS.md): external services and APIs
- [Testing](.planning/codebase/TESTING.md): test strategy and locations
