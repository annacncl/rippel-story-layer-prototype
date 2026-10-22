// ---------------------------------------------------------------------------
// Map setup: base style, mock sources, layer styling, and the story-card
// markup. Used by the single unified story mode (js/mode-story.js).
// ---------------------------------------------------------------------------

mapboxgl.accessToken = MAPBOX_TOKEN;

const US_BOUNDS = [
  [-127, 23],
  [-66, 50],
];

// Story-layer look, settled with Rippel on the Oct 21 call (replaces the
// earlier Design Options comparison panel): book icon, orange, small,
// circle shading, YouTube for podcasts. Same orange as live-copy/, which
// takes it from the real site's own accent.
const STORY_COLOR = "#fb923c";
const STORY_ICON_SIZE = 0.38; // ~23px badge, on par with the network pins (Oct 22)

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
// "shape-color" id (book and person shapes are both kept; the map uses
// the book).
// Mapbox's hosted glyph service only covers pre-emoji Unicode symbol/dingbat
// ranges, so a real book/person shape isn't renderable as a text-field glyph
// — icon-image is the only reliable path to an exact shape.
// ---------------------------------------------------------------------------
// Round 3: the icon is a solid colored badge (rounded square, white glyph,
// white rim + drop shadow) instead of a bare outlined glyph. The bare glyph
// was the least visible thing on the map — smaller and darker than the
// network pins — even though stories are the featured content. A rounded
// square also stays clearly distinct from both the teardrop network pins
// and the "circle" shading option. Glyphs are drawn in a 24-unit box and
// scaled into the badge by storyIconSVG() below.
const ICON_PATHS = {
  book: `<path d="M12 6 C10 4.3 6.5 3.8 3.2 4.7 V18.2 C6.5 17.3 10 17.8 12 19.5 C14 17.8 17.5 17.3 20.8 18.2 V4.7 C17.5 3.8 14 4.3 12 6 Z" fill="#fff" />
        <line x1="12" y1="6" x2="12" y2="19.5" stroke="{{color}}" stroke-width="1.6" />`,
  person: `<circle cx="12" cy="8" r="4.2" fill="#fff" />
        <path d="M4.5 20 C4.5 15.5 7.8 13.2 12 13.2 C16.2 13.2 19.5 15.5 19.5 20 Z" fill="#fff" />`,
};

// Multi-story signal: a white "+" chip on the badge's top-right corner,
// baked into the same flat image (a live-composited second layer was what
// previously read as a rendering glitch).
const MULTI_BADGE = `<circle cx="26.5" cy="5.5" r="5" fill="#fff" stroke="{{color}}" stroke-width="1.6" />
        <path d="M26.5 3 V8 M24 5.5 H29" stroke="{{color}}" stroke-width="1.8" stroke-linecap="round" />`;

// 160px raster at pixelRatio 2 = 80 CSS px at icon-size 1; the badge tile
// is 24/32 of that, so the badge tile is 60px x STORY_ICON_SIZE (0.38 → ~23px).
function storyIconSVG(shape, colorHex, multi) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 32 32">
      <defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#0f1114" flood-opacity="0.4" /></filter></defs>
      <rect x="3" y="4" width="24" height="24" rx="7" fill="${colorHex}" stroke="#fff" stroke-width="2.2" filter="url(#s)" />
      <g transform="translate(7 8) scale(0.667)">${ICON_PATHS[shape].replace(/{{color}}/g, colorHex)}</g>
      ${multi ? MULTI_BADGE.replace(/{{color}}/g, colorHex) : ""}
    </svg>`;
}

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
  const svg = storyIconSVG(shape, colorHex, multi);
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

// Region circles follow the "Show Networks & Initiatives" checkbox.
function applyRegionsVisibility(map) {
  const box = document.getElementById("toggle-networks");
  setLayerVisibility(map, ["regions-circle"], !box || box.checked);
}

function addBaseLayers(map, onReady) {
  // Each location gets a soft circle (a locator, not an implied boundary):
  // story locations in the story color, the other networks in gray.
  map.addSource("region-circles", { type: "geojson", data: REGION_CIRCLES_GEOJSON });
  map.addLayer({
    id: "regions-circle",
    type: "circle",
    source: "region-circles",
    paint: {
      "circle-radius": 26, // scaled with the ~23px badge (Oct 22)
      "circle-color": ["case", ["get", "hasStory"], STORY_COLOR, "#8a8a8a"],
      "circle-opacity": 0.14,
      "circle-stroke-width": 2,
      "circle-stroke-color": ["case", ["get", "hasStory"], STORY_COLOR, "#8a8a8a"],
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
  ensureStoryIcon(map, "book", STORY_COLOR, false, (normalId) => {
    ensureStoryIcon(map, "book", STORY_COLOR, true, (multiId) => {
      map.addLayer({
        id: "story-points-layer",
        type: "symbol",
        source: "story-points",
        layout: {
          "icon-image": ["case", [">", ["get", "count"], 1], multiId, normalId],
          "icon-size": STORY_ICON_SIZE,
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
  regions: ["regions-circle"],
  network: ["network-pins-layer"],
  stories: ["story-points-layer"],
};

// -------------------------- Story content builders --------------------------

function formatBadge(story) {
  return `<span class="format-badge">${story.formatIcon} ${story.format}</span>`;
}

// Story card media (round 3). Every card gets the same 16:9 media slot so a
// panel mixing videos, podcasts and written stories still reads as one
// system; only a small cue on top changes with what the story offers:
//   - playable video (YouTube / hosted file): thumbnail + play button. The
//     real player only loads on click ("facade"), so a 3-video location no
//     longer boots 3 YouTube iframes, and YouTube's own chrome doesn't
//     clash with the other cards until someone actually presses play.
//   - video with no embeddable player ("external"): same play button plus
//     an "on <source> ↗" label; opens the source page.
//   - podcast: play button + "Listen" chip; plays as audio or YouTube.
//   - multimedia piece ("experience"): opens in a large viewer over the map.
//   - written / multimedia: the image alone.
// A story with no image gets a designed fallback tile instead of a
// placeholder graphic, so a missing photo looks intentional, not broken.
const HEADPHONES_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="3" y="13" width="5" height="7" rx="2" fill="currentColor"/><rect x="16" y="13" width="5" height="7" rx="2" fill="currentColor"/></svg>`;

