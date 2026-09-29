# AGENTS.md

Project-wide guidance for AI agents working on Provenance.

## Project context

- The stack is TypeScript, Next.js App Router, Tailwind CSS, shadcn/ui, Neon, Auth.js, Drizzle, TipTap, Vercel AI SDK, and Vitest.
- `README.md` describes the current product and setup.
- `DESIGN_SYSTEM.md` and `mockups/ui-mockups.html` define the active visual language.
- `IDEAS.md` is the non-binding backlog. The root brainstorm and UI research documents preserve broader exploration.
- Git history is the recovery path for retired workflow material.

## Working rules

- Follow the user's current request; no backlog or research document authorizes implementation by itself.
- Make the smallest change that satisfies the request and follow existing patterns.
- Do not duplicate files as a workaround or introduce APIs without calling out the impact.
- Add or update tests for behavior changes and run project-native checks before reporting completion.
- Preserve unrelated work.
- Treat instruction, automation, CI, authentication, data, privacy, and security files as high-impact configuration.
- Keep public verification claims limited to what Provenance actually observed, and maintain a clear boundary between public badge data and private writing or AI-interaction data.
- Record open opportunities in `IDEAS.md`; keep durable constraints in current documentation, schema, tests, and code.

## Verification

Run checks proportionate to the change. For repo-wide changes, run:

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

Report unavailable tools, credentials, source data, or known baseline failures explicitly.
