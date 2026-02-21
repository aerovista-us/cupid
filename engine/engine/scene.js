import { loadJSON } from './util.js';

export class SceneManager{
  constructor({ bgImgEl, midSvgEl, hotspotsEl, modal, getState, setState, toast }){
    this.bgImgEl = bgImgEl;
    this.midSvgEl = midSvgEl;
    this.hotspotsEl = hotspotsEl;
    this.modal = modal;
    this.getState = getState;
    this.setState = setState;
    this.toast = toast;
  }
  setHotspotsEnabled(enabled){
    this.hotspotsEl.style.pointerEvents = enabled ? 'auto' : 'none';
  }
  async loadScene(sceneId){
    const scene = await loadJSON(`scenes/${sceneId}/scene.json`);
    this.bgImgEl.src = `scenes/${sceneId}/${scene.bg}`;
    this.bgImgEl.alt = scene.title || sceneId;

    if (scene.mid){
      this.midSvgEl.src = `scenes/${sceneId}/${scene.mid}`;
      this.midSvgEl.style.display = 'block';
    }else{
      this.midSvgEl.style.display = 'none';
      this.midSvgEl.removeAttribute('src');
    }
    this.renderHotspots(scene);
  }
  renderHotspots(scene){
    this.hotspotsEl.innerHTML = '';
    for (const h of (scene.hotspots || [])){
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hsBtn';
      el.style.left = (h.x*100)+'%';
      el.style.top  = (h.y*100)+'%';
      el.style.width = (h.w*100)+'%';
      el.style.height= (h.h*100)+'%';
      el.setAttribute('aria-label', h.label || h.id);
      el.addEventListener('click', () => this.openHotspot(h, scene));
      this.hotspotsEl.appendChild(el);
    }
  }
  openHotspot(h, scene){
    const choices = (h.choices || []).map(ch => ({
      text: ch.text,
      action: 'pick',
      onPick: () => {
        let state = this.getState();
        state = applyEffectsToState(state, ch.effects || []);
        state = bumpMissionIfPhone(state, h.id);
        state = { ...state, log: [{ t: Date.now(), tag:'choice', text:`${scene.title}: ${h.label} → ${ch.text}` }, ...state.log] };
        this.setState(state);
        if (ch.toast) this.toast(ch.toast);
      }
    }));
    this.modal.open({
      title: h.label || 'Choice',
      body: `<div class="small">${escapeHtml(scene.title || scene.id)} • ${escapeHtml(h.id)}</div>`,
      choices: [...choices, { text:'Cancel', action:'close' }]
    });
  }
}

function applyEffectsToState(state, effects){
  const next = structuredClone(state);
  for (const eff of effects){
    if (eff.type === 'add'){
      const [root, k] = eff.key.split('.');
      if (root === 'stats') next.stats[k] = (next.stats[k] ?? 0) + eff.value;
    }
    if (eff.type === 'flag'){
      const [root, k] = eff.key.split('.');
      if (root === 'flags') next.flags[k] = eff.value;
    }
  }
  return next;
}
function bumpMissionIfPhone(state, hotspotId){
  if (hotspotId !== 'phone') return state;
  const ms = state.missions?.active || [];
  const nextMs = ms.map(m => (m.id === 'mission_scene_01') ? { ...m, progress: 1.0, hint:'Completed.' } : m);
  return { ...state, missions: { ...state.missions, active: nextMs } };
}
function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}
