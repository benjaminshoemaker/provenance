# TODO

## In Progress

- [x] **[P1 / Low]** Fix delete document button error display — DONE

- [x] **[P1 / Medium]** Reduce auto-save delay and block navigation on unsaved changes — DONE

- [ ] **[P1 / Medium]** Add "View Badge" link to document list and editor view — Display a link/button to view the provenance badge for each document. Note: no file/object storage layer exists today, so badge asset hosting needs to be addressed first.

- [ ] **[P1 / High]** Persist and restore panel content across sessions — Chat messages are logged to DB (ai_interactions table) but never reloaded; useChat() starts empty on every visit. Panel open/close state uses useState and resets on refresh. Need to: (1) Load previous chat messages from DB when SidePanel mounts, (2) Persist panel collapse/expand state to localStorage or DB, (3) Restore audit trail panel state. The underlying data already exists in the database — this is about hydrating the UI with it on return visits.

- [ ] **[P1 / Medium]** Update editor page title and breadcrumbs to match mockup — Align with mockups/side-panel-mockups.html: replace current title/breadcrumb area with a top nav bar containing a "← Dashboard" back link, an inline title input, save status indicator, and badge button. Account for any app-level navigation already in place.

- [ ] **[P1 / Medium]** Clarify audit trail privacy model — Define what audit trail data is shared with users vs. kept internal, what is visible to document owners vs. collaborators, and document the privacy boundaries explicitly in the product spec.

## Future Concepts

(Ideas to explore later)
