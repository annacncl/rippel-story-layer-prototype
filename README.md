# Story Layer Prototype (client demo)

Standalone prototype for a "story layer" on top of the Thriving Together
network map. **Completely separate from the live Rippel / Count Me In map**
— no Airtable connection, no shared code, no shared data. Map geography/
network pins are mock, but most story records use real titles/excerpts
pulled from rippel.org, with "Read full story" linking to the real pages.
Safe to open, click around, and throw away.

Originally built as 3 separate switchable concepts (Guided Tour /
Self-Guided / Hybrid) for a live comparison meeting. Per internal team
feedback after that meeting, Guided Tour and Self-Guided have since been
**merged into one unified experience** — see "How it works" below.

**Round 2** (this pass) implements the client's meeting feedback: a cluster
panel for multi-story locations, blob-vs-circle shading comparison, a
Design Variants panel for live icon/color/size comparisons, media embeds,
and a first mobile pass. See "Round 2: client meeting feedback" below for
the full rundown, including what's still open.

**Also available: [`live-copy/`](live-copy/)** — the same story layer,
overlaid on an exact, unmodified copy of the real live map (real data,
real county density heat map, real filters) instead of this folder's
restyled recreation. Built so there's no ambiguity about what's real vs.
prototype when presenting — see [`live-copy/README.md`](live-copy/README.md).

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
- `js/data.js` — mock data for everything: 5 shaded story geographies (Inland
  Empire, Fox Cities, Lehigh Valley, South Texas/PJTT, New Hampshire —
  North Sound was dropped from round 1, no real content was available for
  it), ~20 mock network pins, header stat counts, Regional Networks/
  Place-Based Influence/Nationwide Influence list content, and 8 story
  records (Lehigh Valley has 3, South Texas has 2 — both multi-story
  cluster test cases; New Hampshire is a statewide, non-regional example).
- `js/map-common.js` — shared map setup: base layers, story-marker icon
  registration (book/person × 3 colors), the multi-story hotspot pulse, the
  blob/circle shading layers, media-embed rendering, and the teaser
  popup/story-card markup.
- `js/mode-story.js` — the unified story layer: self-guided base + opt-in
  guided tour, the multi-story cluster panel, and the dynamic map-resize
  behavior when a panel is open. See "How it works" below.
- `js/filters-panel.js` — wires the persistent left Filters panel and right
  Nationwide Influence panel (search, geographic scope filter, layer toggles,
  panel collapse) via `window.getActiveMap()`, plus the mobile default-collapse
  pass.
- `js/app.js` — boots the single story mode and exposes
  `window.currentStoryToggleHandler` for the Filters panel's "Show Story
  Layer" checkbox.
- `js/design-variants.js` — **dev-only** comparison tool for the client
  call (icon/color/size/shading). Not part of the pitched product — see
  "Round 2" below.

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
   icon by default (swappable — see "Round 2" below), not a circle. Color
   alone won't stay a reliable signal once the real map is showing many more
   categories, so this needs to read as "different kind of thing" regardless
   of palette.
5. **A single-story location opens a teaser popup; a multi-story location
   opens the cluster panel** listing every story there, without locking the
   map. The guided tour advances per **location**, not per story, using
   that same list view for every step — a multi-story stop just shows more
   than one card.

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

## Round 2: client meeting feedback

Everything below implements the client's post-meeting to-do list. Grouped by
topic, matching how the feedback was organized:

**Multi-story locations**
- The old small numeric badge is gone. A multi-story location now gets a
  bigger, more opaque halo (`story-points-halo`'s paint expression in
  `js/map-common.js`) plus a pulsing ring (`.story-hotspot-pulse`) that
  never fades below 45% opacity — deliberately two *static* signals, not
  purely an animation, since the first pass (a ring that faded to fully
  invisible for part of every cycle, with no halo difference) wasn't
  visible from the default map view at all. A "peeking second icon" stack
  effect was also tried and dropped — it read as a duplicate-icon
  rendering glitch rather than "there's more than one story here."
- Clicking a multi-story location opens the **cluster panel** — one panel
  listing every story there — instead of flipping through tabs. The map
  stays fully navigable while it's open, and clicking bare map (or a
  different marker) closes it.
- **South Texas (PJTT)** is the multi-story stress test the client asked
  for: 2 stories (1 real, 1 flagged mock — see below) at one marker. It
  originally had a 19-blob mock geometry standing in for its non-adjacent
  county footprint, but that (and, on a later pass, having no shaded
  region at all) both read badly in review — see "Fixed after client
  review" below. It now gets the same single-blob treatment as every other
  location; the "19 counties, non-adjacent" framing lives in the text
  subtitle instead of the geometry. If PJTT's real, non-contiguous service
  area needs depicting later, that likely wants real boundary data, not
  another mock geometry style.
- The guided tour now steps through **locations**, not individual stories —
  directly answering the open question about tour sequencing once a stop
  can hold more than one story.

**Geographic shading**
- The Design Variants panel (below) toggles between the original organic
  "blob" and a plain **circle** anchor-point style, so the client can judge
  live whether the blob reads as an implied boundary.
