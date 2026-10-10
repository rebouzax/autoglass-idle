import {productKeys} from '../models/Products.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const materials = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);
const roundedCube=new RoundedBoxGeometry(1,1,1,2,.08);
const cylinders = new Map();
export function material(color, shiny = false) {
  const key = `${color}:${shiny}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: shiny ? .22 : .85, metalness: shiny ? .16 : 0, flatShading: true }));
  return materials.get(key);
}
export function box(parent, color, size, at, shiny = false) {
  const mesh = new THREE.Mesh(cube, material(color, shiny)); mesh.scale.set(...size); mesh.position.set(...at);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function roundedBox(parent,color,size,at,shiny=false){const mesh=new THREE.Mesh(roundedCube,material(color,shiny));mesh.scale.set(...size);mesh.position.set(...at);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function cylinder(parent, color, radius, height, at, sides = 8) {
  if (!cylinders.has(sides)) cylinders.set(sides, new THREE.CylinderGeometry(1, 1, 1, sides));
  const mesh = new THREE.Mesh(cylinders.get(sides), material(color)); mesh.scale.set(radius, height, radius); mesh.position.set(...at);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function label(text, color = '#fff', width = 4) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 160;
  const context = canvas.getContext('2d'); context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = '800 88px system-ui'; context.fillStyle = color; context.fillText(text, 512, 85);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false })); sprite.scale.set(width, width * .156, 1); return sprite;
}
export function shopSign(text,width=5.3) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
  const context=canvas.getContext('2d');context.fillStyle='#1578c7';context.fillRect(0,0,1024,128);
  context.font='800 66px system-ui';context.textAlign='center';context.textBaseline='middle';context.fillStyle='#fff';context.fillText(text,512,66);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,.48),new THREE.MeshBasicMaterial({map:texture}));mesh.userData.sign=true;return mesh;
}
export function tree(parent, x, z, size = 1) {
  const group = new THREE.Group(); group.position.set(x, .12, z); group.scale.setScalar(size); parent.add(group);
  cylinder(group, '#997050', .14, 1.4, [0, .7, 0], 6);
  for (const [cx,cy,cz,r,color] of [[0,1.7,0,.86,'#65b86b'],[.38,2.12,.08,.64,'#95d575'],[-.3,1.95,-.2,.6,'#8bcc6a']]) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), material(color)); crown.position.set(cx, cy, cz); crown.castShadow = true; group.add(crown);
  }
}
export function makeCar(color) {
  const car = new THREE.Group(),mirrors=[];
  box(car, '#293849', [1.54,.15,2.8], [0,.36,0]);
  roundedBox(car, color, [1.62,.42,2.86], [0,.59,0], true);
  roundedBox(car, color, [1.43,.55,1.53], [0,1.02,-.1], true);
  roundedBox(car, color, [1.46,.11,1.56], [0,1.33,-.12], true);
  const glass = new THREE.MeshStandardMaterial({ color: '#7dc7dc', roughness: .075, metalness: .3 });
  box(car,'#26455b',[1.34,.53,.035],[0,1.02,.661]);
  const windshield = new THREE.Mesh(cube, glass); windshield.scale.set(1.27,.48,.035); windshield.position.set(0,1.02,.68); windshield.rotation.x = -.19; car.add(windshield);
  box(car, '#8ad5e6', [1.26,.43,.035], [0,1.03,-.9], true);
  for (const x of [-.735,.735]) {
    box(car, '#82bdd2', [.025,.4,.65], [x,1.04,.32], true);
    box(car, '#82bdd2', [.025,.4,.55], [x,1.04,-.39], true);
    box(car, '#33445a', [.026,.45,.055], [x,1.04,-.025]);
    box(car, '#d6e0e6', [.035,.025,.2], [x,.71,.13]);
    const mirror=new THREE.Group();mirror.position.set(x*1.15,.94,.59);box(mirror,color,[.23,.13,.15],[0,0,0],true);box(mirror,'#b1dfed',[.19,.09,.015],[0,0,-.085],true);car.add(mirror);mirrors.push(mirror);
  }
  const wheels = [];
  for (const x of [-.81,.81]) for (const z of [-.91,.94]) {
    const wheel = new THREE.Group(); wheel.position.set(x,.33,z); wheel.userData.front = z > 0;
    const tyre = cylinder(wheel, '#263443', .3, .18, [0,0,0], 12); tyre.rotation.z = Math.PI / 2;
    const hub = cylinder(wheel, '#d6e0e7', .16, .185, [0,0,0], 8); hub.rotation.z = Math.PI / 2;
    const center = cylinder(wheel, '#7994a7', .065, .19, [0,0,0], 8); center.rotation.z = Math.PI / 2;
    car.add(wheel); wheels.push(wheel);
  }
  for (const x of [-.57,.57]) {
    box(car, '#fff4ce', [.3,.16,.055], [x,.62,1.45]);
    box(car, '#e25043', [.3,.16,.055], [x,.66,-1.45]);
  }
  box(car, '#384957', [1.4,.13,.08], [0,.4,1.47]);
  box(car, '#384957', [1.4,.13,.08], [0,.4,-1.47]);
  box(car, '#f3f7f9', [.4,.09,.085], [0,.52,1.49]);
  for(const x of [-.37,0,.37])box(car,'#263e50',[.29,.08,.036],[x,.55,1.496]);
  box(car,'#cbdee4',[1.23,.035,.036],[0,.75,1.478]);
  for(const x of [-.29,.28]){const wiper=box(car,'#2c4c60',[.34,.024,.025],[x,.823,.73]);wiper.rotation.z=x<0?.18:-.18;}
  for(const side of [-1,1]){
    box(car,'#c7d9e2',[.02,.023,1.42],[side*.764,.797,-.035]);
    box(car,'#28526f',[.021,.013,2.18],[side*.812,.499,-.02]);
  }
  // Broken windscreen lines disappear as a technician installs the new pane.
  const crack = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.2,.91,.716), new THREE.Vector3(.08,1.15,.716),
    new THREE.Vector3(.08,1.15,.716), new THREE.Vector3(.31,.94,.716),
    new THREE.Vector3(-.05,1.05,.716), new THREE.Vector3(-.39,1.14,.716)
  ]), new THREE.LineBasicMaterial({ color: '#effaff' })); car.add(crack);
  const hood=new THREE.Group();hood.position.set(0,.82,.65);roundedBox(hood,color,[1.4,.055,.8],[0,0,.42],true);car.add(hood);
  car.userData = { wheels, windshield, crack, mirrors,hood,roll: 0 }; return car;
}
export function makeProduct(key,parent,size=1){
  const group=new THREE.Group();group.scale.setScalar(size);parent?.add(group);
  if(key==='glass'){roundedBox(group,'#9adddf',[.85,.65,.045],[0,0,0],true);}
  else if(key==='carMirror'||key==='motoMirror'){for(const side of key==='motoMirror'?[-1,1]:[1]){box(group,'#344d61',[.05,.4,.045],[side*.18,-.1,0]);roundedBox(group,'#2185bf',[.38,.21,.12],[side*.18,.14,0],true);box(group,'#afdfec',[.29,.15,.018],[side*.18,.14,.075],true);}}
  else if(key==='wipers'){for(const side of [-1,1]){const blade=box(group,'#244c5c',[.7,.06,.08],[0,side*.16,0]);blade.rotation.z=side*.1;box(group,'#9fcbd1',[.35,.025,.03],[0,side*.16,.05]);}}
  else if(key==='lights'){roundedBox(group,'#24435a',[.72,.4,.3],[0,0,0]);roundedBox(group,'#fff2a9',[.62,.3,.04],[0,0,.17],true);}
  else if(key==='sensors'){roundedBox(group,'#6a60a0',[.52,.42,.32],[0,0,0]);cylinder(group,'#62d4de',.13,.08,[0,.04,.19],10).rotation.x=Math.PI/2;}
  else{const part=cylinder(group,'#536c7a',.25,.22,[0,0,0],12);part.rotation.x=Math.PI/2;cylinder(group,'#b5c8cc',.12,.35,[0,0,0],10).rotation.x=Math.PI/2;box(group,'#dfaf62',[.68,.12,.55],[0,-.3,0]);}
  return group;
}
export function makeMotorcycle(color){
  const bike=new THREE.Group(),wheels=[],mirrors=[];
  box(bike,'#335067',[.15,.45,1.3],[0,.63,0]);roundedBox(bike,color,[.48,.3,.5],[0,.92,.22],true);roundedBox(bike,'#26394a',[.44,.12,.73],[0,.94,-.4]);
  for(const z of [-.78,.8]){const wheel=new THREE.Group();wheel.position.set(0,.35,z);wheel.userData.front=z>0;cylinder(wheel,'#233343',.32,.18,[0,0,0],12).rotation.z=Math.PI/2;cylinder(wheel,'#becfd8',.19,.19,[0,0,0],10).rotation.z=Math.PI/2;bike.add(wheel);wheels.push(wheel);}
  for(const x of [-.14,.14])box(bike,'#adbfca',[.04,.65,.045],[x,.7,.7]);box(bike,'#bacbd2',[.73,.045,.06],[0,1.18,.66]);
  for(const side of [-1,1]){const mirror=new THREE.Group();mirror.position.set(side*.36,1.23,.67);box(mirror,'#3c5969',[.035,.23,.035],[0,.11,0]);roundedBox(mirror,'#9bd5e3',[.18,.13,.07],[0,.26,0],true);bike.add(mirror);mirrors.push(mirror);}
  cylinder(bike,'#f9e8b0',.13,.06,[0,1.02,.88],10).rotation.x=Math.PI/2;box(bike,'#e45750',[.26,.07,.04],[0,.92,-.94]);
  roundedBox(bike,'#637b88',[.36,.26,.38],[0,.58,-.03]);
  for(let i=0;i<3;i++)box(bike,'#a3bcc7',[.38,.018,.28],[0,.52+i*.055,-.03]);
  cylinder(bike,'#bbcbd1',.065,.78,[.25,.54,-.44],10).rotation.x=Math.PI/2;
  box(bike,color,[.36,.055,.4],[0,.68,.8],true);
  box(bike,'#e5edf0',[.19,.12,.03],[0,.76,-.97]);
  const rider=makePerson('#2674ac',true);rider.scale.setScalar(.77);rider.position.set(0,.52,-.12);rider.userData.body.children.filter(o=>o.position.y===1.44).forEach(o=>o.material=material('#f3b35b'));bike.add(rider);
  const crack=new THREE.Group(),windshield={material:{color:new THREE.Color()}};bike.userData={wheels,mirrors,rider,crack,windshield,roll:0,isMoto:true};return bike;
}
export function makePerson(shirt, cap = false, withGlass = false, withPackage = false) {
  const person = new THREE.Group(), body = new THREE.Group(); person.add(body);
  box(body, shirt, [.4,.5,.25], [0,.87,0]);
  box(body, '#1f4259', [.42,.08,.26], [0,.6,0]);
  cylinder(body, '#e6b18b', .16, .3, [0,1.27,0], 8);
  if (cap) { cylinder(body, '#1266b5', .175, .09, [0,1.44,0]); box(body, '#1266b5', [.24,.035,.2], [0,1.43,.1]); }
  else box(body, '#644631', [.29,.09,.28], [0,1.41,0]);
  for (const x of [-.065,.065]) box(body, '#2d3541', [.025,.032,.015], [x,1.31,.16]);
  const legs = [], knees = [], arms = [], forearms=[];
  for (const x of [-.13,.13]) {
    const leg = new THREE.Group(); leg.position.set(x,.59,0);
    box(leg, '#294861', [.13,.23,.14], [0,-.115,0]);
    const knee=new THREE.Group();knee.position.y=-.23;box(knee,'#294861',[.13,.2,.14],[0,-.1,0]);box(knee,'#233443',[.15,.1,.24],[0,-.26,.05]);leg.add(knee);knees.push(knee);body.add(leg);legs.push(leg);
  }
  for (const x of [-.26,.26]) {
    const arm = new THREE.Group(); arm.position.set(x,1.06,0);
    box(arm, shirt, [.13,.2,.16], [0,-.1,0]);
    const elbow=new THREE.Group();elbow.position.y=-.2;box(elbow,'#e6b18b',[.11,.17,.12],[0,-.075,0]);roundedBox(elbow,'#e6b18b',[.115,.075,.13],[0,-.18,.025]);arm.add(elbow);forearms.push(elbow);body.add(arm);arms.push(arm);
  }
  const carried={};if(withGlass)for(const key of productKeys){const product=makeProduct(key,body);product.position.set(0,1,.4);product.visible=false;carried[key]=product;}
  const pane=carried.glass,parcel=new THREE.Group();
  box(parcel,'#d7a05c',[.68,.5,.48],[0,.91,.37]);box(parcel,'#f9dda7',[.09,.51,.49],[0,.91,.37]);box(parcel,'#f5f6f0',[.24,.14,.012],[.17,.98,.615]);body.add(parcel);parcel.visible=false;
  const scanner=withPackage?box(forearms[1],'#193d56',[.11,.15,.07],[0,-.1,.08]):null;
  if(scanner)box(scanner,'#65e0b6',[.065,.055,.012],[0,.02,.043]);
  const phone=box(forearms[1],'#153b56',[.07,.15,.035],[0,-.08,.07]);phone.visible=false;
  const tool=box(forearms[0],'#e0bb58',[.06,.25,.05],[0,-.13,.045]);tool.visible=false;
  person.userData = { body, legs, knees, arms, forearms,pane,parcel,scanner,carried,phone,tool }; return person;
}
export function animatePerson(mesh, actor, time, groundY = .235) {
  mesh.position.set(actor.x??0, groundY, actor.z??0);
  const dt=Math.max(0,Math.min(.08,time-(mesh.userData.poseTime??time-.016))),blend=1-Math.exp(-10*dt);mesh.userData.poseTime=time;
  const facing=actor.facing??0,delta = Math.atan2(Math.sin(facing - mesh.rotation.y), Math.cos(facing - mesh.rotation.y)); mesh.rotation.y += delta * blend;
  const { body, legs, knees, arms, forearms,parcel,scanner,carried,phone,tool } = mesh.userData;
  const phase=actor.phase,seed=(String(actor.id??'').length%7)*.83,breath=Math.sin(time*1.7+seed),typing=actor.typing||phase==='coding';
  const swing = actor.moving ? Math.sin(actor.walk) * .55 : 0;
  legs[0].rotation.x = swing; legs[1].rotation.x = -swing;
  for(const knee of knees)knee.rotation.x=0;
  for(const arm of arms)arm.rotation.z=0;
  for(const elbow of forearms??[]){elbow.rotation.x=-.05;elbow.rotation.z=0;}
  const holding=actor.carrying||actor.carryingBox;
  arms[0].rotation.x = holding ? -1.2 : -swing * .75;
  arms[1].rotation.x = holding ? -1.2 : swing * .75;
  if(holding&&forearms){forearms[0].rotation.x=-.18;forearms[1].rotation.x=-.18;}
  if (actor.working) { arms[0].rotation.x = -1.2 + Math.sin(time*5+seed)*.11; arms[1].rotation.x = -1.15 + Math.cos(time*5+seed)*.11; }
  if (actor.complaining) { arms[0].rotation.x=-.85+Math.sin(time*5)*.3;arms[1].rotation.x=-.6+Math.cos(time*5)*.25; }
  if (phase==='paying'){arms[1].rotation.x=-1.05+Math.sin(time*4)*.09;if(forearms)forearms[1].rotation.x=-.3;}
  if(actor.scanning){arms[0].rotation.x=-1.08;arms[1].rotation.x=-1.35+Math.sin(time*3)*.07;if(forearms)forearms[1].rotation.x=-.35;}
  mesh.userData.sitting=(mesh.userData.sitting||0)+((actor.seated?1:0)-(mesh.userData.sitting||0))*blend;
  const sitting=mesh.userData.sitting;
  for(const leg of legs)leg.rotation.x=THREE.MathUtils.lerp(leg.rotation.x,-1.48,sitting);
  for(const knee of knees){knee.rotation.x=1.48*sitting;knee.scale.y=1+.4*sitting;}
  for(const arm of arms)arm.rotation.x=THREE.MathUtils.lerp(arm.rotation.x,-.35,sitting);
  if(typing){arms[0].rotation.x=-.84+Math.sin(time*9+seed)*.035;arms[1].rotation.x=-.84+Math.cos(time*11+seed)*.035;if(forearms){forearms[0].rotation.x=-.28+Math.sin(time*13)*.045;forearms[1].rotation.x=-.28+Math.sin(time*15)*.04;}}
  if(phase==='meeting'){const gesture=(Math.sin(time*1.5+seed)+1)/2;arms[1].rotation.x=-.5-gesture*.35;arms[0].rotation.x=-.4+breath*.06;if(forearms)forearms[1].rotation.x=-gesture*.6;}
  if(actor.calling){arms[1].rotation.x=-2.03;arms[1].rotation.z=-.23;arms[0].rotation.x=-.45+Math.sin(time*2)*.09;if(forearms)forearms[1].rotation.x=-.28;}
  if(phase==='deploying'){arms[0].rotation.x=-.82;arms[1].rotation.x=-1.3+Math.sin(time*2)*.08;if(forearms){forearms[0].rotation.x=-.35;forearms[1].rotation.x=-.22+Math.sin(time*7)*.08;}}
  if(phase==='packing'){arms[0].rotation.x=-1.14+Math.sin(time*5)*.16;arms[1].rotation.x=-1.14-Math.sin(time*5)*.16;if(forearms){forearms[0].rotation.x=-.25;forearms[1].rotation.x=-.25;}}
  if(actor.receiving){arms[0].rotation.x=-1.05;arms[1].rotation.x=-1.05;}
  if(phase==='loading'){arms[0].rotation.x=-.9+Math.sin(time*4)*.13;arms[1].rotation.x=-1;}
  if(phase==='riding'){arms[0].rotation.x=-1.15;arms[1].rotation.x=-1.15;}
  if(phase==='installing'){
    const product=actor.product||'glass',fine=Math.sin(time*(product==='glass'?2.5:7)+seed);
    arms[0].rotation.x=(product==='glass'?-1.35:-1.06)+fine*.04;arms[1].rotation.x=(product==='glass'?-1.35:-1.22)+fine*.08;
    if(forearms){forearms[0].rotation.x=product==='glass'?-.12:-.36;forearms[1].rotation.x=-.24+fine*.08;}
    if(product==='motoMirror')arms[0].rotation.z=-.12;if(product==='carMirror')arms[1].rotation.z=.12;
  }
  body.position.y = actor.moving ? Math.abs(Math.sin(actor.walk))*.035 : breath*.009;
  body.position.y-=.08*sitting;
  body.rotation.z = actor.working ? Math.sin(time*3+seed)*.02 : actor.complaining?Math.sin(time*3)*.045:0;
  body.rotation.x=phase==='installing'?(actor.product==='parts'?-.23:actor.product==='motoMirror'?-.18:-.1):phase==='packing'?-.09:typing?-.025:phase==='meeting'?breath*.012:0;
  body.rotation.y=phase==='meeting'?Math.sin(time*.7+seed)*.025:0;
  if(phase==='installing'&&actor.product==='motoMirror')body.position.y-=.07;
  for(const [key,item] of Object.entries(carried)){item.visible=!!actor.carrying&&(actor.product||'glass')===key;item.position.y=1+(phase==='installing'?Math.sin(time*2+seed)*.025:0);item.position.z=phase==='installing'?.47:.4;item.rotation.x=phase==='installing'?-.18+Math.sin(time*3)*.03:0;}
  phone.visible=!!actor.calling;tool.visible=phase==='installing'&&actor.product!=='glass';tool.rotation.z=phase==='installing'?Math.sin(time*7)*.08:0;
  if(parcel)parcel.visible=!!actor.carryingBox;if(scanner)scanner.visible=!!actor.scanning;
}
export function chair(parent,x,z,facing=0,color='#65a5c6'){
  const group=new THREE.Group();group.position.set(x,.285,z);group.rotation.y=facing;parent.add(group);
  box(group,color,[.8,.16,.74],[0,.38,0]);box(group,color,[.8,.66,.13],[0,.74,-.4]);
  for(const sx of [-.3,.3])for(const sz of [-.26,.26])box(group,'#456477',[.065,.34,.065],[sx,.17,sz]);
  return group;
}
export function makeTruck(){
  const truck=new THREE.Group();box(truck,'#29435a',[1.85,.23,6.6],[0,.52,0]);
  box(truck,'#167ecb',[1.9,1.35,1.65],[0,1.12,2.25],true);box(truck,'#9dddec',[1.67,.62,.04],[0,1.38,3.1],true);
  box(truck,'#edf5f7',[1.9,.1,1.7],[0,1.85,2.25]);box(truck,'#dae3e4',[2.05,.16,4.8],[0,.72,-1]);
  box(truck,'#e9f0ef',[.1,1.9,4.8],[1.03,1.72,-1]);box(truck,'#e9f0ef',[2.05,1.9,.12],[0,1.72,-3.37]);
  box(truck,'#e9f0ef',[2.1,.12,4.8],[0,2.72,-1]);
  const side=new THREE.Group();side.position.set(-1.02,.8,-1);box(side,'#1681c8',[.09,1.9,4.8],[0,.95,0]);for(let i=0;i<5;i++)box(side,'#5aa7d6',[.018,.025,4.55],[-.052,.24+i*.35,0]);truck.add(side);
  const brand=shopSign('AUTOGLASS',3.5);brand.rotation.y=Math.PI/2;brand.position.set(1.08,2.35,-1);truck.add(brand);
  const cargo=[];for(let i=0;i<8;i++){const parcel=new THREE.Group();const x=(i%2)*.85-.43,z=Math.floor(i/4)*1.5-2.1,y=Math.floor((i%4)/2)*.65+.99;box(parcel,'#d4a363',[.78,.58,1.35],[x,y,z]);box(parcel,'#ffe0a9',[.08,.59,1.36],[x,y,z]);truck.add(parcel);cargo.push(parcel);}
  const wheels=[];for(const x of [-1,1])for(const z of [-2.3,-1.35,2.4]){const wheel=new THREE.Group();wheel.position.set(x,.43,z);const tyre=cylinder(wheel,'#263443',.4,.2,[0,0,0],12);tyre.rotation.z=Math.PI/2;const hub=cylinder(wheel,'#ccd7dd',.2,.21,[0,0,0],8);hub.rotation.z=Math.PI/2;truck.add(wheel);wheels.push(wheel);}
  for(const x of [-.64,.64])box(truck,'#fff2c2',[.3,.16,.05],[x,.91,3.11]);
  box(truck,'#233d52',[1.4,.24,.055],[0,.83,3.15]);for(let i=0;i<4;i++)box(truck,'#789dad',[1.25,.02,.03],[0,.75+i*.047,3.185]);
  for(const side of [-1,1]){box(truck,'#8eb4c7',[.04,.51,.66],[side*.962,1.36,2.3],true);roundedBox(truck,'#285775',[.17,.27,.16],[side*1.02,1.36,2.9]);box(truck,'#d6e6ed',[.28,.06,.8],[side*.97,.57,2.3]);}
  truck.userData={side,cargo,wheels,roll:0};return truck;
}
export function emojiBubble(text) {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const context=canvas.getContext('2d');
  context.fillStyle='#ffffff';context.beginPath();context.roundRect(8,8,240,106,24);context.fill();
  context.font='64px "Segoe UI Emoji", sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillStyle='#208958';context.fillText(text,128,62);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.scale.set(1.35,.675,1);return sprite;
}
export function batchStatic(group) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const buckets = new Map();
  group.traverse(mesh => {
    if (!mesh.isMesh || !mesh.material.isMaterial) return;
    for (let node = mesh; node && node !== group; node = node.parent) {
      if (!node.visible) return;
    }
    const layout = Object.keys(mesh.geometry.attributes).sort().map(name => {
      const attribute = mesh.geometry.attributes[name];
      return `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`;
    }).join('|');
    const key = `${mesh.material.uuid}:${!!mesh.geometry.index}:${layout}`;
    if (!buckets.has(key)) buckets.set(key, { material: mesh.material, geometries: [] });
    const transform = inverse.clone().multiply(mesh.matrixWorld);
    buckets.get(key).geometries.push(mesh.geometry.clone().applyMatrix4(transform));
  });
  group.clear();
  for (const { material: meshMaterial, geometries } of buckets.values()) {
    const combined = mergeGeometries(geometries);
    for (const geometry of combined ? [combined] : geometries) {
      const mesh = new THREE.Mesh(geometry, meshMaterial);
      mesh.userData.batched=true;
      mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    }
    if (combined) geometries.forEach(geometry => geometry.dispose());
  }
}
