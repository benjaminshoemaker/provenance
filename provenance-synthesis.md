# Provenance UI/UX: Synthesized Competitive Analysis & Recommendations

*Combining research from three independent analyses (Claude Deep Research, Claude Code, ChatGPT) across 30+ tools and 5 categories.*

---

## The Single Most Important Finding

All three research sources converge on the same conclusion: **no existing tool maintains persistent AI provenance after content acceptance.** Every writing tool — Google Docs, Notion, Lex, Wordtune, Grammarly — loses the distinction between AI and human text the moment a suggestion is accepted. No tool provides a record of prompts, rejected alternatives, or interaction timelines. This is not a minor gap — it's a complete absence. Provenance isn't competing in an existing category; it's creating one.

The competitive landscape confirms that the best UI patterns for Provenance already exist in fragments across writing tools, code editors, trust systems, audit UIs, and dashboards. The challenge is synthesis, not invention.

---

## Convergence Map: Where All Three Analyses Agree

These patterns were independently identified by all three research passes. Treat them as highest-confidence recommendations.

### 1. Cursor's Three-Tier AI Model Is the Foundation

All three analyses identify Cursor's escalating complexity model as the most transferable architecture for Provenance's three AI modes:

| Provenance Mode | Cursor Analog | Trigger | Cognitive Weight |
|---|---|---|---|
| Inline suggestions | Tab (ghost text) | Automatic during pauses | Lowest — ambient |
| Selection-based rewrite | Cmd+K (inline edit) | Explicit text selection | Medium — intentional |
| Side panel | Cmd+L (chat) | Keyboard shortcut | Highest — deliberate |

**Critical adaptation for prose**: The modes must remain distinct (not unified) because they serve different cognitive states. Each mode needs its own visual language: ghost text = gray, selection rewrite = purple/blue highlight, panel = separate spatial region.

### 2. Inline Diff for Prose Must Use Track-Changes Styling, Not Code-Style Diffs

All three analyses emphatically agree: red/green line-based diffs are wrong for prose. The recommendation is **track-changes styling** — strikethrough for deletions, colored underline for additions — shown inline in flowing text, at sentence or phrase level.

### 3. Multiple Alternatives Beat Single Accept/Reject

All three analyses independently highlight Wordtune's multiple-alternatives pattern as the most important inline interaction for prose rewriting. The recommendation is consistent: show **2–4 rewrite alternatives** (not just one), with "keep original" always visible. This gives writers agency and generates richer audit data (the log records which alternative was chosen from what set).

### 4. iA Writer's Philosophy Is the Design North Star

All three analyses point to iA Writer as the philosophical guide: radical restraint in the default editor, with power features hidden behind toggles and modes. The specific pattern that validates Provenance's core concept is **iA Writer's authorship color-coding** (pasted text visually distinct from typed text) — the closest existing precedent to Provenance's origin tracking, proving that writers accept subtle visual provenance markers.

### 5. The "Provenance Lens" Toggle

All three analyses recommend separating "writing mode" from "audit/provenance mode." The editor should be clean by default, with a toggle (variously called "Provenance Lens," "Review Mode," or "Authorship View") that reveals origin highlights, audit marks, and AI interaction details. This follows iA Writer's optional overlays and prevents the "Christmas tree text" anti-pattern that Grammarly can suffer from.

### 6. C2PA's Progressive Disclosure Is the Verification Page Framework

All three analyses identify the C2PA Content Credentials model as the foundational architecture:

- **L1**: Embeddable badge (always visible, minimal — shields.io format)
- **L2**: Verification summary (hero stat, key metadata, stacked bar)
- **L3**: Detailed audit trail (session-grouped timeline)
- **L4**: Technical verification (hashes, signatures, raw data)

### 7. Neutral Color for Badges — Not Green/Red

All three analyses warn against green = good / red = bad framing for AI usage. C2PA deliberately uses neutral colors to avoid value judgments. The badge should use a **distinctive brand color** (blue or indigo) that signals "verified" without judging whether the AI percentage is acceptable.

### 8. Never Auto-Apply AI Edits

Multiple analyses flag Cursor and Windsurf community reports where auto-accept regressions caused trust collapse. The product invariant: **every AI edit must be a proposed diff with explicit accept/reject.** This isn't just good UX — it's essential for audit integrity.

---

## Editor Recommendations

### Default Writing Surface

