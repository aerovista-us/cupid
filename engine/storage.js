import { saveDownload } from './util.js';

export class Storage{
  constructor(key){ this.key = key; }
  load(fallback){
    try{
      const raw = localStorage.getItem(this.key);
      if (!raw) return structuredClone(fallback);
      const v = JSON.parse(raw);
      return { ...structuredClone(fallback), ...v };
    }catch(_){ return structuredClone(fallback); }
  }
  save(state){ try{ localStorage.setItem(this.key, JSON.stringify(state)); }catch(_){} }
  clear(){ try{ localStorage.removeItem(this.key); }catch(_){} }
  exportSave(state){ saveDownload('cupid_save.json', JSON.stringify(state, null, 2)); }
  /** @returns {object|null} Parsed and validated state or null */
  parseSave(text){
    try{
      const v = JSON.parse(text);
      if (v == null || typeof v !== 'object') return null;
      if (!v.sceneId || !v.stats || typeof v.stats.trust !== 'number') return null;
      return v;
    }catch(_){ return null; }
  }
  /** Merge parsed save with default state so new keys (rel, settings, etc.) exist */
  mergeWithDefaults(parsed, defaultState) {
    return { ...defaultState, ...parsed };
  }
}
