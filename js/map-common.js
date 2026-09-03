// ---------------------------------------------------------------------------
// Map setup: base style, mock sources, layer styling, and the teaser popup
// builder. Used by the single unified story mode (js/mode-story.js).
// ---------------------------------------------------------------------------

mapboxgl.accessToken = MAPBOX_TOKEN;

const US_BOUNDS = [
  [-127, 23],
  [-66, 50],
];

// Design Variants palette (Design Variants panel, js/design-variants.js).
// Placeholder hex values — swap for Rippel's exact brand purple/green once
// confirmed; these are here so the client has something concrete to react
// to on the call rather than a decision made unilaterally.
const MARKER_COLORS = {
  teal: "#2dd4bf",
  purple: "#9b7fd4",
  green: "#5fae6b",
  orange: "#d97b3f", // matches --amber, already used elsewhere on this map (Networks & Initiatives toggle, statewide badges)
};

function createMap(containerId) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: "mapbox://styles/mapbox/light-v11",
    bounds: US_BOUNDS,
    fitBoundsOptions: { padding: 30 },
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
  return map;
}

// ---------------------------------------------------------------------------
// Story marker icons — rasterized on demand from inline SVG and cached by
// "shape-color" id, so the Design Variants panel can switch icon-image
// live (map.setLayoutProperty) without re-decoding anything already shown.
// Mapbox's hosted glyph service only covers pre-emoji Unicode symbol/dingbat
// ranges, so a real book/person shape isn't renderable as a text-field glyph
// — icon-image is the only reliable path to an exact shape.
// ---------------------------------------------------------------------------
const ICON_PATHS = {
  book: `<path d="M12 6 C10 4.3 6.5 3.8 3.2 4.7 V18.2 C6.5 17.3 10 17.8 12 19.5 C14 17.8 17.5 17.3 20.8 18.2 V4.7 C17.5 3.8 14 4.3 12 6 Z"
          fill="{{color}}" stroke="#0f1114" stroke-width="1.4" stroke-linejoin="round" />
        <line x1="12" y1="6" x2="12" y2="19.5" stroke="#0f1114" stroke-width="1.1" />`,
  person: `<circle cx="12" cy="8" r="4.2" fill="{{color}}" stroke="#0f1114" stroke-width="1.4" />
        <path d="M4.5 20 C4.5 15.5 7.8 13.2 12 13.2 C16.2 13.2 19.5 15.5 19.5 20 Z"
          fill="{{color}}" stroke="#0f1114" stroke-width="1.4" stroke-linejoin="round" />`,
};

// Multi-story signal: a bold "+" baked directly into the icon artwork as
// one flat image, not a separate map layer or DOM marker — the previous
// "peeking second icon" attempt was two live-composited layers trying to
// stay aligned, which is exactly what read as a rendering glitch. Drawn
// twice (dark wide stroke behind, colored narrow stroke in front) for the
// same halo-outline effect the rest of the icon already uses for contrast
// against the light basemap.
const MULTI_BADGE = `<path d="M20 1.8 V8.2 M16.8 5 H23.2" stroke="#0f1114" stroke-width="4.2" stroke-linecap="round" />
        <path d="M20 1.8 V8.2 M16.8 5 H23.2" stroke="{{color}}" stroke-width="2.4" stroke-linecap="round" />`;

const registeredIcons = new Set();

// Single shared "currently open popup" reference. Mapbox's own Popup
// closeOnClick option turned out not to reliably close these against a
// background map click in testing, so closing is handled explicitly here
// instead of relying on that default — both on background click (see
// js/mode-story.js) and whenever a different popup opens (so clicking a
// second nearby marker doesn't leave two popups stacked open).
let activePopup = null;
function closeActivePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}
function openPopup(map, lngLat, html, options) {
  closeActivePopup();
  activePopup = new mapboxgl.Popup({ closeOnClick: false, ...options }).setLngLat(lngLat).setHTML(html).addTo(map);
  activePopup.on("close", () => {
    activePopup = null;
  });
  return activePopup;
}

