# DESIGN_SYSTEM.md

Design system for Provenance. All UI work must follow these patterns.

Reference mockups: `/mockups/ui-mockups.html`

---

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `provenance-50` | `#f0f4ff` | Active sidebar item bg, subtle highlights |
| `provenance-100` | `#dbe4ff` | Badge landmark border |
| `provenance-500` | `#4c6ef5` | Focus rings |
| `provenance-600` | `#3b5bdb` | Primary buttons, badge landmarks |
| `provenance-700` | `#364fc7` | Logo diamond, brand accent |
| `provenance-900` | `#1c2541` | Badge landmark text |

## Semantic Colors

| Purpose | Color | Token |
|---------|-------|-------|
| AI origin | Violet `rgba(139, 92, 246, 0.08)` bg, `rgba(139, 92, 246, 0.2)` border | `origin-ai` |
| Paste origin | Orange `rgba(249, 115, 22, 0.08)` bg, `rgba(249, 115, 22, 0.15)` border | `origin-paste` |
| Human origin | No visual treatment (default) | — |
| AI interaction badge | `bg-violet-100 text-violet-700` | — |
| Paste event badge | `bg-orange-100 text-orange-700` | — |
| Accepted status | `bg-emerald-100 text-emerald-700` | — |
| Rejected status | `bg-red-100 text-red-700` | — |
| Modified status | `bg-amber-100 text-amber-700` | — |
| Draft status | `bg-gray-100 text-gray-500` | — |
| Has Badge dot | `bg-emerald-500` | — |
| Draft dot | `bg-gray-300` | — |
| Archived dot | `bg-gray-200` + `opacity-60` on row | — |

## Badge AI Percentage Color Scale

| Range | Color | Tailwind |
|-------|-------|----------|
| 0–25% | Green | `bg-emerald-600` |
| 26–50% | Amber | `bg-amber-500` |
| 51–75% | Orange | `bg-orange-500` |
| 76–100% | Red | `bg-red-500` |

---

## Typography

- **Font**: Geist (sans) / Geist Mono (monospace) — already configured
- **Titles**: `text-2xl font-bold` (page), `text-xl font-bold` (section)
- **Document title input**: `text-2xl font-bold` editable input, no border
- **Body text**: `text-base leading-7 text-gray-800`
- **Labels/metadata**: `text-xs text-gray-400`
- **Badges/chips**: `text-[10px] font-medium` with colored bg/text
- **Mono elements**: Verification IDs, timestamps use `font-mono`

---

## Spacing

- **Page padding**: `px-6 py-8` (dashboard), `px-16 py-8` (editor content area)
- **Card/section gap**: `gap-4` (standard), `gap-3` (compact grids)
- **Editor max width**: `max-w-3xl mx-auto` for prose content
- **Dashboard max width**: Full width within sidebar layout
- **Section spacing**: `space-y-5` or `space-y-4`

---

## Layout Patterns

### Dashboard (Left Sidebar)

```
+------------+----------------------------------+
| Sidebar    | Content Area                     |
| w-56       | flex-1 p-6                       |
|            |                                  |
| All Docs   |  Search bar                      |
| Recent     |  Document row 1                  |
| Archive    |  Document row 2                  |
| Trash      |  Document row 3                  |
|            |                                  |
| --------   |                                  |
| Settings   |                                  |
+------------+----------------------------------+
```

- **Sidebar**: `w-56 border-r border-gray-100 bg-gray-50/50 p-4`
- **Active item**: `bg-provenance-50 text-provenance-700 rounded-md font-medium`
- **Inactive item**: `text-gray-600 hover:bg-gray-100 rounded-md`
- **Divider**: `mt-auto` pushes Settings to bottom
- **No top filter tabs** — sidebar handles both navigation and filtering

### Document Row

```
[status dot] Title                          date
             Preview text snippet...
             [12% AI badge] [word count]
```

- Container: `px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100`
- Status dot: `w-2.5 h-2.5 rounded-full` (emerald/gray/lighter gray)
- Title: `font-medium text-sm truncate`
- Preview: `text-xs text-gray-400 truncate`
- AI badge: `px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded`
- Word count: `text-[10px] text-gray-400`

### Editor (Full Width)

```
+------------------------------------------+
| <- Dashboard   Title input     [History] |
| Toolbar: B I | H1 H2 | Link Image Code  |
| Origin legend: o Human  o AI  o Pasted   |
+------------------------------------------+
|                                          |
|   Full-width prose editor                |
|   (max-w-3xl mx-auto)                   |
|                                  [AI]    | <- Floating margin icon
|                                          |
+------------------------------------------+
```

- **No side panels** — editor is full-width
- **No activity bar** — removed
- **No resizable panels** — removed
- **AI interactions**: Gemini-style floating margin icon + Cmd+K freeform modal
- **Timeline access**: Clock/history icon button in toolbar
- **Origin legend**: In toolbar area — small dots with labels

---

## Component Patterns

### Origin Marks (Editor)

Subtle inline styling on text spans to show content provenance:

