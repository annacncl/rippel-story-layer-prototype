// ---------------------------------------------------------------------------
// Hardcoded data. No Airtable, no live map connection. Geography, network
// pins, and regions are still mock — but story records marked "real content"
// below use real titles/excerpts pulled from rippel.org (client-supplied
// links, plus the South Texas episode found via public search on 2026-08-31),
// with "Read full story" pointing at the real pages. Entries explicitly
// marked MOCK are invented for this round's stress-testing and flagged as
// such in their own comments — swap for real content once available.
// ---------------------------------------------------------------------------

// Rough elliptical "blob" polygon generator so we don't need real boundary
// data for the demo — good enough to read as a shaded geography at US scale.
function makeBlob(center, rxDeg, ryDeg, steps = 24) {
  const [cx, cy] = center;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    // slight irregularity so it doesn't look like a perfect ellipse
    const wobble = 1 + 0.08 * Math.sin(angle * 3);
    coords.push([
      cx + Math.cos(angle) * rxDeg * wobble,
      cy + Math.sin(angle) * ryDeg * wobble,
    ]);
  }
  return [coords];
}

// ---------------------------------------------------------------------------
// Story geographies (also get a shaded region + are the featured locations).
// `subtitle` orients users unfamiliar with a regional name (client ask).
// `anchor` is the representative point used by the alternate "circle" shading
// mode (Design Variants panel) — usually same as `center`, but can differ
// for a non-adjacent or statewide geography where the marker's map point and
// the "best single dot to represent this on the map" aren't the same thing.
// ---------------------------------------------------------------------------
const STORY_GEOGRAPHIES = {
  "inland-empire": {
    label: "Inland Empire, CA",
    shortName: "Inland Empire",
    subtitle: "Riverside & San Bernardino counties, Southern California",
    center: [-117.25, 34.05],
  },
  "fox-cities": {
    label: "Fox Cities, WI",
    shortName: "Fox Cities",
    subtitle: "Greater Appleton area, northeast Wisconsin",
    center: [-88.4, 44.28],
  },
  "lehigh-valley": {
    label: "Lehigh Valley, PA",
    shortName: "Lehigh Valley",
    subtitle: "Allentown–Bethlehem–Easton area, eastern Pennsylvania",
    center: [-75.5, 40.62],
  },
  // Real org (Methodist Healthcare Ministries runs PJTT / Prosperemos Juntos
  // Thriving Together); marker anchored at Laredo, home of the real featured
  // story below. Geometry is a non-adjacent 19-county stand-in — see
  // REGION_DEFS — deliberately testing the cluster panel + shading questions
  // the client flagged together.
  "south-texas": {
    label: "South Texas (PJTT)",
    shortName: "South Texas",
    subtitle: "19 counties along the Texas–Mexico border, from Laredo to the Rio Grande Valley",
    center: [-99.5, 27.5],
  },
  // MOCK — statewide example (no tight metro center) added to test how
  // shading/anchoring should work when a story isn't a small region. `anchor`
  // (state capital) intentionally differs from the shaded blob's broad
  // centroid, since "where does a statewide story anchor" was the client's
  // open question.
  "granite-state": {
    label: "New Hampshire (statewide)",
    shortName: "New Hampshire",
    subtitle: "Statewide initiative — not tied to one metro area",
    center: [-71.5, 43.65],
    anchor: [-71.55, 43.2],
    statewide: true,
  },
};

// ---------------------------------------------------------------------------
// Raw region definitions, kept separate from the derived GeoJSON below so
// both the blob-shading layer AND the alternate circle-shading layer (Design
// Variants comparison) can be built from the same source data.
// ---------------------------------------------------------------------------
const REGION_DEFS = [
  { id: "inland-empire", hasStory: true, name: "Inland Empire, CA", rx: 0.85, ry: 0.6 },
  { id: "fox-cities", hasStory: true, name: "Fox Cities, WI", rx: 0.7, ry: 0.45 },
  { id: "lehigh-valley", hasStory: true, name: "Lehigh Valley, PA", rx: 0.65, ry: 0.4 },
  // South Texas (PJTT) gets the same single-blob treatment as every other
  // location, sized comparably — not the 19-scattered-blob mock geometry
  // from the first pass, which read as visual noise rather than "19
  // counties" and, worse, looked inconsistent next to every other location
  // having one plain shape. The 19-county, non-adjacent framing is carried
  // by the text subtitle instead (see STORY_GEOGRAPHIES above); if PJTT's
  // real non-contiguous footprint needs depicting on the map later, that
  // likely wants real boundary data, not a second mock geometry style.
  { id: "south-texas", hasStory: true, name: "South Texas (PJTT)", rx: 0.75, ry: 0.55 },
  // Statewide (New Hampshire) gets the same blob treatment as every other
  // location, per consistency feedback — a real-state-boundary fill was
  // tried and dropped (didn't read as "statewide" any more clearly, and
  // meant New Hampshire was the one location without a shaded area at
  // all). Sized bigger than the regional blobs to suggest a larger area.
  { id: "granite-state", hasStory: true, name: "New Hampshire (statewide)", rx: 1.0, ry: 1.3 },
  { id: "north-sound", hasStory: false, name: "North Sound, WA", rx: 0.9, ry: 0.55, center: [-122.25, 48.35] },
  { id: "twin-cities", hasStory: false, name: "Twin Cities, MN", rx: 0.75, ry: 0.5, center: [-93.25, 44.98] },
  { id: "front-range", hasStory: false, name: "Front Range, CO", rx: 0.8, ry: 0.65, center: [-104.9, 39.6] },
  { id: "piedmont-triad", hasStory: false, name: "Piedmont Triad, NC", rx: 0.7, ry: 0.4, center: [-79.9, 36.1] },
  { id: "gulf-coast", hasStory: false, name: "Gulf Coast, MS", rx: 0.75, ry: 0.45, center: [-89.1, 30.6] },
];

