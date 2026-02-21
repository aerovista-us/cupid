import { loadJSON, qs, clamp01, isPortrait, requestFullscreen } from './util.js';
import { createHUDButtons } from './hud.js';
import { PanelManager } from './panels.js';
import { SceneManager } from './scene.js';
import { Toasts } from './toasts.js';
import { Storage } from './storage.js';
import { Modal } from './modal.js';
import { HotspotEditor } from './editor.js';
import { ChoiceEngine } from './choiceEngine.js';
import { RelationshipManager } from './relationship.js';

const rotateGate = qs('#rotateGate');
qs('#rotateTryFullscreen').addEventListener('click', async () => { await requestFullscreen(document.documentElement); });
function updateRotateGate(){
  const portrait = isPortrait();
  rotateGate.classList.toggle('show', portrait);
  rotateGate.setAttribute('aria-hidden', portrait ? 'false':'true');
}
window.addEventListener('resize', updateRotateGate);
window.addEventListener('orientationchange', updateRotateGate);

const storage = new Storage('cupid_proto_v3_editor');
const defaultState = {
  sceneId: 'afterparty_apartment',
  stats: { trust: 5, attraction: 3, resentment: 1, chaos: 2 },
  flags: {},
  inventory: [
    { id:'silence_token', name:'Silence Token', type:'Tool', desc:'Mute the moment. -1 Chaos, +1 Trust.', usable:true, effects:[{type:'add', key:'stats.chaos', value:-1},{type:'add', key:'stats.trust', value:1}] },
    { id:'spark_pin', name:'Spark Pin', type:'Key', desc:'Unlocks certain flirt hotspots later.', usable:false },
    { id:'rose_note', name:'Rose Note', type:'Memory', desc:'A memory anchor for reconnection arcs.', usable:false }
  ],
  missions: { active: [{ id:'mission_core_01', title:'Get them talking', desc:'Move the relationship off neutral by creating a real moment.', progress:0.35, hint:'Try something intentional in the Afterparty Apartment.' }] },
  log: [{ t: Date.now()-3600_000, tag:'start', text:'You arrived as Cupid. The night is messy.' }],
  ui: { debug:false }
};
let state = storage.load(defaultState);

const toasts = new Toasts(qs('#toastRoot'));
const modal = new Modal(qs('#modalRoot'));
const panelManager = new PanelManager(qs('#panelRoot'));

const sceneManager = new SceneManager({
  bgImgEl: qs('#bgImg'),
  midSvgEl: qs('#midSvgImg'),
  hotspotsEl: qs('#hotspots'),
  modal,
  getState: () => state,
  setState: (next) => { state = next; storage.save(state); hudRefresh(); },
  toast: (msg) => toasts.show(msg),
});

const editor = new HotspotEditor({
  containerEl: qs('#hotspots'),
  toast: (msg) => toasts.show(msg),
  getScene: () => sceneManager.getScene(),
  setScene: (nextScene) => { sceneManager.setScene(nextScene); window.__CURRENT_SCENE__ = nextScene; hudRefresh(); },
  modal
});
sceneManager.setEditor(editor);

const scenesIndex = await loadJSON('data/scenes.json');
await sceneManager.loadScene(state.sceneId);
window.__CURRENT_SCENE__ = sceneManager.getScene();

const hudButtonsDef = await loadJSON('ui/hudButtons.json');
createHUDButtons(qs('#hudButtons'), hudButtonsDef, (panelId) => { panelManager.toggle(panelId); hudRefresh(); });

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'd'){
    state = { ...state, ui:{...state.ui, debug: !state.ui.debug} };
    storage.save(state);
    hudRefresh();
  }
  if (k === 'e'){
    panelManager.open('editor');
    hudRefresh();
  }
  if (e.key === 'Escape'){
    panelManager.closeAll(); modal.close(); hudRefresh();
  }
});

panelManager.register('inventory', { pos:'bottom', title:'Inventory', render: (root) => renderInventory(root) });
panelManager.register('missions',  { pos:'bottom', title:'Missions',  render: (root) => renderMissions(root) });
panelManager.register('settings',  { pos:'bottom', title:'Settings',  render: (root) => renderSettings(root) });
panelManager.register('editor',    { pos:'bottom', title:'Editor',    render: (root) => renderEditor(root) });

panelManager.register('stats',     { pos:'top',    title:'Stats',     render: (root) => renderStats(root) });
panelManager.register('log',       { pos:'top',    title:'Log',       render: (root) => renderLog(root) });
panelManager.register('map',       { pos:'top',    title:'Map',       render: (root) => renderMap(root) });

function hudRefresh(){
  document.body.classList.toggle('debug', !!state.ui.debug);
  const anyOpen = panelManager.anyOpen() || modal.isOpen();
  qs('#dimmer').style.opacity = anyOpen ? '1' : '0';
  qs('#dimmer').style.pointerEvents = anyOpen ? 'auto' : 'none';
  sceneManager.setHotspotsEnabled(!anyOpen && !editor.enabled);
  panelManager.refreshOpenPanels();
}

