# Technical Specification: Provenance

> Technical architecture for an auditable AI writing tool with transparent process verification.

**Status:** MVP Technical Design
**Date:** 2026-02-20
**Version:** 1.0
**Upstream:** [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)

---

## Tech Stack

### Core Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | React ecosystem for TipTap, SSR for verification pages (REQ-051), API routes built in, Vercel-native |
| **Language** | TypeScript | Type safety for complex data models (audit trails, origin maps), better IDE support for AI coding agents |
| **Database** | PostgreSQL via Supabase | Relational model fits audit trail data, JSONB for flexible document storage, RLS for access control |
| **Auth** | Supabase Auth | Built-in OAuth (Google + GitHub), session management, 50K MAU free tier covers beta (REQ-004, REQ-046) |
| **Hosting** | Vercel | Native Next.js hosting, edge network for fast verification pages, free tier for beta |
| **Editor** | TipTap v2 (ProseMirror) | Specified in REQ-007, extensible plugin system for origin tracking, headless/customizable |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, accessible components, consistent design system |
| **AI Providers** | Anthropic Claude + OpenAI | User choice between providers (REQ-012), abstraction layer for unified interface |
| **Badge Images** | @vercel/og (Satori) | Server-side PNG generation at the edge, JSX-based templates, auto-cached |

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` | Rich text editor core |
| `@tiptap/extension-*` | Individual formatting extensions (image, code-block, etc.) |
| `@supabase/supabase-js`, `@supabase/ssr` | Database client and SSR auth helpers |
| `@ai-sdk/anthropic` | Claude provider for Vercel AI SDK |
| `@ai-sdk/openai` | OpenAI provider for Vercel AI SDK |
| `@ai-sdk/react` | React hooks for AI SDK streaming (useChat, useCompletion) |
| `@vercel/og` | Badge image generation (on demand) |
| `nanoid` | Unguessable verification IDs (REQ-055) |
| `ai` | Vercel AI SDK 6 — unified streaming interface for both providers |

### Auto-Decided Technical Choices

The following were decided based on strong confidence in fit:

- **API pattern:** Next.js Server Actions for mutations + Route Handlers for streaming AI. No additional API framework needed for MVP.
- **State management:** React hooks + TipTap's built-in editor state. No external state library (Redux, Zustand) needed — the editor is the primary state container.
- **Content storage format:** TipTap JSON (native ProseMirror document format). Queryable via JSONB, preserves full formatting, can extract plain text for metrics.
- **Rich text to plain text:** Server-side extraction from TipTap JSON for character counting and percentage calculation. No separate plain-text copy maintained.
- **Session detection:** Heartbeat-based. Client sends periodic heartbeat while editor is active; session ends after 5 minutes of inactivity.
- **TipTap SSR:** All editor components use `'use client'` directive with `immediatelyRender: false` to prevent hydration errors.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel Edge                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Verification │  │ Badge Image  │  │  Static Assets   │  │
│  │ Pages (SSR)  │  │ Generation   │  │  (Next.js)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
┌─────────┼─────────────────┼─────────────────────────────────┐
│         │    Vercel Serverless Functions                     │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────────────────┐  │
│  │ API Routes   │  │ Server       │  │ AI Proxy         │  │
│  │ (REST)       │  │ Actions      │  │ (Streaming)      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌──────────────────┐  ┌──────────┐  ┌────────────────────────┐
│   Supabase       │  │ Supabase │  │   AI Providers         │
│   PostgreSQL     │  │ Auth     │  │  ┌──────┐  ┌────────┐  │
│   + Storage      │  │ (OAuth)  │  │  │Claude│  │ OpenAI │  │
└──────────────────┘  └──────────┘  │  └──────┘  └────────┘  │
                                    └────────────────────────┘
```

### Component Responsibilities

| Component | Responsibilities |
|-----------|-----------------|
| **Next.js App (Client)** | TipTap editor, AI interaction UI, origin tracking, paste detection, session heartbeats, auto-save |
| **Server Actions** | Document CRUD, revision creation, audit trail writes, badge generation |
| **API Route Handlers** | AI streaming proxy, badge image serving |
| **Supabase PostgreSQL** | All persistent data: documents, revisions, audit logs, badges |
| **Supabase Auth** | OAuth flow, session management, JWT tokens |
| **@vercel/og** | Badge PNG generation on demand (no storage needed) |
| **AI Proxy** | Routes AI requests to selected provider, streams responses, logs interactions |
| **Verification Pages** | Server-rendered public pages, no auth required |

---

## Data Model

### Entity Relationship

