# Authorship Badge Redesign

Redesign the badge and verification page headline to accurately communicate authorship using 4 honest categories, replacing the current "% AI-assisted" metric with word-level attribution.

**Status:** Proposal
**Date:** 2026-03-08

---

## Problem

The current badge shows a single "X% AI-assisted" number derived from character-level Levenshtein distance with a binary 20% threshold. This is misleading in several ways:

1. **"AI-assisted" is too vague.** It doesn't distinguish between "AI wrote my intro from scratch" and "AI tightened three sentences I wrote." Those are fundamentally different acts of authorship collapsed into one number.

2. **The threshold is blunt.** AI reformatting paragraphs (high edit distance, same words) and AI rewriting sentences (high edit distance, different words) are treated identically. The metric measures character similarity, not authorial control.

3. **Pasted content is presented as a known category.** The tool can't determine where pasted content came from — it could be the writer's own notes, a source quote, or laundered ChatGPT output. Showing it on equal footing with tracked categories implies confidence the tool doesn't have.

4. **A single percentage can't capture what readers actually want to know.** The core question isn't "how much AI?" — it's "how much did the writer do?"

---

## Design Principles

### The badge is a single honest fact

The badge needs to work at 200x40px in a blog post footer or a tweet. It can't be a narrative. It should show one number that answers: **what percentage of this text did the writer type or substantively create?**

### The verification page tells the full story

Detail, nuance, and context belong on the verification page — not the badge. The badge gets people there; the page earns their trust.

### The tool is the court reporter, not the judge

We report what we observed. We don't pass judgment on whether AI usage was "good" or "bad." Categories are descriptive, not evaluative.

### Honest about uncertainty

Where the tool can't determine origin (pasted content), it says so explicitly rather than guessing.

---

## The 4 Categories

Every word in the final document is classified into exactly one category:

### 1. Human typed
Words the writer typed with their own keystrokes that were never processed by AI.

**How we know:** Text entered via keyboard with no origin mark, or text that has `origin:human` and `touchedByAI:false`.

**Confidence:** High. The tool observed the keystrokes.

### 2. AI generated
Words that AI produced (from a prompt or generation request) that the writer kept without modification.

**How we know:** Text has `origin:ai` and the words match the original AI response. When a writer later edits an AI-generated span, new words typed by the writer split off into "Human typed" and only the surviving AI words remain in this category.

**Confidence:** High. The tool recorded the AI interaction and the text matches.

### 3. Pasted from outside
Words pasted from outside the app. Origin is unknown and unverifiable.

**How we know:** Text entered via paste event classified as `external` by the paste handler. Content pasted from the app's own AI panel is correctly classified as AI-originated, not external.

