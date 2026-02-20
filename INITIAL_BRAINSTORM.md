# Product Spec: Auditable AI Writing Tool

## Overview

A writing tool that provides full transparency into how AI was used during the writing process. Writers create content in the tool, optionally use a built-in AI assistant, and receive a shareable badge linking to a complete audit trail of their process. The tool does not restrict or judge AI use — it makes it visible so readers can decide for themselves.

### Core Philosophy

The tool is a **transparency layer, not a gatekeeper**. A writer who has AI generate 100% of their post gets a badge that honestly shows that. A writer who only used AI for a single research question gets a badge showing that. The tool is the court reporter, not the judge.

---

## Problem

AI-generated content is flooding the internet, and readers are increasingly frustrated by it. At the same time, responsible AI use (research, proofreading, brainstorming) is being lumped in with wholesale AI ghostwriting. Writers who use AI responsibly have no way to prove it, and readers have no way to distinguish between the two. The result is a growing trust deficit between writers and readers.

### Key Insight

The distinction people care about isn't "AI vs. no AI" — it's whether the writer stayed in control of the process or delegated it entirely. This tool makes that distinction visible and verifiable.

---

## Target Users

### Primary: Independent Technical/Craft Bloggers

Writers who publish because they have something to say and care about their craft. The HN/indie blogger demographic — people who would adopt the tool for identity reasons ("I'm not one of the fakers") rather than purely economic ones. These writers typically use simple tools (Google Docs, markdown editors, WordPress directly) and would not experience a meaningful downgrade from switching to a focused writing editor.

### Secondary: Readers

Anyone who encounters a badge on a published post and clicks through to verify. These users will primarily be on mobile and need a clean, readable verification experience.

---

## MVP Feature Set

### 1. Writing Editor

A clean, focused rich text editor with basic formatting: headers, bold, italic, links, images. Not trying to compete with Notion or Google Docs on features — the simplicity is a feature. Desktop-only for the editing experience.

**Build on an existing editor framework** (e.g., TipTap, ProseMirror) rather than building from scratch.

### 2. Built-In AI Assistant

An integrated AI assistant available while writing. The AI is **entirely unrestricted** — it can generate paragraphs, rewrite selections, answer research questions, brainstorm, or anything else. The tool audits AI use; it does not limit it.

**AI interaction modes to support:**

- Highlight text and ask for rephrasing, expansion, simplification, etc.
- Side panel for research questions, fact-checking, brainstorming
- Freeform prompts

**Every AI interaction is logged:** the user's prompt, the AI's response, whether the user accepted/modified/rejected the output, and what changed in the document afterward.

### 3. Audit Trail

The core product. Captures:

- **Revision snapshots** at reasonable intervals (not every keystroke, but enough to show the writing evolved organically)
- **Every AI interaction** with full context (prompt, response, user action taken)
- **Paste events** — pasting is allowed but logged visibly in the audit trail, including whether pasted content came from the built-in AI or from an external source
- **Session information** — when the writer worked on the piece, across how many sessions

### 4. Badge Generation

When the writer is ready to publish, they generate a badge. The badge is:

- **A small inline image** (PNG, ~200x40px) displaying the tool name and the top-line stat
- **Linked to a verification page** on the tool's domain
- **Delivered as a copyable snippet** (HTML and markdown) the writer can paste into their post

The top-line stat for MVP is **percentage of characters that were AI-generated vs. human-typed**, clearly labeled with methodology.

If a platform strips the image, the alt text with a link serves as a fallback.

The badge is a **static snapshot** of the document at the time of generation. If the writer edits further and wants an updated badge, they regenerate it.

### 5. Verification Page

A publicly accessible page at a unique URL (e.g., `[tool].com/verify/[id]`) that shows:

- **Summary stats** — the AI-generated percentage, number of AI interactions, number of sessions, total writing time
- **Full audit timeline** — expandable view of the complete writing process, including all AI interactions
- **The full text** as it existed when the badge was generated, so readers can compare it against the published version

**Must be fully responsive and work well on mobile.** This is the moment someone cares enough to check — it can't break on their phone.

---

## Explicit Scope Boundaries

### What the badge certifies

"The writing process for this piece was conducted in [Tool Name], and the complete record of that process — including all AI interactions — is available for review."

### What the badge does NOT certify

- That no AI was used outside the tool (it can't know this)
- That the ideas are original
- That the writing is good
- That the published version is identical to the verified version (though the full text is available for comparison)
- That no other tools (Grammarly, external ChatGPT, etc.) were used

**The tool must be completely transparent about these limitations.** This is communicated on the verification page and in any marketing/documentation.

---

## What's NOT in MVP

- Mobile editing experience
- Collaboration features
- Export/publishing integrations (WordPress, Ghost, Substack APIs)
- Automated content matching between badge and published URL
- Team/organization accounts
- API access
- Author identity verification
- Badge revocation or audit trail deletion workflows
- Granular permissions on verification pages

---

## Last-Mile Content Matching (MVP Approach)

Writers create in the tool, then copy their content to whatever platform they publish on. The content may change between the tool and publication (formatting adjustments, minor edits, or potentially substantial changes).

**MVP approach:** The verification page displays the full text as it existed when the badge was generated. Readers can compare it against the published version themselves. This is honest and requires no integration work.

**Future consideration:** Automated similarity scoring between the badge-verified text and the published URL, or direct publishing integrations that create a tighter chain of custody.

---

## Bootstrapping Strategy

The badge has no recognition value on day one. To build it:

1. **Write the launch post using the tool.** Share the verification link as a live proof of concept. Natural Show HN / indie hacker content.
2. **Target a specific community first** — HN readers, indie bloggers, technical writers — rather than trying to be universal.
3. **Make the verification page genuinely interesting.** If people share their process pages because they find them cool (a behind-the-scenes look at how writing happens), the badge spreads organically rather than through obligation.

---

## Open Questions for Post-MVP

- Should writers be able to revoke or delete their audit trail after publishing? What happens to embedded badges if they do?
- How to handle collaborative writing (co-authors, editors making changes)?
- Is there a subscription model, or is this free with premium features?
- Should there be a directory or feed of badge-verified posts?
- Could platforms (Substack, Medium) eventually recognize the badge natively?
- How to handle the writer who uses external AI for research/outlining then writes prose in the tool — is there a way to optionally self-declare external AI use?