function mediaImage(story) {
  if (story.image) {
    // Optional per-story crop focus (e.g. keep a portrait's face in frame).
    const pos = story.imagePosition ? ` style="object-position: ${story.imagePosition}"` : "";
    return `<img src="${story.image}" alt="" loading="lazy"${pos} />`;
  }
  return `<span class="story-media-fallback" aria-hidden="true">
      <span class="story-media-fallback-icon">${story.formatIcon}</span>
      <span class="story-media-fallback-geo">${story.geography}</span>
    </span>`;
}


// Optional clip times on any playable source (client ask): `start`/`end`
// as seconds or "m:ss" / "h:mm:ss" on a `media` object, or on `audio` when
// it's given as { url, start, end } instead of a plain URL string. YouTube
// gets its own start=/end= params; audio/video files use a #t=start,end
// media fragment. Either way the player opens on just that segment.
function toSeconds(t) {
  if (t === undefined || t === null || t === "") return null;
  if (typeof t === "number") return t;
  return String(t).split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
}
function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
// Normalizes a source to { url, start, end } (seconds or null).
function clipSource(src) {
  if (!src) return null;
  if (typeof src === "string") return { url: src, start: null, end: null };
  return { url: src.url, start: toSeconds(src.start), end: toSeconds(src.end) };
}
function clipAttrs(clip) {
  return `${clip.start !== null ? ` data-media-start="${clip.start}"` : ""}${clip.end !== null ? ` data-media-end="${clip.end}"` : ""}`;
}
// Small "Clip 0:41–2:10" / "From 0:41" label so a viewer knows it isn't the whole thing.
function clipLabel(clip) {
  if (clip.start === null && clip.end === null) return "";
  const text = clip.end !== null ? `Clip ${formatTime(clip.start || 0)}–${formatTime(clip.end)}` : `From ${formatTime(clip.start)}`;
  return `<span class="story-media-source">${text}</span>`;
}

