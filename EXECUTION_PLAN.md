# Execution Plan: Provenance

## Overview

| Metric | Value |
|--------|-------|
| Feature | Provenance — Auditable AI Writing Tool |
| Target Project | provenance |
| Total Phases | 6 |
| Total Steps | 16 |
| Total Tasks | 30 |

## Integration Points

| Existing Component | Integration Type | Notes |
|--------------------|------------------|-------|
| N/A (greenfield) | — | No existing codebase |

## Phase Dependency Graph

```
Phase 1: Foundation
  └── Phase 2: Editor
        └── Phase 3: AI Assistant
              └── Phase 4: Audit Trail
                    └── Phase 5: Badge & Verification
                          └── Phase 6: Polish
```

---

## Phase 1: Foundation

**Goal:** Project scaffolding, database schema, authentication, and basic document CRUD — a working app skeleton where users can log in and manage documents.
**Depends On:** None

### Pre-Phase Setup
Human must complete before starting:
- [ ] Create Vercel project and add Neon PostgreSQL from Vercel Marketplace
  - Verify: `vercel env pull .env.local && grep -q "DATABASE_URL" .env.local`
- [ ] Create Google OAuth app in Google Cloud Console (callback: `/api/auth/callback/google`)
  - Note: Add both `http://localhost:3000/api/auth/callback/google` AND production callback URL
  - Verify: `grep -q "AUTH_GOOGLE_ID" .env.local`
- [ ] Create GitHub OAuth app in GitHub Developer Settings (callback: `/api/auth/callback/github`)
  - Note: GitHub allows one callback URL per app; create separate OAuth apps for dev/prod if needed
  - Verify: `grep -q "AUTH_GITHUB_ID" .env.local`
- [ ] Generate Auth.js secret: `npx auth secret` and add to `.env.local`
  - Verify: `grep -q "AUTH_SECRET" .env.local`
- [ ] Set remaining environment variables in `.env.local`: `AUTH_TRUST_HOST=true`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `NEXT_PUBLIC_APP_URL`
  - Verify: `grep -q "AUTH_TRUST_HOST" .env.local && grep -q "DATABASE_URL" .env.local`

### Step 1.1: Project Scaffolding
**Depends On:** None

---

#### Task 1.1.A: Initialize Next.js Project

**Description:**
Create a new Next.js 15 project with App Router, TypeScript, Tailwind CSS, and shadcn/ui. Set up the basic project structure with layout, loading states, and a placeholder home page.

**Requirement:** REQ-001

**Acceptance Criteria:**
- [x] (CODE) Next.js 15 project created with App Router and TypeScript
  - Verify: `grep -q '"next":' package.json`
- [x] (CODE) Tailwind CSS configured with globals.css
  - Verify: `test -f tailwind.config.ts && grep -q '@tailwind' src/app/globals.css`
- [x] (CODE) shadcn/ui initialized with button and card components
  - Verify: `test -f components.json && test -d src/components/ui`
- [x] (BUILD) Project builds without errors
  - Verify: `npm run build`
- [x] (CODE) Root layout.tsx with HTML structure and metadata
  - Verify: `grep -q 'export default function RootLayout' src/app/layout.tsx`

