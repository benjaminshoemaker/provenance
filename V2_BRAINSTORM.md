# V2 UI Brainstorm

## Documents Page

- **Empty state**: When a user has no documents, show an encouraging empty state that drives them to create their first document. Not just a blank page — something that communicates the value prop and makes the first action obvious.

## Editor

- **Audit trail panel**: A vertical section to the right of the main editor showing the audit trail as it builds. Collapsible. Doesn't need real-time updates — refresh every ~10 seconds with the full trail.
- **AI chat panel**: Always available but collapsible. The "Chat with AI" conversational interface should be accessible without leaving the editor.
- **Model switcher**: A model selector directly in the AI sidebar — users are familiar with this pattern from ChatGPT, Claude, and similar tools. Let users pick the model (e.g. fast vs. capable) without leaving the writing context.
- **IDE-style pane layout**: Multiple panes (audit trail, AI chat) that can be expanded and retracted independently, similar to how VS Code or other IDEs handle sidebar panels. The writer controls what's visible based on what they need at the moment.

---

## User Flow Research (Updated Feb 2026)

### What Changed Since Early 2025

| Dimension | Early 2025 | February 2026 |
|-----------|-----------|----------------|
| **Adoption** | ~30% of authors experimenting | ~45-67% actively using AI in workflows |
| **Workflow pattern** | "Write it for me" prompting | Four-phase collaboration: capture → research → draft → edit |
| **Dominant tools** | ChatGPT dominance | Claude + ChatGPT dual-tool workflows; specialized tools (Sudowrite, NovelCrafter) maturing |
| **Voice matching** | Basic prompt engineering | Upload samples for automatic style analysis; persistent voice profiles (Claude Custom Styles, etc.) |
| **Reader trust** | Mild skepticism | Suspected AI content reduces trust ~50%; "human-first premium" emerging |
| **Labels/certification** | Not By AI badge (grassroots) | Authors Guild "Human Authored" certificate; UK Society of Authors registry planned |
| **Detection** | GPTZero/Originality improving | 99%+ for raw AI text but defeated by humanizers; detection recognized as a losing battle |
| **Provenance standards** | C2PA focused on images/video | C2PA 2.2-2.3 adds text format support; still the least mature content modality |
| **Regulation** | EU AI Act passed but not enforceable | Article 50 enforceable August 2026; Code of Practice being finalized |
| **Market signal** | AI = efficiency gain | Transparency about AI use = trust currency; provenance = competitive advantage |

### The Big Picture (2026)

~45-67% of authors now actively integrate AI. But the dominant shift is from "write it for me" to **"think with me."** The bottleneck moved from producing words to deciding which words matter. Successful writers treat AI as an editorial board, not a ghostwriter.

The consensus 2026 workflow is four phases:
1. **Capture raw thinking** — voice notes, brain dumps, freewriting (human-only)
2. **Research strategically** — AI maps landscapes, identifies gaps, synthesizes sources
3. **Draft collaboratively** — human writes rough, then requests targeted micro-edits
4. **Edit with AI as sparring partner** — test arguments, tighten prose, pressure-test logic

### The "Human-First Premium" (New in 2026)

This is the most market-relevant trend for Provenance:

- Suspected AI-generated content **reduces reader trust by ~50%** and purchase consideration by 14%
- A **"human-first premium shift"** is underway — audiences increasingly assume AI involvement unless authors clearly demonstrate personal expertise
- The **Authors Guild** launched a "Human Authored" certificate logo for its 15,000 members
- The **UK Society of Authors** is planning a Human-Authored registry later in 2026
- **"Not By AI"** badges have become a grassroots movement across blogs and newsletters
- Spending on premium human writing has **increased year-over-year** in early 2026
- Companies like iHeartMedia promote "100% human" marketing

**Key insight:** The binary "human vs. AI" framing is insufficient. Writers need a way to show nuanced collaboration: "I wrote this. AI helped me refine it. Here's the proof." This is exactly what Provenance does.

### Detection Is a Dead End

- GPTZero: 99.3% accuracy on raw AI text, but only **18% detection rate** on text run through humanizer tools
- The MLA-CCCC Joint Task Force recommends process tracking (keystroke logging, version history, timing data) over AI detection, which they call "inaccurate, biased, easily circumvented, and not transparent"
- **Process-based provenance beats detection.** Both academia and standards bodies (C2PA, VeritasChain) are converging on documenting how content was made rather than trying to detect AI after the fact.

### EU Regulation Is a Forcing Function

- **EU AI Act Article 50** becomes enforceable **August 2, 2026** — AI-generated text must be marked in machine-readable format
- The EU Code of Practice (final version June 2026) requires recording and embedding origin/provenance chains for AI-assisted content
- Tools that bake provenance in from the start will have a regulatory advantage