function renderMedia(story) {
  const m = story.media;
  // Podcasts play in the panel too, so nobody is sent off the map to
  // listen: their YouTube version (Rippel's pick — it shows the picture),
  // or the episode's own MP3 (`audio`) if there's no YouTube version. Same
  // play button as video, plus the "Listen" chip.
  if (story.format === "Podcast" && (story.audio || m)) {
    const useAudio = !m;
    const type = useAudio ? "audio" : m.type;
    const clip = clipSource(useAudio ? story.audio : m);
    return `<button type="button" class="story-media story-media-playable" data-media-type="${type}" data-media-url="${clip.url}"${clipAttrs(clip)}
        data-media-title="${story.title.replace(/"/g, "&quot;")}" aria-label="Listen to ${story.title.replace(/"/g, "&quot;")}">
      ${mediaImage(story)}<span class="story-media-play" aria-hidden="true"></span>
      <span class="story-media-chip">${HEADPHONES_SVG} Listen</span>${clipLabel(clip)}
    </button>`;
  }
  // A full multimedia piece (e.g. Fox Cities): too big for the panel, so it
  // opens in a large viewer over the map instead of a new tab.
  if (m && m.type === "experience") {
    return `<button type="button" class="story-media story-media-playable" data-media-type="experience" data-media-url="${m.url}"
        data-media-title="${story.title.replace(/"/g, "&quot;")}" aria-label="Open ${story.title.replace(/"/g, "&quot;")}">
      ${mediaImage(story)}<span class="story-media-play story-media-expand" aria-hidden="true"></span>
      <span class="story-media-source">Open the full experience</span>
    </button>`;
  }
  if (m && (m.type === "youtube" || m.type === "video")) {
    const clip = clipSource(m);
    return `<button type="button" class="story-media story-media-playable" data-media-type="${m.type}" data-media-url="${m.url}"${clipAttrs(clip)}
        data-media-title="${story.title.replace(/"/g, "&quot;")}" aria-label="Play ${story.title.replace(/"/g, "&quot;")}">
      ${mediaImage(story)}<span class="story-media-play" aria-hidden="true"></span>${clipLabel(clip)}
    </button>`;
  }
  if (m && m.type === "external") {
    const source = m.source || "source site";
    return `<a class="story-media story-media-playable" href="${m.url}" target="_blank" rel="noopener"
        aria-label="Watch ${story.title.replace(/"/g, "&quot;")} on ${source} (opens in a new tab)">
      ${mediaImage(story)}<span class="story-media-play" aria-hidden="true"></span>
      <span class="story-media-source">on ${source} ↗</span>
    </a>`;
  }
  return `<div class="story-media">${mediaImage(story)}</div>`;
}

// Swap a clicked facade for the real player, autoplaying (the click is the
// user gesture that allows it).
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".story-media-playable[data-media-url]");
  if (!btn) return;
  const { mediaType, mediaUrl, mediaTitle, mediaStart, mediaEnd } = btn.dataset;
  if (mediaType === "experience") {
    openStoryViewer(mediaUrl, mediaTitle);
    return;
  }
  if (mediaType === "audio") {
    // Episode art stays; a native audio bar sits along its bottom edge.
    const art = btn.querySelector("img, .story-media-fallback").outerHTML;
    btn.outerHTML = `<div class="story-media story-media-audio">${art}<audio src="${mediaUrl}${mediaFragment(mediaStart, mediaEnd)}" controls autoplay preload="none"></audio></div>`;
    return;
  }
  const sep = mediaUrl.includes("?") ? "&" : "?"; // playlist URLs already carry ?list=
  const clipParams = `${mediaStart ? `&start=${mediaStart}` : ""}${mediaEnd ? `&end=${mediaEnd}` : ""}`;
  const player =
    mediaType === "youtube"
      ? `<iframe src="${mediaUrl}${sep}rel=0&modestbranding=1&autoplay=1${clipParams}" title="${mediaTitle}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${mediaUrl}${mediaFragment(mediaStart, mediaEnd)}" controls autoplay playsinline></video>`;
  btn.outerHTML = `<div class="story-media">${player}</div>`;
});

// "#t=start,end" media fragment for native audio/video (stops at `end`).
function mediaFragment(start, end) {
  if (!start && !end) return "";
  return `#t=${start || 0}${end ? `,${end}` : ""}`;
}

// Large viewer over the map for a full multimedia piece. Closing (×, Esc, or
// a click on the dimmed backdrop) drops straight back to the map.
function openStoryViewer(url, title) {
  closeStoryViewer();
  const el = document.createElement("div");
  el.className = "story-viewer";
  el.innerHTML = `
    <div class="story-viewer-frame" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="story-viewer-bar">
        <span class="story-viewer-title">${title}</span>
        <a class="story-viewer-newtab" href="${url}" target="_blank" rel="noopener">Open in new tab ↗</a>
        <button type="button" class="story-viewer-close" aria-label="Close and return to the map">×</button>
      </div>
      <iframe src="${url}" title="${title}" allow="autoplay; fullscreen"></iframe>
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el || e.target.closest(".story-viewer-close")) closeStoryViewer();
  });
  document.body.appendChild(el);
  el.querySelector(".story-viewer-close").focus();
}
function closeStoryViewer() {
  document.querySelectorAll(".story-viewer").forEach((v) => v.remove());
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeStoryViewer();
});

// Default call-to-action wording per format; a story's own `linkLabel` wins.
function storyLinkLabel(story) {
  if (story.linkLabel) return story.linkLabel;
  if (story.format === "Podcast") return "Listen to the episode →";
  if (story.format === "Multimedia") return "Explore the story →";
  return "Read full story →";
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
        ${renderMedia(story)}
        <div class="story-card-body">
          ${formatBadge(story)}
          <h3>${story.title}</h3>
          <p class="teaser-excerpt">${story.excerpt}</p>
          <a class="teaser-link" href="${story.link}" target="_blank" rel="noopener">${storyLinkLabel(story)}</a>
        </div>
      </div>`
    )
    .join("");
}