**Files to Create:**
- `package.json` — Project dependencies
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.ts` — Tailwind configuration
- `next.config.ts` — Next.js configuration
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — Home page placeholder
- `src/app/globals.css` — Global styles
- `components.json` — shadcn/ui config
- `src/components/ui/button.tsx` — Button component
- `src/components/ui/card.tsx` — Card component
- `src/lib/utils.ts` — cn() utility

**Files to Modify:** None (greenfield)

**Existing Code to Reference:** None (greenfield)

**Dependencies:** None

**Spec Reference:** Tech Stack (TECHNICAL_SPEC.md)

---

#### Task 1.1.B: Configure Vitest and Testing Infrastructure

**Description:**
Set up Vitest for unit and integration testing. Configure test utilities, React Testing Library, and a sample test to validate the setup.

**Requirement:** None (infrastructure)

**Acceptance Criteria:**
- [x] (CODE) Vitest configured with TypeScript and React support
  - Verify: `grep -q 'vitest' package.json`
- [x] (CODE) Test setup file configures jsdom environment
  - Verify: `test -f src/test/setup.ts`
- [x] (TEST) Sample test passes
  - Verify: `npx vitest run --reporter=verbose 2>&1 | grep -q 'PASS\|pass'`
- [x] (CODE) Test script added to package.json
  - Verify: `grep -q '"test"' package.json`

**Files to Create:**
- `vitest.config.ts` — Vitest configuration
- `src/test/setup.ts` — Test setup (jsdom, RTL cleanup)
- `src/test/sample.test.ts` — Sample test

**Files to Modify:**
- `package.json` — Add vitest, @testing-library/react, @testing-library/jest-dom

**Existing Code to Reference:** None

**Dependencies:** Task 1.1.A

**Spec Reference:** AGENTS.md Testing Policy

---

### Step 1.2: Database Schema and Auth
**Depends On:** Step 1.1

---

#### Task 1.2.A: Drizzle Schema and Database Client

**Description:**
Configure Drizzle ORM with `@neondatabase/serverless` driver. Define the full database schema with all tables: Auth.js tables (`user`, `account`, `session`, `verificationToken`) with concrete `pgTable` definitions, and domain tables (`documents`, `revisions`, `ai_interactions`, `paste_events`, `writing_sessions`, `badges`). The `user` table is extended with `ai_provider` and `ai_model` columns. All tables are created upfront so foreign key relationships are correct from the start. Use `neon-http` driver for universal server-side compatibility. Configure `drizzle.config.ts` pointing to `DATABASE_URL_UNPOOLED`.

**Requirement:** REQ-040, REQ-041, REQ-044, REQ-054

**Acceptance Criteria:**
- [x] (CODE) Drizzle database client instance exists using `drizzle-orm/neon-http`
  - Verify: `grep -q 'drizzle' src/lib/db/index.ts && grep -q 'neon' src/lib/db/index.ts`
- [x] (CODE) Schema defines all Auth.js tables with concrete column definitions (user, account, session, verificationToken)
  - Verify: `grep -q 'pgTable.*user' src/lib/db/schema.ts && grep -q 'pgTable.*account' src/lib/db/schema.ts`
- [x] (CODE) Auth.js `user` table extended with `ai_provider` and `ai_model` columns
  - Verify: `grep -q 'ai_provider\|aiProvider' src/lib/db/schema.ts`
- [x] (CODE) All domain tables defined with correct columns, types, and FK relationships
  - Verify: `grep -q 'documents' src/lib/db/schema.ts && grep -q 'writing_sessions' src/lib/db/schema.ts && grep -q 'badges' src/lib/db/schema.ts`
- [x] (CODE) `user.id` is `text` type (cuid2) and domain table FKs use `text` for `userId`
  - Verify: `grep -q "text.*id" src/lib/db/schema.ts`
- [x] (CODE) `drizzle.config.ts` configured with `DATABASE_URL_UNPOOLED`
  - Verify: `grep -q 'DATABASE_URL_UNPOOLED' drizzle.config.ts`
- [x] (CODE) TypeScript types auto-inferred via `$inferSelect` and `$inferInsert`
  - Verify: `grep -q 'inferSelect\|inferInsert' src/lib/db/schema.ts`

**Files to Create:**
- `src/lib/db/index.ts` — Drizzle client instance using `drizzle-orm/neon-http` with `@neondatabase/serverless`
- `src/lib/db/schema.ts` — All table definitions (Auth.js + domain tables) with inferred types
- `drizzle.config.ts` — Drizzle Kit configuration pointing to `DATABASE_URL_UNPOOLED`

**Files to Modify:**
- `package.json` — Add `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit` (dev)

**Existing Code to Reference:** None

**Dependencies:** Task 1.1.A

**Spec Reference:** Data Model, Migration Workflow (TECHNICAL_SPEC.md)

---

#### Task 1.2.B: Auth.js v5 Authentication Flow

**Description:**
Implement OAuth authentication with Google and GitHub using Auth.js v5. Use the split-config pattern: `src/auth.config.ts` (Edge-safe, providers only) and `src/auth.ts` (full config with DrizzleAdapter). Create the catch-all route at `src/app/api/auth/[...nextauth]/route.ts`. Create login page that uses server-action `signIn()` from `src/auth.ts` (not `next-auth/react`). Create middleware that imports from `src/auth.config.ts` for Edge compatibility. Use JWT session strategy. Create shared auth helpers (`requireAuth()`, `requireDocumentOwner()`) in `src/lib/auth/authorize.ts`.

**Requirement:** REQ-004, REQ-005, REQ-006

**Acceptance Criteria:**
- [x] (CODE) Auth.js Edge-safe config with Google and GitHub providers
  - Verify: `grep -q 'Google\|GitHub' src/auth.config.ts`
- [x] (CODE) Full Auth.js config with DrizzleAdapter and JWT session strategy
  - Verify: `grep -q 'DrizzleAdapter' src/auth.ts && grep -q 'jwt' src/auth.ts`
- [x] (CODE) Catch-all Auth.js route handler
  - Verify: `test -f src/app/api/auth/\\[...nextauth\\]/route.ts`
- [x] (CODE) Login page with Google and GitHub OAuth buttons using server-action signIn()
  - Verify: `grep -q 'signIn' src/app/login/page.tsx && grep -q 'Google\|GitHub' src/app/login/page.tsx`
- [x] (CODE) Middleware imports from auth.config.ts (Edge-safe), protects /dashboard and /editor/* routes
  - Verify: `test -f src/middleware.ts && grep -q 'auth.config\|authConfig' src/middleware.ts && grep -q 'dashboard\|editor' src/middleware.ts`
- [x] (TEST) Unauthenticated requests to protected routes are redirected to /login
  - Verify: `npx vitest run src/middleware.test.ts`
- [x] (CODE) Shared auth helpers: requireAuth() and requireDocumentOwner()
  - Verify: `grep -q 'requireAuth' src/lib/auth/authorize.ts && grep -q 'requireDocumentOwner' src/lib/auth/authorize.ts`

**Files to Create:**
- `src/auth.config.ts` — Edge-safe Auth.js config (providers only)
- `src/auth.ts` — Full Auth.js config with DrizzleAdapter
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all route
- `src/app/login/page.tsx` — Login page with OAuth buttons (server-action signIn)
- `src/middleware.ts` — Route protection (imports from auth.config.ts)
- `src/middleware.test.ts` — Middleware tests
- `src/lib/auth/authorize.ts` — Shared auth helpers (requireAuth, requireDocumentOwner)

**Files to Modify:** None

**Existing Code to Reference:**
- `src/lib/db/index.ts` — Drizzle client for DrizzleAdapter
- `src/lib/db/schema.ts` — Auth.js table schemas

**Dependencies:** Task 1.2.A

**Spec Reference:** Authentication Flow (TECHNICAL_SPEC.md)

---

### Step 1.3: Document CRUD
**Depends On:** Step 1.2

---

#### Task 1.3.A: Document Server Actions and Dashboard

**Description:**
Implement document CRUD operations as Server Actions (create, update, soft-delete). Build the dashboard page that lists user documents with create and delete actions. Each document shows title, last modified date, and word count.

**Requirement:** REQ-010, REQ-033, REQ-034

**Acceptance Criteria:**
- [x] (TEST) createDocument() returns a new document ID
  - Verify: `npx vitest run src/app/actions/documents.test.ts`
- [x] (TEST) deleteDocument() sets deleted_at (soft-delete) instead of row deletion
  - Verify: `npx vitest run src/app/actions/documents.test.ts`
- [x] (CODE) Dashboard page lists user documents with title and last modified
  - Verify: `grep -q 'documents' src/app/dashboard/page.tsx`
- [x] (CODE) Dashboard has create document button that calls createDocument()
  - Verify: `grep -q 'createDocument' src/app/dashboard/page.tsx`
- [x] (TEST) updateDocument() updates title and content
  - Verify: `npx vitest run src/app/actions/documents.test.ts`

**Files to Create:**
- `src/app/actions/documents.ts` — Server Actions: createDocument, updateDocument, deleteDocument
- `src/app/actions/documents.test.ts` — Tests for document actions
- `src/app/dashboard/page.tsx` — Dashboard page
- `src/app/dashboard/loading.tsx` — Dashboard loading state

**Files to Modify:** None

**Existing Code to Reference:**
- `src/lib/db/index.ts` — Drizzle client for DB queries
- `src/lib/db/schema.ts` — Document table and inferred types
- `src/lib/auth/authorize.ts` — requireAuth(), requireDocumentOwner()

**Dependencies:** Task 1.2.B

**Spec Reference:** Document Management, Server Actions (TECHNICAL_SPEC.md)

---

#### Task 1.3.B: Basic Document Page

**Description:**
Create the document editor page shell at `/editor/[id]`. Fetch and display document data. This is a placeholder that will be enhanced with TipTap in Phase 2. For now, use a simple textarea that reads/writes plain text, but `documents.content` is always stored as TipTap-compatible JSONB (the default `'{"type":"doc","content":[{"type":"paragraph"}]}'` from the schema). The textarea extracts/sets the text content within the JSON structure.

**Requirement:** REQ-010

**Acceptance Criteria:**
- [x] (CODE) Editor page exists at /editor/[id] with document fetching
  - Verify: `test -f src/app/editor/\[id\]/page.tsx`
- [x] (CODE) Page displays document title (editable)
  - Verify: `grep -q 'title' src/app/editor/\[id\]/page.tsx`
- [x] (CODE) Page has navigation back to dashboard
  - Verify: `grep -q 'dashboard' src/app/editor/\[id\]/page.tsx`
- [x] (CODE) Page checks document ownership (redirects if not owner)
  - Verify: `grep -q 'redirect\|notFound' src/app/editor/\[id\]/page.tsx`

**Files to Create:**
- `src/app/editor/[id]/page.tsx` — Document editor page shell
- `src/app/editor/[id]/loading.tsx` — Loading state

**Files to Modify:** None

**Existing Code to Reference:**
- `src/app/actions/documents.ts` — updateDocument for saving
- `src/lib/db/index.ts` — Drizzle client for fetching
- `src/lib/auth/authorize.ts` — requireDocumentOwner()

**Dependencies:** Task 1.3.A

**Spec Reference:** Page Structure (TECHNICAL_SPEC.md)

---

### Phase 1 Checkpoint

**Automated Checks:**
- [x] All tests pass: `npx vitest run`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`