- **AI text**: Light violet background tint + thin violet bottom border
- **Pasted text**: Light orange background tint + thin orange bottom border
- **Human text**: No visual treatment (default)

These marks are non-intrusive — light enough to read through but visible on inspection.

### Inline AI Widget (Gemini-Style)

Three-stage interaction:

1. **Floating icon**: Always visible in right margin, positioned at current cursor line
   - Small circular button with sparkle/pen icon
   - `w-8 h-8` or similar, subtle styling

2. **Action menu** (on icon click):
   - "Modify with a prompt" text input at top
   - Preset actions: Rephrase, Shorten, Elaborate, More formal, More casual, Bulletize, Summarize
   - Menu appears as dropdown/popover anchored to the icon

3. **Inline suggestion card** (after AI responds):
   - Appears below the selected/target text, inline in the document
   - Shows AI result text
   - "Refine with a prompt" input field
   - Action buttons: Refine, Insert
   - Track-changes diff style for replacements

### Track-Changes Diff

For showing AI suggestions vs original text:

- **Removed text**: `text-decoration: line-through; color: #ef4444; background: rgba(239, 68, 68, 0.08)`
- **Added text**: `color: #059669; background: rgba(5, 150, 105, 0.08); text-decoration: underline`
- Prose-style inline diff (NOT code-style red/green blocks)

### Verification Page (Desktop)

```
+------------------------------------------+
| Logo | Provenance | Verified Writing      |
+------------------------------------------+
| Title                                    |
|                                          |
| [HERO 12%] [88%] [8 chats] [3 sess] [2h]|
|  emerald    gray   gray      gray   gray |
|                                          |
| > What this badge certifies              |
| > How the AI percentage is calculated    |
+------------------------------------------+
```

- **Hero stat**: `bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50`
- **Hero number**: `text-4xl font-bold text-emerald-700`
- **Secondary stats**: `bg-gray-50 rounded-xl p-5 text-center`
- **Grid**: `grid grid-cols-5 gap-4`
- **Collapsible sections**: `<details>` with `border border-gray-200 rounded-lg`

### Verification Page (Mobile)

- Hero stat: `text-5xl font-bold` in full-width emerald gradient card
- Stat grid: `grid grid-cols-2 gap-3` (2x2 layout)
- Timeline and document text: collapsible `<details>` sections
- Sticky header with logo and verification ID

### Audit Timeline

Three-tier visual weight:

1. **AI interactions** (full cards): Bordered card with expandable content, violet accent
2. **Paste events** (compact row): Single-line with orange badge
3. **Revisions** (de-emphasized): Gray text, grouped ("8 revisions over 15 min")

Structure:
- **Day separators**: Centered date between horizontal rules
- **Session groups**: Green play icon + session label + time range
- **Timeline rail**: Vertical 2px gray line with colored dots
- **Dots**: `w-2.5 h-2.5 rounded-full` — violet (AI), orange (paste), gray (revision)
- **Minimap**: Horizontal bar showing writing/AI/paste distribution over time
- **Filter chips**: `px-2.5 py-1` with colored dot and count
- **Badge landmark**: Full-width emerald card at end of timeline

Access points:
- Editor toolbar button (clock/history icon)
- Document card action on dashboard

### Pre-Publish Badge Preview

- **Warning banner**: `bg-amber-50 border-b border-amber-200` with triangle icon
- **Stat summary**: `grid grid-cols-3 gap-3` compact version
- **Sensitive sections**: Expandable `<details>` with colored borders:
  - AI interactions: `border-violet-200 bg-violet-50/30`
  - Paste events: `border-orange-200 bg-orange-50/30`
  - Document text: `border-gray-200`
- **Permanence note**: `text-xs text-gray-500 bg-gray-50 rounded-lg p-3`
- **CTA**: `bg-provenance-600 text-white rounded-lg`

### Embeddable Badges

Primary style (shields.io):
```
[Provenance | 12% AI]
 gray-700     color-scaled
```

- Two-section inline badge: `rounded overflow-hidden text-xs font-medium shadow-sm`
- Left section: `bg-gray-700 text-gray-100` with "Provenance" label
- Right section: Color-scaled by AI percentage (see color scale above)

---

## States

| State | Treatment |
|-------|-----------|
| Hover (row) | `hover:bg-gray-50` |
| Hover (sidebar item) | `hover:bg-gray-100` |
| Active (sidebar item) | `bg-provenance-50 text-provenance-700 font-medium` |
| Focus (input) | `focus:ring-2 focus:ring-provenance-500/20 focus:border-provenance-500` |
| Archived (row) | `opacity-60` |
| Saving | "Saving..." text indicator |
| Saved | "Saved" text indicator |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Freeform AI modal |
| (To be defined) | Open AI inline widget |

---

## What's NOT in scope (deferred)

- Minimalistic editor redesign (v2 brainstorm)
- Conversational AI chat panel (removed, add back later)
- Dark mode (CSS variables exist but not actively designed for)
- Resizable/collapsible panels (dropped in favor of full-width editor)
