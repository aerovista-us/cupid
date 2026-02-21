import { loadJSON, qs, clamp01, isPortrait, requestFullscreen } from './util.js';
import { createHUDButtons } from './hud.js';
import { PanelManager } from './panels.js';
import { SceneManager } from './scene.js';
import { Toasts } from './toasts.js';
import { Storage } from './storage.js';
import { Modal } from './modal.js';

const rotateGate = qs('#rotateGate');
qs('#rotateTryFullscreen').addEventListener('click', async () => {
  await requestFullscreen(document.documentElement);
});
function updateRotateGate(){
  const portrait = isPortrait();
  rotateGate.classList.toggle('show', portrait);
  rotateGate.setAttribute('aria-hidden', portrait ? 'false':'true');
}
window.addEventListener('resize', updateRotateGate);
window.addEventListener('orientationchange', updateRotateGate);

const storage = new Storage('cupid_proto_v2_layers');
const defaultState = {
  sceneId: 'afterparty_apartment',
  stats: { trust: 5, attraction: 3, resentment: 1, chaos: 2 },
  flags: {},
  inventory: [
    { id:'silence_token', name:'Silence Token', type:'Tool', desc:'Mute the moment. -1 Chaos, +1 Trust.', usable:true, effects:[{type:'add', key:'stats.chaos', value:-1},{type:'add', key:'stats.trust', value:1}] },
    { id:'spark_pin', name:'Spark Pin', type:'Key', desc:'Unlocks certain flirt hotspots later.', usable:false },
    { id:'rose_note', name:'Rose Note', type:'Memory', desc:'A memory anchor for reconnection arcs.', usable:false }
  ],
  missions: {
    active: [
      { id:'mission_core_01', title:'Get them talking', desc:'Move the relationship off neutral by creating a real moment.', progress:0.35, hint:'Try something intentional in the Afterparty Apartment.' },
      { id:'mission_scene_01', title:'The Phone Problem', desc:'Decide whether to flip the phone or leave it.', progress:0.0, hint:'Tap the phone hotspot.' }
    ]
  },
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

const scenesIndex = await loadJSON('data/scenes.json');
await sceneManager.loadScene(state.sceneId);

const hudButtonsDef = await loadJSON('ui/hudButtons.json');
createHUDButtons(qs('#hudButtons'), hudButtonsDef, (panelId) => {
  panelManager.toggle(panelId);
  hudRefresh();
});

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'd'){
    state = { ...state, ui:{...state.ui, debug: !state.ui.debug} };
    storage.save(state);
    hudRefresh();
  }
  if (e.key === 'Escape'){
    panelManager.closeAll();
    modal.close();
    hudRefresh();
  }
});

// Register panels
panelManager.register('inventory', { pos:'bottom', title:'Inventory', render: (root) => renderInventory(root) });
panelManager.register('missions',  { pos:'bottom', title:'Missions',  render: (root) => renderMissions(root) });
panelManager.register('settings',  { pos:'bottom', title:'Settings',  render: (root) => renderSettings(root) });
panelManager.register('stats',     { pos:'top',    title:'Stats',     render: (root) => renderStats(root) });
panelManager.register('log',       { pos:'top',    title:'Log',       render: (root) => renderLog(root) });
panelManager.register('map',       { pos:'top',    title:'Map',       render: (root) => renderMap(root) });

function hudRefresh(){
  document.body.classList.toggle('debug', !!state.ui.debug);
  qs('#debugBadge').hidden = !state.ui.debug;

  const anyOpen = panelManager.anyOpen() || modal.isOpen();
  qs('#dimmer').style.opacity = anyOpen ? '1' : '0';
  qs('#dimmer').style.pointerEvents = anyOpen ? 'auto' : 'none';
  sceneManager.setHotspotsEnabled(!anyOpen);
  panelManager.refreshOpenPanels();
}

function applyEffects(effects){
  for (const eff of (effects || [])){
    if (eff.type === 'add'){
      const [root, k] = eff.key.split('.');
      if (root === 'stats'){
        state = { ...state, stats: { ...state.stats, [k]: (state.stats[k] ?? 0) + eff.value } };
      }
    }
    if (eff.type === 'flag'){
      const [root, k] = eff.key.split('.');
      if (root === 'flags'){
        state = { ...state, flags: { ...state.flags, [k]: eff.value } };
      }
    }
  }
  storage.save(state);
}

function renderInventory(root){
  const items = state.inventory || [];
  root.innerHTML = `
    <p>Layer stack is live: bg.png → mid.svg → hud_shell.png → buttons.</p>
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
    <p>Prototype stats (0–10). Press <b>D</b> for debug outlines.</p>
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
      <button class="btn" id="btnReset">Reset Save</button>
      <button class="btn" id="btnFullscreen">Fullscreen</button>
    </div>
  `;
  root.querySelector('#btnReset').addEventListener('click', () => {
    storage.clear();
    state = storage.load(defaultState);
    sceneManager.loadScene(state.sceneId);
    panelManager.closeAll();
    toasts.show('Save reset');
    hudRefresh();
  });
  root.querySelector('#btnFullscreen').addEventListener('click', async () => {
    await requestFullscreen(document.documentElement);
  });
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
      toasts.show('Travel');
      hudRefresh();
    });
  });
}

function renderSettings(root){
  root.innerHTML = `
    <p>Prototype settings.</p>
    <div class="row">
      <button class="btn" id="btnFullscreen">Fullscreen</button>
      <button class="btn" id="btnDebug">Toggle Debug (D)</button>
    </div>
    <div style="height:12px"></div>
    <div class="small">v2 layers: bg.png → mid.svg → hud_shell.png → buttons. Canvas later.</div>
  `;
  root.querySelector('#btnFullscreen').addEventListener('click', async () => await requestFullscreen(document.documentElement));
  root.querySelector('#btnDebug').addEventListener('click', () => {
    state = { ...state, ui:{...state.ui, debug: !state.ui.debug} };
    storage.save(state);
    hudRefresh();
  });
}

updateRotateGate();
hudRefresh();
