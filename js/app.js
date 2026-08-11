// ---------------------------------------------------------------------------
// Single unified story mode. The Filters/Nationwide Influence panels are
// shared chrome — window.getActiveMap() lets that shared panel act on the
// current map instance, and window.currentStoryToggleHandler is what the
// "Show Story Layer" checkbox in the Filters panel calls (wired in
// js/filters-panel.js).
// ---------------------------------------------------------------------------

let activeInstance = null;

window.getActiveMap = () => activeInstance && activeInstance.map;

function resetSharedToggles() {
  document.getElementById("toggle-story-layer").checked = true;
  document.getElementById("toggle-networks").checked = true;
  document.getElementById("toggle-state-labels").checked = false;
  document.querySelector('input[name="geo-scope"][value="all"]').checked = true;
}

resetSharedToggles();
activeInstance = initStoryMode("map-story", "guided-panel", "tour-banner", "exit-tour-btn");
window.currentStoryToggleHandler = activeInstance.onStoryToggle;