**Regression Verification:**
- [x] N/A (greenfield — no existing functionality)

---

## Phase 2: Editor

**Goal:** Replace the placeholder editor with TipTap, add auto-save, and implement session tracking — a fully functional writing experience.
**Depends On:** Phase 1

### Pre-Phase Setup
Human must complete before starting:
- [ ] No additional setup required (Neon + Auth.js already configured in Phase 1)
  - Verify: `grep -q "DATABASE_URL" .env.local`

### Step 2.1: TipTap Editor
**Depends On:** None (within Phase 2)

---

#### Task 2.1.A: TipTap Editor Component

**Description:**
Integrate TipTap v2 with all required formatting extensions. Create a rich text editor component that replaces the Phase 1 placeholder. The editor uses `'use client'` and `immediatelyRender: false` to prevent SSR hydration issues. Include toolbar with formatting buttons.

**Requirement:** REQ-002, REQ-007, REQ-008, REQ-009

**Acceptance Criteria:**
- [x] (CODE) TipTap editor component with StarterKit and all required extensions
  - Verify: `grep -q 'StarterKit' src/components/editor/Editor.tsx`
- [x] (CODE) Editor uses 'use client' directive and immediatelyRender: false
  - Verify: `grep -q "'use client'" src/components/editor/Editor.tsx && grep -q 'immediatelyRender.*false' src/components/editor/Editor.tsx`
- [x] (CODE) Formatting toolbar with heading, bold, italic, link, image, code, quote, list buttons
  - Verify: `grep -q 'Toolbar\|toolbar' src/components/editor/Toolbar.tsx`
- [x] (TEST) Editor renders without hydration errors in test environment
  - Verify: `npx vitest run src/components/editor/Editor.test.tsx`
- [x] (CODE) Editor page at /editor/[id] uses TipTap component — desktop-only layout, no mobile responsive editor (REQ-002)
  - Verify: `grep -q 'Editor' src/app/editor/\[id\]/page.tsx`

**Files to Create:**
- `src/components/editor/Editor.tsx` — TipTap editor component
- `src/components/editor/Toolbar.tsx` — Formatting toolbar
- `src/components/editor/Editor.test.tsx` — Editor component tests

**Files to Modify:**
- `src/app/editor/[id]/page.tsx` — Replace placeholder with TipTap editor
- `package.json` — Add @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-*

**Existing Code to Reference:**
- `src/app/editor/[id]/page.tsx` — Existing page shell from Phase 1

**Dependencies:** Phase 1 complete

**Spec Reference:** Editor Architecture, TipTap Configuration (TECHNICAL_SPEC.md)

---

### Step 2.2: Auto-Save and Sessions
**Depends On:** Step 2.1

---

#### Task 2.2.A: Auto-Save with Debounce

**Description:**
Implement auto-save that triggers on TipTap's `onUpdate` callback with a 2-second debounce. Show a subtle "Saved" / "Saving..." indicator. Handle save failures with retry and error display.

**Requirement:** REQ-011

**Acceptance Criteria:**
- [x] (TEST) Auto-save debounces at 2 seconds and calls updateDocument
  - Verify: `npx vitest run src/hooks/useAutoSave.test.ts`
- [x] (CODE) Save status indicator shows Saving/Saved/Error states
  - Verify: `grep -q 'Saved\|Saving\|Error' src/components/editor/SaveIndicator.tsx`
- [x] (TEST) Failed saves retry with exponential backoff (up to 3 retries)
  - Verify: `npx vitest run src/hooks/useAutoSave.test.ts`
- [x] (CODE) Auto-save sends full TipTap JSON content to updateDocument
  - Verify: `grep -q 'getJSON\|content' src/hooks/useAutoSave.ts`

**Files to Create:**
- `src/hooks/useAutoSave.ts` — Auto-save hook with debounce
- `src/hooks/useAutoSave.test.ts` — Auto-save tests
- `src/components/editor/SaveIndicator.tsx` — Save status UI

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Wire up auto-save hook

**Existing Code to Reference:**
- `src/app/actions/documents.ts` — updateDocument Server Action

**Dependencies:** Task 2.1.A

**Spec Reference:** Auto-Save Flow (TECHNICAL_SPEC.md)

---

#### Task 2.2.B: Session Tracking

**Description:**
Implement writing session tracking with start/end/heartbeat lifecycle using the `writing_sessions` table (named to avoid collision with Auth.js `session` table). Create Server Actions for session management. The editor starts a session on mount, sends heartbeats every 30 seconds while active, and ends the session on unmount/navigation.

**Requirement:** REQ-019

**Acceptance Criteria:**
- [x] (TEST) startSession() creates a writing_sessions record
  - Verify: `npx vitest run src/app/actions/sessions.test.ts`
- [x] (TEST) heartbeat() updates last_heartbeat and increments active_seconds
  - Verify: `npx vitest run src/app/actions/sessions.test.ts`
- [x] (TEST) endSession() sets ended_at timestamp
  - Verify: `npx vitest run src/app/actions/sessions.test.ts`
- [x] (CODE) useSession hook starts session on mount, heartbeats every 30s, ends on unmount
  - Verify: `grep -q 'setInterval\|heartbeat' src/hooks/useSession.ts`
- [x] (CODE) Activity detection based on recent input within 60 seconds
  - Verify: `grep -q 'lastActivity\|active' src/hooks/useSession.ts`

**Files to Create:**
- `src/app/actions/sessions.ts` — Server Actions: startSession, endSession, heartbeat (using `writing_sessions` table)
- `src/app/actions/sessions.test.ts` — Session action tests
- `src/hooks/useSession.ts` — Client-side session management hook
- `src/hooks/useSession.test.ts` — Session hook tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Wire up session hook

**Existing Code to Reference:**
- `src/lib/db/index.ts` — Drizzle client
- `src/lib/db/schema.ts` — `writing_sessions` table and inferred types

**Dependencies:** Task 2.1.A

**Spec Reference:** Session Tracking (TECHNICAL_SPEC.md)

---

### Phase 2 Checkpoint

