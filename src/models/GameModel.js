const SAVE_KEY = 'autoglass-idle-save-v1';
const SETTINGS_KEY = 'autoglass-idle-settings';
export const LIMITS = { worker:4, garage:3, productivity:6, cashier:3, logistics:4 };
const fields = { worker:'workers', garage:'garageLevel', productivity:'productivity', cashier:'cashiers', logistics:'logisticsWorkers' };
const freshState = () => ({ cash:0, totalEarned:0, customers:0, workers:1, bays:1, garageLevel:1, productivity:0, cashiers:1, logisticsWorkers:0, frontStock:8, warehouseStocks:[0,0,0,0,0,0], lifetime:0 });

export class GameModel {
  constructor({storage=globalThis.localStorage}={}) {
    this.state=freshState(); this.settings={shadows:true}; this.listeners=new Set();
    this.paused=true; this.started=false; this.storage=storage; this.load();
  }
  load() {
    try {
      const saved=JSON.parse(this.storage?.getItem(SAVE_KEY)||'{}');
      for(const field of Object.keys(this.state))if(typeof this.state[field]==='number'&&Number.isFinite(saved[field])&&saved[field]>=0)this.state[field]=saved[field];
      // Existing expanded saves keep their staff and move to the four-bay store.
      if(this.state.bays>1||this.state.workers>1)this.state.garageLevel=Math.max(2,this.state.garageLevel);
      for(const [kind,field] of Object.entries(fields))this.state[field]=Math.max(['productivity','logistics'].includes(kind)?0:1,Math.min(LIMITS[kind],Math.floor(this.state[field])));
      const s=this.state;s.bays=s.garageLevel===1?1:4;
      if(s.garageLevel===1){s.workers=1;s.cashiers=1;s.logisticsWorkers=0;}
      else s.cashiers=Math.max(2,s.cashiers);
      s.logisticsWorkers=s.garageLevel===3?Math.max(2,s.logisticsWorkers):0;
      s.frontStock=Math.min(this.frontCapacity(),Math.floor(s.frontStock));
      if(Array.isArray(saved.warehouseStocks)&&saved.warehouseStocks.length===6)s.warehouseStocks=saved.warehouseStocks.map(n=>Number.isFinite(n)?Math.max(0,Math.min(12,Math.floor(n))):0);
      this.settings={...this.settings,...JSON.parse(this.storage?.getItem(SETTINGS_KEY)||'{}')};
    } catch { /* Keep a playable default when storage is unavailable. */ }
  }
  save(){try{this.storage?.setItem(SAVE_KEY,JSON.stringify(this.state));}catch{}}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  emit(){this.save();for(const listener of this.listeners)listener(this.state);}
  tick(dt){if(this.paused||!this.started)return 0;this.state.lifetime+=dt;return dt;}
  sale(amount){this.state.cash+=amount;this.state.totalEarned+=amount;this.state.customers++;this.emit();}
  frontCapacity(){return this.state.garageLevel===1?8:12;}
  warehouseTotal(){return this.state.warehouseStocks.reduce((a,b)=>a+b,0);}
  price(kind){const s=this.state;return kind==='garage'?(s.garageLevel===1?450:1600):kind==='productivity'?Math.floor(85*1.6**s.productivity):kind==='worker'?Math.floor(95*1.72**(s.workers-1)):kind==='cashier'?380:kind==='logistics'?Math.floor(420*1.7**(s.logisticsWorkers-2)):Infinity;}
  unlocked(kind){return kind==='worker'||kind==='cashier'?this.state.garageLevel>=2:kind==='logistics'?this.state.garageLevel===3:!!fields[kind];}
  maxed(kind){return !!fields[kind]&&this.state[fields[kind]]>=LIMITS[kind];}
  buy(kind){
    if(!this.unlocked(kind)||this.maxed(kind)||this.state.cash<this.price(kind))return false;
    const s=this.state;s.cash-=this.price(kind);s[fields[kind]]++;
    if(kind==='garage'){
      s.bays=4;s.cashiers=Math.max(2,s.cashiers);s.frontStock=Math.max(s.frontStock,12);
      if(s.garageLevel===3)s.logisticsWorkers=Math.max(2,s.logisticsWorkers);
    }
    this.emit();return true;
  }
  setShadows(enabled){this.settings.shadows=enabled;try{this.storage?.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}this.emit();}
  reset(){this.state=freshState();this.emit();}
}
