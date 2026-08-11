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
    setLayerVisibility(map, LAYER_GROUPS.regions, box.checked);
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
}

document.addEventListener("DOMContentLoaded", initFiltersPanel);
