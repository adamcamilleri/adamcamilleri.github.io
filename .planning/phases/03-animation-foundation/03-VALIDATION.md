---
phase: 03
slug: animation-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (root) + Cypress E2E |
| **Config file** | package.json (jest config) + cypress.config.js |
| **Quick run command** | `npx jest --testPathPattern=animations` |
| **Full suite command** | `npx jest && npx cypress run` |
| **Estimated runtime** | ~15 seconds (jest) + ~30 seconds (cypress) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=animations`
- **After every plan wave:** Run `npx jest && npx cypress run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ANIM-01 | unit | `npx jest --testPathPattern=animations` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | ANIM-04 | unit | `npx jest --testPathPattern=animations` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | ANIM-02, MICRO-01 | e2e | `npx cypress run --spec cypress/e2e/portfolio.cy.js` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | ANIM-04 | e2e | `npx cypress run --spec cypress/e2e/portfolio.cy.js` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 2 | MICRO-02 | e2e | `npx cypress run --spec cypress/e2e/portfolio.cy.js` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 2 | ANIM-03 | e2e | `npx cypress run` | ✅ | ⬜ pending |
| 03-03-02 | 03 | 2 | MICRO-03 | e2e | `npx cypress run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/animations.test.js` — unit tests for shared/animations.js (prefers-reduced-motion, API surface)
- [ ] Existing Cypress infrastructure covers E2E animation verification

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| prefers-reduced-motion disables all animations | ANIM-01 | Requires OS-level setting toggle | Enable "Reduce motion" in OS accessibility settings, reload site, verify no animations fire |
| Shimmer skeleton appears during async loads | ANIM-03 | Requires real API latency | Throttle network in DevTools, trigger Handoff chat/Songdle audio/TaskMaster load, verify skeleton |
| Hover feedback visible on all interactive elements | ANIM-02 | Visual inspection across projects | Hover every button, card, and link — verify lift + shadow feedback |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
