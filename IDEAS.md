# Ideas

This is a lightweight, non-binding backlog. It preserves useful product directions and unresolved questions without creating a required planning process.

## Current product-quality opportunities

- Add a “View Badge” path from the document list and editor after deciding where generated badge assets should live.
- Restore prior chat messages, panel open/closed state, and audit-panel state when a writer returns to a document. The interaction data already exists; the missing work is UI hydration and local or database-backed view state.
- Align the editor header with the active mockup: dashboard navigation, inline title editing, save state, and badge access.
- Define the privacy boundary for audit data: what remains private, what owners and collaborators see, and exactly what becomes part of a public badge snapshot.
- Pay down the known lint and type-check baseline issues so static checks can be trusted again.

## More honest authorship reporting

Explore a badge centered on one defensible fact—how much of the final text the writer typed—while the verification page explains four observed categories: human typed, AI generated, external paste of unknown origin, and human text processed by AI.

The attribution model should preserve uncertainty and word lineage, distinguish new AI words from surviving human words, and explain the known limitation that move-heavy rewrites can look like delete-and-add operations. It must not imply that typed text is necessarily original or that pasted text came from a particular source.

## Verification experiences

- **Origin Explorer:** let a reader select text and see its observed origin, linked AI interaction or paste event, and available evidence. Public views must be constrained to the published snapshot.
- **Writing Timelapse:** replay revision snapshots with AI, paste, and session events. Consider an embeddable player and short highlight reel only if the underlying replay is compelling and privacy-safe.
- **Proof Bundles:** create a canonical signed record that can be verified offline. A serious design needs stable canonical JSON, Ed25519 keys, rotation and revocation rules, public-key discovery, and a precise statement that it proves record integrity—not authorship truth.
- **Writer Profiles:** aggregate opt-in public badges into a cumulative portfolio. Explore reputation and process statistics without comparison leaderboards, while allowing per-badge visibility, unlisted/private profiles, and deletion controls.

## Later platform directions

- Publishing-platform integrations and embeddable verification experiences.
- Snapshot-to-published-text similarity checks.
- A public verification API and third-party tooling.
- Collaboration, pricing, and sustainable hosting.
- Compatibility with broader provenance standards such as C2PA where it adds real interoperability.

## Questions to validate first

- Will writers switch editors or adopt an integration for this benefit?
- Can a badge become recognizable and valuable before the network exists?
- Which claims remain robust against retyping, off-platform AI use, and other gaming?
- How should sensitive prompts, unpublished text, embeddings, and collaboration data be protected?
- How do immutable verification records coexist with takedown, correction, and deletion rights?
- Which publishing platforms matter most, and what do their embed and security constraints allow?

## Boundaries

- Provenance reports what it observed; it does not certify originality, factual accuracy, or moral authorship.
- Private writing and interaction data must not become public merely because a badge exists.
- These ideas are not commitments or authorization to build them.

