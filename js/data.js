// ---------------------------------------------------------------------------
// Hardcoded data. No Airtable, no live map connection. Geography, network
// pins, and regions are still mock — but the 5 story records below use real
// titles/excerpts pulled from rippel.org (client-supplied links), with
// "Read full story" pointing at the real pages. Podcast headshots are
// placeholders (episode-specific photos weren't available to pull); the
// Fox Cities and Lehigh Valley written-piece images are real.
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
// Story geographies (also get a shaded region + are the 3 featured locations)
// ---------------------------------------------------------------------------
const STORY_GEOGRAPHIES = {
  "inland-empire": { label: "Inland Empire, CA", center: [-117.25, 34.05] },
  "fox-cities": { label: "Fox Cities, WI", center: [-88.4, 44.28] },
  "lehigh-valley": { label: "Lehigh Valley, PA", center: [-75.5, 40.62] },
};

// ---------------------------------------------------------------------------
// Shaded regions layer (mirrors the live map's shaded geography regions).
// Includes the 3 story geographies plus a few plain network-only geographies
// so the map doesn't look suspiciously empty outside the story markets.
// ---------------------------------------------------------------------------
const REGIONS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { id: "inland-empire", hasStory: true, name: "Inland Empire, CA", rx: 0.85, ry: 0.6 },
    { id: "fox-cities", hasStory: true, name: "Fox Cities, WI", rx: 0.7, ry: 0.45 },
    { id: "lehigh-valley", hasStory: true, name: "Lehigh Valley, PA", rx: 0.65, ry: 0.4 },
    { id: "north-sound", hasStory: false, name: "North Sound, WA", rx: 0.9, ry: 0.55, center: [-122.25, 48.35] },
    { id: "twin-cities", hasStory: false, name: "Twin Cities, MN", rx: 0.75, ry: 0.5, center: [-93.25, 44.98] },
    { id: "front-range", hasStory: false, name: "Front Range, CO", rx: 0.8, ry: 0.65, center: [-104.9, 39.6] },
    { id: "piedmont-triad", hasStory: false, name: "Piedmont Triad, NC", rx: 0.7, ry: 0.4, center: [-79.9, 36.1] },
    { id: "gulf-coast", hasStory: false, name: "Gulf Coast, MS", rx: 0.75, ry: 0.45, center: [-89.1, 30.6] },
  ].map((r) => {
    const center = r.center || STORY_GEOGRAPHIES[r.id].center;
    return {
      type: "Feature",
      properties: { id: r.id, name: r.name, hasStory: r.hasStory },
      geometry: { type: "Polygon", coordinates: makeBlob(center, r.rx, r.ry) },
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
// Story records — real content pulled from rippel.org. Lehigh Valley has
// three (two podcasts + one written piece) at the same point, to test how
// multiple stories tied to one geography are surfaced.
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
    image: "https://placehold.co/480x300/8a4b2c/ffffff?text=Dr.+Paulette+Brown-Hinds",
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
    image: "https://placehold.co/480x300/6b2c8a/ffffff?text=Samantha+Shaak%2C+PhD",
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