function applyEffects(effects){
  for (const eff of (effects || [])){
    if (eff.type === 'add'){
      const [root, key] = eff.key.split('.');
      if (root === 'stats'){
        state = { ...state, stats: { ...state.stats, [key]: (state.stats[key] ?? 0) + eff.value } };
      }
    }
    if (eff.type === 'flag'){
      const [root, key] = eff.key.split('.');
      if (root === 'flags'){
        state = { ...state, flags: { ...state.flags, [key]: eff.value } };
      }
    }
  }
  storage.save(state);
}

function renderInventory(root){
  const items = state.inventory || [];
  root.innerHTML = `
    <p>Tap an item to inspect/use.</p>
    <div class="grid">
      ${items.map((it, idx) => `
        <div class="card">
          <div class="row">
            <h3>${it.name}</h3>
            <span class="badge">${it.type}</span>
          </div>
          <div class="small">${it.desc}</div>
          <div style="height:10px"></div>
          <div class="row">
            <button class="btn" data-action="inspect" data-idx="${idx}">Inspect</button>
            <button class="btn primary" data-action="use" data-idx="${idx}" ${it.usable ? '' : 'disabled'}>Use</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  root.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-idx'));
      const action = btn.getAttribute('data-action');
      const it = items[idx];
      if (!it) return;
      if (action === 'inspect'){
        modal.open({ title: it.name, body: `<div class="small">${it.desc}</div>`, choices: [{ text:'Close', action:'close' }] });
        hudRefresh();
      }
      if (action === 'use' && it.usable){
        applyEffects(it.effects);
        toasts.show(`Used: ${it.name}`);
        state = { ...state, log: [{ t: Date.now(), tag:'item', text:`Used ${it.name}.` }, ...state.log] };
        storage.save(state);
        hudRefresh();
      }
    });
  });
}

function renderStats(root){
  const s = state.stats;
  const statMeta = [
    { key:'trust', label:'Trust' },
    { key:'attraction', label:'Attraction' },
    { key:'resentment', label:'Resentment' },
    { key:'chaos', label:'Chaos' },
  ];
  root.innerHTML = `
    <p>Prototype stats (0–10). Debug: <span class="kbd">D</span>. Editor: <span class="kbd">E</span>.</p>
    ${statMeta.map(m => {
      const v = clamp01((s[m.key] ?? 0) / 10);
      return `
        <div class="stat">
          <div class="statTop"><span>${m.label}</span><span>${s[m.key] ?? 0}/10</span></div>
          <div class="bar"><div class="fill" style="width:${Math.round(v*100)}%"></div></div>
        </div>
      `;
    }).join('')}
    <div style="height:10px"></div>
    <div class="row">
      <button class="btn warn" id="btnReset">Reset Save</button>
      <button class="btn" id="btnFullscreen">Fullscreen</button>
    </div>
  `;
  root.querySelector('#btnReset').addEventListener('click', async () => {
    storage.clear();
    state = storage.load(defaultState);
    await sceneManager.loadScene(state.sceneId);
    panelManager.closeAll();
    toasts.show('Save reset');
    hudRefresh();
  });
  root.querySelector('#btnFullscreen').addEventListener('click', async () => await requestFullscreen(document.documentElement));
}

function renderMissions(root){
  const ms = state.missions?.active || [];
  root.innerHTML = `
    <p>Main arcs and micro objectives.</p>
    ${ms.map(m => `
      <div class="mission">
        <div class="missionTitle">${m.title}</div>
        <div class="small">${m.desc}</div>
        <div style="height:8px"></div>
        <div class="bar"><div class="fill" style="width:${Math.round(clamp01(m.progress||0)*100)}%"></div></div>
        <div class="small" style="margin-top:8px"><b>Hint:</b> ${m.hint}</div>
      </div>
    `).join('')}
  `;
}

function renderLog(root){
  const logs = state.log || [];
  root.innerHTML = `
    <p>Your story memory.</p>
    ${logs.slice(0, 18).map(entry => `
      <div class="mission">
        <div class="row">
          <span class="badge">${entry.tag || 'log'}</span>
          <span class="small">${new Date(entry.t).toLocaleString()}</span>
        </div>
        <div style="height:8px"></div>
        <div>${entry.text}</div>
      </div>
    `).join('')}
  `;
}

function renderMap(root){
  root.innerHTML = `
    <p>Locations. Tap to travel.</p>
    ${scenesIndex.map(sc => `
      <div class="mission">
        <div class="row">
          <div>
            <div class="missionTitle">${sc.title}</div>
            <div class="small">${sc.mood || ''}</div>
          </div>
          <button class="btn" data-goto="${sc.id}">Go</button>
        </div>
      </div>
    `).join('')}
  `;
  root.querySelectorAll('button[data-goto]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-goto');
      if (!id) return;
      state = { ...state, sceneId: id, log: [{ t: Date.now(), tag:'travel', text:`Traveled to ${id}.` }, ...state.log] };
      storage.save(state);
      panelManager.closeAll();
      await sceneManager.loadScene(id);
      window.__CURRENT_SCENE__ = sceneManager.getScene();
      toasts.show('Travel');
      hudRefresh();
    });
  });
}

