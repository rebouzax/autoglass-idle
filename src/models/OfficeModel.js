import {activeStaff} from './Workforce.js';
import {officeDesk,meetingSeat,shopLayout} from './ShopLayout.js';
import {availableProducts} from './Products.js';
const channels=[['branches',7],['fleet',8],['distribution',9],['insurance',10],['marketplace',11],['automation',12],['international',13],['manufacturing',14],['holding',15],['air',15],['maritime',16]];
const field=source=>source==='fleet'?'fleetContracts':source==='air'?'airCargo':source==='maritime'?'seaCargo':source;
export class OfficeModel{
 constructor(economy){this.economy=economy;this.workers=[];this.nextMeeting=20;this.guest=null;this.meeting=null;this.signature='';this.calls=0;this.nextChannel=0;}
 sync(sim){const s=this.economy.state;if(s.garageLevel<4)return;const signature=`${s.garageLevel}:${s.officeComputers}:${s.bays}`;
  if(this.signature&&signature!==this.signature&&sim){for(const w of this.workers){w.calling=false;w.typing=false;if(this.meeting&&['meeting','toMeeting'].includes(w.phase)){w.phase='toMeeting';sim.move(w,meetingSeat(s,0),1.15);}else{w.phase='returning';sim.move(w,officeDesk(s,w.index),1.15);}}if(this.guest){if(this.meeting){this.guest.phase='toMeeting';sim.move(this.guest,meetingSeat(s,1),1.1);}else{this.guest.phase='leaving';sim.move(this.guest,{x:shopLayout(s).officeRight-1.3,z:-.2},1.1);}}}
  while(this.workers.length<activeStaff(s,'salesWorker')){const index=this.workers.length,p=officeDesk(s,index);if(sim?.people().some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.95))break;this.workers.push({...p,id:`office-${index}`,index,phase:'typing',typing:true,seated:true,moving:false,walk:0,nextCall:8+index*9});}this.signature=signature;
 }
 people(){return [...this.workers,...(this.guest?[this.guest]:[])];}
 requestOrder(source,sim){const s=this.economy.state,keys=availableProducts(s),product=keys[this.calls++%keys.length],quantity=source==='meeting'?5+Math.min(3,s.businessArea):2+this.calls%3;
  if(source==='office'){const unlocked=channels.filter(([key,stage])=>s.garageLevel>=stage&&s[field(key)]>0);if(unlocked.length&&this.calls%2===0)source=unlocked[this.nextChannel++%unlocked.length][0];}
  const order=this.economy.createOrder(product,quantity,source);if(order)sim.events.push({id:`sale-call-${order.id}`,kind:'order',x:shopLayout(s).officeLeft+3,z:-2,time:sim.time});return order;
 }
 tick(dt,sim){
  const s=this.economy.state;if(s.garageLevel<4)return;this.sync(sim);if(!sim.clock.day){if(this.meeting){const manager=this.workers[0];manager.phase='returning';manager.calling=false;sim.move(manager,officeDesk(s,0),1.3);if(this.guest){this.guest.phase='leaving';sim.move(this.guest,{x:shopLayout(s).officeRight-1.3,z:-.2},1.2);}this.meeting=null;this.nextMeeting=30;}if(this.guest?.phase==='leaving'&&this.guest.reached){sim.navigation.cancel(this.guest);this.guest=null;}return;}this.nextMeeting-=dt;const manager=this.workers[0];if(!manager)return;const space=()=>s.orders.filter(o=>o.phase!=='delivered').length<this.economy.orderCapacity()-2;
  for(const w of this.workers){if(w.offDuty||w.commuting)continue;
   if(w.phase==='typing'){w.nextCall-=dt*(1+s.officeComputers*.12+s.networkHub*.1+s.dataAnalytics*.05)*this.economy.teamEfficiency('salesWorker');if(w.nextCall<=0&&space()){w.phase='calling';w.calling=true;w.typing=false;w.timer=7/(1+s.salesTraining*.25);}}
   else if(w.phase==='calling'){w.timer-=dt*(1+s.officeComputers*.12)*this.economy.trainingBonus()*this.economy.teamEfficiency('salesWorker');if(w.timer<=0){if(space())this.requestOrder('office',sim);w.phase='typing';w.calling=false;w.typing=true;w.nextCall=Math.max(10,35/(1+s.salesTraining*.2))+w.index*2;}}
   else if(w.phase==='returning'&&w.reached){w.phase='typing';w.seated=true;w.typing=true;w.facing=Math.PI;w.nextCall=15+w.index*4;}
  }
  if(s.businessArea&&this.nextMeeting<=0&&!this.meeting&&!this.guest&&manager.phase==='typing'&&space()){
   const l=shopLayout(s),p={x:l.officeRight-1.3,z:-.2};if(!sim.people().some(a=>Math.hypot(a.x-p.x,a.z-p.z)<1)){this.guest={...p,id:'business-guest',facing:0,phase:'toMeeting',seated:false,moving:false,walk:0};manager.phase='toMeeting';manager.typing=false;sim.move(manager,meetingSeat(s,0),1.15);sim.move(this.guest,meetingSeat(s,1),1.1);this.meeting={timer:9/(1+s.businessArea*.15)};}
  }
  for(const a of this.people())if(a.phase==='toMeeting'&&a.reached){a.phase='meeting';a.seated=true;a.facing=meetingSeat(s,a===manager?0:1).facing;}
  if(this.meeting&&manager.phase==='meeting'&&this.guest?.phase==='meeting'){this.meeting.timer-=dt*this.economy.teamEfficiency('salesWorker');if(this.meeting.timer<=0){if(space())this.requestOrder('meeting',sim);sim.events.push({id:`meeting-${this.calls}`,kind:'contract',x:shopLayout(s).officeLeft+5.9,z:-11.1,time:sim.time});manager.phase='returning';sim.move(manager,officeDesk(s,0),1.1);this.guest.phase='leaving';sim.move(this.guest,{x:shopLayout(s).officeRight-1.3,z:-.2},1.1);this.meeting=null;this.nextMeeting=65/(1+s.businessArea*.15);}}
  if(this.guest?.phase==='leaving'&&this.guest.reached){sim.navigation.cancel(this.guest);this.guest=null;}
 }
}