**Automated Checks:**
- [x] All tests pass: `npx vitest run`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`

**Regression Verification:**
- [x] Auth flow still works (login, protected routes)
- [x] Document CRUD still works (create, list, delete from dashboard)

---

## Phase 3: AI Assistant

**Goal:** Integrate AI providers (Claude + OpenAI) with streaming, implement all three interaction modes (inline, side panel, freeform), and log interactions to the database.
**Depends On:** Phase 2

### Pre-Phase Setup
Human must complete before starting:
- [ ] Set ANTHROPIC_API_KEY in `.env.local`
  - Verify: `grep -q "ANTHROPIC_API_KEY" .env.local`
- [ ] Set OPENAI_API_KEY in `.env.local`
  - Verify: `grep -q "OPENAI_API_KEY" .env.local`

### Step 3.1: AI Provider Layer
**Depends On:** None (within Phase 3)

---

#### Task 3.1.A: AI Provider Abstraction and Streaming Endpoint

**Description:**
Create the AI provider abstraction layer with unified interfaces for Claude and OpenAI. Build the `/api/ai/complete` Route Handler that streams AI responses using Vercel AI SDK's `streamText()` and `toDataStreamResponse()`. Handle blocked/refused requests as custom events.

**Requirement:** REQ-012

**Acceptance Criteria:**
- [x] (CODE) AIProvider and AICompletionRequest interfaces defined
  - Verify: `grep -q 'AIProvider' src/lib/ai/types.ts`
- [x] (CODE) Provider config with models for both Anthropic and OpenAI
  - Verify: `grep -q 'anthropic' src/lib/ai/providers.ts && grep -q 'openai' src/lib/ai/providers.ts`
- [x] (TEST) Route handler validates auth, provider, and required fields
  - Verify: `npx vitest run src/app/api/ai/complete/route.test.ts`
- [x] (CODE) Route handler uses Vercel AI SDK `streamText()` with `toUIMessageStreamResponse()` (AI SDK 6 pattern)
  - Verify: `grep -q 'streamText\|toUIMessageStreamResponse' src/app/api/ai/complete/route.ts`
- [x] (TEST) Blocked/refused requests return custom metadata event via AI SDK 6 response API
  - Verify: `npx vitest run src/app/api/ai/complete/route.test.ts`
- [x] (CODE) Rate limiting at 20 requests/minute per user (database-backed, not in-memory — serverless-safe)
  - Verify: `grep -q 'rate\|limit' src/app/api/ai/complete/route.ts`

**Files to Create:**
- `src/lib/ai/types.ts` — AI interfaces
- `src/lib/ai/providers.ts` — Provider configuration using `@ai-sdk/anthropic` and `@ai-sdk/openai` provider packages
- `src/lib/ai/system-prompts.ts` — Mode-specific system prompts (inline, side_panel, freeform)
- `src/app/api/ai/complete/route.ts` — AI streaming Route Handler
- `src/app/api/ai/complete/route.test.ts` — Route handler tests

**Files to Modify:**
- `package.json` — Add `ai` (Vercel AI SDK 6), `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`

**Existing Code to Reference:**
- `src/lib/auth/authorize.ts` — requireAuth() for auth validation
- `src/auth.ts` — auth() session getter

**Dependencies:** Phase 2 complete

**Spec Reference:** AI Provider Abstraction, Streaming Architecture (TECHNICAL_SPEC.md)

---

### Step 3.2: AI Interaction UI
**Depends On:** Step 3.1

---

#### Task 3.2.A: Inline AI Mode

**Description:**
Implement the inline AI interaction mode. When the user selects text, show a floating toolbar with AI options. The user types a prompt (or selects a preset), the AI response streams in as a suggestion, and the user can accept, modify, or reject it.

**Requirement:** REQ-013, REQ-014, REQ-015

**Acceptance Criteria:**
- [x] (CODE) Floating AI toolbar appears on text selection with preset options
  - Verify: `grep -q 'selection\|floating' src/components/editor/InlineAI.tsx`
- [x] (CODE) AI response streams into a diff-style preview below the selection using `@ai-sdk/react` hooks
  - Verify: `grep -q 'useChat\|useCompletion\|@ai-sdk/react' src/components/editor/InlineAI.tsx`
- [x] (CODE) Accept button replaces selected text with AI response
  - Verify: `grep -q 'accept\|replaceRange\|insertContent' src/components/editor/InlineAI.tsx`
- [x] (CODE) Reject button dismisses the suggestion
  - Verify: `grep -q 'reject\|dismiss' src/components/editor/InlineAI.tsx`
- [x] (TEST) Accept inserts AI text and logs interaction
  - Verify: `npx vitest run src/components/editor/InlineAI.test.tsx`

**Files to Create:**
- `src/components/editor/InlineAI.tsx` — Inline AI floating toolbar and suggestion preview
- `src/components/editor/InlineAI.test.tsx` — Inline AI tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Add InlineAI component

**Existing Code to Reference:**
- `src/lib/ai/types.ts` — AICompletionRequest interface
- `src/app/api/ai/complete/route.ts` — Streaming endpoint

**Dependencies:** Task 3.1.A

**Spec Reference:** AI Interaction UI — Inline Mode (TECHNICAL_SPEC.md)

---

#### Task 3.2.B: Side Panel AI Mode

**Description:**
Implement the side panel chat interface for research, brainstorming, and freeform AI conversations. The panel slides out on the right side of the editor, shows a chat-style conversation, and gives the AI full document context.

**Requirement:** REQ-013

**Acceptance Criteria:**
- [x] (CODE) Side panel component with toggle button
  - Verify: `grep -q 'panel\|sidebar' src/components/editor/SidePanel.tsx`
- [x] (CODE) Chat-style message list with user/AI message bubbles
  - Verify: `grep -q 'message\|chat' src/components/editor/SidePanel.tsx`
- [x] (CODE) Message input with send button, streams AI response via `@ai-sdk/react` hooks
  - Verify: `grep -q 'useChat\|@ai-sdk/react' src/components/editor/SidePanel.tsx`
- [x] (TEST) Messages are persisted as ai_interactions with mode 'side_panel'
  - Verify: `npx vitest run src/components/editor/SidePanel.test.tsx`
- [x] (CODE) Full document content sent as context with each request
  - Verify: `grep -q 'context\|content' src/components/editor/SidePanel.tsx`

**Files to Create:**
- `src/components/editor/SidePanel.tsx` — Side panel chat interface
- `src/components/editor/SidePanel.test.tsx` — Side panel tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Add side panel toggle and component

**Existing Code to Reference:**
- `src/components/editor/InlineAI.tsx` — AI interaction patterns
- `src/lib/ai/system-prompts.ts` — Side panel system prompt

**Dependencies:** Task 3.1.A

**Spec Reference:** AI Interaction UI — Side Panel Mode (TECHNICAL_SPEC.md)

---

#### Task 3.2.C: Freeform AI Mode and AI Interaction Logging

**Description:**
Implement the freeform AI mode (command palette-style input) and the AI interaction logging Server Action. All three modes use logAIInteraction() to persist interactions with full context (prompt, response, action, diff, mode, provider, model).

**Requirement:** REQ-013, REQ-017

**Acceptance Criteria:**
- [x] (CODE) Freeform command palette triggered by keyboard shortcut or button
  - Verify: `grep -q 'freeform\|command\|palette' src/components/editor/FreeformAI.tsx`
- [x] (TEST) logAIInteraction() writes full interaction record to ai_interactions table
  - Verify: `npx vitest run src/app/actions/ai-interactions.test.ts`
- [x] (TEST) Interaction logging is append-only (no update/delete supported)
  - Verify: `npx vitest run src/app/actions/ai-interactions.test.ts`
- [x] (CODE) All three modes (inline, side panel, freeform) call logAIInteraction on completion
  - Verify: `grep -q 'logAIInteraction' src/components/editor/InlineAI.tsx`

**Files to Create:**
- `src/components/editor/FreeformAI.tsx` — Freeform command palette
- `src/app/actions/ai-interactions.ts` — logAIInteraction Server Action
- `src/app/actions/ai-interactions.test.ts` — Interaction logging tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Add freeform AI trigger
- `src/components/editor/InlineAI.tsx` — Wire up logAIInteraction
- `src/components/editor/SidePanel.tsx` — Wire up logAIInteraction

**Existing Code to Reference:**
- `src/lib/db/schema.ts` — `ai_interactions` table and inferred types
- `src/app/actions/documents.ts` — Server Action patterns

**Dependencies:** Task 3.2.A, Task 3.2.B

**Spec Reference:** AI Interaction Logging, Server Actions (TECHNICAL_SPEC.md)

---

### Step 3.3: AI Provider Settings
**Depends On:** Step 3.1

---

#### Task 3.3.A: User AI Provider Preference

**Description:**
Allow users to choose their AI provider (Anthropic or OpenAI) and preferred model. Store the preference in the Auth.js `user` table (`ai_provider` and `ai_model` columns). The AI completion endpoint reads the user's preference to route requests to the correct provider.

**Requirement:** REQ-012

**Acceptance Criteria:**
- [x] (CODE) Settings UI for selecting AI provider and model
  - Verify: `grep -q 'provider\|model' src/components/settings/AISettings.tsx`
- [x] (TEST) updateUserPreferences() persists ai_provider and ai_model to users table
  - Verify: `npx vitest run src/app/actions/user.test.ts`
- [x] (CODE) AI completion endpoint reads user's provider preference
  - Verify: `grep -q 'ai_provider\|aiProvider' src/app/api/ai/complete/route.ts`
- [x] (CODE) Settings accessible from editor or dashboard
  - Verify: `grep -q 'settings\|Settings' src/app/dashboard/page.tsx`

**Files to Create:**
- `src/components/settings/AISettings.tsx` — Provider selection UI
- `src/app/actions/user.ts` — updateUserPreferences Server Action
- `src/app/actions/user.test.ts` — User action tests

**Files to Modify:**
- `src/app/api/ai/complete/route.ts` — Read user preference
- `src/app/dashboard/page.tsx` — Add settings link/button

**Existing Code to Reference:**
- `src/lib/ai/providers.ts` — Provider configuration
- `src/lib/db/schema.ts` — `users` table with `ai_provider`, `ai_model` columns

**Dependencies:** Task 3.1.A

**Spec Reference:** Provider Configuration, AI Provider Abstraction (TECHNICAL_SPEC.md)

---

### Phase 3 Checkpoint

**Automated Checks:**
- [x] All tests pass: `npx vitest run`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`

