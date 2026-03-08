# AGENTS.md

Project-wide workflow guidance for AI agents working in this project.

## Instruction Hierarchy

- This file is the durable, project-wide baseline.
- Initial greenfield execution guidance lives in `plans/greenfield/AGENTS.md`.
- Feature execution guidance lives in `features/<name>/AGENTS.md`.
- When working in a scoped directory, read this file first, then the local `AGENTS.md` or `CLAUDE.md` in that directory.

## Project Context

**Tech Stack:** TypeScript, Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, Neon PostgreSQL, Auth.js v5, Drizzle ORM, TipTap v2, Vercel AI SDK 6, Vitest

**Dev Server:** `npm run dev` → `http://localhost:3000` (wait 5s for startup)

**Design System:** All UI work must follow `DESIGN_SYSTEM.md` — colors, layout patterns, component patterns, and interaction models are defined there. Reference mockups live in `/mockups/ui-mockups.html`.

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
