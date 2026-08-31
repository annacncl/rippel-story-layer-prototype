// ---------------------------------------------------------------------------
// Unified story layer mode — merges what were previously two separate
// prototypes ("Guided Tour" and "Self-Guided") into one experience, per
// internal team feedback:
//
//   1. Defaults to self-guided: on load the map is fully navigable and
//      story markers (open book icon) are clickable for a teaser popup. No
//      auto-advancing walkthrough starts on its own.
//   2. The guided tour is an explicit, visible choice — a banner/button
//      ("Take a guided tour of stories") is shown as soon as the map loads,
//      not something only reachable after a tour that's already running.
//   3. Exiting the tour is non-sticky: once exited, the user is back in
//      free self-guided browsing, and toggling "Show Story Layer" off/on
//      again does NOT resume or re-trigger the tour — the tour only starts
//      again via the explicit banner/button.
//
// Round 2 (client meeting feedback) additions:
//   - Multi-story locations open a "cluster panel" listing every story at
//     that location, instead of flipping through separate popups. The map
//     stays fully navigable while it's open (no disableInteractions) — it's
//     a self-guided affordance, not a tour step.
//   - The guided tour now advances per LOCATION, not per story, using the
//     same cluster-panel rendering for every step (a single-story stop just
//     renders a list of one). This is the direct answer to the client's
//     open question about tour sequencing once a location can hold several
//     stories.
//   - An intro/preamble step now precedes Story 1, and the active tour stop
//     gets a highlight ring (js/map-common.js `showTourHighlight`) so a
//     future narration track has an obvious visual anchor. No actual
//     voiceover audio is included — there's no narration recording to
//     embed; see README for what's still needed from the client here.
//
// State-management assumptions (flagging per request):
//   - Tour state (`tourActive`, `stepIndex`) lives only in this closure and
//     is NOT persisted anywhere (no URL param, no storage) — a full page
//     reload always lands back in self-guided, matching requirement #1.
//   - The "Show Story Layer" checkbox lives in the shared Filters panel
//     (js/filters-panel.js) and is wired generically there; this file only
//     exposes `onStoryToggle(checked)`, which is what makes the toggle
//     "non-sticky" — it always resolves to self-guided, never to the tour,
//     regardless of what was active before the toggle was flipped off.
//   - The banner's dismiss (×) hides it only until the next transition back
//     into self-guided (toggle off/on, or exiting a tour) — it's not a
//     permanent per-user dismissal (no persistence layer exists here to
//     remember that across page loads anyway).
// ---------------------------------------------------------------------------

