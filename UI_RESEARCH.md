# UI/UX Competitive Research: Provenance

> Comprehensive analysis of 30+ tools across 5 categories to inform Provenance's UI design.
> Generated: 2026-02-21

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Category 1: AI Writing Tools](#category-1-ai-writing-tools)
3. [Category 2: AI Code Editors](#category-2-ai-code-editors)
4. [Category 3: Trust & Verification UIs](#category-3-trust--verification-uis)
5. [Category 4: Audit Trail & Timeline UIs](#category-4-audit-trail--timeline-uis)
6. [Category 5: Dashboard & Document Management](#category-5-dashboard--document-management)
7. [Cross-Category Synthesis](#cross-category-synthesis)
8. [Recommended Patterns for Provenance](#recommended-patterns-for-provenance)
9. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
10. [Novel Opportunities](#novel-opportunities)

---

## Executive Summary

### The Key Finding

**No existing tool maintains persistent AI provenance after content acceptance, and no existing tool provides an audit trail of AI interactions.** Every writing tool — Google Docs, Notion, Lex, Wordtune, Grammarly — loses the distinction between AI and human text the moment a suggestion is accepted. This is Provenance's primary differentiation opportunity.

### Top 10 Transferable Patterns

| # | Pattern | Source | Provenance Surface |
|---|---------|--------|--------------------|
| 1 | Inline diff with track-changes styling | Cursor Cmd+K | Editor (inline AI) |
| 2 | Multiple alternative suggestions | Wordtune, Copilot | Editor (inline AI) |
| 3 | Three-tier AI escalation (ambient → scoped → exploratory) | Cursor | Editor (all AI modes) |
| 4 | Session-grouped chronological timeline | Slack + GitHub | Verification page |
| 5 | Progressive disclosure with type badges | Stripe | Verification page |
| 6 | Hero stat + grid layout for mobile | Stripe receipts, boarding passes | Verification page (mobile) |
| 7 | Pre-publish consequence warning | GitHub PR + Substack | Badge preview |
| 8 | Authorship color-coding for text origin | iA Writer | Editor (origin marks) |
| 9 | Auto-grouping of rapid events | Google Docs history | Verification timeline |
| 10 | Full-width row list with metadata | Linear, Vercel | Dashboard |

---

## Category 1: AI Writing Tools

### 1.1 Google Docs + Gemini

**AI Trigger:** "Help me write" chip in left margin, or selection → floating toolbar "Refine my text."

**Suggestion Display:** AI response appears in a bordered card inline in the document. Clear visual boundary with blue/purple border. Card contains the generated text, a "Refine" button for iteration, and Insert/Replace/Discard buttons.

**Accept/Reject Flow:**
- "Insert" — places AI text at cursor (additive)
- "Replace" — swaps selection with AI text
- "Refine" — opens a follow-up prompt field for iteration (can refine multiple times)
- Discard — removes suggestion entirely

**Post-Accept Marking:** None. AI text becomes standard document text immediately.

**Strengths:**
- The "Refine" loop is powerful — each refinement is a sub-event, creating a natural trail of iteration
- Bordered card creates a clear visual "audit boundary" between human and AI text
- Side panel ("Help me research") adds document-wide AI without cluttering the editor

**Weaknesses:**
- No persistent AI markers after acceptance
- Side panel feels disconnected from the document
- No audit trail of any kind

**Key Pattern for Provenance:** The suggestion card with refine loop. Each refinement step would be a clean audit event: invocation → generation → decision → refinement → final decision.

---

### 1.2 Notion AI

**AI Trigger:** Multi-level invocation hierarchy:
- **Slash command** (`/ai`) — at cursor in any block
- **Space bar on empty block** — triggers AI generation
- **Selection → "Ask AI"** — in floating toolbar on text selection
- **Block menu** — "..." menu on any block includes AI options
- **Page-level** — "Summarize page", "Translate page", etc.

**Suggestion Display:** AI response appears in a purple-bordered block below the trigger point. Contains comparison view: original with strikethrough + replacement side by side. Action buttons: "Replace", "Insert below", "Make longer", "Continue writing", "Discard", or custom follow-up prompt.

**Accept/Reject Flow:**
- Replace — swaps original with AI text
- Insert below — keeps original AND adds AI text (excellent for evaluation)
- Discard — removes the suggestion block
- Custom prompt — iterates with a follow-up instruction

**Post-Accept Marking:** None.

**Strengths:**
- Multi-level action hierarchy means AI is available at every granularity without being in the way
- Comparison view (original + replacement) is ideal for rewriting
- "Insert below" option lets writers evaluate before committing
- Space bar shortcut for empty lines is discoverable and fast

**Weaknesses:**
- AI can feel ubiquitous/overwhelming with so many entry points
- No provenance tracking whatsoever

**Key Pattern for Provenance:** The multi-level action hierarchy (slash command, selection toolbar, block menu, page actions) maps directly to Provenance's three AI modes. The comparison view for rewrites should be adopted.

---

### 1.3 Lex.page

**AI Trigger:** Typing `+++` at the end of text triggers AI continuation. Also: selection-based rewrite via keyboard shortcut, and a side chat panel ("Lex Chat").

**Suggestion Display:** For `+++` continuation: AI text streams inline as grayed-out text. For rewrites: floating panel with alternative. For chat: responses in side panel.

**Accept/Reject Flow:** Tab to accept, Backspace/Escape to reject. Can accept partially by pressing Tab and then editing.

**Post-Accept Marking:** None (briefly shows different opacity during streaming, then normalizes).

**Strengths:**
- The `+++` trigger forces deliberate, conscious AI invocation — creates a natural "boundary moment" perfect for audit trail logging
- Streaming preview with Tab to accept is fast and keyboard-driven
- Writing-first, sparse aesthetic aligns with indie blogger audience
- The conscious invocation philosophy matches Provenance's transparency mission

**Weaknesses:**
- Limited formatting capabilities
- No persistent AI markers, no audit trail
- `+++` is primarily for continuation, limiting compared to multi-action tools

**Key Pattern for Provenance:** The deliberate invocation philosophy. AI should feel like a conscious choice, not ambient magic. Every invocation is a clean audit event with clear start/end boundaries.

---

### 1.4 Jasper

**AI Trigger:** Template-driven generation (fill parameters, generate draft), `//` command in editor, "Compose" button, side chat panel.

**Suggestion Display:** Template output in staging area, in-editor generation inline at cursor, chat in side panel. Can generate multiple variations for comparison.

**Strengths:**
- Multiple variations pattern — generating 2-3 alternatives creates richer audit trail data
- Brand Voice concept — writer describes their style, AI follows it

**Weaknesses:**
- AI-first, writing-second — editor is secondary to generation pipeline
- No provenance at all — fundamentally an AI content factory

**Key Pattern for Provenance:** Multiple variations for rewrites (showing what was considered and rejected). Brand Voice concept could inform the side panel.

---

### 1.5 Wordtune

**AI Trigger:** Click on (or select) a sentence — Wordtune automatically generates 3-5 alternative phrasings. Toolbar buttons: "Rewrite," "Casual," "Formal," "Shorten," "Expand."

**Suggestion Display:** Alternative cards appear below the sentence, each numbered, with changed portions highlighted in blue/purple. Hover over an alternative to preview it inline in the document.

**Accept/Reject Flow:** Click an alternative to replace. Click elsewhere to dismiss (frictionless, no explicit reject button). Standard Ctrl+Z to undo.

**Strengths:**
- **Multiple alternatives simultaneously** is the best approach for rewriting
- **Inline preview on hover** lets you see suggestions in context before committing
- **Highlighted differences** within alternatives let writers focus on what changed
- **Frictionless dismissal** (click away) makes the tool feel lightweight
- Sentence-level granularity is the right level for prose rewriting

**Weaknesses:**
- No provenance after acceptance
- Automatic triggering on click can be intrusive when just reading
- No document-level awareness

**Key Pattern for Provenance:** Multiple alternatives with highlighted diffs is the single most important inline pattern. Inline preview on hover should be adopted. Frictionless dismissal is good UX, but Provenance needs to ensure dismissals are still logged.

---

### 1.6 Grammarly

**AI Trigger:** Automatic underlining (red = grammar, blue = clarity, purple = engagement, green = delivery). GrammarlyGO floating button near cursor for generative features.

**Suggestion Display:** Floating card near underlined text showing original, suggested replacement, and explanation. Sidebar panel lists all issues as scrollable cards.

**Accept/Reject Flow:** One-click accept on suggestion card. "Dismiss" button. "Accept all" for batch operations.

**Strengths:**
- **Color-coded categories** create an at-a-glance map of issues across the document
- **Explanation with every suggestion** builds trust and educates
- **Sidebar as dashboard** gives document-level overview
- **Batch operations** ("Accept all") respect user time

**Weaknesses:**
- GrammarlyGO feels bolted onto the correction product
- No provenance after acceptance despite tracking aggregate analytics
- Continuous underlining can be anxiety-inducing for first drafts

**Key Pattern for Provenance:** Color-coded underlines adapted for provenance categories (human/AI/pasted). Sidebar as audit event dashboard. Explanations with suggestions build trust.

---

### 1.7 iA Writer

**AI Trigger:** None — deliberately anti-AI. But has an **Authorship feature**: pasted text is visually distinguished from typed text using a different color (gray vs. black).

**Design Philosophy:** Radical focus through feature restraint. Minimal toolbar, markdown-native, Focus Mode (dims non-active text), syntax highlighting for parts of speech.

**Strengths:**
- **Authorship color-coding** (pasted vs. typed) is the closest existing precedent to Provenance's origin tracking — proves writers accept subtle visual provenance markers
- **Syntax highlighting as analytical overlay** proves you can layer information onto text without disrupting writing flow
- **Focus Mode** for writing concentration
- **Minimal chrome philosophy** — the writing surface dominates

**Weaknesses:**
- Authorship is binary (pasted/typed), not AI-specific
- No AI integration at all

**Key Pattern for Provenance:** iA Writer's Authorship feature validates Provenance's core concept. Extend the color-coding to three categories: human-typed (default), AI-generated (subtle tint), externally pasted (different tint). The minimal chrome philosophy should guide editor design.

---

### Writing Tools: Universal Finding

**Every single tool loses AI provenance after the user accepts a suggestion.** No tool maintains persistent inline markers for AI-generated content. No tool provides a record of prompts, rejected alternatives, or interaction timelines. This is Provenance's entire value proposition, and the competitive landscape confirms nobody else is building it.

**Simplicity Spectrum:**
```
Simplicity ←───────────────────────────────→ AI Power

iA Writer   Lex   Google Docs   Wordtune   Notion   Grammarly   Jasper
(no AI)  (minimal) (moderate)  (focused) (extensive) (layered) (AI-first)
```

**Recommendation:** Position Provenance between Lex and Google Docs — sparse and writing-first like Lex, with suggestion UX quality of Google Docs. AI should be powerful but not ambient.

---

## Category 2: AI Code Editors

### 2.1 Cursor

**Three AI modes with escalating scope and agency:**

| Mode | Trigger | Scope | Agency |
|------|---------|-------|--------|
| Tab (ambient) | Automatic | Cursor position | Low (suggest) |
| Cmd+K (scoped) | Keyboard shortcut | Selection/region | Medium (transform) |
| Chat/Composer | Cmd+L / Cmd+I | File/project | High (create/plan) |

**Tab Autocomplete:** Ghost text appears ahead of cursor. Tab to accept, Cmd+Right for word-by-word acceptance (partial accept). Multi-line edit predictions (change line 5, AI predicts corresponding change on line 12).

**Cmd+K Inline Edit:** Select text → small inline prompt bar → type instruction → AI generates inline diff (red/strikethrough for removed, green for added, shown in place). Can re-prompt without closing. Accept with Cmd+Enter, reject with Cmd+Backspace.

**Chat + Apply:** Side panel with conversational AI. Code blocks in responses have an "Apply" button that opens the target file and shows inline diff. Supports @-mentions for context: @file, @symbol, @docs, @web, @codebase.

**Composer (Multi-file):** Cmd+Shift+I for broader edits. AI generates changes across multiple files with per-file diffs. Accept/reject per-file or globally.

**Strengths:**
- Three modes serve genuinely different use cases and don't compete
- Inline diff preview is outstanding — see changes in context before committing
- @-mentions provide explicit, flexible context control
- Word-by-word accept for partial acceptance

**Weaknesses:**
- Three modes can confuse new users
- Chat Apply diffs sometimes fail on context mismatch
- Composer overwhelming for small changes

**Key Patterns for Provenance:**
1. **Inline diff with track-changes styling** — select paragraph, describe change, see strikethrough/underline in place. Most directly transferable pattern.
2. **Word-by-word accept** — when AI gets direction right but not exact phrasing
3. **Apply button bridging chat to document** — discuss in panel, click Apply to see tracked changes
4. **Escalating scope model** — ghost text for flow, inline edit for revision, chat for planning

---

### 2.2 Windsurf (Codeium)

**Cascade (primary mode):** Persistent side panel with "agentic flow" — AI proactively reads files, searches codebase, proposes plans, executes step-by-step. Shows each step with expandable details.

**"Flows" concept:** Multi-step AI-human alternation — AI proposes, human approves/modifies, AI continues. Creates a rhythm of proposal-approval-execution.

**Strengths:**
- Proactive context awareness — doesn't require manual @-mentions
- Step-by-step plan view provides transparency into AI reasoning
- "Flows" elegantly captures collaborative rhythm

**Weaknesses:**
- Can feel slow (many steps before output)
- Less control over context compared to Cursor's explicit @-mentions

**Key Pattern for Provenance:** The "flows" concept is highly transferable — back-and-forth where AI proposes edits, writer approves, AI continues. Step-by-step plan view for multi-section revisions.

---

### 2.3 GitHub Copilot

**Ghost Text:** Standard Tab-to-accept. Unique feature: **Alt+]/[ to cycle through alternative suggestions** (shows "1/3" indicator). Word-by-word accept with Cmd+Right.

**Chat Panel:** Side panel with slash commands (/explain, /fix, /tests, /doc). Inline chat variant via Cmd+I for scoped edits.

**Copilot Edits:** Multi-file editing with "working set" concept (explicitly choose which files to include). Diffs in VS Code's native diff viewer.

**Key Patterns for Provenance:**
- **Alternative cycling (Alt+]/[)** — "show me 3 ways to rephrase this sentence" with keyboard navigation
- **Slash commands** for discoverable actions: /expand, /condense, /rewrite-formal
- **Working set concept** — explicitly choose which sections to include in a revision pass
- **Status bar icon** showing AI state (thinking, ready, disabled)

---

### 2.4 Zed

**Assistant Panel:** Not a chat widget — a full editor buffer where you write prompts and AI responds in the same document. Context insertion is explicit and visual (quoted blocks).

**Inline Assists:** Select code, type instruction, see **live-streaming diff** — text changes in real-time as the AI generates, with inline red/green diffing. Can interrupt if direction is wrong.

**Key Patterns for Provenance:**
- **Assistant-as-editor-buffer** — AI conversation becomes a working/reference document, not disposable chat
- **Live-streaming edits** — watch revision form in real-time, interrupt early if wrong direction
- **Explicit context insertion** — gives writers control over what AI sees

---

### 2.5 JetBrains AI Assistant

**Integration philosophy:** AI actions appear alongside existing IDE actions (Alt+Enter quick-fix menu), normalizing AI as just another tool. AI suggestions in completion popup are marked with a distinct purple/AI icon.

**Key Patterns for Provenance:**
- **Contextual AI actions in right-click menu** — "Improve clarity," "Expand this idea," "Simplify language"
- **AI icon distinguishing AI suggestions from regular ones** — important for trust
- **Gradual normalization** — start with simple, trustworthy actions before exposing complex ones

---

### Code Editors: Cross-Cutting Patterns

**Five distinct interaction patterns that recur:**

| Pattern | Mechanism | Prose Application |
|---------|-----------|-------------------|
| Ambient Suggestion (Ghost Text) | Gray text ahead of cursor, Tab to accept | Sentence/paragraph completion |
| Scoped Transformation (Inline Edit) | Select → describe → inline diff → accept | "Make this more concise" with strikethrough/underline |
| Conversational Exploration (Chat) | Side panel + Apply buttons | Discussing structure, brainstorming |
| Agentic Flow (Multi-step) | AI plans and executes across files | "Revise the tone of the entire piece" |
| Contextual Actions (Quick Fix) | Predefined actions in context menus | Right-click → "Improve clarity" |

**Accept/Reject Best Practices:**
- **Copilot's alternative cycling** — ideal for prose: "show me 3 versions"
- **Cursor's word-by-word accept** — when AI gets gist right but not exact words
- **Zed's live streaming** — watching a revision form, interrupting if wrong
- **Cursor's inline diff with re-prompting** — iterative refinement

**Critical Design Adaptation:** Red/green line-based diffs are wrong for prose. Use **track-changes styling** (strikethrough for deletions, colored underline for additions) in flowing text.

---

## Category 3: Trust & Verification UIs

### 3.1 Content Credentials (C2PA)

**Verification viewer:** Shows a "Content Credentials" panel with provenance chain. Each step in the chain (creation, editing, export) is a card with: tool used, timestamp, and action taken. Digital signatures authenticate each step.

**Visual Language:**
- Trust shield/checkmark icon as primary indicator
- Provenance chain as a vertical timeline of "ingredient" cards
- Each card shows the tool name, action, and signing organization
- Blue/green for verified, gray for unverified, red for tampered

**Key Patterns:**
- **Provenance chain as vertical cards** maps directly to Provenance's audit timeline
- **Organization/tool attribution** on each card (which AI provider was used) adds credibility
- **The shield icon** establishes trust at a glance — Provenance needs a similarly recognizable trust symbol

---

### 3.2 Have I Been Pwned

**Results presentation:** Single-page with clear hierarchy. Hero section shows breach count (large number, red if breached, green if clear). Below: list of breach entries as cards, each showing service name, date, compromised data types, and breach description.

**Key Patterns:**
- **Binary hero indicator** (breached/not breached) with color — maps to AI percentage (high/low/none)
- **Card-per-event** with expandable details
- **Plain language** for non-technical users — no jargon

---

### 3.3 Blockchain Explorers (Etherscan)

**Transaction timeline:** Events listed chronologically with: timestamp, from/to addresses (truncated with copy), amount, status badge (Success/Failed/Pending), and gas fee. Expandable to show full transaction data.

**Key Patterns:**
- **Summary/detail progressive disclosure** — critical data visible at a glance, full payload on expand
- **Status badges** (Success/Failed/Pending) for instant scanning
- **Consistent row format** across all transaction types
- **Hash/ID as trust anchor** — showing the unique identifier prominently

---

### 3.4 Shields.io / Open Source Badges

**Badge effectiveness:** Tiny (typically ~20x100px), two-section design: label on left (dark), value on right (colored). Color communicates status at a glance (green = passing, red = failing, blue = info).

**Badge → detail flow:** Click badge → full status page or detailed report.

**Key Patterns:**
- **Two-section badge design** (label + value) is the standard
- **Color encodes meaning** — Provenance's badge should use color to communicate AI percentage range
- **Alt text as fallback** — essential for platforms that strip images

---

### 3.5 Google "About This Result"

**Pattern:** Panel appears next to search results with: source description (from Wikipedia), when the site was first indexed, connection security indicator, and whether results are personalized.

**Key Pattern:** **Contextualizing information without overwhelming** — shows just enough to inform trust decisions, not a full audit.

---

### 3.6 Browser SSL Indicators

**Progressive disclosure pattern:**
1. **Level 1 (Glance):** Padlock icon in URL bar — binary trust signal
2. **Level 2 (Quick check):** Click padlock → dropdown with "Connection is secure" and certificate issuer
3. **Level 3 (Deep dive):** "Certificate details" → full certificate chain, validity dates, fingerprints

**Key Pattern:** Three-level progressive disclosure from icon → summary → full detail. Provenance should follow: badge image → verification summary → full audit timeline.

---

### Trust UIs: What Makes Verification Feel Trustworthy

1. **Simplicity and clarity signal competence.** Cluttered verification pages feel untrustworthy. Clean design = credible.
2. **Progressive disclosure builds confidence.** Show the headline first, let users dig deeper. Forcing all detail upfront overwhelms.
3. **Methodology transparency.** Content Credentials shows the signing chain. HIBP explains breach sources. Provenance should explain its methodology prominently.
4. **Consistent visual language.** Color-coded status badges, trust icons, and uniform layouts help users build pattern recognition.
5. **The verification page design itself is a trust signal.** A poorly designed page undermines the credibility of the data it presents.

---

## Category 4: Audit Trail & Timeline UIs

### 4.1 GitHub PR/Commit Timeline

**Structure:** Vertical timeline rail (thin line connecting events). Two-tier visual weight:
- **Full cards:** Comments, reviews, PR descriptions — bordered cards with author avatar, full content, reactions
- **Inline rows:** Label changes, assignee changes, status updates — single-line entries with icon, description, timestamp

**Grouping:** Consecutive commits batched into expandable "N commits" block. Outdated review comments collapsed. Resolved conversations collapsed.

**Timestamps:** Relative ("2 hours ago") with absolute on hover.

**Key Patterns for Provenance:**
- **Two-tier visual weight** — AI interactions as full cards, revision snapshots as compact inline rows
- **Commit-style grouping** — batch rapid 30-second revisions into "N revisions" with expand
- **Vertical timeline rail** for visual continuity
- **Outdated collapse** — collapse older revision snapshots, show only most recent per cluster

---

### 4.2 Linear Activity Feed

**Structure:** Compact chronological stream. State changes as single-line entries with colored dot. Comments as full-width cards.

**Visual Language:** Monochromatic with accent colors only for status. Typography-driven distinction (larger text for comments, smaller gray text for state changes). Date separators ("Today", "Yesterday").

**Key Patterns for Provenance:**
- **Date separators** for multi-day writing sessions
- **Typography-driven hierarchy** — font size and weight differentiate event types, not heavy borders
- **Minimal visual chrome** — timelines can be scannable without heavy card borders on every item
- **Filter toggles** — "All", "AI Interactions", "Paste Events", "Sessions"

---

### 4.3 Google Docs Version History

**Structure:** Right sidebar lists versions chronologically (newest first). Clicking a version shows document state with changes highlighted. Author color coding. Named versions as semantic landmarks.

**Auto-grouping:** Rapid successive edits collapsed into single version entry. Expandable to see individual changes.

**Key Patterns for Provenance:**
- **Auto-grouping of rapid events** — critical for handling 30-second revision snapshots. Group into "Session 1: 45 minutes, 12 revisions"
- **Named versions / semantic landmarks** — badge generation events and session boundaries as "named landmarks." Auto-revisions are noise between landmarks.
- **Source-type color coding** — instead of author colors, use consistent colors for AI (purple), human (green), paste (orange)

---

### 4.4 Stripe Dashboard Event Logs

**Structure:** Vertical list, newest first. Each entry: timestamp, event type, one-line description, expand arrow. Expanded view shows full JSON payload.

**Event differentiation:** Status badges (green "Succeeded", red "Failed"), icon per type, monospace event type name.

**Filtering:** Horizontal bar with dropdown selectors, date range picker, quick filter chips.

**Key Patterns for Provenance:**
- **Status badges for event types** — small colored pills: "AI" (blue/purple), "PASTE" (orange), "SESSION" (green), "REVISION" (gray)
- **Consistent summary row format** — every event type has: icon, type badge, one-line description, timestamp
- **Progressive disclosure with appropriate detail** — AI interactions expand to prompt/response. Paste events expand to character count. Summary row is self-sufficient for scanning.
- **Horizontal filter bar** with filter chips above timeline

---

### 4.5 Datadog/Grafana Observability

**Event overlay pattern:** Discrete events (deploys, alerts) shown as markers on continuous time-series graphs. Different marker shapes/colors per type. Markers collapse into count badges when dense.

**Key Patterns for Provenance:**
- **Timeline minimap** — thin horizontal bar at top showing entire writing duration. Color-coded segments for sessions (green), AI dots (blue), paste dots (orange). Instant visual overview of writing process shape.
- **Event density visualization** — cluster markers when dense, expand when sparse
- **Correlation markers** — visual connection between AI interaction and resulting revision

---

### 4.6 Slack Message History

**Sender grouping:** Consecutive messages from same sender grouped under single header. Subsequent messages appear without repeating header.

**System events:** Join/leave, topic changes as centered, gray, italic text — visually de-emphasized.

**Threads:** Collapsed into "N replies" indicator. Click to open in side panel.

**Key Patterns for Provenance:**
- **Session grouping** — all events within a writing session under a session header. Header shows: start time, duration, summary ("AI interactions: 3, Revisions: 8")
- **System event de-emphasis** — auto-revisions as centered, gray, smaller text
- **Thread-style collapsing for AI interactions** — show prompt as "parent" with "View response and action" as collapsible child

---

### 4.7 Figma Version History

**Visual snapshots:** Each version has a thumbnail preview. Named versions always visible, auto-saves grouped.

**Key Patterns for Provenance:**
- **Visual indicators of document state** — small stat indicator per entry: word count, AI% at that point
- **Named landmarks** — badge generation events as prominent named checkpoints
- **Progress indicator** — word count progression: "142 words" → "380 words" → "AI: +200 words" → "520 words"

---

### Timeline UIs: Recommended Structure for Provenance

```
Session 1 — Feb 15, 2:00 PM - 3:45 PM (1h 42m active)
  ├── [gray]     Document started (0 words)
  ├── [gray]     8 revisions over 15 min (+142 words)        [expandable]
  ├── [blue/AI]  Inline: "Rephrase this paragraph" → Accepted  [expandable]
  ├── [gray]     5 revisions over 12 min (+238 words)        [expandable]
  ├── [orange]   External paste — 45 characters               [expandable]
  └── [gray]     3 revisions over 8 min (+45 words)          [expandable]

Session 2 — Feb 16, 10:00 AM - 11:30 AM (1h 15m active)
  ├── [gray]     Resumed (425 words)
  ├── [blue/AI]  Side panel: "Research question..." → Rejected [expandable]
  ├── [blue/AI]  Freeform: "Generate outline..." → Partial    [expandable]
  └── [gray]     12 revisions over 45 min (+465 words)       [expandable]

[green]  Badge Generated — Feb 16, 11:35 AM (890 words, 12% AI)
```

---

## Category 5: Dashboard & Document Management

### 5.1 Notion

**Layout:** Left sidebar (workspace hierarchy, pages, favorites) + main content area. Pages organized as tree with disclosure triangles. Metadata per page: icon, title, last edited date, author.

**Navigation:** Sidebar with nested hierarchy, breadcrumbs at top, Cmd+K quick find, favorites section.

**Key Patterns:** Hover-reveal actions, inline creation (type to create), template system.

---

### 5.2 Linear

**Layout:** Left sidebar (teams, projects, views) + main list view. Issues as compact rows with: status circle (colored), title, assignee avatar, priority icon, labels as pills.

**Filtering:** Powerful filter builder with AND/OR logic, saved views, grouping by status/priority/assignee.

**Visual Language:** Monochromatic base with status colors only. Dense, efficient, keyboard-driven.

**Key Patterns:** Status-first design (colored dot always visible), filter chips, keyboard shortcuts for everything, dense information display.

---

### 5.3 Vercel Dashboard

**Layout:** Project cards in a grid/list. Each card shows: project name, framework icon, deployment status (green dot = live), last deployment time, Git branch.

**Navigation:** Sidebar with team/project hierarchy. Click project → deployments list → specific deployment detail.

**Key Patterns:** Status indicators on cards, clean card design, progressive detail (card → deployment list → logs).

---

### 5.4 Figma

**Layout:** Grid of file thumbnails. Each shows: visual preview, filename, modification date, collaborator avatars.

**Navigation:** Team → Project → Files hierarchy in sidebar. Recents view as landing page.

**Key Patterns:** Visual thumbnails for recognition, recency as primary sort, team hierarchy.

---

### 5.5 Arc Browser

**Key Innovation:** Ephemeral tabs (auto-archive after 12 hours) vs. pinned tabs (permanent). Command palette (Cmd+K) as primary navigation. Spaces with color themes for context switching.

**Key Patterns:** Recents that expire, color theming for states, command palette as primary nav, intentional minimalism.

---

### 5.6 Obsidian

**Layout:** IDE-like with file explorer sidebar, editor tabs, backlinks panel.

**Key Innovations:** Graph view (force-directed network of linked notes), backlinks (bidirectional references), tags as cross-cutting organization alongside folders.

**Key Patterns:** Quick switcher (Cmd+O), tags + folders, metadata in right sidebar, local graph view.

---

### 5.7 Bear

**Layout:** Three-column: left sidebar (tags) → middle column (note list) → right column (editor).

**Note list shows:** Title (bold), preview text (2-3 lines, muted), relative date, tag pills with color.

**Key Patterns:**
- **Three-column layout** with progressive drill-down
- **Tag pills with color** for categorization
- **First-class Archive action** — between keeping and deleting
- **Pin notes** to top of list
- **Relative dates** ("Today", "Yesterday", "3 days ago")
- **Content preview** in list aids document recognition
- **Calm, typography-forward aesthetic**

---

### 5.8 Craft

**Layout:** Sidebar + main content. Home screen shows recent documents as polished cards in a grid. Cards show: title, content preview, location, date.

**Visual Design:** Premium and polished — blur effects, subtle gradients, generous whitespace. Native-feeling animations.

**Key Patterns:** Recent documents as cards on home, premium aesthetic builds trust, minimal metadata in lists.

---

### Dashboard: Recommended Design for Provenance

**Layout:** Full-width rows (Linear/Vercel style), not cards — Provenance documents are text-centric and don't benefit from thumbnails.

```
┌──────────────────────────────────────────────────────────────┐
│ [●]  Document Title                              3 days ago  │
│      First line of content preview...            2,847 words │
│      [Badge: 12% AI] [Badge: 8% AI]                         │
└──────────────────────────────────────────────────────────────┘
```

**Status indicators:** Draft (gray dot), Has Badge (green dot), Archived (muted)

**Actions:** Cmd+K command palette, Cmd+N to create, right-click context menu for delete/archive

**Sort/Filter:** Last modified (default), tabs for All / Drafts / Has Badge / Archived

**Empty State:** "Start Your First Transparent Post" — value proposition + single CTA

---

### Pre-Publish Review (REQ-049)

**Research across GitHub PRs, Substack, Medium, Twitter compose:**

**Key Findings:**
1. **Show consequences, not just content** — "This will be visible to anyone with the link" beats re-showing text
2. **Match editing format to published format** — minimize gap between compose and publish
3. **Highlight the sensitive parts** — prompts, AI responses, and paste events are what writers might not realize are included
4. **Two-click pattern** — "Generate Badge" opens preview, "Confirm & Generate" executes
5. **Don't overdo warnings** — one clear, factual warning > multiple scary banners
6. **State reversibility** — "This badge is permanent and cannot be modified" (factual, not FUD)

**Recommended Flow:**
```
[Warning: "Everything below will be publicly visible to anyone with the badge link."]

Summary Stats → Document Text (scrollable) → AI Interactions (expandable) → Paste Events (expandable)

[Note: "This badge is permanent and cannot be modified after generation."]

[Cancel]                    [Confirm & Generate Badge]
```

---

### Mobile Verification (REQ-031)

**Research across Stripe receipts, boarding passes, event tickets, Linear mobile:**

**Key Findings:**
1. **Single dominant stat at top** — large AI percentage as hero
2. **2-column grid for secondary stats** — sessions, interactions, time, words
3. **Expandable sections** for timeline and document text
4. **Card-based containers** for visual structure
5. **Sticky header** with branding
6. **Skeleton loading** for perceived performance

**Recommended Mobile Layout:**
```
┌─────────────────────────────────┐
│  [Logo]         [Badge ID]      │  ← Sticky header
├─────────────────────────────────┤
│          12%                    │  ← Hero stat
│    AI-Generated                 │
│  ┌──────────┐ ┌──────────┐     │  ← 2-col grid
│  │Sessions 3│ │AI Chats 8│     │
│  │Time 2h14m│ │Words 2847│     │
│  └──────────┘ └──────────┘     │
│  ─ What This Certifies ─       │  ← Collapsible
│  ─ Audit Timeline (12) ─       │  ← Expandable
│  ─ Full Document Text ─        │  ← Collapsed default
│  ─ Methodology ─               │
└─────────────────────────────────┘
```

---

## Cross-Category Synthesis

### Interaction Patterns That Create Clean Audit Events

For Provenance's audit trail to work, every AI interaction must have clear boundaries. Best patterns:

| Pattern | Source | Why It Works |
|---------|--------|-------------|
| Deliberate invocation (`+++`, Cmd+K) | Lex, Cursor | Clear start event, conscious choice |
| Multiple alternatives | Wordtune, Copilot | Prompt → options generated → selection or dismissal |
| Replace/Insert/Discard buttons | Notion, Google Docs | Three distinct outcome types |
| Refine loop | Google Docs | Each refinement is a sub-event |
| Session grouping | Slack | Events naturally bounded by session |

**Recommendation:** Design every AI interaction as: (1) invocation (what was selected, what was requested), (2) generation (what AI produced), (3) decision (accepted, partially accepted, modified, rejected, refined), (4) document impact (what changed).

### The Gap in the Market

| Capability | Google Docs | Notion | Lex | Cursor | Grammarly | iA Writer | **Provenance** |
|-----------|-------------|--------|-----|--------|-----------|-----------|----------------|
| Inline AI rewriting | Yes | Yes | Limited | Yes | Yes | No | **Yes** |
| Chat/panel AI | Yes | Yes | Yes | Yes | No | No | **Yes** |
| Post-accept AI markers | No | No | No | No | No | Pasted only | **Yes (unique)** |
| Prompt/response logging | No | No | No | No | No | No | **Yes (unique)** |
| AI contribution % | No | No | No | No | No | No | **Yes (unique)** |
| Public audit trail | No | No | No | No | No | No | **Yes (unique)** |
| Verification badges | No | No | No | No | No | No | **Yes (unique)** |

---

## Recommended Patterns for Provenance

### Editor

1. **Inline AI:** Cursor-style inline diff with track-changes styling (strikethrough + colored underline), not red/green code diffs. Show 2-3 alternatives (Wordtune pattern) with highlighted differences. Tab to accept, Escape to dismiss.

2. **Side Panel:** Zed-inspired persistent buffer (not disposable chat). Apply button to push suggestions to document as tracked changes. @-mentions for context (Cursor pattern).

3. **Freeform:** Command palette-style (Cmd+J or similar). Quick presets (Improve, Simplify, Expand, Fix Grammar) plus custom prompt field.

4. **Origin Marks:** iA Writer-inspired subtle color-coding — human text default, AI-generated with faint background tint, externally pasted with different tint. Visible but not distracting.

5. **AI Status:** Small indicator in toolbar showing AI state (ready, thinking, streaming) — JetBrains/Copilot pattern.

### Verification Page

1. **Hero stat** — large AI percentage at top with clear label
2. **Stats grid** — 2-column grid for secondary metrics
3. **Session-grouped timeline** — events grouped by writing session, with auto-grouping of rapid revisions
4. **Three-tier visual weight** — full cards for AI interactions, compact rows for paste events, de-emphasized markers for revisions
5. **Type badges** — colored pills (AI/PASTE/SESSION/REVISION)
6. **Timeline minimap** — thin horizontal overview bar
7. **Progressive disclosure** — three levels for AI interactions (collapsed → summary → full)
8. **Filter chips** — horizontal filter bar above timeline
9. **Mobile-first** — hero stat + grid + expandable sections

### Dashboard

1. **Full-width rows** with status dot, title, preview, date, word count, badge pills
2. **Cmd+K command palette** for navigation
3. **Sort/filter tabs** — All / Drafts / Has Badge / Archived
4. **First-class Archive** action (Bear pattern)
5. **Calm, typography-forward aesthetic** (Bear/Craft)

### Badge Preview

1. **Consequence-focused warning** — "Everything below will be publicly visible"
2. **Sensitive content highlighted** — AI prompts/responses and paste events visually emphasized
3. **Two-click confirmation** — preview then confirm
4. **Permanence statement** — factual, not scary
5. **Summary stats at top** before detail sections

---

## Anti-Patterns to Avoid

1. **All-or-nothing acceptance** — forcing writers to accept/reject entire suggestions with no middle ground. Always provide word-by-word accept and alternative cycling.

2. **Opaque AI context** — not showing writers what the AI "sees." Writers need to know if AI read the full document or just the current paragraph.

3. **Modal interruption** — any AI interaction that takes you out of the document breaks writing flow. Everything inline or in a non-modal side panel.

4. **Code-style diffs for prose** — red/green line-based diffs are wrong for prose. Use track-changes styling in flowing text.

5. **Overactive ambient suggestions** — ghost text appearing mid-thought is worse for prose than code. Suggestions should activate only during natural pauses.

6. **Flat timeline with no grouping** — showing every 30-second revision snapshot individually would overwhelm the verification page. Auto-group rapid events.

7. **Technical jargon on verification pages** — JSON payloads, raw timestamps, internal IDs. Use plain language for the non-technical verifier audience.

8. **Emoji as icons** — the current AuditTimeline uses emoji. Replace with consistent SVG/Lucide icons matching shadcn/ui.

9. **Single expand state** — allowing only one expanded event at a time forces users to close one to open another. Allow multiple expansions.

10. **Performative trust signals** — over-designed "verified" badges that look like they're trying too hard. Subtle, professional design signals competence better than flashy badges.

---

## Novel Opportunities

These are UI patterns that no single competitor has attempted, enabled by Provenance's unique combination of writing + AI + verification:

### 1. Living Origin Map
An interactive visualization in the editor showing text provenance in real-time. Select any span of text → tooltip shows: "AI-generated via Claude, Feb 15 at 2:34 PM, prompt: 'make this more concise', 83% of original preserved." No other tool tracks or displays this.

### 2. Process Replay
A "replay" mode on the verification page that shows the document being written as a time-lapse, with AI interactions appearing as visual events in the flow. Like watching a game replay but for writing.

### 3. Comparative AI Metrics
When a writer generates multiple badges for the same document (after further editing), show a comparison: "Badge 1: 23% AI → Badge 2: 12% AI" with a trajectory indicator. Shows the writer is actively revising and reducing AI dependence.

### 4. Provenance-Aware AI Suggestions
The AI assistant could see the current AI percentage and adjust its behavior: "Your document is currently 40% AI-generated. Would you like me to suggest edits that help you integrate the AI text in your own voice?" No other AI tool is provenance-aware.

### 5. Writer's Process Signature
Over multiple documents, build a characteristic "writing pattern" — average session length, typical AI usage level, revision density. This becomes a trust signal itself: "This writer typically uses 10-15% AI assistance and writes in 3-4 sessions." Pattern consistency builds credibility.

### 6. Verification Page as Content
Make the verification page genuinely interesting to read — not just data, but a narrative of the writing process. "This piece was written over 3 days in 5 sessions. The author used AI 8 times, primarily for research questions. 3 AI suggestions were rejected. The longest uninterrupted writing stretch was 45 minutes." This turns verification into content worth sharing.
