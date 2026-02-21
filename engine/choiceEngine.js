/**
 * Cupid — Standardized Choice Effect Engine
 * Handles all choice effects: stats, flags, items, missions, relationship, navigation, etc.
 */

export class ChoiceEngine {
  constructor(getState, setState, toast, sceneManager) {
    this.getState = getState;
    this.setState = setState;
    this.toast = toast;
    this.sceneManager = sceneManager;
  }

  /**
   * Apply effects array to state. Returns new state.
   */
  applyEffects(state, effects) {
    let next = structuredClone(state);
    for (const eff of (effects || [])) {
      next = this.applyEffect(next, eff);
    }
    return next;
  }

  /**
   * Apply a single effect. Returns new state.
   */
  applyEffect(state, effect) {
    const next = structuredClone(state);
    switch (effect.type) {
      case 'add':
        return this.addStat(next, effect.key, effect.value);
      case 'set':
        return this.setStat(next, effect.key, effect.value);
      case 'flag':
        return this.setFlag(next, effect.key, effect.value);
      case 'gotoScene':
        return this.gotoScene(next, effect.sceneId);
      case 'giveItem':
        return this.giveItem(next, effect.itemId);
      case 'takeItem':
        return this.takeItem(next, effect.itemId);
      case 'unlockHotspot':
        return this.unlockHotspot(next, effect.sceneId, effect.hotspotId);
      case 'startMission':
        return this.startMission(next, effect.missionId);
      case 'advanceMission':
        return this.advanceMission(next, effect.missionId, effect.progress);
      case 'queueMoment':
        return this.queueMoment(next, effect.text, effect.tag || 'moment');
      case 'updateRelationship':
        return this.updateRelationship(next, effect.mode, effect.intensityDelta || 0);
      default:
        console.warn('Unknown effect type:', effect.type);
        return next;
    }
  }

  addStat(state, path, delta) {
    const parts = path.split('.');
    if (parts[0] !== 'stats') return state;
    const k = parts[1];
    const current = state.stats[k] ?? 0;
    const clamped = Math.max(0, Math.min(10, current + delta));
    return { ...state, stats: { ...state.stats, [k]: clamped } };
  }

  setStat(state, path, value) {
    const parts = path.split('.');
    if (parts[0] !== 'stats') return state;
    const k = parts[1];
    const clamped = Math.max(0, Math.min(10, value));
    return { ...state, stats: { ...state.stats, [k]: clamped } };
  }

  setFlag(state, path, value) {
    const parts = path.split('.');
    if (parts[0] !== 'flags') return state;
    const k = parts[1];
    return { ...state, flags: { ...state.flags, [k]: value } };
  }

  gotoScene(state, sceneId) {
    // Scene change is handled by caller (sceneManager.loadScene)
    // This just updates state
    return { ...state, sceneId };
  }

  giveItem(state, itemId) {
    // Items are loaded from data/items.json, so we just track IDs
    if (!state.inventory) state.inventory = [];
    if (state.inventory.find(it => (typeof it === 'string' ? it === itemId : it.id === itemId))) {
      return state; // Already have it
    }
    // If inventory stores objects, need to load item definition
    // For now, assume inventory stores item objects or IDs
    const newInv = [...state.inventory];
    if (typeof newInv[0] === 'string') {
      newInv.push(itemId);
    } else {
      // Need to load item definition - handled by caller
      newInv.push({ id: itemId });
    }
    return { ...state, inventory: newInv };
  }

  takeItem(state, itemId) {
    if (!state.inventory) return state;
    const newInv = state.inventory.filter(it => 
      (typeof it === 'string' ? it !== itemId : it.id !== itemId)
    );
    return { ...state, inventory: newInv };
  }

  unlockHotspot(state, sceneId, hotspotId) {
    // Store unlocked hotspots in flags or separate structure
    const flagKey = `hotspot_${sceneId}_${hotspotId}`;
    return { ...state, flags: { ...state.flags, [flagKey]: true } };
  }

  startMission(state, missionId) {
    // Missions are loaded from data/missions.json
    // This adds mission to active list if not already there
    if (!state.missions) state.missions = { active: [] };
    const active = state.missions.active || [];
    if (active.find(m => m.id === missionId)) return state;
    const newActive = [...active, { id: missionId, progress: 0 }];
    return { ...state, missions: { ...state.missions, active: newActive } };
  }

  advanceMission(state, missionId, progressDelta) {
    if (!state.missions || !state.missions.active) return state;
    const active = state.missions.active.map(m => {
      if (m.id === missionId) {
        const newProgress = Math.max(0, Math.min(1, (m.progress || 0) + progressDelta));
        return { ...m, progress: newProgress };
      }
      return m;
    });
    return { ...state, missions: { ...state.missions, active } };
  }

  queueMoment(state, text, tag) {
    const newLog = [{ t: Date.now(), tag, text }, ...(state.log || [])];
    return { ...state, log: newLog };
  }

  updateRelationship(state, mode, intensityDelta) {
    if (!state.rel) state.rel = { mode: 'strangers', intensity: 0 };
    const newIntensity = Math.max(0, Math.min(100, (state.rel.intensity || 0) + intensityDelta));
    return { ...state, rel: { mode, intensity: newIntensity } };
  }

  /**
   * Check if a choice's requirements are met.
   */
  checkRequirements(state, requires) {
    if (!requires) return true;
    if (requires.flag && !state.flags[requires.flag]) return false;
    if (requires.stat) {
      const statValue = state.stats[requires.stat] ?? 0;
      if (requires.min !== undefined && statValue < requires.min) return false;
      if (requires.max !== undefined && statValue > requires.max) return false;
    }
    if (requires.item) {
      const hasItem = state.inventory?.some(it => 
        (typeof it === 'string' ? it === requires.item : it.id === requires.item)
      );
      if (!hasItem) return false;
    }
    if (requires.scene && state.sceneId !== requires.scene) return false;
    return true;
  }
}