Position between Lex and Google Docs on the simplicity spectrum — sparse and writing-first like Lex, with suggestion UX quality of Google Docs.

```
Simplicity ←─────────────────────────────────→ AI Power

iA Writer   Lex   [PROVENANCE]   Google Docs   Notion   Grammarly   Jasper
```

The editor should feel like iA Writer by default and reveal Notion AI's power on demand.

### Inline AI Interaction Flow

**Select text → floating toolbar appears → choose action or type custom prompt → AI generates response → review and decide**

Specific recommendations synthesized from all sources:

1. **Floating toolbar** (Grammarly-style) appears on text selection with preset actions: Rewrite, Shorten, Expand, Change Tone, Fix Grammar, plus custom prompt field
2. **Alternatives display**: Show 2–3 rewrite alternatives as compact, numbered cards beneath the selection (Wordtune pattern), with changed portions highlighted within each alternative
3. **Inline preview on hover**: Hovering an alternative shows it in context in the document before committing (Wordtune)
4. **Track-changes diff**: Strikethrough for removed text, colored underline for additions — at sentence/phrase level, not line level
5. **Decision controls**: Accept / Accept with edits / Reject per suggestion, plus Accept All / Reject All for batch operations (JetBrains + Grammarly hybrid)
6. **Word-by-word accept**: When the AI gets direction right but not exact phrasing — Cmd+Right to accept word by word (Cursor/Copilot)
7. **Checkpoints**: Before document-wide AI edits, automatically create a checkpoint enabling full rollback (Copilot Edits + Zed)

**Replace vs Insert** should be explicit first-class buttons (Google Docs pattern), not implicit behaviors.

### Side Panel

- **Two modes with clear labels**: Ask (read-only research/brainstorming — no document changes) vs. Edit (creates patches that land in the review flow)
- **Patches from Edit mode always land in the diff review flow** — never silently applied
- **@-mentions for context injection**: reference sections, research, style guides (Cursor pattern)
- **Persistent conversation buffer** (Zed model — not disposable chat), making the panel a working reference document
- **Apply button** bridging panel suggestions to document as tracked changes (Cursor Chat → Apply)

### Freeform / Command Palette

- **Cmd+J** (or similar) opens a command palette with quick presets and custom prompt field
- **Persistent scope indicator**: every AI input surface shows `Selection / Paragraph / Document` + "Will produce: Suggestion / Patch / Notes"
- **Provenance-native presets**: Improve clarity, Reduce AI-ness, Add citations, Summarize audit — explicitly logged and reproducible

### Origin Marks (Authorship View)

Extend iA Writer's two-tier system to three tiers:

| Origin | Visual Treatment | Default Visibility |
|---|---|---|
| Human-typed | Standard weight, no tint | Always (baseline) |
| AI-generated | Subtle colored left border or background tint | Only in Provenance Lens |
| Externally pasted | Different subtle tint | Only in Provenance Lens |

Click/hover on any tinted region → reveals the originating event card (prompt, response, paste metadata, timestamp). This is the "Living Origin Map" — select any span of text and see its full provenance.

### AI Status Indicator

Small indicator in toolbar showing AI state: ready, thinking, streaming — following JetBrains/Copilot conventions. Unobtrusive but always visible.

---

## Verification Page Recommendations

### Information Architecture

Follow a strict progressive disclosure hierarchy:

```
┌──────────────────────────────────────────────────┐
│  HERO CARD (above the fold)                       │
│  ┌────────────────────────────────────────────┐   │
│  │  23% AI-Assisted        [Stacked bar viz]  │   │
│  │  "Document Title" by Author Name           │   │
│  │  Verified Feb 16, 2026                     │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  STATS GRID (2-column)                            │
│  ┌──────────┐ ┌──────────┐                        │
│  │Sessions 5│ │AI Chats 12│                       │
│  │Time 3h20m│ │Words 4200 │                       │
│  └──────────┘ └──────────┘                        │
│                                                    │
│  PASTE EVENTS: 3                                  │
│  SNAPSHOT HASH: a3f2...7b1c [copy]                │
│                                                    │
│  ─── AI Usage Breakdown ─── (expandable)          │
│  ─── Audit Timeline (47 events) ─── (expandable)  │
│  ─── Full Document Text ─── (collapsed)           │
│  ─── About This Verification ─── (expandable)     │
│  ─── Download Signed Log ───                      │
└──────────────────────────────────────────────────┘
```

### AI Percentage Communication

