# Codebase Concerns

**Analysis Date:** 2026-03-06

## Tech Debt

**Usage limit permanently disabled:**
- Issue: `canGenerate()` in `projects/handoff/script.js` line 86 returns `true` unconditionally with the comment "limit disabled until app is ready". The `FREE_LIMIT = 3` constant and `upgradeModal` UI are wired up but the gate never fires.
- Files: `projects/handoff/script.js` lines 10, 85–87, 305
- Impact: Unlimited free use of the Groq API at the operator's expense. The upgrade/monetization flow is dead code until this is restored.
- Fix approach: Replace `return true` with `return getUsage().count < FREE_LIMIT` and remove the comment. Verify upgrade modal renders correctly on limit breach.

**CORS whitelist duplicated across every API handler:**
- Issue: The 9-entry `ALLOWED_ORIGINS` array and `corsHeaders()` function are copy-pasted identically into `api/chat.js`, `api/deploy.js`, `api/save-design.js`, `api/get-designs.js`, `api/get-design.js`, `api/create-payment-link.js`. Any change (new domain, new rule) must be made in 6 places.
- Files: `api/chat.js`, `api/deploy.js`, `api/save-design.js`, `api/get-designs.js`, `api/get-design.js`, `api/create-payment-link.js`
- Impact: High maintenance risk; a domain added to one file but missed in others causes silent CORS failures.
- Fix approach: Extract into `api/_lib/cors.js` and import it in each handler. One-line change per file.

**Compiled JS (`dist/`) committed to version control:**
- Issue: `dist/validation.js` (compiled TypeScript output) is tracked in git alongside the source `src-ts/validation.ts`. The TypeScript build step exists in CI but the output file is also in the repo.
- Files: `dist/validation.js`, `src-ts/validation.ts`, `tsconfig.json`
- Impact: Risk of source/dist mismatch if someone edits `dist/validation.js` directly, or forgets to rebuild. `dist/` should be in `.gitignore`.
- Fix approach: Add `dist/` to `.gitignore`. Let CI generate it. Update `api/save-design.js` fallback path if needed.

**`api/_lib/mongodb.js` does not handle serverless cold-start reconnect:**
- Issue: The module caches the MongoClient in a module-level `cached` variable. In a Vercel serverless environment, if the cached connection becomes stale or drops (e.g. after inactivity), no reconnect logic exists — the cached promise simply returns the dead connection.
- Files: `api/_lib/mongodb.js`
- Impact: Intermittent 500 errors on `save-design`, `get-designs`, `get-design` after periods of inactivity.
- Fix approach: Add `isConnected()` / `ping` check before returning cached connection, or use the standard Vercel MongoDB connection pattern with `MongoClient.connect()` guard.

**`dist/` directory contains only one compiled file yet has its own CI build step:**
- Issue: `tsconfig.json` compiles `src-ts/validation.ts` to `dist/validation.js`. Only one TypeScript file exists. The build step (`npm run build`) runs in CI for this single file.
- Files: `tsconfig.json`, `src-ts/validation.ts`
- Impact: Over-engineered for a single file. Adds build complexity without proportional benefit.
- Fix approach: Either expand TypeScript usage across more API files to justify the toolchain, or inline the validation logic directly and drop the TypeScript build step.

**Songdle songs stored as a static JSON file read synchronously on every request:**
- Issue: `api/soundcloud-daily.js` and `api/songdle-stream.js` both call `fs.readFileSync(SONGS_PATH, 'utf8')` on every request with no caching. `songs.json` is a large data file.
- Files: `api/soundcloud-daily.js` lines 13–23, `api/songdle-stream.js` lines 12, 36
- Impact: Unnecessary disk I/O on every Songdle API call. On Vercel, each cold start re-reads the file; warm instances do repeated reads.
- Fix approach: Cache the parsed array in a module-level variable after the first read.

## Known Bugs

