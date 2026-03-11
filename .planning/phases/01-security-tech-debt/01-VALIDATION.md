---
phase: 1
slug: security-tech-debt
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.js` (root) |
| **Quick run command** | `npm test -- --testPathPattern=__tests__` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=__tests__`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SEC-01 | unit | `npm test -- --testPathPattern=handoff-xss` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SEC-02 | unit | `npm test -- --testPathPattern=jwt-secret` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | SEC-05 | unit | `npm test -- --testPathPattern=usage-limit` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | SEC-03 | unit | `npm test -- --testPathPattern=cors-util` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | SEC-04 | unit | `npm test -- --testPathPattern=mongodb-reconnect` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | SEC-06 | unit | `npm test -- --testPathPattern=songdle-cache` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 2 | BUG-01 | unit | `npm test -- --testPathPattern=songdle-playback` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/handoff-xss.test.js` — stubs for SEC-01 (innerHTML replaced with DOM APIs)
- [ ] `__tests__/jwt-secret.test.js` — stubs for SEC-02 (throws when JWT_SECRET missing)
- [ ] `__tests__/usage-limit.test.js` — stubs for SEC-05 (canGenerate enforces FREE_LIMIT)
- [ ] `__tests__/cors-util.test.js` — stubs for SEC-03 (cors.js exports correct headers)
- [ ] `__tests__/mongodb-reconnect.test.js` — stubs for SEC-04 (ping guard on cold start)
- [ ] `__tests__/songdle-cache.test.js` — stubs for SEC-06 (songs.json read once per process)
- [ ] `__tests__/songdle-playback.test.js` — stubs for BUG-01 (Audio src reset on each play)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CORS headers present on OPTIONS preflight | SEC-03 | Requires live Vercel environment or server | `curl -X OPTIONS https://<vercel-url>/api/chat -H "Origin: https://adamcamilleri.github.io" -v` — check for `Access-Control-Allow-Origin` header |
| Handoff usage limit blocks at 3 | SEC-05 | Requires browser + localStorage state | Open Handoff, generate 3 times, confirm upgrade modal appears on 4th attempt |
| Songdle plays from 00:00 on every genre switch | BUG-01 | Requires browser audio context | Switch genre 5 times rapidly, confirm each track starts at beginning |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
