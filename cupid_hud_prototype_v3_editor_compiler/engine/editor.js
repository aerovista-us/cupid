import { saveDownload, escapeHtml } from './util.js';
function pointerPos(ev, container){
  const r = container.getBoundingClientRect();
  return { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height };
}
export class HotspotEditor{
  constructor({ containerEl, toast, getScene, setScene, modal }){
    this.containerEl = containerEl; this.toast = toast; this.getScene = getScene; this.setScene = setScene; this.modal = modal;
    this.enabled = false; this.selectedId = null; this._boxes = new Map(); this._drag = null;
  }
  setEnabled(on){ this.enabled = on; document.body.classList.toggle('editorMode', on); on ? this._syncFromScene() : this._teardownBoxes(); }
  _teardownBoxes(){ for (const b of this._boxes.values()) b.boxEl.remove(); this._boxes.clear(); this.selectedId = null; }
  _syncFromScene(){ this._teardownBoxes(); const scene = this.getScene(); for (const h of (scene.hotspots||[])) this._createBoxForHotspot(h); }
  select(id){
    this.selectedId = id;
    for (const [hid, b] of this._boxes){
      b.boxEl.style.borderColor = hid === id ? 'rgba(255,200,0,0.95)' : 'rgba(255,70,190,0.85)';
      b.boxEl.style.background = hid === id ? 'rgba(255,200,0,0.10)' : 'rgba(255,70,190,0.12)';
    }
  }
  addHotspot(){
    const scene = this.getScene();
    const id = `hs_${Date.now().toString(36)}`;
    const h = { id, x:0.45, y:0.45, w:0.10, h:0.12, label:"New Hotspot", choices:[] };
    const next = { ...scene, hotspots: [...(scene.hotspots||[]), h] };
    this.setScene(next); this._createBoxForHotspot(h); this.select(id); this.toast('Hotspot added');
  }
  deleteSelected(){
    if (!this.selectedId) return;
    const scene = this.getScene();
    const next = { ...scene, hotspots: (scene.hotspots||[]).filter(h => h.id !== this.selectedId) };
    this.setScene(next);
    const box = this._boxes.get(this.selectedId);
    if (box) box.boxEl.remove();
    this._boxes.delete(this.selectedId);
    this.selectedId = null;
    this.toast('Hotspot deleted');
  }
  editSelected(){
    const scene = this.getScene();
    const h = (scene.hotspots||[]).find(x => x.id === this.selectedId);
    if (!h) return;
    const body = `
      <div class="small">Edit ID/Label. Drag/resize to adjust position.</div>
      <div style="height:10px"></div>
      <div class="small">ID</div>
      <input id="hs_id" value="${escapeHtml(h.id)}" style="width:100%;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:white;padding:0 10px" />
      <div style="height:10px"></div>
      <div class="small">Label</div>
      <input id="hs_label" value="${escapeHtml(h.label||'')}" style="width:100%;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:white;padding:0 10px" />
    `;
    this.modal.open({
      title:'Hotspot Editor',
      body,
      choices:[
        { text:'Save', action:'pick', onPick: () => {
          const newId = (document.querySelector('#hs_id')?.value||'').trim() || h.id;
          const newLabel = (document.querySelector('#hs_label')?.value||'').trim() || h.label;
          const scene2 = this.getScene();
          const hs = (scene2.hotspots||[]).map(x => x.id === h.id ? { ...x, id:newId, label:newLabel } : x);
          const oldId = h.id;
          this.setScene({ ...scene2, hotspots: hs });
          if (newId !== oldId){
            const box = this._boxes.get(oldId);
            if (box){
              this._boxes.delete(oldId);
              this._boxes.set(newId, box);
              box.boxEl.setAttribute('data-hsid', newId);
            }
            if (this.selectedId === oldId) this.selectedId = newId;
          }
          this.toast('Saved');
        }},
        { text:'Cancel', action:'close' }
      ]
    });
  }
  exportSceneJSON(){
    const scene = this.getScene();
    saveDownload(`${scene.id || 'scene'}_scene.json`, JSON.stringify(scene, null, 2));
    this.toast('Downloaded scene.json');
  }
  exportHotspotsOnly(){
    const scene = this.getScene();
    saveDownload(`${scene.id || 'scene'}_hotspots.json`, JSON.stringify({ id: scene.id, hotspots: scene.hotspots||[] }, null, 2));
    this.toast('Downloaded hotspots.json');
  }
  _createBoxForHotspot(h){
    const box = document.createElement('div'); box.className = 'editorBox'; box.setAttribute('data-hsid', h.id);
    const handle = document.createElement('div'); handle.className = 'editorHandle'; box.appendChild(handle);
    this.containerEl.appendChild(box);
    this._boxes.set(h.id, { boxEl: box, handleEl: handle });
    const applyStyle = (hh) => {
      box.style.left = (hh.x*100)+'%'; box.style.top = (hh.y*100)+'%';
      box.style.width = (hh.w*100)+'%'; box.style.height = (hh.h*100)+'%';
    };
    applyStyle(h);
    const onDown = (ev, mode) => {
      ev.preventDefault(); ev.stopPropagation();
      this.select(h.id);
      const scene = this.getScene();
      const hh = (scene.hotspots||[]).find(x => x.id === h.id);
      if (!hh) return;
      const p = pointerPos(ev, this.containerEl);
      this._drag = { id: h.id, mode, start:p, orig:{...hh} };
      box.setPointerCapture(ev.pointerId);
    };
    box.addEventListener('pointerdown', (ev) => onDown(ev, 'move'));
    handle.addEventListener('pointerdown', (ev) => onDown(ev, 'resize'));
    box.addEventListener('pointermove', (ev) => {
      if (!this._drag || this._drag.id !== h.id) return;
      ev.preventDefault();
      const scene = this.getScene();
      const hh = (scene.hotspots||[]).find(x => x.id === h.id);
      if (!hh) return;
      const p = pointerPos(ev, this.containerEl);
      const dx = p.x - this._drag.start.x;
      const dy = p.y - this._drag.start.y;
      let nx = this._drag.orig.x, ny = this._drag.orig.y, nw = this._drag.orig.w, nh = this._drag.orig.h;
      if (this._drag.mode === 'move'){ nx += dx; ny += dy; }
      else { nw = Math.max(0.02, nw + dx); nh = Math.max(0.02, nh + dy); }
      nx = Math.max(0, Math.min(1 - nw, nx)); ny = Math.max(0, Math.min(1 - nh, ny));
      const hs2 = (scene.hotspots||[]).map(x => x.id === h.id ? { ...x, x:nx, y:ny, w:nw, h:nh } : x);
      this.setScene({ ...scene, hotspots: hs2 });
      applyStyle({ ...hh, x:nx, y:ny, w:nw, h:nh });
    });
    box.addEventListener('pointerup', () => { if (this._drag?.id === h.id){ this._drag = null; this.toast('Hotspot updated'); }});
    box.addEventListener('dblclick', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.select(h.id); this.editSelected(); });
  }
}
