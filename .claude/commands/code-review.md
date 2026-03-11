---
name: code-review
description: Pre-commit security and quality check. Run before committing any code changes.
disable-model-invocation: true
argument-hint: "[file, directory, or leave blank for current changes]"
---

# Code Review: $ARGUMENTS

Review the specified files (or current working changes if no argument given) against
every item below. Check each box only after verifying it passes.

---

## Security

- [ ] **No hardcoded secrets or API keys** -- all sensitive values use `process.env.*`
- [ ] **All API request bodies have input validation** -- type, size, and required fields are checked
- [ ] **No `innerHTML` with user-supplied content** -- use DOM APIs (`textContent`, `createElement`) instead
- [ ] **Auth checks run before any protected operation** -- no unguarded routes or functions

## Test Coverage

- [ ] **New functions have at least one unit test**
- [ ] **New API endpoints have at least one supertest integration test** (in `__tests__/`)
- [ ] **Bug fixes have a regression test** that reproduces the original failure

## Code Quality

- [ ] **Functions are focused** -- under 30 lines where possible
- [ ] **No nesting deeper than 3 levels** -- flatten with early returns or extract helpers
- [ ] **No copy-pasted logic** -- extract to `api/_lib/` or a shared helper module

---

## How to Run Tests

```bash
npm test                              # Jest (root __tests__/)
cd projects/taskmaster && npm test    # TaskMaster Jest
npm run test:e2e                      # Cypress E2E
```

## Verdict

Report each **failing item** with the file path and line number.

If all items pass, confirm: **"Code review passed -- safe to commit."**