```
users 1──* documents 1──* revisions
                     1──* ai_interactions
                     1──* paste_events
                     1──* sessions
                     1──* badges
```

### Schema

#### `profiles` (extends Supabase Auth users)

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, FK → `auth.users` | Supabase Auth user ID |
| `display_name` | `text` | NOT NULL | From OAuth provider |
| `email` | `text` | NOT NULL | From OAuth provider |
| `avatar_url` | `text` | | From OAuth provider |
| `ai_provider` | `text` | DEFAULT `'anthropic'` | `'anthropic'` or `'openai'` |
| `ai_model` | `text` | | Preferred model, null = provider default |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

#### `documents`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `profiles`, NOT NULL | Owner |
| `title` | `text` | NOT NULL, DEFAULT `'Untitled'` | |
| `content` | `jsonb` | NOT NULL, DEFAULT `'{"type":"doc","content":[{"type":"paragraph"}]}'` | TipTap JSON document (valid empty doc). Origin tracking data is embedded as marks within this JSON (see Content Origin Tracking). |
| `word_count` | `integer` | DEFAULT `0` | Cached plain-text word count |
| `deleted_at` | `timestamptz` | | Soft-delete timestamp. NULL = active. |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

**RLS Policy:** `user_id = auth.uid() AND deleted_at IS NULL` for all operations (REQ-041, REQ-044). Soft-deleted documents are invisible through normal queries but their `badges` FK references remain valid (REQ-039).

#### `revisions`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK | |
| `document_id` | `uuid` | FK → `documents`, NOT NULL | |
| `content` | `jsonb` | NOT NULL | TipTap JSON snapshot |
| -- | -- | -- | Origin data is embedded in content JSON as marks |
| `plain_text` | `text` | NOT NULL | Extracted plain text for diffing |
| `trigger` | `text` | NOT NULL | `'interval'`, `'significant_change'`, `'ai_interaction'` |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Index:** `(document_id, created_at)` for chronological retrieval.

#### `ai_interactions`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK | |
| `document_id` | `uuid` | FK → `documents`, NOT NULL | |
| `session_id` | `uuid` | FK → `sessions` | |
| `mode` | `text` | NOT NULL | `'inline'`, `'side_panel'`, `'freeform'` |
| `prompt` | `text` | NOT NULL | User's request |
| `selected_text` | `text` | | Text highlighted for inline mode |
| `response` | `text` | NOT NULL | AI's complete response |
| `action` | `text` | NOT NULL | `'accepted'`, `'partially_accepted'`, `'modified'`, `'rejected'`, `'blocked'` |
| `document_diff` | `jsonb` | | Before/after content if accepted |
| `characters_inserted` | `integer` | DEFAULT `0` | Characters added to document |
| `provider` | `text` | NOT NULL | `'anthropic'` or `'openai'` |
| `model` | `text` | NOT NULL | Model ID used |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**RLS Policy:** Insert only when `document.user_id = auth.uid()`. Read via badge snapshot (public) or document owner.

#### `paste_events`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK | |
| `document_id` | `uuid` | FK → `documents`, NOT NULL | |
| `session_id` | `uuid` | FK → `sessions` | |
| `content` | `text` | NOT NULL | Pasted content |
| `source_type` | `text` | NOT NULL | `'external'`, `'ai_internal'` |
| `character_count` | `integer` | NOT NULL | |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

#### `sessions`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK | |
| `document_id` | `uuid` | FK → `documents`, NOT NULL | |
| `user_id` | `uuid` | FK → `profiles`, NOT NULL | |
| `started_at` | `timestamptz` | NOT NULL | |
| `ended_at` | `timestamptz` | | NULL while active |
| `active_seconds` | `integer` | DEFAULT `0` | Accumulated active time (from heartbeats) |
| `last_heartbeat` | `timestamptz` | | For session timeout detection |

#### `badges`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK | |
| `document_id` | `uuid` | FK → `documents`, NOT NULL | |
| `verification_id` | `text` | UNIQUE, NOT NULL | Unguessable ID for URL (nanoid, 21 chars) |
| `document_title` | `text` | NOT NULL | Title at generation time |
| `document_text` | `text` | NOT NULL | Plain text at generation time |
| `document_content` | `jsonb` | NOT NULL | TipTap JSON at generation time |
| `audit_trail` | `jsonb` | NOT NULL | Frozen: AI interactions, paste events, sessions, revisions |
| `stats` | `jsonb` | NOT NULL | `{ ai_percentage, external_paste_percentage, interaction_count, session_count, total_active_seconds }` |
| `image_url` | `text` | | Generated on demand via /api/badges/[verificationId]/image — cached at edge |
| `is_taken_down` | `boolean` | DEFAULT `false` | REQ-050 |
| `takedown_reason` | `text` | | |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**RLS Policy:** Owner can insert and read their own badges. **No public SELECT policy** — public verification data is served exclusively through server-side Route Handlers/Server Actions that query with the `service_role` key by exact `verification_id` match. This prevents badge enumeration (REQ-055) while allowing public access to individual verification pages.

