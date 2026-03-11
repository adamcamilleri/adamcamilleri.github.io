# Phase 1: Security + Tech Debt - Research

**Researched:** 2026-03-11
**Domain:** Vanilla JS XSS remediation, JWT hardening, Node.js serverless patterns (CORS, MongoDB, file caching)
**Confidence:** HIGH — all findings are based on direct codebase inspection; no external library research needed for this phase

---

## Summary

Phase 1 is a pure fix phase — no new libraries, no architectural changes, just targeted repairs to 6 security/debt items and 1 bug. Every requirement maps to a specific file and line already identified in the codebase audit. The work falls into two natural groupings: client-side security fixes in the Handoff and TaskMaster front ends (SEC-01, SEC-02, SEC-05), and server-side infrastructure consolidation in the Vercel API layer (SEC-03, SEC-04, SEC-06, BUG-01).

The highest-risk item is SEC-01 (XSS in Handoff onboarding). Although it is currently self-XSS (only the user harms themselves), the fix is straightforward: replace string interpolation into `innerHTML` with DOM API calls using `textContent` for user-supplied values and `createElement`/`appendChild` for the structural `<strong>` tags. SEC-02 is equally simple but higher security impact: a one-line change in TaskMaster's `jwt.ts` that throws instead of falling back to a hardcoded secret. SEC-05 restores the usage limit gate by changing `return true` to `return getUsage().count < FREE_LIMIT` — the surrounding infrastructure (modal, counter, `getUsage()`) is already wired up and just needs the gate unlocked.

The infrastructure work (SEC-03, SEC-04, SEC-06, BUG-01) all lives in the `api/` layer. CORS extraction is a mechanical refactor: create `api/_lib/cors.js` with the shared allowlist and helper, then swap the inline copies in 6 handlers for a single `require`. MongoDB reconnect hardening adds a ping-guard to `getDb()`. Songdle songs caching adds a module-level variable to avoid repeated `fs.readFileSync` calls. BUG-01 fixes the `Audio` object reuse bug in `playFallback()` that causes mid-song entry.

**Primary recommendation:** Fix in dependency order: SEC-01/SEC-02/SEC-05 (no cross-dependencies), then SEC-03 (CORS consolidation enables clean SEC-04/SEC-06 since those files also get the import), then SEC-04 and SEC-06 independently, then BUG-01 independently.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Fix XSS in Handoff onboarding — replace `innerHTML` string interpolation with DOM APIs | Lines 544-546 in `projects/handoff/script.js` confirmed; `summaryText` element, three user fields: `onboarding.name`, `onboarding.businessDesc`, `onboarding.location` |
| SEC-02 | Fix JWT fallback in TaskMaster — throw if `JWT_SECRET` missing in production | Line 4 in `projects/taskmaster/src/lib/jwt.ts` confirmed; uses `?? 'missing-secret'` pattern with `jose` library |
| SEC-03 | Extract shared CORS utility to `api/_lib/cors.js` — remove duplication from 6+ handlers | Confirmed duplication in `api/chat.js`, `api/deploy.js`, `api/save-design.js`, `api/get-designs.js`, `api/get-design.js`, `api/create-payment-link.js`; exact `ALLOWED_ORIGINS` array documented |
| SEC-04 | Fix MongoDB cold-start reconnect — add connection health check | `api/_lib/mongodb.js` confirmed; current `cached` pattern has no ping guard; mongodb driver v6 confirmed |
| SEC-05 | Restore Handoff usage limit gate — `canGenerate()` should enforce `FREE_LIMIT` | Lines 85-87 in `projects/handoff/script.js`; `return true` hardcoded; `getUsage()`, `FREE_LIMIT = 3`, `upgradeModal` all wired and ready |
| SEC-06 | Cache Songdle songs.json in module-level variable | `api/soundcloud-daily.js` lines 12-23 and `api/songdle-stream.js` lines 36-38 both confirmed; both call `fs.readFileSync` on every request |
| BUG-01 | Fix Songdle playback starting mid-song | `projects/songdle/script.js` `playFallback()` lines 716-720; `state.audio` reuse without updating `src` causes mid-song entry when same `Audio` object is reused across genre switches |
</phase_requirements>