function initStoryMode(containerId, panelId, bannerId, exitBtnId) {
  const map = createMap(containerId);
  // One tour stop per unique geography (not per story) — see header note.
  const tourGeoIds = [...new Set(STORIES.map((s) => s.geoId))];
  let stepIndex = 0;
  let tourActive = false;

  function disableInteractions() {
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    map.keyboard.disable();
    map.dragRotate.disable();
  }
  function enableInteractions() {
    map.dragPan.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();
    map.keyboard.enable();
    map.dragRotate.enable();
  }

  function showBanner() {
    document.getElementById(bannerId).classList.add("visible");
  }
  function hideBanner() {
    document.getElementById(bannerId).classList.remove("visible");
  }
  function showExitBtn() {
    document.getElementById(exitBtnId).classList.add("visible");
  }
  function hideExitBtn() {
    document.getElementById(exitBtnId).classList.remove("visible");
  }

  // Grows/shrinks the map to make room for the story/cluster/tour panel,
  // reusing the same CSS-var + resize() pattern the Filters/Influence
  // panels already use (see wireCollapseTabs in js/filters-panel.js) —
  // previously this panel only floated on top of the map instead.
  function setStoryPanelOpen(open) {
    // On narrow viewports the panel overlays full-width instead (see the
    // mobile media query in css/style.css) — there's no room to share, so
    // don't also try to shrink the map.
    const isMobile = window.innerWidth <= 768;
    document.documentElement.style.setProperty("--story-panel-w", open && !isMobile ? "360px" : "0px");
    setTimeout(() => map.resize(), 220);
  }

  // --------------------------- Self-guided click ---------------------------
  function wireStoryClicks() {
    map.on("click", "story-points-layer", (e) => {
      if (tourActive) return; // panel/Back/Next drive the map while touring
      const feature = e.features[0];
      const storyIds = JSON.parse(feature.properties.storyIds);
      if (storyIds.length > 1) {
        openClusterPanel(feature.properties.geoId);
      } else {
        openStoryTeaser(map, feature);
      }
    });
    map.on("mouseenter", "story-points-layer", () => (map.getCanvas().style.cursor = tourActive ? "" : "pointer"));
    map.on("mouseleave", "story-points-layer", () => (map.getCanvas().style.cursor = ""));
  }

  // ----------------------------- Cluster panel ------------------------------
  // Self-guided-only: a multi-story location opens one panel listing every
  // story there ("here's everything going on in X"), without locking the
  // map — requirement #1 (fully navigable self-guided) still applies.
  function openClusterPanel(geoId) {
    renderStoryPanel(document.getElementById(panelId), { geoId, mode: "cluster" });
    setStoryPanelOpen(true);
  }
  function closeClusterPanel() {
    document.getElementById(panelId).classList.add("hidden");
    setStoryPanelOpen(false);
  }

  // ------------------------------ Guided tour ------------------------------
  function renderStep() {
    const geoId = tourGeoIds[stepIndex];
    renderStoryPanel(document.getElementById(panelId), {
      geoId,
      mode: "tour",
      stepIndex,
      totalSteps: tourGeoIds.length,
    });
    flyToStep(geoId);
  }

  function flyToStep(geoId) {
    const geo = STORY_GEOGRAPHIES[geoId];
    // Statewide stops zoom out further — there's no tight metro area to
    // frame in on, which is exactly the anchoring question the client asked
    // about for a non-regional story.
    map.flyTo({ center: geo.center, zoom: geo.statewide ? 5.3 : 7, duration: 1200, essential: true });
    showTourHighlight(map, geo.center);
  }

  function goTo(i) {
    if (i < 0 || i >= tourGeoIds.length) return;
    stepIndex = i;
    renderStep();
  }

  // Shared panel body for both the cluster panel and every tour step — a
  // multi-story stop (Lehigh Valley, South Texas) shows all its stories in
  // one list either way; a single-story stop just renders a list of one.
  function renderStoryPanel(panelEl, { geoId, mode, stepIndex: si, totalSteps }) {
    const geo = STORY_GEOGRAPHIES[geoId];
    const storyList = getStoriesForGeo(geoId);
    panelEl.classList.remove("hidden");

    panelEl.innerHTML = `
      ${mode === "tour" ? `<div class="guided-eyebrow">Guided Story Tour</div>` : ""}
      ${
        mode === "tour" && si === 0
          ? `<p class="guided-intro">This tour walks through ${totalSteps} places across the network — just a glimpse of who's helping their community thrive, not the full map. Click Next to continue, or Exit tour anytime.</p>`
          : ""
      }
      ${
        mode === "tour"
          ? `<div class="guided-progress">
              ${Array.from(
                { length: totalSteps },
                (_, i) => `<span class="dot ${i === si ? "active" : ""} ${i < si ? "seen" : ""}"></span>`
              ).join("")}
            </div>
            <div class="guided-step-label">Location ${si + 1} of ${totalSteps}</div>`
          : ""
      }
      <h3 class="story-panel-geo">${geo.label}</h3>
      ${geo.subtitle ? `<p class="story-panel-subtitle">${geo.subtitle}</p>` : ""}
      <p class="story-panel-label">Stories about ${geo.shortName}${storyList.length > 1 ? ` (${storyList.length})` : ""}</p>
      <div class="story-panel-cards">${renderStoryCards(storyList)}</div>
      ${
        mode === "tour"
          ? `<div class="guided-nav">
              <button id="guided-prev" ${si === 0 ? "disabled" : ""}>← Back</button>
              <button id="guided-next" class="primary">${si === totalSteps - 1 ? "Exit tour" : "Next →"}</button>
            </div>`
          : `<div class="guided-nav"><button id="cluster-close" class="primary">Close</button></div>`
      }
    `;

    if (mode === "tour") {
      document.getElementById("guided-prev").addEventListener("click", () => goTo(si - 1));
      document.getElementById("guided-next").addEventListener("click", () => {
        if (si === totalSteps - 1) exitTour();
        else goTo(si + 1);
      });
    } else {
      document.getElementById("cluster-close").addEventListener("click", closeClusterPanel);
    }
  }

  // Explicit, user-chosen entry point — never triggered automatically.
  function startTour() {
    tourActive = true;
    stepIndex = 0;
    hideBanner();
    showExitBtn();
    disableInteractions();
    setStoryPanelOpen(true);
    renderStep();
  }

  // Drops back to free self-guided browsing. Called from mid-tour "Exit
  // tour", from the last step's button, or when "Show Story Layer" is
  // unchecked while touring.
  function exitTour() {
    tourActive = false;
    document.getElementById(panelId).classList.add("hidden");
    hideExitBtn();
    enableInteractions();
    setStoryPanelOpen(false);
    hideTourHighlight();
    map.fitBounds(US_BOUNDS, { padding: 30, duration: 900 });
    if (document.getElementById("toggle-story-layer").checked) showBanner();
  }

  document.getElementById(exitBtnId).addEventListener("click", exitTour);

  // --------------------- Shared "Show Story Layer" toggle ---------------------
  // Always resolves to self-guided — this is what makes the toggle
  // non-sticky with respect to the tour (requirement #3).
  function onStoryToggle(checked) {
    tourActive = false;
    document.getElementById(panelId).classList.add("hidden");
    hideExitBtn();
    enableInteractions();
    setStoryPanelOpen(false);
    hideTourHighlight();
    setLayerVisibility(map, LAYER_GROUPS.stories, checked);
    setStoryHotspotsVisible(checked);
    if (checked) showBanner();
    else hideBanner();
  }

  map.on("load", () => {
    // story-points-layer registers its icon image asynchronously, so its
    // click/hover wiring — and anything else waiting on the layer actually
    // existing, like js/design-variants.js — waits for this callback.
    addBaseLayers(map, () => {
      wireStoryClicks();
      document.dispatchEvent(new Event("story-layer-ready"));
    });
    // Default state: self-guided, markers visible, tour offered but not run.
    showBanner();
  });

  document.getElementById(bannerId).querySelector(".tour-banner-cta").addEventListener("click", startTour);
  document.getElementById(bannerId).querySelector(".tour-banner-dismiss").addEventListener("click", hideBanner);

  function teardown() {
    hideBanner();
    hideExitBtn();
    map.remove();
  }

  return { map, teardown, onStoryToggle };
}
