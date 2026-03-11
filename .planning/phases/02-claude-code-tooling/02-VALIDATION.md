---
phase: 2
slug: claude-code-tooling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Jest 29.7 |
| Quick run | `npm test` |
| Full suite | `npm test && npm run test:e2e` |

## Per-Task Verification Map

| Task | Requirement | Test Type | Command | Status |
|------|-------------|-----------|---------|--------|
| CLAUDE.md created | CLAUDE-01 | structural | `wc -l CLAUDE.md` | pending |
| .mcp.json created | CLAUDE-02 | structural | `node -e "require('./.mcp.json')"` | pending |
| Commands created | CLAUDE-03 | structural | `ls .claude/commands/tdd.md .claude/commands/code-review.md` | pending |

## Manual Verifications

- CLAUDE-01: Start fresh Claude session, ask about api/_lib/ patterns without reading files
- CLAUDE-02: Run `/mcp` in Claude Code, confirm vercel + github servers listed
- CLAUDE-03: Type `/` in Claude Code, confirm /tdd and /code-review in autocomplete

## Wave 0

None required — phase produces config files, not executable code.

## Validation Sign-Off

- [ ] All tasks have automated verify
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