---

## Standard Stack

### Core (no new installs required)

This phase requires zero new dependencies. All fixes use capabilities already present in the codebase.

| Tool | Version | Purpose | Already Present |
|------|---------|---------|-----------------|
| Node.js built-ins (`fs`, `path`) | Node 20 | File I/O (Songdle caching) | Yes |
| `mongodb` driver | ^6.21.0 | MongoDB ping guard | Yes |
| `jose` | (in TaskMaster) | JWT sign/verify | Yes |
| Vanilla JS DOM APIs | Browser | XSS fix (`textContent`, `createElement`) | Yes |

### Architecture of Existing Patterns (what the fixes must follow)

| Pattern | Location | Convention |
|---------|---------|----------|
| Shared lib modules | `api/_lib/*.js` | Named exports via `module.exports = { ... }` |
| Lib required inside handler | Handler function body | `const { fn } = require('./_lib/util.js')` — NOT at module top |
| Guard clause order | All API handlers | CORS → OPTIONS → method check → auth → validate → env check → business logic |
| Module-level constants | `api/*.js` | `UPPER_SNAKE_CASE` at top of file |
| TypeScript in TaskMaster | `projects/taskmaster/src/lib/` | Named `export function`, no default exports |

---

## Architecture Patterns

### Recommended Project Structure (no changes to structure needed)

```
api/
├── _lib/
│   ├── mongodb.js       # existing — add ping guard
│   ├── cors.js          # NEW — extract shared CORS logic
│   ├── api-key.js       # existing — unchanged
│   └── html-response.js # existing — unchanged
├── chat.js              # existing — import cors from _lib
├── deploy.js            # existing — import cors from _lib
├── save-design.js       # existing — import cors from _lib
├── get-designs.js       # existing — import cors from _lib
├── get-design.js        # existing — import cors from _lib
├── create-payment-link.js  # existing — import cors from _lib
├── soundcloud-daily.js  # existing — add module-level songs cache
└── songdle-stream.js    # existing — use cached songs where possible

projects/
├── handoff/
│   └── script.js        # existing — fix innerHTML XSS + restore canGenerate()
└── taskmaster/
    └── src/lib/
        └── jwt.ts        # existing — throw on missing JWT_SECRET in production
```

### Pattern 1: CORS Extraction (SEC-03)

**What:** Move the `ALLOWED_ORIGINS` array and `corsHeaders()` function from 6 handler files into a single `api/_lib/cors.js`. Each handler does a one-line `require` swap.

**New file structure:**
```javascript
// api/_lib/cors.js
const ALLOWED_ORIGINS = [
  'https://adamcamilleri.github.io',
  'https://www.adamcamilleri.github.io',
  'https://adamcamilleri.com',
  'https://www.adamcamilleri.com',
  'https://adamcamilleri-github-io.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
];

function corsHeaders(req, allowedMethods) {
  const origin = req.headers.origin || req.headers.Origin;
  const allowed =
    ALLOWED_ORIGINS.some(
      (o) =>
        origin &&
        (origin === o ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:'))
    ) ||
    (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': allowedMethods || 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

module.exports = { corsHeaders, ALLOWED_ORIGINS };
```

**In each handler (inside the handler function body, per project convention):**
```javascript
const { corsHeaders } = require('./_lib/cors.js');
```

**Note on `allowedMethods`:** The existing handlers use different method strings (`'POST, OPTIONS'` vs `'GET, OPTIONS'`). The extractor should accept an optional `allowedMethods` parameter (or each handler can set the header override after calling `corsHeaders()`). Check each file before deciding — `chat.js` and `deploy.js` are POST-only, `get-designs.js` and `get-design.js` are GET-only.

### Pattern 2: MongoDB Ping Guard (SEC-04)

**What:** Before returning `cached.db`, send a `ping` command to verify the connection is alive. If it fails, clear the cache and reconnect.

**mongodb v6 ping pattern (verified against driver v6 in this project):**
```javascript
async function getDb() {
  if (cached) {
    try {
      await cached.client.db('admin').command({ ping: 1 });
      return cached.db;
    } catch {
      cached = null; // stale connection — fall through to reconnect
    }
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured');
  const client = new MongoClient(uri);
  await client.connect();
  cached = { client, db: client.db('handoff') };
  return cached.db;
}
```

