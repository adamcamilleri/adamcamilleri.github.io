# Roadmap: Adam Camilleri Portfolio

## Overview

This milestone transforms the portfolio from functional to memorable. The work sequences in strict dependency order: close security holes and eliminate tech debt first (so nothing dangerous ships under polish), then set up Claude Code tooling that describes the cleaned-up codebase accurately, then build shared animation infrastructure that all projects import, then deliver the visible payoff — animated micro-interactions, project signature moments, and full visual redesigns of Study Smart and Connect Four.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security + Tech Debt** - Close live security vulnerabilities, fix the Songdle playback bug, and consolidate duplicated infrastructure before anything else ships
- [x] **Phase 2: Claude Code Tooling** - Set up CLAUDE.md describing the clean post-refactor codebase, configure MCP integrations, and add custom slash commands (completed 2026-03-11)
- [x] **Phase 3: Animation Foundation** - Build shared animation infrastructure and apply universal motion polish (hover states, loading skeletons, scroll reveals) across all projects (completed 2026-03-12)
- [ ] **Phase 4: Per-Project Polish + Redesigns** - Deliver project signature animations and full visual redesigns of Study Smart (retro OS aesthetic) and Connect Four (modern polish)

## Phase Details

### Phase 1: Security + Tech Debt
**Goal**: The portfolio is safe to demo publicly — no XSS, no JWT bypass, no unbounded API costs, and no infrastructure duplication that will cause drift
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, BUG-01
**Success Criteria** (what must be TRUE):
  1. Handoff onboarding no longer injects raw HTML — user-supplied content is rendered via DOM APIs, not innerHTML
  2. TaskMaster throws a startup error in production if JWT_SECRET is missing — no silent fallback to 'missing-secret'
  3. All API handlers share a single cors.js utility — grepping for duplicate CORS header strings returns zero results
  4. Songdle songs play from the beginning every time — no mid-song entry on any track
  5. Handoff usage limit gate is active — free users cannot generate beyond FREE_LIMIT
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Fix client-side security vulnerabilities (XSS in Handoff, JWT secret in TaskMaster, usage limit gate)
- [x] 01-02-PLAN.md — Consolidate server-side infrastructure (extract cors.js, MongoDB ping guard, cache Songdle songs.json, fix BUG-01)

### Phase 2: Claude Code Tooling
**Goal**: Claude Code can onboard to this project instantly and operate with full context about the current (post-refactor) architecture
**Depends on**: Phase 1
**Requirements**: CLAUDE-01, CLAUDE-02, CLAUDE-03
**Success Criteria** (what must be TRUE):
  1. A new Claude session can read CLAUDE.md and immediately understand the monorepo layout, the api/_lib/ patterns, and where to find deep context — without reading the whole codebase
  2. Claude can deploy to Vercel and query GitHub issues through MCP tool calls without leaving the editor
  3. Running `/tdd` or `/code-review` slash commands executes the correct workflow without manual step lookup
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Expand CLAUDE.md (8 lines → full context doc) and create .mcp.json with GitHub and Vercel MCP servers (CLAUDE-01, CLAUDE-02)
- [ ] 02-02-PLAN.md — Create /tdd and /code-review slash commands in .claude/commands/ (CLAUDE-03)

### Phase 3: Animation Foundation
**Goal**: Every interactive element across the portfolio has consistent motion feedback, and a shared animations.js module means no project carries its own animation setup
**Depends on**: Phase 2
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, MICRO-01, MICRO-02, MICRO-03
**Success Criteria** (what must be TRUE):
  1. Enabling prefers-reduced-motion in OS settings disables all animations site-wide — no animation fires against the user's preference
  2. Every button, card, and link has visible hover/focus feedback — no bare pointer-cursor-only states anywhere
  3. Handoff chat generation, Songdle audio fetch, and TaskMaster list load all show skeleton/shimmer states instead of blank areas
  4. Portfolio shell sections animate in on scroll — hero, projects grid, and about section have entrance animations
  5. Form inputs across all projects show animated focus rings and inline validation feedback
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Create shared/animations.js + shared/animations.css with GSAP scroll helpers, skeleton utilities, hover/focus classes, and prefers-reduced-motion guard (ANIM-01)
- [x] 03-02-PLAN.md — Wire animation foundation into portfolio shell: GSAP CDN, scroll reveals, interactive classes, form focus, nav transitions (ANIM-02, ANIM-04, MICRO-01, MICRO-02, MICRO-03)
- [x] 03-03-PLAN.md — Add skeleton loading states to Handoff chat, Songdle game, and TaskMaster task list (ANIM-03)

### Phase 4: Per-Project Polish + Redesigns
**Goal**: Each project has at least one memorable animation moment unique to it, and Study Smart and Connect Four are fully redesigned so visitors immediately see craft, not just function
**Depends on**: Phase 3
**Requirements**: SIG-01, SIG-02, SIG-03, REDESIGN-01, REDESIGN-02, REDESIGN-03, REDESIGN-04
**Success Criteria** (what must be TRUE):
  1. Handoff shows an animated deploy progress sequence when a site is deployed — not a spinner, a sequence with distinct stages
  2. Songdle shows audio waveform or visualizer animation during playback — visitors see the sound, not just hear it
  3. Study Smart renders as a retro OS desktop with draggable window panels, warm brown palette, and grid-paper background — the rename to "Study Smart" is live and all existing features (pomodoro, tasks, ambient sounds, shortcuts) work within the new skin
  4. Connect Four has animated disc drops, a glowing winning-line highlight, and a color scheme and layout that feels intentionally designed
**Plans**: TBD

Plans:
- [ ] 04-01: Handoff deploy sequence animation and Songdle audio visualizer (SIG-01, SIG-02)
- [ ] 04-02: Study Smart retro OS redesign — rename, window chrome panels, layout, palette (REDESIGN-01, REDESIGN-02, REDESIGN-03)
- [ ] 04-03: Connect Four modern redesign — animated disc drops, glow effects, updated layout (REDESIGN-04, SIG-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security + Tech Debt | 2/2 | Complete | 2026-03-11 |
| 2. Claude Code Tooling | 2/2 | Complete   | 2026-03-11 |
| 3. Animation Foundation | 3/3 | Complete | 2026-03-12 |
| 4. Per-Project Polish + Redesigns | 0/3 | Not started | - |