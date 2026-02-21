import { escapeHtml } from './util.js';
export class Modal{
  constructor(root){ this.root = root; this._open = false; }
  isOpen(){ return this._open; }
  open({ title, body, choices }){
    this._open = true;
    this.root.classList.add('modalOpen');
    this.root.innerHTML = `
      <div class="modalBackdrop" data-close="1"></div>
      <div class="modalCard" role="dialog" aria-modal="true" aria-label="${escapeHtml(title||'Dialog')}">
        <div class="panelTitle" style="margin-bottom:10px"><span class="dot"></span><span>${escapeHtml(title||'')}</span></div>
        <div class="small">${body || ''}</div>
        <div class="choiceList">
          ${(choices||[]).map((c,i)=>`<button class="choiceBtn" data-idx="${i}">${escapeHtml(c.text)}</button>`).join('')}
        </div>
      </div>
    `;
    this.root.querySelector('[data-close="1"]').addEventListener('click', () => this.close());
    this.root.querySelectorAll('.choiceBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const choice = choices?.[idx];
        if (choice?.onPick) choice.onPick();
        if (choice?.action === 'close' || !choice?.action) this.close();
      });
    });
  }
  close(){ this._open = false; this.root.classList.remove('modalOpen'); this.root.innerHTML = ''; }
}
