import {shopLayout,driveway} from './ShopLayout.js';
import {route,sampleRoute} from './routes.js';

// Shared coordinates keep the port, bridge clearance and vehicle paths aligned.
export function cargoLayout(s){
  const l=shopLayout(s),airportZ=(l.plotBack+5)/2;
  return {air:{x:-65,z:airportZ,depth:Math.max(60,-11-l.plotBack)},
    port:{x:Math.max(30,l.plotRight*.5),z:77,bridgeZ:139,seaEnd:218,width:Math.max(280,l.plotRight+160)},
    origin:{x:l.plotRight-5,z:driveway(s).front-2.8},lane:32};
}
export function freightRoute(s,channel,returning=false){
  const {air,port,origin,lane}=cargoLayout(s),l=shopLayout(s);
  // Separate directions and loading berths keep empty trucks out of outbound queues.
  const offset=returning?3.2:0,start=[origin.x+(channel==='air'?-4:0),origin.z];
  const points=channel==='air'?[start,[start[0],lane+offset],[-46+offset,lane+offset],[-46+offset,air.z+7],[-55,air.z+7]]
    :[start,[l.plotRight+15+offset,origin.z],[l.plotRight+15+offset,51+offset],[port.x+26,51+offset]];
  return returning?points.reverse():points;
}
export function cargoPose(s,channel,phase,progress){
  const {air:a,port:p}=cargoLayout(s),t=Math.max(0,Math.min(1,progress));
  if(channel==='maritime'){
    const z=phase==='departing'?p.z+(p.seaEnd-p.z)*t:phase==='returning'?p.seaEnd-(p.seaEnd-p.z)*t:phase==='turning'?p.seaEnd:p.z;
    return{x:p.x+9,y:.15,z,facing:phase==='returning'?Math.PI:phase==='turning'?Math.PI*t:phase==='berthing'?Math.PI*(1-t):0,pitch:0};
  }
  const runway=a.depth/2-7,home=a.z;
  if(phase==='departing'){const d=t*t*(runway+70);return{x:a.x-6,y:.28+Math.max(0,d-runway*.5)/(runway*.5+70)*34,z:home+d,facing:0,pitch:d>runway*.5?-.13:0};}
  if(phase==='turning'){
    // A wide airborne circuit finishes behind the runway, aligned for landing.
    const path=route([[a.x-6,home+runway+70],[a.x-55,home+runway+105],[a.x-85,home-90],[a.x-6,home-runway-70]],24);
    const pos=sampleRoute(path,path.length*t);return{...pos,y:34.28+Math.sin(t*Math.PI)*8,pitch:0};
  }
  if(phase==='returning'){const z=home-runway-70+(runway+70)*t;return{x:a.x-6,y:.28+34*(1-Math.min(1,t/.8)),z,facing:0,pitch:t<.75?.08:0};}
  return{x:a.x-6,y:.28,z:home,facing:0,pitch:0};
}
