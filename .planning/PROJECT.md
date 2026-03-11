# Adam Camilleri Portfolio

## What This Is

A personal developer portfolio hosted on GitHub Pages at adamcamilleri.github.io, featuring a polished landing page and a collection of interactive project demos (Handoff AI website builder, Songdle music game, TaskMaster, and more). The site serves as both a showcase for employers/clients and a playground for shipping impressive web experiences.

## Core Value

Every project demo should feel polished enough that a visitor immediately thinks "this person ships quality work" — the portfolio sells through experience, not just description.

## Requirements

### Validated

- ✓ Portfolio shell with hero, about, certificates, projects, and contact sections — existing
- ✓ Handoff: AI-powered website builder with chat, live preview, deploy to Vercel, and OAuth — existing
- ✓ Songdle: Daily song guessing game with genre picker, audio playback, and stats — existing
- ✓ TaskMaster: JWT-authenticated task CRUD app (Next.js 14) — existing
- ✓ Connect Four, StudyBuddy, Adam's Cookbook mini-apps — existing
- ✓ Vercel serverless API layer with chat, deploy, OAuth, design storage, Songdle endpoints — existing
- ✓ MongoDB design persistence for Handoff — existing
- ✓ EmailJS contact form — existing
- ✓ Jest + Cypress test scaffolding — existing
- ✓ Docker Compose local dev stack — existing

### Active

- [ ] Add micro-interactions across all projects (hover effects, button feedback, loading states, smooth transitions)
- [ ] Add page/view transitions with animated entrances and smooth routing between views
- [ ] Add motion design (spring physics, gesture-driven UI, scroll-triggered animations)
- [ ] Fix CORS duplication — extract shared CORS utility from 6+ copy-pasted handlers
- [ ] Fix XSS vulnerability in Handoff onboarding (unsanitized innerHTML)
- [ ] Fix JWT fallback secret in TaskMaster (hardcoded 'missing-secret')
- [ ] Fix MongoDB connection handling for serverless cold-start reconnects
- [ ] Add server-side rate limiting on chat/deploy API endpoints
- [ ] Cache Songdle songs.json reads instead of reading from disk on every request
- [ ] Restore Handoff usage limit gate (currently returns true unconditionally)
- [ ] Modernize code structure — extract shared helpers, reduce duplication, organize files
- [ ] Improve performance — asset optimization, faster load times, efficient CSS/JS
- [ ] Set up CLAUDE.md with full project context for instant Claude onboarding
- [ ] Create custom Claude Code skills for common project tasks (deploy, test, etc.)
- [ ] Configure MCP server integrations (GitHub, Vercel, MongoDB)
- [ ] Make adding new projects easy — template/scaffold system for new project demos

### Out of Scope

- Rewriting existing projects from scratch — optimize and enhance, don't rebuild
- Adding a CMS or admin panel — content is managed via code
- Multi-user features or user accounts on the portfolio itself — it's a personal site
- Moving off GitHub Pages/Vercel — current hosting works fine
- Mobile app — web only

## Context

- The codebase is a monorepo: portfolio shell at root, mini-apps under `projects/`, serverless API in `api/`
- Codebase map already exists in `.planning/codebase/` (7 analysis documents from 2026-03-06)
- CONCERNS.md documents 20+ issues across tech debt, bugs, security, performance, and test gaps
- The main portfolio page is already in good shape — the focus is on project-level polish and animation
- The user wants every project to feel impressive, not just functional
- Structure should make it trivial to add new project demos in the future

## Constraints

- **Hosting**: GitHub Pages (static) + Vercel (serverless API) — no changes to hosting setup
- **Budget**: Free tier services only (Vercel, MongoDB Atlas, Groq)
- **Compatibility**: Must work in modern browsers; mobile-responsive
- **Build complexity**: Keep it manageable — no heavy framework migrations unless justified
- **Backwards compatibility**: Existing project URLs must not break

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Enhance existing projects rather than rebuild | Faster path to polish; existing code works | — Pending |
| Claude setup as foundational phase | Once Claude understands the project, it can help with everything else faster | — Pending |
| Animation/polish as highest priority | User's primary goal is wow-factor in project demos | — Pending |

---
*Last updated: 2026-03-11 after initialization*