**Regression Verification:**
- [x] Editor auto-save still works
- [x] Session tracking still works
- [x] Document CRUD from dashboard still works

---

## Phase 4: Audit Trail

**Goal:** Implement content origin tracking, paste detection, revision snapshots, and AI percentage calculation — the core audit trail infrastructure.
**Depends On:** Phase 3

### Pre-Phase Setup
Human must complete before starting:
- [ ] No additional setup required
  - Verify: `npx vitest run --reporter=verbose 2>&1 | tail -1`

### Step 4.1: Origin Tracking
**Depends On:** None (within Phase 4)

---

#### Task 4.1.A: Origin Mark TipTap Extension

**Description:**
Create the custom TipTap `origin` mark that tracks content provenance. The mark stores type ('human' | 'ai' | 'external_paste'), sourceId (link to ai_interaction or paste_event), and originalLength for modification detection. Unmarked text defaults to 'human'. The mark is invisible (no visual rendering).

**Requirement:** REQ-020, REQ-014

**Acceptance Criteria:**
- [ ] (CODE) Custom TipTap Mark with type, sourceId, and originalLength attributes
  - Verify: `grep -q "name: 'origin'" src/extensions/origin-mark.ts`
- [ ] (TEST) Mark persists through editor JSON serialization/deserialization
  - Verify: `npx vitest run src/extensions/origin-mark.test.ts`
- [ ] (TEST) AI text insertion applies origin mark with type='ai' and sourceId
  - Verify: `npx vitest run src/extensions/origin-mark.test.ts`
- [ ] (TEST) Unmarked text is treated as human (conservative fallback)
  - Verify: `npx vitest run src/extensions/origin-mark.test.ts`
- [ ] (CODE) Mark is invisible — no visual rendering in the editor
  - Verify: `grep -q 'data-origin' src/extensions/origin-mark.ts`

**Files to Create:**
- `src/extensions/origin-mark.ts` — Custom TipTap origin mark
- `src/extensions/origin-mark.test.ts` — Origin mark tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Add OriginMark to extensions
- `src/components/editor/InlineAI.tsx` — Apply origin mark on AI text accept

**Existing Code to Reference:**
- `src/components/editor/Editor.tsx` — TipTap extension registration

**Dependencies:** Phase 3 complete

**Spec Reference:** Content Origin Tracking (TECHNICAL_SPEC.md)

---

#### Task 4.1.B: Paste Detection and Logging

**Description:**
Create a custom TipTap extension that intercepts paste events, classifies them as external or AI-internal (by matching against recent AI responses), applies the appropriate origin mark, and logs external paste events to the database.

**Requirement:** REQ-018

**Acceptance Criteria:**
- [ ] (CODE) Custom TipTap extension intercepts paste events
  - Verify: `grep -q 'handlePaste\|clipboardTextParser' src/extensions/paste-handler.ts`
- [ ] (TEST) External paste is classified and logged with content and character count
  - Verify: `npx vitest run src/extensions/paste-handler.test.ts`
- [ ] (TEST) Paste from AI panel is classified as ai_internal (not logged as external)
  - Verify: `npx vitest run src/extensions/paste-handler.test.ts`
- [ ] (CODE) Origin mark applied to pasted content with type='external_paste'
  - Verify: `grep -q 'external_paste' src/extensions/paste-handler.ts`
- [ ] (TEST) logPasteEvent() writes to paste_events table
  - Verify: `npx vitest run src/app/actions/paste-events.test.ts`

**Files to Create:**
- `src/extensions/paste-handler.ts` — Custom TipTap paste handler
- `src/extensions/paste-handler.test.ts` — Paste handler tests
- `src/app/actions/paste-events.ts` — logPasteEvent Server Action
- `src/app/actions/paste-events.test.ts` — Paste event action tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Add PasteHandler to extensions

**Existing Code to Reference:**
- `src/extensions/origin-mark.ts` — Mark application pattern
- `src/app/actions/ai-interactions.ts` — Append-only Server Action pattern

**Dependencies:** Task 4.1.A

**Spec Reference:** Paste Detection (TECHNICAL_SPEC.md)

---

### Step 4.2: Revisions and Metrics
**Depends On:** Step 4.1

---

#### Task 4.2.A: Revision Snapshots

**Description:**
Implement revision snapshot creation at 30-second intervals during active editing and immediately after AI interactions that change the document. Server Action extracts plain text from TipTap JSON for diffing. Revisions are append-only.

**Requirement:** REQ-016

**Acceptance Criteria:**
- [ ] (TEST) createRevision() snapshots current content with plain text extraction
  - Verify: `npx vitest run src/app/actions/revisions.test.ts`
