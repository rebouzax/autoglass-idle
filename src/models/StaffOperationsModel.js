import {STAFF_ROLES,activeStaff,workforceStations} from './Workforce.js';
import {shopLayout,workerSeat,deskX,collectorHome,officeDesk,itDesk,factoryStation,driveway,getAddresses,cityRoads,academySeat,academyTeacher} from './ShopLayout.js';
import {availableProducts} from './Products.js';
import {travel,advance,sampleRoute} from './routes.js';
import {vehicleBounds} from './CityTrafficModel.js';
import {touchesRectangle} from './NavigationSystem.js';

const nightRole=(role,i,level)=>role==='logistics'?i%3===1:role==='worker'&&level>=2&&i%4===3;
const hash=n=>((n*2654435761)>>>0);
const mode=n=>n%10<4?'car':n%10<7?'moto':'walk';
const busy=a=>a&&a.goal&&!a.reached;
export class StaffOperationsModel {
 constructor(economy){this.economy=economy;this.records=[];this.sequence=0;this.lifts=new Map();this.signature='';this.completed={};}
 actors(sim,role){return {worker:sim.workers,cashier:sim.cashiers,logistics:sim.logistics.workers,salesWorker:sim.office.workers,itWorker:sim.it.workers,factoryWorker:sim.campus.operators}[role]||[];}
 activeHome(s,role,i){return role==='worker'?workerSeat(i):role==='cashier'?{x:deskX(i),z:-8.2}:role==='logistics'?collectorHome(s,i):role==='salesWorker'?officeDesk(s,i):role==='itWorker'?itDesk(s,i):factoryStation(s,i,0);}
 sync(sim){
  const s=this.economy.state,l=shopLayout(s),signature=[s.garageLevel,s.bays,...STAFF_ROLES.map(r=>s[r.field]),s.officeComputers,s.itComputers,s.productionLines].join(':');
  const changed=signature!==this.signature;if(!changed){const actors=Object.fromEntries(STAFF_ROLES.map(role=>[role.key,this.actors(sim,role.key)]));for(const r of this.records){if(r.role!=='education')r.actor=r.support?null:actors[r.role]?.[r.index];if(r.actor){r.actor.offDuty=!r.atWork&&!['leavingInside','arrivingInside'].includes(r.phase);r.actor.nightShift=r.night;}}return;}
  const stations=l.workforce?workforceStations(s,l):[],byKey=new Map(stations.map(c=>[`${c.role}:${c.index+activeStaff(s,c.role)}`,c]));
  const existing=new Map(this.records.map(r=>[r.id,r]));let vehicleIndex=0;
  for(const role of STAFF_ROLES)for(let i=0;i<(s[role.field]||0);i++){
   const key=`${role.key}:${i}`,actor=this.actors(sim,role.key)[i],station=byKey.get(key),home=station||this.activeHome(s,role.key,i);
   let r=existing.get(key);
   if(!r){const n=this.sequence++,night=nightRole(role.key,i,s.garageLevel),present=night!==sim.clock.day;r={id:key,role:role.key,index:i,number:n,color:role.color,mode:mode(hash(n)),night,phase:present?'working':'home',atWork:present,external:false,x:home.x,z:home.z,y:home.y||0,walk:0,facing:Math.PI,timer:4+n%17,task:'idle',reached:true};this.records.push(r);}
   if(r.support&&!station){const order=s.orders.find(o=>o.id===r.orderId&&o.workerId===r.id);if(order){order.workerId=null;order.phase=order.collected>=order.quantity?'queued':order.phase;}const invoice=s.teamInvoices.find(a=>a.id===r.invoiceId&&a.owner===r.id);if(invoice)invoice.owner=null;r.orderId=null;r.invoiceId=null;r.job=null;r.path=null;}
   r.actor=i<activeStaff(s,role.key)?actor:null;r.support=!!station;r.station=station;r.work={...home};
   r.night=nightRole(role.key,i,s.garageLevel);
   if(r.mode!=='walk'){r.parkingIndex=vehicleIndex++;r.parking=this.parkingSlot(l,r.parkingIndex);}
   const house=Math.floor(r.number/2),side=r.number%2?1:-1;r.house={x:l.plotLeft+5+(house%25)*6.4,z:l.plotBack-18-Math.floor(house/25)*12.4};r.home={x:r.house.x+side*1.65,z:r.house.z+2.9};
   if(!r.vehicle&&r.mode!=='walk')r.vehicle={id:`staff-car-${r.number}`,isCar:true,employee:true,vehicleType:r.mode,halfLength:r.mode==='moto'?1.05:1.65,halfWidth:r.mode==='moto'?.42:.94,x:(r.atWork?r.parking:r.home).x,z:(r.atWork?r.parking:r.home).z,facing:0,speed:0,phase:r.atWork?'parked':'home'};
   if(r.vehicle&&['parked','home'].includes(r.vehicle.phase)){const p=r.vehicle.phase==='parked'?r.parking:r.home;r.vehicle.x=p.x;r.vehicle.z=p.z;}
   if(signature!==this.signature&&r.phase==='working'&&r.support){r.x=home.x;r.z=home.z;r.y=home.y||0;r.path=null;r.reached=true;r.task=r.orderId||r.invoiceId||r.task==='processing'?'processing':'idle';if(r.task==='processing')r.timer=Math.max(1,Math.min(5,r.timer||2));}
   if(r.actor){r.actor.offDuty=!r.atWork&&!['leavingInside','arrivingInside'].includes(r.phase);r.actor.nightShift=r.night;}
  }
  for(const a of [...sim.campus.students,...(sim.campus.teacher?[sim.campus.teacher]:[])]){const id='education:'+a.id;let r=this.records.find(v=>v.id===id);const work=a===sim.campus.teacher?academyTeacher(s):academySeat(s,a.index);if(!r){const present=sim.clock.day;r={id,role:'education',index:a.index||0,number:this.sequence++,color:'#d69b49',mode:'walk',night:false,phase:present?'working':'home',atWork:present,external:false,x:work.x,z:work.z,y:0,walk:0,task:'idle',reached:true};this.records.push(r);}r.actor=a;r.work=work;r.home={x:l.plotLeft+7+(r.number%25)*6.4,z:l.plotBack-15};a.offDuty=!r.atWork;}this.signature=signature;
 }
 liftKey(r){return r.station.tower.role+':'+Math.floor(r.station.y/4)+':'+r.index%3;}
 parkingSlot(l,i){const p=l.employeeParking;return {x:p.left+2+(i%p.columns)*3.1,z:p.front-4-Math.floor(i/p.columns)*10.8};}
 desired(r,sim){return r.night!==sim.clock.day;}
 ready(r,sim){if(r.orderId||r.invoiceId)return false;if(!r.actor)return !r.path&&!['processing','invoice','packing','picking'].includes(r.task);const a=r.actor;if(busy(a))return false;if(r.role==='worker'||r.role==='cashier')return !sim.cars.some(c=>c.phase!=='gone')&&(r.role==='cashier'||a.phase==='idle');if(r.role==='logistics')return ['idle','available'].includes(a.phase);if(r.role==='salesWorker')return ['typing','calling','returning'].includes(a.phase)&&!sim.office.meeting;return true;}
 setPath(r,points,speed=2.25){travel(r,points,speed);r.reached=false;r.moving=false;}
 walkway(r,l,arriving=false){const tail=r.mode==='walk'?[]:[[l.plotRight+1.5+(arriving?3.1:0)+(r.number%4)*.7,r.parking.z+(arriving?8.4:2.35)],[r.parking.x-1.35,r.parking.z+(arriving?8.4:2.35)],[r.parking.x-1.35,r.parking.z]];const w=l.workforce,side=l.plotRight+1.5+(arriving?3.1:0)+(r.number%4)*.7,z=w?w.front+3.2+(r.number%8)*.85:driveway(this.economy.state).front+1.4;
  if(r.support&&r.station&&!r.station.y){const c=r.station,laneZ=c.z+(arriving?3.8:2.7),aisle=l.stage>=7?c.x+1.32+(arriving?.8:0):c.aisleX+(arriving?1.05:0);return [[c.x,c.z],[c.x+1.32,c.z+.65],[c.x+1.32,laneZ],[aisle,laneZ],[aisle,z],[side,z],[side,l.employeeParking.front+2],...tail];}
  if(r.support&&r.station?.y){const c=r.station;return [[c.tower.x-7.4,c.tower.z-3],[c.tower.x-7.4,-39.3],[w.left-4,-39.3],[w.left-4,z],[side,z],[side,l.employeeParking.front+2],...tail];}
  const exit=r.exit||{x:-6.1,z:driveway(this.economy.state).front+.2};return [[exit.x,exit.z],[exit.x,driveway(this.economy.state).front+1.6],[side,driveway(this.economy.state).front+1.6],[side,l.employeeParking.front+2],...tail];
 }
 beginExit(r,sim){
  const l=shopLayout(this.economy.state);r.task='idle';r.atWork=false;r.departAt=null;
  if(r.actor){if(r.role==='salesWorker'){r.actor.phase='typing';r.actor.calling=false;r.actor.typing=false;}if(r.role==='itWorker'){r.actor.phase='coding';r.actor.build=30;r.actor.working=false;r.actor.typing=false;if(sim.it.deployOwner===r.actor)sim.it.deployOwner=null;}if(r.role==='factoryWorker'){r.actor.phase='cutting';r.actor.timer=9;r.actor.working=false;}if(r.role==='education'){r.actor.phase='returning';r.actor.typing=false;r.actor.working=false;if(sim.campus.practiceOwner===r.actor)sim.campus.practiceOwner=null;}r.phase='leavingInside';r.actor.commuting=true;r.actor.offDuty=false;const s=this.economy.state;r.exit=['salesWorker','itWorker','factoryWorker','education'].includes(r.role)&&s.garageLevel>=4?{x:l.officeRight-.2,z:driveway(s).front+.2}:{x:-6.1,z:driveway(s).front+.2};sim.move(r.actor,r.exit,1.9);return;}
  r.external=true;r.phase='leaving';
  if(r.station?.y){r.phase='waitingDepartureLift';r.path=null;}
  else this.leaveGround(r,l);
 }
 leaveGround(r,l){const end=r.mode==='walk'?{x:l.plotRight+2.7,z:l.plotBack-7}:r.parking;const path=this.walkway(r,l);if(r.station?.y)path[0]=[r.x,r.z];if(r.mode==='walk')path.push([l.plotRight+1.5,end.z],[end.x-1.35,end.z]);this.setPath(r,path);r.phase='leaving';r.y=0;}
 drive(r,l,arriving){const lane=arriving?r.home.z+5.6:r.parking.z+4,point=arriving?r.home:r.parking;
  const merging=this.records.some(a=>a!==r&&a.vehicle&&a.phase===(arriving?'drivingIn':'drivingHome')&&Math.abs((arriving?a.home.z:a.parking.z)-point.z)<.1&&a.vehicle.x>point.x-55&&a.vehicle.x<point.x+14);
  if(merging||this.roadVehicles().some(v=>v!==r.vehicle&&Math.abs(v.z-lane)<1.8&&v.x>point.x-45&&v.x<point.x+12))return false;
  const v=r.vehicle,p=r.parking,h=r.home,road=cityRoads(this.economy.state),gate=l.plotRight+(arriving?12.4:8);v.phase=arriving?'arriving':'leaving';
  const points=arriving?[[v.x,v.z],[h.x,h.z+5.6],[gate,h.z+5.6],[gate,road.zs[1]-1.5],[gate,p.z+6.25],[p.x,p.z+6.25]]:[[v.x,v.z],[p.x,p.z+4],[gate,p.z+4],[gate,road.zs[1]+1.5],[gate,h.z+3.4],[h.x,h.z+3.4]];
  travel(v,points,6.5);r.phase=arriving?'drivingIn':'drivingHome';r.external=false;return true;
 }
 arriveGround(r,l){const end=this.walkway(r,l,true).reverse();if(r.support&&!r.station.y)end.push([r.station.x,r.station.z]);else if(!r.support){end.push([r.exit?.x??-6.1,r.exit?.z??driveway(this.economy.state).front+.2]);}this.setPath(r,[[r.x,r.z],...end]);r.phase='arriving';r.external=true;}
 beginArrival(r,sim){const l=shopLayout(this.economy.state);if(r.mode!=='walk'){if(this.drive(r,l,true))r.arriveAt=null;return;}r.arriveAt=null;r.x=r.home.x;r.z=r.home.z;r.y=0;const path=this.walkway(r,l,true).reverse();this.setPath(r,[[r.x,r.z],[r.x,r.home.z+3.4],[l.plotRight+5.5,r.home.z+3.4],[l.plotRight+5.5,l.employeeParking.front+2],...path]);r.phase='arriving';r.external=true;}
 atStation(r,sim){r.phase='working';r.atWork=true;r.external=false;r.y=r.work.y||0;r.x=r.work.x;r.z=r.work.z;r.facing=Math.PI;r.task='idle';r.timer=3+r.number%19;r.path=null;if(r.actor){r.actor.offDuty=false;r.actor.commuting=false;if(r.role==='education'){r.actor.phase=r.actor===sim.campus.teacher?'teaching':'learning';r.actor.timer=30;r.actor.seated=r.actor!==sim.campus.teacher;r.actor.typing=r.actor!==sim.campus.teacher;}}}
 near(index,r,radius=1){const out=[];for(let x=Math.floor((r.x-radius)/3);x<=Math.floor((r.x+radius)/3);x++)for(let z=Math.floor((r.z-radius)/3);z<=Math.floor((r.z+radius)/3);z++)for(const a of index.get(`${x}:${z}`)||[])if(a!==r)out.push(a);return out;}
 put(index,r){const key=`${Math.floor(r.x/3)}:${Math.floor(r.z/3)}`;index.get(r.bucket)?.delete(r);if(!index.has(key))index.set(key,new Set());index.get(key).add(r);r.bucket=key;}
 moveExternal(r,dt,index,sim){if(!r.path)return true;const snapshot={x:r.x,z:r.z,distance:r.distance,speed:r.speed,facing:r.facing,walk:r.walk,path:r.path};const complete=advance(r,dt);const radius=.31;
  const blocked=this.near(index,r,1.4).some(a=>a.visible&&Math.abs((a.y||0)-(r.y||0))<1&&Math.hypot(r.x-a.x,r.z-a.z)<radius*2+.07&&Math.hypot(r.x-a.x,r.z-a.z)<=Math.hypot(snapshot.x-a.x,snapshot.z-a.z)+.001);
  const vehicles=this.frameVehicles||sim.vehicles(),traffic=(r.y||0)<1&&vehicles.some(v=>touchesRectangle(r.x,r.z,radius,vehicleBounds(v))&&!touchesRectangle(snapshot.x,snapshot.z,radius,vehicleBounds(v)));
  if(blocked||traffic){Object.assign(r,snapshot);r.moving=false;r.speed=0;r.wait=(r.wait||0)+dt;
   if(r.wait>1.2&&r.path&&sim.time>(r.retryAt||0)){r.retryAt=sim.time+1.5;const ahead=sampleRoute(r.path,Math.min(r.path.length,r.distance+2.4));const dx=ahead.x-r.x,dz=ahead.z-r.z,d=Math.hypot(dx,dz)||1;
    for(const side of [r.number%2?1:-1,r.number%2?-1:1]){const p={x:r.x-dz/d*side*1.05,z:r.z+dx/d*side*1.05};const clear=this.near(index,p,1.4).every(a=>a===r||!a.visible||Math.abs((a.y||0)-(r.y||0))>=1||Math.hypot(p.x-a.x,p.z-a.z)>.75)&&((r.y||0)>=1||vehicles.every(v=>!touchesRectangle(p.x,p.z,.34,vehicleBounds(v))));if(!clear)continue;
     const rest=[];for(const a of r.path.samples)if(a.distance>r.distance+2.4&&(!rest.length||a.distance-rest.at(-1).distance>3))rest.push(a);const last=r.path.samples.at(-1);if(rest.at(-1)!==last)rest.push(last);this.setPath(r,[[r.x,r.z],[p.x,p.z],[ahead.x,ahead.z],...rest.map(a=>[a.x,a.z])],r.baseSpeed||2.25);break;}
   }return false;}r.wait=0;r.moving=!complete;this.put(index,r);return complete;
 }
 vehicles(){return this.records.flatMap(r=>r.vehicle?[r.vehicle]:[]);}
 roadVehicles(){return this.vehicles().filter(v=>!['parked','home'].includes(v.phase));}
 externalPeople(){return this.records.filter(r=>r.external&&r.visible&&r.y<1);}
 tick(dt,sim){
  this.time=sim.time;this.sync(sim);this.frameVehicles=sim.vehicles();const s=this.economy.state,l=shopLayout(s),index=new Map();for(const r of this.records){r.visible=(r.support&&r.phase==='working')||r.external; if(r.visible)this.put(index,r);}
  for(const r of this.records){
   const wanted=this.desired(r,sim);
   if(r.phase==='working'&&!wanted){r.departAt??=sim.time+r.number%43;if(sim.time>=r.departAt&&this.ready(r,sim))this.beginExit(r,sim);}
   if(r.phase==='home'&&wanted){r.arriveAt??=sim.time+r.number%61;if(sim.time>=r.arriveAt)this.beginArrival(r,sim);}
   if(r.phase==='leavingInside'&&r.actor.reached){r.actor.offDuty=true;r.actor.commuting=false;r.x=r.actor.x;r.z=r.actor.z;r.y=0;r.external=true;this.leaveGround(r,l);}
   if(r.phase==='waitingDepartureLift'&&!this.lifts.get(this.liftKey(r))){const c=r.station;this.lifts.set(this.liftKey(r),r);r.phase='toLift';this.setPath(r,[[r.x,r.z],[c.x+1.3,c.z+1.2],[c.tower.x-5.3,c.z+1.2],[c.tower.x-5.3,c.tower.z-3],[c.tower.x-7.4,c.tower.z-3]],1.8);}
   if(r.phase==='toLift'&&this.moveExternal(r,dt,index,sim)){r.phase='waitingLift';r.path=null;}
   if(r.phase==='waitingLift'||r.phase==='waitingLiftUp'){const key=this.liftKey(r);if(!this.lifts.get(key)||this.lifts.get(key)===r){this.lifts.set(key,r);r.phase=r.phase==='waitingLift'?'liftDown':'liftUp';r.visible=false;}}
   if(r.phase==='liftDown'||r.phase==='liftUp'){const target=r.phase==='liftDown'?0:r.station.y;r.y+=Math.sign(target-r.y)*Math.min(Math.abs(target-r.y),dt*3);r.visible=false;if(Math.abs(r.y-target)<.01){this.lifts.delete(this.liftKey(r));if(target===0)this.leaveGround(r,l);else{const c=r.station;this.setPath(r,[[r.x,r.z],[c.tower.x-5.3,c.tower.z-3],[c.tower.x-5.3,c.z+1.2],[c.x+1.3,c.z+1.2],[c.x,c.z]]);r.phase='toDesk';r.visible=true;}}}
   if(['leaving','arriving','toDesk','walkingHome'].includes(r.phase)&&this.moveExternal(r,dt,index,sim)){
    if(r.phase==='leaving'){if(r.mode!=='walk')this.drive(r,l,false);else{this.setPath(r,[[r.x,r.z],[r.x,r.home.z+3.4],[r.home.x,r.home.z+3.4],[r.home.x,r.home.z]]);r.phase='walkingHome';}}
    else if(r.phase==='walkingHome'){r.phase='home';r.external=false;r.visible=false;}
    else if(r.phase==='toDesk')this.atStation(r,sim);
    else if(r.support&&r.station.y){r.phase='waitingLiftUp';r.x=r.station.tower.x-7.4;r.z=r.station.tower.z-3;r.y=0;}
    else if(r.actor){r.phase='arrivingInside';r.external=false;r.actor.x=r.x;r.actor.z=r.z;r.actor.offDuty=false;r.actor.commuting=true;sim.move(r.actor,r.work,1.9);}
    else this.atStation(r,sim);
   }
   if(r.phase==='arrivingInside'&&r.actor.reached)this.atStation(r,sim);
   if(['drivingIn','drivingHome'].includes(r.phase)&&r.vehicle.stoppedFor>5&&r.vehicle.waitReason==='trânsito'&&r.vehicle.distance<9){const incoming=r.phase==='drivingIn',p=incoming?r.home:r.parking;r.phase=incoming?'yieldMergeIn':'yieldMergeOut';travel(r.vehicle,[[r.vehicle.x,r.vehicle.z],[p.x,p.z]],1.3,true);}
   if(['yieldMergeIn','yieldMergeOut'].includes(r.phase)&&sim.advanceVehicle(r.vehicle,dt)){const incoming=r.phase==='yieldMergeIn';r.vehicle.phase=incoming?'home':'parked';r.vehicle.stoppedFor=0;if(incoming){r.phase='home';r.arriveAt=sim.time+3;}else{r.x=r.parking.x-1.35;r.z=r.parking.z;r.phase='leaving';r.external=true;r.path=null;}}
   if(['drivingHome','drivingIn','parkingHome','parkingIn'].includes(r.phase)){
    if(sim.advanceVehicle(r.vehicle,dt)){
     if(r.phase==='drivingHome'||r.phase==='drivingIn'){const p=r.phase==='drivingHome'?r.home:r.parking;const entering=r.phase==='drivingIn';r.phase=entering?'parkingIn':'parkingHome';r.vehicle.phase='parking';travel(r.vehicle,[[r.vehicle.x,r.vehicle.z],[p.x,p.z]],1.3,true);}
     else if(r.phase==='parkingHome'){r.vehicle.phase='home';r.phase='home';r.visible=false;}
     else{r.vehicle.phase='parked';r.x=r.parking.x-1.35;r.z=r.parking.z;r.y=0;this.arriveGround(r,l);}
    }
   }
   r.visible=(r.support&&r.phase==='working')||(r.external&&!['liftDown','liftUp'].includes(r.phase));
   if(r.phase==='working'&&r.support)this.workTask(r,dt,sim,index);
  }
  s.shiftPresent=Object.fromEntries(STAFF_ROLES.map(role=>[role.key,this.records.filter(r=>r.role===role.key&&r.atWork).length]));
 }
 taskPath(r,toBench){const c=r.station;this.setPath(r,[[r.x,r.z],[c.x+1.2,c.z+.65],toBench?[c.x-.45,c.z+.9]:[c.x,c.z]],1.3);r.task=toBench?'toBench':'toDesk';}
 workTask(r,dt,sim,index){
  if(r.path){if(this.moveExternal(r,dt,index,sim)){r.path=null;r.moving=false;if(r.task==='toBench'){r.task='processing';r.timer=3+(r.number%5);r.facing=0;}else{r.task='idle';r.timer=8+r.number%23;r.facing=Math.PI;}}return;}
  r.timer-=dt;
  if(r.task==='idle'&&r.timer<=0){this.assignTask(r,sim);this.taskPath(r,true);return;}
  if(r.task==='processing'&&r.timer<=0){this.finishTask(r,sim);r.task='return';this.taskPath(r,false);}
 }
 assignTask(r,sim){
  const s=this.economy.state;r.job=null;
  if(['worker','logistics'].includes(r.role)){
   const order=s.orders.find(o=>o.phase==='queued'&&o.workerId==null&&(sim.clock.day||o.source!=='counter')&&this.economy.stock(o.product)+this.economy.warehouseTotal(o.product)>=o.quantity-o.collected);
   if(order){order.workerId=r.id;r.orderId=order.id;r.product=order.product;r.job='pack';}
  }else if(r.role==='cashier'){const invoice=s.teamInvoices.find(i=>!i.owner);if(invoice){invoice.owner=r.id;r.invoiceId=invoice.id;r.job='invoice';}}
  r.calling=r.role==='salesWorker';r.typing=r.role==='itWorker'||r.role==='cashier';r.carryingBox=r.job==='pack'||r.role==='logistics';
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
   const keys=availableProducts(s),product=keys[this.completed[r.role]%keys.length];if(r.role==='itWorker')s.digitalReleases++;
   if(s.orders.filter(o=>o.phase!=='delivered').length<this.economy.orderCapacity()-1){const order=this.economy.createOrder(product,2+this.completed[r.role]%3,r.role==='itWorker'?'online':'office');if(order)sim.events.push({id:`team-order-${order.id}`,kind:r.role==='itWorker'?'online':'contract',x:r.x,z:r.z,time:sim.time});}
   this.economy.emit();
  }else if(r.role==='factoryWorker'){
   const keys=availableProducts(s),product=keys[this.completed[r.role]%keys.length];if(this.economy.factoryTotal()+2<=this.economy.factoryCapacity()){this.economy.addFactoryStock(product,2);if(product==='glass')s.producedGlass+=2;this.economy.recordMovement('produce',product,2,'Linha de montagem / apoio','Saída da fábrica',r.id);this.economy.emit();}
  }else if(r.role==='worker'&&sim.clock.day&&s.teamInvoices.length<30){
   const keys=availableProducts(s),product=keys[this.completed.worker%keys.length];if(this.economy.consume(product)){s.teamInvoices.push({id:s.nextTeamInvoice++,product,value:this.economy.saleValue(product),owner:null});this.economy.recordMovement('pack',product,1,'Loja','Faturamento de acessórios',r.id);this.economy.emit();}
  }else if(r.role==='logistics'){s.wmsAudits++;this.economy.emit();}
  r.calling=false;r.typing=false;r.carryingBox=false;r.job=null;
 }
 status(){return {onShift:this.records.filter(r=>r.atWork).length,commuting:this.records.filter(r=>!['working','home'].includes(r.phase)).length,home:this.records.filter(r=>r.phase==='home').length,tasks:this.completed};}
}
