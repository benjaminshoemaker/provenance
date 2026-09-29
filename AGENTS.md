# AGENTS.md

Project-wide guidance for AI agents working on Provenance.

- Stack: TypeScript, Next.js App Router, Tailwind CSS, shadcn/ui, Neon,
  Auth.js, Drizzle, TipTap, Vercel AI SDK, and Vitest.
- Run `npm run dev` for local development at `http://localhost:3000`.
- Follow `DESIGN_SYSTEM.md`; reference mockups live in `mockups/ui-mockups.html`.
- Existing plans and feature documents are historical product context, not a
  mandatory workflow or authorization boundary.
- Make the smallest change that satisfies the request and follow existing patterns.
- Do not duplicate files as a workaround or introduce APIs without calling out
  the impact.
- Add or update tests for behavior changes and run project-native checks before
  reporting completion.
- Preserve unrelated work and record follow-up items in `TODOS.md`.

Treat instruction, automation, CI, authentication, data, and security files as
high-impact configuration. Git history is the recovery path for retired
workflow material.