- [ ] (CODE) Interval-based revision creation every 30 seconds of active editing
  - Verify: `grep -q '30\|interval' src/hooks/useRevisions.ts`
- [ ] (CODE) Event-based revision created after AI interaction changes document
  - Verify: `grep -q 'ai_interaction' src/hooks/useRevisions.ts`
- [ ] (TEST) Plain text extraction from TipTap JSON works correctly
  - Verify: `npx vitest run src/lib/tiptap-utils.test.ts`

**Files to Create:**
- `src/app/actions/revisions.ts` — createRevision Server Action
- `src/app/actions/revisions.test.ts` — Revision action tests
- `src/hooks/useRevisions.ts` — Client-side revision timing hook
- `src/lib/tiptap-utils.ts` — TipTap JSON utilities (plain text extraction, walkTextNodes)
- `src/lib/tiptap-utils.test.ts` — TipTap utility tests

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Wire up revision hook

**Existing Code to Reference:**
- `src/hooks/useSession.ts` — Interval-based hook pattern
- `src/app/actions/documents.ts` — Server Action pattern

**Dependencies:** Task 4.1.A

**Spec Reference:** Revision Snapshot Flow (TECHNICAL_SPEC.md)

---

#### Task 4.2.B: AI Percentage Calculation and Modification Detection

**Description:**
Implement the `calculateMetrics()` function that walks TipTap JSON to compute AI-generated, human-typed, and external paste percentages. Implement the 20% modification threshold: if an AI-marked span has been modified by more than 20% of its originalLength, reclassify it as human.

**Requirement:** REQ-020

**Acceptance Criteria:**
- [ ] (TEST) calculateMetrics() correctly counts AI, human, and external paste characters
  - Verify: `npx vitest run src/lib/metrics.test.ts`
- [ ] (TEST) Unmarked text is counted as human (conservative default)
  - Verify: `npx vitest run src/lib/metrics.test.ts`
- [ ] (TEST) AI span modified >20% is reclassified as human
  - Verify: `npx vitest run src/lib/metrics.test.ts`
- [ ] (TEST) Empty document returns 0% for all metrics
  - Verify: `npx vitest run src/lib/metrics.test.ts`
- [ ] (TEST) External paste characters reported as separate metric
  - Verify: `npx vitest run src/lib/metrics.test.ts`

**Files to Create:**
- `src/lib/metrics.ts` — calculateMetrics(), walkTextNodes(), modification detection
- `src/lib/metrics.test.ts` — Metrics calculation tests

**Files to Modify:** None

**Existing Code to Reference:**
- `src/lib/tiptap-utils.ts` — TipTap JSON walking utilities
- `src/extensions/origin-mark.ts` — Mark attribute structure

**Dependencies:** Task 4.1.A

**Spec Reference:** Percentage Calculation, Modification Detection (TECHNICAL_SPEC.md)

---

### Phase 4 Checkpoint

**Automated Checks:**
- [ ] All tests pass: `npx vitest run`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`

**Regression Verification:**
- [ ] AI interactions still work (inline, side panel, freeform)
- [ ] Auto-save still works with origin marks in document JSON
- [ ] Session tracking still works

---

## Phase 5: Badge & Verification

**Goal:** Badge generation with frozen snapshots, pre-publish preview, public verification pages, and embed snippets — the complete badge lifecycle.
**Depends On:** Phase 4

### Pre-Phase Setup
Human must complete before starting:
- [ ] No additional setup required — badge images are generated on demand via @vercel/og (no storage bucket needed)
  - Verify: `npx vitest run --reporter=verbose 2>&1 | tail -1`

### Step 5.1: Badge Generation
**Depends On:** None (within Phase 5)

---

#### Task 5.1.A: Badge Generation Server Action

**Description:**
Implement the `generateBadge()` Server Action that freezes the document text, audit trail (AI interactions, paste events, writing sessions, revisions), and computed statistics into an immutable badge record. Generate a unique verification_id using nanoid(21). Badge PNG is generated on demand by the Route Handler (Task 5.2.C) using @vercel/og — no storage bucket needed.

**Requirement:** REQ-021, REQ-022, REQ-023, REQ-026, REQ-039, REQ-043, REQ-055

**Acceptance Criteria:**
- [ ] (TEST) generateBadge() creates badge record with frozen document text and audit trail
  - Verify: `npx vitest run src/app/actions/badges.test.ts`
- [ ] (TEST) verification_id uses nanoid(21) — 21 characters, unguessable
  - Verify: `npx vitest run src/app/actions/badges.test.ts`
- [ ] (TEST) Stats include ai_percentage, external_paste_percentage, interaction_count, session_count, total_active_seconds
  - Verify: `npx vitest run src/app/actions/badges.test.ts`
- [ ] (CODE) Badge PNG generated via @vercel/og with Provenance branding and percentage
  - Verify: `grep -q 'ImageResponse\|vercel/og' src/lib/badge-image.ts`
- [ ] (TEST) Badge is insert-only — no update or delete permitted
  - Verify: `npx vitest run src/app/actions/badges.test.ts`
- [ ] (TEST) Only document owner can generate badges — non-owners get authorization error (REQ-043)
  - Verify: `npx vitest run src/app/actions/badges.test.ts`
- [ ] (CODE) Returns verificationId, badgeHtml, and badgeMarkdown snippets
  - Verify: `grep -q 'badgeHtml\|badgeMarkdown' src/app/actions/badges.ts`

**Files to Create:**
- `src/app/actions/badges.ts` — generateBadge Server Action
- `src/app/actions/badges.test.ts` — Badge generation tests
- `src/lib/badge-image.ts` — Badge PNG template using @vercel/og
- `src/lib/badge-snippets.ts` — HTML and Markdown embed snippet generation

**Files to Modify:**
- `package.json` — Add @vercel/og, nanoid

**Existing Code to Reference:**
- `src/lib/metrics.ts` — calculateMetrics()
- `src/app/actions/documents.ts` — Server Action pattern

**Dependencies:** Phase 4 complete

**Spec Reference:** Badge Generation Flow, Badge Image Template, Embed Snippets (TECHNICAL_SPEC.md)

---

### Step 5.2: Preview and Verification
**Depends On:** Step 5.1

---

#### Task 5.2.A: Pre-Publish Preview Page

**Description:**
Create the `/editor/[id]/preview` page that shows writers exactly what will become public before badge generation. Display the full document text, all AI prompts/responses, paste events, and a prominent privacy warning. The writer must click "Confirm & Generate" to create the badge.

**Requirement:** REQ-049

**Acceptance Criteria:**
- [ ] (CODE) Preview page at /editor/[id]/preview showing all public data
  - Verify: `test -f src/app/editor/\[id\]/preview/page.tsx`
- [ ] (CODE) Prominent warning: "Everything shown here will be publicly visible"
  - Verify: `grep -q 'publicly visible' src/app/editor/\[id\]/preview/page.tsx`
- [ ] (CODE) Shows all AI interactions with prompts and responses
  - Verify: `grep -q 'interaction\|prompt\|response' src/app/editor/\[id\]/preview/page.tsx`
- [ ] (CODE) Confirm & Generate button calls generateBadge() and shows embed snippets
  - Verify: `grep -q 'generateBadge\|Confirm' src/app/editor/\[id\]/preview/page.tsx`
- [ ] (CODE) Only accessible by document owner (auth check)
  - Verify: `grep -q 'redirect\|auth' src/app/editor/\[id\]/preview/page.tsx`

**Files to Create:**
- `src/app/editor/[id]/preview/page.tsx` — Pre-publish preview page

**Files to Modify:**
- `src/components/editor/Editor.tsx` — Add "Generate Badge" button linking to preview

**Existing Code to Reference:**
- `src/app/actions/badges.ts` — generateBadge()
- `src/lib/badge-snippets.ts` — Embed snippet generation

**Dependencies:** Task 5.1.A

**Spec Reference:** Pre-publish Preview (TECHNICAL_SPEC.md)

---

#### Task 5.2.B: Public Verification Page

**Description:**
Build the SSR verification page at `/verify/[id]` that displays badge data publicly. The page shows summary stats (AI percentage prominently), scope statement, methodology note, full document text, and an expandable audit timeline. Must be fully responsive and mobile-first. Handle taken-down badges with a minimal notice page.

**Requirement:** REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-036, REQ-037, REQ-038, REQ-042, REQ-047, REQ-048, REQ-050, REQ-051

**Acceptance Criteria:**
- [ ] (CODE) SSR page at /verify/[id] with no auth required
  - Verify: `test -f src/app/verify/\[id\]/page.tsx && grep -q 'export default' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Summary stats: AI percentage (prominent), interactions, sessions, total time
  - Verify: `grep -q 'ai_percentage\|aiPercentage' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Expandable audit timeline with AI interactions showing prompt/response
  - Verify: `grep -q 'timeline\|Timeline' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Scope statement and methodology note displayed
  - Verify: `grep -q 'certif\|methodolog' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Taken-down badges show removal notice instead of content
  - Verify: `grep -q 'taken.down\|takedown\|removed' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Full document text displayed with expandable sections for long documents
  - Verify: `grep -q 'documentText\|document_text' src/app/verify/\[id\]/page.tsx`

