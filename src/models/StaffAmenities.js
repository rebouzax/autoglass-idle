import {staffFacilities} from './StaffFacilities.js';
import {staffTotal} from './Workforce.js';

export class StaffAmenities {
 constructor(staff){this.staff=staff;this.slots=[];}
 sync(layout){this.layout=layout;this.rooms=staffFacilities(layout);this.slots=this.rooms.flatMap(r=>r.slots);}
 release(r){if(r.amenity)this.staff.facilityOwners.delete(r.amenity.id);r.amenity=null;r.breakKind=null;}
 begin(r,sim){
  if(staffTotal(sim.economy.state)<=50||r.station?.y||!this.slots.length||r.orderId||r.invoiceId)return false;
  const role=r.role==='education'?'factoryWorker':r.role;
  const eventOpen=sim.time%240>=180&&sim.time%240<210,preferred=eventOpen&&r.number%3===0?'event':['canteen','water','toilet','lounge','garden','gym','shower'][Math.floor(sim.time/65+r.number)%7];
  const allowed=slot=>!['network','meeting','focus'].includes(slot.type)&&(slot.type!=='event'||eventOpen);
  const slot=this.slots.find(a=>a.role===role&&a.type===preferred&&allowed(a)&&!this.staff.facilityOwners.has(a.id))||this.slots.find(a=>a.role===role&&allowed(a)&&!this.staff.facilityOwners.has(a.id));
  if(!slot)return false;
  this.staff.facilityOwners.set(slot.id,r.id);r.amenity=slot;r.breakKind=slot.type;r.breakOrigin={x:r.x,z:r.z,y:r.y||0};r.task='rest';r.phase='toBreak';r.external=true;r.moving=false;r.calling=false;r.typing=false;r.carryingBox=false;
  const l=this.layout.workforce,ownGround=r.support&&!r.station?.y;
  r.breakRoute=ownGround?[[r.x,r.z],[r.station.x+1.32,r.z+.65],[r.station.x+1.32,slot.aisleZ],[slot.x,slot.aisleZ],[slot.x,slot.z]]:[[r.x,r.z],[l.left-2,r.z],[l.left-2,slot.aisleZ],[slot.x,slot.aisleZ],[slot.x,slot.z]];
  this.staff.setPath(r,r.breakRoute,2.3);return true;
 }
 tick(r,dt,sim,index){
  if(!['toBreak','break','fromBreak'].includes(r.phase))return false;
  if(r.phase==='toBreak'&&this.staff.moveExternal(r,dt,index,sim)){r.phase='break';r.path=null;r.moving=false;r.timer=r.breakKind==='gym'?18:8+r.number%9;r.facing=r.amenity.facing;}
  if(r.phase==='break'){
   r.timer-=dt;if(r.timer<=0){r.phase='fromBreak';this.staff.setPath(r,[[r.x,r.z],...r.breakRoute.slice(0,-1).reverse()],2.3);}
  }
  if(r.phase==='fromBreak'&&this.staff.moveExternal(r,dt,index,sim)){
   this.release(r);this.staff.economy.state.staffBreaks++;r.energyUntil=sim.time+120;r.nextBreak=sim.time+130+r.number%110;r.path=null;r.external=false;r.task='idle';r.timer=3;r.phase='working';r.moving=false;r.atWork=true;r.facing=Math.PI;
  }
  return true;
 }
}
