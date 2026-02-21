/**
 * Cupid PoC — Scene definitions, hotspots, choices, HUD buttons.
 * Coordinates are normalized 0–1 (percentage of scene width/height).
 */

const SCENES = {
  location_01: {
    id: 'location_01',
    name: 'The Afterparty Apartment',
    image: 'scenes/afterparty_apartment/bg.svg',
    hotspots: [
      { id: 'coffee_table', x: 0.35, y: 0.55, w: 0.28, h: 0.22, label: 'Coffee table' },
      { id: 'phone',         x: 0.62, y: 0.48, w: 0.12, h: 0.14, label: 'Phone' },
      { id: 'couch',         x: 0.22, y: 0.52, w: 0.40, h: 0.38, label: 'Couch' }
    ]
  },
  location_02: {
    id: 'location_02',
    name: "Late Night Diner",
    image: 'scenes/late_night_diner/bg.svg',
    hotspots: [
      { id: 'coffee',  x: 0.40, y: 0.55, w: 0.15, h: 0.12, label: 'Coffee' },
      { id: 'fries',   x: 0.48, y: 0.58, w: 0.20, h: 0.10, label: 'Shared fries' },
      { id: 'jukebox', x: 0.78, y: 0.35, w: 0.12, h: 0.18, label: 'Jukebox' }
    ]
  }
};

/** Hotspot id → choice set id (prompt + options with stat effects) */
const HOTSPOT_CHOICES = {
  coffee_table: {
    prompt: 'The coffee table: old photos, drunk texts, a pizza note. What do you nudge toward?',
    choices: [
      { text: 'Point at the old photos', trust: 5, attraction: 3, log: 'You drew their attention to the photos. A shared memory.' },
      { text: 'Leave the drunk texts visible', chaos: 8, attraction: 2, log: 'The texts stayed in view. Tension, or curiosity?' },
      { text: 'Do nothing', log: 'You let the moment pass.' }
    ]
  },
  phone: {
    prompt: "A phone face down. They're both aware of it.",
    choices: [
      { text: 'Reveal the message', trust: 10, resentment: -5, log: 'You nudged toward honesty. Trust grew.' },
      { text: 'Leave it hidden', trust: -3, attraction: 5, log: 'Some things stay private. Attraction simmered.' },
      { text: 'Ignore it', log: 'The phone stayed between them.' }
    ]
  },
  couch: {
    prompt: 'The couch. Where they sit changes everything.',
    choices: [
      { text: 'Nudge them closer', attraction: 10, trust: 2, log: 'You closed the gap. Something shifted.' },
      { text: 'Interrupt the tension', chaos: 5, trust: -2, log: 'You broke the moment. Relief or regret?' },
      { text: 'Let the silence sit', trust: 5, attraction: 3, log: 'Silence did the work.' }
    ]
  },
  coffee: {
    prompt: 'Coffee refills. You control the pacing.',
    choices: [
      { text: 'Keep the moment going', trust: 5, attraction: 5, log: 'Another refill. The conversation deepened.' },
      { text: 'Let it end', trust: 3, log: 'You let the night wind down.' }
    ]
  },
  fries: {
    prompt: 'Shared fries. Yes, it matters.',
    choices: [
      { text: 'They share', trust: 8, resentment: -3, log: 'They shared. Comfort in the small things.' },
      { text: "They don't", trust: -2, log: 'Each kept to their own.' }
    ]
  },
  jukebox: {
    prompt: 'The jukebox. Song choice changes the air.',
    choices: [
      { text: 'Old rock — nostalgia', trust: 5, attraction: 5, log: 'A throwback. Memories surfaced.' },
      { text: 'Something playful', attraction: 8, chaos: 3, log: 'The mood lightened.' },
      { text: 'Silence', attraction: 2, log: 'The quiet said something.' }
    ]
  }
};

const HUD_BUTTONS = [
  { id: 'btn_stats',     x: 0.08, y: 0.88, w: 0.14, h: 0.08, label: 'Stats',   open: 'stats' },
  { id: 'btn_log',       x: 0.26, y: 0.88, w: 0.14, h: 0.08, label: 'Log',     open: 'log' },
  { id: 'btn_map',       x: 0.44, y: 0.88, w: 0.14, h: 0.08, label: 'Map',     open: 'map' },
  { id: 'btn_missions',  x: 0.62, y: 0.88, w: 0.14, h: 0.08, label: 'Missions', open: 'missions' },
  { id: 'btn_inventory', x: 0.80, y: 0.88, w: 0.14, h: 0.08, label: 'Inventory', open: 'inventory' }
];

const LOCATIONS_LIST = [
  { id: 'location_01', name: 'Afterparty Apartment', mood: 'chaos', tier: 'Early' },
  { id: 'location_02', name: 'Late Night Diner', mood: 'vulnerability', tier: 'Early' }
];
