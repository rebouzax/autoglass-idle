import * as THREE from 'three';
import {box,roundedBox,cylinder,batchStatic,makePerson,animatePerson,makeProduct} from './LowPolyAssets.js';
import {addBrandPanel} from './CompanyDecor.js';
import {activeStaff} from '../models/Workforce.js';
import {officeDesk,itDesk} from '../models/ShopLayout.js';
import {cargoLayout,cargoPose} from '../models/CargoRoutes.js';

function monitor(parent,x,y,z,width=1.4){
  roundedBox(parent,'#243e5c',[width,.82,.1],[x,y,z]);box(parent,'#69cbdc',[width-.12,.66,.025],[x,y,z+.065],true);
  for(let i=0;i<4;i++)box(parent,i%2?'#c6ffdf':'#217da1',[width*.12,.04+i*.04,.03],[x-width*.31+i*width*.2,y-.14,z+.084]);
}
function framedArt(parent,x,y,z,w=1.1){
  roundedBox(parent,'#b78c63',[w,.8,.08],[x,y,z]);box(parent,'#eff5ea',[w-.1,.7,.025],[x,y,z+.053]);
  box(parent,'#78bfc5',[w*.52,.4,.03],[x-.13,y-.1,z+.075]);cylinder(parent,'#efc678',.16,.035,[x+.22,y+.14,z+.07],12).rotation.x=Math.PI/2;
}

/** All desk partitions occupy existing furniture footprints, keeping paths clear. */
export function buildUpgradeDecor(parent,state,l){
  const group=new THREE.Group();parent.add(group);const animations=[];
  if(state.garageLevel>=3){
    monitor(group,-7.45,1.9,-8.7,2.5);framedArt(group,-4.5,1.75,-8.75);
    for(let i=0;i<Math.min(6,state.tools);i++){const x=1.25+i*5.2;roundedBox(group,'#3b647b',[.65,.6,.04],[x,1.55,-8.84]);for(let k=0;k<3;k++)box(group,'#88dfdb',[.4,.025,.02],[x,1.68-k*.11,-8.805]);}
    for(let i=0;i<Math.min(3,1+state.wmsLevel);i++){
      const x=l.right-2.2-i*2.35;roundedBox(group,'#245472',[1.7,.8,.65],[x,.74,l.clBack+1]);monitor(group,x,1.45,l.clBack+.86,1.45);
    }
    for(let i=0;i<Math.min(4,state.wmsLevel);i++){const x=-3.8+i*3;box(group,'#488594',[.08,.75,.08],[x,1.4,l.clBack+.7]);box(group,'#73dfb4',[.22,.08,.15],[x,1.83,l.clBack+.7]);}
  }
  if(state.garageLevel>=4){
    for(let i=0;i<activeStaff(state,'salesWorker');i++){
      const p=officeDesk(state,i),z=p.z-1.1;
      // Half-height acoustic dividers sit at the rear of each desktop.
      roundedBox(group,state.officeChairs>=3?'#547d91':'#75aeb8',[2.4,.52,.085],[p.x,1.41,z-.32]);
      box(group,'#d1dfe5',[.07,.56,.8],[p.x+1.13,1.4,z]);
      if(state.officeComputers>=3){box(group,'#283f59',[.42,.24,.04],[p.x+.82,1.4,z+.18]);box(group,'#90ddbf',[.34,.16,.025],[p.x+.82,1.4,z+.21]);}
      cylinder(group,'#eee5d1',.075,.15,[p.x-.8,1.26,z+.15],8);
    }
    for(let i=0;i<Math.min(4,1+state.businessArea);i++)framedArt(group,l.officeLeft+1.1+i*2.35,1.8,l.officeBack+.16);
    if(state.businessArea>=2){
      const x=l.officeLeft+9.1;roundedBox(group,'#7bbbc5',[.08,1.05,2.4],[x,1.52,-11.1],true);box(group,'#366985',[.085,.09,2.4],[x,2.09,-11.1]);
      box(group,'#e6eee9',[2.2,.85,.06],[l.officeRight-2,1.65,l.officeBack+.16]);for(let i=0;i<3;i++)box(group,'#67aac4',[.36,.06,.02],[l.officeRight-2.6+i*.6,1.56+i*.15,l.officeBack+.205]);
    }
    if(state.officeChairs>=2){roundedBox(group,'#ceaf84',[1.25,1,.5],[l.officeRight-.8,.8,-8.2]);roundedBox(group,'#283f58',[.4,.36,.3],[l.officeRight-.8,1.48,-8.2]);cylinder(group,'#cedee5',.07,.14,[l.officeRight-.5,1.38,-8.2],8);}
  }
  if(state.garageLevel>=6){
    for(let i=0;i<activeStaff(state,'itWorker');i++){
      const p=itDesk(state,i);roundedBox(group,'#645e91',[2.6,.55,.08],[p.x,1.43,p.z-1.44]);box(group,'#bdcede',[.06,.6,.8],[p.x+1.24,1.45,p.z-1.1]);
      if(state.itComputers>=3)roundedBox(group,'#438dc3',[.4,.07,.26],[p.x+.78,1.24,p.z-.88]);
    }
    const x=l.officeLeft+2.5;
    for(let i=0;i<Math.min(3,state.cloudPlatform+Math.floor(state.servers/2));i++){
      roundedBox(group,'#203f5d',[1.2,2.1,.6],[x+i*1.65,1.36,-27.9]);for(let row=0;row<6;row++){box(group,'#3d6081',[1,.18,.03],[x+i*1.65,.65+row*.27,-27.58]);box(group,'#7cebc7',[.06,.04,.025],[x-.32+i*1.65,.65+row*.27,-27.55]);}
    }
    if(state.cybersecurity)monitor(group,l.officeLeft+10,1.7,l.itBack+.15,3);
    if(state.dataAnalytics){monitor(group,l.officeLeft+3,1.7,l.itBack+.15,2.1);framedArt(group,l.officeLeft+5.2,1.7,l.itBack+.15);}
  }
  if(state.garageLevel>=7){
    for(const [i,key] of ['wipers','lights','sensors'].entries()){const x=8+i*.5;const product=makeProduct(key,group,.44);product.position.set(x,1.36,-5.96);}
  }
  if(state.garageLevel>=8){
    for(const [i,key] of ['wipers','lights','sensors'].entries()){const prop=makeProduct(key,group,.35);prop.position.set(l.academyLeft+14.8+i*.65,1.36,-10.9);}
    for(let i=0;i<Math.min(6,state.curriculum);i++)box(group,['#80bdb7','#7ea9cc','#e6bf7d'][i%3],[.3,.035,.35],[l.academyLeft+14.8+i*.31,1.2,-10.6]);
  }
  // The founder character welcomes visitors on a reserved terrace.
  const boss=makePerson('#244778');boss.userData.founder=true;parent.add(boss);
  const pos=state.garageLevel>=4?{x:l.officeRight-1.2,z:3.6}:{x:-9.3,z:l.front+1.4};
  roundedBox(group,'#d5e5e6',[1.65,.15,1.5],[pos.x,.13,pos.z]);
  animations.push({boss,pos});batchStatic(group);return{group,animations,boss};
}

