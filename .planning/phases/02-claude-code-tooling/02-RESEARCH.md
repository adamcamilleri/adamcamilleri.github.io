# Phase 2: Claude Code Tooling - Research

**Researched:** 2026-03-11
**Domain:** Claude Code configuration — CLAUDE.md, MCP servers, custom slash commands/skills
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- CLAUDE.md: balanced approach — brief structure overview + key behavioral rules (not just facts, not just prescriptions)
- CLAUDE.md: 200-line limit — defer deep context to .planning/ via links
- CLAUDE.md must include: monorepo layout, api/_lib/ shared utilities pattern, post-refactor patterns (cors.js, MongoDB ping guard), how to run tests, key env vars, bug report workflow, behavioral rules ("always use api/_lib/cors.js"), pointer to STATE.md, links to REQUIREMENTS.md / ROADMAP.md / .planning/codebase/ maps
- CLAUDE.md: security rules inline — no hardcoded secrets, input validation, XSS prevention via DOM APIs, auth checks before protected endpoints
- MCP: project-level .mcp.json (version-controlled in repo)
- MCP: GitHub MCP — GITHUB_TOKEN env var for auth
- MCP: Vercel MCP — VERCEL_TOKEN env var for auth (already required by api/deploy.js)
- MCP: both servers configured with minimal required scopes
- /tdd slash command — test-driven workflow covering new features (RED/GREEN/REFACTOR) AND bug fixes (reproducing test first, prove it fails, fix, prove it passes); matches CLAUDE.md bug report rule
- /code-review slash command — pre-commit security + quality check covering hardcoded secrets, input validation, XSS prevention, auth checks, test coverage gaps, function size/nesting/duplication

### Claude's Discretion
- Exact formatting and section ordering within CLAUDE.md
- Which specific MCP server npm packages to use (pick most stable/official versions)
- How verbose each slash command's output is

### Deferred Ideas (OUT OF SCOPE)
- Hooks (pre-commit TypeScript check, Prettier auto-format, git push reminder) — future phase
- /deploy command — deferred; user can instruct Claude verbally for now
- /test command — deferred; test suite structure is simple enough to describe in CLAUDE.md
- Additional MCP servers (MongoDB) — v2 requirement (TOOL-01)
- Rules directory (.claude/rules/ structure) — could be added later if CLAUDE.md becomes too prescriptive
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLAUDE-01 | Create CLAUDE.md with full project context (under 200 lines, progressive disclosure to .planning/) | CLAUDE.md structure patterns researched; existing codebase maps in .planning/codebase/ provide the content |
| CLAUDE-02 | Configure .mcp.json with GitHub and Vercel MCP server integrations | Vercel MCP uses HTTP transport at `https://mcp.vercel.com` (OAuth). GitHub MCP uses HTTP at `https://api.githubcopilot.com/mcp/` (OAuth) or Docker/stdio with PAT |
| CLAUDE-03 | Create custom slash commands in .claude/commands/ for common tasks | .claude/commands/ files work identically to .claude/skills/ SKILL.md files; commands create /tdd and /code-review slash commands |
</phase_requirements>

---

## Summary

This phase creates three configuration files that make Claude Code self-orienting in this project. The deliverables are: `CLAUDE.md` (project context under 200 lines), `.mcp.json` (GitHub + Vercel MCP integration), and two slash commands (`/tdd`, `/code-review`) in `.claude/commands/`.

All three deliverables are new files — nothing exists yet. The `.claude/` directory exists but only contains `settings.local.json`. No CLAUDE.md, no .mcp.json, no commands directory. The codebase planning documents in `.planning/codebase/` (ARCHITECTURE.md, STRUCTURE.md, STACK.md, CONVENTIONS.md, INTEGRATIONS.md, TESTING.md, CONCERNS.md) are the primary content source for CLAUDE.md — they contain accurate post-refactor architecture, the api/_lib/ shared utility patterns, and test locations.

