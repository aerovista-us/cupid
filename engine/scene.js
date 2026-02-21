import { loadJSON, escapeHtml } from './util.js';

/** Set img src; on error try same base name with .svg (if path was .png) or .png (if .svg). */
function setImgSrcWithFallback(imgEl, path){
  imgEl.src = path;
  imgEl.onerror = function onBgError(){
    imgEl.onerror = null;
    const alt = path.replace(/\.(png|jpe?g|webp)$/i, '.svg') !== path
      ? path.replace(/\.(png|jpe?g|webp)$/i, '.svg')
      : path.replace(/\.svg$/i, '.png');
    if (alt !== path) imgEl.src = alt;
  };
}

export class SceneManager{
  constructor({ bgImgEl, midSvgEl, hotspotsEl, modal, getState, setState, toast }){
    this.bgImgEl = bgImgEl; this.midSvgEl = midSvgEl; this.hotspotsEl = hotspotsEl;
    this.modal = modal; this.getState = getState; this.setState = setState; this.toast = toast; this.scene = null; this.editor = null; this.choiceEngine = null;
  }
  getScene(){ return this.scene; }
  setScene(nextScene){ this.scene = nextScene; this.renderHotspots(nextScene); }
  setHotspotsEnabled(enabled){ this.hotspotsEl.style.pointerEvents = enabled ? 'auto' : 'none'; }
  setEditor(editorInstance){ this.editor = editorInstance; }
  setChoiceEngine(engine){ this.choiceEngine = engine; }
  async loadScene(sceneId){
    const scene = await loadJSON(`scenes/${sceneId}/scene.json`);
    this.scene = scene;
    const bgFile = scene.bg || 'bg.png';
    const bgPath = `scenes/${sceneId}/${bgFile}`;
    this.bgImgEl.alt = scene.title || sceneId;
    setImgSrcWithFallback(this.bgImgEl, bgPath);
    if (scene.mid){ setImgSrcWithFallback(this.midSvgEl, `scenes/${sceneId}/${scene.mid}`); this.midSvgEl.style.display='block'; }
    else { this.midSvgEl.style.display='none'; this.midSvgEl.removeAttribute('src'); }
    this.renderHotspots(scene);
    if (this.editor && this.editor.enabled) this.editor._syncFromScene();
  }
  renderHotspots(scene){
    this.hotspotsEl.innerHTML = '';
    for (const h of (scene.hotspots || [])){
      const el = document.createElement('button');
      el.type='button'; el.className='hsBtn';
      el.style.left=(h.x*100)+'%'; el.style.top=(h.y*100)+'%';
      el.style.width=(h.w*100)+'%'; el.style.height=(h.h*100)+'%';
      el.setAttribute('aria-label', h.label || h.id);
      el.addEventListener('click', () => this.openHotspot(h, scene));
      this.hotspotsEl.appendChild(el);
    }
  }
  openHotspot(h, scene){
    const state = this.getState();
    const engine = this.choiceEngine;
    const applyAndLog = (ch) => {
      let st = this.getState();
      st = engine ? engine.applyEffects(st, ch.effects || []) : applyEffectsToState(st, ch.effects || []);
      st = { ...st, log: [{ t: Date.now(), tag:'choice', text:`${scene.title}: ${h.label} → ${ch.text}` }, ...st.log] };
      this.setState(st);
      if (ch.toast) this.toast(ch.toast);
    };
    const choices = (h.choices || [])
      .filter(ch => !ch.requires || (engine && engine.checkRequirements(state, ch.requires)))
      .map(ch => ({
        text: (state.settings && state.settings.explicitLanguage === false && ch.textSafe) ? ch.textSafe : ch.text,
        action: 'pick',
        onPick: () => applyAndLog(ch)
      }));
    this.modal.open({
      title: h.label || 'Choice',
      body: `<div class="small">${escapeHtml(scene.title || scene.id)} • ${escapeHtml(h.id)}</div>`,
      choices: [...choices, { text: 'Cancel', action: 'close' }]
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
