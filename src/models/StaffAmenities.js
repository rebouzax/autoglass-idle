import {staffFacilities} from './StaffFacilities.js';

export class StaffAmenities {
 constructor(staff){this.staff=staff;this.slots=[];}
 sync(layout){this.layout=layout;this.rooms=staffFacilities(layout);this.slots=this.rooms.flatMap(r=>r.slots);}
 release(r){if(r.amenity)this.staff.facilityOwners.delete(r.amenity.id);r.amenity=null;r.breakKind=null;}
 begin(r,sim,afterWork=false){
  if(r.station?.y||!this.slots.length||r.orderId||r.invoiceId)return false;
  const role=r.role==='education'?'factoryWorker':r.role;
  const evening=!sim.clock.day&&sim.clock.hour<22;
  const preferred=afterWork?['factoryWorker','education'].includes(r.role)?'shower':evening&&r.number%7===0?'gym':null:['canteen','water','toilet','lounge'][Math.floor(sim.time/65+r.number)%4];
  if(afterWork&&!preferred)return false;
  const allowed=slot=>!['network','meeting','focus'].includes(slot.type)&&(!afterWork||slot.type===preferred);
  const slot=this.slots.find(a=>a.role===role&&a.type===preferred&&!this.staff.facilityOwners.has(a.id))||this.slots.find(a=>a.role===role&&allowed(a)&&!this.staff.facilityOwners.has(a.id))||(afterWork?this.slots.find(a=>a.type===preferred&&!this.staff.facilityOwners.has(a.id)):null);
  if(!slot)return false;
  this.staff.facilityOwners.set(slot.id,r.id);r.amenity=slot;r.breakKind=slot.type;r.afterBreak=afterWork;r.breakOrigin={x:r.x,z:r.z,y:r.y||0};r.task='rest';r.phase='toBreak';r.external=true;r.moving=false;r.calling=false;r.typing=false;r.carryingBox=false;
  const l=this.layout.workforce,ownGround=r.support&&!r.station?.y;
  r.breakRoute=ownGround?[[r.x,r.z],[r.station.x+1.32,r.z+.65],[r.station.x+1.32,slot.aisleZ],[slot.x,slot.aisleZ],[slot.x,slot.z]]:[[r.x,r.z],[l.left-2,r.z],[l.left-2,slot.aisleZ],[slot.x,slot.aisleZ],[slot.x,slot.z]];
  this.staff.setPath(r,r.breakRoute,2.3);return true;
 }
 tick(r,dt,sim,index){
  if(!['toBreak','break','fromBreak'].includes(r.phase))return false;
  if(r.phase==='toBreak'&&this.staff.moveExternal(r,dt,index,sim)){r.phase='break';r.path=null;r.moving=false;r.timer=r.breakKind==='gym'?18:8+r.number%9;r.facing=r.amenity.facing;}
  if(r.phase==='break'){
   r.timer-=dt;if(r.timer<=0){this.staff.releaseBreakAt=sim.time;this.staff.economy.state.staffBreaks++;r.energyUntil=sim.time+120;r.nextBreak=sim.time+90+r.number%85;r.phase='fromBreak';this.release(r);this.staff.setPath(r,[[r.x,r.z],...r.breakRoute.slice(0,-1).reverse()],2.3);}
  }
  if(r.phase==='fromBreak'&&this.staff.moveExternal(r,dt,index,sim)){
   const after=r.afterBreak;r.afterBreak=false;r.path=null;r.external=after;r.task='idle';r.timer=3;
   if(after)this.staff.leaveGround(r,this.layout);else{r.phase='working';r.moving=false;r.atWork=true;r.facing=Math.PI;}
  }
  return true;
 }
}
