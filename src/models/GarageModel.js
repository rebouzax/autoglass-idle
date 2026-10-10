import {advance,travel} from './routes.js';
import {NavigationSystem,touchesRectangle,actorRadius} from './NavigationSystem.js';
import {CityTrafficModel,vehicleBounds,vehicleCollisionBlocks,vehicleSpeedLimit,signalSpeedLimit,obeysSignals} from './CityTrafficModel.js';
import {OfficeModel} from './OfficeModel.js';
import {LogisticsModel} from './LogisticsModel.js';
import {OrdersModel} from './OrdersModel.js';
import {WeatherModel} from './WeatherModel.js';
import {ITModel} from './ITModel.js';
import {CampusModel} from './CampusModel.js';
import {PRODUCTS,availableProducts} from './Products.js';
import {bayX,workerSeat,loungeSpot,deskX,productPoint,rackPoint,shopLayout,shopObstacles,interiorWaypoints,roomOf,driveway,roadExit} from './ShopLayout.js';
export {bayX,loungeSpot} from './ShopLayout.js';
const palette=['#f06b50','#ffd25a','#58b9dc','#91b86b','#e899be','#faf6e8'];
const person=(x,z)=>({x,z,facing:0,walk:0,moving:false,phase:'idle',carrying:false,working:false,complaining:false,seated:false});