// ---------------------------------------------------------------------------
// Shaded regions layer (mirrors the live map's shaded geography regions).
// ---------------------------------------------------------------------------
const REGIONS_GEOJSON = {
  type: "FeatureCollection",
  features: REGION_DEFS.map((r) => {
    const center = r.center || STORY_GEOGRAPHIES[r.id].center;
    return {
      type: "Feature",
      properties: { id: r.id, name: r.name, hasStory: r.hasStory },
      geometry: { type: "Polygon", coordinates: makeBlob(center, r.rx, r.ry) },
    };
  }),
};

// ---------------------------------------------------------------------------
// Alternate "circle" shading mode (Design Variants comparison) — a plain
// anchor point instead of a soft blob polygon, so it reads as "just a
// locator" rather than an implied boundary. The statewide example is a
// single dot at a representative point (its `anchor`) rather than
// state-wide shading.
// ---------------------------------------------------------------------------
const REGION_CIRCLES_GEOJSON = {
  type: "FeatureCollection",
  features: REGION_DEFS.map((r) => {
    const geo = STORY_GEOGRAPHIES[r.id];
    const coords = (geo && geo.anchor) || r.center || (geo && geo.center);
    return {
      type: "Feature",
      properties: { id: r.id, name: r.name, hasStory: r.hasStory },
      geometry: { type: "Point", coordinates: coords },
    };
  }),
};

// ---------------------------------------------------------------------------
// Network / organization pins — plain markers, the "list of links" pins
// already crowding the live map. Purely decorative filler for the demo.
// `scope` matches the real site's Geographic Scope filter (statewide/local).
// ---------------------------------------------------------------------------
const NETWORK_PINS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    ["Skagit Valley Neighbors Fund", -122.55, 48.42, "local"],
    ["Bellingham Mutual Aid Network", -122.48, 48.75, "local"],
    ["Riverside Community Land Trust", -117.4, 33.95, "local"],
    ["San Bernardino Neighbors Alliance", -117.15, 34.15, "local"],
    ["Appleton Civic Collective", -88.55, 44.35, "local"],
    ["Oshkosh Cooperative Fund", -88.55, 44.02, "local"],
    ["Allentown Neighborhood Partners", -75.48, 40.6, "local"],
    ["Bethlehem Community Builders", -75.38, 40.63, "local"],
    ["Minneapolis Commons Project", -93.4, 44.9, "local"],
    ["St. Paul Resident Fund", -93.05, 44.95, "local"],
    ["Denver Civic Trust", -104.98, 39.74, "statewide"],
    ["Boulder Neighbors Collective", -105.27, 40.02, "local"],
    ["Greensboro Community Fund", -79.8, 36.07, "local"],
    ["Winston-Salem Mutual Aid", -80.24, 36.1, "local"],
    ["Gulfport Resident Network", -89.09, 30.37, "local"],
    ["Biloxi Neighbors Alliance", -88.89, 30.4, "local"],
    ["Everett Civic Fund", -122.2, 47.98, "statewide"],
    ["Ontario Community Trust", -117.65, 34.06, "local"],
    ["Fond du Lac Neighbors", -88.45, 43.78, "local"],
    ["Easton Community Partners", -75.22, 40.69, "statewide"],
  ].map(([name, lng, lat, scope], i) => ({
    type: "Feature",
    properties: { id: `org-${i}`, name, scope },
    geometry: { type: "Point", coordinates: [lng, lat] },
  })),
};

