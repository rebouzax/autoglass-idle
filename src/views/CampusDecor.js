import * as THREE from 'three';
import {box,roundedBox,cylinder,chair,makeCar,batchStatic,tree} from './LowPolyAssets.js';
import {addBrandPanel} from './CompanyDecor.js';
import {academySeat,academyPractice,factoryStation} from '../models/ShopLayout.js';

export function buildFulfillment(parent,state,l){
 const parcels=[],arms=[];if(state.garageLevel<7)return{parcels,arms};
 const group=new THREE.Group();parent.add(group);const start=18,end=l.right-2,center=(start+end)/2;
 box(group,'#9fc8c8',[end-start,.015,2.3],[center,.3,-14.9]);
 box(group,'#406b7e',[end-start,.65,1.05],[center,.66,-14.9]);
 for(let x=start+.2;x<end;x+=.6){const roller=cylinder(group,'#9eb7c0',.1,.96,[x,1.03,-14.9],8);roller.rotation.x=Math.PI/2;}
 for(const z of [-15.48,-14.32])box(group,'#eab961',[end-start,.12,.07],[center,1.11,z]);
 for(let i=0;i<5;i++){const parcel=roundedBox(parent,['#d8af75','#8cbdd5','#e6c38e'][i%3],[.65,.6,.75],[start+i,1.37,-14.9]);box(parcel,'#f5ecd7',[.14,.025,.76],[0,.305,0]);parcels.push({mesh:parcel,index:i,start,end});}
 if(state.garageLevel>=12)for(const x of [end-1,end-4]){
  cylinder(group,'#446d89',.48,.9,[x,.73,-16.4],10);const arm=new THREE.Group();arm.position.set(x,1.15,-16.4);parent.add(arm);box(arm,'#f1b451',[.25,1.3,.3],[0,.65,0]);box(arm,'#f1b451',[.24,.27,1.3],[0,1.27,.53]);box(arm,'#435e75',[.45,.22,.35],[0,1.14,1.1]);arms.push(arm);
 }
 batchStatic(group);return{parcels,arms};
}

