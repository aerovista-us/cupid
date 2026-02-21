/**
 * Cupid PoC — PanelManager: open/close/toggle panels; slide-in from right.
 */
const panelRoot = document.getElementById('panel-root');

const STAT_LABELS = {
  trust: 'Trust',
  attraction: 'Attraction',
  resentment: 'Resentment',
  chaos: 'Chaos'
};

const STAT_CLASS = {
  trust: 'trust',
  attraction: 'attraction',
  resentment: 'resentment',
  chaos: 'chaos'
};

function openPanel(panelId) {
  const state = getState();
  if (state.ui.openPanel === panelId) {
    closePanel();
    return;
  }
  setState(s => ({ ...s, ui: { ...s.ui, openPanel: panelId } }));
  renderPanel(panelId);
  document.body.classList.add('panel-open');
}

function closePanel() {
  setState(s => ({ ...s, ui: { ...s.ui, openPanel: null } }));
  panelRoot.innerHTML = '';
  document.body.classList.remove('panel-open');
}

function togglePanel(panelId) {
  if (getState().ui.openPanel === panelId) closePanel();
  else openPanel(panelId);
}

function renderPanel(panelId) {
  panelRoot.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel is-open';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', panelId);

  const header = document.createElement('div');
  header.className = 'panel-header';
  const title = document.createElement('h2');
  title.textContent = getPanelTitle(panelId);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'panel-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closePanel);
  header.append(title, closeBtn);

  const body = document.createElement('div');
  body.className = 'panel-body';
  body.innerHTML = getPanelContent(panelId);

  panel.append(header, body);
  panelRoot.appendChild(panel);

  if (panelId === 'map') {
    panelRoot.querySelectorAll('.map-list li[data-location]').forEach(li => {
      const id = li.getAttribute('data-location');
      if (!id || li.classList.contains('locked')) return;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        loadScene(id);
        closePanel();
      });
    });
  }
}

function getPanelTitle(panelId) {
  const titles = { stats: 'Stats', log: 'Log', map: 'Map', missions: 'Missions', inventory: 'Inventory' };
  return titles[panelId] || panelId;
}

function getPanelContent(panelId) {
  const state = getState();
  switch (panelId) {
    case 'stats':
      return renderStatsContent(state);
    case 'log':
      return renderLogContent(state);
    case 'map':
      return renderMapContent(state);
    case 'missions':
      return '<p class="panel-stub">Missions panel — coming soon.</p>';
    case 'inventory':
      return '<p class="panel-stub">Inventory panel — coming soon.</p>';
    default:
      return '<p>Unknown panel.</p>';
  }
}

function renderStatsContent(state) {
  const rows = ['trust', 'attraction', 'resentment', 'chaos'].map(key => {
    const v = state.stats[key];
    const cls = STAT_CLASS[key];
    return `
      <div class="stat-row">
        <span class="stat-name">${STAT_LABELS[key]}</span>
        <div class="stat-bar-wrap"><div class="stat-bar ${cls}" style="width:${v}%"></div></div>
        <span class="stat-value">${v}</span>
      </div>`;
  }).join('');
  const changes = state.lastStatChanges.slice(0, 5).map(c => {
    const sign = c.delta >= 0 ? '+' : '';
    return `<li>${sign}${c.delta} ${STAT_LABELS[c.stat]} — ${c.reason || 'choice'}</li>`;
  }).join('') || '<li>No recent changes</li>';
  return `${rows}<div class="stat-changes"><strong>Recent</strong><ul>${changes}</ul></div>`;
}

function renderLogContent(state) {
  const items = state.log.map(entry => {
    const time = new Date(entry.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<li><span class="log-time">${time}</span><br>${escapeHtml(entry.message)}</li>`;
  }).join('') || '<li>No entries yet.</li>';
  return `<ul class="log-list">${items}</ul>`;
}

function renderMapContent(state) {
  const items = LOCATIONS_LIST.map(loc => {
    const unlocked = state.unlockedLocations.includes(loc.id);
    const current = state.sceneId === loc.id;
    const cls = [current && 'current', !unlocked && 'locked'].filter(Boolean).join(' ');
    const name = unlocked ? loc.name : '???';
    return `<li class="${cls}" data-location="${loc.id}">${name} <span>${loc.mood}</span></li>`;
  }).join('');
  return `<ul class="map-list">${items}</ul>`;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