The number alone is meaningless without context. Present using a layered approach:

1. **Headline**: "AI-assisted text in final draft: 23%" — explicitly about the final artifact, not the process
2. **Visual**: Horizontal stacked bar (not pie chart) showing proportions
3. **Plain-language definition** co-located immediately below: "Of 4,200 words, approximately 970 were generated or substantially rewritten by AI"
4. **Section-level breakdown**: Which sections have what AI percentage — prevents the ecological fallacy of assuming uniform distribution
5. **Methodology note**: Expandable "About this number" drawer (Google "About this result" pattern) explaining what counts, what doesn't, and what the tool cannot observe
6. **Scope caveats**: What the tool can't observe — external copying, offline editing, etc.

### Audit Timeline Structure

Combine GitHub PR timeline, Stripe event logs, and Google Docs session grouping:

```
Session 1 — Feb 15, 2:00 PM - 3:45 PM (1h 42m active)
  ├── [gray]     Document started (0 words)
  ├── [gray]     8 revisions over 15 min (+142 words)        [expandable]
  ├── [blue/AI]  Inline: "Rephrase this paragraph" → Accepted [expandable]
  ├── [gray]     5 revisions over 12 min (+238 words)        [expandable]
  ├── [orange]   External paste — 45 characters               [expandable]
  └── [gray]     3 revisions over 8 min (+45 words)          [expandable]

Session 2 — Feb 16, 10:00 AM - 11:30 AM (1h 15m active)
  ├── [gray]     Resumed (425 words)
  ├── [blue/AI]  Side panel: "Research question..." → Rejected [expandable]
  ├── [blue/AI]  Freeform: "Generate outline..." → Partial     [expandable]
  └── [gray]     12 revisions over 45 min (+465 words)        [expandable]

[green] Badge Generated — Feb 16, 11:35 AM (890 words, 12% AI)
```

**Key design decisions**:

- **Session grouping**: Events grouped by writing session (continuous activity with gap-defined session breaks). Each session header shows duration, word count delta, AI interaction count
- **Two-tier visual weight** (GitHub): AI interactions as full expandable cards, revision snapshots as compact inline rows, auto-grouped when rapid
- **Type badges**: Colored pills — AI (blue/purple), PASTE (orange), SESSION (green), REVISION (gray)
- **Each event follows actor-verb-object** (Linear): "AI generated 2 paragraphs in Section 3 — 2:34 PM"
- **Filter chips** above timeline: All, AI Interactions, Paste Events, Sessions
- **Expanded AI interaction cards** show: the exact prompt, the AI response, the diff of what changed, and the writer's decision (accepted/rejected/modified)
- **Auto-group rapid revisions**: Batch 30-second snapshots into "N revisions over X minutes" blocks
- **Date separators** for multi-day writing processes

### "About This Verification" Panel

Following Google's "About this result" pattern, include a drawer explaining:

- What is measured (process-level deterministic logging)
- What is *not* measured (detector claims, intent, external copying)
- How the percentage is computed (in plain language)
- The difference between Provenance and probabilistic AI detectors

### Mobile Verification

The verification page is often the first touchpoint (clicked from a blog post on mobile). Design mobile-first.

- **Hero card**: Top 40% of viewport — large AI percentage, document title, author, date. Distinctive brand color background. **Screenshot-friendly** (designed to look good when shared as an image)
- **Single-column layout only**. 44px minimum tap targets. No horizontal scrolling
- **Expandable accordion sections** for timeline, document text, methodology
- **Relative timestamps** ("2 days ago") with absolute on long-press
- **Sticky header** with branding and badge ID
- **Skeleton loading** for perceived performance

---

## Dashboard Recommendations

### Layout

Full-width rows (Linear/Vercel style), **not cards** — text documents don't benefit from thumbnails the way Figma files or Vercel deployments do.

```
┌──────────────────────────────────────────────────────────────┐
│ [●]  Document Title                              3 days ago  │
│      First line of content preview...            2,847 words │
│      [Badge: 12% AI] [Badge: 8% AI]                         │
└──────────────────────────────────────────────────────────────┘
```

### Key Elements

- **Status dot**: Draft (gray), Has Badge (green/brand color), Archived (muted)
- **AI% chip**: Small inline indicator per document
- **Badge pills**: Show generated badges with their AI percentages
- **Content preview**: 1–2 lines of text (Bear pattern) — aids document recognition
- **Relative dates**: "Today," "Yesterday," "3 days ago"