function plane(){
  const root=new THREE.Group();
  roundedBox(root,'#edf5f4',[1.6,1.5,10],[0,2,0]);roundedBox(root,'#3278ae',[1.45,.65,2],[0,2.08,4.05]);
  box(root,'#3a8ccb',[10,.19,2.2],[0,1.8,-.6]);box(root,'#bfdce5',[4.8,.15,1.3],[0,2.4,-4.1]);box(root,'#2476aa',[.16,2.5,1.5],[0,3.3,-4.1]);
  for(const x of [-2.8,2.8])cylinder(root,'#39637a',.43,2,[x,1.6,.6],12).rotation.x=Math.PI/2;
  for(const x of [-.6,.6])for(const z of [-2,2.8])cylinder(root,'#263f4f',.28,.19,[x,.5,z],8).rotation.z=Math.PI/2;
  addBrandPanel(root,1.9,.81,2,-1,Math.PI/2);batchStatic(root);return root;
}
function ship(){
  const root=new THREE.Group();roundedBox(root,'#224765',[7,2.6,20],[0,.9,0]);roundedBox(root,'#4e8faa',[6.7,.35,19.5],[0,2.25,0]);
  roundedBox(root,'#e9f4ef',[4.5,3,3.5],[0,3.8,-7]);for(let i=0;i<3;i++)box(root,'#76bbc9',[.85,.6,.07],[-1.4+i*1.4,4.45,-5.18],true);
  for(let i=0;i<12;i++){const x=-2+(i%3)*2,z=-2+Math.floor(i/3)*2.75;roundedBox(root,['#3b91c1','#e9b56d','#55aca2'][i%3],[1.75,1.25,2.35],[x,2.95,z]);for(let k=0;k<5;k++)box(root,'#b2d5df',[.025,1.05,.04],[x-.68+k*.33,2.95,z+1.2]);}
  cylinder(root,'#436479',.1,4,[0,6.5,-7],8);addBrandPanel(root,3.8,0,4.35,-5.12);batchStatic(root);return root;
}
export function buildCargoTerminals(parent,state,l){
  const staticGroup=new THREE.Group(),dynamic=new THREE.Group();parent.add(staticGroup,dynamic);const result={staticGroup,dynamic,robots:[],freight:[],air:null,port:null};
  if(state.garageLevel>=15){
    for(const channel of state.garageLevel>=16?['air','maritime']:['air']){
      const worker=makePerson('#278cac'),parcel=new THREE.Group();roundedBox(parcel,'#d9b17e',[.6,.5,.65],[0,1.1,.55]);worker.add(parcel);dynamic.add(worker);result.freight.push({channel,worker,parcel});
    }
  }
  if(state.garageLevel>=10){
    for(let i=0;i<Math.max(1,state.clRobots);i++){
      const root=new THREE.Group();dynamic.add(root);roundedBox(root,'#316fb8',[.85,.34,1.05],[0,.53,0]);roundedBox(root,'#e2ebeb',[.7,.18,.92],[0,.79,0]);box(root,'#62ebcf',[.55,.065,.02],[0,.57,.538]);
      for(const x of [-.43,.43])for(const z of [-.33,.33])cylinder(root,'#244656',.17,.13,[x,.37,z],8).rotation.z=Math.PI/2;
      const parcel=roundedBox(root,'#d7b47c',[.56,.45,.65],[0,1.05,0]);result.robots.push({root,parcel,index:i});
      const width=l.right-20,x=(18.5+l.right-2)/2,z=-16.8-i*.95;box(staticGroup,'#d2e6e8',[width,.025,.9],[x,.31,z]);for(const side of [-.4,.4])box(staticGroup,'#50becb',[width,.03,.025],[x,.34,z+side]);roundedBox(staticGroup,'#416682',[.35,.45,.8],[18.1,.54,z]);
    }
  }
  if(state.garageLevel>=15){
    const {x,z,depth}=cargoLayout(state).air;result.air={x,z,plane:plane(),loader:new THREE.Group(),packages:[]};const a=result.air;dynamic.add(a.plane,a.loader);
    box(staticGroup,'#c0d7cf',[35,.3,depth],[x,.02,z]);box(staticGroup,'#486475',[13,.07,depth-2],[x-6,.21,z]);
    for(let dz=-depth/2+5;dz<depth/2-3;dz+=5)box(staticGroup,'#f7f2d4',[.3,.02,2.4],[x-6,.26,z+dz]);
    for(const side of [-1,1])for(let dz=-depth/2+2;dz<depth/2-2;dz+=4)cylinder(staticGroup,'#7de6d7',.07,.12,[x-6+side*5.5,.32,z+dz],6);
    roundedBox(staticGroup,'#d3e2e8',[9,3.2,12],[x+10,1.84,z-10]);box(staticGroup,'#2578ac',[9.4,.25,12.4],[x+10,3.55,z-10]);addBrandPanel(staticGroup,6.4,x+10,2.75,z-3.92);
    box(staticGroup,'#3c6175',[5,2.2,.06],[x+10,1.51,z-3.87]);
    roundedBox(a.loader,'#eabc66',[1.8,.6,2.3],[0,.65,0]);box(a.loader,'#516d7e',[1.2,.16,3],[0,1.12,1]);
    for(let i=0;i<Math.min(12,4+state.airCargo*2);i++){const p=roundedBox(dynamic,'#dcb884',[.75,.65,.85],[x+9+(i%3)*.85,.73+Math.floor(i/6)*.68,z+1+Math.floor(i/3)%2]);a.packages.push(p);}
    a.plane.position.set(x-6,.28,z);a.loader.position.set(x,.2,z+1);
    for(let i=0;i<Math.min(depth>52?2:1,Math.floor(state.airCargo/2));i++){const parked=plane();parked.scale.setScalar(.65);parked.position.set(x+10,.28,z+12+i*10);staticGroup.add(parked);}
  }
  if(state.garageLevel>=16){
    const {x,z,width,bridgeZ}=cargoLayout(state).port;result.port={x,z,ship:ship(),crane:new THREE.Group(),water:null,containers:[]};const p=result.port;dynamic.add(p.ship,p.crane);
    p.water=box(dynamic,'#3aa2bf',[width,.14,180],[x,-.02,137],true);p.water.material=p.water.material.clone();p.water.userData.ownedMaterial=true;
    // The 12 metre deck leaves a clear navigable opening over the shipping lane.
    box(staticGroup,'#a9bbc5',[width,.8,11],[x,12,bridgeZ]);box(staticGroup,'#526b7c',[width,.1,9],[x,12.46,bridgeZ]);
    for(const side of [-1,1])box(staticGroup,'#e4eee9',[width,1,.18],[x,13,bridgeZ+side*5.2]);
    for(let bx=x-width/2+12;bx<x+width/2;bx+=24){if(Math.abs(bx-(x+9))<17)continue;box(staticGroup,'#b4c5c9',[2,12,2],[bx,5.9,bridgeZ]);}
    for(let bx=x-width/2+4;bx<x+width/2;bx+=8)box(staticGroup,'#fff1d2',[4,.025,.14],[bx,12.53,bridgeZ]);
    for(const side of [-1,1]){const abutment=x+side*(width/2+6);box(staticGroup,'#d2bd93',[14,15,190],[abutment,5,137]);box(staticGroup,'#526b7c',[9,.2,190],[abutment,12.45,137]);}
    for(let i=0;i<Math.min(2,Math.floor(state.seaCargo/2));i++){const parked=ship();parked.position.set(x-12-i*19,.15,z+8);staticGroup.add(parked);}
    box(staticGroup,'#e3cd9f',[width,.27,4],[x,.12,45]);box(staticGroup,'#8ba8ae',[width,.5,12],[x,.15,52]);box(staticGroup,'#d0dacf',[55,.2,10],[x,.51,51]);
    for(let i=0;i<22;i++){const stripe=box(staticGroup,'#9bdce0',[4,.018,.06],[x-width/2+5+(i%8)*18,.07,64+Math.floor(i/8)*17]);stripe.rotation.y=.1;}
    for(let i=0;i<Math.min(30,12+state.seaCargo*3);i++){const cx=x-23+(i%6)*4.3,cz=49+Math.floor(i/6)%3*2.5;roundedBox(staticGroup,['#286ca9','#e1ad5d','#499e94'][i%3],[3.7,1.65,2.1],[cx,1.45+Math.floor(i/18)*1.7,cz]);}
    for(const side of [-1,1])box(p.crane,'#efb956',[.5,9,.5],[side*5,4.5,0]);box(p.crane,'#efb956',[11,.5,.6],[0,9,0]);box(p.crane,'#efb956',[.45,.45,16],[0,9.1,5]);
    const hook=new THREE.Group();p.crane.add(hook);box(hook,'#395d6d',[.08,4,.08],[0,-2,0]);roundedBox(hook,'#68b0cc',[3.6,1.55,2],[0,-4,0]);p.hook=hook;p.crane.position.set(x+9,.65,55);p.ship.position.set(x+9,.15,z);
    roundedBox(staticGroup,'#dbe7e4',[12,3.2,6],[x+34,2.16,50]);box(staticGroup,'#2c83ae',[12.3,.23,6.3],[x+34,3.9,50]);addBrandPanel(staticGroup,7.5,x+34,2.9,53.1);
  }
  batchStatic(staticGroup);return result;
}
export function updateAdvancedDecor(decor,upgrade,simulation,time){
  const s=simulation.economy.state,l=simulation.advanced;
  for(const visual of decor?.freight||[]){
    const truck=l.trucks.find(t=>t.channel===visual.channel&&['companyLoading','unloading'].includes(t.phase));visual.worker.visible=!!truck;if(!truck)continue;
    const cycle=(time*.45)%1,distance=Math.sin(cycle*Math.PI)*3;
    animatePerson(visual.worker,{x:truck.x-2-distance,z:truck.z-1.6,facing:cycle<.5?Math.PI/2:-Math.PI/2,moving:true,walk:time*5,seated:false,working:false},time,.2);visual.parcel.visible=cycle<.5;
  }
  if(upgrade?.boss){const a=upgrade.animations[0];animatePerson(a.boss,{...a.pos,facing:Math.PI/3,walk:0,moving:false,working:Math.sin(time*.5)>.6,calling:false,seated:false},time,.25);}
  for(const visual of decor?.robots||[]){const r=l?.robots[visual.index],right=simulation.economy.state.bays*5.2+.25;visual.root.position.set(18.5+(r?.progress||0)*(right-20.5),.1,-16.8-visual.index*.95);visual.root.rotation.y=Math.PI/2;visual.parcel.visible=!!r&&['transporting','unloading'].includes(r.phase);}
  if(decor?.air){const a=decor.air,t=l?.transports.air,pose=cargoPose(s,'air',t?.phase,t?.progress||0);a.plane.position.set(pose.x,pose.y,pose.z);a.plane.rotation.set(pose.pitch,pose.facing,0);a.plane.visible=true;
    const loading=t?.phase==='loading',u=loading?(Math.sin(time*1.6)+1)/2:0;a.loader.position.set(a.x+5-u*9,.2,a.z+1);a.loader.visible=loading;a.packages.forEach((mesh,i)=>mesh.visible=loading&&i<(1-t.progress)*a.packages.length);
  }
  if(decor?.port){const p=decor.port,t=l?.transports.maritime,pose=cargoPose(s,'maritime',t?.phase,t?.progress||0);p.ship.position.set(pose.x,pose.y+Math.sin(time*.9)*.09,pose.z);p.ship.rotation.set(0,pose.facing,Math.sin(time*.65)*.012);p.ship.visible=true;p.hook.position.set(0,9,3+(Math.sin(time*.45)+1)*8);p.hook.visible=t?.phase==='loading';p.water.material.color.setHSL(.535,.56,.42+Math.sin(time*.4)*.015);}
}