### Table Stakes vs. Differentiating Features (2026)

**Table stakes (baseline expectations):**
- Grammar checking and real-time editing
- Tone adjustment and style control
- Inline AI editing (highlight text, request edits within the document)
- Cross-platform availability
- Basic collaboration features

**Differentiating:**
- Large context windows (50K+ tokens) for consistency across long documents
- Voice matching / custom style training from writing samples
- Research integration with citations
- Multi-input flexibility (documents, URLs, voice, not just text prompts)
- Argument pressure-testing and logical gap identification
- Session tracking that captures writing profile and draft progress

### The Five Phases of Writing & AI's Role

#### Phase 1: Research & Ideation
- Summarizing source material (papers, articles, transcripts)
- Exploring angles the writer hadn't considered
- Fact-finding (with manual verification)
- **Trigger:** Information overload, starting from zero on unfamiliar topic
- **Key insight:** AI is never used for primary source gathering — only synthesis

#### Phase 2: Outlining & Structuring
- Converting rough notes into organized outlines
- Generating multiple structural options, then synthesizing the best elements
- **Trigger:** "I have all these ideas but don't know how to organize them"
- **Key insight:** Forcing structured outlines before writing feels unnatural to many writers. Tools must fit existing cognitive workflows.

#### Phase 3: Drafting
- Breaking writer's block by generating rough starting points to react to
- Generating 2-3 alternative directions for a stuck section
- Voice-to-text cleanup (rambling transcripts → usable draft text)
- **Trigger:** Blank page paralysis, stuck on a specific section
- **Key insight:** Most serious writers do NOT hand off drafting to AI. "Writing is thinking. You can't just have AI do it." The real workflow is: (1) uncensored bullet points, (2) first draft, (3) heavy editing. AI can help with step 3, maybe step 2, never step 1.

#### Phase 4: Revising (Structure, Flow, Argument) — THE SWEET SPOT
- Diagnostic analysis: "identify the core message and where energy falters"
- Critiquing thinking and argument quality (not just prose)
- Restructuring sections around thematic principles
- Compressing passages while preserving voice
- **Trigger:** "I've written something, now I need fresh eyes on it"
- **Key insight:** This is the most valued and least well-served use case. Maps directly to the stated need of "having AI critique my thinking."

#### Phase 5: Editing (Line-level Polish)
- Grammar fixes, word choice, tightening sentences
- 47% of authors who use AI employ it as a grammar tool
- **Trigger:** "This is mostly done, I need to clean it up"

### Six Behavioral Patterns

| Pattern | Trigger | Action | Output Handling |
|---------|---------|--------|-----------------|
| **A: Research Companion** | Exploring a topic or synthesizing sources | Feed source material → get structured analysis | Read as input to own thinking. Never final text. |
| **B: Blank Page Breaker** | Staring at an empty document | Describe what to write → get rough draft/outline | React to, restructure, substantially rewrite. Scaffolding, not a draft. |
| **C: Critical Reader** | Completed draft, wants feedback | Paste draft → ask for weak spots, unclear arguments, structural issues | Read critique, make own edits. "Do not rewrite, only suggest." |
| **D: Structure Advisor** | Has ideas/content, unsure how to organize | Provide raw notes → ask for outlines/organization | Evaluate multiple suggestions, synthesize, write from own outline. |
| **E: Polish Pass** | Draft nearly done, want to tighten prose | Paste sections → ask for clarity, grammar, tightening | Review each suggestion individually, accept/reject. |
| **F: Voice Tuner** | Output doesn't sound like them | Provide writing samples + draft → match voice/tone | Requires significant setup but dramatically reduces editing time. |

### Pain Points with Current AI Writing Tools

1. **Context-switching tax** — Leaving the document to open a chat, copy-paste text, wait, copy result back, fix formatting. Burns ~20% of a knowledge worker's week.
2. **Destructive edits** — Ask AI to change one thing, it rewrites everything and destroys what was working. "Your best content becomes beige mush."
3. **Voice erosion / "AI accent"** — AI defaults to flat, overly polished corporate tone. Without extensive coaching, everything sounds the same.
4. **Context window memory loss** — AI loses track of earlier content as documents grow. "Quality and consistency completely falls apart by chapter 5-6."
5. **Prompt fatigue** — Writers "spend more time crafting prompts than actually writing." The exhausting cycle of "more casual / no too casual / add personality / not like that."
6. **AI suggestions introduce new errors** — "Corrections" that create new problems: incorrect punctuation, over-simplification, misidentified constructions.

---

