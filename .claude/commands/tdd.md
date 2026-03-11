---
name: tdd
description: Test-driven workflow. Use when writing new features or fixing bugs.
disable-model-invocation: true
argument-hint: "[feature description or bug description]"
---

# TDD Workflow for: $ARGUMENTS

## Step 1: Classify the Work

Determine whether `$ARGUMENTS` describes a **bug fix** or a **new feature**.
- If it describes broken/incorrect behavior, follow the **Bug Fix** path.
- If it describes new functionality, follow the **New Feature** path.
- If truly ambiguous, ask the user to clarify before proceeding.

---

## Bug Fix Path

Follow the project's bug report rule exactly: reproduce first, then fix.

### 1. Write a Failing Test

Write a test that **reproduces the bug** described in `$ARGUMENTS`.
Place it in the appropriate test location (see below).

```bash
# Do NOT touch production code yet
```

### 2. Confirm the Test Fails

Run the test suite and verify the new test **fails** with output that matches the reported bug.

```bash
npm test          # or the relevant test command
```

Show the failure output to confirm reproduction.

### 3. Fix the Bug

Write the **minimal code change** necessary to resolve the bug.
Do not refactor unrelated code during this step.

### 4. Confirm the Test Passes

Run the full test suite and verify:
- The new regression test **passes**
- All existing tests **still pass**

```bash
npm test
```

**Rule:** Never modify production code before the failing test exists.

---

## New Feature Path

Follow the RED / GREEN / REFACTOR cycle.

### RED -- Write a Failing Test

Write a test that describes the desired behavior of `$ARGUMENTS`.
Run it and confirm it **fails**:

```bash
npm test
```

### GREEN -- Make It Pass

Write the **minimal production code** to make the test pass.
Run the test and confirm it **passes**:

```bash
npm test
```

### REFACTOR -- Clean Up

Improve the implementation (rename, extract helpers, remove duplication).
Run the test again and confirm it **still passes**:

```bash
npm test
```

---

## Test Locations

| Suite | Command | Files |
|-------|---------|-------|
| Root Jest | `npm test` | `__tests__/` |
| TaskMaster Jest | `cd projects/taskmaster && npm test` | `projects/taskmaster/__tests__/` |
| Cypress E2E | `npm run test:e2e` | `cypress/` |

## Commit Rule

Only commit after the full test suite is green. Use a descriptive commit message
that references what was fixed or added.
