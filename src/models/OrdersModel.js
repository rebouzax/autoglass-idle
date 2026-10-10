import {travel} from './routes.js';
import {productPoint,packingPoint,pickupPoint,dispatchPoint,dispatchBay,courierSeat,workerSeat,driveway,roadExit} from './ShopLayout.js';

export class OrdersModel{
  constructor(economy){this.economy=economy;this.couriers=[];this.packingOwner=null;this.pickupOwner=null;for(const order of economy.state.orders)if(order.phase!=='delivered'){order.phase=order.packed>=order.quantity?(order.source==='counter'?'counterReady':'packed'):'queued';order.workerId=null;order.courierId=null;}}
  get active(){return this.economy.state.orders.filter(o=>o.phase!=='delivered');}
  workers(){return this.couriers.filter(c=>c.driver.visible).map(c=>c.driver);}
  startJob(worker,sim){
    const order=this.active.find(o=>o.phase==='queued'&&o.workerId===null&&(o.collected>o.packed||this.economy.stock(o.product)>=o.quantity-o.collected));if(!order)return false;
    if(order.collected<order.quantity&&!sim.claimStock(order.product,worker))return false;
    order.workerId=worker.id;worker.orderId=order.id;worker.carId=null;worker.product=order.product;
    if(order.collected>=order.quantity){worker.carryingBox=true;worker.phase='waitPacking';sim.move(worker,workerSeat(worker.id),sim.productivity());}else{worker.phase='orderStock';sim.move(worker,productPoint(order.product),sim.productivity());}return true;
  }
  spawnCourier(order,sim){
    const access=driveway(this.economy.state);if(sim.vehicles().some(v=>Math.hypot(v.x+58,v.z-access.arrival)<5.5))return;
    const s=this.economy.state,capacity=Math.min(s.garageLevel>=5?3:2,1+Math.floor(s.dispatchLevel/2)),bay=Array.from({length:capacity},(_,i)=>i).find(i=>!this.couriers.some(c=>c.bay===i&&c.phase!=='gone'&&!(c.phase==='leaving'&&c.x>dispatchBay(s,i).x+4)));if(bay===undefined)return;
    const destination=dispatchBay(s,bay),motorcycle=order.product!=='glass'&&order.quantity<=3,id=`courier-${order.id}`;
    const car={id,bay,delivery:true,isCar:true,vehicleType:motorcycle?'moto':'car',halfLength:motorcycle?1.1:1.6,halfWidth:motorcycle?.49:.94,color:order.id%2?'#f3b14d':'#218aca',glass:1,phase:'arriving',x:-58,z:access.arrival,facing:Math.PI/2,orderId:order.id,driver:{x:0,z:0,facing:0,id:`rider-${order.id}`,visible:false,phase:'arriving',seated:false,moving:false,walk:0,carryingBox:false}};
    travel(car,[[-58,access.arrival],[destination.x,access.arrival],[destination.x,destination.z]],4.6);order.courierId=id;this.couriers.push(car);
  }
  tick(dt,sim){
    const s=this.economy.state,p=sim.productivity(),packSpeed=(1+s.packingLevel*.4)*(1+s.dispatchLevel*.15);
    const layoutSignature=[s.garageLevel,s.bays,s.storeExpansion].join(':');
    if(this.layoutSignature&&this.layoutSignature!==layoutSignature)for(const worker of sim.workers)if(worker.phase==='toDispatch'){const order=s.orders.find(o=>o.id===worker.orderId),courier=this.couriers.find(c=>c.id===order?.courierId);if(courier)sim.move(worker,dispatchPoint(s,courier.bay),p*.95);}
    this.layoutSignature=layoutSignature;
    if(this.packingOwner&&Math.hypot(this.packingOwner.x-packingPoint.x,this.packingOwner.z-packingPoint.z)>1.3&&!['toPacking','packing'].includes(this.packingOwner.phase))this.packingOwner=null;
    if(this.pickupOwner&&this.pickupOwner.phase!=='counterHandover'&&Math.hypot(this.pickupOwner.x-pickupPoint.x,this.pickupOwner.z-pickupPoint.z)>1.25)this.pickupOwner=null;
    const buildingReady=this.economy.expansionReady()&&s.cash>=this.economy.price('garage');
    this.buildingWindow=buildingReady?((this.buildingWindow||0)+dt):0;
    const reserveBuilding=buildingReady&&this.buildingWindow%60<12;
    if(s.garageLevel>=4&&!reserveBuilding){for(const order of this.active)if(order.source!=='counter'&&order.phase==='packed'&&!order.courierId)this.spawnCourier(order,sim);}
    for(const worker of sim.workers){const order=s.orders.find(o=>o.id===worker.orderId);if(!order)continue;
      if(worker.phase==='orderStock'&&worker.reached){worker.phase='orderPicking';worker.timer=.8+(order.quantity-order.collected)*.35;worker.working=true;}
      else if(worker.phase==='orderPicking'){worker.timer-=dt*(1+s.tools*.3);if(worker.timer<=0){const units=order.quantity-order.collected;if(!this.economy.consume(order.product,units)){worker.timer=1;continue;}order.collected+=units;this.economy.recordMovement('pick',order.product,units,'Loja','Embalagem','#'+order.id);worker.carryingBox=true;worker.working=false;worker.phase='waitPacking';sim.move(worker,workerSeat(worker.id),p);this.economy.emit();}}
      else if(worker.phase==='waitPacking'&&!this.packingOwner){this.packingOwner=worker;worker.phase='toPacking';sim.move(worker,packingPoint,p);}
      else if(worker.phase==='toPacking'&&worker.reached){worker.phase='packing';worker.working=true;worker.facing=Math.PI/2;worker.timer=3+order.quantity*.65;}
      else if(worker.phase==='packing'){worker.timer-=dt*packSpeed;if(worker.timer<=0){order.packed=order.quantity;this.economy.recordMovement('pack',order.product,order.quantity,'Embalagem','Expedição','#'+order.id);order.phase='packed';worker.working=false;worker.carryingBox=false;if(order.source==='counter'){worker.phase='waitPickup';worker.carryingBox=true;sim.move(worker,workerSeat(worker.id),p);}else{order.workerId=null;worker.orderId=null;sim.finishWorker(worker);}this.economy.emit();}}
      else if(worker.phase==='waitPickup'&&!this.pickupOwner){this.pickupOwner=worker;worker.phase='counterHandover';sim.move(worker,pickupPoint,p);}
      else if(worker.phase==='counterHandover'&&worker.reached){worker.carryingBox=false;order.phase='counterReady';order.workerId=null;const car=sim.cars.find(c=>c.id===order.carId);if(car&&car.driver.visible&&['working','waiting'].includes(car.phase))car.phase='finished';worker.orderId=null;sim.finishWorker(worker);this.economy.emit();}
      else if(worker.phase==='toDispatch'&&worker.reached){worker.phase='handover';worker.timer=1.6;worker.working=true;worker.facing=0;const courier=this.couriers.find(c=>c.id===order.courierId);if(courier)courier.driver.receiving=true;}
      else if(worker.phase==='handover'){worker.timer-=dt*packSpeed;if(worker.timer<=0){worker.working=false;worker.carryingBox=false;const courier=this.couriers.find(c=>c.id===order.courierId);if(courier){courier.phase='loading';courier.driver.receiving=false;courier.driver.carryingBox=true;courier.driver.phase='loading';courier.loadTimer=2.5/packSpeed;}order.phase='loaded';order.workerId=null;worker.orderId=null;sim.finishWorker(worker);this.economy.emit();}}
    }
    for(const courier of this.couriers){
      if(courier.phase==='arriving'&&sim.advanceVehicle(courier,dt)){const seat=courierSeat(s,courier.bay);if(sim.people().some(a=>Math.hypot(a.x-seat.x,a.z-seat.z)<.95)){courier.waitReason='desembarque';continue;}courier.phase='waiting';Object.assign(courier.driver,courierSeat(s,courier.bay),{visible:true,phase:'waiting',facing:Math.PI});sim.configureNavigation();}
      if(courier.phase==='waiting'){const order=s.orders.find(o=>o.id===courier.orderId);if(order?.phase==='packed'&&order.workerId===null){const worker=sim.workers.find(w=>w.phase==='idle');if(worker){order.workerId=worker.id;order.phase='dispatching';worker.orderId=order.id;worker.product=order.product;worker.phase='toDispatch';worker.carryingBox=true;sim.move(worker,dispatchPoint(s,courier.bay),p*.95);}}}
      if(courier.phase==='loading'){courier.loadTimer-=dt;if(courier.loadTimer<=0){courier.driver.phase='boarding';courier.phase='boarding';sim.move(courier.driver,{x:courier.x-(courier.vehicleType==='moto'?1:1.65),z:courier.z-.1},1.3);}}
      if(courier.phase==='boarding'&&courier.driver.reached){courier.driver.visible=false;courier.phase='reversing';travel(courier,[[courier.x,courier.z],[courier.x,driveway(s).exit]],1.6,true);}
      if(courier.phase==='reversing'&&sim.advanceVehicle(courier,dt)){courier.phase='leaving';travel(courier,[[courier.x,courier.z],[courier.x+2.2,driveway(s).exit],[roadExit(s),driveway(s).exit]],4.2);const order=s.orders.find(o=>o.id===courier.orderId);if(order){this.economy.completeOrder(order);sim.events.push({id:`dispatch-${order.id}`,kind:'delivery',x:courier.x,z:courier.z,time:sim.time});}}
      if(courier.phase==='leaving'&&sim.advanceVehicle(courier,dt))courier.phase='gone';
    }
    this.couriers=this.couriers.filter(c=>c.phase!=='gone');
  }
  status(){const ready=this.active.filter(o=>['packed','counterReady'].includes(o.phase)).length;return `${this.active.length} encomendas · ${ready} prontas`;} 
}
