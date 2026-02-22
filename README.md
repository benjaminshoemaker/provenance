# Provenance

An auditable AI writing tool that makes the writing process transparent and verifiable.

Writers who use AI thoughtfully have no way to prove it. Readers have no way to tell the difference. Provenance fixes this by recording **how** AI was used during writing and generating a verifiable badge with the results. It's a court reporter, not a judge.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Run database migrations
npx drizzle-kit migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Write** in the TipTap-based editor with full formatting support
2. **Use AI** via inline tools (select text, choose an action like Improve/Simplify/Expand)
3. **Every interaction is tracked** — AI suggestions, pastes from external sources, manual edits
4. **Generate a badge** that shows the exact AI percentage, embeddable in any blog or site
5. **Readers verify** by clicking the badge to see the full audit trail

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (Google + GitHub OAuth) |
| Editor | TipTap v2 (ProseMirror) |
| AI | Vercel AI SDK (Anthropic Claude + OpenAI) |
| Styling | Tailwind CSS + shadcn/ui |
| Badge Images | @vercel/og (Satori) |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
    dashboard/      # Document list with sidebar, search, filters
    editor/[id]/    # Full-width editor with inline AI
    verify/[id]/    # Public verification page
    settings/       # User preferences (AI provider, model)
    api/            # Route handlers (AI completion, badges, timeline)
    actions/        # Server actions (documents, sessions, AI interactions)
  components/
    dashboard/      # Sidebar, DocumentRow, DashboardContent
    editor/         # Editor, InlineAI, Toolbar, TrackChangesDiff, TimelineModal
    verify/         # StatsSummary, AuditTimeline, TimelineMinimap, ScopeStatement
    ui/             # Shared components (BackLink, tooltip, etc.)
  extensions/       # TipTap extensions (OriginMark, PasteHandler)
  hooks/            # Custom hooks (useAutoSave, useSession)
  lib/              # Utilities (metrics, badge-image, timeline-utils)
```

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run test      # Run all tests (vitest)
npm run lint      # ESLint
```

## Documentation

- [Product Spec](PRODUCT_SPEC.md) — Requirements and user stories
- [Technical Spec](TECHNICAL_SPEC.md) — Architecture and data models
- [Design System](DESIGN_SYSTEM.md) — Colors, components, interaction patterns
- [Agent Workflow](AGENTS.md) — Guidelines for AI-assisted development

## License

Private.
