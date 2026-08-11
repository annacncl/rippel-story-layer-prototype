// ---------------------------------------------------------------------------
// Unified story layer mode — merges what were previously two separate
// prototypes ("Guided Tour" and "Self-Guided") into one experience, per
// internal team feedback:
//
//   1. Defaults to self-guided: on load the map is fully navigable and
//      story markers (stars) are clickable for a teaser popup. No
//      auto-advancing walkthrough starts on its own.
//   2. The guided tour is an explicit, visible choice — a banner/button
//      ("Take a guided tour of stories") is shown as soon as the map loads,
//      not something only reachable after a tour that's already running.
//   3. Exiting the tour is non-sticky: once exited, the user is back in
//      free self-guided browsing, and toggling "Show Story Layer" off/on
//      again does NOT resume or re-trigger the tour — the tour only starts
//      again via the explicit banner/button.
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
  const steps = STORIES; // one step per story record when touring
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

  // --------------------------- Self-guided click ---------------------------
  function wireStoryClicks() {
    map.on("click", "story-points-layer", (e) => {
      if (tourActive) return; // panel/Back/Next drive the map while touring
      openStoryTeaser(map, e.features[0]);
    });
    map.on("mouseenter", "story-points-layer", () => (map.getCanvas().style.cursor = tourActive ? "" : "pointer"));
    map.on("mouseleave", "story-points-layer", () => (map.getCanvas().style.cursor = ""));
  }

  // ------------------------------ Guided tour ------------------------------
  function renderPanel() {
    const panel = document.getElementById(panelId);
    panel.classList.remove("hidden");
    const story = steps[stepIndex];
    const finished = stepIndex === steps.length - 1;

    panel.innerHTML = `
      <div class="guided-eyebrow">Guided Story Tour</div>
      ${
        stepIndex === 0
          ? `<p class="guided-intro">${steps.length} stories from across the network, one at a time — click Next to continue, or Exit tour anytime.</p>`
          : ""
      }
      <div class="guided-progress">
        ${steps
          .map((_, i) => `<span class="dot ${i === stepIndex ? "active" : ""} ${i < stepIndex ? "seen" : ""}"></span>`)
          .join("")}
      </div>
      <div class="guided-step-label">Story ${stepIndex + 1} of ${steps.length}</div>
      <img class="guided-image" src="${story.image}" alt="${story.title}" />
      ${formatBadge(story)}
      <h3>${story.title}</h3>
      <p class="teaser-geo">${story.geography}</p>
      <p class="teaser-excerpt">${story.excerpt}</p>
      <a class="teaser-link" href="${story.link}" target="_blank" rel="noopener">Read full story →</a>
      <div class="guided-nav">
        <button id="guided-prev" ${stepIndex === 0 ? "disabled" : ""}>← Back</button>
        <button id="guided-next" class="primary">${finished ? "Exit tour" : "Next →"}</button>
      </div>
    `;

    document.getElementById("guided-prev").addEventListener("click", () => goTo(stepIndex - 1));
    document.getElementById("guided-next").addEventListener("click", () => {
      if (finished) exitTour();
      else goTo(stepIndex + 1);
    });

    flyToStory(story);
  }

  function flyToStory(story) {
    const geo = STORY_GEOGRAPHIES[story.geoId];
    map.flyTo({ center: geo.center, zoom: 7, duration: 1200, essential: true });
  }

  function goTo(i) {
    if (i < 0 || i >= steps.length) return;
    stepIndex = i;
    renderPanel();
  }

  // Explicit, user-chosen entry point — never triggered automatically.
  function startTour() {
    tourActive = true;
    stepIndex = 0;
    hideBanner();
    showExitBtn();
    disableInteractions();
    renderPanel();
  }

  // Drops back to free self-guided browsing. Called from mid-tour "Exit
  // tour", from the last step's button, or when "Show Story Layer" is
  // unchecked while touring.
  function exitTour() {
    tourActive = false;
    document.getElementById(panelId).classList.add("hidden");
    hideExitBtn();
    enableInteractions();
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
    setLayerVisibility(map, LAYER_GROUPS.stories, checked);
    if (checked) showBanner();
    else hideBanner();
  }

  map.on("load", () => {
    addBaseLayers(map);
    wireStoryClicks();
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
