import {travel} from './routes.js';
import {addresses,rackPoint,scanPoint,dockPoint} from './ShopLayout.js';

const receiverHome=id=>({x:-8.6+id*1.3,z:-19,facing:0});
export class LogisticsModel {
  constructor(economy){this.economy=economy;this.workers=[];this.truck=null;this.nextDelivery=2;this.deliveryId=0;this.dockOwner=null;this.received=0;}
  enabled(){return this.economy.state.garageLevel===3;}
  sync(){if(!this.enabled())return;while(this.workers.length<this.economy.state.logisticsWorkers){const id=this.workers.length;this.workers.push({...receiverHome(id),id:`cl-${id}`,index:id,phase:'idle',moving:false,walk:0,carryingBox:false,scanning:false,reached:true});}}
  freeAddress(){const stocks=this.economy.state.warehouseStocks;return addresses.findIndex((a,i)=>stocks[i]+this.workers.filter(w=>w.address===i&&w.phase!=='idle'&&w.phase!=='returning').reduce((sum,w)=>sum+(w.units||4),0)+4<=a.capacity);}
  spawnTruck(){const id=this.deliveryId++;this.truck={id:`delivery-${id}`,x:-58,z:-22.5,facing:Math.PI/2,isCar:true,halfLength:3.65,halfWidth:1.12,phase:'arriving',remaining:8,speed:0};travel(this.truck,[[-58,-22.5],[-14.3,-22.5],[-14.3,-15.2]],3.2);}
  tick(dt,simulation){
    if(!this.enabled())return;this.sync();this.nextDelivery-=dt;
    if(!this.truck&&this.nextDelivery<=0&&this.economy.warehouseTotal()<40&&this.freeAddress()>=0)this.spawnTruck();
    const truck=this.truck;
    if(truck?.phase==='arriving'&&simulation.advanceVehicle(truck,dt)){truck.phase='unloading';truck.speed=0;simulation.configureNavigation();}
    if(truck?.phase==='reversing'&&simulation.advanceVehicle(truck,dt)){truck.phase='leaving';travel(truck,[[truck.x,truck.z],[58,-22.5]],3.2);}
    if(truck?.phase==='leaving'&&simulation.advanceVehicle(truck,dt)){this.truck=null;this.nextDelivery=55;simulation.configureNavigation();}
    for(const worker of this.workers){
      if(worker.phase==='idle'&&truck?.phase==='unloading'&&truck.remaining>0&&this.dockOwner===null){
        const address=this.freeAddress();if(address<0)continue;worker.address=address;worker.units=4;worker.phase='toTruck';this.dockOwner=worker.id;truck.remaining--;simulation.move(worker,dockPoint,1.1);
      } else if(worker.phase==='toTruck'&&worker.reached){worker.phase='collecting';worker.timer=1.6;worker.working=true;worker.facing=-Math.PI/2;}
      else if(worker.phase==='collecting'){
        worker.timer-=dt;if(worker.timer<=0){worker.working=false;worker.carryingBox=true;worker.phase='toScan';this.dockOwner=null;simulation.move(worker,{x:scanPoint.x-.6+(worker.index%2)*1.3,z:scanPoint.z+(worker.index>=2?1.3:0)},1.05);}
      } else if(worker.phase==='toScan'&&worker.reached){worker.phase='scanning';worker.scanning=true;worker.facing=Math.PI;worker.timer=2;}
      else if(worker.phase==='scanning'){
        worker.timer-=dt;if(worker.timer<=0){worker.scanning=false;worker.phase='toRack';simulation.move(worker,rackPoint(worker.address),1.05);}
      } else if(worker.phase==='toRack'&&worker.reached){worker.phase='storing';worker.working=true;worker.facing=Math.PI;worker.timer=1.6;}
      else if(worker.phase==='storing'){
        worker.timer-=dt;if(worker.timer<=0){this.economy.state.warehouseStocks[worker.address]+=worker.units;this.received+=worker.units;worker.carryingBox=false;worker.working=false;worker.phase='returning';worker.units=0;worker.address=null;this.economy.emit();simulation.move(worker,receiverHome(worker.index),1.15);}
      } else if(worker.phase==='returning'&&worker.reached){worker.phase='idle';worker.facing=0;}
    }
    if(truck?.phase==='unloading'&&truck.remaining===0&&!this.workers.some(w=>!['idle','returning'].includes(w.phase))){truck.phase='reversing';travel(truck,[[truck.x,truck.z],[truck.x,-22.5],[truck.x-3,-22.5]],1.7,true);simulation.configureNavigation();}
  }
  status(){if(!this.enabled())return '';return !this.truck?'Aguardando entrega':this.truck.phase==='arriving'?'Caminhão a caminho':this.truck.phase==='unloading'?'Recebimento e endereçamento':'Caminhão saindo';}
}