### Navigation & Organization

- **Cmd+K command palette** as primary navigation
- **Sort/filter tabs**: All / Drafts / Has Badge / Archived
- **Recency-first** default sort (Figma pattern)
- **Lightweight spaces/collections** for organization (Arc model) — not heavy folder hierarchies
- **Fast search** with filters: "Published badges," "High AI%," "Recently edited"
- **First-class Archive action** (Bear pattern) — between keeping and deleting

### Potential Advanced View

Optional multi-view database (Notion model): table view with sortable columns (AI%, word count, status, badges published) for writers who want analytics. But default to the simple list.

---

## Badge Recommendations

### Visual Design

Two-segment shields.io format, rendered as SVG:

```
[Provenance ✓ | 23% AI-assisted]
```

- **Neutral brand color** (blue/indigo) — not green/red
- **Fixed height** (~20px), rounded corners, clean sans-serif
- **Small icon** (checkmark or shield) for accessibility beyond color
- **No gradients, no hype** — intentionally boring signals competence
- **Alt text as fallback** for platforms that strip images

### Integration

- **URL-is-the-API**: `provenance.io/badge/[document-hash].svg` for trivial embedding
- **Always clickable**: Links to the canonical verification page
- **Embed snippets**: HTML and Markdown copy buttons
- **Variant sizes**: Inline (for body text), standard (for headers), expanded (with document title)

### Pre-Publish Review Flow

The "preview what becomes public" step is critical for trust:

1. **Warning banner**: "Everything below will be publicly visible to anyone with the badge link"
2. **Public snapshot preview**: Rendered document as it will appear
3. **"What will be disclosed" checklist**: AI prompts/responses? Timeline granularity? Sessions? Sensitive content highlighted
4. **Diff from private draft**: What gets included vs. what stays private (if redaction is supported)
5. **Two-click confirmation**: "Generate Badge" opens preview → "Confirm & Generate" executes
6. **Permanence statement**: "This badge is permanent and cannot be modified after generation" — factual, not scary
7. **Post-generation**: Show embed code and share URL immediately

---

## Anti-Patterns to Avoid

### Highest Priority (flagged by all three analyses)

1. **Auto-apply or auto-accept AI edits** without explicit review controls — trust collapses instantly (documented in Cursor/Windsurf community reports)
2. **Single-number theater** — showing "AI %" without definitions, breakdown, and scope caveats will cause the number to be misused as a moral/quality metric
3. **Code-style diffs for prose** — red/green line-based diffs are wrong for flowing text; use track-changes styling
4. **Over-marking the editor** — too many highlights/underlines in the default writing experience feels punitive and accusatory; save density for the Provenance Lens toggle
5. **Ephemeral AI history** — every competitor loses AI interaction data after acceptance; never degrade, summarize, or expire Provenance's audit data

### High Priority

6. **Hidden scope** — users must never wonder "is this rewriting my selection or my whole doc?" Every AI surface needs a persistent scope indicator
7. **All-or-nothing acceptance** — forcing accept/reject on entire suggestions with no middle ground; always provide per-sentence/word-level acceptance and alternative cycling
8. **Modal interruption** — any AI interaction that takes the user out of the document breaks writing flow; everything should be inline or in a non-modal side panel
9. **Overactive ambient suggestions** — ghost text appearing mid-thought is worse for prose than code; AI suggestions should only activate during natural pauses
10. **Flat timeline with no grouping** — showing every 30-second revision individually overwhelms the verification page; auto-group rapid events into session blocks

### Design Quality

11. **Performative trust signals** — over-designed "verified" badges that look like marketing graphics (gradients, shadows) feel like self-certification rather than neutral verification
12. **The "AI is bad" visual framing** — green for human / red for AI implies judgment; follow C2PA's neutral color approach
13. **Technical jargon on verification pages** — JSON payloads, raw timestamps, internal IDs on the default view; use plain language for the non-technical audience
14. **Emoji as icons** — replace with consistent SVG/Lucide icons matching shadcn/ui
15. **Desktop-first verification** — the verification page is most often viewed on mobile; design mobile-first, then expand

---

## Novel Opportunities

These are capabilities no existing tool offers, enabled uniquely by Provenance's combination of writing + AI + verification:

### 1. Living Origin Map
Select any span of text → tooltip shows its full provenance: "AI-generated via Claude, Feb 15 at 2:34 PM, prompt: 'make this more concise', 83% of original preserved." No other tool tracks or displays this. This transforms the editor from a writing surface into a transparency surface.

