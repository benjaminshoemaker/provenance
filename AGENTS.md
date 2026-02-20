# AGENTS.md

Workflow guidelines for AI agents executing tasks from EXECUTION_PLAN.md.

---

## Project Context

**Tech Stack:** TypeScript, Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Auth), TipTap v2, Vercel AI SDK, Vitest

**Dev Server:** `npm run dev` → `http://localhost:3000` (wait 5s for startup)

---

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

1. **Load context** — Read AGENTS.md, PRODUCT_SPEC.md, TECHNICAL_SPEC.md, and your task from EXECUTION_PLAN.md
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

Before starting any task, load: AGENTS.md, PRODUCT_SPEC.md, TECHNICAL_SPEC.md, your task from EXECUTION_PLAN.md.

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

## Git Conventions

| Item | Format | Example |
|------|--------|---------|
| Phase branch | `phase-{N}` | `phase-1` |
| Commit | `task({id}): {desc} [REQ-XXX]` | `task(1.2.A): Add OAuth login [REQ-004]` |

Use `/create-pr` for pull requests at phase checkpoints.

---

## Plan Review Protocol

After writing a plan in plan mode, use AskUserQuestion **before** calling ExitPlanMode:
- "Ready to implement (Recommended)" → Call ExitPlanMode
- "Review with /codex-consult first" → Call ExitPlanMode, then run consult
- "I want to modify the plan" → Stay in plan mode

---

## Guardrails

- Make the smallest change that satisfies acceptance criteria
- Do not duplicate files to work around issues — fix the original
- Do not guess — if you can't access something, say so
- Do not introduce new APIs without flagging for spec updates
- Read error output fully before attempting fixes

---

## Follow-Up Items

Track discovered items in TODOS.md. Do not silently ignore issues. Do not scope-creep by fixing them without approval.
