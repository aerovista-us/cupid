const SAVE_KEY = 'cupid_proto_v3_editor';

function safeJSON(v){ try{ return JSON.parse(v); }catch(e){ return null; } }
function loadSave(){ try{ return safeJSON(localStorage.getItem(SAVE_KEY)); }catch(e){ return null; } }

function getMood(save){
  if (!save) return 'neutral';
  const stats = save.stats || {};
  const trust = +stats.trust || 0;
  const attraction = +stats.attraction || 0;
  const resentment = +stats.resentment || 0;
  const chaos = +stats.chaos || 0;
  const endingsSeen = +(save.endingsSeen || 0);

  if (endingsSeen >= 3) return 'cosmic';
  if (resentment >= 60) return 'cold';
  if (chaos >= 60) return 'glitch';
  if (trust >= 70 && attraction >= 70) return 'romantic';
  return 'neutral';
}

function setMood(mood){
  const baseImg = document.getElementById('baseImg');
  if (baseImg) {
    baseImg.src = `title/base/${mood}.png`;
    baseImg.onerror = function(){
      this.onerror = null;
      this.style.background = 'linear-gradient(180deg, #1a0a14 0%, #07070a 100%)';
      this.removeAttribute('src');
    };
  }
  const grade = document.getElementById('grade');
  if (grade) grade.className = `layer grade ${mood}`;
}

function boot(){
  const save = loadSave();
  let mood = getMood(save);
  try{
    const qs = new URLSearchParams(location.search);
    const forced = qs.get('mood');
    if (forced) mood = forced;
  }catch(e){}
  setMood(mood);
}

document.addEventListener('DOMContentLoaded', boot);
