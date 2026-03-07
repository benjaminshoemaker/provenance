# Provenance Profiles

A public, cumulative writer identity where every badge compounds into a verifiable reputation.

Think GitHub profiles, but for writing integrity.

---

## Why This Feature

### Individual badges need a repository

Right now, badges are atoms with no molecule. Each badge proves one document's process. But a reader encountering a writer for the first time has no way to know: Is this their first badge? Their fiftieth? Do they consistently use AI at 15%, or did they game one article? Do they reject most AI suggestions and use it as a thinking partner, or accept everything wholesale?

Individual badges are like individual git commits. They need a repository to become meaningful. Git without GitHub is a tool. Git with GitHub is a platform. Provenance without profiles is a tool. Provenance with profiles is a platform.

### It creates the missing flywheel

The current loop is: write → badge → verify → done. Dead end. With profiles, the loop becomes: write → badge → profile grows → reputation compounds → more motivation to write in Provenance → write. Every badge makes the profile more valuable, which makes the next badge more worth generating. This is the difference between a utility and a habit.

### It turns transparency into identity

"I verified this one article" is compliance. "I'm a verified writer with 30 transparently-written articles" is identity. The HN/indie blogger audience cares deeply about identity. They put "I use Arch Linux" in their bios. They'll put their Provenance profile there too — *if it represents cumulative proof of their writing integrity*.

### It gives readers a reason to care about badges

A badge on a single article by an unknown writer is easy to ignore. A badge that links to a profile showing 2 years of consistent, transparent writing is meaningful. The profile is what gives individual badges weight.

### It creates network effects

Profiles are linkable, shareable, discoverable. Writers link to them from their blogs, social bios, conference talk slides. Readers follow writers. A directory emerges organically. Provenance stops being a tool writers use privately and becomes a public graph of verified writers.

### It's the natural aggregation layer for everything already built

Badges exist. Stats exist. AI interaction patterns exist across documents. The profile is just the view that stitches them together. When timelapse ships, profiles become even richer — "Watch this writer's 5 most recent writing processes."

---

## What It Would Look Like

### Public Profile Page (`provenance.app/@username`)

**Header**
- Display name, avatar (from OAuth), username
- Bio (short, writer-provided)
- External links (blog URL, Twitter/X, GitHub, etc.)
- Member since date
- Embeddable profile badge (small widget for external sites)

**Aggregate Stats (Lifetime)**
- Total verified documents
- Total verified words
- Total writing time tracked
- AI usage distribution (median and range across all badges)
- Most-used AI modes (inline vs. side panel vs. freeform)

**AI Collaboration Pattern**
- A visual fingerprint of *how* this writer uses AI — not just *how much*
- Dimensions: suggestion acceptance rate, primary interaction mode, edit-after-accept rate, AI usage consistency across documents
- Rendered as a radar chart, petal diagram, or unique visual signature
- Updates with each new badge, so long-time users develop a distinctive, hard-to-fake pattern

**Badge Portfolio**
- Chronological grid of all published badges
- Each card shows: document title, date, AI percentage, word count
- Click-through to verification page (and timelapse, when available)
- Filter/sort by date, AI percentage, length