// ---------------------------------------------------------------------------
// Header stat bar (mock counts, mirrors the live map's summary numbers).
// ---------------------------------------------------------------------------
const SITE_STATS = {
  organizations: NETWORK_PINS_GEOJSON.features.length,
  networks: 41,
  counties: 214,
  states: 9,
  tribalNations: 3,
};

// ---------------------------------------------------------------------------
// Left "Filters" panel — Regional Networks & Initiatives / Place-Based
// Influence lists. Invented mock org/network names, not the real Airtable
// list — this prototype has zero connection to the live data.
// ---------------------------------------------------------------------------
const REGIONAL_NETWORKS = [
  { name: "North Sound Accountable Community", scope: "local" },
  { name: "Inland Empire Civic Collaborative", scope: "local" },
  { name: "Fox Valley Data Exchange", scope: "local" },
  { name: "Lehigh Valley Health Partners Network", scope: "local" },
  { name: "Washington Economic Justice Coalition", scope: "statewide" },
  { name: "Wisconsin Community Health Alliance", scope: "statewide" },
];

const PLACE_BASED_INFLUENCE = [
  { name: "Chuckanut Health Foundation", scope: "local" },
  { name: "Leonard Parker Pool Institute for Health", scope: "local" },
  { name: "The Civic Canopy", scope: "statewide" },
  { name: "Primary Health Network", scope: "statewide" },
  { name: "Endowment for Health", scope: "statewide" },
  { name: "Community Services for Children", scope: "local" },
];

// ---------------------------------------------------------------------------
// Right "Nationwide Influence" panel — orgs/networks that work nationwide
// rather than pinned to one region. Also invented mock names.
// ---------------------------------------------------------------------------
const NATIONWIDE_ORGS = [
  { name: "Collaborative Capacity Co", url: "www.collabcapacity.example" },
  { name: "Civic Commons Institute", url: "www.civiccommons.example" },
  { name: "Leading Public Health Alliance", url: "www.leadingpublichealth.example" },
];

const NATIONWIDE_NETWORKS = [
  { name: "Foundation for Social Connection", url: "www.foundationsc.example" },
  { name: "New Pluralists", url: "www.newpluralists.example" },
  { name: "Democracy Collaborative", url: "www.democracycollaborative.example" },
  { name: "Better Together America", url: "www.bettertogetheramerica.example" },
  { name: "Grantmakers in Health", url: "www.grantmakersinhealth.example" },
];

