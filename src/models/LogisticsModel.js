import {activeStaff} from './Workforce.js';
import {travel} from './routes.js';
import {getAddresses,rackPoint,scanStation,collectorHome,docks,cityRoads,roadExit,factoryPickup} from './ShopLayout.js';
import {availableProducts} from './Products.js';

export class LogisticsModel{
 constructor(economy){this.economy=economy;this.workers=[];this.trucks=[];this.nextDelivery=2;this.deliveryId=0;this.dockOwners=new Map();this.received=0;this.accessOwner=null;this.signature='';this.time=0;}
 get truck(){return this.trucks[0]||null;}
 enabled(){return this.economy.state.garageLevel>=2;}
 dockSlots(){return this.economy.state.garageLevel>=7?3:1;}
 dockSlot(truck){return Array.from({length:this.dockSlots()},(_,i)=>i).find(i=>!this.dockOwners.has(`${truck.dock}:${i}`));}
 collectionPoint(worker){const p=docks(this.economy.state)[worker.dock].point;return {...p,z:p.z+(this.dockSlots()===1?0:(worker.dockSlot-1)*1.05)};}
 sync(sim){
  if(!this.enabled())return;const s=this.economy.state,signature=`${s.garageLevel}:${s.warehouseExpansion}`;
  if(this.signature&&signature!==this.signature&&sim)for(const w of this.workers)if(w.phase==='idle'){w.phase='returning';sim.move(w,collectorHome(s,w.index),1.2);}
  while(this.workers.length<activeStaff(s,'logistics')){const index=this.workers.length,p=collectorHome(s,index);if(sim?.people().some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.95))break;this.workers.push({...p,id:`cl-${index}`,index,phase:'idle',seated:true,moving:false,walk:0,carryingBox:false,scanning:false,reached:true});}this.signature=signature;
 }
 freeAddress(sim){const candidates=getAddresses(this.economy.state).map((a,i)=>({i,total:this.economy.addressTotal(i)})).filter(a=>a.total+4<=12&&!this.workers.some(w=>w.address===a.i)&&!sim.rackOwners.has(a.i));candidates.sort((a,b)=>a.total-b.total||a.i-b.i);return candidates[0]?.i??-1;}
 accessStopLine(){return cityRoads(this.economy.state).xs[0]-11;}
 spawnTruck(dock){
  const s=this.economy.state,lane=cityRoads(s).zs[1]+1.5,id=this.deliveryId++,keys=availableProducts(s),projection=Object.fromEntries(keys.map(k=>[k,this.economy.stock(k)+this.economy.warehouseTotal(k)]));
  let reserved=0;
  for(const truck of this.trucks)for(const parcel of truck.manifest.slice(truck.cursor)){reserved+=parcel.units;projection[parcel.product]+=parcel.units;}
  for(const worker of this.workers)if(worker.units){reserved+=worker.units;projection[worker.product]+=worker.units;}
  const capacity=getAddresses(s).length*12-this.economy.warehouseTotal()-reserved,manifest=[];
  for(let i=0;i<Math.min(8,Math.floor(capacity/4));i++){const product=[...keys].sort((a,b)=>projection[a]-projection[b])[0];projection[product]+=4;manifest.push({product,units:4});}if(!manifest.length)return false;
  // The waiting line is before the crossing. A waiting trailer cannot block the alley exit.
  const t={id:`delivery-${id}`,sequence:id,dock:dock.index,lane,x:-58,z:lane,facing:Math.PI/2,isCar:true,halfLength:3.65,halfWidth:1.12,phase:'queued',atGate:false,remaining:manifest.length,manifest,cursor:0,speed:0};
  travel(t,[[-58,lane],[this.accessStopLine(),lane]],2.9);this.trucks.push(t);return true;
 }
 releaseAccess(){
  const owner=this.accessOwner;
  if(owner&&(!this.trucks.includes(owner)||owner.phase==='unloading'||owner.phase==='gone'||owner.phase==='leaving'&&owner.x>-12))this.accessOwner=null;
 }
 accessAllowed(truck){
  this.releaseAccess();
  if(!this.accessOwner){
   const candidates=this.trucks.filter(t=>t.phase==='departing'||t.phase==='reversing'||t.phase==='queued'&&t.atGate);
   candidates.sort((a,b)=>(a.phase==='queued'?1:0)-(b.phase==='queued'?1:0)||(a.accessRequestedAt??0)-(b.accessRequestedAt??0)||a.sequence-b.sequence);
   this.accessOwner=candidates[0]||null;
  }
  return this.accessOwner===truck;
 }
 startApproach(truck){
  const dock=docks(this.economy.state)[truck.dock];if(!dock)return false;
  truck.phase='arriving';truck.waitReason=null;truck.atGate=false;
  // The last bend parks the cab facing the road, so departure continues forwards.
  travel(truck,[[truck.x,truck.z],[-18.5,truck.lane],[-18.5,dock.z+2.5],[-14.3,dock.z+2.5],[-14.3,dock.z]],2.9);return true;
 }
 beginDeparture(truck,sim){
  truck.phase='departing';truck.accessRequestedAt=this.time;truck.waitReason=null;
  travel(truck,[[truck.x,truck.z],[truck.x,truck.z-2.8],[-18.5,truck.z-2.8],[-18.5,truck.lane],[-12,truck.lane]],2.4);sim.configureNavigation();
 }
 assignParcel(worker,sim,p){
  const s=this.economy.state;
  if(s.garageLevel>=14&&this.economy.factoryTotal()>=4&&!sim.campus.outputOwner&&(worker.lastSource!=='factory'||!this.trucks.some(t=>t.phase==='unloading'&&t.remaining>0&&this.dockSlot(t)!==undefined))){
   const address=this.freeAddress(sim);if(address>=0&&sim.claimRack(address,worker)){sim.campus.outputOwner=worker;worker.lastSource='factory';worker.address=address;worker.product=availableProducts(s).filter(k=>this.economy.factoryStock(k)>=4).sort((a,b)=>(this.economy.stock(a)+this.economy.warehouseTotal(a))-(this.economy.stock(b)+this.economy.warehouseTotal(b)))[0];if(!worker.product){sim.campus.outputOwner=null;sim.rackOwners.delete(address);return false;}worker.units=4;worker.truckId=null;worker.phase='toFactory';this.economy.addFactoryStock(worker.product,-4);s.factoryTransfers.push({worker:worker.id,product:worker.product,units:4});sim.move(worker,factoryPickup(s),1.2*p);this.economy.emit();return true;}
  }
  const truck=this.trucks.find(t=>t.phase==='unloading'&&t.remaining>0&&this.dockSlot(t)!==undefined);if(!truck)return false;
  const address=this.freeAddress(sim);if(address<0||!sim.claimRack(address,worker))return false;
  const parcel=truck.manifest[truck.cursor++];if(!parcel)return false;
  worker.lastSource='truck';worker.address=address;worker.product=parcel.product;worker.units=parcel.units;worker.truckId=truck.id;worker.dock=truck.dock;worker.dockSlot=this.dockSlot(truck);worker.phase='toTruck';this.dockOwners.set(`${truck.dock}:${worker.dockSlot}`,worker);truck.remaining--;sim.move(worker,this.collectionPoint(worker),1.1*p);return true;
 }
 tick(dt,sim){
  if(!this.enabled())return;this.time+=dt;this.sync(sim);const s=this.economy.state,lane=cityRoads(s).zs[1]+1.5,p=(1+s.logisticsProductivity*.3+s.officeComputers*.04+s.automation*.12+s.wmsLevel*.08)*this.economy.trainingBonus()*this.economy.teamEfficiency('logistics');this.nextDelivery-=dt;this.releaseAccess();
  const output=sim.campus.outputOwner;if(output&&!['toFactory','collectFactory'].includes(output.phase)&&Math.hypot(output.x-factoryPickup(s).x,output.z-factoryPickup(s).z)>1.35)sim.campus.outputOwner=null;
  const safe=!this.trucks.some(t=>t.phase!=='unloading')&&!sim.cars.some(c=>['arriving','reversing'].includes(c.phase))&&!sim.orders.couriers.some(c=>['arriving','reversing'].includes(c.phase)),footprintSafe=!sim.orders.couriers.some(c=>c.phase!=='gone'&&c.x<roadExit(s)-10);if(this.economy.constructionSafe!==safe||this.economy.footprintSafe!==footprintSafe){this.economy.constructionSafe=safe;this.economy.footprintSafe=footprintSafe;this.economy.emit();}
  const free=docks(s).find(d=>!this.trucks.some(t=>t.dock===d.index)),approaching=this.trucks.some(t=>t.phase==='queued'||t.phase==='arriving');
  // One incoming delivery at a time keeps the public road clear; docks unload concurrently.
  if(free&&!approaching&&this.nextDelivery<=0&&this.freeAddress(sim)>=0&&this.economy.warehouseTotal()<getAddresses(s).length*10&&!sim.vehicles().some(v=>Math.hypot(v.x+58,v.z-lane)<7)){if(this.spawnTruck(free))this.nextDelivery=6;}
  for(const truck of this.trucks){
   if(truck.phase==='unloading')truck.lane=lane;
   if(truck.phase==='queued'){
    if(!truck.atGate){if(sim.advanceVehicle(truck,dt)){truck.atGate=true;truck.accessRequestedAt=this.time;truck.waitReason='aguardando doca';}continue;}
    if(this.accessAllowed(truck))this.startApproach(truck);else{truck.speed=0;truck.moving=false;truck.waitReason='aguardando doca';}
    continue;
   }
   if(['arriving','reversing','departing'].includes(truck.phase)&&!this.accessAllowed(truck)){truck.speed=0;truck.moving=false;truck.waitReason='acesso à doca';continue;}
   if(truck.phase==='arriving'&&sim.advanceVehicle(truck,dt)){truck.phase='unloading';truck.speed=0;truck.unloadingAt=this.time;truck.waitReason=null;this.releaseAccess();sim.configureNavigation();}
   if(truck.phase==='reversing'&&sim.advanceVehicle(truck,dt))this.beginDeparture(truck,sim);
   if(truck.phase==='departing'&&sim.advanceVehicle(truck,dt)){truck.phase='leaving';travel(truck,[[truck.x,truck.z],[roadExit(s),truck.lane]],3.4);this.releaseAccess();}
   if(truck.phase==='leaving'&&sim.advanceVehicle(truck,dt)){truck.phase='gone';this.releaseAccess();sim.configureNavigation();}
  }
  for(const [id,w] of this.dockOwners){const dock=docks(s)[w.dock];if(!dock||!this.workers.includes(w)||!['toTruck','collecting'].includes(w.phase)&&Math.hypot(w.x-this.collectionPoint(w).x,w.z-this.collectionPoint(w).z)>1.1)this.dockOwners.delete(id);}
  for(const worker of this.workers){if(worker.offDuty||worker.commuting)continue;
   if(worker.phase==='idle'||worker.phase==='available'){
    if(this.assignParcel(worker,sim,p))continue;
    if(s.wmsLevel>0&&this.time>(this.nextAudit||35)&&this.workers.filter(w=>['toAudit','auditing'].includes(w.phase)).length<(s.garageLevel>=7?6:1)){
      const count=getAddresses(s).length,start=(this.auditCursor||0)%count,address=Array.from({length:count},(_,i)=>(start+i)%count).find(i=>this.economy.addressTotal(i)>0&&!sim.rackOwners.has(i));
      if(address!==undefined&&sim.claimRack(address,worker)){this.auditCursor=address+1;worker.address=address;worker.phase='toAudit';this.nextAudit=this.time+(s.garageLevel>=7?3:40/(1+s.wmsLevel*.2));sim.move(worker,rackPoint(address),1.15*p);continue;}
    }
    if(worker.phase==='available'){worker.phase='returning';sim.move(worker,collectorHome(s,worker.index),1.15*p);}
   }else if(worker.phase==='toTruck'&&worker.reached){worker.phase='collecting';worker.timer=1.6;worker.working=true;worker.facing=-Math.PI/2;}
   else if(worker.phase==='toFactory'&&worker.reached){worker.phase='collectFactory';worker.timer=1.6;worker.working=true;worker.facing=Math.PI/2;}
   else if(['collecting','collectFactory'].includes(worker.phase)){worker.timer-=dt*p;if(worker.timer<=0){this.economy.recordMovement('receive',worker.product,worker.units,worker.lastSource==='factory'?'Fábrica':'Doca '+(worker.dock+1),'Conferência',worker.truckId||'Produção própria');worker.working=false;worker.carryingBox=true;worker.phase='toScan';sim.move(worker,scanStation(s,worker.index),1.05*p);}}
   else if(worker.phase==='toScan'&&worker.reached){worker.phase='scanning';worker.scanning=true;worker.facing=Math.PI;worker.timer=1.8;}
   else if(worker.phase==='scanning'){worker.timer-=dt*p;if(worker.timer<=0){this.economy.recordMovement('scan',worker.product,worker.units,'Conferência',getAddresses(s)[worker.address].id,worker.id);worker.scanning=false;worker.phase='toRack';sim.move(worker,rackPoint(worker.address),1.05*p);}}
   else if(worker.phase==='toRack'&&worker.reached){worker.phase='storing';worker.working=true;worker.facing=Math.PI;worker.timer=1.6;}
   else if(worker.phase==='storing'){worker.timer-=dt*p;if(worker.timer<=0){this.economy.warehouseStock(worker.product)[worker.address]+=worker.units;this.received+=worker.units;this.economy.recordMovement('putaway',worker.product,worker.units,'Conferência',getAddresses(s)[worker.address].id,worker.id);s.factoryTransfers=s.factoryTransfers.filter(t=>t.worker!==worker.id);worker.carryingBox=false;worker.working=false;worker.phase='available';worker.units=0;worker.address=null;worker.truckId=null;this.economy.emit();}}
   else if(worker.phase==='toAudit'&&worker.reached){worker.phase='auditing';worker.scanning=true;worker.timer=3;worker.facing=Math.PI;}
   else if(worker.phase==='auditing'){worker.timer-=dt*p;if(worker.timer<=0){s.wmsAudits++;worker.scanning=false;worker.phase='returning';worker.address=null;sim.move(worker,collectorHome(s,worker.index),1.15*p);this.economy.emit();}}
   else if(worker.phase==='returning'&&worker.reached){worker.phase='idle';worker.seated=true;worker.facing=-Math.PI/2;}
  }
  for(const truck of this.trucks)if(truck.phase==='unloading'&&truck.remaining===0&&!this.workers.some(w=>w.truckId===truck.id))this.beginDeparture(truck,sim);
  this.trucks=this.trucks.filter(t=>t.phase!=='gone');this.releaseAccess();
 }
 status(){if(!this.enabled())return '';if(!this.trucks.length)return 'Reposição programada';const unloading=this.trucks.filter(t=>t.phase==='unloading').length;return unloading?`${unloading}/${docks(this.economy.state).length} docas recebendo`:`${this.trucks.length} ${this.trucks.length>1?'caminhões':'caminhão'} a caminho`;}
}
