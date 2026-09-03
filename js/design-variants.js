// ---------------------------------------------------------------------------
// DEV-ONLY comparison tool for the client call — lets someone click through
// icon/color/size/shading options live on the actual map instead of judging
// static screenshots. Not part of the pitched product; clearly labeled in
// the UI, and safe to delete (this file + its markup in index.html) once
// the client has decided. See README "Design Variants panel" section.
//
// Color hex values are placeholders (not Rippel's exact brand purple/green)
// — swatches to react to on the call, not a decision made unilaterally.
// ---------------------------------------------------------------------------

// Labels intentionally don't say "(current)"/"(default)" — that goes stale
// the instant a different option is picked. The `.active` highlight is the
// only source of truth for what's currently selected.
const ICON_OPTIONS = [
  { id: "book", label: "Book" },
  { id: "person", label: "Person" },
];
const COLOR_OPTIONS = [
  { id: "teal", label: "Teal" },
  { id: "purple", label: "Purple" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
];
const SIZE_OPTIONS = [
  { id: "small", label: "Small", value: 0.5 },
  { id: "large", label: "Large", value: 0.75 },
];
const SHADING_OPTIONS = [
  { id: "blob", label: "Blob" },
  { id: "circle", label: "Circle" },
];

const variantState = { icon: "book", color: "teal", size: "small", shading: "blob" };

function applyIconAndColor(map) {
  const colorHex = MARKER_COLORS[variantState.color];
  ensureStoryIcon(map, variantState.icon, colorHex, false, (normalId) => {
    ensureStoryIcon(map, variantState.icon, colorHex, true, (multiId) => {
      if (map.getLayer("story-points-layer")) {
        map.setLayoutProperty("story-points-layer", "icon-image", ["case", [">", ["get", "count"], 1], multiId, normalId]);
      }
    });
  });
  // Region shading tracks the icon color too — a location's blob/circle
  // and its marker should read as the same color, not two independent
  // choices. Non-story regions (North Sound, Twin Cities, etc.) stay
  // neutral gray regardless of the selected color.
  if (map.getLayer("regions-fill")) {
    map.setPaintProperty("regions-fill", "fill-color", ["case", ["get", "hasStory"], colorHex, "#8a8a8a"]);
  }
  if (map.getLayer("regions-circle")) {
    map.setPaintProperty("regions-circle", "circle-color", ["case", ["get", "hasStory"], colorHex, "#8a8a8a"]);
    map.setPaintProperty("regions-circle", "circle-stroke-color", ["case", ["get", "hasStory"], colorHex, "#8a8a8a"]);
  }
}

function applySize(map) {
  const size = SIZE_OPTIONS.find((s) => s.id === variantState.size).value;
  if (map.getLayer("story-points-layer")) map.setLayoutProperty("story-points-layer", "icon-size", size);
}

function renderVariantGroup(groupEl, options, currentId, onPick) {
  groupEl.innerHTML = options
    .map((o) => `<button data-id="${o.id}" class="${o.id === currentId ? "active" : ""}">${o.label}</button>`)
    .join("");
  groupEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => onPick(btn.dataset.id));
  });
}

function initDesignVariants() {
  const map = window.getActiveMap && window.getActiveMap();
  if (!map) return;

  const panel = document.getElementById("design-variants");
  const collapsedToggle = document.getElementById("design-variants-toggle-collapsed");

  function render() {
    renderVariantGroup(document.getElementById("dv-icon"), ICON_OPTIONS, variantState.icon, (id) => {
      variantState.icon = id;
      applyIconAndColor(map);
      render();
    });
    renderVariantGroup(document.getElementById("dv-color"), COLOR_OPTIONS, variantState.color, (id) => {
      variantState.color = id;
      applyIconAndColor(map);
      render();
    });
    renderVariantGroup(document.getElementById("dv-size"), SIZE_OPTIONS, variantState.size, (id) => {
      variantState.size = id;
      applySize(map);
      render();
    });
    renderVariantGroup(document.getElementById("dv-shading"), SHADING_OPTIONS, variantState.shading, (id) => {
      variantState.shading = id;
      setShadingStyle(map, id);
      render();
    });
  }

  document.getElementById("design-variants-close").addEventListener("click", () => {
    panel.classList.add("hidden");
    collapsedToggle.classList.remove("hidden");
  });
  collapsedToggle.addEventListener("click", () => {
    panel.classList.remove("hidden");
    collapsedToggle.classList.add("hidden");
  });

  applySize(map); // apply the smaller default size (variantState is the source of truth)
  render();
}

document.addEventListener("story-layer-ready", initDesignVariants);
