# Requirements: Adam Camilleri Portfolio

**Defined:** 2026-03-11
**Core Value:** Every project demo should feel polished enough that a visitor immediately thinks "this person ships quality work"

## v1 Requirements

### Animation Foundation

- [ ] **ANIM-01**: All animations respect `prefers-reduced-motion` — disabled by default, enabled only when user has no preference
- [ ] **ANIM-02**: All interactive elements (buttons, links, cards) have hover/focus feedback with smooth transitions
- [ ] **ANIM-03**: Async operations show skeleton/loading states (Handoff chat generation, Songdle audio fetch, TaskMaster API calls)
- [ ] **ANIM-04**: Page sections use scroll-triggered entrance animations

### Micro-Interactions

- [ ] **MICRO-01**: Buttons and cards use spring-physics press/release animations
- [ ] **MICRO-02**: Form inputs have animated focus states and validation feedback
- [ ] **MICRO-03**: Navigation transitions are smooth and contextual

### Per-Project Signatures

- [ ] **SIG-01**: Handoff has an animated deploy progress sequence
- [ ] **SIG-02**: Songdle has an audio visualizer or waveform animation during playback (note: audio source will switch to SoundCloud Widget API in Phase 4 — visualizer must work with iframe-based audio, not a native Audio element)
- [ ] **SIG-03**: Each project demo has at least one memorable animation moment unique to it

### Project Redesigns

- [ ] **REDESIGN-01**: Rename StudyBuddy to "Study Smart" and fully redesign with retro OS aesthetic — window chrome panels, warm brown palette (#5C3D2E tones), grid/graph paper background, retro title bars with minimize/maximize/close buttons
- [ ] **REDESIGN-02**: Study Smart layout: Timer panel (left), Music genre selector grid (right), To-do list panel (left below timer), Volume/playback controls, Inspirational quote widget — all in retro window panels
- [ ] **REDESIGN-03**: Study Smart retains all existing features (pomodoro timer, tasks, stats, ambient sounds, settings, keyboard shortcuts) but with the new visual design
- [ ] **REDESIGN-04**: Redesign Connect Four with a polished modern aesthetic — animated disc drops, glow effects on winning line, smooth transitions, updated color scheme and layout

### Security & Tech Debt

- [x] **SEC-01**: Fix XSS vulnerability in Handoff onboarding — replace unsanitized innerHTML with textContent/DOM APIs
- [x] **SEC-02**: Fix JWT fallback secret in TaskMaster — throw error if JWT_SECRET is missing in production
- [x] **SEC-03**: Extract shared CORS utility to `api/_lib/cors.js` — remove duplication from 6+ handlers
- [x] **SEC-04**: Fix MongoDB cold-start reconnect — add connection health check before returning cached client
- [x] **SEC-05**: Restore Handoff usage limit gate — `canGenerate()` should enforce FREE_LIMIT instead of returning true
- [x] **SEC-06**: Cache Songdle songs.json reads in module-level variable instead of reading from disk per request

### Bug Fixes

- [x] **BUG-01**: Fix Songdle Audio object reuse bug — `playFallback()` now always creates a fresh Audio object so playback always starts at position 0 within the clip (technical fix done; note: the underlying content issue — clips sourced from mid-song — is deferred to Phase 4. Decided approach for Phase 4: use the **SoundCloud Widget API** (hidden iframe + `SC.Widget` JS SDK), calling `seekTo(0)` before each play to guarantee playback from second 0 of the full track. This is how Heardle worked. Do NOT use any preview APIs — iTunes/Deezer/Spotify previews are mid-song clips. Previous attempt failed because Claude used direct `new Audio(soundcloudUrl)` which is blocked by SoundCloud's CORS — the correct approach is the iframe widget, no API key required for public tracks.)

### Claude Code Tooling

- [x] **CLAUDE-01**: Create CLAUDE.md with full project context (under 200 lines, progressive disclosure to .planning/)
- [x] **CLAUDE-02**: Configure `.mcp.json` with GitHub and Vercel MCP server integrations
- [x] **CLAUDE-03**: Create custom slash commands in `.claude/commands/` for common tasks (deploy, test, dev server)

## v2 Requirements

### Advanced Animation

- **ANIM-V2-01**: GSAP ScrollTrigger parallax and reveal sequences
- **ANIM-V2-02**: View Transitions API for project page routing
- **ANIM-V2-03**: Gesture-driven UI interactions (swipe, drag)

### Code Structure

- **STRUCT-01**: Shared ES module directory (`shared/`) for cross-project utilities
- **STRUCT-02**: Project scaffold template (`projects/_template/`) for new demos
- **STRUCT-03**: Server-side rate limiting on chat/deploy API endpoints

### Additional Tooling

- **TOOL-01**: MongoDB MCP server integration
- **TOOL-02**: Additional custom Claude skills for project-specific workflows

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full framework migration (React/Vue/Svelte) | Vanilla JS works; adding a framework adds build complexity without clear benefit |
| WebGL/Three.js hero effects | Mobile performance killer, dated aesthetic |
| Particle systems | Jank-prone, looks mid-2010s |
| Scroll hijacking | UX harm + Core Web Vitals penalty |
| Rewriting Handoff, Songdle, or TaskMaster from scratch | Optimize and enhance these; StudyBuddy and Connect Four ARE being redesigned |
| CMS or admin panel | Content managed via code |
| Multi-user features | Personal portfolio site |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| BUG-01 | Phase 1 | Complete |
| CLAUDE-01 | Phase 2 | Complete |
| CLAUDE-02 | Phase 2 | Complete |
| CLAUDE-03 | Phase 2 | Complete |
| ANIM-01 | Phase 3 | Pending |
| ANIM-02 | Phase 3 | Pending |
| ANIM-03 | Phase 3 | Pending |
| ANIM-04 | Phase 3 | Pending |
| MICRO-01 | Phase 3 | Pending |
| MICRO-02 | Phase 3 | Pending |
| MICRO-03 | Phase 3 | Pending |
| SIG-01 | Phase 4 | Pending |
| SIG-02 | Phase 4 | Pending |
| SIG-03 | Phase 4 | Pending |
| REDESIGN-01 | Phase 4 | Pending |
| REDESIGN-02 | Phase 4 | Pending |
| REDESIGN-03 | Phase 4 | Pending |
| REDESIGN-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
