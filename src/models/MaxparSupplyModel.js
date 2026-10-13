import {travel} from './routes.js';
import {maxparBins,maxparDock,maxparCollectorHome} from './MaxparProgression.js';

export class MaxparSupplyModel{
 constructor(economy){this.economy=economy;this.truck=null;this.nextDelivery=1;this.nextId=0;this.collectors=[];this.dockOwner=null;}
 sync(store){const s=this.economy.state,l=store.layout;while(this.collectors.length<s.maxparCollectors){const i=this.collectors.length;this.collectors.push({...maxparCollectorHome(l,i),id:'maxpar-cl-'+i,index:i,phase:'idle',walk:0,moving:false,reached:true,seated:false});}}
 record(kind,product,units,address){const s=this.economy.state;s.maxparMovements.push({kind,product,units,address,time:Math.floor(s.lifetime)});s.maxparMovements=s.maxparMovements.slice(-30);}
 request(store,sim){
  const s=this.economy.state,l=store.layout,bins=maxparBins(s,l),manifest=s.maxparInTransit.length?s.maxparInTransit.map(p=>({...p})):[],origin={x:-12.5,z:l.street+8};
  if(sim.vehicles().some(v=>Math.hypot(v.x-origin.x,v.z-origin.z)<8))return false;
  if(!manifest.length){
   const products=[...new Set(bins.map(b=>b.product))].sort((a,b)=>(s.maxparMaterials[a]||0)-(s.maxparMaterials[b]||0));
   for(const product of products){if(s.maxparLevel===1&&!['parts','glass','carMirror','paint'].includes(product))continue;const target=bins.filter(b=>b.product===product).length*12,need=Math.min(4,target-(s.maxparMaterials[product]||0));if(need<=0)continue;let count=0;
    const stock=this.economy.warehouseStock(product);for(let i=0;i<stock.length&&count<need;i++)if(stock[i]>0&&!sim.rackOwners.has(i)){const n=Math.min(need-count,stock[i]);stock[i]-=n;count+=n;this.economy.recordMovement('pick',product,n,'CL Autoglass','Expedição Maxpar','Transferência interna');}
    if(count)manifest.push({product,units:count});
   }
   if(!manifest.length)return false;s.maxparInTransit=manifest.map(p=>({...p}));
  }
  this.truck={...origin,origin,id:'freight-maxpar-'+this.nextId++,phase:'companyLoading',facing:Math.PI,timer:4,remaining:manifest.length,manifest,cursor:0,speed:0,isCar:true,halfLength:3.65,halfWidth:1.12};this.economy.emit();return true;
 }
 tick(dt,store,sim){
  this.sync(store);const s=this.economy.state,l=store.layout,dock=maxparDock(l),pace=1+s.maxparSpeed*.16+s.wmsLevel*.04;this.nextDelivery-=dt;
  if(!this.truck&&this.nextDelivery<=0){if(this.request(store,sim))this.nextDelivery=12;else this.nextDelivery=3;}
  const t=this.truck;
  if(t){
   if(t.phase==='companyLoading'){t.timer-=dt*pace;if(t.timer<=0&&!sim.vehicles().some(v=>v!==t&&Math.abs(v.x-t.x)<14&&Math.abs(v.z-l.street)<4)){t.phase='arriving';travel(t,[[t.x,t.z],[t.x,l.lane],[dock.x,l.lane],[dock.x,dock.z]],3.4);}}
   else if(t.phase==='arriving'&&sim.advanceVehicle(t,dt)){t.phase='unloading';t.speed=0;for(const p of t.manifest)this.economy.recordMovement('ship',p.product,p.units,'Expedição Autoglass','Doca Maxpar',t.id);store.configure(sim,true);this.economy.emit();}
   else if(t.phase==='unloading'&&t.remaining===0&&!this.collectors.some(w=>w.units>0)){t.phase='reversing';s.maxparDeliveries++;travel(t,[[t.x,t.z],[t.x,l.street-7]],2.2,true);this.economy.emit();}
   else if(t.phase==='reversing'&&sim.advanceVehicle(t,dt)){t.phase='mergeWait';t.speed=0;}
   else if(t.phase==='mergeWait'){const near=sim.vehicles().some(v=>v!==t&&v.x>t.x-8&&v.x<t.x+12&&Math.abs(v.z-l.lane)<2);if(!near){t.phase='returning';travel(t,[[t.x,t.z],[t.x,l.street+1.5],[t.origin.x,l.street+1.5],[t.origin.x,t.origin.z]],3.4);}}
   else if(t.phase==='returning'&&sim.advanceVehicle(t,dt)){this.truck=null;this.nextDelivery=8;store.configure(sim,true);}
  }
  if(this.dockOwner&&!['toTruck','collecting'].includes(this.dockOwner.phase)&&Math.hypot(this.dockOwner.x-dock.point.x,this.dockOwner.z-dock.point.z)>1.1)this.dockOwner=null;
  for(const w of this.collectors){
   if(w.phase==='idle'&&t?.phase==='unloading'&&t.remaining>0&&!this.dockOwner){const parcel=t.manifest[t.cursor++];t.remaining--;w.product=parcel.product;w.units=parcel.units;this.dockOwner=w;w.phase='toTruck';store.move(w,dock.point,1.35*pace);}
   else if(w.phase==='toTruck'&&w.reached){w.phase='collecting';w.working=true;w.timer=1.5;w.facing=-Math.PI/2;}
   else if(w.phase==='collecting'){w.timer-=dt*pace;if(w.timer<=0){this.record('receive',w.product,w.units,'Doca Maxpar');w.working=false;w.carryingBox=true;w.phase='toScan';store.move(w,{x:l.left+2.1,z:l.clFront-6},1.3*pace);}}
   else if(w.phase==='toScan'&&w.reached){w.phase='scanning';w.scanning=true;w.timer=1.5;}
   else if(w.phase==='scanning'){w.timer-=dt*pace;if(w.timer<=0){w.scanning=false;const bin=maxparBins(s,l).find(b=>b.product===w.product);w.address=bin.id;this.record('scan',w.product,w.units,bin.id);w.phase='toRack';store.move(w,{x:bin.x,z:bin.z+1.15},1.3*pace);}}
   else if(w.phase==='toRack'&&w.reached){w.phase='storing';w.working=true;w.timer=1.3;}
   else if(w.phase==='storing'){w.timer-=dt*pace;if(w.timer<=0){w.working=false;w.carryingBox=false;s.maxparMaterials[w.product]=(s.maxparMaterials[w.product]||0)+w.units;s.maxparReceived+=w.units;const transfer=s.maxparInTransit.findIndex(p=>p.product===w.product&&p.units===w.units);if(transfer>=0)s.maxparInTransit.splice(transfer,1);this.record('putaway',w.product,w.units,w.address);w.units=0;w.phase='returning';store.move(w,maxparCollectorHome(l,w.index),1.4*pace);this.economy.emit();}}
   else if(w.phase==='returning'&&w.reached){w.phase='idle';w.facing=-Math.PI/2;}
  }
 }
}