**Confidence in detection:** High (we saw the paste event). **Confidence in origin:** None (we don't know where it came from).

### 4. AI tweaked
Words the writer originally typed, which were then processed by AI (rewrite, rephrase, reorganize, etc.). The writer's ideas went through AI transformation. This is the "unsure" category — the words may be mostly the writer's with AI polish, or mostly AI's rewrite of the writer's intent.

**How we know:** Text originated as human-typed (`origin:human`), was selected and sent to AI, and the AI response was accepted. Word-level diff between the original selection and the AI response identifies which words survived from the writer's input.

**Confidence:** Medium. We know AI processed it. We can't determine how substantive the changes were in terms of meaning.

---

## Badge Design

The badge shows the "human typed" percentage as the primary number:

```
 ________________________________
|  ✎ 72% typed  ·  Provenance   |
|________________________________|
```

- **"72% typed"** — the percentage of words in the final document that the writer typed and AI never touched. This is the one metric the tool can report with total confidence.
- **Color** maps to the typed percentage as information density, not judgment. A consistent gradient that becomes recognizable over time as people see more badges.
- Clicking the badge goes to the verification page where all 4 categories are shown with full context.

### Why "% typed" and not "% authored"

"Authored" implies a judgment about creative ownership that the tool can't make. "Typed" is a physical fact — the writer either pressed the keys or they didn't. It's less informative but inarguably true. For a product built on trust, defensible truth beats informative approximation.

---

## Verification Page — Glance Section

The top of the verification page shows the full 4-category breakdown:

```
 _______________________________________________________________
|                                                               |
|                     72% typed by the author                   |
|                                                               |
|  ████████████████████████████░░░░░░░▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒++++     |
|  Human typed (72%)  AI generated (8%)  AI tweaked (12%)       |
|  Pasted from outside (8%, origin unverifiable)                |
|                                                               |
|_______________________________________________________________|
```

Key design decisions:

1. **All 4 categories are shown in one horizontal segmented bar.** Human typed, AI generated, AI tweaked, and pasted from outside each get their own segment, consistent with the current verification layout.

2. **One denominator for all displayed percentages.** Every percentage is calculated from `totalWords = humanTyped + aiGenerated + aiTweaked + pastedExternal`.

3. **Pasted content remains explicitly uncertain.** It is a first-class metric segment, but always labeled as origin-unverifiable.

4. **AI tweaked is labeled honestly.** No claim about whether the tweaks were substantive. The detail layers below explain what happened.

---

## Word-Level Diff Mechanism

### Internal Data Model

Extend the existing ProseMirror origin mark with one additional flag:

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `origin` | `human` / `ai` / `external_paste` | Who created the words (existing) |
| `touchedByAI` | `boolean` | Whether AI ever processed this span (new; primarily splits human text into typed vs tweaked) |
| `sourceId` | `string` | Links to specific interaction/paste event (existing) |
| `originalText` | `string` | Original text before transformation (existing) |

The 4 user-facing categories derive from these rules:

| Rule | Category |
|------|----------|
| `origin:external_paste` (any `touchedByAI`) | Pasted from outside |
| `origin:ai` (any `touchedByAI`, including missing/false in legacy content) | AI generated |
| `origin:human` + `touchedByAI:true` | AI tweaked |
| `origin:human` + `touchedByAI:false` or missing | Human typed |

Legacy compatibility rule: if `touchedByAI` is missing, treat it as `false` for `origin:human`; ignore it for `origin:ai` and `origin:external_paste`.

### When Diffs Run

**At interaction time** — when the writer accepts an AI suggestion. This is the moment we have the exact `selectedText` and `response`. Badge generation reads the already-computed marks.

### Diff Algorithm

1. **Tokenize** both `selectedText` and AI `response` using `Intl.Segmenter` with `{ granularity: "word" }`. Keep only `isWordLike` tokens. Normalize (NFKC, collapse whitespace) for matching.

2. **Myers diff** on the token arrays (via `jsdiff`). This produces a shortest edit script identifying kept, added, and removed words.

3. **Apply marks with lineage preservation** based on the diff output:
   - **Kept words** (present in both input and output): preserve each word's existing `origin` from the selected input text, and set `touchedByAI:true`.
     - `origin:human` + `touchedByAI:true` -> AI tweaked
     - `origin:ai` + `touchedByAI:true` -> AI generated (AI-origin text that survived another AI pass)
     - `origin:external_paste` remains external paste (still origin-unverifiable)
   - **Added words** (only in AI output): set `origin:ai, touchedByAI:true` (AI generated).
   - **Removed words** (only in input): removed from the document; no mark is emitted.

   **Important:** "kept" means token continuity, not authorship transfer. Kept tokens must never be relabeled to `origin:human` unless the user typed new text.

4. **Merge adjacent spans** with identical `{origin, touchedByAI}` into single marks to avoid ProseMirror node fragmentation.

### Scenario: AI generates from prompt, writer later edits

No diff needed at edit time. The AI-generated text is already marked `origin:ai`. Manual keyboard edits inside that span must be normalized so newly typed characters are recorded as human-authored (`origin:human` or unmarked), while unchanged surrounding AI words retain `origin:ai`. This is an explicit invariant and must not rely on default mark inheritance behavior.

### Scenario: Chains (human → AI → human edit → AI again)

Each AI interaction runs the diff against whatever text is currently selected. The marks update incrementally:
- Human text sent to AI → diff determines kept vs. new words
- If the result is later selected and sent to AI again → same process, marks update again
- `touchedByAI` is sticky — once true, always true for that span
At each AI pass, surviving tokens retain prior `origin`; only `touchedByAI` is updated to `true` if not already set.

### Reordering Policy

If the writer asks AI to reorganize paragraphs: the entire replaced range gets `touchedByAI:true`. Words that survived from the original are "AI tweaked." New words are "AI generated." This is the simpler approach — move-aware matching is deferred.

Known limitation (v1): move-aware matching is not implemented for AI rewrite accepts. In reordering-heavy AI transforms, some moved words may be classified as "AI generated" (additions) instead of "AI tweaked" (survivors) because word-level diff treats moves as delete+add. This does not affect manual in-editor copy/paste moves, which preserve provenance through internal clipboard markers.

---

## What Changes

### Mark schema
- Add `touchedByAI: boolean` to the existing origin mark definition

### Accept handler (InlineAI)
- Run word-level diff between `selectedText` and `response`
- Apply split marks (human-touched-by-AI vs. new-AI) instead of one blanket `origin:ai` mark
- Merge adjacent identical spans

### Editor input normalization
- Enforce that keyboard-typed insertions do not inherit non-human origin marks (`ai` / `external_paste`)
- Preserve non-origin formatting marks (bold/italic/link) on typed text
- Keep paste-handler behavior unchanged for external, AI-internal, and internal-document paste paths

### `calculateMetrics` (metrics.ts)
- Read two-flag marks and bucket into 4 categories
- Count words (not characters) per category
- Output: `{ humanTyped: number, aiGenerated: number, aiTweaked: number, pastedExternal: number }`
- Derive `totalWords = humanTyped + aiGenerated + aiTweaked + pastedExternal`
- Derive percentages for all 4 categories using `totalWords` as the denominator
- For empty documents (`totalWords = 0`), return `0` for all percentages

### Badge stats schema
- Replace `ai_percentage` / `external_paste_percentage` with 4-category counts and percentages computed from `totalWords`
- Migration decision: remove legacy badges and legacy stats entirely at cutover (March 8, 2026). Pre-cutover badge records are deleted rather than re-rendered or maintained.

### StatsSummary component
- Keep the current horizontal layout and interaction model
- Update inputs, labels, and calculations to show the 4-category breakdown per the glance section model above
- Render a 4-segment horizontal bar including pasted from outside as a distinct segment

### Badge image generation
- Update to show "X% typed" instead of "X% AI-assisted"

---

## What We're NOT Doing

- **Semantic similarity or LLM-based classification.** Pure word-level diffing only.
- **Move-aware paragraph matching.** Reordering counts as AI-touched. Simpler, honest, deferrable.
- **Splitting "AI tweaked" further.** Single bucket for now. Internal data supports future refinement.
- **Changing how paste events are detected.** The existing `ai_internal` vs `external` classification works.
- **Judging whether AI usage was "good" or "bad."** Court reporter, not judge.

---

## Open Questions

1. **Badge color scheme.** What gradient/color maps to the "% typed" number? Needs design exploration.
2. **Threshold for "AI tweaked" label.** If AI only changed punctuation, does it still count as "tweaked"? Current plan: yes, because `touchedByAI` is binary. Worth revisiting if users find it misleading.
3. **Word vs. character counting.** This spec proposes counting words for the user-facing percentages (more intuitive) but the diff operates on word tokens. Need to confirm this doesn't create edge cases with very short documents.
