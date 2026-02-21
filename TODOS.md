# TODO

## In Progress

- [x] **[P1 / Low]** Fix delete document button error display — DONE

- [ ] **[P1 / Medium]** Reduce auto-save delay and block navigation on unsaved changes — The auto-save delay is noticeably too long, especially when editing the document title. Research best practices for auto-save timing (debounce intervals, optimistic saves, etc.) and implement a faster strategy. Additionally, block page navigation (beforeunload + Next.js route change interception) when there are unsaved changes, showing the user a warning that changes haven't been saved yet.

## Future Concepts

(Ideas to explore later)
