// ---------------------------------------------------------------------------
// Hardcoded data. No Airtable, no live map connection. Geography, network
// pins, and regions are still mock — but story records marked "real content"
// below use real titles/excerpts pulled from rippel.org (client-supplied
// links, plus the South Texas episode found via public search on 2026-08-31),
// with their links pointing at the real pages.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Story geographies (also get a shaded region + are the featured locations).
// `subtitle` orients users unfamiliar with a regional name (client ask).
// `anchor` is the point the location's region circle sits on — usually the
// same as `center`, but can differ
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
  // Real content, partner-supplied (Rippel, 2026-10-20) "to cover the
  // southeast." Marker at the county's center.
  "palm-beach": {
    label: "Palm Beach County, FL",
    shortName: "Palm Beach County",
    subtitle: "Southeast Florida, from Boca Raton to Jupiter and the Glades",
    center: [-80.45, 26.65],
  },
  // Statewide location (no tight metro center), originally added to test how
  // shading/anchoring should work when a story isn't a small region. `anchor`
  // (state capital) intentionally differs from the state's broad centroid, since "where does a statewide story anchor" was the client's
  // open question.
  "granite-state": {
    label: "New Hampshire (statewide)",
    shortName: "New Hampshire",
    subtitle: "Statewide work across New Hampshire, not tied to one metro area",
    center: [-71.5, 43.65],
    anchor: [-71.55, 43.2],
    statewide: true,
  },
};

// ---------------------------------------------------------------------------
// Region definitions: one circle per location (see REGION_CIRCLES_GEOJSON).
// Story locations take their point from STORY_GEOGRAPHIES; the non-story
// network regions carry their own `center`.
// ---------------------------------------------------------------------------
const REGION_DEFS = [
  { id: "inland-empire", hasStory: true, name: "Inland Empire, CA" },
  { id: "fox-cities", hasStory: true, name: "Fox Cities, WI" },
  { id: "lehigh-valley", hasStory: true, name: "Lehigh Valley, PA" },
  // South Texas (PJTT) gets one circle like every other location; its
  // 19-county, non-adjacent footprint is carried by the text subtitle (see
  // STORY_GEOGRAPHIES). Depicting the real footprint later would want real
  // boundary data.
  { id: "south-texas", hasStory: true, name: "South Texas (PJTT)" },
  { id: "granite-state", hasStory: true, name: "New Hampshire (statewide)" },
  { id: "palm-beach", hasStory: true, name: "Palm Beach County, FL" },
  { id: "north-sound", hasStory: false, name: "North Sound, WA", center: [-122.25, 48.35] },
  { id: "twin-cities", hasStory: false, name: "Twin Cities, MN", center: [-93.25, 44.98] },
  { id: "front-range", hasStory: false, name: "Front Range, CO", center: [-104.9, 39.6] },
  { id: "piedmont-triad", hasStory: false, name: "Piedmont Triad, NC", center: [-79.9, 36.1] },
  { id: "gulf-coast", hasStory: false, name: "Gulf Coast, MS", center: [-89.1, 30.6] },
];