**Index:** `UNIQUE(verification_id)` for O(1) verification page lookup.

---

## Content Origin Tracking

### Overview

The core technical challenge of Provenance is tracking where every piece of text came from. This enables the AI-generated percentage calculation (REQ-020).

### Approach: TipTap Marks (In-Document)

Origin metadata is stored as **custom TipTap marks** directly in the document JSON. This means origin data naturally moves with the text during cut/paste, drag/drop, and undo/redo — avoiding the complexity of maintaining a separate position-mapped data structure.

#### Custom Mark Definition

```typescript
// extensions/origin-mark.ts
const OriginMark = Mark.create({
  name: 'origin',
  addAttributes() {
    return {
      type: { default: 'human' },      // 'human' | 'ai' | 'external_paste'
      sourceId: { default: null },      // ai_interaction.id or paste_event.id
      originalLength: { default: null }, // original span length for modification tracking
    };
  },
  // Invisible mark — no rendering output, only stored in JSON
  renderHTML() { return ['span', { 'data-origin': '' }, 0]; },
  parseHTML() { return [{ tag: 'span[data-origin]' }]; },
});
```

#### How Marks Are Applied

1. **Typing:** Text typed by the writer has no `origin` mark (absence = `human`). This is the default state and requires no active tracking.
2. **AI insertion:** When the writer accepts AI output, the inserted text is wrapped with `origin` mark: `{ type: 'ai', sourceId: interactionId, originalLength: text.length }`. The `sourceId` is generated client-side using `nanoid()` before the insert, then used as the PK when logging to `ai_interactions`.
3. **Paste (external):** The custom paste handler detects external pastes and wraps the inserted content with `origin` mark: `{ type: 'external_paste', sourceId: pasteEventId }`.
4. **Paste (from AI panel):** Treated as AI origin when the paste content matches a recent AI response in client state.
5. **Move/drag:** Because origin is stored as a mark on the text itself, moving text preserves its origin automatically — ProseMirror's transaction system handles this natively.
6. **Undo/redo:** ProseMirror's history plugin preserves marks through undo/redo cycles. No special handling needed.

#### Modification Detection

When a user edits within an `ai`-marked span:
- The mark's `originalLength` attribute records the span's length at insertion time.
- On each auto-save, a server-side function walks the document and checks each `ai`-marked span: if the current span length differs from `originalLength` by more than 20%, the mark is removed (text reverts to `human` classification).
- Character-level edits within the span (typo fixes, minor word changes) that stay within the 20% threshold preserve the `ai` classification.

#### Ambiguous Origin Fallback

Text without any `origin` mark is classified as `human` (conservative default per REQ-020). This handles edge cases where marks might be stripped by unexpected editor operations.

### Percentage Calculation

```typescript
function calculateMetrics(doc: JSONContent): BadgeStats {
  let aiChars = 0, humanChars = 0, externalPasteChars = 0;

  // Walk all text nodes in the TipTap JSON document
  walkTextNodes(doc, (text, marks) => {
    const originMark = marks?.find(m => m.type === 'origin');
    const length = text.length;

    if (!originMark || originMark.attrs.type === 'human') {
      humanChars += length;
    } else if (originMark.attrs.type === 'ai') {
      aiChars += length;
    } else if (originMark.attrs.type === 'external_paste') {
      externalPasteChars += length;
    }
  });

  const total = aiChars + humanChars + externalPasteChars;
  return {
    ai_percentage: total > 0 ? Math.round((aiChars / total) * 100) : 0,
    external_paste_percentage: total > 0 ? Math.round((externalPasteChars / total) * 100) : 0,
    total_characters: total,
  };
}
```

### Syncing

Origin data is embedded in the TipTap JSON document itself (as marks), so it is automatically persisted on every auto-save without a separate sync mechanism. Revision snapshots capture the full document JSON including all origin marks. The `documents.origin_map` column is no longer needed — origin data lives in `documents.content`.

---

## AI Provider Abstraction

### Interface

