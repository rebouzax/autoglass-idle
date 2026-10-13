import * as THREE from 'three';
import {cityRoads} from '../models/ShopLayout.js';
import {maxparLayout,maxparBay,maxparSupply,maxparSeat,maxparLounge,maxparDesk,maxparBins,maxparDock} from '../models/MaxparProgression.js';
import {PRODUCTS} from '../models/Products.js';
import {box,cylinder,chair,tree,shopSign,batchStatic,material} from './LowPolyAssets.js';

export class MaxparScene{
 constructor(parent,roof,state){
  this.scanners=[];this.lights=[];this.stockMeshes=[];this.spray=[];if(state.garageLevel<7)return;
  const l=maxparLayout(state,cityRoads(state).zs[1]),group=new THREE.Group(),dynamic=new THREE.Group();parent.add(group,dynamic);this.layout=l;this.dynamic=dynamic;
  const width=l.right-l.left,depth=l.front-l.back;
  box(group,'#95aeb2',[l.plotRight-l.plotLeft,.14,l.plotFront-l.plotBack],[(l.plotLeft+l.plotRight)/2,.03,(l.plotFront+l.plotBack)/2]);
  if(!state.maxparLevel){
   box(group,'#b5cdad',[width,.05,depth],[(l.left+l.right)/2,.14,(l.back+l.front)/2]);
   const sign=shopSign('MAXPAR',5.5,'#208b83');sign.position.set((l.left+l.right)/2,1.8,l.front);dynamic.add(sign);
   for(const x of [l.left+2,l.right-2])tree(group,x,l.back+2,.85);batchStatic(group);return;
  }
  box(group,'#f0f0e6',[width,.17,depth],[(l.left+l.right)/2,.2,(l.front+l.back)/2]);
  const dock=maxparDock(l);for(const [x,from,to] of [[l.right,l.back,l.front],[l.left,l.back,dock.z-1.8],[l.left,dock.z+1.8,l.front]]){box(group,'#d2e5dc',[.18,1.15,to-from],[x,.86,(from+to)/2]);box(group,'#239a90',[.22,.15,to-from],[x,1.48,(from+to)/2]);}
  box(group,'#d2e5dc',[width,1.65,.18],[(l.left+l.right)/2,1.12,l.back]);
  box(group,'#168a83',[width+.3,.35,.42],[(l.left+l.right)/2,2.85,l.front]);
  const sign=shopSign('MAXPAR',Math.min(10,width*.6),'#168a83');sign.scale.y=2.5;sign.position.set((l.left+l.right)/2,2.9,l.front+.24);dynamic.add(sign);
  box(roof,'#dcebe4',[width+.4,.22,depth+.35],[(l.left+l.right)/2,3.2,(l.front+l.back)/2]);
  box(group,'#dce6d6',[width-.3,.03,l.clFront-l.clBack],[(l.left+l.right)/2,.3,(l.clFront+l.clBack)/2]);
  box(group,'#538c85',[width-7,.8,.13],[(l.left+7+l.right)/2,.75,l.clFront]);
  for(const z of [dock.z-1.8,dock.z+1.8])box(group,'#208c86',[.2,2.2,.2],[l.left,1.4,z]);box(group,'#208c86',[.2,.2,3.8],[l.left,2.45,dock.z]);
  box(group,'#456979',[3.2,.025,8],[dock.x,.16,dock.z]);for(const dx of [-1.7,1.7])box(group,'#f1d481',[.07,.025,8],[dock.x+dx,.19,dock.z]);
  box(group,'#50776f',[1.4,.9,.65],[l.left+.8,.77,l.clFront-6]);box(group,'#a5d9cd',[.38,.3,.06],[l.left+.8,1.4,l.clFront-6]);
  for(const [i,bin] of maxparBins(state,l).entries()){
   for(const dx of [-1.3,1.3])box(group,'#277f78',[.08,2.2,.78],[bin.x+dx,1.4,bin.z]);for(const y of [.6,1.3,2])box(group,'#c9bc83',[2.7,.1,.85],[bin.x,y,bin.z]);
   const offset=maxparBins(state,l).slice(0,i).filter(b=>b.product===bin.product).length*12;
   for(let row=0;row<3;row++){const g=new THREE.Group();dynamic.add(g);g.position.set(bin.x,.9+row*.7,bin.z);if(bin.product==='paint'){for(const dx of [-.65,0,.65]){cylinder(g,'#dfd9c9',.2,.4,[dx,0,0],10);cylinder(g,'#ae86c4',.21,.12,[dx,.15,0],10);}}else{box(g,PRODUCTS[bin.product].color,[1.9,.4,.65],[0,0,0]);box(g,'#f1dfb8',[.12,.42,.67],[0,0,0]);}this.stockMeshes.push({mesh:g,product:bin.product,threshold:offset+row*4});}
  }
  box(group,'#d8e6de',[7,.03,9],[l.left+3.7,.3,l.front-5.3]);
  box(group,'#adcfbf',[2.5,.9,.75],[l.left+3,.75,l.front-9.2]);box(group,'#f6e3b8',[2.65,.1,.9],[l.left+3,1.26,l.front-9.2]);
  box(group,'#28495b',[.6,.42,.07],[l.left+3,1.5,l.front-9.32]);box(group,'#8bddd2',[.52,.3,.018],[l.left+3,1.52,l.front-9.26]);
  for(let i=0;i<l.bays;i++){const b=maxparBay(l,i),p=maxparSupply(l,i),home=maxparSeat(l,i);
   box(group,'#a2bec1',[3.4,.025,6.2],[b.x,.305,b.z]);for(const dx of [-1.7,1.7])box(group,'#e9ce75',[.07,.025,6.2],[b.x+dx,.33,b.z]);
   for(const side of [-1,1])box(group,'#178b83',[.2,2.45,.26],[b.x+side*2.5,1.51,l.front]);
   chair(group,home.x,home.z,0,'#3f9d92');
   box(group,'#2b9a91',[.85,1,.75],[p.x,.8,p.z-1]);for(let row=0;row<3;row++)box(group,'#c7e3d5',[.58,.04,.02],[p.x,1.06-row*.23,p.z-.61]);
   box(group,'#e6d2a5',[2.8,.1,.65],[b.x,1.04,l.front-14]);for(let n=0;n<Math.min(5,state.maxparTools);n++)box(group,['#426978','#e7c66b','#65c8c1'][n%3],[.13,.25,.15],[b.x-1+n*.4,1.24,l.front-14]);
   if(state.maxparLevel>=3){box(group,'#789e9c',[.65,.9,.65],[b.x-2,.75,b.z-2.5]);cylinder(group,'#ddc274',.13,.6,[b.x-2,1.3,b.z-2.5],8);}
   if(state.maxparLevel>=4){box(group,'#456775',[.5,.95,.55],[b.x+2,.78,b.z-2.5]);box(group,'#a5e0d4',[.38,.27,.03],[b.x+2,1.14,b.z-2.2]);}
   const scanner=box(dynamic,'#61efcf',[.025,.06,2.5],[b.x,1.48,b.z],true);scanner.visible=false;this.scanners.push({mesh:scanner,index:i,x:b.x});
   const light=box(dynamic,'#65b99e',[.28,.16,.16],[b.x,2.88,l.front+.25]);this.lights.push({mesh:light,index:i});
   const spray=new THREE.Group();dynamic.add(spray);for(let n=0;n<8;n++){const mist=new THREE.Mesh(new THREE.IcosahedronGeometry(.065,0),new THREE.MeshBasicMaterial({color:'#97cdb8',transparent:true,opacity:.45,depthWrite:false}));mist.userData.ownedMaterial=true;spray.add(mist);}const gun=cylinder(spray,'#506f78',.065,.22,[0,0,0],6);gun.rotation.z=Math.PI/2;this.spray.push({group:spray,index:i,x:b.x,z:b.z});
   const seat=maxparLounge(l,i);chair(group,seat.x,seat.z,seat.facing,'#7bb7a3');
  }
  const deskCount=Math.max(0,state.maxparWorkers-Math.min(l.bays,state.maxparWorkers));
  for(let i=0;i<deskCount;i++){const p=maxparDesk(l,i);chair(group,p.x,p.z,Math.PI,'#6b9999');box(group,'#e1ca9f',[2,.1,.65],[p.x,1.03,p.z-.9]);box(group,'#315362',[.64,.42,.055],[p.x,1.32,p.z-1]);box(group,'#9adfd6',[.53,.3,.015],[p.x,1.34,p.z-.96]);box(group,'#a3cbbd',[.05,.55,.9],[p.x+1.12,1.3,p.z-.65]);}
  if(state.maxparComfort){box(group,'#416576',[.07,.9,2],[l.left+.15,1.9,l.front-4]);box(group,'#90d8cd',[.028,.65,1.7],[l.left+.2,1.92,l.front-4]);cylinder(group,'#d2e0dc',.2,1.1,[l.left+1,.9,l.front-11],8);}
  if(state.maxparComfort>=2){box(group,'#407e79',[.6,.75,.6],[l.left+.6,.66,l.front-12.2]);box(group,'#dedac5',[.45,.05,.4],[l.left+.6,1.05,l.front-12.2]);}
  if(state.maxparComfort>=3)box(group,'#6eb69a',[.05,.9,1.2],[l.left+.13,1.65,l.front-14]);
  if(state.maxparComfort>=4){box(group,'#3f777d',[.07,.9,1.7],[l.left+.13,1.75,l.front-16]);box(group,'#81d8d2',[.03,.65,1.4],[l.left+.2,1.75,l.front-16]);}
  if(state.maxparContracts>=2){box(group,'#347a79',[3,.08,2],[l.left+4,.9,l.back+4]);for(const dx of [-2,2])chair(group,l.left+4+dx,l.back+4,dx>0?-Math.PI/2:Math.PI/2,'#6caa9c');}
  for(const x of [l.plotLeft+.8,l.plotRight-.8])for(const z of [l.plotBack+1,l.plotFront-1])tree(group,x,z,.7);
  batchStatic(group);
 }
 update(model,time){
  if(!model?.enabled)return;
  for(const {mesh,index,x} of this.scanners){const car=model.cars.find(c=>c.bay===index&&!c.paid),worker=car&&model.workers.find(w=>w.carId===car.id);mesh.visible=!!worker&&['diagnosing','quality'].includes(worker.phase);mesh.position.x=x+Math.sin(time*4)*.55;}
  for(const {mesh,index} of this.lights){const car=model.cars.find(c=>c.bay===index&&!['leaving','gone'].includes(c.phase));mesh.material=material(!car?'#65b99e':car.phase==='working'?'#f0c66c':'#7cbac4');}
  for(const {mesh,product,threshold} of this.stockMeshes)mesh.visible=(model.economy.state.maxparMaterials[product]||0)>threshold;
  for(const {group,index,x,z} of this.spray){const car=model.cars.find(c=>c.bay===index&&!c.paid),worker=car&&model.workers.find(w=>w.carId===car.id),painting=!!worker?.painting,steam=!!car?.broken&&car.phase!=='arriving';group.visible=painting||steam;group.position.set(painting?worker.x-.3:x,1.25,painting?worker.z:z-.8);group.children[8].visible=painting;if(group.visible)for(let n=0;n<8;n++){const p=group.children[n],cycle=(time*2+n*.13)%1;p.position.set(painting?-cycle*1.2:Math.sin(n)*.1,painting?Math.sin(time*4+n)*.12:cycle*1.05,painting?(n-4)*.09:Math.cos(n)*.1);p.material.color.set(painting?car.paintColor:'#a4b9bd');p.material.opacity=(1-cycle)*.45;}}
 }
}