- **New Hampshire (statewide)** is the non-regional example requested — its
  `anchor` point (Concord, the state capital) is deliberately different
  from its blob's broad centroid, since "where does a statewide story
  anchor" was the open question. Circle mode shows this clearly: one dot at
  Concord instead of a state-sized blob.

**Icon / marker design — the Design Variants panel**
- `js/design-variants.js` + the "DESIGN OPTIONS" toolbar in-app: a
  **dev-only** tool, clearly labeled, so the client can click through icon
  (book/person), color (teal/purple/green), size (small/large), and shading
  (blob/circle) live during the call instead of judging static screenshots.
  Delete this file + its markup in `index.html` once decisions are made.
- Color hex values (`MARKER_COLORS` in `js/map-common.js`) are **placeholders**
  — not Rippel's exact brand purple/green — swatches to react to, not a
  decision made unilaterally.
- Default marker size is now smaller (`icon-size: 0.5`, was `0.75`) to
  address the crowding complaint directly; "Large" in the panel is the old
  size, kept for comparison.
- Per-format icon/color differentiation (uniform vs. by content type) is
  deliberately **not decided** — no toggle for it exists yet, per the
  client's own note that this doesn't need an answer yet.

**Audio/video & tour narration**
- Stories can carry an optional `media: { type: "youtube"|"video", url,
  autoplay }` field (`js/data.js`); when present, `js/map-common.js`
  `renderMedia()` embeds a real player in place of the static image, in
  both the single-story popup and cluster/tour cards.
- The South Texas real story embeds a real YouTube video (found via public
  search, not invented) as the live example: default is click-to-play, no
  autoplay.
- The guided tour has an intro/preamble step (before Location 1) framing
  what the tour is and why these stories matter, and the active tour stop
  gets a highlight ring (`.story-tour-highlight`) as an anchor for future
  narration.
- **Not built**: actual recorded voiceover narration — there's no narration
  audio asset to embed, and none was provided. The framing text above is a
  placeholder script structure, not final copy; real narration copy/audio
  is a needed input from the client before this can go further.

**Layout / responsiveness**
- Cluster/tour panel bodies already scroll on overflow (`.guided-panel`'s
  existing `overflow-y: auto`); same for the single-story popup.
- This prototype had **zero** `@media` rules before this round — the
  client's note that panels "already default to collapsed on mobile"
  describes the live production site, not this static demo. This round
  adds a first, minimal mobile pass: both side panels collapse on load
  under 768px (`applyMobileDefaults()` in `js/filters-panel.js`), and an
  open story/cluster/tour panel overlays full-width instead of trying to
  share space with an already-narrow map.
- Opening a story/cluster/tour panel now actually shrinks the map (desktop)
  via the same CSS-variable + `map.resize()` pattern the Filters/Influence
  panels already used (`--story-panel-w` in `css/style.css`) — previously
  it only floated on top.

**Content / labeling**
- Every panel/popup now shows a "Stories about {place}" label above the
  content, and a one-line geography subtitle (e.g. "Southern California")
  under regional names a viewer might not recognize (`subtitle`/`shortName`
  on `STORY_GEOGRAPHIES` in `js/data.js`).

**Fixed after client review**
- The tour/cluster panel's Next/Back (or Close) buttons are now sticky to
  the panel's bottom edge (`.guided-nav` in `css/style.css`) — a 3-story
  location previously required scrolling past every card to find them.
- Clicking bare map now reliably closes an open single-story popup, not
  just the cluster panel. Mapbox's own `Popup` `closeOnClick` option
  turned out not to close it in testing, so popup lifecycle is now
  explicit (`openPopup()`/`closeActivePopup()` in `js/map-common.js`) —
  this also fixed clicking a second nearby marker leaving two popups open
  at once.
- The "peeking second icon" stack effect (tried for the multi-story
  signal) read as a duplicate-icon glitch and was dropped.
- **Real bug, not a design choice** (since fixed, then the whole approach
  was dropped anyway — see below): the pulse ring on the South Texas
  hotspot was briefly rendering at the map's origin corner instead of over
  Texas. Root cause: the ring's CSS animated `transform: scale(...)`
  directly on the same element Mapbox positions via inline `transform:
  translate(...)` — a CSS animation on a property overrides an inline
  value for that same property, so the pulse animation was silently
  cancelling the marker's real position.
- South Texas's shading went through three states this round — 19
  scattered blobs (too noisy), then no shading at all (inconsistent with
  every other location) — before landing on the same single blob every
  other location gets, per "everything should be consistent" feedback.
- The circle-shading mode's dots were only 7px radius — smaller than the
  17-24px halo already on every marker, so switching blob↔circle barely
  looked different. Circle mode is now a deliberately bigger (34px),
  lighter-fill ring with a crisp stroke, clearly distinct from the halo.