export class GarageModel{
  constructor(economy){this.economy=economy;this.reset();}
  reset(){this.navigation=new NavigationSystem();this.cars=[];this.workers=[];this.cashiers=[];this.city=new CityTrafficModel(this.economy.state);this.office=new OfficeModel(this.economy);this.it=new ITModel(this.economy);this.campus=new CampusModel(this.economy);this.logistics=new LogisticsModel(this.economy);this.orders=new OrdersModel(this.economy);this.weather=new WeatherModel(this.economy);this.stockOwners=new Map();this.rackOwners=new Map();this.nextId=0;this.arrival=1;this.time=0;this.events=[];this.payments=0;this.localSupply={};this.syncStaff();this.configureNavigation();}
  get cashier(){return this.cashiers[0];}
  workerHome(id){return workerSeat(id);}
  syncStaff(){
    while(this.workers.length<this.economy.state.workers){const id=this.workers.length,home=workerSeat(id);if(this.people().some(a=>Math.hypot(a.x-home.x,a.z-home.z)<.95))break;this.workers.push({...person(home.x,home.z),id,carId:null,seated:true,facing:home.facing,orderId:null});}
    while(this.cashiers.length<this.economy.state.cashiers){const id=this.cashiers.length;this.cashiers.push({...person(deskX(id),-8.2),id:`cashier-${id}`,index:id,carId:null});}
    this.logistics.sync(this);this.office.sync(this);this.it.sync(this);this.campus.sync(this);
  }
  configureNavigation(invalidate=true){
    const s=this.economy.state,l=shopLayout(s),obstacles=shopObstacles(s);
    for(const car of [...this.cars,...this.orders.couriers])if(car.z<driveway(s).front)obstacles.push(vehicleBounds(car));
    for(const truck of this.logistics.trucks)if(truck.z>l.plotBack-.5)obstacles.push(vehicleBounds(truck));
    this.navigation.configure(obstacles,{minX:s.garageLevel>=2?-12.6:-11,maxX:l.plotRight-.3,minZ:l.plotBack+.8,maxZ:driveway(s).front+.4},invalidate);this.navigation.roomOf=p=>roomOf(p,s);
    const portalX=(l.right+l.officeLeft)/2;this.navigation.roomBounds={lounge:{minX:l.left+.2,maxX:-2.7,minZ:l.back+.15,maxZ:l.front-.1},shop:{minX:-2.7,maxX:portalX,minZ:l.back,maxZ:l.front-.1},cl:{minX:-12.2,maxX:l.right-.2,minZ:l.clBack+.2,maxZ:l.back},office:{minX:portalX,maxX:l.officeRight-.15,minZ:l.officeBack,maxZ:l.officeFront},it:{minX:l.officeLeft+.2,maxX:l.officeRight-.15,minZ:l.itBack+.2,maxZ:l.itFront},yard:{minX:portalX,maxX:l.officeRight+.55,minZ:l.officeFront,maxZ:driveway(s).front+.35}};
    if(s.garageLevel>=8){this.navigation.roomBounds.yard.maxX=l.plotRight-.3;this.navigation.roomBounds.academy={minX:l.academyLeft,maxX:l.academyRight,minZ:-13.5,maxZ:1.6};}
    if(s.garageLevel>=14)this.navigation.roomBounds.factory={minX:l.academyLeft,maxX:l.factoryRight,minZ:-36,maxZ:-13.5};
    this.navSignature=this.layoutSignature();
  }
  layoutSignature(){const s=this.economy.state;return [s.garageLevel,s.bays,s.workers,s.logisticsWorkers,s.cashiers,s.storeExpansion,s.warehouseExpansion,s.officeComputers,s.businessArea,s.itWorkers,s.trainingLevel,s.productionLines].join(':');}
  move(actor,point,speed=1.25,via=[]){let cursor=actor;const path=[];for(const target of [...via,point]){path.push(...interiorWaypoints(cursor,target,this.economy.state));if(target!==point)path.push(target);cursor=target;}this.navigation.moveTo(actor,point.x,point.z,speed,path);}
  productivity(){const s=this.economy.state;return (1+s.productivity*.45)*(1+s.storeExpansion*.05+s.officeChairs*.05)*this.economy.trainingBonus();}
  claimStock(product,worker){if(this.stockOwners.has(product)&&this.stockOwners.get(product)!==worker)return false;this.stockOwners.set(product,worker);return true;}
  claimRack(index,worker){if(this.rackOwners.has(index)&&this.rackOwners.get(index)!==worker)return false;this.rackOwners.set(index,worker);return true;}
  releaseStations(){
    for(const [product,actor] of this.stockOwners)if(!['stock','picking','orderStock','orderPicking','refill','unloadStock'].includes(actor.phase)&&Math.hypot(actor.x-productPoint(product).x,actor.z-productPoint(product).z)>1.25)this.stockOwners.delete(product);
    for(const [index,actor] of this.rackOwners)if(!['toTruck','collecting','toFactory','collectFactory','toScan','scanning','toRack','storing','toWarehouse','collectStock','toAudit','auditing'].includes(actor.phase)&&Math.hypot(actor.x-rackPoint(index).x,actor.z-rackPoint(index).z)>1.25)this.rackOwners.delete(index);
  }
  spawn(){
    const access=driveway(this.economy.state);if(this.vehicles().some(v=>Math.hypot(v.x+58,v.z-access.arrival)<5.5))return;
    const s=this.economy.state,bay=Array.from({length:s.bays},(_,i)=>i).find(i=>!this.cars.some(c=>c.bay===i&&c.phase!=='gone'&&!(c.phase==='leaving'&&c.x>bayX(i)+4)));if(bay===undefined)return;
    const resumed=s.orders.find(o=>o.source==='counter'&&o.carId===null&&o.phase!=='delivered');const id=this.nextId++,keys=availableProducts(s),product=resumed?.product||keys[id%keys.length],motorcycle=product==='motoMirror',pickup=!!resumed||s.garageLevel>=2&&id%5===3;
    const car={id,bay,product,vehicleType:motorcycle?'moto':'car',halfLength:motorcycle?1.1:1.6,halfWidth:motorcycle?.49:.94,color:palette[id%palette.length],phase:'arriving',x:-58,z:access.arrival,facing:Math.PI/2,speed:0,isCar:true,glass:product==='glass'?0:1,progress:0,driver:{...person(0,0),id:`client-${id}`,visible:false},wait:0,patience:40+(id%4)*4,paid:false,complained:false,workerId:null,cashierId:null,pickup,bill:this.economy.saleValue(product)};
    if(pickup){const order=resumed||this.economy.createOrder(product,2,'counter',id);if(order){order.carId=id;car.orderId=order.id;car.bill=order.value;}else car.pickup=false;}
    travel(car,[[-58,access.arrival],[bayX(bay),access.arrival],[bayX(bay),-1.6]],5.2);this.cars.push(car);
  }
  sendToLounge(car){car.driver.phase='toLounge';car.driver.complaining=false;this.move(car.driver,loungeSpot(car.bay),1.25);}
  vehicles(){return [...this.cars,...this.orders.couriers,...this.city.cars,...this.logistics.trucks];}
  needsManeuver(car){const s=this.economy.state;return (typeof car.id==='number'||car.delivery)&&(['reversing'].includes(car.phase)||car.phase==='leaving'&&car.x<shopLayout(s).plotRight+3||car.phase==='arriving'&&car.z<driveway(s).arrival-.35);}
  maneuverAllowed(car){
    if(!this.needsManeuver(car))return true;
    const conflicts=this.vehicles().filter(v=>v!==car&&this.needsManeuver(v)&&Math.abs(v.x-car.x)<4.4&&Math.abs(v.z-car.z)<4.2);
    // Only nearby intersecting maneuvers share a reservation; different bays operate together.
    // Clear the departure lane before releasing another reverse or entry turn.
    // Waiting time breaks equal priorities; numeric arrival order stays stable.
    const priority=v=>v.phase==='leaving'?0:v.phase==='reversing'?1:2;
    const order=v=>v.maneuverSince??this.time;
    return !conflicts.some(v=>priority(v)<priority(car)||priority(v)===priority(car)&&(order(v)<order(car)||order(v)===order(car)&&String(v.id).localeCompare(String(car.id),undefined,{numeric:true})<0));
  }
  advanceVehicle(actor,dt){
    if(this.needsManeuver(actor))actor.maneuverSince??=this.time;else actor.maneuverSince=null;
    if(!this.maneuverAllowed(actor)){actor.speed=0;actor.moving=false;actor.waitReason='manobra';actor.stoppedFor=(actor.stoppedFor||0)+dt;return false;}
    const snapshot={...actor},vehicles=this.vehicles();actor.targetSpeed=signalSpeedLimit(actor,this.time,this.city.roads,vehicleSpeedLimit(actor,vehicles,(actor.baseSpeed??=actor.targetSpeed)*this.weather.roadSpeed));const complete=advance(actor,dt),body=vehicleBounds(actor);
    const red=!obeysSignals(snapshot,actor,this.time,this.city.roads),pedestrian=this.people().some(p=>touchesRectangle(p.x,p.z,actorRadius(p),body))||this.city.pedestrians.some(p=>touchesRectangle(p.x,p.z,.36,body)),traffic=vehicles.some(other=>other!==actor&&vehicleCollisionBlocks(snapshot,actor,other));
    if(red||pedestrian||traffic){Object.assign(actor,snapshot);actor.speed=0;actor.moving=false;actor.waitReason=red?'semáforo':pedestrian?'pedestre':'trânsito';actor.stoppedFor=(actor.stoppedFor||0)+dt;return false;}actor.waitReason=null;actor.stoppedFor=0;return complete;
  }
  people(){return [...this.cashiers,...this.workers,...this.logistics.workers,...this.office.people(),...this.it.workers,...this.campus.people(),...this.orders.workers(),...this.cars.filter(c=>c.driver.visible).map(c=>c.driver)];}
  finishWorker(worker){worker.working=false;worker.carrying=false;worker.carryingBox=false;worker.phase='returning';worker.stockAddress=null;this.move(worker,workerSeat(worker.id),this.productivity());}
  startRefill(worker){
    const s=this.economy.state,refilling=this.workers.filter(w=>['toWarehouse','collectStock','waitRefill','refill','unloadStock'].includes(w.phase));
    if(refilling.length>=Math.max(1,Math.ceil(this.workers.length/3)))return false;
    const required=product=>Math.max(4,this.economy.frontCapacity()/3,...s.orders.filter(o=>o.phase==='queued'&&o.product===product).map(o=>o.quantity-o.collected));
    const keys=availableProducts(s).sort((a,b)=>(this.economy.stock(a)-required(a))-(this.economy.stock(b)-required(b)));
    for(const product of keys){if(this.economy.stock(product)>required(product)||refilling.some(w=>w.refillProduct===product))continue;
      const index=this.economy.warehouseStock(product).map((units,i)=>({units,i})).filter(bin=>bin.units>0&&!this.rackOwners.has(bin.i)).sort((a,b)=>b.units-a.units)[0]?.i;if(index===undefined)continue;
      this.claimRack(index,worker);worker.phase='toWarehouse';worker.refillProduct=product;worker.product=product;worker.stockAddress=index;worker.carId=null;this.move(worker,rackPoint(index),this.productivity());return true;
    }return false;
  }
  tick(dt){
    if(!dt)return;this.time+=dt;this.weather.tick(dt);this.syncStaff();this.releaseStations();this.events=this.events.filter(e=>this.time-e.time<1.8);this.arrival-=dt;
    if(this.navSignature!==this.layoutSignature())this.configureNavigation();
    this.city.configure(this.economy.state);this.city.tick(dt,[...this.cars,...this.orders.couriers,...this.logistics.trucks],this.weather.roadSpeed);
    this.logistics.tick(dt,this);this.office.tick(dt,this);this.it.tick(dt,this);this.campus.tick(dt,this);this.orders.tick(dt,this);
    if(this.arrival<=0){this.spawn();this.arrival=this.economy.state.garageLevel===1?8:Math.max(3,9-this.economy.state.workers*.45);}
    for(const car of this.cars){
      if(car.phase==='arriving'&&this.advanceVehicle(car,dt)){const door={x:car.x-(car.vehicleType==='moto'?1:1.65),z:car.z-.05};if(this.people().some(a=>Math.hypot(a.x-door.x,a.z-door.z)<.95)){car.waitReason='desembarque';continue;}const order=this.economy.state.orders.find(o=>o.id===car.orderId);car.phase=car.pickup?(order?.phase==='counterReady'?'finished':'working'):'waiting';car.driver.x=car.x-(car.vehicleType==='moto'?1:1.65);car.driver.z=car.z-.05;car.driver.visible=true;this.configureNavigation();this.sendToLounge(car);}
      if(car.phase==='reversing'&&this.advanceVehicle(car,dt)){car.phase='leaving';travel(car,[[car.x,car.z],[car.x+2.2,driveway(this.economy.state).exit],[roadExit(this.economy.state),driveway(this.economy.state).exit]],4.6);car.baseSpeed=4.6;}
      if(car.phase==='leaving'&&this.advanceVehicle(car,dt))car.phase='gone';
    }
    this.configureNavigation(false);this.navigation.tick(this.people(),dt);const p=this.productivity(),s=this.economy.state;
    if(s.garageLevel<2)for(const product of availableProducts(s)){if(this.economy.stock(product)<=2){this.localSupply[product]=(this.localSupply[product]||0)+dt;if(this.localSupply[product]>12/(1+s.stockRacks*.5)){this.economy.setStock(product,this.economy.frontCapacity());this.localSupply[product]=0;this.economy.emit();}}else this.localSupply[product]=0;}
    for(const car of this.cars){const client=car.driver;if(!client.visible)continue;
      if(['waiting','working'].includes(car.phase))car.wait+=dt;client.angry=car.wait>car.patience&&!car.paid&&['waiting','working'].includes(car.phase);
      if(client.phase==='toLounge'&&client.reached){client.phase='waiting';client.seated=true;client.facing=loungeSpot(car.bay).facing;}
      if(client.angry&&!car.complained&&client.phase==='waiting'&&car.workerId!==null){const worker=this.workers[car.workerId];if(worker?.phase==='installing'){car.complained=true;client.phase='toComplain';this.move(client,{x:worker.x,z:worker.z+1.2},1.4);}}
      if(client.phase==='toComplain'&&client.reached){const worker=this.workers[car.workerId];client.phase='complaining';client.complaining=true;client.timer=3;client.facing=Math.atan2(worker.x-client.x,worker.z-client.z);}
      if(client.phase==='complaining'){client.timer-=dt;if(client.timer<=0&&car.phase!=='finished')this.sendToLounge(car);}
      if(client.phase==='toCashier'&&client.reached){client.phase='paying';client.facing=Math.PI;client.timer=1.8;this.cashiers[car.cashierId].phase='paying';}
      if(client.phase==='paying'){client.timer-=dt;if(client.timer<=0){const cashier=this.cashiers[car.cashierId];if(!car.paid){car.paid=true;this.economy.sale(car.bill);if(car.pickup){const order=s.orders.find(o=>o.id===car.orderId);if(order)this.economy.completeOrder(order,true);client.carryingBox=true;}this.payments++;this.events.push({id:`payment-${car.id}`,kind:'payment',x:(client.x+cashier.x)/2,z:(client.z+cashier.z)/2,time:this.time});}car.phase='boarding';client.phase='returning';client.angry=false;cashier.phase='idle';cashier.releaseAfter=client;this.move(client,{x:car.x-(car.vehicleType==='moto'?1:1.65),z:car.z-.05},1.3);}}
      if(client.phase==='returning'&&client.reached){client.visible=false;car.phase='reversing';travel(car,[[car.x,car.z],[car.x,driveway(s).exit]],1.6,true);car.baseSpeed=1.6;}
    }
    for(const cashier of this.cashiers){if(cashier.releaseAfter&&Math.hypot(cashier.releaseAfter.x-cashier.x,cashier.releaseAfter.z+5.9)>1.2){cashier.carId=null;cashier.releaseAfter=null;}if(cashier.carId!==null)continue;const car=this.cars.find(c=>c.phase==='finished'&&['waiting','toLounge','toComplain','complaining'].includes(c.driver.phase)&&!this.navigation.isCrossing(c.driver));if(car){cashier.carId=car.id;car.cashierId=cashier.index;car.phase='paying';car.driver.phase='toCashier';car.driver.complaining=false;car.driver.angry=false;this.move(car.driver,{x:cashier.x+(cashier.index===1?.18:0),z:-5.9},1.2);}}
    for(const worker of this.workers){const car=this.cars.find(c=>c.id===worker.carId);
      if(worker.phase==='idle'){
        if(s.garageLevel>=2&&this.startRefill(worker))continue;
        const job=this.cars.find(c=>!c.pickup&&c.phase==='waiting'&&this.economy.stock(c.product)>0&&!this.stockOwners.has(c.product));
        if(s.garageLevel>=2&&(worker.lastTask!=='order'||!job)&&this.orders.startJob(worker,this)){worker.lastTask='order';continue;}
        if(job&&this.claimStock(job.product,worker)){worker.lastTask='service';job.phase='working';job.workerId=worker.id;worker.carId=job.id;worker.product=job.product;worker.phase='stock';this.move(worker,productPoint(job.product),.95*p);}
      }
      else if(worker.phase==='stock'&&worker.reached){worker.phase='picking';worker.timer=2.2/(p*(1+s.tools*.3));worker.facing=Math.PI;}
      else if(worker.phase==='picking'){worker.timer-=dt;if(worker.timer<=0){if(!this.economy.consume(worker.product)){worker.timer=1;continue;}this.economy.emit();worker.carrying=true;worker.phase='toCar';this.move(worker,{x:bayX(car.bay)-(car.vehicleType==='moto'?1:1.65),z:-2.35},.9*p);}}
      else if(worker.phase==='toCar'&&worker.reached){worker.phase='installing';worker.working=true;worker.carrying=true;worker.facing=Math.PI/2;worker.duration=PRODUCTS[car.product].duration/(1+s.tools*.25);worker.timer=worker.duration;}
      else if(worker.phase==='installing'){worker.timer-=dt*p;car.progress=Math.min(1,1-worker.timer/worker.duration);if(car.product==='glass')car.glass=car.progress;if(worker.timer<=0){car.phase='finished';this.finishWorker(worker);}}
      else if(worker.phase==='toWarehouse'&&worker.reached){worker.phase='collectStock';worker.timer=2;worker.facing=Math.PI;worker.working=true;}
      else if(worker.phase==='collectStock'){worker.timer-=dt;if(worker.timer<=0){const stocks=this.economy.warehouseStock(worker.refillProduct);worker.units=Math.min(6+s.stockRacks*2,stocks[worker.stockAddress],this.economy.frontCapacity()-this.economy.stock(worker.refillProduct));stocks[worker.stockAddress]-=worker.units;this.economy.recordMovement('replenish',worker.refillProduct,worker.units,'A-'+String(worker.stockAddress+1).padStart(2,'0'),'Loja',String(worker.id));s.stockInTransit.push({worker:worker.id,product:worker.refillProduct,units:worker.units});this.economy.emit();worker.working=false;worker.carryingBox=true;worker.phase='waitRefill';this.move(worker,workerSeat(worker.id),p);}}
      else if(worker.phase==='waitRefill'&&this.claimStock(worker.refillProduct,worker)){worker.phase='refill';this.move(worker,productPoint(worker.refillProduct),.95*p);}
      else if(worker.phase==='refill'&&worker.reached){worker.phase='unloadStock';worker.working=true;worker.facing=Math.PI;worker.timer=2;}
      else if(worker.phase==='unloadStock'){worker.timer-=dt;if(worker.timer<=0){this.economy.replenish(worker.refillProduct,worker.units);s.stockInTransit=s.stockInTransit.filter(t=>t.worker!==worker.id);worker.units=0;worker.refillProduct=null;this.economy.emit();this.finishWorker(worker);}}
      else if(worker.phase==='returning'&&worker.reached){worker.phase='idle';worker.carId=null;worker.seated=true;worker.facing=workerSeat(worker.id).facing;}
    }
    const before=this.cars.length;this.cars=this.cars.filter(c=>c.phase!=='gone');if(before!==this.cars.length)this.configureNavigation();
  }
}

