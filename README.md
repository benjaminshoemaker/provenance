# Provenance

A writing editor that records edits and AI interactions, then lets readers
inspect the recorded history.

## What the record can tell you

Provenance tracks activity inside the editor: writing, pasted text, and
use of the built-in AI tools. A shared badge links back to that history.

It can't establish how text was written before it was pasted in, or
whether the claims in a document are true. Any AI percentage needs to be
read within that scope.

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
2. **Use AI** via inline tools or the side-panel chat (research, critique, brainstorm)
3. **Every interaction is tracked** — AI suggestions, pastes from external sources, manual edits
4. **Generate a badge** showing the AI attribution recorded by the editor
5. **Readers inspect the history** by clicking the badge

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
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
    editor/[id]/    # Two-panel editor with inline AI + chat sidebar
    verify/[id]/    # Public verification page
    settings/       # User preferences (AI provider, model)
    api/            # Route handlers (AI completion, chat, badges, timeline)
    actions/        # Server actions (documents, sessions, AI interactions)
  components/
    dashboard/      # Sidebar, DocumentRow, DashboardContent
    editor/         # Editor, InlineAI, Toolbar, TrackChangesDiff, TimelineModal
      chat/         # AI chat panel (ChatPanel, ChatMessage, ChatInput, ChatHeader)
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

- [Design System](DESIGN_SYSTEM.md) — Colors, components, interaction patterns
- [Manual Testing](MANUAL_TESTING.md) — Current hands-on verification paths
- [Ideas](IDEAS.md) — Non-binding product opportunities and unresolved questions
- [Agent Guidance](AGENTS.md) — Repository constraints for AI-assisted development
- [Initial Brainstorm](INITIAL_BRAINSTORM.md), [V2 Brainstorm](V2_BRAINSTORM.md), and [Research Synthesis](provenance-synthesis.md) — Broader product exploration

## Source

The source is public for inspection. No open-source license is specified.
