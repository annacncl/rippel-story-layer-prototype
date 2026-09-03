# Story layer on an exact copy of the live map

This folder is a byte-for-byte copy of the real, live "Thriving Together"
map — `index.html`, `orgs.json`, `networks.json`, and `tribal.geojson` are
copied directly from [annacncl/Count-Me-In-Live-Map](https://github.com/annacncl/Count-Me-In-Live-Map)
(public repo), with the story layer prototype added as a pure overlay on
top. Nothing about the real site was rewritten or restyled — this exists
because the top-level prototype in this repo (`../index.html`) is a
*recreation* of the live site's look, and recreations invite "wait, is
this the real thing or not?" questions. This version removes that
ambiguity: it's their actual map, actual data, actual filters — the only
new thing is the story layer.

## What's real vs. new

Everything **without** an `rp-` prefix (in CSS classes, HTML ids, and JS
globals) is the unmodified live site: the header stats, the county density
choropleth, tribal nation boundaries, the search/scope filters, the
Regional Networks / Place-Based Influence / Nationwide Influence lists,
the legend, the About This Map bar — all driven by the real `orgs.json`/
`networks.json`, not mock data.

Everything **with** an `rp-` prefix is the story layer prototype, fenced
into three clearly-marked blocks (search `STORY LAYER PROTOTYPE` in
`index.html`) — one in `<style>`, one in the HTML body, one in a `<script>`
appended after the real site's own script. Delete those three blocks to
get back to a pristine copy of the live site.

The story layer content itself (5 locations, 8 stories, the Design
Variants panel) is the same content as the top-level prototype — see
`../README.md` for the full write-up of what it does, what's mock vs.
real, and the client feedback it responds to. This file only covers what's
different about running it on the real map instead of the recreation.

## What's different from the top-level prototype

- **The map itself** is the real county-level density choropleth (purple
  ramp, `setFeatureState`-driven, no size limit) plus real tribal nation
  boundaries — not the simplified shaded-blob regions used in the
  top-level prototype's own "Networks & Initiatives" layer.
- **Network pins** are the real teardrop pin markers from the live site,
  not a plain circle layer.
- **All list content is real** — Regional Networks, Place-Based Influence,
  and Nationwide Influence show actual org/network names from
  `orgs.json`/`networks.json`, not invented placeholders.
- **The story panel is a fixed overlay**, matching how the live site's own
  sidebar/national panel already work (`backdrop-filter: blur()`,
  floating over a full-bleed map) — the top-level prototype instead
  resizes the map itself when a panel opens. Same visual effect, different
  mechanism, chosen to match the real site's existing pattern rather than
  add a second one.
- **"Show Story Layer"** was added as a second button in the real
  "Map Options" section, right next to the real "Show State Labels"
  button, reusing the live site's own `.network-toggle-btn` styling
  exactly rather than introducing new button chrome.

## Setup

Same as the top-level prototype — no build step, just a static server:

```bash
python3 -m http.server 8972
```

Then open `http://localhost:8972`. No Mapbox token to paste in — this
folder's `index.html` already has the real site's own token, copied as-is
(it's a public token, safe to ship in client-side code the same way the
live site itself does).

## Known gaps from this being a copy, not a live sync

- `orgs.json`/`networks.json`/`tribal.geojson` are a **snapshot** from
  whenever this copy was made — they will not reflect changes to the real
  Airtable base going forward. The live site's own
  `.github/workflows/update-map.yml` + Python fetch scripts weren't
  copied here, since re-running those needs Airtable credentials this repo
  doesn't have and isn't meant to.
- If the live site's own `index.html` changes after this copy was made,
  those changes won't appear here automatically — this is a snapshot, not
  a live mirror.