**`summaryText.innerHTML` injects unsanitized user input:**
- Symptoms: Onboarding step 4 builds an HTML string using `onboarding.name` (from `nameInput`), `onboarding.businessDesc` (from `bizDescInput`), and `onboarding.location` (from `locationInput`) and assigns it directly to `element.innerHTML`.
- Files: `projects/handoff/script.js` lines 543–546
- Trigger: User types `<img src=x onerror=alert(1)>` into any onboarding field.
- Workaround: None currently. Impact is self-XSS (user's own session), but notable if multi-user session sharing is ever added.
- Fix approach: Use `textContent` for user-supplied values and construct the `<strong>` tags using DOM APIs, or run values through a text-escape helper before interpolation.

## Security Considerations

**Wildcard CORS (`Access-Control-Allow-Origin: *`) on public-data Songdle endpoints:**
- Risk: `api/soundcloud-daily.js`, `api/songdle-stream.js`, `api/songdle-songs.js`, `api/spotify-preview.js`, and `api/health.js` all respond with `Access-Control-Allow-Origin: *`. These are read-only public endpoints so the risk is low, but it allows any site to proxy these APIs and attribute traffic costs to the owner.
- Files: `api/soundcloud-daily.js` line 46, `api/songdle-stream.js` line 14, `api/songdle-songs.js` line 12, `api/spotify-preview.js` line 9, `api/health.js` line 6
- Current mitigation: Endpoints are read-only; no secrets are exposed.
- Recommendations: Restrict to known origins using the same allowlist pattern used by other API handlers, or add a low-cost GROQ-key equivalent check.

**JWT fallback secret in Taskmaster:**
- Risk: `projects/taskmaster/src/lib/jwt.ts` line 4 uses `process.env.JWT_SECRET ?? 'missing-secret'` as a fallback. If `JWT_SECRET` is not set in production, JWTs are signed with a well-known public string, allowing anyone to forge tokens.
- Files: `projects/taskmaster/src/lib/jwt.ts` line 4
- Current mitigation: `JWT_SECRET` is listed in `projects/taskmaster/.env.example` but not enforced at startup.
- Recommendations: Throw an error at startup if `JWT_SECRET` is missing in production (`NODE_ENV === 'production'`). Never use a hardcoded fallback for signing secrets.

**Taskmaster login route does not validate email format:**
- Risk: `projects/taskmaster/src/app/api/auth/login/route.ts` accepts any non-empty string as `email`. MongoDB query is performed with unvalidated input.
- Files: `projects/taskmaster/src/app/api/auth/login/route.ts` lines 10–13
- Current mitigation: MongoDB `findOne` will simply return null for malformed emails, causing a generic 401. No data leak risk.
- Recommendations: Add email format validation (e.g. regex or `zod`) before database query.

**No authentication on MongoDB design storage (save/get-designs):**
- Risk: Any caller who passes the optional API key check (which is bypassed when `API_KEYS` env var is unset) can save designs to the shared MongoDB collection and list/retrieve all saved designs. There is no per-user scoping.
- Files: `api/save-design.js`, `api/get-designs.js`, `api/get-design.js`
- Current mitigation: `API_KEYS` env var can restrict access, but is optional and defaults to open.
- Recommendations: Either enable `API_KEYS` in production or add per-user authentication before designs go into active use.

**`api/spotify-preview.js` scrapes Spotify's internal `__NEXT_DATA__` JSON:**
- Risk: This approach depends on Spotify's private embed page HTML structure. Spotify can change or remove `__NEXT_DATA__` at any time, breaking preview resolution with no warning.
- Files: `api/spotify-preview.js` lines 51–73
- Current mitigation: The endpoint is guarded by `SPOTIFY_ENABLED !== 'true'` (disabled by default). Errors are caught and return `preview_not_found`.
- Recommendations: Document this as fragile and monitor Spotify's embed page. The official Spotify Web API preview URL field is the stable alternative but requires OAuth.

**Vercel OAuth callback redirect URI constructed from runtime `origin` header:**
- Risk: `api/oauth.js` constructs `redirect_uri` as `${origin}/callback` where `origin` is derived from request headers. If `origin` is spoofed in a crafted request, the OAuth callback might redirect to an unintended URI.
- Files: `api/oauth.js` lines 57–58, 85–92
- Current mitigation: Vercel's OAuth server will reject redirect URIs not registered for the OAuth app. The PKCE `state` parameter also mitigates CSRF. Risk is low but the pattern is fragile.
- Recommendations: Hardcode the expected callback URI(s) rather than constructing from runtime headers.

## Performance Bottlenecks

**Handoff sends full page HTML (up to 14,000 chars truncated to that) on every chat turn:**
- Problem: Every `/api/chat` POST includes `currentHtml` in the system prompt (up to 14,000 chars) and the full history array. This inflates token counts and Groq API latency on every turn.
- Files: `api/chat.js` lines 201–203, `projects/handoff/script.js` lines 358–367
- Cause: The AI needs context to make targeted edits. The truncation at 14,000 chars is a mitigation but still sends large payloads.
- Improvement path: For element-level edits the `elementEdit` path already limits to 15,000 chars of page HTML + 4,000 of selected element. The main chat path could similarly scope to the relevant section when the intent is clearly a targeted edit.

**`songdle-stream` buffers the entire audio file into memory before responding:**
- Problem: `api/songdle-stream.js` line 74 calls `streamRes.arrayBuffer()`, loading the entire audio file into memory, then sends it. iTunes previews are ~30 second MP3 clips (~500KB), but this eliminates streaming benefits.
- Files: `api/songdle-stream.js` lines 74–79
- Cause: Vercel serverless functions can pipe responses but the current code fully buffers first.
- Improvement path: Use `res.write()` with streaming body if Vercel's runtime supports it, or accept the buffering cost since file sizes are small.

## Fragile Areas

**`replacePlaceholderDiv` in Handoff uses string scanning, not DOM parsing:**
- Files: `projects/handoff/script.js` lines 112–132
- Why fragile: This function walks raw HTML character-by-character to find the first `bg-gray-100 rounded-2xl` placeholder div and replace it. It tracks nesting depth manually. Any AI-generated variant on the class order, self-closing divs, or deeply nested AI output can cause it to return `null`, silently dropping the image placement.
- Safe modification: If changing image upload behavior, always test with AI-generated HTML that varies class ordering (e.g. `rounded-2xl bg-gray-100`). The function already handles both orderings in `markers` array.
- Test coverage: No unit test for this function. Its behavior is tested only implicitly through Cypress E2E (which mocks the API).

**`prepareCurrentHtml` / `setPreview` image placeholder restoration uses index-based replacement:**
- Files: `projects/handoff/script.js` lines 100–108, 136–139
- Why fragile: Base64 images are stripped and replaced with `[img1]`, `[img2]` tokens, then restored after the API round-trip. If the AI response reorders or drops these tokens, image data is permanently lost for that session (not persisted).
- Safe modification: Any change to AI prompting that might affect how `[imgN]` tokens survive in the HTML output should be tested with images already uploaded to the canvas.
- Test coverage: No unit or E2E test covers image round-trip preservation.

**Onboarding state is purely in-memory (no persistence):**
- Files: `projects/handoff/script.js` lines 65, 571–631
- Why fragile: If the page is refreshed mid-onboarding or mid-session, all `state` and `onboarding` data is lost. There is no `localStorage` save of the generated HTML or conversation history.
- Safe modification: Any feature that depends on state surviving page reload needs to add persistence explicitly.
- Test coverage: Cypress tests mock the API and complete onboarding in a single flow; no persistence scenario is tested.

**`getDailyIndex` hash function produces uniform distribution only for large song pools:**
- Files: `api/soundcloud-daily.js` lines 25–28
- Why fragile: The rolling-multiply hash (`h * 31 + charCode >>> 0`) is not cryptographically uniform. For small genre sub-pools the modulo can produce skewed selection (same song repeated across nearby dates).
- Safe modification: Adding songs to the pool changes which song is selected for every past date, breaking replay consistency for users who cached their game state.
- Test coverage: Not tested.

## Scaling Limits

**MongoDB connection caching breaks under high serverless concurrency:**
- Current capacity: Single cached connection shared across serverless invocations.
- Limit: Under concurrent cold starts, multiple instances each create a new MongoClient without awareness of each other. MongoDB Atlas free tier limits simultaneous connections to 500.
- Scaling path: Use a connection pool size appropriate for the tier, or migrate to Mongoose with connection pool config. Consider `mongoose` which handles reconnect automatically.

**Groq API has no retry or backoff logic:**
- Current capacity: Single `fetch` call to Groq with no timeout, no retry.
- Limit: On Groq rate-limit (429) or transient error, the handler returns the error directly to the client with no retry.
- Files: `api/chat.js` lines 100–107, 217–220
- Scaling path: Add exponential backoff with 1–2 retries for 429/503 responses.

## Dependencies at Risk

**`api/spotify-preview.js` has no npm dependency — scrapes Spotify HTML:**
- Risk: Spotify's embed page structure (specifically `__NEXT_DATA__` JSON) is an undocumented internal API that changes without notice. The endpoint is currently disabled by default (`SPOTIFY_ENABLED` flag) precisely because of this fragility.
- Files: `api/spotify-preview.js`
- Impact: Preview URLs for Spotify-sourced Songdle songs break silently when Spotify redeploys their embed page.
- Migration plan: Use the Spotify Web API's `preview_url` field via OAuth Client Credentials flow (no user login needed for track data).

## Missing Critical Features

**No server-side rate limiting on the chat API:**
- Problem: `/api/chat` and `/api/deploy` have no IP-based or token-based rate limiting. The client-side `canGenerate()` check is permanently bypassed (returns `true`). Any actor can send unlimited requests, driving up Groq API costs.
- Blocks: Monetization, cost control, fair use enforcement.
- Files: `api/chat.js`, `api/deploy.js`, `projects/handoff/script.js` line 86

**No delete endpoint for saved designs:**
- Problem: `api/save-design.js` can create designs, `api/get-designs.js` and `api/get-design.js` can read them. There is no DELETE endpoint. The 50-design list cap in `get-designs` means old designs accumulate indefinitely.
- Blocks: Design management UI, storage hygiene.
- Files: `api/get-designs.js` line 47

## Test Coverage Gaps

**No unit tests for Handoff `script.js` core logic:**
- What's not tested: `replacePlaceholderDiv`, `prepareCurrentHtml`/`setPreview` image round-trip, `buildFollowupQuestion`, `generateFromOnboarding`, onboarding state machine.
- Files: `projects/handoff/script.js`
- Risk: Image upload placement and HTML manipulation logic can break silently. The Cypress E2E tests mock the API so they don't exercise real AI output paths.
- Priority: High

**No tests for `api/oauth.js` (PKCE, state/nonce validation, cookie lifecycle):**
- What's not tested: State mismatch redirect, nonce mismatch redirect, cookie expiry, `handleCallback` token exchange path.
- Files: `api/oauth.js`
- Risk: Auth security regressions. The PKCE flow is complex and has multiple error branches that are not exercised.
- Priority: High

**Cypress E2E tests mock API calls entirely:**
- What's not tested: Real AI-generated HTML output, actual deploy flow, real image placement, real API error handling.
- Files: `cypress/e2e/handoff.cy.js` line 18
- Risk: E2E tests pass even if the API handlers are broken. They test UI structure only.
- Priority: Medium

**No test coverage for Songdle game logic:**
- What's not tested: Daily index calculation, genre filtering, guess evaluation, stats persistence in `localStorage`, unlimited mode song deduplication.
- Files: `projects/songdle/script.js`
- Risk: Game logic (which song is picked, how guesses are scored) can regress silently across deployments.
- Priority: Medium

---

*Concerns audit: 2026-03-06*