**Files to Create:**
- `src/app/verify/[id]/page.tsx` — Public verification page (SSR)
- `src/components/verify/StatsSummary.tsx` — Summary statistics card
- `src/components/verify/AuditTimeline.tsx` — Expandable audit timeline
- `src/components/verify/ScopeStatement.tsx` — Scope and methodology text
- `src/components/verify/DocumentText.tsx` — Document text display

**Files to Modify:** None

**Existing Code to Reference:**
- `src/lib/db/index.ts` — Drizzle client for data fetching
- `src/lib/db/schema.ts` — Badge table and inferred types

**Dependencies:** Task 5.1.A

**Spec Reference:** Verification Page, Page Structure (TECHNICAL_SPEC.md)

---

#### Task 5.2.C: Badge Image Endpoint and Embed Snippets

**Description:**
Create the `/api/badges/[verificationId]/image` Route Handler that serves badge PNGs with edge caching (24h TTL). Implement the embed snippet display in the editor after badge generation. Handle 410 Gone for taken-down badges.

**Requirement:** REQ-022, REQ-024, REQ-025, REQ-050

**Acceptance Criteria:**
- [ ] (CODE) Badge image Route Handler at /api/badges/[verificationId]/image
  - Verify: `test -f src/app/api/badges/\[verificationId\]/image/route.ts`
- [ ] (CODE) Cache-Control header: public, s-maxage=86400, stale-while-revalidate=86400
  - Verify: `grep -q 's-maxage=86400' src/app/api/badges/\[verificationId\]/image/route.ts`
- [ ] (CODE) Returns 410 Gone for taken-down badges
  - Verify: `grep -q '410' src/app/api/badges/\[verificationId\]/image/route.ts`
- [ ] (TEST) HTML snippet includes correct alt text with percentage and URL
  - Verify: `npx vitest run src/lib/badge-snippets.test.ts`
- [ ] (CODE) Embed snippet UI shown after badge generation with copy buttons
  - Verify: `grep -q 'copy\|clipboard' src/components/editor/BadgeSnippets.tsx`

**Files to Create:**
- `src/app/api/badges/[verificationId]/image/route.ts` — Badge image endpoint
- `src/components/editor/BadgeSnippets.tsx` — Embed snippet display with copy
- `src/lib/badge-snippets.test.ts` — Snippet generation tests

**Files to Modify:** None

**Existing Code to Reference:**
- `src/lib/badge-image.ts` — Badge PNG generation
- `src/lib/badge-snippets.ts` — Snippet templates

**Dependencies:** Task 5.1.A

**Spec Reference:** Badge Image, Embed Snippets, API Contracts (TECHNICAL_SPEC.md)

---

### Step 5.3: Badge Management
**Depends On:** Step 5.2

---

#### Task 5.3.A: Badge List on Dashboard and Document Page

**Description:**
Display badges on the dashboard (badge count per document) and on the document editor page (list of generated badges with verification links and copy snippet buttons). Allow generating new badges from the editor.

**Requirement:** REQ-035

**Acceptance Criteria:**
- [ ] (CODE) Dashboard shows badge count next to each document
  - Verify: `grep -q 'badge\|Badge' src/app/dashboard/page.tsx`
- [ ] (CODE) Editor page shows list of badges with verification URLs
  - Verify: `grep -q 'badge\|Badge' src/components/editor/BadgeList.tsx`
- [ ] (CODE) Each badge entry has copy buttons for HTML and Markdown snippets
  - Verify: `grep -q 'copy\|snippet' src/components/editor/BadgeList.tsx`
- [ ] (TEST) Badge list fetches badges for the current document
  - Verify: `npx vitest run src/components/editor/BadgeList.test.tsx`

**Files to Create:**
- `src/components/editor/BadgeList.tsx` — Badge list component
- `src/components/editor/BadgeList.test.tsx` — Badge list tests

**Files to Modify:**
- `src/app/dashboard/page.tsx` — Add badge count per document
- `src/components/editor/Editor.tsx` — Add BadgeList component

**Existing Code to Reference:**
- `src/app/actions/badges.ts` — Badge data access
- `src/lib/badge-snippets.ts` — Snippet generation

**Dependencies:** Task 5.2.C

**Spec Reference:** Document Management (TECHNICAL_SPEC.md)

---

### Phase 5 Checkpoint

**Automated Checks:**
- [ ] All tests pass: `npx vitest run`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`

**Regression Verification:**
- [ ] Editor still works with all AI modes
- [ ] Origin tracking still applies marks correctly
- [ ] Auto-save still works with origin marks
- [ ] Session tracking still works

---

## Phase 6: Polish

**Goal:** Mobile optimization for verification pages, edge caching, error handling improvements, and a landing page — production readiness for beta launch.
**Depends On:** Phase 5

### Pre-Phase Setup
Human must complete before starting:
- [ ] Configure production domain in Vercel (optional for beta)
  - Verify: `test -n "$NEXT_PUBLIC_APP_URL"`

### Step 6.1: Verification Page Polish
**Depends On:** None (within Phase 6)

---

#### Task 6.1.A: Mobile Optimization for Verification Pages

**Description:**
Ensure verification pages are fully responsive and optimized for mobile. The verification page is the critical trust moment — readers click a badge link from their phone. Test and fix all breakpoints, ensure the audit timeline is usable on small screens, and optimize for 4G load times.

**Requirement:** REQ-003, REQ-031, REQ-051

**Acceptance Criteria:**
- [ ] (CODE) Mobile-first responsive design with Tailwind breakpoints
  - Verify: `grep -q 'sm:\|md:\|lg:' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Audit timeline entries are readable and expandable on mobile
  - Verify: `grep -q 'sm:\|md:' src/components/verify/AuditTimeline.tsx`
