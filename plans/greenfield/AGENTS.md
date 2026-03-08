# AGENTS.md

Scoped execution guidance for the initial greenfield build.

Base project rules live in `../../AGENTS.md`.

## Scope

- Run greenfield execution commands from this directory: `plans/greenfield/`
- This file applies only to the initial project build tracked by `EXECUTION_PLAN.md`.
- Feature work belongs in `../../features/<name>/`.

## Required Context

Before starting a task, read:
1. `../../AGENTS.md`
2. `PRODUCT_SPEC.md` if it exists
3. `TECHNICAL_SPEC.md` if it exists
4. `EXECUTION_PLAN.md`
5. `QUESTIONS.md` if it exists
6. `../../LEARNINGS.md` if it exists

## Workflow

```
HUMAN (Orchestrator)
├── Completes pre-phase setup
├── Assigns tasks from EXECUTION_PLAN.md
├── Reviews and approves at phase checkpoints

AGENT (Executor)
├── Executes one task at a time
├── Works in git branch
├── Follows TDD: tests first, then implementation
├── Runs verification against acceptance criteria
└── Reports completion or blockers
```

---

## Task Execution

1. **Load context** — Read AGENTS.md, DESIGN_SYSTEM.md, PRODUCT_SPEC.md, TECHNICAL_SPEC.md, and your task from EXECUTION_PLAN.md
2. **Check CLAUDE.md** — Read project root CLAUDE.md if it exists
3. **Create branch** — If first task in phase, create branch: `git checkout -b phase-{N}`
4. **Verify dependencies** — Confirm prior tasks are complete
5. **Write tests first** — One test per acceptance criterion
6. **Implement** — Minimum code to pass tests
7. **Verify** — Use code-verification skill
8. **Update progress** — Check off completed criteria in EXECUTION_PLAN.md (`- [ ]` → `- [x]`)
9. **Commit** — Format: `task(1.1.A): brief description [REQ-XXX]`

---

## Context Management

**Start fresh for each task.** Do not carry conversation history between tasks.

Before starting any task, load: AGENTS.md, DESIGN_SYSTEM.md, PRODUCT_SPEC.md, TECHNICAL_SPEC.md, your task from EXECUTION_PLAN.md.

**Preserve context while debugging.** If tests fail within a task, continue in the same conversation until resolved.

### Context Hygiene

1. **Compact BEFORE steps, not during them** — Run `/compact` before starting next command if context below 40%
2. **Never let compaction occur mid-command**
3. **Never exceed 60% context capacity**
4. **When in doubt, start fresh** — A clean context beats a polluted one

---

## Testing Policy

- Tests must exist for every acceptance criterion
- All tests must pass before reporting complete
- Never skip or disable tests to make them pass
- Use AAA pattern (Arrange, Act, Assert)
- Test naming: `should {behavior} when {condition}`
- Test: happy path, edge cases, error cases, state changes
- Mock external APIs, database calls, time/dates. Don't mock the code under test.
- Reset mocks between tests. Mock at the boundary.

---

## Verification

After implementing each task, verify all acceptance criteria are met. Use `/code-verification` if available, otherwise manually verify each criterion.

---

## When to Stop and Ask

Stop and ask the human if:
- A dependency is missing
- You need environment variables or secrets
- Acceptance criteria are ambiguous
- A test fails and you cannot determine why
- You need to modify files outside your task scope

**Blocker format:** `BLOCKED: Task {id}` with Issue, Tried, Need, Type fields.

---
