export function qs(sel){ return document.querySelector(sel); }
export async function loadJSON(url){
  const res = await fetch(url, { cache:'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return await res.json();
}
export async function saveDownload(filename, text){
  const blob = new Blob([text], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 800);
}
export function clamp01(n){ return Math.max(0, Math.min(1, n)); }
export function isPortrait(){
  const mm = window.matchMedia && window.matchMedia('(orientation: portrait)');
  if (mm && typeof mm.matches === 'boolean') return mm.matches;
  return window.innerHeight > window.innerWidth;
}
/** True when viewport is phone-sized (enforce landscape gate only on phones). */
export function isPhoneSized(){
  return typeof window !== 'undefined' && window.innerWidth < 768;
}
export async function requestFullscreen(el){
  try{ if (document.fullscreenElement) return; if (el.requestFullscreen) await el.requestFullscreen(); }catch(_){}
}
export function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");
}
