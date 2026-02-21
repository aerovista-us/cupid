/**
 * Cupid PoC — Bootstrap: HUD buttons, initial scene, panel/modal init.
 */
(function () {
  const hudButtons = document.getElementById('hud-buttons');
  const state = getState();

  HUD_BUTTONS.forEach(btn => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hud-btn';
    el.textContent = btn.label;
    el.style.left = (btn.x * 100) + '%';
    el.style.bottom = ((1 - btn.y - btn.h) * 100) + '%';
    el.style.width = (btn.w * 100) + '%';
    el.style.height = (btn.h * 100) + '%';
    el.addEventListener('click', () => togglePanel(btn.open));
    hudButtons.appendChild(el);
  });

  initScene();
  loadScene(state.sceneId || 'location_01');
})();