// ---------------------------------------------------------------------------
// Story records. Lehigh Valley (3 stories) and South Texas (2 stories) are
// the multi-story "cluster" test locations. Each story may carry an optional
// `media` field ({type: "youtube"|"video", url, autoplay}) — when present,
// the teaser/cluster card embeds a real player instead of a static image.
// ---------------------------------------------------------------------------
const STORIES = [
  {
    id: "inland-empire-podcast",
    geoId: "inland-empire",
    geography: "Inland Empire, CA",
    title: "Building Belonging and Civic Muscle Through Journalism",
    format: "Podcast",
    formatIcon: "🎙️",
    excerpt:
      "Dr. Paulette Brown-Hinds, second-generation publisher of Black Voice News, traces how her family's legacy of civic engagement shaped her work with the Inland Empire Community Foundation and the Inland Empire Journalism Innovation Hub + Fund.",
    image: "img/inland-empire-unsung-stewards.jpg",
    link: "https://rippel.org/podcasts/?podcast-id=7828",
  },
  {
    id: "fox-cities-multimedia",
    geoId: "fox-cities",
    geography: "Fox Cities, WI",
    title: "Imagine Fox Cities: Creating a Community Where Everyone Belongs",
    format: "Multimedia",
    formatIcon: "🎬",
    excerpt:
      "Fox Cities, a region of 19 municipalities in central Wisconsin, is bringing together residents, businesses, and institutions around one question: how do we build a community where everyone belongs?",
    image: "https://rippel.org/foxcities/wp-content/themes/FoxCities/images/FC_loop_1000%201.png",
    link: "https://rippel.org/foxcities/",
  },
  {
    id: "lehigh-valley-podcast-shaak",
    geoId: "lehigh-valley",
    geography: "Lehigh Valley, PA",
    title: "Relationships Strengthen Health and Well-Being in the Lehigh Valley",
    format: "Podcast",
    formatIcon: "🎙️",
    excerpt:
      "Samantha Shaak, PhD, Executive Director of the Leonard Parker Pool Institute for Health, explains how stewardship starts with connecting the dots between people, partners, and place.",
    image: "img/samantha-shaak.webp",
    link: "https://rippel.org/podcasts/?podcast-id=7691",
  },
  {
    id: "lehigh-valley-podcast-boateng",
    geoId: "lehigh-valley",
    geography: "Lehigh Valley, PA",
    title: "Strong Partnerships Are Helping to Create a Thriving Lehigh Valley",
    format: "Podcast",
    formatIcon: "🎙️",
    excerpt:
      "Nate Boateng, VP for Community Impact and Engagement at Valley Health Partners, traces his stewardship journey as an Allentown native building coalitions among the region's community health centers.",
    image: "https://placehold.co/480x300/4b6b8a/ffffff?text=Nate+Boateng",
    link: "https://rippel.org/podcasts/?podcast-id=5337",
  },
  {
    id: "lehigh-valley-written",
    geoId: "lehigh-valley",
    geography: "Lehigh Valley, PA",
    title: "A Pennsylvania Health Care System Stewards Equitable Health and Well-Being",
    format: "Written Story",
    formatIcon: "📝",
    excerpt:
      "When Leonard Parker Pool set out to build a better health system for the Lehigh Valley in the 1960s, he laid the groundwork for a hospital network now stewarding equitable health for its entire community.",
    image: "https://rippel.org/wp-content/uploads/2024/05/Website-Carousel-Thumbnails-24.png",
    link: "https://rippel.org/insights/a-pennsylvania-health-care-system-stewards-equitable-health-and-well-being/",
  },
  // Real content, found via public search (2026-08-31): Rippel's "Unsung
  // Stewards" podcast, Season 5 Episode 2, featuring Yvonne Pacheco of
  // Methodist Healthcare Ministries of South Texas (the org behind PJTT).
  // Doubles as the real-media example for the audio/video embed feature.
  {
    id: "south-texas-podcast-pacheco",
    geoId: "south-texas",
    geography: "South Texas (PJTT)",
    title: "Stewardship Begins with Listening in South Texas",
    format: "Podcast",
    formatIcon: "🎙️",
    excerpt:
      "Yvonne Pacheco, a lifelong Laredo resident and Community Connector with Methodist Healthcare Ministries, shares how growing up in a tight-knit border community shaped an approach to stewardship built on showing up consistently and listening deeply.",
    image: "https://img.youtube.com/vi/T7wdBXB5RUc/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/T7wdBXB5RUc", autoplay: false },
    link: "https://rippel.org/podcast/stewardship-begins-with-listening-in-south-texas/",
  },
  // MOCK — invented second South Texas story so this location (a) exercises
  // the cluster panel with 2 entries and (b) models "PJTT-produced" content
  // sitting alongside Rippel-produced content, per the separate tour-
  // composition note about mixing internally/externally produced stories.
  // Swap for a real PJTT-produced piece once available.
  {
    id: "south-texas-pjtt-update",
    geoId: "south-texas",
    geography: "South Texas (PJTT)",
    title: "PJTT Network Update: Prosperemos Juntos / Thriving Together",
    format: "Written Story",
    formatIcon: "📝",
    excerpt:
      "PJTT's own team highlights the partners and community connectors weaving together prevention, health equity, and shared power across 19 South Texas counties, from Laredo to the Rio Grande Valley.",
    image: "https://placehold.co/480x300/6b4f8a/ffffff?text=PJTT+story+(placeholder)",
    link: "https://www.mhm.org/thriving-communities/",
  },
  // MOCK — statewide example (see STORY_GEOGRAPHIES["granite-state"] above).
  {
    id: "granite-state-mock",
    geoId: "granite-state",
    geography: "New Hampshire (statewide)",
    title: "A Statewide Network Comes Together Across New Hampshire",
    format: "Written Story",
    formatIcon: "📝",
    excerpt:
      "Illustrative placeholder for a statewide (not regional) story — used to test how shading and marker placement should work when a story isn't tied to one tight metro area.",
    image: "https://placehold.co/480x300/2f6b4f/ffffff?text=Statewide+(placeholder)",
    link: "#",
  },
];

// Group stories by geography for the map (one marker per location).
function getStoryPointsGeoJSON() {
  const byGeo = {};
  STORIES.forEach((s) => {
    if (!byGeo[s.geoId]) byGeo[s.geoId] = [];
    byGeo[s.geoId].push(s.id);
  });
  return {
    type: "FeatureCollection",
    features: Object.entries(byGeo).map(([geoId, storyIds]) => ({
      type: "Feature",
      properties: {
        geoId,
        geography: STORY_GEOGRAPHIES[geoId].label,
        storyIds: JSON.stringify(storyIds),
        count: storyIds.length,
      },
      geometry: { type: "Point", coordinates: STORY_GEOGRAPHIES[geoId].center },
    })),
  };
}

function getStoriesForGeo(geoId) {
  return STORIES.filter((s) => s.geoId === geoId);
}

function getStoryById(id) {
  return STORIES.find((s) => s.id === id);
}
