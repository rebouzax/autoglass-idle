import * as THREE from 'three';
import {box,cylinder,batchStatic,makeCar,makeMotorcycle} from './LowPolyAssets.js';
import {staffCapacity} from '../models/Workforce.js';

export class StaffTransitScene {
 constructor(parent,state,l){
  this.group=new THREE.Group();parent.add(this.group);this.parts=[];this.last=-1;this.dummy=new THREE.Object3D();this.nightMaterial=new THREE.MeshStandardMaterial({color:'#ffdf94',emissive:'#ffc65c',emissiveIntensity:0});
  const p=l.employeeParking,structure=new THREE.Group();this.group.add(structure);
  box(structure,'#697b80',[p.right-p.left,.12,p.front-p.back],[(p.left+p.right)/2,.08,(p.front+p.back)/2]);
  const roadBack=l.plotBack-155,roadFront=p.front+7,gate=l.plotRight+10.2;
  box(structure,'#596e7c',[8.8,.06,roadFront-roadBack],[gate,.035,(roadFront+roadBack)/2]);
  box(structure,'#d3e0db',[5.6,.13,roadFront-roadBack],[l.plotRight+3.6,.08,(roadFront+roadBack)/2]);
  box(structure,'#697b80',[l.plotRight+15-p.right,.1,p.front-p.back],[(p.right+l.plotRight+15)/2,.06,(p.front+p.back)/2]);
  for(let z=roadFront-3;z>roadBack;z-=10)box(structure,'#d9e6d9',[.08,.012,3],[gate,.08,z]);
  for(let i=0;i<staffCapacity(state);i++){const x=p.left+2+(i%p.columns)*3.1,z=p.front-4-Math.floor(i/p.columns)*10.8;for(const side of [-1,1])box(structure,'#d7e2db',[.055,.016,3.9],[x+side*1.43,.16,z]);box(structure,'#d7e2db',[2.85,.016,.055],[x,.16,z-1.95]);}
  for(let row=0;row<p.rows;row++){const z=p.front-1.35-row*10.8;for(let x=p.left+2;x<p.right-2;x+=7)box(structure,'#a2c7cd',[2.1,.018,.08],[x,.17,z]);}
  for(const x of [p.left-.9,p.right+.9]){box(structure,'#d8e9e0',[1.4,.18,p.front-p.back],[x,.16,(p.front+p.back)/2]);for(let z=p.front-5;z>p.back;z-=15){cylinder(structure,'#597987',.07,4.6,[x,2.4,z],6);const lamp=box(structure,'#ffdf94',[.6,.18,.6],[x,4.77,z]);lamp.material=this.nightMaterial;}}
  // Each house is shared by two employees, with two non-overlapping vehicle spaces.
  for(let i=0;i<Math.ceil(staffCapacity(state)/2);i++){const x=l.plotLeft+5+(i%25)*6.4,z=l.plotBack-18-Math.floor(i/25)*12.4;box(structure,'#aed0be',[5.6,.13,6.8],[x,-.04,z]);box(structure,['#e7cf9b','#a0c5ca','#deb2a0'][i%3],[3.5,2.1,3],[x,1,z]);box(structure,'#477c93',[3.9,.25,3.5],[x,2.2,z]);box(structure,'#51798c',[.6,1.5,.04],[x,.72,z+1.52]);for(const side of [-1,1]){const window=box(structure,'#ffdf94',[.66,.75,.03],[x+side*1.1,1.2,z+1.52]);window.material=this.nightMaterial;}box(structure,'#8eabb0',[5.8,.08,2.5],[x,.04,z+3.2]);if(i%25===0)box(structure,'#607a85',[l.plotRight+16-l.plotLeft,.05,5.8],[(l.plotLeft+l.plotRight+16)/2,.02,z+7.4]);}
  batchStatic(structure);
  for(const type of ['car','moto']){
   const prototype=type==='moto'?makeMotorcycle('#63a6c8'):makeCar('#63a6c8');if(prototype.userData.crack)prototype.userData.crack.visible=false;if(prototype.userData.rider)prototype.userData.rider.visible=false;batchStatic(prototype);
   prototype.traverse(mesh=>{if(!mesh.userData.batched)return;const pool=new THREE.InstancedMesh(mesh.geometry,mesh.material,staffCapacity(state));pool.instanceMatrix.setUsage(THREE.DynamicDrawUsage);pool.frustumCulled=false;pool.count=0;pool.castShadow=false;this.group.add(pool);this.parts.push({type,pool,cache:[]});});
  }
 }
 update(staff,clock){
  this.nightMaterial.emissiveIntensity=(1-clock.light)*1.6;
  if(staff.time===this.last)return;this.last=staff.time;
  for(const type of ['car','moto']){const cars=staff.vehicles().filter(v=>v.vehicleType===type);for(const {type:kind,pool,cache} of this.parts){if(kind!==type)continue;pool.count=cars.length;let dirty=false;for(let i=0;i<cars.length;i++){const v=cars[i],key=`${v.x.toFixed(3)}:${v.z.toFixed(3)}:${v.facing.toFixed(3)}`;if(cache[i]===key)continue;cache[i]=key;this.dummy.position.set(v.x,.13,v.z);this.dummy.rotation.set(0,v.facing,0);this.dummy.scale.setScalar(1);this.dummy.updateMatrix();pool.setMatrixAt(i,this.dummy.matrix);dirty=true;}if(dirty)pool.instanceMatrix.needsUpdate=true;}}
 }
 dispose(){this.group.traverse(o=>{if(o.userData.batched)o.geometry.dispose();});for(const {pool} of this.parts){pool.geometry.dispose();pool.dispose();}this.nightMaterial.dispose();this.group.removeFromParent();}
}