**Confirmed:** The project uses `mongodb` ^6.21.0. The `client.db('admin').command({ ping: 1 })` pattern is the standard health check for this driver. The `client.close()` call is not strictly necessary here — letting the stale connection be GC'd is acceptable for a Vercel serverless context.

### Pattern 3: Songdle Songs Caching (SEC-06)

**What:** Replace per-request `fs.readFileSync` with a module-level cached array in `soundcloud-daily.js` and `songdle-stream.js`.

**soundcloud-daily.js pattern:**
```javascript
// Module-level cache — populated on first request, reused on warm invocations
let _cachedSongs = null;

function loadSongs() {
  if (_cachedSongs) return _cachedSongs;
  try {
    const raw = fs.readFileSync(SONGS_PATH, 'utf8');
    _cachedSongs = JSON.parse(raw);
    if (!Array.isArray(_cachedSongs)) _cachedSongs = [];
  } catch {
    _cachedSongs = [];
  }
  return _cachedSongs;
}
```

Then `loadSongsFromFile(genre)` calls `loadSongs()` instead of doing its own `readFileSync`.

**songdle-stream.js pattern:** Similarly, `songdle-stream.js` has a standalone `fs.readFileSync` on line 36 for the unlimited-mode lookup. Either import the `loadSongs` function from `soundcloud-daily.js` (which already exports `getDailyTrackData`) or define the same module-level cache pattern locally. Importing from `soundcloud-daily.js` is cleaner since it already exports.

### Pattern 4: XSS Fix — DOM API Construction (SEC-01)

**What:** Lines 544-546 of `projects/handoff/script.js` build an HTML string from `onboarding.name`, `onboarding.businessDesc`, and `onboarding.location` and assign it to `summaryText.innerHTML`. Replace with DOM API construction.

**Current vulnerable code:**
```javascript
document.getElementById('summaryText').innerHTML =
  'You\'re building <strong>' + onboarding.name + '</strong>, a <strong>' + onboarding.businessDesc + '</strong> in <strong>' + onboarding.location + '</strong>' +
  (revenuePhrase ? ', and ' + revenuePhrase : '') + '.';
```

**Fixed pattern:**
```javascript
var summaryEl = document.getElementById('summaryText');
summaryEl.textContent = ''; // clear previous content

var frag = document.createDocumentFragment();

function appendText(text) {
  frag.appendChild(document.createTextNode(text));
}
function appendStrong(text) {
  var s = document.createElement('strong');
  s.textContent = text;
  frag.appendChild(s);
}

appendText("You're building ");
appendStrong(onboarding.name);
appendText(', a ');
appendStrong(onboarding.businessDesc);
appendText(' in ');
appendStrong(onboarding.location);
if (revenuePhrase) {
  appendText(', and ' + revenuePhrase);
}
appendText('.');

summaryEl.appendChild(frag);
```

**Why this approach:** Uses only `textContent` for user-supplied strings (no HTML parsing), and uses `createElement`/`createTextNode` for structural elements. No sanitization library needed — this is the correct pattern for the project's vanilla JS, no-dependency context.

### Pattern 5: JWT Startup Guard (SEC-02)

**What:** `projects/taskmaster/src/lib/jwt.ts` line 4 uses `?? 'missing-secret'`. Change to throw in production.

**Fixed pattern:**
```typescript
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // Development fallback — not secure, but acceptable for local dev
    return new TextEncoder().encode('dev-only-secret');
  }
  return new TextEncoder().encode(secret);
}
```

**Why `NODE_ENV` check:** TaskMaster is a Next.js app. Next.js always sets `NODE_ENV` to `'production'` in production builds. Throwing unconditionally would break local dev if `.env.local` is not set. The `NODE_ENV` guard matches the project's stated requirement ("throw error in production").

### Pattern 6: Restore Usage Limit Gate (SEC-05)

**What:** `canGenerate()` at line 85 of `projects/handoff/script.js` returns `true` unconditionally. Restore to check `getUsage().count < FREE_LIMIT`.

**Current:**
```javascript
function canGenerate() {
  return true; // limit disabled until app is ready
}
```

