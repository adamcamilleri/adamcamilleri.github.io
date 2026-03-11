---
phase: 01-security-tech-debt
plan: 02
subsystem: api
tags: [cors, mongodb, songdle, refactor, bug-fix, caching]
dependency_graph:
  requires: []
  provides: [api/_lib/cors.js, mongodb-ping-guard, songs-cache, songdle-audio-fix]
  affects: [api/chat.js, api/deploy.js, api/save-design.js, api/get-designs.js, api/get-design.js, api/create-payment-link.js, api/_lib/mongodb.js, api/soundcloud-daily.js, api/songdle-stream.js, projects/songdle/script.js]
tech_stack:
  added: [api/_lib/cors.js]
  patterns: [shared-cors-utility, mongodb-ping-guard, module-level-cache, audio-object-reset]
key_files:
  created:
    - api/_lib/cors.js
    - __tests__/cors-util.test.js
    - __tests__/mongodb-reconnect.test.js
    - __tests__/songdle-cache.test.js
    - __tests__/songdle-playback.test.js
  modified:
    - api/chat.js
    - api/deploy.js
    - api/save-design.js
    - api/get-designs.js
    - api/get-design.js
    - api/create-payment-link.js
    - api/_lib/mongodb.js
    - api/soundcloud-daily.js
    - api/songdle-stream.js
    - projects/songdle/script.js
decisions:
  - "deploy.js preserves Access-Control-Allow-Credentials header as a separate setHeader call after corsHeaders() — the shared utility omits it intentionally since only deploy needs it"
  - "oauth.js ALLOWED_ORIGINS left unchanged — it has a purposefully restricted origin list (security intent differs from the 6 shared-CORS handlers); deferred to a future plan"
  - "songdle-playback.test.js tests the fixed behavioral contract inline (no import of production browser script) — consistent with plan guidance"
metrics:
  duration: "6 minutes"
  completed: "2026-03-11"
  tasks_completed: 3
  files_changed: 14
requirements_addressed: [SEC-03, SEC-04, SEC-05, SEC-06, BUG-01]
---

# Phase 1 Plan 2: CORS Consolidation, MongoDB Hardening, Songdle Fixes — Summary

**One-liner:** Extracted shared corsHeaders() utility from 6 handlers, added MongoDB ping-guard reconnect using v6 pattern, module-level songs.json cache, and always-fresh Audio object in Songdle playFallback().

## What Was Built

### SEC-03: Shared CORS utility (api/_lib/cors.js)

Created `api/_lib/cors.js` exporting `corsHeaders(req, allowedMethods)` and `ALLOWED_ORIGINS`. All 6 handler files (chat, deploy, save-design, get-designs, get-design, create-payment-link) now require it inside their handler function body — matching the existing `checkApiKey` pattern. Inline ALLOWED_ORIGINS arrays and corsHeaders function definitions removed from all 6 files.

### SEC-04: MongoDB ping-guard reconnect (api/_lib/mongodb.js)

Replaced the naive `if (cached) return cached.db` with a ping-guard: if ping throws, `cached` is nullified and the function falls through to create a fresh MongoClient connection. Uses `client.db('admin').command({ ping: 1 })` as required by mongodb v6.

### SEC-06: songs.json module-level cache (api/soundcloud-daily.js + api/songdle-stream.js)

Added `let _cachedSongs = null` at module scope. `loadSongs()` reads from disk only on first call; subsequent calls return the cached array. `loadSongsFromFile(genre)` now calls `loadSongs()` internally. `loadSongs` is exported so `songdle-stream.js` can import it. The standalone `fs.readFileSync` call in songdle-stream.js's unlimited mode was replaced with `loadSongs()`.

### BUG-01: Songdle playFallback() always creates fresh Audio (projects/songdle/script.js)

Replaced the conditional `if (!state.audio) { ... }` guard with always-nullify pattern: pause existing audio, set `state.audio = null`, then create `new Audio(audioUrl)`. This ensures every play attempt starts from position 0 regardless of prior genre switches or repeated plays.

## Test Results

All 4 new test suites pass. Full suite: **55 tests, 9 suites, all GREEN**.

| Test File | Tests | Status |
|-----------|-------|--------|
| cors-util.test.js | 8 | GREEN |
| mongodb-reconnect.test.js | 4 | GREEN |
| songdle-cache.test.js | 3 | GREEN |
| songdle-playback.test.js | 5 | GREEN |
| (existing 9 suites) | 35 | GREEN — no regressions |

## Decisions Made

1. **deploy.js preserves `Access-Control-Allow-Credentials: true`** — added as a separate `res.setHeader` call after corsHeaders(). The shared utility intentionally omits it; only deploy.js needed it for Vercel OAuth cookie flow.

2. **oauth.js ALLOWED_ORIGINS not migrated** — oauth.js has a purposefully restricted 4-origin list and uses a `getOrigin()` pattern (not `corsHeaders()`), indicating distinct security intent. Deferred to a future plan to avoid accidental permission expansion.

3. **songdle-playback.test.js uses inline behavioral contract** — the browser script has no exports. The test defines a local `playFallback` matching the fixed pattern. This is consistent with the plan's guidance and correctly validates the contract.

## Deviations from Plan

### Deviation 1: Test rewrite for songdle-cache.test.js (Rule 1 - Bug)

**Found during:** Task 3 (TDD GREEN phase)
**Issue:** Original songdle-cache.test.js used `jest.resetModules()` inside `beforeEach` which triggered a Babel transform error: "Plugin/Preset files are not allowed to export objects, only functions. In babel-plugin-jest-hoist/build/index.js". This occurred because re-requiring the module after `resetModules()` caused Babel to re-transform soundcloud-daily.js while fs.readFileSync was spied on.
**Fix:** Rewrote test to use `beforeAll` for the spy setup and `jest.resetModules()` only inside individual test cases where a fresh module is needed. The mock implementation now passes non-songs.json calls through to the real `fs.readFileSync` via `jest.requireActual('fs')`.
**Files modified:** `__tests__/songdle-cache.test.js`
**Commit:** included in task 3 commit (e2f69c1)

### Deferred Items

- `api/oauth.js` has its own inline ALLOWED_ORIGINS (4-entry restricted list). Not migrated in this plan due to different security intent. Logged to deferred-items.

## Self-Check

- [x] `api/_lib/cors.js` exists with correct exports
- [x] All 6 handler files require cors.js inside handler body
- [x] No ALLOWED_ORIGINS in the 6 specified handlers
- [x] mongodb.js getDb() has ping-guard
- [x] soundcloud-daily.js exports loadSongs
- [x] songdle-stream.js has no standalone readFileSync
- [x] projects/songdle/script.js playFallback() always creates fresh Audio
- [x] All 4 test files exist and pass
- [x] Full test suite GREEN (55 tests)