function renderEditor(root){
  const sc = sceneManager.getScene();
  const count = (sc?.hotspots || []).length;
  root.innerHTML = `
    <p><b>Hotspot Editor</b> (double-tap a box to edit label/id).</p>
    <div class="row">
      <button class="btn primary" id="btnEditorToggle">${editor.enabled ? 'Exit Editor' : 'Enter Editor'}</button>
      <button class="btn" id="btnAdd">Add Hotspot</button>
      <button class="btn warn" id="btnDel" ${editor.selectedId ? '' : 'disabled'}>Delete Selected</button>
    </div>
    <div style="height:10px"></div>
    <div class="row">
      <button class="btn" id="btnEdit" ${editor.selectedId ? '' : 'disabled'}>Edit Selected</button>
      <button class="btn" id="btnExportScene">Export scene.json</button>
      <button class="btn" id="btnExportHotspots">Export hotspots.json</button>
    </div>
    <div style="height:12px"></div>
    <div class="small">Scene: <span class="kbd">${sc?.id || ''}</span> • Hotspots: <span class="kbd">${count}</span> • Selected: <span class="kbd">${editor.selectedId || 'none'}</span></div>
    <div style="height:12px"></div>
    <div class="code">${JSON.stringify(sc?.hotspots || [], null, 2)}</div>
  `;
  root.querySelector('#btnEditorToggle').addEventListener('click', () => { editor.setEnabled(!editor.enabled); toasts.show(editor.enabled ? 'Editor ON' : 'Editor OFF'); hudRefresh(); });
  root.querySelector('#btnAdd').addEventListener('click', () => { if (!editor.enabled) editor.setEnabled(true); editor.addHotspot(); hudRefresh(); });
  root.querySelector('#btnDel').addEventListener('click', () => { editor.deleteSelected(); hudRefresh(); });
  root.querySelector('#btnEdit').addEventListener('click', () => { editor.editSelected(); hudRefresh(); });
  root.querySelector('#btnExportScene').addEventListener('click', () => editor.exportSceneJSON());
  root.querySelector('#btnExportHotspots').addEventListener('click', () => editor.exportHotspotsOnly());
}

function renderSettings(root){
  root.innerHTML = `
    <p>Prototype settings.</p>
    <div class="row">
      <button class="btn" id="btnFullscreen">Fullscreen</button>
      <button class="btn" id="btnDebug">Toggle Debug (<span class="kbd">D</span>)</button>
      <button class="btn" id="btnEditor">Open Editor (<span class="kbd">E</span>)</button>
    </div>
    <div style="height:10px"></div>
    <div class="row">
      <button class="btn" id="btnExportSave">Export Save</button>
      <button class="btn" id="btnImportSave">Import Save</button>
    </div>
    <input type="file" id="importSaveInput" accept=".json,application/json" style="display:none" />
    <div style="height:12px"></div>
    <div class="small">Layer order: bg.svg → mid.svg → hud_shell.png → buttons → panels/modals.</div>
    <div class="small">Compiler: run <span class="kbd">python tools/compile_md_to_scenes.py</span> in your repo.</div>
  `;
  root.querySelector('#btnFullscreen').addEventListener('click', async () => await requestFullscreen(document.documentElement));
  root.querySelector('#btnDebug').addEventListener('click', () => { state = { ...state, ui:{...state.ui, debug: !state.ui.debug} }; storage.save(state); hudRefresh(); });
  root.querySelector('#btnEditor').addEventListener('click', () => { panelManager.open('editor'); hudRefresh(); });
  root.querySelector('#btnExportSave').addEventListener('click', () => { storage.exportSave(state); toasts.show('Save exported'); });
  const importInput = root.querySelector('#importSaveInput');
  root.querySelector('#btnImportSave').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = storage.parseSave(text);
      if (!parsed) { toasts.show('Invalid save file'); return; }
      state = storage.mergeWithDefaults(parsed, defaultState);
      storage.save(state);
      await sceneManager.loadScene(state.sceneId);
      panelManager.closeAll();
      toasts.show('Save imported');
      hudRefresh();
    } catch (_) { toasts.show('Import failed'); }
  });
}

updateRotateGate();
if (!state.settings?.ageGatePassed) {
  modal.open({
    title: 'Age Gate',
    body: '<p>This experience includes mature themes. You must be 18 or older to continue.</p>',
    choices: [
      { text: 'I am 18+', action: 'pick', onPick: () => { state = { ...state, settings: { ...state.settings, ageGatePassed: true } }; storage.save(state); hudRefresh(); } },
      { text: 'Leave', action: 'close' }
    ]
  });
}
hudRefresh();