// Ensures `<shape>-<color>[-multi]` is registered as a Mapbox image, then
// calls back with its id. Safe to call repeatedly — already-registered
// combos resolve on the next microtask without re-decoding the SVG.
function ensureStoryIcon(map, shape, colorHex, multi, callback) {
  const id = `story-icon-${shape}-${colorHex.replace("#", "")}${multi ? "-multi" : ""}`;
  if (registeredIcons.has(id)) {
    callback(id);
    return;
  }
  const badge = multi ? MULTI_BADGE.replace(/{{color}}/g, colorHex) : "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
      ${ICON_PATHS[shape].replace(/{{color}}/g, colorHex)}${badge}
    </svg>`;
  const img = new Image();
  img.onload = () => {
    if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
    registeredIcons.add(id);
    callback(id);
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// ---------------------------------------------------------------------------
// Guided-tour "active stop" highlight — a single glow ring shown only around
// whichever location the tour is currently on, so a future narration track
// has an obvious visual anchor. Reuses the same DOM-marker technique.
// ---------------------------------------------------------------------------
let tourHighlightMarker = null;

function showTourHighlight(map, coordinates) {
  hideTourHighlight();
  const el = document.createElement("div");
  el.className = "story-tour-highlight";
  tourHighlightMarker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat(coordinates).addTo(map);
}

function hideTourHighlight() {
  if (tourHighlightMarker) {
    tourHighlightMarker.remove();
    tourHighlightMarker = null;
  }
}

// ---------------------------------------------------------------------------
// Shading style (Design Variants panel): 'blob' (default, organic soft-edge
// polygons) vs 'circle' (plain anchor-point dots — reads as "just a
// locator," not an implied boundary). Both layer sets are always present;
// this just controls which is visible, respecting the existing "Show
// Networks & Initiatives" checkbox state.
// ---------------------------------------------------------------------------
let currentShadingStyle = "blob";

function applyRegionsVisibility(map) {
  const box = document.getElementById("toggle-networks");
  const visible = !box || box.checked;
  setLayerVisibility(map, ["regions-fill"], visible && currentShadingStyle === "blob");
  setLayerVisibility(map, ["regions-circle"], visible && currentShadingStyle === "circle");
}

function setShadingStyle(map, style) {
  currentShadingStyle = style;
  applyRegionsVisibility(map);
}

function addBaseLayers(map, onReady) {
  // Shaded geography regions — organic blob (default). Fill-only, no
  // border line (internal team review, 2026-09-01: a hard outline made
  // the shape read as a defined boundary rather than soft emphasis).
  map.addSource("regions", { type: "geojson", data: REGIONS_GEOJSON });
  map.addLayer({
    id: "regions-fill",
    type: "fill",
    source: "regions",
    paint: {
      "fill-color": ["case", ["get", "hasStory"], "#2dd4bf", "#8a8a8a"],
      "fill-opacity": 0.16,
    },
  });

  // New Hampshire (statewide) has no area shading right now — an oval
  // blob and a real-state-boundary fill were both tried and both dropped
  // (neither actually communicated "statewide" well). Still gets its
  // marker + circle-mode anchor dot; flagged as an open design question
  // in README.md rather than guessed at with a third geometry style.

  // Shaded geography regions — plain circle alternative (Design Variants).
  // Deliberately bigger than the per-marker halo (17-24px radius) and
  // drawn as a lighter fill + crisp stroke, not a small solid dot — a
  // same-size-as-the-halo circle here was visually indistinguishable from
  // the halo that's already on every marker, making the blob/circle
  // toggle look like it wasn't doing anything.
  map.addSource("region-circles", { type: "geojson", data: REGION_CIRCLES_GEOJSON });
  map.addLayer({
    id: "regions-circle",
    type: "circle",
    source: "region-circles",
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 34,
      "circle-color": ["case", ["get", "hasStory"], "#2dd4bf", "#8a8a8a"],
      "circle-opacity": 0.14,
      "circle-stroke-width": 2,
      "circle-stroke-color": ["case", ["get", "hasStory"], "#2dd4bf", "#8a8a8a"],
      "circle-stroke-opacity": 0.8,
    },
  });

  // Network / organization pins (plain markers) — matches the live map's accent blue
  map.addSource("network-pins", { type: "geojson", data: NETWORK_PINS_GEOJSON });
  map.addLayer({
    id: "network-pins-layer",
    type: "circle",
    source: "network-pins",
    paint: {
      "circle-radius": 5,
      "circle-color": "#3b82c4",
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
    },
  });

  // Story points — deliberately a different SHAPE, not just a different
  // color, from the plain circular org/network pins. Color alone won't stay
  // a reliable signal once the real map is showing many more categories, so
  // this needs to read as "different kind of thing" regardless of palette.
  const storyPoints = getStoryPointsGeoJSON();
  map.addSource("story-points", { type: "geojson", data: storyPoints });
  // No circular halo behind the icon anymore — it competed visually with
  // the region-level "circle" shading option, making both read as the
  // same kind of thing. That also removes the halo-size/opacity
  // distinction that was carrying the multi-story signal; a pulsing ring
  // and a "peeking" second icon were tried for that earlier and both
  // dropped too. No replacement signal is in place right now — flagged as
  // an open question rather than guessed at silently.

  // icon-image requires both images to be registered first, which is an
  // async decode step (even from a data URI) — the rest of addBaseLayers
  // runs synchronously as before, and only this dependent layer (plus the
  // click/hover wiring that targets it) waits on it.
  ensureStoryIcon(map, "book", MARKER_COLORS.teal, false, (normalId) => {
    ensureStoryIcon(map, "book", MARKER_COLORS.teal, true, (multiId) => {
      map.addLayer({
        id: "story-points-layer",
        type: "symbol",
        source: "story-points",
        layout: {
          "icon-image": ["case", [">", ["get", "count"], 1], multiId, normalId],
          "icon-size": 0.5,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      map.on("mouseenter", "story-points-layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "story-points-layer", () => (map.getCanvas().style.cursor = ""));
      if (onReady) onReady();
    });
  });

  map.on("mouseenter", "network-pins-layer", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "network-pins-layer", () => (map.getCanvas().style.cursor = ""));

  // Simple "list of links" style popup for plain network pins
  map.on("click", "network-pins-layer", (e) => {
    const f = e.features[0];
    openPopup(
      map,
      f.geometry.coordinates,
      `<div class="plain-popup">
        <strong>${f.properties.name}</strong>
        <ul>
          <li><a href="#" onclick="return false;">Org profile</a></li>
          <li><a href="#" onclick="return false;">Local projects</a></li>
        </ul>
      </div>`,
      { closeButton: true, maxWidth: "220px" }
    );
  });
}

function setLayerVisibility(map, layerIds, visible) {
  layerIds.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

const LAYER_GROUPS = {
  regions: ["regions-fill", "regions-circle"],
  network: ["network-pins-layer"],
  stories: ["story-points-layer"],
};

// -------------------------- Story content builders --------------------------

function formatBadge(story) {
  return `<span class="format-badge">${story.formatIcon} ${story.format}</span>`;
}

// Renders a story's media: an embedded player when `media` is present,
// otherwise the plain image — used by both the single-story popup and the
// multi-story cluster/tour cards so embed markup only lives in one place.
function renderMedia(story, imgClass) {
  if (!story.media) {
    return `<img class="${imgClass}" src="${story.image}" alt="${story.title}" />`;
  }
  if (story.media.type === "youtube") {
    const autoplay = story.media.autoplay ? "&autoplay=1&mute=1" : "";
    return `<div class="story-media-embed">
      <iframe
        src="${story.media.url}?rel=0&modestbranding=1${autoplay}"
        title="${story.title}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>`;
  }
  const attrs = story.media.autoplay ? "autoplay muted loop playsinline" : "controls playsinline";
  return `<div class="story-media-embed"><video src="${story.media.url}" ${attrs} poster="${story.image || ""}"></video></div>`;
}