## Core User Flows — Prioritized

Ranked by value to writers/readers and current support level. Investment should focus on high-value, low-support flows.

| Rank | Flow | Value (1-100) | Current Support |
|------|------|:-------------:|:---------------:|
| 1 | Critical Reader | 95 | Barely |
| 2 | Flow & Structure | 85 | Minimal |
| 3 | Documents & Onboarding | 65 | Basic |
| 4 | Research Companion | 55 | Partial |
| 5 | Inline Generation | 50 | Good |
| 6 | Polish Pass | 45 | Partial |
| 7 | Badge & Verification | 90 | Complete |

---

### Flow 1: Critical Reader (Value: 95 · Support: Barely)
**"Read what I've written and tell me what's wrong with my thinking."**

The 2026 research is unambiguous: "think with me" is the dominant paradigm, the most valued use case, and the least well-served by existing tools. For writers, it's the thing they most want AI to do. For readers, "writer asked for critique, then made their own edits" is the most compelling audit trail entry possible — it's direct evidence of human thinking.

The writer has a draft (or partial draft) and wants diagnostic feedback. Not line edits — structural and intellectual critique. "Where does my argument fall apart? Where do I lose the reader?"

**Ideal UX:**
- Writer selects text (or the whole document) and asks for critique
- AI responds with **annotations/comments**, not rewrites
- Comments appear inline or in the chat panel, referencing specific parts of the text
- Writer makes their own edits based on the feedback
- Audit trail logs the critique request and what the writer did with it

**Current state:** A writer could type "critique my draft" into the Side Panel chat and get feedback since the panel has document context. But there's no dedicated critique action, no inline annotations, no way for AI to point at specific sections, and no comments system. The writer has to mentally map between chat feedback and their document. A writer would get better results pasting their draft into Claude directly.

---

### Flow 2: Flow & Structure Improvement (Value: 85 · Support: Minimal)
**"Help me reorganize and tighten this."**

Addresses the #1 pain point across all research: destructive edits. When done as tracked changes instead of rewrites, it's a genuine differentiator — no mainstream writing tool does this well. For readers, an audit trail full of individual accept/reject decisions on surgical suggestions is rich and trustworthy.

The writer wants to improve how the piece reads — reorder sections, improve transitions, cut dead weight, tighten prose. This is where destructive edits are the biggest risk.

**Ideal UX:**
- AI suggests structural changes as **proposals**: "Consider moving section X before Y because..."
- For prose-level improvements: **tracked changes** style (like Word or Google Docs suggestions mode)
- Writer accepts/rejects each change individually
- Wholesale rewrites are never the default — always surgical suggestions
- Audit trail captures every suggestion and the writer's accept/reject decision

**Current state:** The Inline AI has "Improve" and "Simplify" buttons on text selection, but these are paragraph-level rewrites — the AI replaces the selection wholesale. No tracked changes, no suggestion mode, no way to ask for structural reorganization, no diff view. The "Improve" button is a destructive edit — exactly the problem the research identifies as the #1 frustration. The app actively does the wrong thing for this flow.

---

### Flow 3: Documents & Onboarding (Value: 65 · Support: Basic)
**"I just signed up — what do I do?"**

This is an adoption gate, not a feature. A weak empty state means writers never create document #1, which means every other flow is irrelevant. The 2026 data shows writers will only switch editors if friction is extremely low — the first 30 seconds matter enormously.

**Ideal UX:**
- Empty state communicates the value prop and makes the first action obvious
- Not just a blank page — something that shows what Provenance does and why it matters
- Clear path from "I just signed up" to "I'm writing my first document"

**Current state:** Dashboard shows documents with word count, last modified, and badge count. Empty state is just a text message. No value prop communication, no encouraging first-run experience, no search, no document status indicators (draft vs. badge generated).

---

### Flow 4: Research Companion (Value: 55 · Support: Partial)
**"I want to understand something before/while I write about it."**

The writer is exploring a topic. They might paste in source material, ask open-ended questions, or want the AI to synthesize across sources. The output goes into the writer's thinking, not directly into the document. Useful but well-served by existing tools — writers already have Claude/ChatGPT in another tab. The unique Provenance value is that research gets logged in the audit trail, which is moderately interesting to readers ("the writer did their homework").

**Ideal UX:**
- Happens in the **AI chat panel**
- Writer can reference document content ("based on what I've written so far...")
- AI responses stay in the panel — writer manually pulls in anything useful
- Audit trail logs the full interaction

**Current state:** Side Panel chat exists and is document-aware (sends document content as context). A writer can ask research questions. But chat history resets on page reload — no persistence. No way to reference specific parts of the document. No way to pull a useful response into the document with a single action — writer has to manually copy/paste.

