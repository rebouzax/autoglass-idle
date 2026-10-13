import {NavigationSystem,rectangle} from './NavigationSystem.js';
import {travel} from './routes.js';
import {vehicleBounds} from './CityTrafficModel.js';
import {cityRoads,cityExtent} from './ShopLayout.js';
import {availableProducts} from './Products.js';
import {MaxparSupplyModel} from './MaxparSupplyModel.js';
import {maxparBins,maxparDock} from './MaxparProgression.js';
import {maxparConfig,maxparLayout,maxparBay,maxparSupply,maxparSeat,maxparReception,maxparLounge,maxparDesk,MAXPAR_SERVICES} from './MaxparProgression.js';

const person=(id,p)=>({...p,id,facing:p.facing||0,walk:0,moving:false,seated:false,working:false,phase:'idle',reached:true});
export class MaxparModel{
 constructor(economy){this.economy=economy;this.navigation=new NavigationSystem();this.supply=new MaxparSupplyModel(economy);this.cars=[];this.workers=[];this.coordinators=[];this.nextId=0;this.nextArrival=3;this.lastNavigation=-1;this.bookings=0;this.signature='';this.recoverPayments=true;}
 get enabled(){return this.economy.state.garageLevel>=7&&this.economy.state.maxparLevel>0;}
 people(){return this.enabled?[...this.workers,...this.coordinators,...this.supply.collectors,...(this.receptionist?[this.receptionist]:[]),...this.cars.filter(c=>c.driver.visible).map(c=>c.driver)]:[];}
 move(actor,p,speed=1.4,via=[]){const staff=!actor.id.startsWith('maxpar-client');this.navigation.moveTo(actor,p.x,p.z,Math.min(2.8,speed*(staff?1+this.economy.state.maxparSpeed*.06:1)),via);}
 sync(sim){
  if(!this.enabled)return;const s=this.economy.state,l=maxparLayout(s,cityRoads(s).zs[1]),signature=[s.maxparLevel,s.maxparWorkers,s.maxparTools,s.maxparComfort,s.maxparWarehouse,s.maxparCollectors,l.front].join(':');
  if(signature===this.signature)return;
  const dz=this.layout?l.front-this.layout.front:0;
  if(dz){
   for(const car of this.cars){car.z+=dz;if(car.path){for(const p of car.path.samples)p.z+=dz;}car.lane=l.lane;}
   const truck=this.supply.truck;if(truck){truck.z+=dz;truck.origin.z+=dz;if(truck.path)for(const p of truck.path.samples)p.z+=dz;}
   for(const a of this.people()){a.z+=dz;const points=new Set([a.goal,...(a.navTargets||[]),...(a.route||[])]);for(const p of points)if(p)p.z+=dz;}
  }
  this.layout=l;this.signature=signature;
  if(!this.receptionist)this.receptionist=person('maxpar-reception',{...maxparReception(l),z:l.front-10.1,facing:0});
  else{const a=this.receptionist;a.x=l.left+3;a.z=l.front-10.1;}
  const technicianCount=Math.min(l.bays,s.maxparWorkers);
  while(this.workers.length<technicianCount){const index=this.workers.length;this.workers.push({...person('maxpar-tech-'+index,maxparSeat(l,index)),index,seated:true,carId:null});}
  while(this.coordinators.length<s.maxparWorkers-technicianCount){const index=this.coordinators.length;this.coordinators.push({...person('maxpar-agent-'+index,maxparDesk(l,index)),index,seated:true,phase:'calling',timer:5+index*1.4});}
  // Reassign an idle coordinator when a newly purchased bay needs a technician.
  this.coordinators=this.coordinators.slice(0,Math.max(0,s.maxparWorkers-technicianCount));
  for(const car of this.cars)if(car.driver.visible&&['waiting','working'].includes(car.phase))this.move(car.driver,maxparLounge(l,car.bay));
  this.configure(sim,true);
 }
 configure(sim,invalidate=false){
  if(!this.enabled)return;if(!invalidate&&sim.time-this.lastNavigation<.25)return;this.lastNavigation=sim.time;
  const l=this.layout,dock=maxparDock(l),obstacles=[rectangle(l.left,(l.front+dock.z+1.8)/2,.18,l.front-dock.z-1.8),rectangle(l.left,(l.back+dock.z-1.8)/2,.18,dock.z-1.8-l.back),rectangle(l.right,(l.front+l.back)/2,.18,l.front-l.back),rectangle((l.left+l.right)/2,l.back,l.right-l.left,.18),rectangle(l.left+3,l.front-9.2,2.5,.75)];
  for(let i=0;i<l.bays;i++){const p=maxparSupply(l,i);obstacles.push(rectangle(p.x,p.z-1,.9,.75));}
  for(let i=0;i<this.coordinators.length;i++){const p=maxparDesk(l,i);obstacles.push(rectangle(p.x,p.z-.9,2,.65));}
  for(const car of this.cars)if(car.z<l.plotFront-.3)obstacles.push(vehicleBounds(car));
  if(this.supply.truck)obstacles.push(vehicleBounds(this.supply.truck));
  for(const bin of maxparBins(this.economy.state,l))obstacles.push(rectangle(bin.x,bin.z,2.5,.75));
  this.navigation.configure(obstacles,{minX:l.plotLeft+.5,maxX:l.right-.35,minZ:l.back+.5,maxZ:l.plotFront-.25},invalidate);
 }
 spawn(sim){
  const s=this.economy.state,l=this.layout,bay=Array.from({length:l.bays},(_,i)=>i).find(i=>!this.cars.some(c=>c.bay===i&&c.phase!=='gone'&&!(c.phase==='leaving'&&c.x<maxparBay(l,i).x-6)));if(bay===undefined)return false;
  const start=cityExtent(s)/2+5;if(sim.vehicles().some(v=>Math.hypot(v.x-start,v.z-l.lane)<6))return false;
  const services=MAXPAR_SERVICES.filter(job=>job.level<=s.maxparLevel&&availableProducts(s,true).includes(job.product)),n=this.nextId++,job=services[n%services.length],p=maxparBay(l,bay),motorcycle=job.product==='motoMirror'||job.vehicleType==='moto';
  const car={id:'maxpar-car-'+n,bay,product:job.product,job,vehicleType:motorcycle?'moto':'car',halfLength:motorcycle?1.1:1.6,halfWidth:motorcycle?.49:.94,isCar:true,color:['#75b4ad','#e3af65','#9e8ac0','#e8efed'][n%4],phase:'arriving',lane:l.lane,glass:job.product==='glass'?0:1,progress:0,speed:0,paid:false,driver:{...person('maxpar-client-'+n,{x:0,z:0}),visible:false},bill:Math.round(this.economy.saleValue(job.product)*job.multiplier*Math.max(2,sim.economy.batchMultiplier('office')*(.15+s.maxparLevel*.035))*(1+s.maxparContracts*.22+s.maxparComfort*.06))};
  car.broken=job.kind==='repair';car.paintColor=['#eeaa55','#7baece','#a68bc2','#55b99b'][n%4];travel(car,[[start,l.lane],[p.x,l.lane],[p.x,p.z]],car.broken?3.8:5.2);this.cars.push(car);if(this.bookings>0)this.bookings--;return true;
 }
 material(car,sim){
  const s=this.economy.state,key=car.product,reserved=this.cars.filter(c=>c!==car&&c.materialReady&&c.product===key&&!c.serviced).length;
  if((s.maxparMaterials[key]||0)>reserved){car.materialReady=true;return true;}
  return false;
 }
 tick(dt,sim){
  if(!this.enabled)return;this.sync(sim);const s=this.economy.state,l=this.layout,pace=(1+s.maxparSpeed*.18+s.maxparTools*.09)*(1+this.coordinators.length*.035)*this.economy.trainingBonus();this.nextArrival-=dt;
  if(this.recoverPayments){this.recoverPayments=false;if(s.maxparPendingPayments>0){const amount=s.maxparPendingPayments;s.maxparServices+=s.maxparPendingServices;s.maxparEarned+=amount;s.maxparPendingPayments=0;s.maxparPendingServices=0;this.economy.contract(amount,'maxpar');}}
  this.supply.tick(dt,this,sim);const safe=!this.supply.truck||this.supply.truck.phase==='companyLoading';if(this.economy.maxparConstructionSafe!==safe){this.economy.maxparConstructionSafe=safe;this.economy.emit();}
  this.navigation.beginStep();this.configure(sim);this.navigation.tick(this.people(),dt);
  if(this.nextArrival<=0&&this.spawn(sim))this.nextArrival=Math.max(5,17-s.maxparContracts*1.5-(this.bookings?4:0));
  for(const agent of this.coordinators){
   if(agent.phase==='toDesk'&&agent.reached){agent.phase='calling';agent.calling=true;agent.seated=true;agent.timer=8/(1+s.maxparContracts*.2);}
   else if(agent.phase==='calling'){agent.calling=true;agent.timer-=dt*pace;if(agent.timer<=0){agent.calling=false;agent.seated=false;if(this.bookings<l.bays*2){this.bookings++;s.maxparAppointments++;this.economy.emit();}agent.phase='reviewing';agent.working=true;agent.timer=4;}}
   else if(agent.phase==='reviewing'){agent.timer-=dt*pace;if(agent.timer<=0){agent.working=false;agent.phase='toDesk';const p=maxparDesk(l,agent.index);this.move(agent,p,1.3,[{x:p.x+1.25,z:p.z+1.2}]);}}
  }
  for(const car of this.cars){
   if(car.phase==='arriving'){
    const supply=this.supply.truck;if(supply&&['mergeWait','returning'].includes(supply.phase)&&car.x>supply.x+12&&car.x<supply.x+22&&car.z>l.front){car.speed=0;car.moving=false;car.waitReason='saída de carga';continue;}
    const exit=this.cars.find(c=>c!==car&&c.phase==='reversing'&&car.x>c.x+5&&car.x<c.x+14&&car.z>l.front);if(exit){car.speed=0;car.moving=false;car.waitReason='saída do box';continue;}
    if(sim.advanceVehicle(car,dt)){const door={x:car.x-1.55,z:car.z+.1};if(this.people().some(p=>Math.hypot(p.x-door.x,p.z-door.z)<1))continue;car.driver.x=door.x;car.driver.z=door.z;car.driver.visible=true;car.phase='checkin';this.configure(sim,true);this.move(car.driver,{x:l.left+3,z:l.front-7.8},1.3,[{x:door.x,z:l.front-.8},{x:l.left+3,z:l.front-.8}]);}
   }else if(car.phase==='checkin'&&car.driver.reached&&!this.receptionist.carId){this.receptionist.carId=car.id;this.receptionist.working=true;car.phase='registering';car.timer=2.5;}
   else if(car.phase==='registering'){car.timer-=dt*pace;if(car.timer<=0){this.receptionist.carId=null;this.receptionist.working=false;car.phase='waiting';this.move(car.driver,maxparLounge(l,car.bay));}}
   else if(['waiting','working'].includes(car.phase)&&car.driver.reached){car.driver.seated=true;car.driver.facing=Math.PI/2;}
   else if(car.phase==='checkout'&&car.driver.reached&&!this.receptionist.carId){this.receptionist.carId=car.id;this.receptionist.working=true;car.phase='paying';car.timer=2;}
   else if(car.phase==='paying'){car.timer-=dt;if(car.timer<=0){if(!car.paid){car.paid=true;s.maxparPendingPayments=Math.max(0,s.maxparPendingPayments-car.bill);s.maxparPendingServices=Math.max(0,s.maxparPendingServices-1);s.maxparServices++;s.maxparEarned+=car.bill;this.economy.contract(car.bill,'maxpar');sim.events.push({id:'maxpar-paid-'+car.id,kind:'payment',x:l.left+3,z:l.front-8.5,time:sim.time});}this.receptionist.carId=null;this.receptionist.working=false;car.phase='boarding';this.move(car.driver,{x:car.x-1.55,z:car.z+.1},1.5,[{x:l.left+3,z:l.front-.8},{x:car.x-1.55,z:l.front-.8}]);}}
   else if(car.phase==='boarding'&&car.driver.reached){car.driver.visible=false;car.phase='readyToExit';}
   else if(car.phase==='readyToExit'&&!this.cars.some(c=>c!==car&&(c.phase==='reversing'||c.phase==='arriving'&&c.z<l.lane-.5))){car.phase='reversing';travel(car,[[car.x,car.z],[car.x,l.lane]],2.6,true);}
   else if(car.phase==='reversing'&&sim.advanceVehicle(car,dt)){car.phase='leaving';travel(car,[[car.x,car.z],[-cityExtent(s)/2-5,l.lane]],5.2);}
   else if(car.phase==='leaving'&&sim.advanceVehicle(car,dt))car.phase='gone';
  }
  for(const w of this.workers){
   const car=this.cars.find(c=>c.id===w.carId);
   if(w.phase==='idle'){const next=this.cars.find(c=>c.phase==='waiting'&&!c.workerId);if(next&&this.material(next,sim)){w.carId=next.id;next.workerId=w.id;next.phase='working';w.phase='diagnoseWalk';this.move(w,{x:next.x+1.6,z:next.z});}}
   else if(w.phase==='diagnoseWalk'&&w.reached){w.phase='diagnosing';w.scanning=true;w.timer=3;}
   else if(w.phase==='diagnosing'){w.timer-=dt*pace;if(w.timer<=0){w.scanning=false;w.phase='getMaterial';const bins=maxparBins(s,l).filter(b=>b.product===car.product),bin=bins[w.index%bins.length];this.move(w,{x:bin.x,z:bin.z+1.15});}}
   else if(w.phase==='getMaterial'&&w.reached){w.phase='collecting';w.working=true;w.timer=1.5;}
   else if(w.phase==='collecting'){w.timer-=dt*pace;if(w.timer<=0){w.working=false;w.carrying=car?.product==='glass';w.carryingBox=!w.carrying;w.phase='toCar';this.move(w,{x:car.x+1.6,z:car.z});}}
   else if(w.phase==='toCar'&&w.reached){w.carrying=false;w.carryingBox=false;w.working=true;w.painting=car.job.kind==='paint';w.phase='installing';w.timer=car.job.duration;w.facing=-Math.PI/2;}
   else if(w.phase==='installing'){w.timer-=dt*pace;car.progress=1-Math.max(0,w.timer)/car.job.duration;if(w.timer<=0){w.working=false;w.painting=false;w.scanning=true;w.phase='quality';w.timer=2;}}
   else if(w.phase==='quality'){w.timer-=dt*pace;if(w.timer<=0){w.scanning=false;car.serviced=true;s.maxparPendingPayments+=car.bill;s.maxparPendingServices++;car.broken=false;car.glass=1;car.phase='checkout';s.maxparMaterials[car.product]=Math.max(0,(s.maxparMaterials[car.product]||0)-1);this.supply.record('pick',car.product,1,'Box '+(car.bay+1));this.move(car.driver,{x:l.left+3,z:l.front-7.8});w.carId=null;w.phase='returning';this.move(w,maxparSeat(l,w.index));this.economy.emit();}}
   else if(w.phase==='returning'&&w.reached){w.phase='idle';w.seated=true;w.facing=0;}
  }
  this.cars=this.cars.filter(c=>c.phase!=='gone');
 }
 status(){const s=this.economy.state;return {level:s.maxparLevel,bays:this.layout?.bays||0,clients:this.cars.filter(c=>!c.paid).length,bookings:this.bookings,working:this.workers.filter(w=>w.carId).length,services:s.maxparServices,earned:s.maxparEarned,received:s.maxparReceived,truck:this.supply.truck?.phase||null,stock:s.maxparMaterials,actors:this.people().map(a=>({id:a.id,phase:a.phase,x:a.x,z:a.z,goal:a.goal,reached:a.reached,blocked:a.blocked,stall:a.stallTime})),jobs:this.cars.map(c=>({id:c.id,phase:c.phase,service:c.job.name,material:c.materialReady,paid:c.paid}))};}
}