**Primary recommendation:** Write CLAUDE.md directly from the codebase maps in `.planning/codebase/` — the research is already done. Use HTTP transport for both MCP servers (Vercel at `https://mcp.vercel.com`, GitHub at `https://api.githubcopilot.com/mcp/`) — both support OAuth in-session with no token to manage in the config file. Slash commands go in `.claude/commands/` as markdown files; the frontmatter `disable-model-invocation: true` should be set for both (these are user-invoked workflows, not auto-invoked by Claude).

## Standard Stack

### Core
| File/Tool | Format | Purpose | Why Standard |
|-----------|--------|---------|--------------|
| CLAUDE.md | Markdown | Project context for every new Claude session | Claude Code reads this automatically at session start |
| .mcp.json | JSON (mcpServers schema) | Project-scoped MCP server configuration | Committed to version control; available to all team members |
| .claude/commands/*.md | Markdown with YAML frontmatter | Custom slash commands | Directory is Claude Code's project-level command location |

### MCP Server Configuration
| Server | Transport | URL / Command | Auth Method |
|--------|-----------|---------------|-------------|
| Vercel MCP | HTTP (streamable) | `https://mcp.vercel.com` | OAuth (in-session via `/mcp`) |
| GitHub MCP | HTTP | `https://api.githubcopilot.com/mcp/` | OAuth (in-session via `/mcp`) |

Both Vercel and GitHub now offer HTTP remote MCP servers with OAuth, meaning **no tokens in `.mcp.json`** — credentials are handled interactively on first use. This is the officially recommended approach for both services as of 2026.

**Key note on VERCEL_TOKEN:** The CONTEXT.md decision says "reuse VERCEL_TOKEN env var." However, Vercel's official MCP server (`https://mcp.vercel.com`) uses OAuth, not the static `VERCEL_TOKEN`. The static token is used by `api/deploy.js` for programmatic deployment. They are separate concerns. The `.mcp.json` Vercel entry should use HTTP + OAuth (no token in file); `VERCEL_TOKEN` continues to be used by `api/deploy.js` unchanged.

### Slash Command Frontmatter (verified from official docs)
| Field | Value for /tdd and /code-review | Reason |
|-------|--------------------------------|--------|
| `name` | tdd / code-review | Becomes the /slash-command name |
| `description` | describes when to use | Helps Claude know when to auto-invoke |
| `disable-model-invocation` | `true` | These are user-triggered workflows; prevent Claude auto-invoking |
| `argument-hint` | optional, e.g. `[file or feature]` | Shows in autocomplete |

**Installation:**
No npm install required. File creation only:
- `CLAUDE.md` at repo root
- `.mcp.json` at repo root
- `.claude/commands/tdd.md`
- `.claude/commands/code-review.md`

## Architecture Patterns

### CLAUDE.md Structure (under 200 lines)

The file should follow progressive disclosure: high-signal overview at the top, pointers to deeper docs for anyone who needs them.

```
CLAUDE.md sections (in order):
1. What This Is (2-3 lines) — repo name, purpose, current status pointer
2. Monorepo Layout — directory tree (root shell, api/, projects/, .planning/)
3. api/_lib/ Pattern — mandatory import rule for cors.js + mongodb.js
4. How to Run Tests — Jest, TaskMaster Jest, Cypress commands
5. Key Env Vars — reference .env.example, list critical ones
6. npm Scripts — dev, test, build, test:e2e
7. Adding Code — new API endpoint checklist, new project checklist
8. Bug Report Workflow — write test first (verbatim from CLAUDE.md already in repo)
9. Security Rules — 4 inline rules
10. Deep Context Links — pointers to .planning/ documents
```

The existing `CLAUDE.md` already exists at the repo root with the bug report workflow and basic overview. **It must be reviewed and expanded** rather than replaced from scratch. The current file is short (8 lines) and only contains the bug report rule and workflow commands.

### .mcp.json Format (verified from official docs)

```json
{
  "mcpServers": {
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

Claude Code will prompt for approval before using project-scoped servers from `.mcp.json`. On first use, run `/mcp` inside Claude Code to authenticate each server via OAuth.

### Slash Command Format (verified from official docs)

Commands in `.claude/commands/` use markdown with optional YAML frontmatter:

```markdown
---
name: tdd
description: Test-driven workflow for new features and bug fixes
disable-model-invocation: true
argument-hint: "[feature description or bug description]"
---

# TDD Workflow

...instructions...
```

The `$ARGUMENTS` variable captures everything typed after `/tdd some description`.

### /tdd Command Content Structure
```
1. Classify: new feature or bug fix?
2. If bug fix:
   a. Write a FAILING test that reproduces the bug
   b. Run tests — confirm it FAILS
   c. Fix the minimal code
   d. Run tests — confirm it PASSES
3. If new feature:
   a. RED: write a failing test for the desired behavior
   b. GREEN: write minimal code to make the test pass
   c. REFACTOR: clean up without breaking the test
4. Rules: no production code before a test; commit only when tests pass
```

### /code-review Command Content Structure
```
Review checklist (check all before committing):

Security:
- [ ] No hardcoded secrets or API keys — use process.env.*
- [ ] All API request bodies have input validation (type, size, required fields)
- [ ] No innerHTML with user-supplied content — use DOM APIs (textContent, createElement)
- [ ] Auth checks run before any protected operation

Test Coverage:
- [ ] New functions have at least one unit test
- [ ] New API endpoints have at least one supertest integration test
- [ ] Bug fixes have a regression test

Code Quality:
- [ ] Functions are focused (< 30 lines where possible)
- [ ] No nesting deeper than 3 levels
- [ ] No copy-pasted logic — extract to api/_lib/ or a shared helper
```

### Anti-Patterns to Avoid
- **Putting MCP tokens in .mcp.json:** Both Vercel and GitHub MCP now use OAuth; never store tokens in version-controlled config files.
- **Writing CLAUDE.md as pure documentation:** It should contain behavioral rules ("always do X"), not just facts ("X exists"). Rules are what make Claude actually follow patterns.
- **Making slash commands auto-invocable:** /tdd and /code-review have side effects (creating test files, running tests). Always set `disable-model-invocation: true`.
- **Exceeding 200 lines in CLAUDE.md:** Link out to `.planning/codebase/` documents instead of inlining large sections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vercel project access in Claude | Custom Vercel API wrapper | `https://mcp.vercel.com` MCP server | Official OAuth-authenticated MCP; manages deployments, logs, projects |
| GitHub issue/PR access in Claude | Custom GitHub API calls | `https://api.githubcopilot.com/mcp/` | Official GitHub MCP; full issue/PR/repo access |
| MCP auth token management | Tokens in .mcp.json | OAuth via `/mcp` command | Tokens rotate; OAuth is the official auth flow for both services |

**Key insight:** Both MCP servers are remote HTTP servers with OAuth — no local npm package to install, no token to rotate, no Docker required.

## Common Pitfalls

### Pitfall 1: .mcp.json scope confusion
**What goes wrong:** Creating `.mcp.json` with `--scope local` (the default) stores config in `~/.claude.json`, not the project file. It won't be committed to git.
**Why it happens:** `claude mcp add` defaults to `--scope local`.
**How to avoid:** Always use `--scope project` when adding to `.mcp.json`, or write the file directly.
**Warning signs:** Running `git status` after `claude mcp add` shows no new file.

### Pitfall 2: Old stdio GitHub MCP config
**What goes wrong:** Using the Docker-based stdio config for GitHub MCP (`docker run ghcr.io/github/github-mcp-server`) when the HTTP remote server is available and preferred.
**Why it happens:** Older documentation and examples show the Docker approach.
**How to avoid:** Use `https://api.githubcopilot.com/mcp/` HTTP transport; no Docker or PAT required.
**Warning signs:** Config contains `"command": "docker"` or `GITHUB_PERSONAL_ACCESS_TOKEN` in .mcp.json.

### Pitfall 3: CLAUDE.md too prescriptive / too sparse
**What goes wrong:** Either Claude ignores a wall of rules, or Claude has to re-read the whole codebase to find patterns.
**Why it happens:** No middle ground modeled.
**How to avoid:** For each section, one behavioral rule + one code example + pointer to detailed doc. See the affaan-m/everything-claude-code pattern referenced in CONTEXT.md.
**Warning signs:** File exceeds 200 lines or has zero behavioral rules (just structure descriptions).

### Pitfall 4: Slash command auto-invocation for side-effect workflows
**What goes wrong:** Claude runs /tdd automatically when it thinks code should be tested, creating files and running tests mid-conversation unexpectedly.
**Why it happens:** Default `disable-model-invocation: false`.
**How to avoid:** Set `disable-model-invocation: true` in frontmatter for both commands.

### Pitfall 5: api/oauth.js CORS not migrated to cors.js
**What goes wrong:** CLAUDE.md says "always import cors.js" but api/oauth.js still uses its own ALLOWED_ORIGINS.
**Why it happens:** The Phase 1 decision was to NOT migrate oauth.js (it has a different restricted 4-origin list; deferred).
**How to avoid:** CLAUDE.md should note the exception: "api/oauth.js has its own CORS allowlist (deliberately restricted — do not change without reviewing the OAuth flow)."

## Code Examples

### Verified .mcp.json for this project

```json
{
  "mcpServers": {
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

Source: Vercel official docs (https://vercel.com/docs/agent-resources/vercel-mcp), GitHub MCP server repo

### Adding servers via CLI (project scope)

```bash
# Vercel MCP — HTTP OAuth (no token)
claude mcp add --transport http --scope project vercel https://mcp.vercel.com

# GitHub MCP — HTTP OAuth (no token)
claude mcp add --transport http --scope project github https://api.githubcopilot.com/mcp/

# Authenticate in session (first use)
# /mcp   → select each server → "Authenticate" → browser OAuth flow
```

### Slash command with frontmatter (.claude/commands/tdd.md)

```markdown
---
name: tdd
description: Test-driven workflow. Use when writing new features or fixing bugs.
disable-model-invocation: true
argument-hint: "[feature or bug description]"
---

Run the TDD workflow for: $ARGUMENTS

...
```

Source: Official Claude Code slash commands docs (https://code.claude.com/docs/en/slash-commands)

### How to reference $ARGUMENTS in a command

```markdown
---
name: code-review
description: Pre-commit security and quality check
disable-model-invocation: true
---

Review $ARGUMENTS (or the current working changes if no argument given).

Check:
...
```

When the user types `/code-review api/chat.js`, Claude receives "Review api/chat.js."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GitHub MCP via Docker + PAT | HTTP remote server + OAuth at `https://api.githubcopilot.com/mcp/` | 2025 | No Docker, no token rotation |
| Vercel MCP via `VERCEL_TOKEN` env var in config | HTTP remote server + OAuth at `https://mcp.vercel.com` | 2025 | No token in .mcp.json |
| `.claude/commands/*.md` only | `.claude/skills/<name>/SKILL.md` preferred (commands still work) | 2025 | Skills support supporting files; commands still fully functional |
| MCP scope: "project" stored .mcp.json | Scope renamed: "project" = .mcp.json (team), "local" = ~/.claude.json (personal) | 2025 | Scope flag terminology changed — use `--scope project` for .mcp.json |

**Deprecated/outdated:**
- `GITHUB_PERSONAL_ACCESS_TOKEN` in .mcp.json: OAuth replaces PAT for the official GitHub MCP server
- `--transport stdio -- docker run github-mcp-server`: Docker approach replaced by HTTP remote

## Open Questions

1. **Windows npx wrapper for MCP**
   - What we know: On Windows (non-WSL), stdio MCP servers using `npx` require `cmd /c` wrapper
   - What's unclear: Both servers in this plan use HTTP transport, so this does not apply here
   - Recommendation: Not a concern for this phase; noted for any future stdio MCP servers

2. **GitHub OAuth scope for private repos**
   - What we know: GitHub MCP HTTP server uses OAuth through `https://api.githubcopilot.com/mcp/`
   - What's unclear: Whether the OAuth flow at first auth grants repo access or requires additional scope selection
   - Recommendation: Document in CLAUDE.md that first-time auth requires running `/mcp` and authenticating both servers; note that GitHub access depends on the OAuth scopes granted

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 (root) |
| Config file | `package.json` (jest key) |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements → Test Map

Phase 2 deliverables are configuration files, markdown documents, and JSON — not executable code. There is no production logic to unit-test. Validation is behavioral (does Claude actually use them correctly?) and structural (do the files exist and parse correctly?).

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLAUDE-01 | CLAUDE.md exists, < 200 lines, contains required sections | manual smoke | `wc -l CLAUDE.md` and section grep | ❌ Wave 0 |
| CLAUDE-02 | .mcp.json parses as valid JSON, contains mcpServers for vercel and github | structural | `node -e "require('./.mcp.json')"` | ❌ Wave 0 |
| CLAUDE-03 | .claude/commands/tdd.md and code-review.md exist, contain valid YAML frontmatter | structural | manual inspection | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node -e "require('./.mcp.json')" && echo '.mcp.json valid'`
- **Per wave merge:** All file existence + JSON validity checks above
- **Phase gate:** Manual Claude Code session test — start fresh session, verify Claude reads CLAUDE.md, run `/mcp` to confirm both MCP servers appear, run `/tdd` and `/code-review` to confirm commands are available

### Wave 0 Gaps
- No test files need to be created — this phase produces config files, not code
- Structural validation is ad-hoc (JSON parse check, line count, file existence)
- The meaningful "test" is a manual Claude Code session: open Claude, confirm CLAUDE.md is referenced, confirm `/tdd` and `/code-review` are available via `/`, confirm `/mcp` shows both Vercel and GitHub servers

## Sources

### Primary (HIGH confidence)
- Official Claude Code MCP docs (https://code.claude.com/docs/en/mcp) — .mcp.json format, scope behavior, HTTP transport, OAuth flow
- Official Claude Code slash commands/skills docs (https://code.claude.com/docs/en/slash-commands) — frontmatter fields, $ARGUMENTS substitution, disable-model-invocation, .claude/commands/ location
- Vercel official MCP docs (https://vercel.com/docs/agent-resources/vercel-mcp) — endpoint URL, OAuth auth, Claude Code setup command
- GitHub MCP server repo (https://github.com/github/github-mcp-server) — HTTP endpoint, auth options, capabilities

### Secondary (MEDIUM confidence)
- .planning/codebase/STRUCTURE.md — codebase layout, verified against actual repo contents
- .planning/codebase/CONVENTIONS.md — coding patterns to document in CLAUDE.md
- .planning/codebase/INTEGRATIONS.md — env var names, service endpoints
- .planning/codebase/TESTING.md — test locations and commands
- .planning/phases/02-claude-code-tooling/02-CONTEXT.md — locked decisions constraining research scope

### Tertiary (LOW confidence)
- None — all critical claims verified against official documentation

## Metadata

**Confidence breakdown:**
- CLAUDE.md content strategy: HIGH — codebase maps exist and are accurate; current CLAUDE.md is 8 lines and confirmed to need expansion
- MCP server config: HIGH — verified against official Vercel and GitHub MCP docs; HTTP + OAuth confirmed as current standard
- Slash command format: HIGH — verified from official Claude Code skills/commands docs; frontmatter fields confirmed
- Test infrastructure mapping: HIGH — Jest + Cypress confirmed from package.json and codebase docs

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (MCP OAuth flows are stable; slash command format is stable; Vercel/GitHub endpoints unlikely to change)
