// Shared furniture and walking destinations: the simulation never guesses seat positions.
export function staffFacilities(layout){
 const l=layout.workforce;if(!l)return [];
 const roles=['worker','logistics','salesWorker','cashier','itWorker','factoryWorker'];
 const kinds=[['canteen','toilet','water','lounge'],['canteen','shower','toilet','lounge'],['meeting','focus','water','lounge'],['canteen','toilet','meeting','lounge'],['network','focus','gym','lounge'],['shower','gym','canteen','toilet']];
 const count=l.zoneWidth>20?4:2,result=[];
 for(let zone=0;zone<6;zone++){
  const front=l.front-(zone>2?l.top:0),left=l.left+(zone%3)*l.zoneWidth;
  for(let j=0;j<count;j++){
   const type=kinds[zone][j],width=(l.zoneWidth-2)/count,x=left+1+width*(j+.5),z=front-4.7;
   const room={id:`facility-${zone}-${j}`,role:roles[zone],type,x,z,width,front:front-.9,back:front-8.3,aisleZ:front-10.2,slots:[]};
   for(let k=0;k<2;k++)room.slots.push({id:room.id+'-'+k,type,roomId:room.id,role:room.role,x:x+(k?1:-1)*.9,z:z-1.05,y:0,facing:0,aisleZ:room.aisleZ});
   result.push(room);
  }
 }
 return result;
}
