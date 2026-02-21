/**
 * Cupid PoC — Game state (stats, scene, log). Persists to localStorage.
 */
const CUPID_STORAGE_KEY = 'cupid_poc_save';

const DEFAULT_STATE = {
  sceneId: 'location_01',
  stats: {
    trust: 50,
    attraction: 50,
    resentment: 20,
    chaos: 30
  },
  lastStatChanges: [],
  log: [],
  unlockedLocations: ['location_01', 'location_02'],
  ui: {
    openPanel: null
  }
};

function clampStat(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function loadState() {
  try {
    const raw = localStorage.getItem(CUPID_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed, stats: { ...DEFAULT_STATE.stats, ...parsed.stats } };
    }
  } catch (_) {}
  return { ...JSON.parse(JSON.stringify(DEFAULT_STATE)) };
}

function saveState(state) {
  try {
    localStorage.setItem(CUPID_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function addStatChange(state, statKey, delta, reason) {
  const prev = state.stats[statKey];
  const next = clampStat(prev + delta);
  const actualDelta = next - prev;
  state.stats[statKey] = next;
  const entry = { stat: statKey, delta: actualDelta, reason };
  state.lastStatChanges = [entry, ...state.lastStatChanges].slice(0, 10);
  return actualDelta;
}

function appendLog(state, message, tag) {
  state.log = [{ t: Date.now(), message, tag: tag || 'choice' }, ...state.log];
}

// Singleton state instance for PoC
let gameState = loadState();

function getState() {
  return gameState;
}

function setState(updater) {
  if (typeof updater === 'function') {
    gameState = updater(gameState);
  } else {
    gameState = { ...gameState, ...updater };
  }
  saveState(gameState);
  return gameState;
}

function resetSave() {
  gameState = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)) };
  saveState(gameState);
  return gameState;
}
