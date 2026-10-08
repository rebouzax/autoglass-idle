import {rectangle} from './NavigationSystem.js';

export const bayX=index=>1.25+index*3.6;
export const workerSeat=index=>({x:index===3?15:bayX(index)+1.05,z:-7.6,facing:0});
export const drawerX=index=>index===3?14:bayX(index)-1;
export const loungeSpot=index=>({x:-8.7,z:-4.1+index*1.5,facing:Math.PI/2});
export const deskX=index=>[-8.15,-5.8,-3.55][index];
export const stockPoint={x:.05,z:-5.75};
export const frontDoor={x:-6.1,z:3.2};
export const clDoor={x:13.1,z:-9.2};
export const scanPoint={x:-7.6,z:-14.6};
export const dockPoint={x:-11.7,z:-15.2};
export const addresses=Array.from({length:6},(_,i)=>({id:`A-${String(i+1).padStart(2,'0')}`,x:[-3.8,3.2,10.2][i%3],z:i<3?-17.5:-12.4,capacity:12}));
export const rackPoint=index=>({x:addresses[index].x,z:addresses[index].z+1.25});
export function shopLayout(state){
  return {left:-10.3,right:state.garageLevel===1?5.45:16.25,front:3.2,back:-9.2,clBack:-20.3,stage:state.garageLevel,plotLeft:state.garageLevel===3?-17.5:-11.4,plotRight:state.garageLevel===1?6.7:18,plotBack:state.garageLevel===3?-21:-10.5};
}
export function shopObstacles(state){
  const l=shopLayout(state),o=[rectangle(l.left,-3,.22,12.4),rectangle(l.right,-3,.22,12.4)];
  // The lounge has a real entrance in its front wall and an internal doorway.
  o.push(rectangle(-2.7,-4.1,.2,10.2),rectangle(-2.7,3.04,.2,.3));
  o.push(rectangle(-8.85,3.2,2.9,.2),rectangle(-3.75,3.2,2.1,.2));
  if(l.stage<3)o.push(rectangle((l.left+l.right)/2,l.back,l.right-l.left,.24));
  else {
    o.push(rectangle((l.left+11.7)/2,l.back,11.7-l.left,.24),rectangle((14.5+l.right)/2,l.back,l.right-14.5,.24));
    o.push(rectangle((l.left+l.right)/2,l.clBack,l.right-l.left,.24),rectangle(l.right,-14.75,.22,11.1));
    o.push(rectangle(l.left,-18.4,.22,3.8),rectangle(l.left,-11.3,.22,4.2));
    for(const rack of addresses)o.push(rectangle(rack.x,rack.z,3.1,1.05));
    o.push(rectangle(-7.6,-16.05,2.4,.8));
  }
  for(let i=0;i<state.cashiers;i++)o.push(rectangle(deskX(i),-7.05,1.65,.75));
  // Only the back of each chair is solid; its reserved seat is an actor target.
  for(let i=0;i<state.bays;i++)o.push(rectangle(loungeSpot(i).x-.65,loungeSpot(i).z,.13,.8));
  for(let i=0;i<(state.garageLevel===1?1:4);i++){
    const seat=workerSeat(i);o.push(rectangle(seat.x,seat.z-.65,.8,.13),rectangle(drawerX(i),-8,.58,.65));
  }
  o.push(rectangle(-.9,-5.75,.65,1.65));
  return o;
}
