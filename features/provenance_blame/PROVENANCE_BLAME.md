# Provenance Blame (Origin Explorer)

A `git blame`-style inspector for writing provenance: click any sentence and see exactly where it came from (human-typed vs external paste vs a specific AI interaction), plus the minimal evidence needed to verify that origin.

This turns verification from “scroll an audit trail” into “spot-check the most important parts of the text in seconds.”

---

## Why This Feature

### It fixes the verifier’s core job-to-be-done

Most readers don’t want to watch the full process. They want to answer one question fast:

> “Did the writer stay in control of *this* claim / paragraph / conclusion?”

A timeline is chronological, not navigable. “Provenance Blame” makes provenance **queryable by text**, which is how people actually verify.

### It’s radically accretive

This feature makes every existing and future provenance feature compound:

- The **final artifact** (document text) becomes a map into the **process** (AI logs, paste events, revisions).
- The audit trail becomes useful *because it’s indexable*, not just because it exists.
- It produces a shareable moment: “Click the conclusion → see the prompt → see the accept/modify decision.”

### It’s buildable with current primitives

Provenance already tracks:

- Text origin via TipTap `origin` marks (AI / external paste / human default)
- `ai_interactions` (prompt, response, action, diff)
- `paste_events` (content)
- `revisions` (snapshots)

“Blame” is a **presentation + lookup layer** over data we already store.

---

## What It Is (Concept)

“Provenance Blame” is an **Inspect mode** (a toggle) available in:

- The editor (writer-only; private)
- The public verification page (badge snapshot; public)

When Inspect mode is on:

1. The document surface becomes clickable/hoverable.
2. Clicking a span selects the smallest provenance-bearing range.
3. A panel (desktop) or bottom sheet (mobile) shows a compact origin card:
   - **Origin:** Human / AI / External paste
   - **When:** timestamp (and session, if available)
   - **Evidence:** links to the underlying recorded event(s)

### “Blame Card” examples

**AI-origin span**
- “AI text” label + provider/model (from `ai_interactions`)
- Prompt + response (progressive disclosure)
- Writer action: accepted / modified / partially accepted / rejected
- If accepted/modified: inline diff of what entered the document

**External paste span**
- “External paste” label
- Pasted content snippet (with disclosure: “Provenance cannot verify origin of pasted text”)
- Timestamp + session context

**Human-typed span**
- “Human-typed (unmarked)” label
- Timestamp (best-effort; see “Limitations”)

---

## UX Principles

- **Verification-first:** default card is minimal; deeper details expand (C2PA progressive disclosure model).
- **Neutral framing:** no green/red “good/bad” judgments; Provenance is a court reporter.
- **Fast spot-check path:** “Click → understand → optionally expand” in < 5 seconds.
- **Respect public/private boundaries:** on public pages, show only what is included in the badge snapshot record.

---

## Data & Mapping Model

### Primary mapping (span → source event)

TipTap `origin` marks already support:

- `type`: `"ai"` | `"external_paste"` | `"human"` (implicit when absent)
- `sourceId`: identifier of the originating event (AI interaction id or paste event id)
- `originalLength`, `originalText` (optional)

**Blame lookup**:
- If `origin.type === "ai"` → fetch `ai_interactions` by `id === sourceId`
- If `origin.type === "external_paste"` → fetch `paste_events` by `id === sourceId`
- If no origin mark → treat as human-typed (no event lookup)

### Handling “modified AI text”

There are two viable v1 approaches:

1. **Conservative:** keep AI mark until it crosses the existing “human takeover” threshold, then remove mark (becomes human).
2. **Explicit:** introduce a `"modified_from_ai"` origin type that keeps the `sourceId` and stores `originalText` to show “started as AI, then rewritten.”

Either approach should be consistent with the methodology shown on verification pages.

---

## Implementation Shape (Non-Spec)

### Editor

- Add an “Inspect” toggle (likely alongside the Provenance Lens toggle).
- On click, read marks at selection/cursor to determine origin.
- Render a right-side panel showing the blame card and deep links to the full interaction in the audit trail.

### Verification Page

- Enable clicking within the public document text.
- Open a mobile-friendly bottom sheet with the blame card.
- Provide “View in timeline” jump links (scroll timeline to the matching event).

### API / Data fetching

- Minimal endpoints to fetch a single AI interaction or paste event by id, scoped to:
  - Writer-private views (requires auth + ownership)
  - Public views (requires badge verification id + snapshot constraints)

---

## Scope Boundaries & Limitations

- Provenance Blame shows what Provenance observed. It does **not** prove that:
  - text wasn’t retyped from external AI
  - the published version matches the snapshot
  - pasted text’s upstream origin is authentic
- “Human-typed” timestamps may be best-effort unless keystroke-level attribution exists; v1 can still be useful without perfect timing.

---

## Why This Is “Radically Innovative”

Most provenance systems are metadata you read *about* a document. “Provenance Blame” makes provenance something you can **navigate through the document itself**.

It’s the difference between:
- a log you can scroll, and
- a map you can use.

