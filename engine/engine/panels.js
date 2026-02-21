export class PanelManager{
  constructor(root){
    this.root = root;
    this.registry = new Map();
    this.instances = new Map();
  }
  register(id, def){ this.registry.set(id, def); }
  anyOpen(){ for (const inst of this.instances.values()) if (inst.open) return true; return false; }
  toggle(id){
    const inst = this.ensure(id);
    if (!inst) return;
    inst.open ? this.close(id) : this.open(id);
  }
  open(id){
    for (const key of this.instances.keys()) if (key !== id) this.close(key);
    const inst = this.ensure(id);
    inst.open = true;
    inst.el.classList.add('open');
    this.render(id);
  }
  close(id){
    const inst = this.instances.get(id);
    if (!inst) return;
    inst.open = false;
    inst.el.classList.remove('open');
  }
  closeAll(){ for (const id of this.instances.keys()) this.close(id); }
  ensure(id){
    if (this.instances.has(id)) return this.instances.get(id);
    const def = this.registry.get(id);
    if (!def) return null;
    const el = document.createElement('div');
    el.className = `panel ${def.pos === 'top' ? 'panelTop' : 'panelBottom'}`;
    el.setAttribute('data-panel', id);
    el.innerHTML = `
      <div class="panelHeader">
        <div class="panelTitle"><span class="dot"></span><span>${def.title}</span></div>
        <button class="panelClose" type="button">Close</button>
      </div>
      <div class="panelBody"></div>
    `;
    el.querySelector('.panelClose').addEventListener('click', () => this.close(id));
    this.root.appendChild(el);
    const inst = { id, def, el, body: el.querySelector('.panelBody'), open:false };
    this.instances.set(id, inst);
    return inst;
  }
  render(id){
    const inst = this.instances.get(id);
    if (!inst) return;
    inst.def.render(inst.body);
  }
  refreshOpenPanels(){ for (const [id, inst] of this.instances) if (inst.open) this.render(id); }
}
