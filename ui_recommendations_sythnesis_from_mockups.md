Now I have the full picture. These mockups are already quite strong — they clearly incorporate patterns from the research (session-grouped timeline, type badges, track-changes diffs, shields.io badges, mobile-first verification). Here are the specific modifications I'd prioritize, organized by impact.

---

## High-Impact Changes

### 1. Badge Color Scale: Remove the Green-to-Red Gradient

This is the single most important change. Your badge variations use a green→amber→orange→red scale keyed to AI percentage, which directly contradicts the strongest recommendation from all three analyses. This framing implies 0% AI = good (green) and 95% AI = bad (red), which undermines Provenance's core philosophy of being "the court reporter, not the judge."

**Modification**: Use a single **neutral brand color** (your provenance-600 indigo/blue) for all badge values regardless of percentage. The badge communicates "this has been verified," not "this amount of AI is acceptable." If you want visual variation, vary the *text* (percentage number) but keep the color constant. The C2PA spec deliberately avoids traffic-light semantics for exactly this reason.

Same applies to the verification page hero stat — the emerald green gradient on "12%" implies that's a "good" number. Switch to your brand indigo or a neutral gray.

### 2. Verification Page: Add the Stacked Bar Visualization

Your current verification page shows 12% and 88% as separate stat cards, which requires mental math and doesn't communicate the part-to-whole relationship. All three analyses recommend a **horizontal stacked bar** directly adjacent to the headline number.

**Modification**: Replace the current 5-column stats grid with a hero section that has the percentage + a single horizontal bar showing the AI/human proportion, followed by a secondary stats row for sessions, interactions, and time. The bar makes the proportion instantly scannable and is more accurately read than comparing separate number cards.

### 3. Inline AI: Add "Keep Original" as a First-Class Option

Your inline AI mockup shows Accept and Reject buttons, but "keep original" isn't visually co-equal with "accept suggestion." The Wordtune research strongly suggests that writers need to see their original text as an equally valid choice, not just the absence of accepting something.

**Modification**: Change the action bar to three co-equal buttons: **Keep Original** | **Use Suggestion 1** | **Use Suggestion 2**, with the currently-active alternative highlighted. This shifts the mental model from "accept/reject this AI change" to "choose among options including your own text." It's a subtle but important framing difference for a transparency tool.

### 4. Editor: The Provenance Lens Toggle Needs to Be More Prominent

The origin marks legend (Human/AI/Pasted dots) is in the toolbar, but there's no clear toggle between "writing mode" (clean) and "provenance mode" (marks visible). The research unanimously recommends this separation.

**Modification**: Add a toggle switch or segmented control in the toolbar — something like `[Write] [Review]` — that switches between a clean editor surface and the origin-marked view. In Write mode, AI/paste tints are invisible. In Review mode, they appear. This prevents the "Christmas tree" effect while writing and makes the provenance layer feel intentional rather than ambient.

### 5. AI Percentage: Co-Locate the Methodology Explanation

On both desktop and mobile verification pages, the methodology explanation is in a separate collapsed section far below the hero stat. But the research consistently says the definition needs to be **immediately adjacent** to the number to prevent misinterpretation.

**Modification**: Add a small "ⓘ" info icon or "How is this calculated?" link directly next to the "12% AI-Generated" text on both pages, inline, that expands a brief tooltip or drawer. Don't make people scroll to "Methodology" to understand what the number means. Google's "About this result" pattern works precisely because the context is co-located with the claim.

---

## Medium-Impact Changes

### 6. Verification Page: Add a Plain-Language Summary Sentence

Between the title and the stats grid, add a single human-readable sentence: *"Of 2,847 words, approximately 340 were generated or substantially rewritten by AI. The remaining 2,507 words were written by the author."* This is the most effective anti-misinterpretation pattern identified in the research — specificity in plain language prevents the percentage from being read as a quality judgment.

### 7. Timeline: Add "Modified" Expansion Detail

Your timeline correctly shows Accepted/Rejected/Modified status badges, but the "Modified" state is the most interesting for verification and currently gets no special treatment. When a writer accepts AI text but edits it, that's the richest audit signal.

**Modification**: For "Modified" events, the expanded card should show a three-part view: (1) the AI's original suggestion, (2) what the writer changed, and (3) the final text. This is the patch lineage concept — it shows the writer actively engaging with AI output rather than rubber-stamping it.

### 8. Badge Preview: Highlight What's Sensitive More Aggressively

Your badge preview correctly calls out AI interactions and paste events with colored borders, but the warning is subtle. The research suggests the pre-publish review should make writers slightly uncomfortable about what's becoming public — in a good way.

**Modification**: Add a yellow/amber banner at the top: *"Your AI prompts and responses will be publicly visible"* — not as a collapsed detail, but as an always-visible callout. The current "Your prompts and AI responses will be public" text is inside a collapsed section header, which many users will skip. The sensitive content preview is the whole point of this step.

### 9. Dashboard: Add a Keyboard Shortcut Hint

Your search bar says "(Cmd+K)" which is great, but the dashboard doesn't surface other keyboard shortcuts. The Linear research shows that hover-to-discover shortcuts (showing `⌘N` on hover over "New Document," `⌘⌫` on hover over document rows) dramatically accelerate power user adoption.

### 10. Mobile: Make the Hero Card Screenshot-Friendly

Your mobile hero stat uses a gradient background, which is good. But consider adding the document title *inside* the hero card rather than above it, so a screenshot of just the card captures both the title and the stat. Mobile verification pages get screenshotted and shared — the card should be self-contained.

---

## Lower-Priority Refinements

### 11. Timeline Minimap Labeling
The minimap is a strong addition, but the start/end labels ("Feb 15" / "Feb 16" / "Badge") could be more informative. Consider adding total word count progression markers or session boundary indicators on the minimap itself.

### 12. Editor Ghost Text Placement
Your ghost text mockup shows continuation at the end of a paragraph, which is correct. But consider adding a very subtle "Tab to accept" hint near the cursor — Copilot and Cursor both do this, and discoverability of ghost text acceptance is a known problem.

### 13. Badge Style Selection
Of your three badge styles, Style A (shields.io) is the strongest per the research. Style B (branded compact) is a good secondary option. Style C (minimal text) is too subtle to function as a trust signal — it won't be recognized. I'd drop C and keep A as default with B as an alternative.

### 14. Desktop Verification Page Header
Your header shows "Verified Writing Process" next to the Provenance logo, plus a badge ID. Consider adding the verification date here too — "Verified Feb 16, 2026" — since the header is the first thing readers see and the date establishes temporal context for the audit.

### 15. Scope Indicator on Inline AI
The floating AI toolbar (Improve/Simplify/Expand/Fix) doesn't show what scope it's operating on. The ChatGPT research specifically recommends adding a scope badge — `Selection` vs `Paragraph` vs `Document` — to every AI surface so writers always know what's being affected. Add a small pill showing "Selection" in the floating toolbar.

---

The mockups are already well-grounded in the research. The badge color issue (#1) and the co-located methodology (#5) are the two I'd fix before anything else — they directly address the biggest trust and misinterpretation risks the research identified.