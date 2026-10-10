import {availableProducts} from './Products.js';
import {getAddresses} from './ShopLayout.js';
import {freightRoute} from './CargoRoutes.js';
import {travel} from './routes.js';

/** Local robotic lanes and cargo terminals have independent reservations. */
export class AdvancedOperationsModel {
  constructor(economy){this.economy=economy;this.robots=[];this.trucks=[];this.transports={air:null,maritime:null};this.clocks={air:9,maritime:17};this.sequence=0;}
  tick(dt,sim){
    const s=this.economy.state;
    if(s.garageLevel>=10&&!this.robotPaused){
      const count=Math.max(1,s.clRobots);
      while(this.robots.length<count)this.robots.push({id:'robot-'+this.robots.length,index:this.robots.length,phase:'idle',timer:0,progress:0});
      for(const robot of this.robots){
        if(robot.phase==='idle'){
          const candidates=availableProducts(s).map(product=>({product,need:this.economy.frontCapacity()-this.economy.stock(product)-s.stockInTransit.filter(t=>t.product===product).reduce((n,t)=>n+t.units,0)})).filter(v=>v.need>=3).sort((a,b)=>this.economy.stock(a.product)-this.economy.stock(b.product));
          for(const {product,need} of candidates){
            const address=getAddresses(s).findIndex((a,i)=>this.economy.warehouseStock(product)[i]>0&&!sim.rackOwners.has(i));if(address<0)continue;
            const units=Math.min(4,need,this.economy.warehouseStock(product)[address]);
            this.economy.warehouseStock(product)[address]-=units;s.stockInTransit.push({worker:robot.id,product,units});
            Object.assign(robot,{product,units,address,phase:'collecting',timer:3,progress:0});this.economy.emit();break;
          }
        }else{
          robot.timer-=dt*(1+s.wmsLevel*.08+s.automation*.08);
          if(robot.phase==='collecting'&&robot.timer<=0){robot.phase='transporting';robot.timer=9;}
          else if(robot.phase==='transporting'){robot.progress=Math.max(0,Math.min(1,1-robot.timer/9));if(robot.timer<=0){robot.phase='unloading';robot.timer=2;}}
          else if(robot.phase==='unloading'&&robot.timer<=0){
            const units=Math.min(robot.units,this.economy.frontCapacity()-this.economy.stock(robot.product));
            this.economy.replenish(robot.product,units);this.economy.warehouseStock(robot.product)[robot.address]+=robot.units-units;
            if(units){s.robotMoves+=units;this.economy.recordMovement('replenish',robot.product,units,getAddresses(s)[robot.address].id,'Loja / esteira WMS',robot.id);}
            s.stockInTransit=s.stockInTransit.filter(t=>t.worker!==robot.id);robot.phase='returning';robot.timer=9;this.economy.emit();
          }else if(robot.phase==='returning'){robot.progress=Math.max(0,robot.timer/9);if(robot.timer<=0){robot.phase='idle';robot.progress=0;}}
        }
      }
    }
    for(const channel of ['air','maritime']){
      if(s.garageLevel<(channel==='air'?15:16))continue;
      const level=channel==='air'?s.airCargo:s.seaCargo;this.clocks[channel]-=dt;
      if(this.clocks[channel]<=0&&s.orders.filter(o=>o.phase!=='delivered').length<this.economy.orderCapacity()-2){
        const products=availableProducts(s),product=products[this.sequence++%products.length];
        if(this.economy.createOrder(product,channel==='air'?4:6,channel))this.clocks[channel]=Math.max(18,70/(1+level*.3+s.globalTrade*.2+s.networkHub*.08));
      }
      let transport=this.transports[channel];
      if(!transport){
        const limit=Math.max(1,Math.min(4,1+level)),orders=s.orders.filter(o=>o.source===channel&&o.phase==='packed'&&!o.transportId).slice(0,limit);
        if(!orders.length)continue;
        transport={id:channel+'-'+this.sequence++,phase:'transfer',elapsed:0,orders:orders.map(o=>o.id),progress:0};this.transports[channel]=transport;
        const points=freightRoute(s,channel),truck={id:'freight-'+transport.id,channel,phase:'companyLoading',x:points[0][0],z:points[0][1],facing:0,isCar:true,halfLength:3.65,halfWidth:1.12,speed:0,remaining:0,timer:6};
        this.trucks.push(truck);transport.truckId=truck.id;
        for(const order of orders){order.transportId=transport.id;order.phase=channel==='air'?'airTransfer':'seaTransfer';}this.economy.emit();
      }
      const truck=this.trucks.find(t=>t.id===transport.truckId);
      if(truck){
        if(truck.phase==='companyLoading'){truck.timer-=dt;truck.remaining=Math.ceil(8*(1-Math.max(0,truck.timer/6)));if(truck.timer<=0){truck.phase='toTerminal';travel(truck,freightRoute(s,channel),4.8);for(const id of transport.orders){const order=s.orders.find(o=>o.id===id);if(order)this.economy.recordMovement('transfer',order.product,order.quantity,'Embalagem',channel==='air'?'Caminhão / aeroporto':'Caminhão / porto','#'+id);}}}
        else if(truck.phase==='toTerminal'&&sim.advanceVehicle(truck,dt)){truck.phase='unloading';truck.timer=8;}
        else if(truck.phase==='unloading'){
          truck.timer-=dt;truck.remaining=Math.ceil(8*Math.max(0,truck.timer/8));
          if(truck.timer<=0){transport.phase='loading';transport.elapsed=0;truck.phase='returning';travel(truck,freightRoute(s,channel,true),4.8);for(const id of transport.orders){const order=s.orders.find(o=>o.id===id);if(order){order.phase=channel==='air'?'airLoading':'seaLoading';this.economy.recordMovement('transfer',order.product,order.quantity,'Caminhão',channel==='air'?'Embarque aéreo':'Contêiner / porto','#'+id);}}this.economy.emit();}
        }else if(truck.phase==='returning'&&sim.advanceVehicle(truck,dt))this.trucks=this.trucks.filter(t=>t!==truck);
      }
      if(transport.phase==='transfer')continue;
      transport.elapsed+=dt*(1+level*.12+s.globalTrade*.05);
      if(transport.phase==='loading'){
        transport.progress=Math.min(1,transport.elapsed/12);
        if(transport.elapsed>=12){transport.phase='departing';transport.elapsed=0;transport.progress=0;for(const id of transport.orders){const order=s.orders.find(o=>o.id===id);if(order)order.phase=channel==='air'?'airTransit':'seaTransit';}this.economy.emit();}
      }else if(transport.phase==='departing'){
        const duration=channel==='air'?30:55;transport.progress=Math.min(1,transport.elapsed/duration);
        if(transport.elapsed>=duration){
          for(const id of transport.orders){const order=s.orders.find(o=>o.id===id);if(order){this.economy.completeOrder(order);if(channel==='air')s.airShipments++;else s.seaShipments++;}}
          transport.phase='turning';transport.elapsed=0;transport.progress=0;this.economy.emit();
        }
      }else{
        const duration=transport.phase==='turning'?(channel==='air'?20:8):transport.phase==='returning'?(channel==='air'?32:55):8;
        transport.progress=Math.min(1,transport.elapsed/duration);
        if(transport.elapsed>=duration){transport.phase=transport.phase==='turning'?'returning':transport.phase==='returning'&&channel==='maritime'?'berthing':'idle';transport.elapsed=0;transport.progress=0;if(transport.phase==='idle'&&!this.trucks.some(t=>t.id===transport.truckId))this.transports[channel]=null;}
      }
    }
  }
}
