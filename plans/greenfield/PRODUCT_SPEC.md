# Product Specification: Provenance

> An auditable AI writing tool that makes the writing process transparent and verifiable.

**Status:** MVP Definition
**Date:** 2026-02-20
**Version:** 1.0

---

## Problem Statement

AI-generated content is flooding the internet. Readers increasingly distrust what they read, and responsible AI users get lumped in with wholesale AI ghostwriting. Writers who use AI thoughtfully — for research, brainstorming, proofreading — have no way to prove it. Readers have no way to tell the difference. The result is a growing trust deficit between writers and readers.

**The distinction people care about isn't "AI vs. no AI" — it's whether the writer stayed in control of the process or delegated it entirely.** Provenance makes that distinction visible and verifiable.

### Why Existing Solutions Don't Work

- **AI detectors** (GPTZero, Originality.ai) are probabilistic and unreliable — false positives punish honest writers, false negatives let bad actors through.
- **C2PA/Content Credentials** track media provenance at the file metadata level (who created it, what tool was used) but don't capture the granular writing process — the actual prompts, revisions, and decisions that reveal how much control the writer maintained.
- **Honor-system disclosures** ("I used AI to help write this") provide no evidence and no way to verify.

Provenance provides **deterministic, process-level verification**: not a guess about whether AI was used, but a complete record of exactly how it was used.

---

## Target Users

### Primary: Independent Technical & Craft Bloggers

Writers who publish because they have something to say and care about their craft. The Hacker News / indie blogger demographic — people who would adopt the tool for identity reasons ("I'm not one of the fakers") rather than purely economic ones.

**Characteristics:**
- Currently use simple tools (Google Docs, markdown editors, WordPress)
- Value authenticity and transparency
- Would not experience a meaningful downgrade switching to a focused writing editor
- Active in communities where reputation and trust matter

### Secondary: Readers / Verifiers

Anyone who encounters a Provenance badge on a published post and clicks through to verify. These users are primarily on mobile and need a clean, readable verification experience.

**Characteristics:**
- Arrive at the verification page from a link in a blog post
- Want to quickly understand how much AI was involved
- May or may not explore the full audit trail
- Mobile-first experience is critical

---

## Core Philosophy

Provenance is a **transparency layer, not a gatekeeper**.

- A writer who has AI generate 100% of their post gets a badge that honestly shows that.
- A writer who only used AI for a single research question gets a badge showing that.
- The tool audits AI use; it does not limit or judge it.
- The tool is the court reporter, not the judge.

---

## Goals & Success Metrics

### MVP Goals

1. **Validate demand:** Determine whether writers will adopt a new editor for the sake of provenance badges.
2. **Validate the verification page:** Determine whether readers find the audit trail compelling and trustworthy.
3. **Bootstrap badge recognition:** Get the Provenance badge embedded on enough posts that readers begin to recognize it.

### Success Metrics (Beta)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Writers who complete a badge | 50+ | Validates the full flow is usable |
| Verification page visits per badge | 5+ average | Shows readers care enough to click |
| Audit trail expansion rate | 20%+ of visitors | Shows the detailed view adds value |
| Repeat writers (2+ badges) | 30%+ of writers | Validates ongoing adoption, not novelty |

---

## Trust Model

**REQ-047:** Provenance operates on a **hosted trust model** for MVP. Verifiers trust that Provenance's servers faithfully recorded the writing process. The verification page is an honest presentation of server-side data, not a cryptographically independent proof.

**What this means in practice:**
- The audit trail is stored on Provenance's servers. Verifiers trust the platform to accurately record and present the data.
- This is analogous to how GitHub's commit history is trusted — not because each viewer independently verifies cryptographic proofs, but because the platform's incentives and reputation are aligned with accuracy.
- The badge is a claim backed by the platform's integrity, not a self-contained cryptographic proof.

**What the tool cannot prevent (and states openly):**
- The writer using external AI tools and then typing the output manually.
- The writer pre-drafting content elsewhere and pasting it in (paste events are logged, but the tool cannot verify origin).
- The platform operator (Provenance) tampering with audit records (addressed by reputation and, post-MVP, by cryptographic measures).

**Post-MVP:** Hash-chained event logs, signed snapshot bundles, and downloadable verification records are planned to enable independent, offline verification without trusting the platform. These are deferred because the hosted model is sufficient for beta validation.

---

## Platform

**REQ-001:** Provenance is a web application accessible via modern desktop browsers (Chrome, Firefox, Safari, Edge).

**REQ-002:** The writing/editing experience is desktop-only for MVP.

