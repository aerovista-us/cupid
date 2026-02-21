/**
 * Cupid PoC — Load scene (background + hotspots), handle hotspot click → modal → apply choice.
 */
const sceneBg = document.getElementById('scene-bg');
const hotspotsLayer = document.getElementById('hotspots-layer');
const modalOverlay = document.getElementById('modal-overlay');
const modalPrompt = document.getElementById('modal-prompt');
const modalChoices = document.getElementById('modal-choices');
const modalClose = document.getElementById('modal-close');

let currentHotspotId = null;

function loadScene(sceneId) {
  const scene = SCENES[sceneId];
  if (!scene) return;
  sceneBg.style.backgroundImage = `url(${scene.image})`;
  setState(s => ({ ...s, sceneId }));

  hotspotsLayer.innerHTML = '';
  scene.hotspots.forEach(h => {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.dataset.hotspotId = h.id;
    el.style.left = (h.x * 100) + '%';
    el.style.top = (h.y * 100) + '%';
    el.style.width = (h.w * 100) + '%';
    el.style.height = (h.h * 100) + '%';
    const label = document.createElement('span');
    label.className = 'hotspot-label';
    label.textContent = h.label;
    el.appendChild(label);
    el.addEventListener('click', () => onHotspotClick(h.id));
    hotspotsLayer.appendChild(el);
  });
}

function onHotspotClick(hotspotId) {
  if (getState().ui.openPanel) return;
  const choiceSet = HOTSPOT_CHOICES[hotspotId];
  if (!choiceSet) return;
  currentHotspotId = hotspotId;
  modalPrompt.textContent = choiceSet.prompt;
  modalChoices.innerHTML = '';
  choiceSet.choices.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => applyChoice(choiceSet.choices[i]));
    modalChoices.appendChild(btn);
  });
  modalOverlay.hidden = false;
  modalOverlay.classList.add('is-open');
}

function applyChoice(opt) {
  const state = getState();
  if (opt.trust) addStatChange(state, 'trust', opt.trust, opt.text);
  if (opt.attraction) addStatChange(state, 'attraction', opt.attraction, opt.text);
  if (opt.resentment) addStatChange(state, 'resentment', opt.resentment, opt.text);
  if (opt.chaos) addStatChange(state, 'chaos', opt.chaos, opt.text);
  appendLog(state, opt.log || opt.text, 'choice');
  setState(s => ({ ...s }));

  closeModal();
  currentHotspotId = null;
  if (getState().ui.openPanel === 'stats') {
    closePanel();
    openPanel('stats');
  }
  if (getState().ui.openPanel === 'log') {
    closePanel();
    openPanel('log');
  }
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  modalOverlay.hidden = true;
  currentHotspotId = null;
}

function initScene() {
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
}