export function buildCampus(parent,roof,state,l,doorway){
 const machines=[],panes=[];if(state.garageLevel<8)return{machines,panes};
 const group=new THREE.Group();parent.add(group);const left=l.academyLeft,right=l.academyRight,width=right-left;
 box(group,'#ecede4',[width,.17,15.1],[(left+right)/2,.2,-5.95]);
 box(group,'#8bbaa6',[width-.4,.018,1.1],[(left+right)/2,.3,-12.5]);
 for(const x of [left,right]){box(group,'#e1e9e4',[.22,.85,15.1],[x,.71,-5.95]);box(group,'#4fa792',[.25,.1,15.1],[x,1.18,-5.95]);}
 box(group,'#e1e9e4',[width-3.2,.85,.22],[(left+3.2+right)/2,.71,1.6]);
 doorway(parent,left+1.6,1.6,3,0,'academy');
 if(state.garageLevel<14)box(group,'#e1e9e4',[width,1.1,.22],[(left+right)/2,.84,-13.5]);
 else{box(group,'#e1e9e4',[13.8,1.1,.22],[left+6.9,.84,-13.5]);box(group,'#e1e9e4',[width-17.4,1.1,.22],[(left+17.4+right)/2,.84,-13.5]);doorway(parent,left+15.6,-13.5,3.6,0,'factory');}
 box(group,'#168d87',[width,.43,.26],[(left+right)/2,3.25,-13.35]);addBrandPanel(parent,5.1,left+6.4,3.3,-13.18);
 box(roof,'#287f90',[width+.3,.24,15.3],[(left+right)/2,3.7,-5.95]);
 for(let i=0;i<Math.min(6,2+state.trainingLevel);i++){
  const p=academySeat(state,i);chair(group,p.x,p.z,p.facing,'#3fa08b');
  roundedBox(group,'#e4bf8b',[2,.11,.6],[p.x,1.1,p.z-.95]);
  for(const side of [-1,1])box(group,'#64808b',[.08,.78,.45],[p.x+side*.82,.66,p.z-.95]);
  box(group,'#285169',[.55,.38,.06],[p.x,1.35,p.z-1.1]);box(group,'#95decc',[.46,.27,.02],[p.x,1.36,p.z-1.06]);
  box(group,'#f9f7dc',[.34,.025,.24],[p.x+.57,1.18,p.z-.9]);
 }
 const practice=academyPractice(state);roundedBox(group,'#d8e6dd',[2.3,.85,.7],[practice.x,.73,practice.z-1.1]);
 box(group,'#78cede',[1.5,.85,.08],[practice.x,1.53,practice.z-1.1],true);
 box(group,'#245775',[.12,1.75,3.5],[left+.18,1.6,-9.7]);
 for(let i=0;i<4;i++)box(group,['#7ce1c6','#bfe5ed','#a8cfff','#f1d897'][i],[.03,.16,2.2-i*.3],[left+.255,2.17-i*.34,-9.6]);
 if(state.garageLevel>=14){
  const far=l.factoryRight,center=(left+far)/2;
  box(group,'#d3e1e5',[far-left,.17,22.6],[center,.2,-24.8]);
  for(const x of [left,far])box(group,'#d5e2e9',[.22,1,22.6],[x,.785,-24.8]);
  box(group,'#dae6ec',[far-left,1.55,.22],[center,1.06,-36.1]);
  box(roof,'#48788c',[far-left+.3,.25,22.8],[center,4.1,-24.8]);
  for(let i=0;i<state.productionLines;i++){
   const x=left+4.2+i*6;
   box(group,'#527487',[1.65,.72,9.5],[x,.65,-24.5]);
   for(let z=-28.7;z<-19.8;z+=.55){const roll=cylinder(group,'#aec1cb',.12,1.5,[x,1.05,z],8);roll.rotation.z=Math.PI/2;}
   for(const side of [-1,1])box(group,'#f3c263',[.075,.12,9.5],[x+side*.84,1.14,-24.5]);
   roundedBox(group,'#227dae',[1.65,1.15,2],[x,1.2,-24.5]);box(group,'#ffb75f',[1.42,.27,.06],[x,1.32,-23.47]);
   for(const z of [-28.2,-20.5]){box(group,'#46758b',[.13,1.5,.13],[x+.75,1.64,z]);box(group,'#69cdd4',[1.55,.13,.15],[x,2.36,z]);}
   const glass=box(parent,'#98e6e5',[1.35,.09,1.1],[x,1.16,-28.2],true);glass.material=glass.material.clone();machines.push({glass,index:i,x});
   const p=factoryStation(state,i,2);box(group,'#46b9a7',[.13,.12,.13],[p.x+.72,1.6,p.z]);
  }
  roundedBox(group,'#335f7b',[1.4,.8,1.3],[left+2.7,.7,-16.6]);
  for(let i=0;i<8;i++){const pane=box(parent,'#92d8e3',[1.25,.8,.09],[left+2.7,1.5,-17+i*.115],true);panes.push(pane);}
  for(let x=left+2;x<far-1;x+=4.4){cylinder(roof,'#7292a2',.55,1.7,[x,4.85,-32.5],10);box(roof,'#284e74',[2.8,.07,2],[x,4.3,-20.5]);}
 }
 if(state.garageLevel>=15){
  box(group,'#d5e3e5',[13.8,.18,5],[l.officeLeft+9,.2,-34.5]);
  for(const side of [-1,1]){const x=l.officeLeft+9+side*3.5;roundedBox(group,'#2770a0',[5.5,5.4,4.2],[x,3.1,-34.5]);for(let row=0;row<4;row++)box(group,'#a4d8e3',[5,.7,.06],[x,1.4+row*1.1,-32.36],true);}
  addBrandPanel(parent,6.5,l.officeLeft+9,5.25,-32.26);
 }
 if(state.garageLevel>=9&&l.plotBack<-44){
  const yardLeft=l.officeLeft+2,yardRight=(l.workforce?l.workforce.left:l.plotRight)-2,back=l.plotBack+2;
  box(group,'#c2d4cf',[yardRight-yardLeft,.06,-38-back],[(yardLeft+yardRight)/2,.12,(back-38)/2]);
  for(let x=yardLeft+2;x<yardRight-1;x+=3.5){
   for(const side of [-1,1])box(group,'#eff5e5',[.06,.015,4.5],[x+side*1.55,.16,-63]);
   if(Math.floor(x)%3!==0){const car=makeCar(['#86b8c3','#f4e9cc','#4789b1'][Math.floor(x)%3]);car.position.set(x,.2,-63);car.userData.crack.visible=false;car.rotation.y=Math.PI;group.add(car);}
  }
  const count=back<-90?(state.garageLevel>=14?2:1):0;
  for(let i=0;i<count;i++){
   const x=yardLeft+7+i*18,z=back+9;if(x+7>yardRight)continue;
   roundedBox(group,'#d3e0e5',[13.5,3.8,12],[x,2.1,z]);box(group,'#327c9c',[13.8,.25,12.3],[x,4.08,z]);
   for(let j=0;j<4;j++){box(group,'#549da9',[2.3,.04,4.7],[x-4.8+j*3.2,4.24,z-1.8]);box(group,'#abcada',[2,.7,.055],[x-4.8+j*3.2,2.72,z+6.04],true);}
   box(group,'#58808d',[3,2.7,.07],[x,1.66,z+6.08]);addBrandPanel(parent,4.3,x,3.49,z+6.13);
  }
  for(const x of [yardLeft+1,yardRight-1])for(const z of [back+1,-38.4])tree(group,x,z,.9);
 }
 batchStatic(group);return{machines,panes};
}
