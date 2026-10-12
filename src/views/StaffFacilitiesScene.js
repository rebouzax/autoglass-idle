import * as THREE from 'three';
import {box,cylinder,chair} from './LowPolyAssets.js';
import {staffFacilities} from '../models/StaffFacilities.js';

export class StaffFacilitiesScene {
 constructor(parent,layout,dynamicParent=parent){
  this.indicators=[];this.doors=[];this.rooms=staffFacilities(layout);this.statusMaterial=new THREE.MeshStandardMaterial({color:'#77d9ba',emissive:'#39bca9',emissiveIntensity:.3});
  const colors={canteen:'#e7d6aa',toilet:'#d8ebed',shower:'#c6e5e8',gym:'#bddccc',lounge:'#d6e5cd',water:'#c9e3dc',meeting:'#b6d6e5',focus:'#d9d4eb',network:'#a7c7da',garden:'#91bc95',event:'#c4dbe6'};
  for(const r of this.rooms){
   const {x,z,width}=r;box(parent,colors[r.type],[width-.2,.03,7.1],[x,.32,z+.1]);
   // Rear approach remains open; partitions only separate the furniture bays.
   box(parent,'#79a8b7',[.11,1.45,6.6],[x-width/2,.99,z+.25]);
   box(parent,'#d2e1de',[width-.25,1.45,.14],[x,1.02,r.front]);
   const wall=r.front-.13;
   if(['toilet','shower'].includes(r.type)){
    for(const slot of r.slots){
     box(parent,'#f5f5e8',[1.6,.07,2.8],[slot.x,.39,z+.1]);box(parent,'#9fbac1',[.08,1.7,2.8],[slot.x-.8,1.23,z+.1]);
     const door=box(dynamicParent,'#59889b',[1.42,1.5,.08],[slot.x,1.18,z-1.37]);this.doors.push({slot:slot.id,mesh:door,x:slot.x});
     if(r.type==='toilet'){cylinder(parent,'#f7f5df',.3,.43,[slot.x,.62,z],10);box(parent,'#f7f5df',[.6,.65,.2],[slot.x,.75,z+.48]);}
     else{cylinder(parent,'#7794a3',.025,1.9,[slot.x,1.37,z+.65],6);box(parent,'#f2f5e9',[.42,.06,.42],[slot.x,2.3,z+.45]);}
     const light=box(parent,'#77d9ba',[.14,.12,.05],[slot.x+.55,1.92,z-1.42]);light.material=this.statusMaterial.clone();this.indicators.push({slot:slot.id,mesh:light});
    }
    box(parent,'#faf5dc',[width-.4,.14,.62],[x,.94,wall-.45]);for(const dx of [-.8,.8]){box(parent,'#438997',[.55,.04,.36],[x+dx,1.03,wall-.43]);box(parent,'#74a8b3',[.72,.55,.04],[x+dx,1.47,wall]);}
   }else if(r.type==='garden'){
    for(const slot of r.slots){chair(parent,slot.x,slot.z,0,'#517e85');box(parent,'#c8b28c',[1.5,.12,.4],[slot.x,.94,z+.35]);}
    for(const dx of [-width/2+.5,width/2-.5]){cylinder(parent,'#b6a079',.35,.45,[x+dx,.57,z+.8],6);cylinder(parent,'#75aa75',.48,1,[x+dx,1.24,z+.8],5);}
    box(parent,'#f1dcb3',[width-.5,.07,1],[x,2.5,wall-.8]);
   }else if(r.type==='gym'){
    for(const slot of r.slots){box(parent,'#2f5362',[1.35,.17,2.3],[slot.x,.47,slot.z+.2]);box(parent,'#607782',[1.05,.03,1.8],[slot.x,.57,slot.z+.2]);for(const dx of [-.52,.52])box(parent,'#75b6c7',[.07,1.1,.07],[slot.x+dx,1.01,slot.z+1]);box(parent,'#183c59',[1.3,.4,.12],[slot.x,1.54,slot.z+1]);}
    box(parent,'#8cc1ce',[width-.5,.87,.04],[x,1.04,wall]);
   }else if(r.type==='water'){
    for(const slot of r.slots){box(parent,'#eaf2e5',[.6,1,.52],[slot.x,.92,z]);cylinder(parent,'#68c7df',.23,.5,[slot.x,1.63,z],10);box(parent,'#286387',[.33,.21,.03],[slot.x,1.11,z-.28]);}
   }else if(r.type==='network'){
    for(const slot of r.slots){box(parent,'#27475e',[1.4,1.6,.68],[slot.x,1.16,z+.25]);for(let h=0;h<5;h++){box(parent,'#456b7b',[1.1,.18,.04],[slot.x,.57+h*.26,z-.11]);box(parent,'#58d9b8',[.12,.045,.04],[slot.x+.4,.6+h*.26,z-.14]);}}
    box(parent,'#2486ae',[width-.5,.045,.055],[x,.37,z+1]);
   }else{
    const lounge=r.type==='lounge';
    box(parent,lounge?'#c6af80':'#d9b884',[width-1.1,.12,lounge?.8:1.3],[x,lounge?.73:1.15,z+.2]);
    for(const slot of r.slots){chair(parent,slot.x,slot.z,0,lounge?'#397a94':r.type==='canteen'?'#e2a54e':'#417e9d');if(r.type==='canteen'){cylinder(parent,'#f8efcc',.21,.04,[slot.x,1.25,z-.14],10);box(parent,'#e39454',[.22,.055,.18],[slot.x,1.29,z-.14]);}else if(r.type==='focus'){box(parent,'#2e526f',[.72,.45,.05],[slot.x,1.45,z+.3]);box(parent,'#8bd3d7',[.64,.34,.012],[slot.x,1.45,z+.267]);}else{box(parent,'#75a7c3',[.48,.035,.33],[slot.x,1.23,z]);}}
    // Wall-mounted TV / meeting display and a small framed graphic.
    box(parent,'#284e67',[Math.min(2.4,width-.5),.98,.09],[x,1.42,wall]);
    box(parent,'#7dc4dc',[Math.min(2.2,width-.7),.79,.03],[x,1.42,wall-.06]);
    for(let k=0;k<3;k++)box(parent,['#5aa78e','#f4d186','#3685b8'][k],[.32,.18+k*.11,.025],[x-.65+k*.55,1.19+k*.055,wall-.085]);
   }
   // Planters and wall art are behind the furniture, clear of the walking lane.
   cylinder(parent,'#b4a47b',.24,.45,[x+width/2-.5,.56,z+2.1],6);cylinder(parent,'#72ae83',.34,.65,[x+width/2-.5,1.09,z+2.1],5);
  }
 }
 update(staff){for(const light of this.indicators){const busy=staff?.facilityOwners.has(light.slot);light.mesh.material.color.set(busy?'#e8b65c':'#77d9ba');light.mesh.material.emissive.set(busy?'#946726':'#39bca9');}for(const door of this.doors){const target=door.x+(staff?.facilityOwners.has(door.slot)?.95:0);door.mesh.position.x+=(target-door.mesh.position.x)*.2;}}
 dispose(){for(const light of this.indicators)light.mesh.material.dispose();this.statusMaterial.dispose();}
}
