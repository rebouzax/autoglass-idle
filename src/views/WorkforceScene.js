import {StaffFacilitiesScene} from './StaffFacilitiesScene.js';
import * as THREE from 'three';
import {workforceStations,staffCapacity} from '../models/Workforce.js';
import {box,chair,batchStatic} from './LowPolyAssets.js';
import {buildCorporateCampus} from './CorporateCampus.js';
import {addBrandPanel} from './CompanyDecor.js';

export class WorkforceScene{
  constructor(parent,state,layout){
    this.group=new THREE.Group();parent.add(this.group);this.parts=[];this.cells=[];this.lastTime=-1;
    const l=layout.workforce;this.capacity=staffCapacity(state)+8;if(l){
    this.cells=workforceStations(state,layout);
    const structure=new THREE.Group();this.group.add(structure);
    box(structure,'#e7eef0',[l.width,.17,l.front-l.back],[(l.left+l.right)/2,.2,(l.front+l.back)/2]);
    for(let zone=0;zone<3;zone++)for(let row=0;row<2;row++){
      const depth=row?l.bottom:l.top,z=l.front-(row?l.top:0)-depth/2,x=l.left+zone*l.zoneWidth+l.zoneWidth/2;
      box(structure,['#e4f0f3','#eef0dc','#e9e6f5'][zone],[l.zoneWidth-.4,.02,depth-.4],[x,.3,z]);
      if(zone<2)box(structure,'#84aabe',[.12,.7,depth-1.3],[x+l.zoneWidth/2,.66,z]);
    }
    for(const x of [l.left,l.right])for(const row of [0,1]){const front=l.front-(row?l.top:0),depth=row?l.bottom:l.top;box(structure,'#b7cfdb',[.18,.7,8.3],[x,.66,front-4.15]);box(structure,'#b7cfdb',[.18,.7,depth-12],[x,.66,front-12-(depth-12)/2]);}
    box(structure,'#368abd',[l.width,.48,.18],[(l.left+l.right)/2,2.5,l.back]);
    addBrandPanel(this.group,5.7,(l.left+l.right)/2,2.48,l.back+.12);
    buildCorporateCampus(structure,state,layout);this.facilities=new StaffFacilitiesScene(structure,layout);
    for(const cell of this.cells){
      const station=new THREE.Group();station.position.y=cell.y||0;structure.add(station);
      const desk=['salesWorker','itWorker','cashier'].includes(cell.role);
      box(station,desk?'#d8bb8a':'#5b879a',[1.65,.1,.64],[cell.x,1.03,cell.z-.58]);
      for(const side of [-1,1])box(station,'#698496',[.07,.69,.5],[cell.x+side*.7,.64,cell.z-.58]);
      if(desk){chair(station,cell.x,cell.z,Math.PI,cell.color);box(station,'#2e516a',[.63,.4,.06],[cell.x,1.31,cell.z-.77]);box(station,'#87cde3',[.53,.3,.015],[cell.x,1.32,cell.z-.72]);box(station,'#e5edf1',[.55,.035,.23],[cell.x,1.12,cell.z-.45]);}
      if(desk){
        box(station,'#f3d277',[.09,.25,.09],[cell.x-.54,1.19,cell.z-.58]);
        if(state.garageLevel>=7)box(station,'#8dafba',[.06,.6,1],[cell.x+.94,1.28,cell.z-.45]);
        if(cell.role==='itWorker'&&state.itComputers>=4){box(station,'#294e66',[.4,.32,.05],[cell.x-.57,1.27,cell.z-.75]);box(station,'#65decc',[.34,.24,.012],[cell.x-.57,1.28,cell.z-.718]);}
      }
      else {box(station,cell.role==='worker'?'#9edce4':'#d8ad74',[.72,.38,.42],[cell.x,1.27,cell.z-.62],cell.role==='worker');box(station,cell.color,[.22,.09,.15],[cell.x+.57,1.12,cell.z-.62]);}
    }
    for(const c of this.cells){const bench=new THREE.Group();bench.position.y=c.y||0;structure.add(bench);box(bench,['worker','logistics','factoryWorker'].includes(c.role)?'#5a8794':'#baa579',[1.25,.1,.6],[c.x-.45,1.01,c.z+1.55]);for(const side of [-1,1])box(bench,'#697f89',[.07,.68,.5],[c.x-.45+side*.48,.64,c.z+1.55]);box(bench,c.role==='worker'?'#9bdbdf':'#dcba84',[.5,.3,.4],[c.x-.45,1.21,c.z+1.55]);}
    batchStatic(structure);}
    this.fallback=this.cells.map(c=>({...c,visible:true,phase:'working',task:'idle',facing:Math.PI}));
    this.dummy=new THREE.Object3D();this.color=new THREE.Color();
    const skin=new THREE.MeshStandardMaterial({color:'#e9bb91',roughness:.85}),uniform=new THREE.MeshStandardMaterial({color:'white',roughness:.85}),trousers=new THREE.MeshStandardMaterial({color:'#2b4f65',roughness:.9});
    this.materials=[skin,uniform,trousers];this.cube=new THREE.BoxGeometry(1,1,1);this.headGeometry=new THREE.IcosahedronGeometry(.19,0);
    for(const [name,geometry,material] of [['body',this.cube,uniform],['head',this.headGeometry,skin],['armL',this.cube,uniform],['armR',this.cube,uniform],['legL',this.cube,trousers],['legR',this.cube,trousers]]){
      const mesh=new THREE.InstancedMesh(geometry,material,this.capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;this.group.add(mesh);this.parts.push({name,mesh});
      if(name==='body'||name.startsWith('arm'))for(let i=0;i<this.cells.length;i++)mesh.setColorAt(i,this.color.set(this.cells[i].color));
    }
    const parcelMaterial=new THREE.MeshStandardMaterial({color:'#d6b17c',roughness:.8}),phoneMaterial=new THREE.MeshStandardMaterial({color:'#244859',roughness:.5});this.materials.push(parcelMaterial,phoneMaterial);
    for(const [name,mat] of [['parcel',parcelMaterial],['phone',phoneMaterial]]){const mesh=new THREE.InstancedMesh(this.cube,mat,this.capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;this.group.add(mesh);this.parts.push({name,mesh});}
    this.rootPose=new THREE.Object3D();this.update(0);
  }
  update(time,staff){
    if(time-this.lastTime<1/15&&time>=this.lastTime)return;this.lastTime=time;this.facilities?.update(staff);
    const records=staff?staff.records.filter(r=>(r.role==='logistics'&&r.actor&&!r.actor.offDuty&&!r.external)||r.visible&&!(r.phase==='break'&&['toilet','shower'].includes(r.breakKind))&&(r.support||r.external)||r.vehicle?.vehicleType==='moto'&&!['home','parked'].includes(r.vehicle.phase)):this.fallback;
    for(let i=0;i<records.length;i++){
      const source=records[i],a=source.actor,r=source.role==='logistics'&&a&&!a.offDuty&&!source.external?{...source,x:a.x,z:a.z,y:0,facing:a.facing,walk:a.walk,moving:a.moving,seated:a.seated&&!a.moving,scanning:a.scanning,carryingBox:a.carryingBox,phase:'working',task:a.working||a.scanning?'processing':'idle'}:source,riding=r.vehicle?.vehicleType==='moto'&&!['home','parked'].includes(r.vehicle.phase),desk=['salesWorker','itWorker','cashier'].includes(r.role),exercising=r.phase==='break'&&r.breakKind==='gym',walking=!riding&&(!!r.moving||exercising),resting=r.phase==='break',seated=riding||r.seated&&!walking||resting&&['canteen','lounge','focus','meeting'].includes(r.breakKind)||desk&&!walking&&r.phase==='working'&&r.task==='idle',processing=r.task==='processing'||resting&&r.breakKind==='water',body=seated?.91:1.04,phase=time*2+i*1.7;
      this.rootPose.position.set(riding?r.vehicle.x:r.x,.3+(riding?0:r.y||0),riding?r.vehicle.z:r.z);this.rootPose.rotation.set(0,riding?r.vehicle.facing:r.facing??Math.PI,0);this.rootPose.updateMatrix();
      for(const {name,mesh} of this.parts){
        this.dummy.position.set(0,body,0);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(1,1,1);
        if(name==='body'){this.dummy.scale.set(.4,.5,.25);this.dummy.rotation.x=processing?-.08:0;this.dummy.position.y+=walking?Math.abs(Math.sin(exercising?time*9:r.walk||0))*.025:Math.sin(phase*.7)*.008;}
        else if(name==='head'){this.dummy.position.y=body+.4;this.dummy.rotation.y=Math.sin(phase*.3)*.13;if(r.activity==='meeting'&&processing)this.dummy.rotation.y+=Math.sin(time)*.35;}
        else if(name.startsWith('arm')){const side=name==='armL'?-1:1;this.dummy.position.x=side*.29;this.dummy.scale.set(.12,.4,.13);this.dummy.rotation.x=r.calling&&side===1?-2:r.carryingBox||riding?-1.2:walking?Math.sin(exercising?time*9:r.walk||0)*side*.45:-(processing||seated?1:.15)+Math.sin(phase+side)*.15;}
        else if(name.startsWith('leg')){const side=name==='legL'?-1:1;this.dummy.position.set(side*.12,seated?.45:.48,0);this.dummy.scale.set(.14,.52,.17);this.dummy.rotation.x=walking?Math.sin(exercising?time*9:r.walk||0)*side*.55:seated?-.5:0;}
        else if(name==='parcel'){this.dummy.position.set(0,1.05,.4);this.dummy.scale.set(r.carryingBox?.52:0,.38,.42);}
        else{this.dummy.position.set(r.scanning?.18:.27,r.scanning?1.05:1.36,r.scanning?.32:.12);this.dummy.scale.set(r.calling||r.scanning?.12:0,.2,.05);}
        this.dummy.updateMatrix();this.dummy.matrix.premultiply(this.rootPose.matrix);mesh.setMatrixAt(i,this.dummy.matrix);
        if(name==='body'||name.startsWith('arm'))mesh.setColorAt(i,this.color.set(r.color||'#79a6b5'));
      }
    }
    for(const {mesh} of this.parts){mesh.count=records.length;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  }
  dispose(){this.facilities?.dispose();this.group.traverse(node=>{if(node.userData.sign){node.geometry?.dispose();node.material.map?.dispose();node.material.dispose();}else if(node.userData.batched)node.geometry.dispose();});for(const {mesh} of this.parts)mesh.dispose();this.cube?.dispose();this.headGeometry?.dispose();this.materials?.forEach(material=>material.dispose());this.group.removeFromParent();}
}