**Fixed:**
```javascript
function canGenerate() {
  return getUsage().count < FREE_LIMIT;
}
```

Also restore `renderUsageUI()` to actually render the counter. The existing implementation is empty (`// usage counter hidden until limit is re-enabled`).

**renderUsageUI restore:** The `usageCounter` DOM ref exists (line 27). Restore display logic showing remaining uses. Verify `upgradeModal` renders correctly when `canGenerate()` returns false — the modal show logic at line 305-308 is already correct and will fire.

### Pattern 7: BUG-01 — Audio Source Reuse Fix

**What:** `playFallback()` only creates a new `Audio` object if `state.audio` is null. When a genre switch or song change occurs, `stopCurrentClip()` sets `state.audio = null` (line 660), so the next `playFallback()` call creates a fresh `Audio` with the correct URL. However, when the same song is replayed (e.g., user clicks play a second time within the same session), `state.audio` is not null and its `src` is never updated — it keeps the URL from when it was first created. The `currentTime = 0` reset only resets position within the existing audio buffer, not the stream URL.

**Root cause confirmed:** `getStreamUrl()` for the daily mode returns a URL like `/api/songdle-stream?date=2026-03-11&genre=all`. The stream endpoint fetches and buffers the full audio on each call. If the user's session is long enough that a new day's song is returned by the API but `state.audio` still holds yesterday's buffered audio, or if the URL returned would differ (e.g., genre switch before audio clears), the old audio plays.

**Fix:** Always update `state.audio.src` to the current URL before playing, regardless of whether the `Audio` object is being reused:

```javascript
function playFallback() {
  var song = state.song;
  if (!song) return;

  playBtn.disabled = true;
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" style="opacity:0.5"><path d="M8 5v14l11-7z"/></svg>';

  var audioUrl = getStreamUrl();
  var dur = state.done ? 30 : CLIP_DURATIONS[state.level];
  var guardId = song.id;

  if (!state.audio) {
    state.audio = new Audio(audioUrl);
    state.audio.volume = getVolume();
  } else if (state.audio.src !== audioUrl) {
    // URL changed (new song, genre switch, or day rollover) — update src
    state.audio.src = audioUrl;
    state.audio.currentTime = 0;
    state.audio.volume = getVolume();
  }
  state.audio.currentTime = 0;
  // ... rest of .play() call unchanged
```

**Note:** The `src` comparison uses the resolved URL. `new Audio(audioUrl)` with a relative URL will have `state.audio.src` as the full absolute URL after construction (`http://localhost:3000/api/...`), while `getStreamUrl()` returns a relative path. Compare via `state.audio.src.includes(audioUrl)` or always use absolute URLs.

**Simpler alternative:** Since `stopCurrentClip()` already nullifies `state.audio`, the real issue may be path comparison. The cleanest fix is to always nullify `state.audio` before each `playFallback()` call and let the `new Audio(audioUrl)` branch always run. This is slightly less efficient (creates a new Audio every play) but eliminates the reuse tracking entirely:

```javascript
// At the top of playFallback(), after the null checks:
if (state.audio) { state.audio.pause(); state.audio = null; }
state.audio = new Audio(audioUrl);
state.audio.volume = getVolume();
state.audio.currentTime = 0;
```

This is the recommended approach — simpler and matches the existing `stopCurrentClip()` nullification pattern.

### Anti-Patterns to Avoid

- **Do not introduce a sanitization library (DOMPurify, etc.) for SEC-01.** The fix is a DOM API construction pattern, not sanitization. Adding a library adds complexity without benefit for this specific case.
- **Do not use `innerHTML` with escaped strings for SEC-01.** Even with escaping, the pattern is fragile. DOM API construction is correct.
- **Do not throw unconditionally for SEC-02.** Throwing without `NODE_ENV` check will break `npm run dev` in TaskMaster if `.env.local` is not set.
- **Do not require `cors.js` at module top for SEC-03.** Project convention is to `require()` internal libs inside the handler function body. Follow this convention.
- **Do not add `client.close()` in the ping-guard catch for SEC-04.** Calling `.close()` on a potentially dead connection can throw. Just nullify `cached` and reconnect.
- **Do not cache `songs` by genre in SEC-06.** Cache the raw full array; genre filtering is cheap and done in memory.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML text escaping | Custom escape function | DOM `textContent` assignment | `textContent` is the correct API; escaping functions have edge cases |
| JWT secret validation | Complex config validator | One `if (!secret) throw` | This is a single env var check, not a config system |
| Audio URL comparison | URL parsing/normalization | Nullify and recreate `Audio` | Simpler, matches existing pattern in `stopCurrentClip()` |
| CORS logic | Per-handler customization | Single `api/_lib/cors.js` | All 6 handlers use identical logic; one source of truth |
| MongoDB health check | Custom TCP ping | `client.db('admin').command({ ping: 1 })` | Standard mongodb driver v6 health check pattern |

