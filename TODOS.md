# TODO

## In Progress

- [x] **[P1 / Low]** Fix delete document button error display — DONE

- [x] **[P1 / Medium]** Reduce auto-save delay and block navigation on unsaved changes — DONE

- [ ] **[P1 / High]** Persist and restore panel content across sessions — Chat messages are logged to DB (ai_interactions table) but never reloaded; useChat() starts empty on every visit. Panel open/close state uses useState and resets on refresh. Need to: (1) Load previous chat messages from DB when SidePanel mounts, (2) Persist panel collapse/expand state to localStorage or DB, (3) Restore audit trail panel state. The underlying data already exists in the database — this is about hydrating the UI with it on return visits.

## Future Concepts

(Ideas to explore later)