**REQ-003:** Verification pages are fully responsive and must work well on mobile devices (this is the primary verification context — someone tapping a badge link from their phone).

---

## Core User Experience

### Writer Flow

1. **Sign up / Log in** — Writer authenticates via Google or GitHub OAuth.
2. **Create a document** — Opens a clean, focused rich text editor.
3. **Write** — Types their content with basic formatting (headers, bold, italic, links, images). All keystrokes and edits contribute to the revision history.
4. **Use AI (optional)** — At any point, the writer can invoke the built-in AI assistant to generate text, rewrite selections, answer research questions, or brainstorm. Every interaction is logged.
5. **Review audit trail (optional)** — Writer can preview what the verification page will show before publishing.
6. **Generate badge** — When ready to publish, the writer generates a badge. This creates a static snapshot of the document and its audit trail.
7. **Embed badge** — Writer copies the badge snippet (HTML or Markdown) and pastes it into their published post on whatever platform they use.

### Reader/Verifier Flow

1. **Encounter badge** — Reader sees a small Provenance badge embedded in a blog post.
2. **Click through** — Taps/clicks the badge to visit the verification page.
3. **View summary** — Sees top-line stats: AI-generated percentage, number of AI interactions, writing sessions, total time.
4. **Explore details (optional)** — Expands the full audit timeline to see every AI interaction, revision, and paste event.
5. **Compare text (optional)** — The full text at badge generation is available, so the reader can compare against the published version.

---

## MVP Features

### 1. User Authentication

- **REQ-004:** Users sign up and log in via OAuth (Google and GitHub providers).
- **REQ-005:** No email/password authentication for MVP. OAuth-only simplifies implementation and security.
- **REQ-006:** Users have a minimal profile: display name (from OAuth provider) and email.

### 2. Writing Editor

- **REQ-007:** A clean, focused rich text editor built on TipTap (ProseMirror-based).
- **REQ-008:** Supported formatting: headings (H1-H3), bold, italic, links, images, block quotes, code blocks, ordered/unordered lists.
- **REQ-009:** The editor is intentionally simple — not competing with Notion or Google Docs on features. Simplicity is a feature.
- **REQ-010:** Users can create multiple documents. Each document has a title and body.
- **REQ-011:** Documents auto-save as the user types (debounced, not every keystroke).

### 3. Built-In AI Assistant

- **REQ-012:** An integrated AI assistant available while writing. The AI is maximally capable within the underlying model provider's safety policies — it can generate, rewrite, research, brainstorm, or anything else the provider allows. Provenance does not add additional content restrictions beyond the provider's own policies. If the AI provider refuses a request, the refusal is logged in the audit trail as a "blocked" interaction.
- **REQ-013:** AI interaction modes:
  - **Inline:** Highlight text and request rephrasing, expansion, simplification, tone changes, etc. The AI response appears as a suggestion the writer can accept, modify, or reject.
  - **Side panel:** A conversational panel for research questions, fact-checking, brainstorming, and freeform prompts. Responses appear in the panel; the writer decides whether to incorporate anything into the document.
  - **Freeform:** Direct prompt input for any request.
- **REQ-014:** When the writer accepts AI-generated text (fully or partially), it is inserted into the document and tracked as AI-originated content.
- **REQ-015:** The writer can always reject AI output entirely, and this rejection is also logged.

### 4. Audit Trail

- **REQ-016:** Revision snapshots are captured at reasonable intervals (e.g., every 30 seconds of active editing, or on significant changes) — enough to show writing evolved organically, not so frequent as to be noise.
- **REQ-017:** Every AI interaction is logged with full context:
  - The user's prompt/request
  - The AI's complete response
  - The user's action: accepted, partially accepted (with diff), modified, or rejected
  - The resulting document changes (if any)
  - Timestamp
- **REQ-018:** Paste events are detected and logged. The audit trail distinguishes:
  - Paste from the built-in AI assistant (already tracked via REQ-017)
  - Paste from an external source (logged as external paste with content and timestamp)
