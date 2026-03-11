# Phase 2: Claude Code Tooling - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up Claude Code configuration so a fresh Claude session can immediately understand the project structure, the post-refactor api/_lib/ patterns, and operate autonomously — without reading the entire codebase. Deliverables: CLAUDE.md, .mcp.json, and two slash commands.

</domain>

<decisions>
## Implementation Decisions

### CLAUDE.md content
- Balanced approach: brief structure overview + key behavioral rules (not just facts, not just prescriptions)
- 200-line limit — defer deep context to .planning/ via links
- Must include:
  - Monorepo layout (root = portfolio shell, api/ = serverless functions, projects/ = mini-apps)
  - api/_lib/ shared utilities pattern (cors.js, mongodb.js, etc. — NOT exposed as endpoints)
  - Post-refactor patterns: always import cors.js from api/_lib/, always use MongoDB ping guard
  - How to run tests (Jest root + TaskMaster + Cypress E2E locations)
  - Key env vars for local dev (reference .env.example)
  - Bug report workflow: write a reproducing test BEFORE fixing any bug
  - Behavioral rules: "when adding an API endpoint, always use api/_lib/cors.js"
  - Static pointer: "See .planning/STATE.md for current phase and progress"
  - Links to: .planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/codebase/ maps
- Security rules inline (adapted from affaan-m/everything-claude-code patterns):
  - No hardcoded secrets → always use env vars
  - Input validation on all API request bodies
  - XSS prevention → use DOM APIs not innerHTML
  - Auth checks before protected endpoints

### MCP server configuration (.mcp.json)
- Project-level file (version-controlled in repo)
- GitHub MCP: GITHUB_TOKEN env var for auth
- Vercel MCP: VERCEL_TOKEN env var for auth (already required by api/deploy.js, so already set up)
- Both servers configured with minimal required scopes

### Slash commands (.claude/commands/)
- /tdd — test-driven workflow (covers both new features AND bug fixes)
  - New features: RED (write failing test) → GREEN (minimal code to pass) → REFACTOR
  - Bug fixes: write a reproducing test FIRST, prove it fails, then fix, prove it passes
  - Matches existing CLAUDE.md bug report rule
- /code-review — pre-commit security + quality check
  - Security: hardcoded secrets, input validation, XSS prevention, auth checks
  - Test coverage: flag untested code paths and missing test cases
  - Code quality: function size, nesting depth, duplication

### Claude's Discretion
- Exact formatting and section ordering within CLAUDE.md
- Which specific MCP server npm packages to use (pick most stable/official versions)
- How verbose each slash command's output is

</decisions>

<specifics>
## Specific Ideas

- The CLAUDE.md should feel like affaan-m/everything-claude-code's CLAUDE.md: concise section headers, code blocks for commands, behavioral rules inline
- Slash commands adapted from the affaan-m/everything-claude-code patterns for /tdd and /code-review
- VERCEL_TOKEN is already required by api/deploy.js — Vercel MCP auth reuses the same variable, no new setup needed

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api/_lib/cors.js`: Shared CORS utility created in Phase 1 — CLAUDE.md must document this as the mandatory pattern for all API endpoints
- `api/_lib/mongodb.js`: MongoDB ping guard — CLAUDE.md must document the cold-start reconnect pattern
- `.env.example`: Source of truth for required env vars to list in CLAUDE.md

### Established Patterns
- API handler pattern: `module.exports = async function handler(req, res)` with CORS at top
- Shared lib pattern: files in `api/_lib/` have named exports, required inline inside handlers
- Test locations: Jest at `__tests__/*.test.js` (root), Jest at `projects/taskmaster/` (separate), Cypress at `cypress/e2e/`

### Integration Points
- `.claude/` directory already exists (contains settings.local.json)
- No CLAUDE.md currently exists — creating from scratch
- No .mcp.json currently exists — creating from scratch
- No .claude/commands/ directory — creating from scratch

</code_context>

<deferred>
## Deferred Ideas

- Hooks (pre-commit TypeScript check, Prettier auto-format, git push reminder) — future phase
- /deploy command — deferred; user can instruct Claude verbally for now
- /test command — deferred; test suite structure is simple enough to describe in CLAUDE.md
- Additional MCP servers (MongoDB) — noted in REQUIREMENTS.md as TOOL-01 (v2)
- Rules directory (separate .claude/rules/ structure) — could be added later if CLAUDE.md becomes too prescriptive

</deferred>

---

*Phase: 02-claude-code-tooling*
*Context gathered: 2026-03-11*