### 2. Writing Process Replay
A time-lapse visualization on the verification page showing the document being written — human typing, AI insertions, edits, deletions, and revisions as an animated timeline. Turns verification into shareable content. Like watching a game replay, but for writing.

### 3. Provenance-Aware AI Assistant
The AI assistant could see the current AI percentage and adapt: "Your document is currently 40% AI-generated. Would you like me to suggest edits that help you integrate the AI text in your own voice?" No other AI tool is self-aware about provenance.

### 4. Authorship Spectrum Visualization
Move beyond the binary (human vs. AI) to show the reality: AI-generated and unchanged, AI-generated but human-edited, human-written but AI-refined, human-written with AI grammar fixes, fully human-written. Visualize as a gradient bar or Sankey diagram. This communicates how modern AI-assisted writing actually works.

### 5. Comparative AI Metrics Across Documents
Author-level dashboard showing AI usage trends: "Your AI usage has decreased from 45% to 12% over the past 6 months." Or per-document badge comparison: "Badge 1: 23% AI → Badge 2: 12% AI." Longitudinal transparency builds author credibility over time.

### 6. Writer's Process Signature
Over multiple documents, build a characteristic writing pattern — average session length, typical AI usage, revision density. This becomes a trust signal itself: "This writer typically uses 10–15% AI assistance and writes in 3–4 sessions." Pattern consistency builds credibility beyond any single document.

### 7. Verification Page as Narrative Content
Make the verification page genuinely interesting to read: "This piece was written over 3 days in 5 sessions. The author used AI 8 times, primarily for research questions. 3 AI suggestions were rejected. The longest uninterrupted writing stretch was 45 minutes." Turns verification into content worth sharing.

### 8. Patch Lineage for Prose
Treat every AI interaction as a patch with a stable ID. Origin highlights deep-link to the patch, and the verification page shows exact diffs. This is the GitHub PR model applied to prose — a genuinely novel concept.

### 9. Verification-as-Metadata for Discovery
Embed verification data as structured metadata (JSON-LD, C2PA manifest) that search engines and platforms consume. This positions Provenance not just as a writing tool but as infrastructure for the emerging content authenticity ecosystem.

---

## Implementation Priority Matrix

Based on the convergence analysis, here's a suggested priority ordering:

### Phase 1: Core Editor (Highest Differentiation)
- Inline diff with track-changes styling (not code diffs)
- Accept/Reject/Accept-with-edits per suggestion
- Multiple alternatives for rewrites
- Origin marks (human/AI/paste) with Provenance Lens toggle
- Side panel with Ask vs. Edit modes

### Phase 2: Verification Page (Primary Value Demonstration)
- Hero stat with stacked bar visualization
- Session-grouped audit timeline with type badges
- "About this verification" methodology panel
- Mobile-first responsive layout
- Filter chips for timeline events

### Phase 3: Badge & Pre-Publish (Trust Signal)
- shields.io-format embeddable badge (SVG)
- Pre-publish review hub with consequence warning
- Two-click confirmation flow
- Embed snippet generation (HTML/Markdown)

### Phase 4: Dashboard (Workflow Efficiency)
- Full-width row list with metadata (AI%, status, word count)
- Cmd+K command palette navigation
- Sort/filter tabs (All/Drafts/Has Badge/Archived)
- Recency-first with lightweight collections

### Phase 5: Novel Features (Competitive Moat)
- Living Origin Map
- Writing Process Replay
- Comparative AI Metrics
- Provenance-aware AI suggestions
- Writer's Process Signature

---

## Sources & Methodology

This synthesis combines three independent research passes:

1. **Claude Deep Research**: Broadest scope (30+ tools), narrative analysis with design philosophy emphasis, strong on trust/verification patterns and novel opportunities
2. **Claude Code (UI_RESEARCH.md)**: Most structured and implementation-ready, includes ASCII wireframes and specific component recommendations, added Bear/Craft/Obsidian/Slack analyses not in other sources
3. **ChatGPT**: Most citation-heavy with direct links to documentation, strongest on specific tool interactions (Cursor review flows, Windsurf Command/Cascade distinction, Zed transparency philosophy)

All three analyses were conducted independently and arrived at substantially the same conclusions, which increases confidence in the recommendations. Where analyses diverged, the differences were additive (covering different tools) rather than contradictory.