- **REQ-019:** Session information is tracked: when the writer started and stopped working, across how many sessions, total active writing time.
- **REQ-020:** The audit trail calculates the percentage of the final document that is AI-generated vs. human-typed, using the following algorithm:
  - **Unit of measurement:** Plain-text character count (formatting markup excluded).
  - **AI-generated:** Characters present in the final document that originated from an accepted AI suggestion and remain unchanged or trivially changed (< 20% of characters in that span modified).
  - **Human-typed:** Characters typed directly by the writer, including any AI-generated spans modified by 20% or more.
  - **External paste:** Characters pasted from outside the tool. Reported as a separate metric ("X% externally pasted") alongside the AI percentage.
  - **Edge cases:** Moved text retains its original classification. Deleted text is excluded from the final calculation. If a span's origin is ambiguous, it is classified as human-typed (conservative).
  - **REQ-048:** The methodology is documented on every verification page with a brief explanation and a link to detailed methodology documentation.
  - **Limitation acknowledged:** This metric can be gamed (e.g., retyping AI output). The verification page states this openly — the metric represents what the tool observed, not a guarantee of authorship.

### 5. Badge Generation

- **REQ-021:** When the writer generates a badge, the system creates a static snapshot of:
  - The document text at that moment
  - The complete audit trail up to that moment
  - Summary statistics
- **REQ-022:** The badge is a small inline image (PNG, approximately 200x40px) displaying the Provenance name/logo and the top-line statistic (AI-generated percentage).
- **REQ-023:** The badge links to a unique verification page URL (e.g., `provenance.app/verify/{id}`).
- **REQ-024:** The badge is delivered as a copyable snippet in both HTML and Markdown formats.
- **REQ-025:** If a platform strips the image, the alt text includes the key stat and a plain-text link as fallback.
- **REQ-026:** Badges are immutable snapshots. If the writer edits further and wants an updated badge, they generate a new one (previous badges remain valid for their snapshot).

### 6. Verification Page

- **REQ-027:** Each badge links to a publicly accessible verification page at a unique URL.
- **REQ-028:** The verification page displays summary statistics:
  - AI-generated percentage (primary stat, prominent)
  - Number of AI interactions
  - Number of writing sessions
  - Total active writing time
  - Date of badge generation
- **REQ-029:** Below the summary, an expandable audit timeline shows the complete writing process chronologically, including all AI interactions with full prompt/response detail.
- **REQ-030:** The full document text as it existed at badge generation is displayed, so readers can compare it against the published version.
- **REQ-049:** Before generating a badge, the writer is shown a preview of exactly what will become public (all prompts, AI responses, paste content, and the full document text). The preview includes a prominent warning: "Everything shown here will be publicly visible to anyone with the badge link." The writer must explicitly confirm before the badge is generated.
- **REQ-031:** The verification page is fully responsive and optimized for mobile. This is the critical moment when someone cares enough to check — it cannot break on their phone.
- **REQ-032:** The verification page clearly states what the badge certifies and what it does not (see Scope Boundaries below).

### 7. Document Management

- **REQ-033:** Users can view a list of their documents (dashboard/home page).
- **REQ-034:** Users can create, edit, and delete documents.
- **REQ-035:** Users can view badges generated for each document.

---

## Explicit Scope Boundaries

### What the Badge Certifies

**REQ-036:** The badge certifies: "The writing process for this piece was conducted in Provenance, and the complete record of that process — including all AI interactions — is available for review."

### What the Badge Does NOT Certify

**REQ-037:** The badge explicitly does not certify:
- That no AI was used outside the tool (Provenance cannot know this)
- That the ideas are original
- That the writing is good
- That the published version is identical to the verified version (though the full text is available for comparison)
- That no other tools (Grammarly, external ChatGPT, etc.) were used

**REQ-038:** These limitations are prominently communicated on every verification page and in product documentation. The tool must be completely transparent about what it can and cannot prove.

---

## Data Requirements

### What Must Be Persisted

- **User accounts** — OAuth identity, display name, email
- **Documents** — Title, rich text content, creation/modification timestamps
- **Revision history** — Periodic snapshots of document state with timestamps
- **AI interaction logs** — Full prompt, full response, user action taken, document diff, timestamp
- **Paste event logs** — Content pasted, source type (internal AI vs. external), timestamp
- **Session data** — Start/end times for writing sessions
- **Badge snapshots** — Frozen document text, frozen audit trail, summary statistics, generated badge image, unique verification URL
- **Computed metrics** — AI-generated percentage, interaction counts, session counts, total writing time

### Data Integrity

- **REQ-039:** Once a badge snapshot is created, it is immutable at the application level. The writer cannot modify or delete the snapshot's audit trail or document text through the UI. (Cryptographic tamper-evidence is a post-MVP goal.)
- **REQ-040:** The audit trail is append-only during writing. Writers cannot edit or remove individual entries from their audit trail.
- **REQ-050:** Emergency takedown: Provenance reserves the right to remove verification pages that contain illegal content, abuse, or valid legal takedown requests. When a page is taken down, the URL returns a notice stating the page was removed and the reason category (e.g., "legal request," "terms violation"). The underlying audit data is preserved internally for compliance purposes but is no longer publicly accessible.

