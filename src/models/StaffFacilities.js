// Shared furniture and walking destinations: the simulation never guesses seat positions.
export function staffFacilities(layout){
 const l=layout.workforce;if(!l?.amenities)return [];
 const kinds={worker:['canteen','toilet','water','event'],logistics:['canteen','shower','toilet','garden'],salesWorker:['meeting','focus','water','lounge'],cashier:['canteen','toilet','meeting','lounge'],itWorker:['network','focus','gym','garden'],factoryWorker:['shower','gym','canteen','toilet']};
 const count=l.zoneWidth>20?4:2,result=[];
 for(const [zone,department] of l.zones.entries()){
  const {front,left,role}=department;
  for(let j=0;j<count;j++){
   const type=kinds[role][j],width=(l.zoneWidth-2)/count,x=left+1+width*(j+.5),z=front-4.7;
   const room={id:`facility-${zone}-${j}`,role,type,x,z,width,front:front-.9,back:front-8.3,aisleZ:front-10.2,slots:[]};
   for(let k=0;k<2;k++)room.slots.push({id:room.id+'-'+k,type,roomId:room.id,role:room.role,x:x+(k?1:-1)*.9,z:z-1.05,y:0,facing:0,aisleZ:room.aisleZ});
   result.push(room);
  }
 }
 return result;
}
