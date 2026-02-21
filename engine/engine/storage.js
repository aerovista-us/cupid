export class Storage{
  constructor(key){ this.key = key; }
  load(fallback){
    try{
      const raw = localStorage.getItem(this.key);
      if (!raw) return structuredClone(fallback);
      const v = JSON.parse(raw);
      return { ...structuredClone(fallback), ...v };
    }catch(_){
      return structuredClone(fallback);
    }
  }
  save(state){
    try{ localStorage.setItem(this.key, JSON.stringify(state)); }catch(_){}
  }
  clear(){
    try{ localStorage.removeItem(this.key); }catch(_){}
  }
}