**Incorporated from the Sept 1 internal team call**
- Blob regions are now fill-only, no border line — a hard outline made the
  shape read as a defined boundary rather than soft emphasis (team
  consensus, independent of the client's own reaction to it).
- New Hampshire (statewide) briefly shaded the real state polygon instead
  of an oval blob — see the critical design pass below for why that was
  dropped too.

**Critical design pass (removed, not yet replaced)**
- The per-marker halo (the small circle behind every story icon) is gone.
  It competed with the region-level "circle" shading option — both were
  circles doing conceptually different jobs (marking an exact point vs.
  shading an area), which made neither read clearly. This also removes
  the halo size/opacity difference that was carrying the multi-story
  signal, since the halo itself is gone — **there is currently no visual
  signal for "this location has more than one story" beyond the icon
  itself.** Prior attempts (count badge, pulsing ring, bigger/brighter
  halo, a second peeking icon) were all tried and all dropped across three
  rounds of feedback; a genuinely different approach is needed, not
  another variation on a circle.
- New Hampshire's real-state-boundary fill (added, then made more visible,
  across the previous two rounds) is also gone — it still didn't
  communicate "statewide" clearly even once visible. New Hampshire
  currently has **no area shading at all** in blob mode (still gets its
  marker and its circle-mode anchor dot at Concord). Options worth
  discussing for both of these open questions: no map-level signal at all
  (rely on the panel text, e.g. "Stories about New Hampshire" + the
  subtitle already there); a distinct icon or size for multi-story
  markers instead of a decoration around the existing one; a soft,
  heavily-feathered radial glow for statewide instead of any bounded
  shape; or a text label rendered directly on the map. Not decided —
  flagging the options rather than picking one unilaterally.

### Not part of this round (flagged back, not built here)

- **Tour composition** (limiting the tour to ~5–10 stories, mixing
  internally/externally produced content) — a content/curation decision for
  the real story set, not something to prototype with mock data.
- **PJTT's org name on the live Airtable map** — that's the real production
  system, outside this static mock prototype entirely.
- **Mapbox outbound-click analytics** and **GA referral bucketing for
  Mapbox traffic** — research questions about the live map's actual
  tooling, not prototype changes.
- **Story markers that coincide with a real network pin** — raised on the
  Sept 1 call (should it show as both a network and a story?) and left
  unresolved even internally ("let me write that down"). Not decided or
  built here; needs a design answer before it's worth prototyping.
- The Sept 4 follow-up call logistics.

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

Round 1, pulled live from rippel.org (client-supplied links) on 2026-07-22:

| Story | Source |
|---|---|
| Dr. Paulette Brown-Hinds (Inland Empire podcast) | `rippel.org/podcasts/?podcast-id=7828` |
| Imagine Fox Cities (multimedia) | `rippel.org/foxcities/` |
| Samantha Shaak, PhD (Lehigh Valley podcast) | `rippel.org/podcasts/?podcast-id=7691` |
| Nate Boateng (Lehigh Valley podcast) | `rippel.org/podcasts/?podcast-id=5337` |
| LVHN written piece (Lehigh Valley) | `rippel.org/insights/a-pennsylvania-health-care-system-stewards-equitable-health-and-well-being/` |

Round 2, found via public search on 2026-08-31 (not client-supplied — this
is the PJTT/South Texas real-content stand-in):

| Story | Source |
|---|---|
| Yvonne Pacheco (South Texas podcast, real, incl. real YouTube embed) | `rippel.org/podcast/stewardship-begins-with-listening-in-south-texas/` |

Two stories are entirely **mock/invented** for this round, clearly labeled
in `js/data.js`: "PJTT Network Update" (South Texas's second story, so that
location exercises the cluster panel and models mixing Rippel- with
PJTT-produced content) and "A Statewide Network Comes Together Across New
Hampshire" (the standalone statewide example).

"Read full story" opens the real pages in a new tab. Fox Cities and the
LVHN written piece use real images pulled from those pages; the 3 round-1
podcast teasers use labeled placeholder images since the episode-specific
headshot URLs weren't safely extractable; the South Texas podcast uses its
real YouTube thumbnail and a real embedded video — swap in real photos/media
in `js/data.js` any time.

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

- Geography "regions" (blob and circle styles alike) are procedurally
  generated, not actual boundary data — fine at US map scale for a demo.
  South Texas (PJTT) gets the same generic single-blob shape as every
  other location; its real, non-contiguous 19-county footprint isn't
  represented visually — only in the text subtitle (see "Round 2" above).
- Several story images are placeholder blocks, not real photography (see
  sourcing table above).
- Filters panel list content (org/network names, stat counts) is invented
  mock data, not the real Airtable list — by design, per the zero-connection
  requirement.
- "About This Map" bar is decorative (click toggles the label text only, no
  real content panel).
- Mobile layout is a first, minimal pass (round 2) — panels collapse and
  the story panel goes full-width, but there's no other mobile-specific
  tuning (e.g. touch gesture handling, font-size sweep). Still built
  primarily for a laptop-in-a-meeting demo.
- No real narration audio/voiceover — see "Round 2" above.
- The Design Variants panel (`js/design-variants.js`) is dev-only scaffolding
  for the client call, not a real settings UI — no persistence, no
  production styling polish.