- [ ] (CODE) Stats summary card adapts to mobile layout
  - Verify: `grep -q 'sm:\|md:' src/components/verify/StatsSummary.tsx`
- [ ] (CODE) Long document text has expand/collapse with sensible mobile default
  - Verify: `grep -q 'expand\|collapse\|truncat' src/components/verify/DocumentText.tsx`

**Files to Create:** None

**Files to Modify:**
- `src/app/verify/[id]/page.tsx` — Mobile responsive refinements
- `src/components/verify/StatsSummary.tsx` — Mobile layout
- `src/components/verify/AuditTimeline.tsx` — Mobile layout
- `src/components/verify/DocumentText.tsx` — Mobile expand/collapse

**Existing Code to Reference:**
- `src/app/verify/[id]/page.tsx` — Existing verification page

**Dependencies:** Phase 5 complete

**Spec Reference:** Platform — REQ-003, REQ-031 (PRODUCT_SPEC.md)

---

#### Task 6.1.B: Edge Caching for Verification Pages

**Description:**
Configure edge caching for verification pages and badge images. Verification page data is immutable once created, so pages can be cached aggressively. Implement on-demand revalidation for taken-down badges.

**Requirement:** REQ-051

**Acceptance Criteria:**
- [ ] (CODE) Verification page uses Next.js caching with revalidation
  - Verify: `grep -q 'revalidate\|cache' src/app/verify/\[id\]/page.tsx`
- [ ] (CODE) Badge image endpoint has Cache-Control headers (24h TTL)
  - Verify: `grep -q 's-maxage' src/app/api/badges/\[verificationId\]/image/route.ts`
- [ ] (CODE) Takedown triggers on-demand revalidation for the affected badge
  - Verify: `grep -q 'revalidate\|revalidatePath\|revalidateTag' src/app/actions/badges.ts`
- [ ] (CODE) Badge image endpoint cache headers verified (already set in Task 5.2.C)
  - Verify: `grep -q 's-maxage' src/app/api/badges/\[verificationId\]/image/route.ts`

**Files to Modify:**
- `src/app/verify/[id]/page.tsx` — Add caching configuration
- `src/app/actions/badges.ts` — Add revalidation on takedown

**Existing Code to Reference:**
- `src/app/api/badges/[verificationId]/image/route.ts` — Existing cache headers

**Dependencies:** Task 6.1.A

**Spec Reference:** Edge Caching (TECHNICAL_SPEC.md)

---

### Step 6.2: Error Handling and Landing Page
**Depends On:** Step 6.1

---

#### Task 6.2.A: Error Handling and Edge Cases

**Description:**
Add robust error handling for AI failures (provider errors, rate limits, timeouts), save failures (network issues, conflict resolution), and session recovery (reconnect after disconnect). Add global error boundary and not-found pages.

**Requirement:** REQ-052

**Acceptance Criteria:**
- [ ] (CODE) AI failure shows user-friendly error message with retry option
  - Verify: `grep -q 'error\|Error\|retry' src/components/editor/InlineAI.tsx`
- [ ] (CODE) Global error boundary at app level
  - Verify: `test -f src/app/error.tsx`
- [ ] (CODE) Custom 404 page
  - Verify: `test -f src/app/not-found.tsx`
- [ ] (CODE) Save failure indicator with retry in editor
  - Verify: `grep -q 'error\|retry\|failed' src/components/editor/SaveIndicator.tsx`
- [ ] (TEST) AI endpoint returns appropriate error codes (429, 502)
  - Verify: `npx vitest run src/app/api/ai/complete/route.test.ts`

**Files to Create:**
- `src/app/error.tsx` — Global error boundary
- `src/app/not-found.tsx` — Custom 404 page

**Files to Modify:**
- `src/components/editor/InlineAI.tsx` — AI error handling
- `src/components/editor/SaveIndicator.tsx` — Save error states
- `src/app/api/ai/complete/route.ts` — Error response improvements

**Existing Code to Reference:**
- `src/hooks/useAutoSave.ts` — Existing retry logic

**Dependencies:** Phase 5 complete

**Spec Reference:** Security Considerations — Rate Limiting (TECHNICAL_SPEC.md)

---

#### Task 6.2.B: Landing Page

**Description:**
Create the landing page at `/` that explains the Provenance product to new visitors. Include a clear value proposition, how it works (writer flow and reader flow), an example verification page link (or screenshot), and a call-to-action to sign up. Redirect authenticated users to `/dashboard`.

**Requirement:** REQ-001

**Acceptance Criteria:**
- [ ] (CODE) Landing page at / with product explanation
  - Verify: `grep -q 'Provenance' src/app/page.tsx`
- [ ] (CODE) How it works section explaining writer and reader flows
  - Verify: `grep -q 'how.*works\|How.*Works\|writer\|reader' src/app/page.tsx`
- [ ] (CODE) Call-to-action button linking to /login
  - Verify: `grep -q '/login' src/app/page.tsx`
- [ ] (CODE) Authenticated users redirected to /dashboard
  - Verify: `grep -q 'redirect\|dashboard' src/app/page.tsx`

**Files to Create:** None

**Files to Modify:**
- `src/app/page.tsx` — Replace placeholder with landing page

**Existing Code to Reference:**
- `src/auth.ts` — auth() session check for redirect

**Dependencies:** None (within Phase 6)

**Spec Reference:** Page Structure, Bootstrapping & Go-to-Market (TECHNICAL_SPEC.md, PRODUCT_SPEC.md)

---

### Phase 6 Checkpoint

**Automated Checks:**
- [ ] All tests pass: `npx vitest run`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`

**Regression Verification:**
- [ ] Full writer flow: login → create document → write → use AI → generate badge → copy snippet
- [ ] Full reader flow: visit verification page → view stats → expand audit trail
- [ ] All AI modes work (inline, side panel, freeform)
- [ ] Origin tracking produces correct AI percentages
- [ ] Auto-save and session tracking work correctly

---

## Requirements Addressed by Platform/Policy (No Dedicated Tasks)

These requirements are satisfied by technology choices and scope boundaries rather than specific implementation tasks:

| REQ | Requirement | How Addressed |
|-----|-------------|---------------|
| REQ-045 | No granular verification page permissions in MVP | Not built — binary public/private only |
| REQ-046 | Free during beta, no payment infrastructure | Not built — no payment code included |
| REQ-053 | Audit data backup with point-in-time recovery | Neon managed backups with point-in-time recovery (branching) |
| REQ-054 | TLS for all data in transit, secure credential storage | Vercel (TLS), Neon (TLS), API keys in env vars, Auth.js sessions in httpOnly cookies |