**Writing Activity**
- A contribution-graph-style heatmap showing writing days (like GitHub's green squares)
- Monthly/yearly writing volume trends

### Embeddable Profile Widget

A compact badge for blog sidebars, about pages, and social bios:

```html
<!-- HTML embed -->
<a href="https://provenance.app/@username">
  <img src="https://provenance.app/api/writers/username/badge"
    alt="Verified writer on Provenance — 23 articles, avg 18% AI-assisted"
    height="32" />
</a>
```

Shows: avatar, name, article count, median AI percentage. Links to full profile.

### Yearly Recap ("Provenance Wrapped")

An annual/monthly summary of a writer's process, generated automatically:

- "In 2026, you wrote 45,000 words across 12 verified articles"
- "You used AI for 14% of your content, mostly for editing"
- "You rejected 62% of AI suggestions"
- "Your longest writing session was 4.5 hours"
- "Your most AI-assisted piece was 'Understanding Transformers' (31%)"
- Shareable as a card/image — inherently social content that markets the platform

---

## Privacy Controls

Writers must have full control over what appears publicly:

- **Per-badge visibility**: Choose which badges appear on the profile (some writing may be private/sensitive)
- **Stats opt-out**: Option to hide aggregate stats while still showing the badge list
- **Profile visibility**: Public (default for verified writers), unlisted (accessible via direct link only), or private (profile page returns 404)
- **Bio and links**: Editable at any time
- **Delete profile**: Removes the public profile page; individual badge verification pages remain functional (they're independent artifacts)

Badges not included in the profile still work normally — they just don't appear in the portfolio view or contribute to aggregate stats.

---

## The Compound Effect with Other Features

These three features form a complete verification stack:

| Layer | Feature | What it proves |
|-------|---------|---------------|
| **Cryptographic** | Proof Bundle | This specific badge hasn't been tampered with |
| **Single document** | Writing Timelapse | This specific article was written this way |
| **Writer identity** | Provenance Profile | This writer consistently writes this way |

Each layer is independently valuable. Together, they create a verification system that works at every zoom level — from cryptographic proof of a single badge, to a visceral replay of one writing session, to a cumulative reputation built over years.

A reader clicks a badge → watches the timelapse → visits the profile → sees 40 other verified articles with consistent patterns → follows the writer. That's a trust pipeline that no single feature can deliver alone.

---

## Existing Data That Powers This

| Data Source | Already Captured | Role in Profile |
|---|---|---|
| Badges (stats JSON, document metadata) | Yes | Portfolio entries, aggregate stat computation |
| AI interactions (mode, action, provider) | Yes | AI collaboration pattern / fingerprint |
| Writing sessions (duration, active time) | Yes | Activity heatmap, total time stats |
| User model (name, image, OAuth provider) | Yes | Profile header identity |

New data required:
- `username` (unique, claimed by writer)
- `bio` (short text)
- `external_links` (JSON array of { label, url })
- `profile_visibility` (enum: public / unlisted / private)
- Per-badge `show_on_profile` flag (boolean, default true)

---

## Implementation Shape

### Data Layer

- Add `username`, `bio`, `external_links`, `profile_visibility` columns to users table
- Add `show_on_profile` column to badges table (default true)
- Username claim flow with validation (alphanumeric + hyphens, 3-30 chars, unique, no reserved words)

### Pages

| Route | Type | Auth | Purpose |
|-------|------|------|---------|
| `/@[username]` | SSR | No | Public profile page |
| `/settings/profile` | Client | Yes | Edit profile, manage badge visibility |

### API

- `GET /api/writers/[username]` — Public profile data + aggregate stats
- `GET /api/writers/[username]/badge` — Profile badge image (OG-style, cached)
- `PATCH /api/writers/me/profile` — Update bio, links, visibility
- `PATCH /api/badges/[id]/visibility` — Toggle show_on_profile

### Aggregate Stats Computation

Stats are derived from the writer's public badges at read time (or cached with invalidation on badge create/update):

- Median and range of AI percentage across badges
- Sum of word counts, writing time, session counts
- Mode distribution (count of inline vs. side panel vs. freeform interactions)
- Acceptance rate (accepted + partially_accepted / total non-blocked interactions)

### Profile Badge Image

Server-rendered via `@vercel/og` (same approach as document badges):
- Writer avatar, display name
- "N verified articles"
- "Avg X% AI-assisted"
- Provenance branding

---

## What It Does NOT Include (Scope Boundaries)

- **No social features**: No following, no feed, no comments, no likes. The profile is a portfolio, not a social network.
- **No discovery/directory (yet)**: No browse/search across profiles. That's a natural follow-on, but the profile itself must be valuable before discovery matters.
- **No writer-to-writer comparison**: No leaderboards, no "less AI than 90% of writers." Provenance is about transparency, not competition.
- **No mandatory profiles**: Writers can generate badges without ever claiming a username or making a profile. The profile is opt-in, additive, never gate-keeping.