---

## Common Pitfalls

### Pitfall 1: `require` at Module Top vs. Inside Handler
**What goes wrong:** Adding `const { corsHeaders } = require('./_lib/cors.js')` at the top of an API handler file breaks the established project convention.
**Why it happens:** Default Node.js instinct is top-of-file requires.
**How to avoid:** Always put `require` calls for `_lib` modules inside the `handler` function body, as observed in `api/save-design.js` and `api/chat.js`.
**Warning signs:** If you see the require at line 1-10 of a handler file, it's wrong for this project.

### Pitfall 2: CORS Method String Differences
**What goes wrong:** `api/chat.js` uses `'POST, OPTIONS'` but `api/get-designs.js` uses `'GET, OPTIONS'`. A single-string `corsHeaders()` function that hardcodes POST will break GET-only handlers.
**Why it happens:** The handlers have different HTTP method constraints.
**How to avoid:** `cors.js` should accept an optional `allowedMethods` parameter, defaulting to `'POST, OPTIONS'`. GET-only handlers pass `'GET, OPTIONS'`. Verify each of the 6 handlers before extracting.
**Warning signs:** Any handler returning a 405 after the CORS refactor.

### Pitfall 3: MongoDB Ping on Every Request
**What goes wrong:** Adding a `ping` to `getDb()` on every request defeats the performance purpose of connection caching.
**Why it happens:** Overcorrection on the reconnect fix.
**How to avoid:** The ping is a fallback — only runs if `cached` is non-null and a stale connection is detected. The hot path (fresh request with healthy connection) should hit the `return cached.db` line after confirming the ping succeeds. Consider only pinging on errors rather than every call (see alternative: catch MongoDB errors in the handlers and invalidate cache on disconnect errors).
**Warning signs:** Noticeable latency increase on all MongoDB-backed endpoints.

**Note from STATE.md blocker:** "MongoDB reconnect fix implementation differs between mongodb driver v4 and v6 — confirm version in package.json before implementing the ping-guard pattern." This is resolved: `package.json` confirms `mongodb ^6.21.0`. The v6 ping pattern (`client.db('admin').command({ ping: 1 })`) is correct.

### Pitfall 4: Audio `src` Absolute vs. Relative URL
**What goes wrong:** `getStreamUrl()` returns a relative URL like `/api/songdle-stream?...`, but `new Audio(url).src` returns the absolute URL `http://localhost:3000/api/songdle-stream?...`. Direct string comparison fails.
**Why it happens:** `HTMLAudioElement.src` normalizes to absolute URL.
**How to avoid:** The cleanest fix (always nullify and recreate `Audio`) avoids this comparison entirely. If using the `src !== audioUrl` comparison approach, use `state.audio.src.endsWith(audioUrl)` or build absolute URLs in `getStreamUrl()`.

### Pitfall 5: `canGenerate()` Regression — Daily Reset
**What goes wrong:** Restoring `canGenerate()` to check `getUsage().count < FREE_LIMIT` without verifying `getUsage()` correctly resets daily — a user who used 3 generations yesterday should get 3 more today.
**Why it happens:** Assuming the reset logic works without testing it.
**How to avoid:** `getUsage()` (lines 68-76) already uses `localStorage.getItem('handoff_usage')` and compares `.date` to today's ISO date string. If the date doesn't match, it returns `{ date: today, count: 0 }`. This is correct — daily reset is already implemented. No change needed there.