---

## Access Control

- **REQ-041:** Documents and their audit trails are private to the author by default.
- **REQ-042:** Verification pages (generated via badges) are publicly accessible — anyone with the URL can view them. No authentication required to view a verification page.
- **REQ-043:** Only the document author can generate badges for their documents.
- **REQ-044:** Only the document author can edit or delete their documents.
- **REQ-045:** Granular permissions on verification pages (e.g., hiding certain interactions) are explicitly out of scope for MVP.

### Public Data Boundary (MVP)

- Public on verification pages:
  - Frozen document text at badge-generation time
  - AI interaction records included in the audit trail (prompt, response, action, timestamp)
  - Paste/session/revision metadata included in the audit trail
  - Summary provenance metrics (AI%, interaction counts, session counts, active time)
- Private (never rendered on public verification pages):
  - OAuth credentials and provider tokens
  - API keys and infrastructure secrets
  - Account-internal metadata not required for provenance verification
  - Non-badged drafts and their audit trails
- Operational policy:
  - Badge generation is an explicit publish action for provenance data (REQ-049 warning/confirmation)
  - Emergency takedown (REQ-050) removes public visibility while preserving internal records for compliance

---

## What Is NOT in MVP

The following are explicitly out of scope for the initial release:

- Mobile editing experience (verification pages are mobile-responsive, but the editor is desktop-only)
- Collaboration or co-authoring features
- Export/publishing integrations (WordPress, Ghost, Substack APIs)
- Automated content matching between badge-verified text and published URL
- Team or organization accounts
- Public API access
- Author identity verification (beyond OAuth)
- Badge revocation or audit trail deletion workflows
- Granular permissions on verification pages
- Custom badge styling or branding
- Subscription payments or monetization infrastructure

---

## Bootstrapping & Go-to-Market

### Launch Strategy

1. **Write the launch post using Provenance.** Share the verification link as a live proof of concept — natural Show HN / indie hacker content.
2. **Target a specific community first** — HN readers, indie bloggers, technical writers — rather than trying to be universal.
3. **Make the verification page genuinely interesting.** If people share their process pages because they find them compelling (a behind-the-scenes look at how writing happens), the badge spreads organically.

### Pricing

**REQ-046:** Provenance is free during beta. No payment infrastructure for MVP. Focus on adoption, feedback, and establishing the badge's recognition value.

---

## Assumptions & Risks

### Key Assumptions

- Writers in the target demographic (indie bloggers, technical writers) will switch to a new editor if the provenance value proposition is compelling enough.
- The "percentage AI-generated" metric is meaningful and understandable to readers, even with its acknowledged limitations.
- Verification page URLs shared via badge images will survive platform embedding (most major blogging platforms support inline images with links).
- OAuth (Google + GitHub) covers the vast majority of the target user base.

### Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Writers won't switch editors | Fatal — no content, no badges | Keep editor simple, focus on writing UX quality. Validate with 10 beta writers before scaling. |
| Badge has no recognition value | Slow adoption — chicken-and-egg | Launch post as proof of concept. Target tight community first. |
| Gaming the metric (retyping AI output) | Credibility damage | State limitations openly. The audit timeline itself (revision pace, session patterns) provides additional signal beyond the headline number. |
| Sensitive content exposed on verification pages | Privacy/legal issues | Pre-publish preview with explicit confirmation (REQ-049). Emergency takedown path (REQ-050). |
| Platform strips badge images | Reduced visibility | Alt text + link fallback (REQ-025). Test embedding on top 5 target platforms before launch. |

---

## Non-Functional Requirements

- **REQ-051:** Verification pages must load within 2 seconds on a 4G mobile connection. This is the critical trust moment — slow pages lose visitors.
- **REQ-052:** The writing editor must feel responsive — auto-save, AI requests, and UI interactions should not block typing. Target < 100ms input latency.
- **REQ-053:** Audit trail data must be backed up with point-in-time recovery capability. Badge snapshots represent a trust commitment to verifiers.
- **REQ-054:** All data in transit must use TLS. OAuth tokens and session credentials must be stored securely (not in local storage).
- **REQ-055:** Verification page URLs must use unguessable identifiers (e.g., UUIDs or cryptographic random IDs) to prevent enumeration.

---

## Post-MVP Considerations

The following were identified during specification but deferred for future versions:

