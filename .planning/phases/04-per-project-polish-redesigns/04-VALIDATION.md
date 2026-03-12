---
phase: 4
slug: per-project-polish-redesigns
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + Cypress 13 |
| **Config file** | package.json (jest config) / cypress.config.js |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-xx | 01 | 1 | SIG-01 | e2e | `npx cypress run --spec cypress/e2e/handoff.cy.js` | Partial | ⬜ pending |
| 04-01-xx | 01 | 1 | SIG-02 | unit | `npx jest __tests__/songdle-soundcloud.test.js` | ❌ W0 | ⬜ pending |
| 04-02-xx | 02 | 2 | REDESIGN-01 | manual | Manual verification | ❌ | ⬜ pending |
| 04-02-xx | 02 | 2 | REDESIGN-02 | manual-only | Manual verification | ❌ | ⬜ pending |
| 04-02-xx | 02 | 2 | REDESIGN-03 | manual | Manual checklist | ❌ | ⬜ pending |
| 04-03-xx | 03 | 2 | REDESIGN-04 | manual-only | Manual verification | ❌ | ⬜ pending |
| 04-03-xx | 03 | 2 | SIG-03 | manual | Manual verification | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/songdle-soundcloud.test.js` — stubs for SIG-02 (SC.Widget mock, seekTo call verification)
- [ ] Update `__tests__/songdle-playback.test.js` — adapt existing tests for new SC.Widget path

*Existing infrastructure covers SIG-01 (handoff.cy.js exists). REDESIGN-01/02/03/04 are visual redesigns best verified manually.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rocket animation stages on deploy | SIG-01 | Visual animation correctness hard to assert beyond DOM class changes | Click deploy, verify stages: buildup → launch → rise → clean reveal |
| Study Smart panel layout and drag | REDESIGN-02 | Drag interactions need visual verification | Drag each panel, verify position persists; verify grid-paper background |
| Study Smart feature regression | REDESIGN-03 | Many interactive features across timer, tasks, stats, settings | Run through: timer modes, task CRUD/search/filter, stats charts, settings persistence, keyboard shortcuts |
| Connect Four disc drop + glow | REDESIGN-04 | Physics animation and glow effects are visual | Play a game, verify bounce animation, win-line glow, column hover highlight |
| Study Smart rename | REDESIGN-01 | Text content verification | Check title, nav, all references say "Study Smart" not "StudyBuddy" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
