import {advance,travel} from './routes.js';
import {NavigationSystem,touchesRectangle,actorRadius} from './NavigationSystem.js';
import {CityTrafficModel,vehicleBounds,vehiclesOverlap,obeysSignals,followsTooClosely} from './CityTrafficModel.js';
import {LogisticsModel} from './LogisticsModel.js';
import {bayX,workerSeat,loungeSpot,deskX,stockPoint,frontDoor,clDoor,rackPoint,shopLayout,shopObstacles} from './ShopLayout.js';
export {bayX,loungeSpot} from './ShopLayout.js';
const palette=['#f06b50','#ffd25a','#58b9dc','#91b86b','#e899be','#faf6e8'];
const person=(x,z)=>({x,z,facing:0,walk:0,moving:false,phase:'idle',carrying:false,working:false,complaining:false,seated:false});

export class GarageModel {
  constructor(economy){this.economy=economy;this.navigation=new NavigationSystem();this.reset();}
  reset(){this.cars=[];this.workers=[];this.cashiers=[];this.city=new CityTrafficModel();this.logistics=new LogisticsModel(this.economy);this.nextId=0;this.arrival=1;this.time=0;this.events=[];this.payments=0;this.localSupplyTimer=0;this.syncStaff();this.configureNavigation();}
  get cashier(){return this.cashiers[0];}
  workerHome(id){return workerSeat(id);}
  syncStaff(){
    while(this.workers.length<this.economy.state.workers){const id=this.workers.length,home=workerSeat(id);this.workers.push({...person(home.x,home.z),id,carId:null,seated:true,facing:home.facing});}
    while(this.cashiers.length<this.economy.state.cashiers){const id=this.cashiers.length;this.cashiers.push({...person(deskX(id),-8.2),id:`cashier-${id}`,index:id,carId:null});}
    this.logistics.sync();
  }
  configureNavigation(invalidate=true){
    const s=this.economy.state,l=shopLayout(s),obstacles=shopObstacles(s);
    for(const car of this.cars)if(car.z<6.5)obstacles.push(vehicleBounds(car));
    const truck=this.logistics.truck;if(truck&&truck.z>-20.3)obstacles.push(vehicleBounds(truck));
    this.navigation.configure(obstacles,{minX:s.garageLevel===3?-13:-11,maxX:l.right+.7,minZ:s.garageLevel===3?-20.1:-9.05,maxZ:6.5},invalidate);
    this.navSignature=`${s.garageLevel}:${s.cashiers}`;
  }
  move(actor,point,speed=1.25,via=[]){this.navigation.moveTo(actor,point.x,point.z,speed,via);}
  productivity(){return 1+this.economy.state.productivity*.25;}
  spawn(){
    const bay=Array.from({length:this.economy.state.bays},(_,i)=>i).find(i=>!this.cars.some(car=>car.bay===i&&!['leaving','gone'].includes(car.phase)));if(bay===undefined)return;
    const id=this.nextId++,car={id,bay,color:palette[id%palette.length],phase:'arriving',x:-58,z:8.5,facing:Math.PI/2,speed:0,isCar:true,glass:0,progress:0,driver:{...person(0,0),id:`client-${id}`,visible:false},wait:0,patience:30+(id%4)*4,paid:false,complained:false,workerId:null,cashierId:null};
    travel(car,[[-58,8.5],[bayX(bay),8.5],[bayX(bay),-1.6]],5.5);this.cars.push(car);
  }
  sendToLounge(car){car.driver.phase='toLounge';car.driver.complaining=false;this.move(car.driver,loungeSpot(car.bay),1.25,[{x:frontDoor.x,z:4.15},{x:frontDoor.x,z:2.1}]);}
  vehicles(){return [...this.cars,...this.city.cars,...(this.logistics.truck?[this.logistics.truck]:[])];}
  advanceVehicle(actor,dt){
    const snapshot={...actor},complete=advance(actor,dt),body=vehicleBounds(actor);
    const blocked=!obeysSignals(snapshot,actor,this.time)||this.people().some(p=>touchesRectangle(p.x,p.z,actorRadius(p),body))||this.city.pedestrians.some(p=>touchesRectangle(p.x,p.z,actor.halfLength?1.15:.34,body))||this.vehicles().some(other=>other!==actor&&(vehiclesOverlap(actor,other)||(!actor.reversing&&followsTooClosely(actor,other))));
    if(blocked){Object.assign(actor,snapshot);actor.speed=0;actor.moving=false;return false;}return complete;
  }
  advanceCar(car,dt){return this.advanceVehicle(car,dt);}
  people(){return [...this.cashiers,...this.workers,...this.logistics.workers,...this.cars.filter(car=>car.driver.visible).map(car=>car.driver)];}
  finishWorker(worker){worker.working=false;worker.carrying=false;worker.carryingBox=false;worker.phase='returning';this.move(worker,workerSeat(worker.id),1*this.productivity());}
  startRefill(worker){
    const s=this.economy.state,index=s.warehouseStocks.findIndex(n=>n>0);if(index<0)return false;
    worker.phase='toWarehouse';worker.stockAddress=index;worker.carId=null;this.move(worker,rackPoint(index),1*this.productivity(),[clDoor,{x:clDoor.x,z:-10.1}]);return true;
  }
  tick(dt){
    if(!dt)return;this.time+=dt;this.syncStaff();this.events=this.events.filter(event=>this.time-event.time<1.3);this.arrival-=dt;
    if(this.navSignature!==`${this.economy.state.garageLevel}:${this.economy.state.cashiers}`)this.configureNavigation();
    this.city.tick(dt,[...this.cars,...(this.logistics.truck?[this.logistics.truck]:[])]);
    this.logistics.tick(dt,this);
    if(this.arrival<=0){this.spawn();this.arrival=this.economy.state.garageLevel===1?9:7;}
    for(const car of this.cars){
      if(car.phase==='arriving'&&this.advanceCar(car,dt)){car.phase='waiting';car.driver.x=car.x-1.65;car.driver.z=car.z-.05;car.driver.visible=true;this.configureNavigation();this.sendToLounge(car);}
      if(car.phase==='reversing'&&this.advanceCar(car,dt)){car.phase='leaving';travel(car,[[car.x,car.z],[58,8.5]],5.5);}
      if(car.phase==='leaving'){if(this.advanceCar(car,dt))car.phase='gone';}
    }
    this.configureNavigation(false);this.navigation.tick(this.people(),dt);const p=this.productivity(),s=this.economy.state;
    // Small stores replenish their local supply; the expanded store relies on CL stock.
    if(s.garageLevel<3&&s.frontStock<=2){this.localSupplyTimer+=dt;if(this.localSupplyTimer>12){s.frontStock=this.economy.frontCapacity();this.localSupplyTimer=0;this.economy.emit();}}else this.localSupplyTimer=0;
    for(const car of this.cars){
      const client=car.driver;if(!client.visible)continue;
      if(!['finished','paying','boarding','reversing','leaving'].includes(car.phase))car.wait+=dt;
      client.angry=car.wait>car.patience&&!car.paid&&['waiting','working'].includes(car.phase);
      if(client.phase==='toLounge'&&client.reached){client.phase='waiting';client.seated=true;client.facing=loungeSpot(car.bay).facing;}
      if(client.angry&&!car.complained&&client.phase==='waiting'&&car.workerId!==null){const worker=this.workers[car.workerId];if(worker?.phase==='installing'){car.complained=true;client.phase='toComplain';this.move(client,{x:worker.x,z:worker.z+1.05},1.4,[{x:-6.1,z:4.15},{x:worker.x,z:4.15}]);}}
      if(client.phase==='toComplain'&&client.reached){const worker=this.workers[car.workerId];client.phase='complaining';client.complaining=true;client.timer=3;client.facing=Math.atan2(worker.x-client.x,worker.z-client.z);}
      if(client.phase==='complaining'){client.timer-=dt;if(client.timer<=0||car.phase==='finished')this.sendToLounge(car);}
      if(car.phase==='finished'&&client.phase==='toComplain')this.sendToLounge(car);
      if(client.phase==='toCashier'&&client.reached){client.phase='paying';client.facing=Math.PI;client.timer=1.8;this.cashiers[car.cashierId].phase='paying';}
      if(client.phase==='paying'){
        client.timer-=dt;if(client.timer<=0){const cashier=this.cashiers[car.cashierId];if(!car.paid){car.paid=true;this.economy.sale(32+(car.id%3)*4+(s.garageLevel-1)*9);this.payments++;this.events.push({id:`payment-${car.id}`,kind:'payment',x:(client.x+cashier.x)/2,z:(client.z+cashier.z)/2,time:this.time});}
          car.phase='boarding';client.phase='returning';client.angry=false;cashier.phase='idle';cashier.carId=null;this.move(client,{x:car.x-1.65,z:car.z-.05},1.3,[{x:frontDoor.x,z:2.1},{x:frontDoor.x,z:4.15},{x:car.x-1.65,z:4.15}]);
        }
      }
      if(client.phase==='returning'&&client.reached){client.visible=false;car.phase='reversing';travel(car,[[car.x,car.z],[car.x,8.5],[car.x-2.3,8.5]],1.5,true);}
    }
    for(const cashier of this.cashiers)if(cashier.carId===null){const car=this.cars.find(c=>c.phase==='finished'&&c.driver.phase==='waiting');if(car){cashier.carId=car.id;car.cashierId=cashier.index;car.phase='paying';car.driver.phase='toCashier';this.move(car.driver,{x:cashier.x,z:-5.9},1.2);}}
    for(const worker of this.workers){
      const car=this.cars.find(c=>c.id===worker.carId);
      if(worker.phase==='idle'){
        const restocking=this.workers.some(w=>['toWarehouse','collectStock','refill','unloadStock'].includes(w.phase));
        if(s.garageLevel===3&&s.frontStock<=3&&!restocking&&this.startRefill(worker))continue;
        const reserved=this.workers.filter(w=>['stock','picking'].includes(w.phase)).length;
        const job=this.cars.find(c=>c.phase==='waiting'&&['waiting','toLounge'].includes(c.driver.phase));
        if(job&&s.frontStock>reserved){job.phase='working';job.workerId=worker.id;worker.carId=job.id;worker.phase='stock';this.move(worker,stockPoint,.95*p);}
      } else if(worker.phase==='stock'&&worker.reached){worker.phase='picking';worker.timer=2.2/p;worker.facing=-Math.PI/2;}
      else if(worker.phase==='picking'){worker.timer-=dt;if(worker.timer<=0){s.frontStock--;this.economy.emit();worker.carrying=true;worker.phase='toCar';this.move(worker,{x:bayX(car.bay)-1.65,z:-2.35},.9*p,[{x:bayX(car.bay)-1.65,z:4.15}]);}}
      else if(worker.phase==='toCar'&&worker.reached){worker.phase='installing';worker.working=true;worker.carrying=false;worker.facing=Math.PI/2;worker.timer=24;worker.duration=24;}
      else if(worker.phase==='installing'){worker.timer-=dt*p;car.progress=Math.min(1,1-worker.timer/worker.duration);car.glass=car.progress;if(worker.timer<=0){car.phase='finished';this.finishWorker(worker);}}
      else if(worker.phase==='toWarehouse'&&worker.reached){worker.phase='collectStock';worker.timer=2;worker.facing=Math.PI;worker.working=true;}
      else if(worker.phase==='collectStock'){
        worker.timer-=dt;if(worker.timer<=0){worker.units=Math.min(6,s.warehouseStocks[worker.stockAddress],this.economy.frontCapacity()-s.frontStock);s.warehouseStocks[worker.stockAddress]-=worker.units;this.economy.emit();worker.working=false;worker.carryingBox=true;worker.phase='refill';this.move(worker,stockPoint,.95*p,[{x:clDoor.x,z:-10.1},clDoor]);}
      } else if(worker.phase==='refill'&&worker.reached){worker.phase='unloadStock';worker.working=true;worker.facing=-Math.PI/2;worker.timer=2;}
      else if(worker.phase==='unloadStock'){worker.timer-=dt;if(worker.timer<=0){s.frontStock=Math.min(this.economy.frontCapacity(),s.frontStock+worker.units);worker.units=0;this.economy.emit();this.finishWorker(worker);}}
      else if(worker.phase==='returning'&&worker.reached){worker.phase='idle';worker.carId=null;worker.seated=true;worker.facing=workerSeat(worker.id).facing;}
    }
    const before=this.cars.length;this.cars=this.cars.filter(c=>c.phase!=='gone');if(before!==this.cars.length)this.configureNavigation();
  }
}
