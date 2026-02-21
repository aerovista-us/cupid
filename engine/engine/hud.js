export function createHUDButtons(root, defs, onOpenPanel){
  root.innerHTML = '';
  for (const b of defs){
    const el = document.createElement('button');
    el.className = 'hudBtn';
    el.type = 'button';
    el.setAttribute('data-panel', b.panel);
    el.style.left = (b.x*100) + '%';
    el.style.top  = (b.y*100) + '%';
    el.style.width = (b.w*100) + '%';
    el.style.height = (b.h*100) + '%';
    el.innerHTML = `<span class="ico" aria-hidden="true"></span><span class="lbl">${b.label}</span>`;
    el.addEventListener('click', () => onOpenPanel(b.panel));
    root.appendChild(el);
  }
}