---

### Flow 5: Inline Generation (Value: 50 · Support: Good)
**"Write me a paragraph about X" or "Expand on this point."**

The most traditional AI writing interaction. Every AI writing tool does this. Already the best-supported flow in the app. For readers, heavy AI generation actually makes the badge less interesting (high AI%). Necessary to have, not where investment creates differentiation.

**Ideal UX:**
- Writer places cursor or selects text and invokes AI
- AI-generated text appears as a **suggestion** (visually distinct from committed text)
- Writer can accept, modify, or reject
- If accepted, text is marked as AI-originated in the audit trail
- If modified then accepted, the diff is captured

**Current state:** Inline AI "Expand" works on selected text. Freeform AI (Cmd+K) lets the writer request any generation. Generated text gets origin-marked as AI. Accept/reject is tracked. The main gap is no "accept but modify" step that shows the diff — it's binary accept or reject.

---

### Flow 6: Polish Pass (Value: 45 · Support: Partial)
**"Clean up my grammar and tighten the prose in this section."**

Final-stage editing. Table stakes in 2026 — grammar fixing is baseline expected. For readers, "writer fixed some commas" is the least interesting audit trail entry. The current all-or-nothing accept/reject is annoying but not a dealbreaker.

**Ideal UX:**
- Select text → "Polish this" / "Tighten this" / "Fix grammar"
- Changes appear as **tracked changes** — green insertions, red deletions
- Writer reviews each change individually
- Batch "accept all" is available but not the default
- Audit trail logs every individual accept/reject

**Current state:** Inline AI "Fix Grammar" works on selected text and shows the result with accept/reject. But it's all-or-nothing — the AI rewrites the entire selection and you accept or reject the whole thing. No individual change review, no way to accept some fixes and reject others. Risk of voice erosion.

---

### Flow 7: Badge & Verification (Value: 90 · Support: Complete)
**"I'm done — generate my proof."**

The entire product thesis. Without this, there's no reason to use Provenance over any other editor. The "human-first premium" research shows writers now have economic motivation to prove their process. For readers, this is their only touchpoint with the product. Already fully built and solid.

**Ideal UX:**
- Preview page shows everything that will be public (with explicit warning)
- Badge generation freezes the audit trail as an immutable snapshot
- Verification page shows stats, timeline, full text
- Badge image dynamically generated
- HTML/Markdown snippets for embedding

**Current state:** Fully implemented. Preview with public content warning, badge generation with frozen audit trail, verification page with stats/timeline/full text, dynamic badge image, HTML/Markdown snippets, takedown support. No major gaps.

---

## Deferred Items

- **BadgeList integration**: BadgeList has been removed from the editor view. It will be integrated with the audit trail panel when that panel is implemented.
- **getDocumentContent tool**: AI tool that retrieves the current document content during chat, enabling the AI to reference specific sections without sending the full document in every message.
- **Cross-highlighting / annotations**: When AI references a specific section of the document in chat, highlight that section in the editor. Bidirectional: clicking an annotation in the chat scrolls to that section, and vice versa.
- **Annotation cards for critique flow**: When the AI critiques the document, render structured annotation cards (left-bordered, severity-colored: red/violet/gray) with paragraph references instead of plain chat messages. Enables the Critical Reader flow (Flow 1) from the side panel mockups.
- **Explore mode (full-width chat)**: Collapse the editor pane and let the chat panel take full viewport width with content centered at 640px max-width. A "◀ Editor" button in the header restores the split layout. Supports the "research first, write later" workflow (Flow 4) from the side panel mockups.
- **Message hover actions**: Copy and Keep/Pin buttons that appear on hover over assistant messages. Keep pins a message as a reference the writer can return to.

---

## Design Implications

1. **AI lives in the editor, not in a separate app.** The #1 pain point is context-switching. Every AI interaction should happen without leaving the writing surface.

2. **Comments over rewrites.** Default AI behavior should be critique and diagnosis ("this argument is weak because...") not rewriting. Rewrites are opt-in.

3. **Non-destructive, diffable suggestions.** When AI suggests text changes, show them as tracked changes that can be individually accepted or rejected. Never silently replace text.

4. **Document-aware context.** AI must know the full document (outline, voice, themes, earlier sections) to avoid losing coherence as the document grows.

5. **Intent-based actions over raw prompts.** Offer actions like "Critique this section," "Improve flow," "Tighten this paragraph" rather than requiring the writer to craft prompts from scratch. Reduce prompt fatigue.

6. **The audit trail is a feature, not just a record.** Writers should want to look at it — seeing their process visualized is motivating and interesting, not just compliance.
