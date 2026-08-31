// ---------------------------------------------------------------------------
// Persistent left "Filters" panel + right "Nationwide Influence" panel —
// shared chrome across all 3 story-mode screens, replicating the real
// site's layout/interactions. Relies on window.getActiveMap() (set by
// app.js) so controls always act on whichever mode's map is current.
// ---------------------------------------------------------------------------

function renderStats() {
  document.getElementById("stat-organizations").textContent = SITE_STATS.organizations;
  document.getElementById("stat-networks").textContent = SITE_STATS.networks;
  document.getElementById("stat-counties").textContent = SITE_STATS.counties;
  document.getElementById("stat-states").textContent = SITE_STATS.states;
  document.getElementById("stat-tribal").textContent = SITE_STATS.tribalNations;
}

function renderList(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = items
    .map(
      (item) => `
      <div class="list-item" data-name="${item.name.toLowerCase()}">
        <span class="list-item-name">${item.name}</span>
        <span class="scope-badge ${item.scope}">${item.scope}</span>
      </div>`
    )
    .join("");
}

function renderInfluenceList(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = items
    .map(
      (item) => `
      <div class="list-item">
        <span class="list-item-name">${item.name}</span>
        <span class="list-item-url">${item.url}</span>
      </div>`
    )
    .join("");
}

function wireSearch() {
  const input = document.getElementById("org-search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll("#list-regional-networks .list-item, #list-place-based .list-item").forEach((row) => {
      const match = !q || row.dataset.name.includes(q);
      row.classList.toggle("hidden-by-search", !match);
    });
  });
}

function wireGeoScope() {
  document.querySelectorAll('input[name="geo-scope"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const map = window.getActiveMap && window.getActiveMap();
      if (!map || !map.getLayer("network-pins-layer")) return;
      const value = radio.value;
      if (value === "all") {
        map.setFilter("network-pins-layer", null);
      } else {
        map.setFilter("network-pins-layer", ["==", ["get", "scope"], value]);
      }
    });
  });
}

function wireNetworksToggle() {
  const box = document.getElementById("toggle-networks");
  box.addEventListener("change", () => {
    const map = window.getActiveMap && window.getActiveMap();
    if (!map) return;
    // Only one of the two shading styles (blob/circle) is visible at a
    // time — applyRegionsVisibility respects whichever the Design Variants
    // panel currently has selected, rather than forcing both.
    applyRegionsVisibility(map);
  });
}

function wireStateLabelsToggle() {
  const box = document.getElementById("toggle-state-labels");
  box.addEventListener("change", () => {
    const map = window.getActiveMap && window.getActiveMap();
    if (!map) return;
    const style = map.getStyle();
    if (!style) return;
    style.layers
      .filter((l) => /state-label/i.test(l.id))
      .forEach((l) => map.setLayoutProperty(l.id, "visibility", box.checked ? "visible" : "none"));
  });
}

function wireStoryLayerToggle() {
  const box = document.getElementById("toggle-story-layer");
  box.addEventListener("change", () => {
    if (window.currentStoryToggleHandler) window.currentStoryToggleHandler(box.checked);
  });
}

function wireCollapseTabs() {
  const filtersPanel = document.getElementById("filters-panel");
  const influencePanel = document.getElementById("influence-panel");
  const collapseFilters = document.getElementById("collapse-filters");
  const collapseInfluence = document.getElementById("collapse-influence");

  function resizeAfterTransition() {
    setTimeout(() => {
      const map = window.getActiveMap && window.getActiveMap();
      if (map) map.resize();
    }, 220);
  }

  collapseFilters.addEventListener("click", () => {
    const collapsed = filtersPanel.classList.toggle("collapsed");
    document.documentElement.style.setProperty("--filters-w", collapsed ? "28px" : "300px");
    collapseFilters.textContent = collapsed ? "›" : "‹";
    resizeAfterTransition();
  });
  collapseInfluence.addEventListener("click", () => {
    const collapsed = influencePanel.classList.toggle("collapsed");
    document.documentElement.style.setProperty("--influence-w", collapsed ? "28px" : "300px");
    collapseInfluence.textContent = collapsed ? "‹" : "›";
    resizeAfterTransition();
  });
}

// This prototype had no mobile handling at all before this round — the
// client's note that panels "already default to collapsed on mobile"
// describes the live production site, not this static demo. This is a
// one-time, load-time check (not a live resize listener) that collapses
// both side panels by mirroring an actual click on their collapse tabs, so
// button state/labels/width all stay in sync regardless of how they got
// there.
function applyMobileDefaults() {
  if (window.innerWidth > 768) return;
  const collapseFilters = document.getElementById("collapse-filters");
  const collapseInfluence = document.getElementById("collapse-influence");
  if (!document.getElementById("filters-panel").classList.contains("collapsed")) collapseFilters.click();
  if (!document.getElementById("influence-panel").classList.contains("collapsed")) collapseInfluence.click();
}

function wireAboutBar() {
  const bar = document.getElementById("about-bar");
  let expanded = false;
  bar.addEventListener("click", () => {
    expanded = !expanded;
    bar.querySelector(".about-bar-toggle").textContent = expanded ? "▼ Hide" : "▲ Show";
  });
}

function initFiltersPanel() {
  renderStats();
  renderList("list-regional-networks", REGIONAL_NETWORKS);
  renderList("list-place-based", PLACE_BASED_INFLUENCE);
  renderInfluenceList("list-nationwide-orgs", NATIONWIDE_ORGS);
  renderInfluenceList("list-nationwide-networks", NATIONWIDE_NETWORKS);
  wireSearch();
  wireGeoScope();
  wireNetworksToggle();
  wireStateLabelsToggle();
  wireStoryLayerToggle();
  wireCollapseTabs();
  wireAboutBar();
  // Deferred a frame: some embeddings report window.innerWidth as 0 for a
  // moment right at DOMContentLoaded, before layout has actually committed.
  requestAnimationFrame(applyMobileDefaults);
}

document.addEventListener("DOMContentLoaded", initFiltersPanel);
