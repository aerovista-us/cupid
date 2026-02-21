export function qs(sel){ return document.querySelector(sel); }
export async function loadJSON(url){
  const res = await fetch(url, { cache:'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return await res.json();
}
export function clamp01(n){ return Math.max(0, Math.min(1, n)); }
export function isPortrait(){
  const mm = window.matchMedia && window.matchMedia('(orientation: portrait)');
  if (mm && typeof mm.matches === 'boolean') return mm.matches;
  return window.innerHeight > window.innerWidth;
}
export async function requestFullscreen(el){
  try{
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) await el.requestFullscreen();
  }catch(_){}
}