```typescript
// lib/ai/types.ts
interface AIProvider {
  id: 'anthropic' | 'openai';
  name: string;
  defaultModel: string;
  models: AIModel[];
}

interface AIModel {
  id: string;
  name: string;
  tier: 'fast' | 'standard';  // fast = side panel, standard = inline/freeform
}

interface AICompletionRequest {
  prompt: string;
  context?: string;         // surrounding document text for context
  selectedText?: string;    // highlighted text for inline mode
  mode: 'inline' | 'side_panel' | 'freeform';
  provider: 'anthropic' | 'openai';
  model?: string;           // specific model override
}

// Returns a ReadableStream for streaming responses
type AIComplete = (request: AICompletionRequest) => ReadableStream<string>;
```

### Provider Configuration

```typescript
// lib/ai/providers.ts
const providers: Record<string, AIProvider> = {
  anthropic: {
    id: 'anthropic',
    name: 'Claude',
    defaultModel: 'claude-sonnet-4-6',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tier: 'standard' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', tier: 'fast' },
    ],
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', tier: 'standard' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'fast' },
    ],
  },
};
```

### Streaming Architecture

The AI completion uses the **Vercel AI SDK** (`ai` package) for a standardized streaming protocol across both providers:

1. Client sends request to `/api/ai/complete` (Route Handler).
2. Server validates auth, selects provider, calls the provider via AI SDK's `streamText()` with `@ai-sdk/anthropic` or `@ai-sdk/openai` provider.
3. AI SDK returns a standardized `StreamTextResult` that the Route Handler converts to a streaming response via `result.toUIMessageStreamResponse()` (AI SDK 6 pattern).
4. Client uses AI SDK's `useChat` hook from `@ai-sdk/react` to consume the stream with built-in parsing.
5. When streaming completes, client logs the full interaction to `ai_interactions` table via Server Action.

