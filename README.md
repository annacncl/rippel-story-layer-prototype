# Story Layer Prototype (client demo)

Standalone prototype for a "story layer" on top of the Thriving Together
network map. **Completely separate from the live Rippel / Count Me In map**
— no Airtable connection, no shared code, no shared data. Map geography/
network pins are mock, but the 5 story records use real titles/excerpts
pulled from rippel.org, with "Read full story" linking to the real pages.
Safe to open, click around, and throw away.

Originally built as 3 separate switchable concepts (Guided Tour /
Self-Guided / Hybrid) for a live comparison meeting. Per internal team
feedback after that meeting, Guided Tour and Self-Guided have since been
**merged into one unified experience** — see "How it works" below.

## Setup (before the meeting)

1. Open [`js/config.js`](js/config.js) and paste in a Mapbox **public** token
   (starts with `pk.`) — get one from your existing Mapbox account at
   https://account.mapbox.com/access-tokens/. Any of your public tokens
   works fine; this prototype doesn't touch your production map or data.
2. Serve the folder over a local static server (Mapbox GL JS needs `http://`,
   not `file://`). From this directory:

   ```bash
   python3 -m http.server 8971
   ```

   Then open `http://localhost:8971` in a browser. (Pick any free port —
   just checking one isn't already in use with `lsof -i :PORT` first.)

   Any static server works — `npx serve`, VS Code's Live Server, etc.

## What's here

- `index.html` — real site chrome (header/stats, Filters panel, Nationwide
  Influence panel) plus a single unified story layer experience, clearly
  marked with a "PROTOTYPE" label bar so it's obvious what's new vs. what
  mirrors the live site.
- `js/data.js` — mock data for everything: 3 shaded story geographies (Inland
  Empire, Fox Cities, Lehigh Valley — North Sound was dropped, no real content
  was available for it), ~20 mock network pins, header stat counts, Regional
  Networks/Place-Based Influence/Nationwide Influence list content, and 5
  story records (Lehigh Valley has 3: two podcasts + a written piece, testing
  multi-story handling at one location).
- `js/map-common.js` — shared map setup: base layers, story-marker styling,
  teaser popup markup.
- `js/mode-story.js` — the unified story layer: self-guided base +
  opt-in guided tour. See "How it works" below.
- `js/filters-panel.js` — wires the persistent left Filters panel and right
  Nationwide Influence panel (search, geographic scope filter, layer toggles,
  panel collapse) via `window.getActiveMap()`.
- `js/app.js` — boots the single story mode and exposes
  `window.currentStoryToggleHandler` for the Filters panel's "Show Story
  Layer" checkbox.

## How it works (merged Guided Tour + Self-Guided)

1. **Self-guided is the default.** On load, the map is fully navigable and
   story markers are clickable for a teaser popup — never an auto-advancing
   walkthrough.
2. **The guided tour is an explicit, visible choice.** A banner
   ("🧭 Prefer a guided walkthrough? → Take a guided tour of stories") is
   shown as soon as the map loads, not something you only discover by
   already being in a tour. Dismissible via its own ×.
3. **Exiting the tour is non-sticky.** "Exit tour" (available at every step,
   not just the last) drops you back into free self-guided browsing.
   Toggling "Show Story Layer" off and back on also always lands you in
   self-guided — it never resumes or re-triggers the tour. The tour only
   starts via the explicit banner button.
4. **Story markers are a distinct shape, not just a color** — an open-book
   icon layer, not a circle. Color alone won't stay a reliable signal once
   the real map is showing many more categories, so this needs to read as
   "different kind of thing" regardless of palette.
5. **Teaser popup content/behavior is unchanged** — same image + excerpt +
   "Read full story" link pattern as before, whether you reach it by
   clicking a marker in self-guided mode or by stepping through the tour.

### Assumptions flagged (state management)

- Tour state (`tourActive`, current step) lives only in the JS closure —
  nothing is persisted to a URL param or storage, so a full page reload
  always lands back in self-guided.
- The banner's dismiss (×) hides it only until the next transition back into
  self-guided (toggling the layer off/on, or exiting a tour) — not a
  permanent per-user dismissal, since there's no persistence layer here to
  remember that across page loads.
- The 3 original mode files (`mode-guided.js`, `mode-explore.js`,
  `mode-hybrid.js`) were deleted rather than left as dead code, since they're
  no longer referenced anywhere. They're not git-tracked in this folder, so
  this isn't easily undoable — flagging in case that old 3-way comparison is
  still wanted for some future conversation.

## The real site chrome (not just styling)

The header (logo, title, live-looking stat counts), the left **Filters**
panel, and the right **Nationwide Influence** panel are full functional
rebuilds of the live map's actual layout — not a styling pass on top of a
simplified mockup:

- **Search Organizations** — filters both list sections below by name, live.
- **Geographic Scope** (All / Statewide / Local) — actually filters the
  network pins on the map via a Mapbox filter expression.
- **Networks & Initiatives** toggle — shows/hides the shaded region layer.
- **Map Options** — "Show State Labels" toggles Mapbox's built-in state-label
  layer; "Show Story Layer" is the one new addition.
- **Regional Networks and Initiatives** / **Place-Based Influence** — scrollable
  lists with LOCAL/STATEWIDE badges, matching the live site's pattern.
- **Nationwide Influence** panel — org/network list with name + link, styled
  identically to the live site's right-hand panel.
- Both side panels collapse via the small tab at their inner edge, same as
  the live map, and the map canvas resizes to fill the freed space.

All list content (org names, stat counts) is invented mock data — same
promise as everywhere else in this prototype: zero connection to the real
Airtable base.

## Where the story content comes from

Pulled live from rippel.org (client-supplied links) on 2026-07-22:

| Story | Source |
|---|---|
| Dr. Paulette Brown-Hinds (Inland Empire podcast) | `rippel.org/podcasts/?podcast-id=7828` |
| Imagine Fox Cities (multimedia) | `rippel.org/foxcities/` |
| Samantha Shaak, PhD (Lehigh Valley podcast) | `rippel.org/podcasts/?podcast-id=7691` |
| Nate Boateng (Lehigh Valley podcast) | `rippel.org/podcasts/?podcast-id=5337` |
| LVHN written piece (Lehigh Valley) | `rippel.org/insights/a-pennsylvania-health-care-system-stewards-equitable-health-and-well-being/` |

"Read full story" opens these real pages in a new tab. Fox Cities and the
LVHN written piece use real images pulled from those pages; the 3 podcast
teasers use labeled placeholder images since the episode-specific headshot
URLs weren't safely extractable — swap in real photos in `js/data.js` any
time.

## Visual design

Restyled to match the live Thriving Together map
(annacncl.github.io/Count-Me-In-Live-Map) — colors, fonts, and chrome were
pulled directly from that site's CSS custom properties and computed styles:

- **Fonts**: Fraunces (serif, headlines) + DM Sans (sans-serif, UI/body) —
  loaded via Google Fonts in `index.html`.
- **Palette**: near-black background (`#0F1114`), dark surface panels
  (`#1A1D22`), rippel-teal accent (`#2DD4BF`) for story points/active states,
  blue accent (`#3B82C4`) for plain network pins.
- **Header**: recreates the live map's ring logo (a conic-gradient circle
  with a punched-out center) and dark header bar with serif title.
- **Chrome**: layer-control panels, popups, and Mapbox's own zoom control are
  all restyled to the dark theme so the prototype reads as something that
  could actually sit on top of the real map, not a separate app.

The basemap itself stays on stock `mapbox://styles/mapbox/light-v11` — only
the surrounding UI was restyled; swap in the live map's actual custom style
URL if you have access to it for even closer fidelity.

## Known limitations (intentional, this is a demo, not production)

- Geography "regions" are procedurally generated soft blobs centered near the
  real places, not actual boundary data — fine at US map scale for a demo.
- 3 of the 5 story images are placeholder blocks, not real photography (see
  table above).
- Filters panel list content (org/network names, stat counts) is invented
  mock data, not the real Airtable list — by design, per the zero-connection
  requirement.
- "About This Map" bar is decorative (click toggles the label text only, no
  real content panel).
- No mobile-specific layout pass — built for a laptop-in-a-meeting demo.