// Single-story floating popup (self-guided click on a location with exactly
// one story). Multi-story locations use the cluster panel instead — see
// js/mode-story.js.
function buildTeaserHTML(story) {
  return `
    <div class="teaser-popup">
      <div class="teaser-series-tag">Stories of Communities Thriving Together</div>
      ${renderMedia(story, "teaser-image")}
      <div class="teaser-body">
        ${formatBadge(story)}
        <h3>${story.title}</h3>
        <p class="teaser-geo">${story.geography}</p>
        <p class="teaser-excerpt">${story.excerpt}</p>
        <a class="teaser-link" href="${story.link}" target="_blank" rel="noopener">Read full story →</a>
      </div>
    </div>
  `;
}

function openStoryTeaser(map, feature) {
  const storyIds = JSON.parse(feature.properties.storyIds);
  const story = getStoryById(storyIds[0]);
  return openPopup(map, feature.geometry.coordinates, buildTeaserHTML(story), {
    closeButton: true,
    maxWidth: "260px",
    offset: 14,
  });
}

// Stacked list of story cards — shared by the cluster panel (self-guided
// click on a multi-story location) and every guided-tour step, so a
// multi-story stop shows "everything going on here" in one place instead of
// flipping through separate popups one at a time.
function renderStoryCards(storyList) {
  return storyList
    .map(
      (story) => `
      <div class="story-card">
        ${renderMedia(story, "story-card-image")}
        <div class="story-card-body">
          ${formatBadge(story)}
          <h3>${story.title}</h3>
          <p class="teaser-excerpt">${story.excerpt}</p>
          <a class="teaser-link" href="${story.link}" target="_blank" rel="noopener">Read full story →</a>
        </div>
      </div>`
    )
    .join("");
}