- Badge revocation or audit trail deletion workflows — what happens to embedded badges?
- Collaborative writing support (co-authors, editors making changes)
- Subscription/freemium model and pricing
- Directory or feed of badge-verified posts
- Native badge recognition by platforms (Substack, Medium, WordPress)
- Self-declaration of external AI use (writer optionally discloses tools used outside Provenance)
- Automated similarity scoring between badge-verified text and published URL
- Direct publishing integrations for tighter chain of custody
- Custom badge themes and styling options
- Public API for third-party integrations
- Cryptographic tamper-evidence: hash-chained event logs, signed snapshot bundles, downloadable verification records for offline/independent verification
- C2PA/Content Credentials interoperability for badge images

---

## Requirements Index

| ID | Requirement | Section |
|----|-------------|---------|
| REQ-001 | Web application on modern desktop browsers | Platform |
| REQ-002 | Desktop-only editing experience | Platform |
| REQ-003 | Mobile-responsive verification pages | Platform |
| REQ-004 | OAuth authentication (Google and GitHub) | User Authentication |
| REQ-005 | No email/password auth for MVP | User Authentication |
| REQ-006 | Minimal user profile from OAuth | User Authentication |
| REQ-007 | TipTap-based rich text editor | Writing Editor |
| REQ-008 | Basic formatting support | Writing Editor |
| REQ-009 | Intentionally simple editor | Writing Editor |
| REQ-010 | Multiple documents per user | Writing Editor |
| REQ-011 | Auto-save with debouncing | Writing Editor |
| REQ-012 | AI assistant, maximally capable within provider policy | AI Assistant |
| REQ-013 | Three AI interaction modes (inline, side panel, freeform) | AI Assistant |
| REQ-014 | AI-generated text tracked on acceptance | AI Assistant |
| REQ-015 | AI rejection logged | AI Assistant |
| REQ-016 | Periodic revision snapshots | Audit Trail |
| REQ-017 | Full AI interaction logging | Audit Trail |
| REQ-018 | Paste event detection and logging | Audit Trail |
| REQ-019 | Session tracking | Audit Trail |
| REQ-020 | AI-generated percentage calculation | Audit Trail |
| REQ-021 | Badge creates immutable snapshot | Badge Generation |
| REQ-022 | Small inline badge image with top-line stat | Badge Generation |
| REQ-023 | Badge links to verification URL | Badge Generation |
| REQ-024 | Copyable HTML and Markdown snippets | Badge Generation |
| REQ-025 | Alt text and link fallback | Badge Generation |
| REQ-026 | Badges are immutable, regeneration creates new badge | Badge Generation |
| REQ-027 | Public verification page at unique URL | Verification Page |
| REQ-028 | Summary statistics display | Verification Page |
| REQ-029 | Expandable audit timeline | Verification Page |
| REQ-030 | Full document text at badge generation | Verification Page |
| REQ-031 | Fully responsive, mobile-optimized | Verification Page |
| REQ-032 | Transparent scope statement on page | Verification Page |
| REQ-033 | Document list/dashboard | Document Management |
| REQ-034 | Document CRUD operations | Document Management |
| REQ-035 | View badges per document | Document Management |
| REQ-036 | Badge certifies process was conducted in Provenance | Scope Boundaries |
| REQ-037 | Badge does not certify exclusivity or quality | Scope Boundaries |
| REQ-038 | Limitations prominently communicated | Scope Boundaries |
| REQ-039 | Badge snapshots are immutable | Data Integrity |
| REQ-040 | Audit trail is append-only | Data Integrity |
| REQ-041 | Documents private by default | Access Control |
| REQ-042 | Verification pages publicly accessible | Access Control |
| REQ-043 | Only author can generate badges | Access Control |
| REQ-044 | Only author can edit/delete documents | Access Control |
| REQ-045 | No granular verification page permissions in MVP | Access Control |
| REQ-046 | Free during beta, no payment infrastructure | Pricing |
| REQ-047 | Hosted trust model with stated limitations | Trust Model |
| REQ-048 | Methodology documented on verification pages | Audit Trail |
| REQ-049 | Pre-publish preview with public content warning | Verification Page |
| REQ-050 | Emergency takedown path for illegal/abusive content | Data Integrity |
| REQ-051 | Verification pages load within 2s on 4G | Non-Functional |
| REQ-052 | Editor input latency < 100ms | Non-Functional |
| REQ-053 | Audit data backup with point-in-time recovery | Non-Functional |
| REQ-054 | TLS for all data in transit, secure credential storage | Non-Functional |
| REQ-055 | Unguessable verification page URLs | Non-Functional |
