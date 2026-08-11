// ---------------------------------------------------------------------------
// Map setup: base style, mock sources, layer styling, and the teaser popup
// builder. Used by the single unified story mode (js/mode-story.js).
// ---------------------------------------------------------------------------

mapboxgl.accessToken = MAPBOX_TOKEN;

const US_BOUNDS = [
  [-127, 23],
  [-66, 50],
];

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

function addBaseLayers(map) {
  // Shaded geography regions
  map.addSource("regions", { type: "geojson", data: REGIONS_GEOJSON });
  map.addLayer({
    id: "regions-fill",
    type: "fill",
    source: "regions",
    paint: {
      "fill-color": [
        "case",
        ["get", "hasStory"],
        "#2dd4bf",
        "#8a8a8a",
      ],
      "fill-opacity": 0.16,
    },
  });
  map.addLayer({
    id: "regions-outline",
    type: "line",
    source: "regions",
    paint: {
      "line-color": ["case", ["get", "hasStory"], "#2dd4bf", "#8a8a8a"],
      "line-width": 1,
      "line-opacity": 0.5,
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

  // Story points — deliberately a different SHAPE (star), not just a
  // different color, from the plain circular org/network pins. Color alone
  // won't stay a reliable signal once the real map is showing many more
  // categories/colors, so this needs to read as "different kind of thing"
  // at a glance regardless of palette.
  map.addSource("story-points", { type: "geojson", data: getStoryPointsGeoJSON() });
  map.addLayer({
    id: "story-points-halo",
    type: "circle",
    source: "story-points",
    paint: {
      "circle-radius": 17,
      "circle-color": "#2dd4bf",
      "circle-opacity": 0.2,
    },
  });
  map.addLayer({
    id: "story-points-layer",
    type: "symbol",
    source: "story-points",
    layout: {
      "text-field": "★",
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-size": 22,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#2dd4bf",
      "text-halo-color": "#0f1114",
      "text-halo-width": 1.5,
    },
  });
  // Small count badge for locations with >1 story (Lehigh Valley), offset
  // to the upper-right of the star so it doesn't collide with the glyph.
  map.addLayer({
    id: "story-points-count",
    type: "symbol",
    source: "story-points",
    filter: [">", ["get", "count"], 1],
    layout: {
      "text-field": ["to-string", ["get", "count"]],
      "text-size": 10,
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-offset": [0.85, -0.85],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#0f1114",
      "text-halo-color": "#2dd4bf",
      "text-halo-width": 2,
    },
  });

  map.on("mouseenter", "network-pins-layer", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "network-pins-layer", () => (map.getCanvas().style.cursor = ""));
  map.on("mouseenter", "story-points-layer", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "story-points-layer", () => (map.getCanvas().style.cursor = ""));

  // Simple "list of links" style popup for plain network pins
  map.on("click", "network-pins-layer", (e) => {
    const f = e.features[0];
    new mapboxgl.Popup({ closeButton: true, maxWidth: "220px" })
      .setLngLat(f.geometry.coordinates)
      .setHTML(
        `<div class="plain-popup">
          <strong>${f.properties.name}</strong>
          <ul>
            <li><a href="#" onclick="return false;">Org profile</a></li>
            <li><a href="#" onclick="return false;">Local projects</a></li>
          </ul>
        </div>`
      )
      .addTo(map);
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
  regions: ["regions-fill", "regions-outline"],
  network: ["network-pins-layer"],
  stories: ["story-points-halo", "story-points-layer", "story-points-count"],
};

// -------------------------- Teaser popup builder --------------------------

function formatBadge(story) {
  return `<span class="format-badge">${story.formatIcon} ${story.format}</span>`;
}

function buildTeaserHTML(storyList, activeIndex = 0) {
  const story = storyList[activeIndex];
  const tabs =
    storyList.length > 1
      ? `<div class="teaser-tabs">
          ${storyList
            .map(
              (s, i) =>
                `<button class="teaser-tab ${i === activeIndex ? "active" : ""}" data-idx="${i}">${s.formatIcon} ${s.format}</button>`
            )
            .join("")}
        </div>`
      : "";

  return `
    <div class="teaser-popup">
      <div class="teaser-series-tag">Stories of Communities Thriving Together</div>
      ${tabs}
      <img class="teaser-image" src="${story.image}" alt="${story.title}" />
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

// Opens (or re-renders) a teaser popup for a story-point feature, with
// tab-switching support when multiple stories share one geography.
function openStoryTeaser(map, feature, popupRef) {
  const storyIds = JSON.parse(feature.properties.storyIds);
  const storyList = storyIds.map(getStoryById);
  let activeIndex = 0;

  const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: "260px", offset: 14 })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(buildTeaserHTML(storyList, activeIndex))
    .addTo(map);

  function rewire() {
    const el = popup.getElement();
    if (!el) return;
    el.querySelectorAll(".teaser-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeIndex = parseInt(btn.dataset.idx, 10);
        popup.setHTML(buildTeaserHTML(storyList, activeIndex));
        rewire();
      });
    });
  }
  rewire();

  if (popupRef) popupRef.current = popup;
  return popup;
}