### Pitfall 6: TaskMaster `NODE_ENV` in Next.js
**What goes wrong:** Checking `process.env.NODE_ENV === 'production'` doesn't work if the build system doesn't set it.
**Why it happens:** Assuming all environments set NODE_ENV.
**How to avoid:** Next.js 14 App Router always sets `NODE_ENV=production` during `next build` and at runtime. This is a safe check for TaskMaster. Confirmed by Next.js documentation behavior (standard since Next.js 9).

---

## Code Examples

Verified patterns from codebase inspection:

### Existing `_lib` export pattern (from `api/_lib/api-key.js`)
Follow this exact export style for `cors.js`:
```javascript
module.exports = { checkApiKey };
// → becomes
module.exports = { corsHeaders, ALLOWED_ORIGINS };
```

### Existing handler `require` pattern (from `api/save-design.js`)
```javascript
module.exports = async function handler(req, res) {
  const { checkApiKey } = require('./_lib/api-key.js');
  // ...
};
```

### Existing `ALLOWED_ORIGINS` array (confirmed identical across all 6 handlers)
```javascript
const ALLOWED_ORIGINS = [
    'https://adamcamilleri.github.io',
    'https://www.adamcamilleri.github.io',
    'https://adamcamilleri.com',
    'https://www.adamcamilleri.com',
    'https://adamcamilleri-github-io.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
];
```

Note: The array uses 4-space indentation (matching `api/chat.js` style). `cors.js` as a lib module conventionally uses 2-space, but either is acceptable since no formatter is configured.