This pattern keeps API keys server-side, uses a well-defined streaming protocol (AI SDK's data stream format), and provides uniform behavior regardless of provider.

**Blocked/refused requests (REQ-012):** If the AI provider refuses a request (safety filter, content policy), the server catches the provider error and returns a response with custom metadata via AI SDK 6's response API containing a `blocked` status and the refusal reason. The client detects this via the `onFinish` callback, displays the refusal message to the writer, and automatically logs an `ai_interaction` with `action: 'blocked'` and the provider's refusal reason as the `response` field.

### System Prompts

Each interaction mode has a tailored system prompt:

- **Inline:** Focused on the selected text and surrounding context. Instructed to return only the replacement text.
- **Side panel:** Conversational, can reference the full document. Returns natural language responses.
- **Freeform:** Open-ended, given the full document as context.

---

## API Contracts

### Authentication

All authenticated endpoints use Supabase session cookies (managed by `@supabase/ssr`). The middleware (`middleware.ts`) refreshes sessions and redirects unauthenticated users.

### Server Actions

Server Actions are used for all mutations to keep API surface minimal:

#### `createDocument()`
- **Auth:** Required
- **Returns:** `{ id: string }`
- Creates empty document with default title, creates initial session

#### `updateDocument(documentId: string, data: { title?: string, content?: JsonValue })`
- **Auth:** Required, must be document owner
- **Returns:** `{ success: boolean }`
- Debounced auto-save target. Updates `updated_at`.

#### `deleteDocument(documentId: string)`
- **Auth:** Required, must be document owner
- **Returns:** `{ success: boolean }`
- **Soft-delete:** Sets `deleted_at = now()` on the document. Does NOT delete the row or cascade. Badges remain valid and publicly accessible (REQ-039). Revisions, interactions, paste events, and sessions are preserved for badge audit trails. The document disappears from the user's dashboard but its data persists for existing badges.

#### `createRevision(documentId: string, trigger: string)`
- **Auth:** Required, must be document owner
- **Returns:** `{ id: string }`
- Snapshots current document content, origin map, and extracted plain text.

#### `logAIInteraction(data: AIInteractionInput)`
- **Auth:** Required
- **Returns:** `{ id: string }`
- Writes to `ai_interactions` table. Append-only (REQ-040).

#### `logPasteEvent(data: PasteEventInput)`
- **Auth:** Required
- **Returns:** `{ id: string }`
- Writes to `paste_events` table. Append-only.

#### `startSession(documentId: string)`
- **Auth:** Required
- **Returns:** `{ id: string }`

#### `endSession(sessionId: string)`
- **Auth:** Required
- **Returns:** `{ success: boolean }`
- Sets `ended_at`, calculates `active_seconds` from heartbeats.

#### `heartbeat(sessionId: string)`
- **Auth:** Required
- **Returns:** `{ success: boolean }`
- Updates `last_heartbeat`, increments `active_seconds`.

#### `generateBadge(documentId: string)`
- **Auth:** Required, must be document owner
- **Returns:** `{ verificationId: string, badgeHtml: string, badgeMarkdown: string }`
- Freezes document, audit trail, and stats into a badge record. Generates badge PNG. Returns embed snippets.

### Route Handlers

#### `POST /api/ai/complete`

AI streaming endpoint.

**Request:**
```typescript
{
  documentId: string;
  prompt: string;
  selectedText?: string;
  context?: string;
  mode: 'inline' | 'side_panel' | 'freeform';
  provider: 'anthropic' | 'openai';
  model?: string;
}
```

**Response:** `ReadableStream` (text/event-stream). Each chunk is a text fragment.

**Error responses:**
- `401` — Not authenticated
- `403` — Not document owner
- `429` — Rate limited (protect against AI API abuse)
- `502` — AI provider error (include error message)

#### `GET /api/badges/[verificationId]/image`

Serves the badge PNG image.

**Response:** `image/png`, cached with `Cache-Control: public, s-maxage=86400, stale-while-revalidate=86400`. The 24-hour edge cache TTL balances performance with the ability to take down badges within a reasonable timeframe (REQ-050). On takedown, Vercel's on-demand revalidation API is called to purge the cached image immediately.

**Error responses:**
- `404` — Badge not found
- `410` — Badge taken down (REQ-050)

#### `GET /api/verify/[verificationId]`

Returns badge data for the verification page (used by SSR, but also available as JSON).

**Response:**
```typescript
{
  documentTitle: string;
  documentText: string;
  stats: {
    aiPercentage: number;
    externalPastePercentage: number;
    interactionCount: number;
    sessionCount: number;
    totalActiveSeconds: number;
  };
  auditTrail: {
    aiInteractions: AIInteraction[];
    pasteEvents: PasteEvent[];
    sessions: Session[];
    revisions: RevisionSummary[];
  };
  createdAt: string;
  isTakenDown: boolean;
  takedownReason?: string;
}
```

---

## Page Structure

| Route | Type | Auth | Description |
|-------|------|------|-------------|
| `/` | SSR | No | Landing page. Redirects to `/dashboard` if authenticated. |
| `/login` | Client | No | OAuth login (Google + GitHub buttons) |
| `/auth/callback` | Route Handler | No | Supabase OAuth callback |
| `/dashboard` | SSR | Yes | Document list with create button (REQ-033) |
| `/editor/[id]` | Client | Yes | TipTap editor with AI panel (REQ-007–015) |
| `/editor/[id]/preview` | Client | Yes | Pre-publish badge preview (REQ-049) |
| `/verify/[id]` | SSR | No | Public verification page (REQ-027–032) |

### Verification Page (Critical Path)

The verification page is the most important page for readers. It must be:
- **Server-rendered** for fast initial load (REQ-051: < 2s on 4G)
- **Fully responsive** with mobile-first design (REQ-031)
- **No authentication required** (REQ-042)
- **Cacheable** — badge data is immutable, so pages can be cached aggressively at the edge

**Layout (mobile-first):**
1. **Header:** Provenance branding + "Verified Writing Process"
2. **Summary card:** Large AI percentage number, secondary stats (interactions, sessions, time)
3. **Scope statement:** What this badge certifies and doesn't certify (REQ-032, REQ-038)
4. **Methodology note:** Brief explanation + link to detailed docs (REQ-048)
5. **Document text:** Full text with expandable sections for long documents (REQ-030)
6. **Audit timeline:** Chronological, expandable entries (REQ-029). Each entry shows:
   - Timestamp
   - Event type icon (typing, AI interaction, paste, session start/end)
   - For AI interactions: prompt, response, action taken (collapsible)
   - For paste events: character count, source type
7. **Footer:** "Powered by Provenance" + link to learn more

**Taken-down badges (REQ-050):** If `is_taken_down` is `true`, the verification page renders a minimal notice page instead of the full audit trail. The notice displays: "This verification page has been removed" with the reason category (e.g., "Legal request" or "Terms violation"). No document text, audit trail, or statistics are shown. The badge image endpoint returns HTTP 410 Gone.

---

## Editor Architecture

### TipTap Configuration

```typescript
// Components structure
const extensions = [
  StarterKit,                    // Basic formatting
  Heading.configure({ levels: [1, 2, 3] }),
  Image,
  Link,
  CodeBlock,
  Blockquote,
  BulletList,
  OrderedList,
  Placeholder.configure({ placeholder: 'Start writing...' }),
  // Custom extensions:
  OriginTracking,               // Custom plugin for content origin tracking
  AutoSave.configure({ debounceMs: 2000 }),
  PasteHandler,                 // Custom paste event detection
  SessionHeartbeat,             // Session activity tracking
];
```

### Auto-Save Flow (REQ-011)

1. Editor `onUpdate` fires on every change.
2. A 2-second debounce timer resets on each change.
3. When timer fires, client calls `updateDocument()` Server Action with current content + origin map.
4. Optimistic UI — no loading indicator for saves, but a subtle "Saved" indicator on success.
5. If save fails, retry with exponential backoff. Show error after 3 failures.

### Revision Snapshot Flow (REQ-016)

Revisions are created independently from auto-save:

1. **Interval-based:** Every 30 seconds of active editing (tracked via heartbeat), create a revision snapshot.
2. **Event-based:** Create a snapshot immediately after an AI interaction that changes the document (trigger: `'ai_interaction'`).
3. Client calls `createRevision()` Server Action.
4. Server extracts plain text from TipTap JSON and stores alongside the JSONB content.

### Paste Detection (REQ-018)

A custom TipTap extension intercepts the browser `paste` event:

1. Read clipboard content from `ClipboardEvent`.
2. Check if the paste originates from an accepted AI suggestion (match against recent AI responses held in client state).
3. If from AI: classify as `ai_internal` (already tracked by AI interaction flow).
4. If external: log as `external_paste` with content and character count.
5. Update origin map with new paste span.

### AI Interaction UI (REQ-013)

**Inline mode:**
1. User selects text → floating toolbar appears with AI options.
2. User types a prompt (or selects a preset: "Rephrase," "Expand," "Simplify").
3. AI response streams into a diff-style preview below the selection.
4. User clicks "Accept," "Modify," or "Reject."
5. On accept: selected text is replaced, origin map updated, interaction logged.

**Side panel mode:**
1. Persistent panel on the right side of the editor.
2. Chat-style interface. User types messages, AI responds.
3. AI has access to the full document as context.
4. User can manually copy text from the panel to the editor (tracked as `ai_internal` paste).
5. All messages are persisted as `ai_interactions` with mode `'side_panel'`.

**Freeform mode:**
1. Command palette-style input (triggered by keyboard shortcut or button).
2. User types any prompt.
3. AI response appears in a modal or inline block.
4. Same accept/reject flow as inline mode.

### Session Tracking (REQ-019)

1. When the editor mounts, call `startSession()`.
2. Every 30 seconds while the editor is active, call `heartbeat()`.
3. "Active" is determined by recent user input (keystroke, mouse click, AI interaction) within the last 60 seconds.
4. When the user navigates away or closes the tab, call `endSession()` via `beforeunload` event.
5. If heartbeats stop for 5 minutes (server-side check), auto-close the session.

---

## Badge Generation Flow

### Trigger (REQ-021)

1. User clicks "Generate Badge" in the editor.
2. **Pre-publish preview (REQ-049):**
   - Navigate to `/editor/[id]/preview`.
   - Server fetches current document, all AI interactions, paste events, sessions.
   - Display exactly what will become public: full text, all prompts/responses, paste content.
   - Show prominent warning: "Everything shown here will be publicly visible to anyone with the badge link."
   - User must click "Confirm & Generate" to proceed.
3. On confirmation, call `generateBadge()` Server Action.

### Server-Side Process

```
generateBadge(documentId):
  1. Verify ownership
  2. Fetch document (content, origin_map, title)
  3. Fetch all ai_interactions for this document
  4. Fetch all paste_events for this document
  5. Fetch all sessions for this document
  6. Fetch all revisions for this document
  7. Extract plain text from TipTap JSON
  8. Calculate stats from origin_map (ai_percentage, external_paste_percentage)
  9. Count interactions, sessions, total active time
  10. Generate verification_id (nanoid, 21 chars)
  11. Insert badge record with all frozen data (badge PNG is generated on demand by the image endpoint)
  14. Return { verificationId, badgeHtml, badgeMarkdown }
```

### Badge Image Template

Generated via `@vercel/og` (Satori):

```
┌────────────────────────────────────────────┐
│ ◆ Provenance  │  12% AI-generated          │
│               │  Verified Process →         │
└────────────────────────────────────────────┘
~200x40px, PNG
```

### Embed Snippets (REQ-024)

**HTML:**
```html
<a href="https://provenance.app/verify/{id}">
  <img src="https://provenance.app/api/badges/{id}/image"
       alt="Provenance Verified: 12% AI-generated — View full writing process audit at https://provenance.app/verify/{id}"
       width="200" height="40" />
</a>
```

**Markdown:**
```markdown
[![Provenance Verified: 12% AI-generated](https://provenance.app/api/badges/{id}/image)](https://provenance.app/verify/{id})
```

---

## Authentication Flow

### OAuth Setup (REQ-004)

1. Configure Google and GitHub OAuth providers in Supabase Dashboard.
2. Set callback URL: `https://provenance.app/auth/callback`.
3. Use `@supabase/ssr` for cookie-based sessions in Next.js App Router.

### Middleware

```typescript
// middleware.ts
// 1. Refresh Supabase session on every request
// 2. Protected routes: /dashboard, /editor/* redirect to /login if no session
// 3. Public routes: /, /login, /verify/*, /api/badges/*/image
```

### Login Flow

1. User visits `/login`.
2. Clicks "Continue with Google" or "Continue with GitHub."
3. Supabase redirects to OAuth provider.
4. Provider redirects back to `/auth/callback`.
5. Callback handler exchanges code for session, creates/updates `profiles` row.
6. Redirect to `/dashboard`.

---

## Security Considerations

### API Key Management (REQ-054)

- AI provider API keys (Anthropic, OpenAI) stored as Vercel environment variables, never exposed to client.
- Supabase keys: `anon` key used client-side (safe, enforces RLS), `service_role` key server-side only.

### Row Level Security

All tables enforce RLS:
- **Documents, revisions, AI interactions, paste events, sessions:** `user_id = auth.uid()` or `document.user_id = auth.uid()`
- **Badges (write):** Only document owner can create
- **Badges (read):** Owner can read their own badges. Public verification is served via server-side queries using `service_role` key — no public RLS policy on badges table (prevents enumeration, REQ-055)
- **Profiles:** Users can only read/update their own profile

### Rate Limiting

- AI completion endpoint: 20 requests/minute per user (prevent API abuse)
- Badge generation: 10 per hour per user
- Auto-save: Client-side debounce (2s), server accepts at most 1 save/second per document

### Verification Page Security (REQ-055)

- `verification_id` uses `nanoid(21)` — 21 characters from a 64-char alphabet = ~126 bits of entropy
- No sequential IDs, no enumeration possible
- No user data exposed beyond what the writer explicitly published

---

## Implementation Sequence

### Phase 1: Foundation

1. **Project scaffolding** — Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui
2. **Supabase setup** — Project creation, database schema, RLS policies
3. **Authentication** — Supabase Auth with Google + GitHub OAuth, middleware, login page
4. **Document CRUD** — Dashboard page, create/list/delete documents, basic document page

### Phase 2: Editor

5. **TipTap integration** — Editor component with all formatting extensions, `'use client'`, `immediatelyRender: false`
6. **Auto-save** — Debounced save to Supabase, save indicator
7. **Session tracking** — Start/end/heartbeat, active time calculation

### Phase 3: AI Assistant

8. **AI provider abstraction** — Unified interface for Claude + OpenAI
9. **AI streaming endpoint** — `/api/ai/complete` Route Handler with provider routing
10. **Inline AI mode** — Text selection → prompt → streamed suggestion → accept/reject
11. **Side panel mode** — Chat interface, document context, message history
12. **AI interaction logging** — Write to `ai_interactions` table on completion

### Phase 4: Audit Trail

13. **Origin tracking plugin** — Custom TipTap plugin for content origin spans
14. **Paste detection** — Custom paste handler, source classification, paste event logging
15. **Revision snapshots** — Interval-based + event-based snapshots
16. **Metrics calculation** — AI percentage, external paste percentage from origin map

### Phase 5: Badge & Verification

17. **Badge generation** — Freeze document + audit trail, generate PNG, store snapshot
18. **Pre-publish preview** — Full preview of public content with confirmation (REQ-049)
19. **Verification page** — SSR, responsive, summary stats, expandable timeline
20. **Badge embed snippets** — HTML + Markdown with alt text fallback

### Phase 6: Polish

21. **Mobile optimization** — Verification page responsive testing, performance tuning
22. **Edge caching** — Verification pages + badge images cached at edge
23. **Error handling** — AI failures, save failures, session recovery
24. **Landing page** — Product explanation, example verification page, CTA

### Rationale for Sequence

- **Auth + CRUD first:** Everything else depends on having users and documents.
- **Editor before AI:** The editor must work standalone before adding AI features. Writers should be able to use it without AI.
- **AI before audit trail:** AI interactions generate audit trail data, so the AI system must exist before we can track its output.
- **Badge last:** Badges require all other features to produce meaningful verification pages.

---

## Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Yes (server only) |
| `ANTHROPIC_API_KEY` | Anthropic Console | Yes |
| `OPENAI_API_KEY` | OpenAI Dashboard | Yes |
| `NEXT_PUBLIC_APP_URL` | Deployment config | Yes |

---

## Requirement Traceability

| REQ | Technical Approach |
|-----|-------------------|
| REQ-001 | Next.js web app deployed on Vercel |
| REQ-002 | Editor pages: desktop layout only, no responsive editor UI |
| REQ-003 | Verification pages: mobile-first responsive design |
| REQ-004 | Supabase Auth with Google + GitHub OAuth |
| REQ-005 | No email/password provider configured |
| REQ-006 | `profiles` table with display_name, email from OAuth |
| REQ-007 | TipTap v2 with ProseMirror |
| REQ-008 | TipTap StarterKit + individual extensions (Heading, Image, Link, etc.) |
| REQ-009 | Minimal extension set, no complex features |
| REQ-010 | `documents` table with `user_id` FK, dashboard lists all user docs |
| REQ-011 | Auto-save via `onUpdate` debounce (2s) → Server Action |
| REQ-012 | AI provider abstraction, provider safety policies apply, blocked requests logged |
| REQ-013 | Three UI modes: floating toolbar (inline), side panel, command palette (freeform) |
| REQ-014 | Origin tracking plugin marks accepted AI text as `origin: 'ai'` |
| REQ-015 | Rejection logged to `ai_interactions` with `action: 'rejected'` |
| REQ-016 | Revision snapshots every 30s of active editing + on AI interactions |
| REQ-017 | `ai_interactions` table with full prompt, response, action, diff, timestamp |
| REQ-018 | Custom TipTap paste handler, source classification, `paste_events` table |
| REQ-019 | `sessions` table with heartbeat-based active time tracking |
| REQ-020 | In-document origin marks with 20% modification threshold, classification algorithm |
| REQ-021 | `generateBadge()` freezes document + audit trail into `badges` table |
| REQ-022 | @vercel/og generates 200x40 PNG with Provenance branding + percentage |
| REQ-023 | `verification_id` (nanoid) → `/verify/{id}` URL |
| REQ-024 | HTML and Markdown snippets returned from badge generation |
| REQ-025 | Alt text includes percentage + plain link in embed snippets |
| REQ-026 | Each `generateBadge()` creates a new row; old badges remain valid |
| REQ-027 | `/verify/[id]` SSR page, no auth required |
| REQ-028 | Stats displayed from `badges.stats` JSONB |
| REQ-029 | Expandable timeline from `badges.audit_trail` JSONB |
| REQ-030 | `badges.document_text` displayed on verification page |
| REQ-031 | Mobile-first CSS with Tailwind responsive utilities |
| REQ-032 | Static scope statement rendered on every verification page |
| REQ-033 | `/dashboard` page listing user documents |
| REQ-034 | Server Actions for create/update/delete with RLS |
| REQ-035 | Dashboard shows badge count per document, expandable badge list |
| REQ-036 | Scope statement text on verification page |
| REQ-037 | Limitation disclaimers on verification page |
| REQ-038 | Prominent disclaimer section on verification page |
| REQ-039 | Badges are insert-only (no update/delete RLS), soft-delete on documents preserves badges |
| REQ-040 | `ai_interactions`, `paste_events`: insert-only RLS, no update/delete policies |
| REQ-041 | RLS: `user_id = auth.uid()` on documents and related tables |
| REQ-042 | Public verification via server-side Route Handler (no public RLS), prevents enumeration |
| REQ-043 | Badge insert RLS: `document.user_id = auth.uid()` |
| REQ-044 | Document update/delete RLS: `user_id = auth.uid()` |
| REQ-045 | No granular permission system — binary public/private only |
| REQ-046 | No payment/subscription infrastructure |
| REQ-047 | Server-side data storage, no cryptographic verification for MVP |
| REQ-048 | Methodology text component included on every verification page |
| REQ-049 | `/editor/[id]/preview` page with confirmation gate before badge generation |
| REQ-050 | `is_taken_down` + `takedown_reason` columns on badges table |
| REQ-051 | SSR + edge caching (24h TTL, on-demand revalidation for takedowns), target < 2s TTFB |
| REQ-052 | Client-side editor with minimal server round-trips, debounced saves |
| REQ-053 | Supabase managed backups with point-in-time recovery |
| REQ-054 | TLS via Vercel/Supabase, API keys in env vars, sessions in httpOnly cookies |
| REQ-055 | `nanoid(21)` for verification IDs (~126 bits entropy) |