// ---------------------------------------------------------------------------
// Region circles — one soft circle per location (story or not), placed at
// the location's `anchor` (statewide examples get a single representative
// point rather than state-wide shading).
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
// Story records, in the order they appear on the map and in the guided tour.
// Video and audio only, so everything plays in the panel (Rippel, Nov 2026).
// `media` is the YouTube player; `start` / `end` (seconds or "m:ss") trim it
// to a clip, e.g. media: { type: "youtube", url, start: "1:05", end: "3:30" }.
// For more than one clip from a video, add a second entry. Podcasts also keep
// their MP3 as `audio`, used only if there's no YouTube version. `image` is
// optional: a story without one gets a designed fallback tile.
// ---------------------------------------------------------------------------
const STORIES = [
  // Story order and contents follow Rippel's spreadsheet (Molly Belsky, Nov 2026): video and audio only, playable in the panel. Podcast clip times (start/end) go on `media`.
  {
    id: "fox-cities-video-summit",
    geoId: "fox-cities",
    geography: "Fox Cities, WI",
    title: "Imagine Fox Cities Summit",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "Launched by community members for community members, Imagine Fox Cities is a coalition of local change-makers, working as stewards, to create a thriving region for the residents of today and for generations to come.",
    image: "https://img.youtube.com/vi/mpGnbnlwLqg/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/mpGnbnlwLqg" },
    link: "https://www.youtube.com/watch?v=mpGnbnlwLqg",
    linkLabel: "Watch on YouTube →",
  },
  {
    id: "palm-beach-video-bewellpbc",
    geoId: "palm-beach",
    geography: "Palm Beach County, FL",
    title: "BeWell PBC Stewards Leading Change",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "As BeWellPBC turns three, hear from the stewards leading change to transform behavioral health and wellness across Palm Beach County.",
    image: "https://img.youtube.com/vi/tXXlmbzcEOU/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/tXXlmbzcEOU" },
    link: "https://www.youtube.com/watch?v=tXXlmbzcEOU",
    linkLabel: "Watch on YouTube →",
  },
  {
    id: "inland-empire-video-iecf-summit",
    geoId: "inland-empire",
    geography: "Inland Empire, CA",
    title: "IECF Policy and Philanthropy Summit 2026",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "Scenes from the Inland Empire Community Foundation's 2026 Policy & Philanthropy Summit, “All Together.”",
    image: "https://img.youtube.com/vi/Vc-rRXNMedQ/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/Vc-rRXNMedQ" },
    link: "https://www.youtube.com/watch?v=Vc-rRXNMedQ",
    linkLabel: "Watch on YouTube →",
  },
  {
    id: "inland-empire-video-belonging-civic-muscle",
    geoId: "inland-empire",
    geography: "Inland Empire, CA",
    title: "Vital Conditions Overview: Belonging & Civic Muscle",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "The Inland Empire Community Foundation on the vital condition of belonging and civic muscle: the social fabric and civic power that build a stronger Inland Empire for all.",
    image: "https://img.youtube.com/vi/exLwdsRGp6o/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/exLwdsRGp6o" },
    link: "https://www.youtube.com/watch?v=exLwdsRGp6o",
    linkLabel: "Watch on YouTube →",
  },
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
    audio: "https://episodes.castos.com/5fdcb63fbdb699-82532580/2261842/c1e-557ds18p8dhnk673-7zxjxxzxsw99-qzhob4.mp3",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/Qm6mMFq_gSE" },
    link: "https://rippel.org/podcasts/?podcast-id=7828",
  },
  {
    id: "south-texas-video-tim-barr",
    geoId: "south-texas",
    geography: "South Texas (PJTT)",
    title: "Creating Belonging Where It Matters",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "Tim Barr, Communities of Solutions Director at Methodist Healthcare Ministries, supports community coalitions across South Texas. He shares how his rural origins shape his work, the changes Prosperemos Juntos is creating, and how he practices hope.",
    image: "https://img.youtube.com/vi/0oPep3N5mIk/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/0oPep3N5mIk", autoplay: false },
    link: "https://www.youtube.com/watch?v=0oPep3N5mIk",
    linkLabel: "Watch on YouTube →",
  },
  {
    id: "south-texas-video-hope-heals",
    geoId: "south-texas",
    geography: "South Texas (PJTT)",
    title: "Hope Heals San Antonio",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "A video from Methodist Healthcare Ministries of South Texas, the organization behind Prosperemos Juntos / Thriving Together.",
    image: "https://img.youtube.com/vi/MM_CVMzC8Sw/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/MM_CVMzC8Sw", autoplay: false },
    link: "https://www.youtube.com/watch?v=MM_CVMzC8Sw",
    linkLabel: "Watch on YouTube →",
  },
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
    audio: "https://episodes.castos.com/5fdcb63fbdb699-82532580/2058706/c1e-wg1pb395zobx3kd2-wwx0m92zh3zz-vanddc.mp3",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/T7wdBXB5RUc" },
    link: "https://rippel.org/podcast/stewardship-begins-with-listening-in-south-texas/",
  },
  {
    id: "lehigh-valley-video-franklin-park",
    geoId: "lehigh-valley",
    geography: "Lehigh Valley, PA",
    title: "Welcome to Franklin Park",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "A video from the Leonard Parker Pool Institute for Health introducing Franklin Park.",
    image: "https://img.youtube.com/vi/Os8kum9GgJE/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/Os8kum9GgJE", autoplay: false },
    link: "https://www.youtube.com/watch?v=Os8kum9GgJE",
    linkLabel: "Watch on YouTube →",
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
    // Cropped from the episode artwork (img/samantha-shaak.webp) to drop its
    // baked-in frame, which read as letterboxing in the 16:9 card slot.
    image: "img/samantha-shaak-photo.jpg",
    imagePosition: "center 30%",
    audio: "https://episodes.castos.com/5fdcb63fbdb699-82532580/2152943/c1e-m8dwuqj22rbov43q-47x8m0q3fmdz-5c52oc.mp3",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/68myEgOTEfA" },
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
    image: "https://img.youtube.com/vi/53VFuJO4HvA/hqdefault.jpg",
    audio: "https://episodes.castos.com/5fdcb63fbdb699-82532580/1855526/c1e-npxvu5x52xc9z41g-25kk29d3sk5g-twkocy.mp3",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/53VFuJO4HvA" },
    link: "https://rippel.org/podcasts/?podcast-id=5337",
  },
  {
    id: "granite-state-video-data",
    geoId: "granite-state",
    geography: "New Hampshire (statewide)",
    title: "Data as Public Good",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "Gene Martin, Executive Director of the New Hampshire Fiscal Policy Institute, explains how data can inform policies that can improve conditions for everyone who lives in New Hampshire.",
    image: "https://img.youtube.com/vi/otzjdlNkg4A/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/otzjdlNkg4A" },
    link: "https://www.youtube.com/watch?v=otzjdlNkg4A",
    linkLabel: "Watch on YouTube →",
  },
  {
    id: "granite-state-video-lgbtq-youth",
    geoId: "granite-state",
    geography: "New Hampshire (statewide)",
    title: "Creating a Robust System of Care for LGBTQ+ Youth",
    format: "Video",
    formatIcon: "▶️",
    excerpt:
      "Hershey Hirschkop, former executive director of Seacoast Outright, on why an integrated system of care requires training mental health professionals to be culturally competent when supporting LGBTQ+ youth.",
    image: "https://img.youtube.com/vi/5ucSfse5QB0/hqdefault.jpg",
    media: { type: "youtube", url: "https://www.youtube-nocookie.com/embed/5ucSfse5QB0" },
    link: "https://www.youtube.com/watch?v=5ucSfse5QB0",
    linkLabel: "Watch on YouTube →",
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
