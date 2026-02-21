export class Toasts{
  constructor(root){ this.root = root; }
  show(text){
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    this.root.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity 250ms ease'; }, 1400);
    setTimeout(()=>{ el.remove(); }, 1750);
  }
}