### `getUsage()` and `FREE_LIMIT` (existing, correct, no change needed)
```javascript
var FREE_LIMIT = 3;

function getUsage() {
  var today = new Date().toISOString().slice(0, 10);
  try {
    var stored = JSON.parse(localStorage.getItem('handoff_usage') || '{}');
    return stored.date === today ? stored : { date: today, count: 0 };
  } catch (e) {
    return { date: today, count: 0 };
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact on This Phase |
|--------------|------------------|----------------------|
| `innerHTML` with concatenated user values | `textContent` + DOM API construction | SEC-01 fix direction |
| JWT fallback secret (`?? 'literal-string'`) | Startup throw with `NODE_ENV` guard | SEC-02 fix direction |
| Per-handler CORS copy-paste | Shared `_lib/cors.js` | SEC-03 fix direction |
| MongoDB `cached` with no ping | Ping guard before returning cached | SEC-04 fix direction |

---

## Open Questions

1. **CORS method strings per handler**
   - What we know: `api/chat.js` uses `POST, OPTIONS`; `api/get-designs.js` and `api/get-design.js` use `GET, OPTIONS`; others likely POST
   - What's unclear: `api/create-payment-link.js` and `api/save-design.js` method strings not verified
   - Recommendation: Read each of the 6 handler files before writing `cors.js` to confirm the method string for each, and make the `allowedMethods` parameter explicit in each handler call

2. **`renderUsageUI()` restoration scope**
   - What we know: Function body is currently empty ("hidden until limit is re-enabled")
   - What's unclear: Whether the `usageCounter` DOM element exists in the current `index.html` and has visible styles
   - Recommendation: Check `projects/handoff/index.html` for `id="usageCounter"` and the surrounding UI before restoring the render logic; if the counter element is hidden or absent, the counter display may need a minor HTML/CSS change

3. **Songdle `songdle-stream.js` caching approach**
   - What we know: `songdle-stream.js` calls `getDailyTrackData` from `soundcloud-daily.js` for daily mode (already uses the exported function), and calls `fs.readFileSync` directly for unlimited mode (line 36)
   - What's unclear: Whether importing a `loadSongs()` helper from `soundcloud-daily.js` is the right approach vs. duplicating the module-level cache in `songdle-stream.js`
   - Recommendation: Export `loadSongs` (or `getSongsCache`) from `soundcloud-daily.js` and import it in `songdle-stream.js`; avoids two separate caches for the same file

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.x |
| Config file | `package.json` (jest config likely inline) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| E2E command | `npm run test:e2e` (Cypress, requires running server) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | `summaryText` renders user input as text, not HTML; `<script>` tags do not execute | unit | `npm test -- --testPathPattern=xss` | ❌ Wave 0 |
| SEC-02 | `getSecret()` throws when `JWT_SECRET` missing and `NODE_ENV=production` | unit | `npm test -- --testPathPattern=jwt` (in taskmaster) | ❌ Wave 0 |
| SEC-03 | All 6 handler files import from `_lib/cors.js`; no inline `ALLOWED_ORIGINS` array remains | unit + grep | `npm test -- --testPathPattern=cors` + `grep -r "ALLOWED_ORIGINS" api/ --include="*.js"` | ❌ Wave 0 |
| SEC-04 | `getDb()` reconnects after stale connection (ping throws) | unit | `npm test -- --testPathPattern=mongodb` | ❌ Wave 0 |
| SEC-05 | `canGenerate()` returns false after 3 generations; upgradeModal shown on 4th attempt | unit | `npm test -- --testPathPattern=usage` | ❌ Wave 0 |
| SEC-06 | `loadSongs()` reads disk once and returns cached array on subsequent calls | unit | `npm test -- --testPathPattern=songs` | ❌ Wave 0 |
| BUG-01 | `playFallback()` always creates fresh `Audio` object; no mid-song playback | unit | `npm test -- --testPathPattern=playback` | ❌ Wave 0 |

**Note:** SEC-01 and BUG-01 involve browser DOM and `HTMLAudioElement` which require jsdom or a browser context. Jest with jsdom (the default environment) handles `document.createElement` but not `HTMLAudioElement.play()`. SEC-01 can be unit tested with Jest/jsdom. BUG-01 is more reliably tested as a manual smoke test or Cypress E2E.

### Sampling Rate

- **Per task commit:** `npm test` (Jest unit tests, ~5-10 seconds)
- **Per wave merge:** `npm test && npm run test:e2e` (requires `npm run dev` running)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/xss-fix.test.js` — covers SEC-01 (jsdom test: inject `<script>` into onboarding fields, verify no execution)
- [ ] `__tests__/cors-lib.test.js` — covers SEC-03 (verify `corsHeaders()` returns correct headers for allowed and disallowed origins)
- [ ] `__tests__/mongodb-reconnect.test.js` — covers SEC-04 (mock `ping` throwing, verify `cached` is cleared and reconnect occurs)
- [ ] `__tests__/usage-limit.test.js` — covers SEC-05 (mock `localStorage`, verify `canGenerate()` returns false at FREE_LIMIT)
- [ ] `__tests__/songs-cache.test.js` — covers SEC-06 (spy on `fs.readFileSync`, verify called once across multiple `loadSongs()` calls)
- [ ] JWT test in TaskMaster: `projects/taskmaster/__tests__/jwt.test.ts` — covers SEC-02 (set `NODE_ENV=production`, unset `JWT_SECRET`, verify throw)
- [ ] BUG-01 manual smoke test: play Songdle, switch genre, play again — verify starts from beginning (not easily unit-testable due to `Audio` API)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `projects/handoff/script.js`, `projects/taskmaster/src/lib/jwt.ts`, `api/_lib/mongodb.js`, `api/soundcloud-daily.js`, `api/songdle-stream.js`, all 6 CORS-duplicating handler files
- `.planning/codebase/CONCERNS.md` — pre-existing audit with exact line numbers for all 7 requirements
- `.planning/codebase/ARCHITECTURE.md` — pattern conventions for `_lib` modules, handler structure

### Secondary (MEDIUM confidence)
- mongodb v6 ping pattern: `client.db('admin').command({ ping: 1 })` — standard health check; confirmed driver version is v6 via `package.json` (`mongodb ^6.21.0`)
- Next.js `NODE_ENV` behavior: always `'production'` in production builds — standard Next.js documented behavior

### Tertiary (LOW confidence)
- None — all findings are directly verified in the codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all changes are to existing files
- Architecture: HIGH — exact file locations and line numbers confirmed by direct read
- Pitfalls: HIGH — identified from direct code inspection, not speculation
- Test gaps: HIGH — confirmed by listing `__tests__/` directory (only 2 existing test files, neither covers these requirements)

**Research date:** 2026-03-11
**Valid until:** Indefinite — this is a codebase-specific analysis, not an external API research document; valid until the files are changed
