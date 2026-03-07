# Coding Conventions

**Analysis Date:** 2026-03-06

## Naming Patterns

**Files:**
- API handlers: `kebab-case.js` (e.g., `create-payment-link.js`, `save-design.js`, `html-response.js`)
- Test files: `kebab-case.test.js` placed in `__tests__/` (e.g., `api-validation.test.js`, `html-response.test.js`)
- E2E test files: `kebab-case.cy.js` placed in `cypress/e2e/` (e.g., `handoff.cy.js`, `portfolio.cy.js`)
- TypeScript source: `kebab-case.ts` in `src-ts/` (e.g., `validation.ts`)
- Compiled output: mirrored in `dist/` (e.g., `dist/validation.js`)
- Private/shared lib modules: `api/_lib/` prefix (e.g., `api/_lib/api-key.js`, `api/_lib/html-response.js`)

**Functions:**
- camelCase for all functions: `corsHeaders`, `parseCookies`, `checkApiKey`, `extractHtmlFromResponse`, `fixImagePlaceholders`, `callChatApi`, `extractText`
- Handler functions exported as anonymous async functions assigned to `module.exports`
- Helper functions defined as named declarations before the exported handler

**Variables:**
- camelCase for local variables: `keyCheck`, `userToken`, `chatMessages`, `summaryMatch`
- UPPER_SNAKE_CASE for module-level constants: `ALLOWED_ORIGINS`, `DEFAULT_SYSTEM`, `SHARED_PROJECT_NAME`
- Environment variables accessed via `process.env.VAR_NAME` pattern

**Types (TypeScript):**
- PascalCase interfaces: `SaveDesignPayload`
- Union return types for validation results: `{ valid: true; html: string; name: string } | { valid: false; error: string }`

## Code Style

**Formatting:**
- No automated formatter configured (no `.prettierrc` or `biome.json` detected)
- API handlers (`api/chat.js`, `api/deploy.js`, `api/create-payment-link.js`) use 4-space indentation
- Lib modules (`api/_lib/*.js`) and test files use 2-space indentation — inconsistency between handler files and lib files

**Linting:**
- No ESLint configuration detected
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- TypeScript compiler options: `target: ES2020`, `module: commonjs`, `esModuleInterop: true`, `skipLibCheck: true`

## Import Organization

**Order (as observed in API handlers):**
1. No explicit external package imports at top of file — dependencies loaded inline via `require()` inside the handler function body
2. Internal lib modules required inside handler: `require('./_lib/api-key.js')`, `require('./_lib/html-response.js')`, `require('../dist/validation.js')`

**Pattern:**
- Module-level requires: only Node built-ins and `mongodb` (in `api/_lib/mongodb.js`)
- Handler-level requires: API key validation, HTML helpers, and validation modules are required inside the handler function body, not at module top — this is the established pattern for Vercel serverless functions

**TypeScript:**
- `export function` named exports (no default exports in `.ts` files)
- `module.exports` CommonJS for `.js` files

## Error Handling

**Patterns:**
- All API handlers use early-return guard clauses for validation, not nested conditionals
- JSON parse errors caught with try/catch returning `400`: `return res.status(400).json({ error: 'Invalid JSON' })`
- External API errors return the upstream status code with `{ error: '...', details: rawErrorText }` shape
- Database errors return `500` with `{ error: 'Database error', details: err.message }`
- Missing environment variable errors return `500` with a descriptive message including where to configure the variable
- All error responses are JSON objects with an `error` string key; some include a `details` key

**Guard clause order in handlers:**
1. Set CORS headers
2. Handle OPTIONS (204)
3. Method check (405)
4. API key check (401)
5. JSON parse (400)
6. Field validation (400 / 413)
7. Environment variable check (500)
8. Business logic in try/catch (500)

**TypeScript validation:**
- `src-ts/validation.ts` exports typed validators returning discriminated unions (`{ valid: true, ... } | { valid: false, error: string }`)
- Validation compiled to `dist/validation.js`; API handlers require it with a fallback inline validation in a try/catch in case the compiled file is absent

## Logging

**Framework:** `console.log` only

**Patterns:**
- `server.js` logs startup info: `console.log('Handoff dev server: http://localhost:${PORT}')`
- No structured logging; no error logging in handler catch blocks (errors are returned as JSON, not logged)

## Comments

**When to Comment:**
- File-level JSDoc block describing the module's purpose, HTTP method, and relevant env vars (all API handlers have this)
- Function-level JSDoc with `@param` and `@returns` for lib utilities (`api/_lib/html-response.js`)
- Inline comments for non-obvious logic (e.g., Vercel project limit workaround in `api/deploy.js`, cookie parsing)
- Test file header comments describe testing purpose (e.g., "shift-left testing", "XSS prevention")

**Style:**
- `/** ... */` JSDoc blocks at file and function level
- `//` single-line for inline explanation

## Function Design

**Size:** Small, focused functions. Handler functions are longer but structured as sequential guard clauses

**Parameters:** All API handlers take `(req, res)` — Node/Express/Vercel compatible signature

**Return Values:**
- Handlers always `return res.status(N).json(...)` or `return res.status(N).end()`
- Never fall through to implicit undefined return in handlers
- Helper functions return typed values or `null` (e.g., `extractHtmlFromResponse` returns `string | null`)

## Module Design

**Exports:**
- API handlers: `module.exports = async function handler(req, res) { ... }`
- Lib utilities: `module.exports = { namedExport1, namedExport2 }`
- TypeScript: named `export function` declarations

**Barrel Files:** Not used

**Fallback pattern:**
- `api/save-design.js` wraps the TypeScript-compiled validator in try/catch and falls back to inline validation — use this pattern when compiled output may be absent

---

*Convention analysis: 2026-03-06*
