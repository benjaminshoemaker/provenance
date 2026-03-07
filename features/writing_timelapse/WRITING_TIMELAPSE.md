# Writing Timelapse

A playback visualization on the verification page where readers *watch* the document being written — a scrubber timeline showing the document evolving from blank page to finished piece, with AI interactions, paste events, and session gaps overlaid as they happened.

Think time-lapse painting videos, but for writing.

---

## Why This Feature

### It solves the bootstrapping problem

The initial brainstorm identifies the fatal risk: badges have zero recognition value on day one. The prescribed solution is "make the verification page genuinely interesting — if people share their process pages because they find them cool, the badge spreads organically." A static timeline of events is *informative*. A watchable replay of someone writing is *content*. People share content.

### It turns "describing" into "showing"

Right now the verification page *describes* the process: "3 AI interactions, 4 sessions, 12% AI." A timelapse *shows* the writer typing for 20 minutes, hitting a wall, asking AI for help, rejecting the suggestion, typing more, asking again, accepting half of it, then rewriting it. That's not a metric — that's proof. It's the difference between a police report and body-cam footage.

### It's buildable with existing data

Revision snapshots every 30 seconds provide document states. AI interactions, paste events, and session boundaries provide the event overlay. No new tracking infrastructure needed — just a new presentation layer on data already captured. The hardest part is a good interpolation/diff animation between snapshots.

### It retroactively makes every other feature more valuable

Every revision snapshot, every AI interaction log, every paste event, every session heartbeat — all the infrastructure already built — now serves double duty. The audit trail isn't just compliance anymore; it's the raw footage for a compelling artifact.

### It creates a new content primitive

"Watch how I wrote this" is a category that doesn't exist yet. Writing timelapses would be intrinsically shareable the same way coding timelapses and digital art speedpaints are. Writers would link to their replays in their posts not because they *should* (trust signaling) but because they *want to* (it's interesting). That's the difference between obligation-driven and desire-driven adoption.

### No one does this

Tracked changes exist. AI annotations exist. Inline suggestions exist. Every other V2 candidate (Critical Reader, tracked changes, audit trail panel) is implementing a known pattern. This is genuinely unprecedented for text.

---

## What It Would Look Like

- A play/pause button and scrubber bar on the verification page
- Document area showing text appearing, being deleted, being rearranged
- AI events appear as brief overlays ("Writer asked: 'Simplify this paragraph' → Rejected suggestion")
- Session gaps show as fast-forward jumps ("2 hours later...")
- Speed controls (1x, 2x, 5x, 10x)
- Shareable timestamp links ("Watch from 4:32 where the writer restructured the conclusion")

---

## The Compound Effect

A writer publishes a blog post with a Provenance badge. A reader clicks it and watches a 3-minute timelapse of a 6-hour writing process. They see the writer struggle, iterate, use AI surgically, reject bad suggestions, and craft something genuine. They share the replay because it's fascinating. Other writers see it and think: "I want that for my posts." Adoption driven by envy of the artifact, not guilt about transparency.

---

## Existing Data That Powers This

| Data Source | Already Captured | Role in Timelapse |
|---|---|---|
| Revision snapshots (every 30s) | Yes | Document keyframes — the "frames" of the video |
| AI interactions (prompt, response, action) | Yes | Event overlays showing AI dialogue |
| Paste events (source type, character count) | Yes | Event overlays showing external content arrival |
| Writing sessions (start, end, active seconds) | Yes | Session boundary markers, fast-forward gaps |
| Origin marks on text nodes | Yes | Visual highlighting of AI vs. human text in each frame |

No new tracking infrastructure is required. This is a presentation layer on existing audit data.

---

## Embeddable Replay Widget

The timelapse shouldn't live only on the verification page. Writers should be able to embed a compact replay player directly in their blog posts — the same way they embed the badge, but instead of a static image, it's a live player.

### Why this matters

The badge says "click to verify." The embedded replay says "watch me write this" — right there, inline, without leaving the page. The friction difference is enormous. A reader who would never click a badge will absolutely hit play on an embedded video-like widget in the middle of an article.

### What it looks like

- An iframe embed code (like YouTube/CodePen) returned alongside the badge embed snippets
- Compact player: document area + scrub bar + play/pause, no chrome
- Responsive — works in any blog layout
- Clicking "View full details" opens the verification page in a new tab
- Lightweight: lazy-loads replay data only when play is pressed

### Embed formats

```html
<!-- HTML embed -->
<iframe src="https://provenance.app/embed/replay/{verificationId}"
  width="100%" height="400" frameborder="0"></iframe>
```

```markdown
<!-- Markdown (for platforms that support iframes) -->
[![Writing Timelapse](https://provenance.app/api/badges/{verificationId}/image)](https://provenance.app/embed/replay/{verificationId})
```

---

## Highlight Reel (Auto-Summary Mode)

Most writing sessions are hours long. Most attention spans are seconds. A 3-minute replay of a 6-hour session is already compressed, but for social sharing you need something even shorter.

### What it is

An algorithmically generated 30–60 second cut that shows only the significant moments:

- AI interactions (the prompt, the suggestion appearing, the accept/reject decision)
- Major structural changes (paragraph reordering, large deletions, restructuring)
- Paste events (external content arriving)
- The final burst of editing before badge generation

Everything between these moments is skipped with a subtle time-jump indicator.

### Why it matters

- **Social sharing**: A 45-second highlight reel is shareable on Twitter/Bluesky in a way that a 3-minute replay isn't
- **Quick verification**: Readers who want to "spot check" the process without watching the full replay
- **Discovery**: "Here are the 4 moments where AI was involved" is a powerful summary

### How it works

Rank revision-to-revision transitions by magnitude of change (character diff size, structural diff, presence of AI interaction). Take the top N moments, stitch them together with time-jump markers. No new data needed — it's an edit of the full replay.

---

## Social Preview Generation

When a replay link is shared on Twitter, Hacker News, or Slack, the preview card should itself be a mini-timelapse — not a static screenshot.

### What it looks like

- **OG image**: A static frame showing the document mid-writing with the Provenance branding, article title, and "Watch the writing process" CTA
- **Animated preview** (for platforms that support it): A 3–5 second looping GIF/video showing a few seconds of text appearing, giving a taste of the replay
- **Meta tags**: Title: "{Article Title} — Writing Timelapse", Description: "{duration} writing process, {n} AI interactions, {ai_pct}% AI-assisted"

This turns every shared link into an advertisement for the concept.
