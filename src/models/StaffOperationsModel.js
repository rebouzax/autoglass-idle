import {StaffAmenities} from './StaffAmenities.js';
import {STAFF_ROLES,activeStaff,staffTotal,workforceStations} from './Workforce.js';
import {shopLayout,workerSeat,deskX,collectorHome,officeDesk,itDesk,factoryStation,academySeat,academyTeacher} from './ShopLayout.js';
import {availableProducts} from './Products.js';
import {travel,sampleRoute} from './routes.js';
import {vehicleBounds,pedestrianCollisionBlocks} from './CityTrafficModel.js';

const busy=a=>a&&a.goal&&!a.reached;
export class StaffOperationsModel {
 constructor(economy){this.economy=economy;this.records=[];this.sequence=0;this.signature='';this.completed={};this.facilityOwners=new Map();this.amenities=new StaffAmenities(this);}
 actors(sim,role){return {worker:sim.workers,cashier:sim.cashiers,logistics:sim.logistics.workers,salesWorker:sim.office.workers,itWorker:sim.it.workers,factoryWorker:sim.campus.operators}[role]||[];}
 activeHome(s,role,i){return role==='worker'?workerSeat(i):role==='cashier'?{x:deskX(i),z:-8.2}:role==='logistics'?collectorHome(s,i):role==='salesWorker'?officeDesk(s,i):role==='itWorker'?itDesk(s,i):factoryStation(s,i,0);}
 sync(sim){
  const s=this.economy.state,l=shopLayout(s),signature=[s.garageLevel,s.bays,...STAFF_ROLES.map(r=>s[r.field]),s.officeComputers,s.itComputers,s.productionLines,s.storeExpansion,s.warehouseExpansion,s.trainingLevel].join(':');
  const changed=signature!==this.signature;
  if(!changed){for(const r of this.records)if(r.role!=='education'&&!r.support)r.actor=this.actors(sim,r.role)[r.index];return;}
  this.facilityOwners.clear();this.amenities.sync(l);
  const stations=l.workforce?workforceStations(s,l):[],byKey=new Map(stations.map(c=>[c.role+':'+(c.index+activeStaff(s,c.role)),c])),existing=new Map(this.records.map(r=>[r.id,r]));
  for(const role of STAFF_ROLES)for(let i=0;i<(s[role.field]||0);i++){
   const key=role.key+':'+i,actor=this.actors(sim,role.key)[i],station=byKey.get(key),home=station||this.activeHome(s,role.key,i);
   let r=existing.get(key);
   if(!r){const n=this.sequence++;r={id:key,role:role.key,index:i,number:n,color:role.color,phase:'working',atWork:true,external:false,x:home.x,z:home.z,y:home.y||0,walk:0,facing:Math.PI,timer:4+n%17,task:'idle',reached:true};this.records.push(r);}
   if(r.support&&!station){const order=s.orders.find(o=>o.id===r.orderId&&o.workerId===r.id);if(order){order.workerId=null;order.phase=order.collected>=order.quantity?'queued':order.phase;}const invoice=s.teamInvoices.find(a=>a.id===r.invoiceId&&a.owner===r.id);if(invoice)invoice.owner=null;r.orderId=null;r.invoiceId=null;}
   r.actor=i<activeStaff(s,role.key)?actor:null;r.support=!!station;r.station=station;r.work={...home};r.atWork=true;
   // Upgrades may move a department. Finish reserved work from its new workstation.
   r.amenity=null;r.activityStation=null;r.breakKind=null;r.phase='working';r.external=false;r.path=null;r.moving=false;r.wait=0;
   if(r.support){r.x=home.x;r.z=home.z;r.y=home.y||0;r.reached=true;r.task=r.orderId||r.invoiceId?'processing':'idle';r.timer=3+r.number%17;}
   if(r.actor){r.actor.offDuty=false;r.actor.commuting=false;}
  }
  for(const a of [...sim.campus.students,...(sim.campus.teacher?[sim.campus.teacher]:[])]){
   const id='education:'+a.id,work=a===sim.campus.teacher?academyTeacher(s):academySeat(s,a.index);let r=existing.get(id);
   if(!r){r={id,role:'education',index:a.index||0,number:this.sequence++,color:'#d69b49',phase:'working',atWork:true,external:false,x:work.x,z:work.z,y:0,walk:0,task:'idle',reached:true};this.records.push(r);}r.actor=a;r.work=work;a.offDuty=false;a.commuting=false;
  }
  this.signature=signature;
 }
 ready(r,sim){if(r.orderId||r.invoiceId)return false;if(!r.actor)return !r.path&&!['processing','invoice','packing','picking'].includes(r.task);const a=r.actor;if(busy(a))return false;if(r.role==='worker'||r.role==='cashier')return !sim.cars.some(c=>c.phase!=='gone')&&(r.role==='cashier'||a.phase==='idle');if(r.role==='logistics')return ['idle','available'].includes(a.phase);if(r.role==='salesWorker')return ['typing','calling','returning'].includes(a.phase)&&!sim.office.meeting;return true;}
 setPath(r,points,speed=2.25){travel(r,points,speed);r.reached=false;r.moving=false;}
 near(index,r,radius=1){const out=[];for(let x=Math.floor((r.x-radius)/3);x<=Math.floor((r.x+radius)/3);x++)for(let z=Math.floor((r.z-radius)/3);z<=Math.floor((r.z+radius)/3);z++)for(const a of index.get(`${x}:${z}`)||[])if(a!==r)out.push(a);return out;}
 put(index,r){const key=`${Math.floor(r.x/3)}:${Math.floor(r.z/3)}`;index.get(r.bucket)?.delete(r);if(!index.has(key))index.set(key,new Set());index.get(key).add(r);r.bucket=key;}
 nearbyVehicles(r){const out=new Set();for(let x=Math.floor((r.x-1)/12);x<=Math.floor((r.x+1)/12);x++)for(let z=Math.floor((r.z-1)/12);z<=Math.floor((r.z+1)/12);z++)for(const v of this.externalVehicleIndex.get(x+':'+z)||[])out.add(v);return [...out];}
 moveExternal(r,dt,index,sim){
  if(!r.path)return true;const path=r.path,samples=path.samples,last=samples.at(-1);
  if(Math.hypot(r.x-last.x,r.z-last.z)<.06){r.x=last.x;r.z=last.z;r.path=null;r.speed=0;r.moving=false;this.put(index,r);return true;}
  // Follow route progress continuously; avoidance must never snap a person back onto the path.
  let nearest=Infinity,progress=r.distance||0;const limit=Math.min(path.length,progress+4);
  for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if(b.distance<progress-.05||a.distance>limit)continue;const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((r.x-a.x)*dx+(r.z-a.z)*dz)/Math.max(.000001,length))),distance=a.distance+(b.distance-a.distance)*t;if(distance<progress-.05||distance>limit)continue;const error=Math.hypot(r.x-a.x-dx*t,r.z-a.z-dz*t);if(error<nearest){nearest=error;progress=Math.max(r.distance||0,distance);}}
  r.distance=progress;const target=sampleRoute(path,Math.min(path.length,progress+.8)),heading=Math.atan2(target.z-r.z,target.x-r.x),step=Math.min(r.baseSpeed||2.25,2.8)*dt,neighbors=this.near(index,r,2),vehicles=(r.y||0)<1?this.nearbyVehicles(r):[];
  const favored=1,angles=[0,favored*.35,-favored*.35,favored*.7,-favored*.7,favored*1.1,-favored*1.1,favored*1.55,-favored*1.55];if(r.wait>1.2)angles.push(favored*2.2,-favored*2.2,Math.PI);
  let chosen=null,best=Infinity;
  for(const angle of angles){const p={x:r.x+Math.cos(heading+angle)*step,z:r.z+Math.sin(heading+angle)*step};let blocked=false,penalty=0;
   for(const a of neighbors){if(!a.visible||Math.abs((a.y||0)-(r.y||0))>=1)continue;const before=Math.hypot(a.x-r.x,a.z-r.z),after=Math.hypot(a.x-p.x,a.z-p.z),dx=p.x-r.x,dz=p.z-r.z,t=Math.max(0,Math.min(1,((a.x-r.x)*dx+(a.z-r.z)*dz)/(step*step))),clearance=Math.hypot(a.x-r.x-t*dx,a.z-r.z-t*dz);if(clearance<Math.min(before,.69)-.00001||before<.69&&after<=before+.00001){blocked=true;break;}penalty+=Math.max(0,1.2-after)*.12;}
   if(blocked||vehicles.some(v=>pedestrianCollisionBlocks(r,p,v,.31)))continue;
   const score=Math.hypot(p.x-target.x,p.z-target.z)+penalty+Math.abs(angle)*.001;if(score<best){best=score;chosen=p;}
  }
  if(!chosen){r.wait=(r.wait||0)+dt;r.speed=0;r.moving=false;return false;}
  const dx=chosen.x-r.x,dz=chosen.z-r.z;r.x=chosen.x;r.z=chosen.z;r.facing=Math.atan2(dx,dz);r.walk=(r.walk||0)+Math.hypot(dx,dz)*5.5;r.speed=step/dt;r.moving=true;r.wait=0;this.put(index,r);return false;
 }

 externalPeople(){return this.records.filter(r=>r.external&&r.visible&&r.y<1);}
 tick(dt,sim){
  this.time=sim.time;this.sync(sim);this.externalVehicleIndex=new Map();
  for(const v of sim.vehicles()){const b=vehicleBounds(v);for(let x=Math.floor(b.minX/12);x<=Math.floor(b.maxX/12);x++)for(let z=Math.floor(b.minZ/12);z<=Math.floor(b.maxZ/12);z++){const key=x+':'+z;if(!this.externalVehicleIndex.has(key))this.externalVehicleIndex.set(key,[]);this.externalVehicleIndex.get(key).push(v);}}
  const index=new Map();for(const r of this.records){r.visible=r.support||r.external;if(r.visible)this.put(index,r);}
  for(const r of this.records){
   r.atWork=true;
   if(this.amenities.tick(r,dt,sim,index))continue;
   if(r.support)this.workTask(r,dt,sim,index);
  }
  this.economy.state.shiftPresent=Object.fromEntries(STAFF_ROLES.map(role=>[role.key,this.economy.state[role.field]||0]));
 }
 taskPath(r,toBench){const c=r.station;if(r.activityStation){const slot=r.activityStation;if(toBench){r.activityRoute=[[r.x,r.z],[c.x+1.32,r.z+.65],[c.x+1.32,slot.aisleZ],[slot.x,slot.aisleZ],[slot.x,slot.z]];this.setPath(r,r.activityRoute,2);r.task='toBench';}else{this.setPath(r,[[r.x,r.z],...r.activityRoute.slice(0,-1).reverse()],2);r.task='toDesk';}return;}this.setPath(r,[[r.x,r.z],[c.x+1.2,c.z+.65],toBench?[c.x-.45,c.z+.9]:[c.x,c.z]],1.3);r.task=toBench?'toBench':'toDesk';}
 workTask(r,dt,sim,index){
  r.nextBreak??=sim.time+70+r.number%145;if(sim.time>=r.nextBreak&&r.task==='idle'&&!r.path&&staffTotal(this.economy.state)>50){if(this.amenities.begin(r,sim))return;r.nextBreak=sim.time+25;}if(r.path){if(this.moveExternal(r,dt,index,sim)){r.path=null;r.moving=false;if(r.task==='toBench'){r.task='processing';r.timer=3+(r.number%5);r.facing=0;r.scanning=r.role==='logistics';}else{if(r.activityStation)this.facilityOwners.delete(r.activityStation.id);r.activityStation=null;r.task='idle';r.timer=8+r.number%23;r.facing=Math.PI;}}return;}
  r.timer-=dt*(r.energyUntil>sim.time?1.12:1);
  if(r.task==='idle'&&r.timer<=0){this.assignTask(r,sim);this.taskPath(r,true);return;}
  if(r.task==='processing'&&r.timer<=0){this.finishTask(r,sim);r.task='return';this.taskPath(r,false);}
 }
 assignTask(r,sim){
  const s=this.economy.state;r.job=null;const cycle=(this.completed[r.role]||0)+r.number;r.activity=r.role==='itWorker'?cycle%4===0?'network':'coding':r.role==='salesWorker'?cycle%5===0?'meeting':'sales':r.role==='factoryWorker'?'inspection':r.role==='logistics'?'scanning':'service';
  if(['worker','logistics'].includes(r.role)){
   const order=s.orders.find(o=>o.phase==='queued'&&o.workerId==null&&this.economy.stock(o.product)+this.economy.warehouseTotal(o.product)>=o.quantity-o.collected);
   if(order){order.workerId=r.id;r.orderId=order.id;r.product=order.product;r.job='pack';}
  }else if(r.role==='cashier'){const invoice=s.teamInvoices.find(i=>!i.owner);if(invoice){invoice.owner=r.id;r.invoiceId=invoice.id;r.job='invoice';}}
  if(staffTotal(s)>50&&!r.station.y&&['network','meeting'].includes(r.activity)){const slot=this.amenities.slots.find(a=>a.role===r.role&&a.type===r.activity&&!this.facilityOwners.has(a.id));if(slot){this.facilityOwners.set(slot.id,r.id);r.activityStation=slot;}}r.calling=r.role==='salesWorker'&&r.activity!=='meeting';r.typing=r.role==='itWorker'||r.role==='cashier';r.carryingBox=r.job==='pack'||r.role==='logistics';
 }
 finishTask(r,sim){
  const s=this.economy.state;this.completed[r.role]=(this.completed[r.role]||0)+1;
  if(r.job==='pack'){
   const order=s.orders.find(o=>o.id===r.orderId);if(order&&order.workerId===r.id){let need=order.quantity-order.collected;
    const front=sim.stockOwners.has(sim.stockStation(order.product))?0:Math.min(need,this.economy.stock(order.product));if(front){this.economy.consume(order.product,front);order.collected+=front;need-=front;this.economy.recordMovement('pick',order.product,front,'Loja','Posto de embalagem',r.id);}
    const stock=this.economy.warehouseStock(order.product);for(let i=0;i<stock.length&&need>0;i++)if(!sim.rackOwners.has(i)&&stock[i]){const units=Math.min(need,stock[i]);stock[i]-=units;need-=units;order.collected+=units;this.economy.recordMovement('pick',order.product,units,'A-'+String(i+1).padStart(2,'0'),'Posto CL / embalagem',r.id);}
    if(need===0){order.packed=order.quantity;order.phase=order.source==='counter'?'counterReady':'packed';order.supportRole=r.role;this.economy.recordMovement('pack',order.product,order.quantity,'Posto de embalagem','Expedição','#'+order.id);if(order.source==='counter'){const car=sim.cars.find(c=>c.id===order.carId);if(car&&car.driver.visible)car.phase='finished';}}
    order.workerId=null;this.economy.emit();
   }r.orderId=null;
  }else if(r.job==='invoice'){const invoice=s.teamInvoices.find(i=>i.id===r.invoiceId&&i.owner===r.id);if(invoice){this.economy.contract(invoice.value,'billing');s.teamInvoices=s.teamInvoices.filter(i=>i!==invoice);sim.events.push({id:`invoice-${invoice.id}`,kind:'payment',x:r.x,z:r.z,time:sim.time});}r.invoiceId=null;}
  else if(r.role==='salesWorker'||r.role==='itWorker'){
   const keys=availableProducts(s),product=keys[this.completed[r.role]%keys.length];if(r.role==='itWorker'){s.digitalReleases++;if(r.activity==='network')s.networkSyncs++;}else if(r.activity==='meeting')s.salesMeetings++;
   if(s.orders.filter(o=>o.phase!=='delivered').length<this.economy.orderCapacity()-1){const order=this.economy.createOrder(product,(r.activity==='meeting'?5:2)+this.completed[r.role]%3,r.role==='itWorker'?'online':'office');if(order)sim.events.push({id:`team-order-${order.id}`,kind:r.role==='itWorker'?'online':'contract',x:r.x,z:r.z,time:sim.time});}
   this.economy.emit();
  }else if(r.role==='factoryWorker'){
   const keys=availableProducts(s),product=keys[this.completed[r.role]%keys.length];if(this.economy.factoryTotal()+2<=this.economy.factoryCapacity()){s.qualityInspections+=2;this.economy.addFactoryStock(product,2);if(product==='glass')s.producedGlass+=2;this.economy.recordMovement('produce',product,2,'Linha de montagem / apoio','Saída da fábrica',r.id);this.economy.emit();}
  }else if(r.role==='worker'&&s.teamInvoices.length<30){
   const keys=availableProducts(s),product=keys[this.completed.worker%keys.length];if(this.economy.consume(product)){s.teamInvoices.push({id:s.nextTeamInvoice++,product,value:this.economy.saleValue(product),owner:null});this.economy.recordMovement('pack',product,1,'Loja','Faturamento de acessórios',r.id);this.economy.emit();}
  }else if(r.role==='logistics'){s.wmsAudits++;this.economy.emit();}
  r.calling=false;r.typing=false;r.scanning=false;r.carryingBox=false;r.job=null;
 }
 status(){return {working:this.records.filter(r=>r.role!=='education'&&r.phase==='working').length,total:staffTotal(this.economy.state),breaks:this.records.filter(r=>['toBreak','break','fromBreak'].includes(r.phase)).length,tasks:this.completed};}
}
