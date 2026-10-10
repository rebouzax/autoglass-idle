import {activeStaff} from './Workforce.js';
import {itDesk,deploymentPoint,shopLayout} from './ShopLayout.js';
import {availableProducts} from './Products.js';

export class ITModel{
  constructor(economy){this.economy=economy;this.workers=[];this.signature='';this.orderClock=8;this.deployments=0;this.deployOwner=null;this.sales=0;}
  sync(sim){
    const s=this.economy.state;if(s.garageLevel<6)return;const signature=`${s.garageLevel}:${s.bays}`;
    if(this.signature&&this.signature!==signature)for(const w of this.workers){w.phase='returning';w.typing=false;w.working=false;sim.move(w,itDesk(s,w.index),1.3);}this.signature=signature;
    while(this.workers.length<activeStaff(s,'itWorker')){const index=this.workers.length,p=itDesk(s,index);if(sim.people().some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.95))break;this.workers.push({...p,id:`it-${index}`,index,phase:'coding',task:['commerce','security','analytics','cloud'][index%4],typing:true,seated:true,moving:false,walk:0,build:10+index*8});}
  }
  tick(dt,sim){
    const s=this.economy.state;if(s.garageLevel<6)return;this.sync(sim);if(!sim.clock.day)return;const speed=(1+s.itComputers*.25+s.servers*.12+s.automation*.1+s.cybersecurity*.06+s.cloudPlatform*.18)*this.economy.trainingBonus()*this.economy.teamEfficiency('itWorker');
    if(this.deployOwner&&!['toDeploy','deploying'].includes(this.deployOwner.phase)&&Math.hypot(this.deployOwner.x-deploymentPoint(s).x,this.deployOwner.z-deploymentPoint(s).z)>1.4)this.deployOwner=null;
    for(const w of this.workers){if(w.offDuty||w.commuting)continue;
      if(w.phase==='coding'){w.build-=dt*speed;if(w.build<=0&&!this.deployOwner){this.deployOwner=w;w.phase='toDeploy';w.typing=false;sim.move(w,deploymentPoint(s),1.25);}}
      else if(w.phase==='toDeploy'&&w.reached){w.phase='deploying';w.timer=3;w.working=true;w.facing=Math.PI;}
      else if(w.phase==='deploying'){w.timer-=dt*speed;if(w.timer<=0){this.deployments++;w.task=['commerce',...(s.cybersecurity?['security']:[]),...(s.dataAnalytics?['analytics']:[]),...(s.cloudPlatform?['cloud']:[])][this.deployments%(1+!!s.cybersecurity+!!s.dataAnalytics+!!s.cloudPlatform)];s.digitalReleases++;this.economy.emit();w.working=false;w.phase='returning';sim.events.push({id:`deploy-${this.deployments}`,kind:'deploy',x:w.x,z:w.z,time:sim.time});sim.move(w,itDesk(s,w.index),1.3);}}
      else if(w.phase==='returning'&&w.reached){w.phase='coding';w.typing=true;w.seated=true;w.facing=Math.PI;w.build=35+w.index*5;}
    }
    this.orderClock-=dt*this.economy.teamEfficiency('itWorker');if(this.orderClock<=0&&this.deployments>0&&s.orders.filter(o=>o.phase!=='delivered').length<this.economy.orderCapacity()-2){
      const keys=availableProducts(s),product=keys[this.sales%keys.length],order=this.economy.createOrder(product,2+this.sales%4,'online');
      if(order){this.sales++;const l=shopLayout(s);sim.events.push({id:`online-${order.id}`,kind:'online',x:l.officeLeft+4,z:-19,time:sim.time});this.orderClock=Math.max(5,30/((1+s.ecommerce*.3+s.onlineMarketing*.22+s.dataAnalytics*.18+s.cloudPlatform*.15+s.cybersecurity*.04)*Math.max(1,this.workers.length*.5)));}
    }
  }
  status(){return this.economy.state.garageLevel>=6?`${this.workers.length} devs · ${this.deployments} publicações`:'';}
}
