import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materials = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);
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
  const car = new THREE.Group();
  box(car, '#293849', [1.54,.15,2.8], [0,.36,0]);
  box(car, color, [1.62,.42,2.86], [0,.59,0], true);
  box(car, color, [1.43,.55,1.53], [0,1.02,-.1], true);
  box(car, color, [1.46,.11,1.56], [0,1.33,-.12], true);
  const glass = new THREE.MeshStandardMaterial({ color: '#7dc7dc', roughness: .12, metalness: .25 });
  const windshield = new THREE.Mesh(cube, glass); windshield.scale.set(1.27,.48,.035); windshield.position.set(0,1.02,.68); windshield.rotation.x = -.19; car.add(windshield);
  box(car, '#8ad5e6', [1.26,.43,.035], [0,1.03,-.9], true);
  for (const x of [-.735,.735]) {
    box(car, '#82bdd2', [.025,.4,.65], [x,1.04,.32], true);
    box(car, '#82bdd2', [.025,.4,.55], [x,1.04,-.39], true);
    box(car, '#33445a', [.026,.45,.055], [x,1.04,-.025]);
    box(car, '#d6e0e6', [.035,.025,.2], [x,.71,.13]);
    box(car, color, [.23,.11,.15], [x*1.15,.94,.59]);
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
  // Broken windscreen lines disappear as a technician installs the new pane.
  const crack = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.2,.91,.716), new THREE.Vector3(.08,1.15,.716),
    new THREE.Vector3(.08,1.15,.716), new THREE.Vector3(.31,.94,.716),
    new THREE.Vector3(-.05,1.05,.716), new THREE.Vector3(-.39,1.14,.716)
  ]), new THREE.LineBasicMaterial({ color: '#effaff' })); car.add(crack);
  car.userData = { wheels, windshield, crack, roll: 0 }; return car;
}
export function makePerson(shirt, cap = false, withGlass = false, withPackage = false) {
  const person = new THREE.Group(), body = new THREE.Group(); person.add(body);
  box(body, shirt, [.4,.5,.25], [0,.87,0]);
  box(body, '#1f4259', [.42,.08,.26], [0,.6,0]);
  cylinder(body, '#e6b18b', .16, .3, [0,1.27,0], 8);
  if (cap) { cylinder(body, '#1266b5', .175, .09, [0,1.44,0]); box(body, '#1266b5', [.24,.035,.2], [0,1.43,.1]); }
  else box(body, '#644631', [.29,.09,.28], [0,1.41,0]);
  for (const x of [-.065,.065]) box(body, '#2d3541', [.025,.032,.015], [x,1.31,.16]);
  const legs = [], knees = [], arms = [];
  for (const x of [-.13,.13]) {
    const leg = new THREE.Group(); leg.position.set(x,.59,0);
    box(leg, '#294861', [.13,.23,.14], [0,-.115,0]);
    const knee=new THREE.Group();knee.position.y=-.23;box(knee,'#294861',[.13,.2,.14],[0,-.1,0]);box(knee,'#233443',[.15,.1,.24],[0,-.26,.05]);leg.add(knee);knees.push(knee);body.add(leg);legs.push(leg);
  }
  for (const x of [-.26,.26]) {
    const arm = new THREE.Group(); arm.position.set(x,1.06,0);
    box(arm, shirt, [.13,.2,.16], [0,-.1,0]); box(arm, '#e6b18b', [.11,.19,.12], [0,-.28,0]); body.add(arm); arms.push(arm);
  }
  const pane = withGlass ? box(body, '#a8e2ee', [.85,.65,.055], [0,.98,.36], true) : null; if(pane)pane.visible = false;
  const parcel=withGlass||withPackage?new THREE.Group():null;
  if(parcel){box(parcel,'#d7a05c',[.68,.5,.48],[0,.91,.37]);box(parcel,'#f9dda7',[.09,.51,.49],[0,.91,.37]);box(parcel,'#f5f6f0',[.24,.14,.012],[.17,.98,.615]);body.add(parcel);parcel.visible=false;}
  const scanner=withPackage?box(arms[1],'#193d56',[.11,.15,.07],[0,-.3,.08]):null;
  person.userData = { body, legs, knees, arms, pane,parcel,scanner }; return person;
}
export function animatePerson(mesh, actor, time, groundY = .235) {
  mesh.position.set(actor.x, groundY, actor.z);
  const delta = Math.atan2(Math.sin(actor.facing - mesh.rotation.y), Math.cos(actor.facing - mesh.rotation.y)); mesh.rotation.y += delta * .16;
  const { body, legs, knees, arms, pane,parcel,scanner } = mesh.userData;
  const swing = actor.moving ? Math.sin(actor.walk) * .55 : 0;
  legs[0].rotation.x = swing; legs[1].rotation.x = -swing;
  for(const knee of knees)knee.rotation.x=0;
  const holding=actor.carrying||actor.carryingBox;
  arms[0].rotation.x = holding ? -1.2 : -swing * .75;
  arms[1].rotation.x = holding ? -1.2 : swing * .75;
  if (actor.working) { arms[0].rotation.x = -1.25 + Math.sin(time*8)*.13; arms[1].rotation.x = -1.15 + Math.cos(time*8)*.13; }
  if (actor.complaining) { arms[0].rotation.x=-.85+Math.sin(time*5)*.3;arms[1].rotation.x=-.6+Math.cos(time*5)*.25; }
  if (actor.phase==='paying')arms[1].rotation.x=-.9+Math.sin(time*6)*.13;
  if(actor.scanning){arms[0].rotation.x=-1.15;arms[1].rotation.x=-1.55+Math.sin(time*4)*.1;}
  mesh.userData.sitting=(mesh.userData.sitting||0)+((actor.seated?1:0)-(mesh.userData.sitting||0))*.16;
  const sitting=mesh.userData.sitting;
  for(const leg of legs)leg.rotation.x=THREE.MathUtils.lerp(leg.rotation.x,-1.48,sitting);
  for(const knee of knees){knee.rotation.x=1.48*sitting;knee.scale.y=1+.4*sitting;}
  for(const arm of arms)arm.rotation.x=THREE.MathUtils.lerp(arm.rotation.x,-.35,sitting);
  body.position.y = actor.moving ? Math.abs(Math.sin(actor.walk))*.035 : Math.sin(time*2)*.008;
  body.position.y-=.08*sitting;
  body.rotation.z = actor.working ? Math.sin(time*5)*.035 : actor.complaining?Math.sin(time*3)*.045:0; if(pane)pane.visible = actor.carrying;
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
  box(truck,'#e9f0ef',[.1,1.9,4.8],[-1.03,1.72,-1]);box(truck,'#e9f0ef',[2.05,1.9,.12],[0,1.72,-3.37]);
  box(truck,'#e9f0ef',[2.1,.12,4.8],[0,2.72,-1]);
  const side=new THREE.Group();side.position.set(1.02,.8,-1);box(side,'#1681c8',[.09,1.9,4.8],[0,.95,0]);truck.add(side);
  const brand=shopSign('AUTOGLASS',3.5);brand.rotation.y=Math.PI/2;brand.position.set(1.08,2.35,-1);truck.add(brand);
  const cargo=[];for(let i=0;i<8;i++){const parcel=new THREE.Group();const x=(i%2)*.85-.43,z=Math.floor(i/4)*1.5-2.1,y=Math.floor((i%4)/2)*.65+.99;box(parcel,'#d4a363',[.78,.58,1.35],[x,y,z]);box(parcel,'#ffe0a9',[.08,.59,1.36],[x,y,z]);truck.add(parcel);cargo.push(parcel);}
  const wheels=[];for(const x of [-1,1])for(const z of [-2.3,-1.35,2.4]){const wheel=new THREE.Group();wheel.position.set(x,.43,z);const tyre=cylinder(wheel,'#263443',.4,.2,[0,0,0],12);tyre.rotation.z=Math.PI/2;const hub=cylinder(wheel,'#ccd7dd',.2,.21,[0,0,0],8);hub.rotation.z=Math.PI/2;truck.add(wheel);wheels.push(wheel);}
  for(const x of [-.64,.64])box(truck,'#fff2c2',[.3,.16,.05],[x,.91,3.11]);
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
  const buckets = new Map();
  group.traverse(mesh => {
    if (!mesh.isMesh || !mesh.material.isMaterial) return;
    const key = mesh.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { material: mesh.material, geometries: [] });
    buckets.get(key).geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
  });
  group.clear();
  for (const { material: meshMaterial, geometries } of buckets.values()) {
    const combined = mergeGeometries(geometries); const mesh = new THREE.Mesh(combined, meshMaterial);
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); geometries.forEach(geometry => geometry.dispose());
  }
}
