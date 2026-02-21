# Manual Testing Guide — Provenance

## Prerequisites

1. `.env.local` configured with all required variables (see below)
2. Database schema pushed: `npx drizzle-kit push`
3. Dev server running: `npm run dev` (http://localhost:3000)

### Required Environment Variables

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Neon dashboard (pooled) |
| `DATABASE_URL_UNPOOLED` | Neon dashboard (unpooled) |
| `AUTH_SECRET` | `npx auth secret` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub Developer Settings |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud Console |
| `ANTHROPIC_API_KEY` | Anthropic dashboard |
| `OPENAI_API_KEY` | OpenAI dashboard |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

---

## Test Flows

### 1. Landing Page (Unauthenticated)

| # | Step | Expected Result |
|---|------|-----------------|
| 1.1 | Open http://localhost:3000 | Landing page loads with hero: "Transparent AI Writing Verification" |
| 1.2 | Verify "How it Works" section | Two columns: "For Writers" and "For Readers" with numbered steps |
| 1.3 | Click "Get Started" button | Redirects to `/login` |
| 1.4 | Navigate to `/dashboard` directly | Redirected to `/login?callbackUrl=%2Fdashboard` |
| 1.5 | Navigate to `/editor/test-id` directly | Redirected to `/login` |
| 1.6 | Navigate to `/nonexistent-page` | 404 page: "The page you're looking for doesn't exist" with "Go home" link |

### 2. Authentication

| # | Step | Expected Result |
|---|------|-----------------|
| 2.1 | On `/login`, click "Sign in with GitHub" | Redirected to GitHub OAuth consent screen |
| 2.2 | Authorize the app on GitHub | Redirected back to `/dashboard` |
| 2.3 | Open `/` while logged in | Redirected to `/dashboard` (not landing page) |
| 2.4 | Sign out (if UI available) or clear cookies | Returned to unauthenticated state |
| 2.5 | On `/login`, click "Sign in with Google" | Redirected to Google OAuth consent screen |

### 3. Dashboard

| # | Step | Expected Result |
|---|------|-----------------|
| 3.1 | View dashboard (first time) | Empty state or list of documents |
| 3.2 | Click "New Document" | New document created; redirected to `/editor/[id]` |
| 3.3 | Return to dashboard | New document appears in list with title, word count |
| 3.4 | Click on a document card | Navigates to `/editor/[id]` |
| 3.5 | Delete a document | Document removed from list |

### 4. Editor — Basic Editing

| # | Step | Expected Result |
|---|------|-----------------|
| 4.1 | Open a document in editor | TipTap editor loads with toolbar, title input, content area |
| 4.2 | Edit the document title | Title updates; save indicator shows "Saving..." then "Saved" |
| 4.3 | Type text in the editor body | Content appears; auto-save triggers after 2s pause |
| 4.4 | Use toolbar: Bold, Italic, Headings | Formatting applies to selected text |
| 4.5 | Use toolbar: Bullet list, Ordered list | Lists created correctly |
| 4.6 | Use toolbar: Code block, Blockquote | Block elements created |
| 4.7 | Use Undo/Redo buttons | Changes undone/redone correctly |
| 4.8 | Save indicator | Shows "Saving..." during save, "Saved" on success |
| 4.9 | Close and reopen document | Content persisted correctly |

### 5. Editor — AI Features (Inline AI)

| # | Step | Expected Result |
|---|------|-----------------|
| 5.1 | Select text in editor | Floating InlineAI toolbar appears |
| 5.2 | Click "Improve" preset | "Generating..." shown, then AI suggestion appears |
| 5.3 | Click "Accept" | Original text replaced with AI text; toolbar dismisses |
| 5.4 | Select text, click "Simplify" | Simplified text suggestion shown |
| 5.5 | Click "Reject" | Original text unchanged; toolbar dismisses |
| 5.6 | Select text, type custom instruction, submit | AI response based on custom prompt |
| 5.7 | Trigger rate limit (20+ requests/min) | Error: "Rate limit exceeded. Please wait a moment and retry." with Retry button |

### 6. Editor — AI Features (Side Panel)

| # | Step | Expected Result |
|---|------|-----------------|
| 6.1 | Click "AI" toggle button | Side panel opens with chat interface |
| 6.2 | Type a message and send | AI responds with context from document |
| 6.3 | Send multiple messages | Chat history maintained within session |
| 6.4 | Click "X" to close panel | Side panel closes |

### 7. Editor — AI Features (Freeform / Cmd+K)

| # | Step | Expected Result |
|---|------|-----------------|
| 7.1 | Press Cmd+K (Mac) or Ctrl+K (Win) | Freeform AI modal appears |
| 7.2 | Type a prompt and submit | AI generates response |
| 7.3 | Click "Copy" | Response copied to clipboard |
| 7.4 | Press Escape | Modal dismisses |

### 8. Editor — Paste Tracking

| # | Step | Expected Result |
|---|------|-----------------|
| 8.1 | Copy text from external source (browser, notes) | — |
| 8.2 | Paste into editor | Text appears; paste event logged (visible in preview later) |
| 8.3 | Copy text within the editor and paste | Internal paste; should NOT be logged as external |

### 9. Editor — Session Tracking

| # | Step | Expected Result |
|---|------|-----------------|
| 9.1 | Open editor and type actively | Writing session started |
| 9.2 | Stay active for >30 seconds | Heartbeat increments active seconds |
| 9.3 | Navigate away from editor | Session ended |
| 9.4 | Return to editor | New session started |

### 10. Badge Generation — Preview

| # | Step | Expected Result |
|---|------|-----------------|
| 10.1 | In editor, click "Generate Badge" | Redirected to `/editor/[id]/preview` |
| 10.2 | Preview page loads | Yellow warning: "Everything shown here will be publicly visible" |
| 10.3 | Verify document title shown | Matches editor title |
| 10.4 | Verify document content shown | Plain text of document displayed |
| 10.5 | Verify AI interactions listed | All accepted/rejected AI interactions shown with mode, prompt, response |
| 10.6 | Verify paste events listed | External paste events shown with character count |
| 10.7 | Click "Confirm & Generate" | Badge generated; verification URL and embed codes shown |
| 10.8 | Copy HTML embed code | Valid `<a><img></a>` snippet copied |
| 10.9 | Copy Markdown embed code | Valid `[![...](img)](url)` snippet copied |

### 11. Public Verification Page

| # | Step | Expected Result |
|---|------|-----------------|
| 11.1 | Open `/verify/[verificationId]` (unauthenticated) | Page loads without login |
| 11.2 | Stats summary visible | AI percentage (large), human percentage, interaction count, session count, active time |
| 11.3 | Scope statement visible | Methodology explanation |
| 11.4 | Document text visible | Plain text of document at time of badge generation |
| 11.5 | Audit timeline visible | Sections for AI interactions, paste events, sessions, revisions |
| 11.6 | Expand timeline items | Details expand (prompts, responses, timestamps) |
| 11.7 | Badge image URL | `/api/badges/[verificationId]/image` returns PNG image |

### 12. Badge Image Endpoint

| # | Step | Expected Result |
|---|------|-----------------|
| 12.1 | `GET /api/badges/[verificationId]/image` | Returns PNG image with stats |
| 12.2 | Check response headers | `Content-Type: image/png`, cache headers present |
| 12.3 | Request image for taken-down badge | 410 Gone with `Cache-Control: no-store` |
| 12.4 | Request image for nonexistent badge | 404 Not Found |

### 13. Settings

| # | Step | Expected Result |
|---|------|-----------------|
| 13.1 | Navigate to `/settings` | AI provider preference form loads |
| 13.2 | Select "Anthropic" as provider | Model dropdown shows Anthropic models |
| 13.3 | Select "OpenAI" as provider | Model dropdown shows OpenAI models |
| 13.4 | Click "Save" | Confirmation shown; preferences persisted |
| 13.5 | Return to editor | AI features use selected provider |

### 14. Error Handling

| # | Step | Expected Result |
|---|------|-----------------|
| 14.1 | Navigate to `/verify/nonexistent-id` | 404 Not Found page |
| 14.2 | Trigger AI error (invalid API key) | Friendly error: "Something went wrong. Please try again." with Retry |
| 14.3 | Auto-save failure (simulate network error) | Save indicator shows "Save failed" with retry button |
| 14.4 | Click retry on save failure | Retries save operation |

### 15. Mobile Responsiveness

| # | Step | Expected Result |
|---|------|-----------------|
| 15.1 | Open `/verify/[id]` at 375px width | Stats stack vertically, text readable, no horizontal scroll |
| 15.2 | Open dashboard at 375px width | Cards stack vertically |
| 15.3 | Open editor at 375px width | Editor usable, toolbar wraps |

---

## Cross-User Data Isolation

| # | Step | Expected Result |
|---|------|-----------------|
| X.1 | Log in as User A, create a document | Document visible on User A's dashboard |
| X.2 | Log in as User B | User A's documents NOT visible |
| X.3 | User B navigates to User A's `/editor/[id]` directly | Access denied (404) |
| X.4 | User B calls `/api/preview/[id]` for User A's doc | 404 Not Found |
| X.5 | User B calls `/api/badges?documentId=[User A's doc]` | Empty result or 404 |
