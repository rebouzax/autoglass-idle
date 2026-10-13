import {onCityRoad,logisticsAccess,driveway} from '../models/ShopLayout.js';
import {maxparLayout} from '../models/MaxparProgression.js';
import * as THREE from 'three';
import {activeStaff} from '../models/Workforce.js';
import {box,roundedBox,cylinder,tree,batchStatic} from './LowPolyAssets.js';

const shades=['#5a9dc1','#dfb270','#de9783','#8ebaaa','#afb5d5'];

export function buildShowroom(parent,car){
  const x=5.6,z=-2.1,radius=4.15;
  car.position.set(x,.26,z);car.scale.setScalar(2.08);
  const floor=box(parent,'#0c3779',[180,.16,180],[0,-.34,0]);floor.castShadow=false;
  cylinder(parent,'#164f94',radius+.14,.24,[x,-.13,z],64);
  cylinder(parent,'#215d9d',radius,.14,[x,.035,z],64);
  cylinder(parent,'#326caf',radius-.15,.03,[x,.12,z],64);
  const rings=[];
  for(const [r,color,y] of [[radius-.035,'#61d5ed',.11],[radius+.55,'#2c75b4',-.2],[radius+1.2,'#225595',-.22]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.028,6,96),new THREE.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.set(x,y,z);parent.add(ring);rings.push(ring);
  }
  for(let i=0;i<5;i++){
    const slab=roundedBox(parent,i%2?'#14488b':'#194f96',[.18,4.2+i*.7,.18],[x-6+i*.9,1.8+i*.35,z-7-i*.6]);slab.rotation.z=-.26;slab.castShadow=false;
  }
  const arc=new THREE.Mesh(new THREE.TorusGeometry(7.2,.055,6,96,Math.PI*1.17),new THREE.MeshBasicMaterial({color:'#246bb0'}));arc.position.set(x,1.8,z-7);arc.rotation.z=-.27;parent.add(arc);
  const key=new THREE.DirectionalLight('#ecfaff',3.3);key.position.set(x-7,18,z+12);key.target.position.set(x,0,z);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.1,far:55});key.shadow.normalBias=.04;key.shadow.bias=-.0002;parent.add(key,key.target);
  const rim=new THREE.DirectionalLight('#5eebff',2.1);rim.position.set(x+6,8,z-9);rim.target.position.set(x,.8,z);parent.add(rim,rim.target);
  const fill=new THREE.DirectionalLight('#719cff',.9);fill.position.set(x-10,5,z-3);fill.target.position.set(x,1,z);parent.add(fill,fill.target);
  return {x,z,rings};
}

export function addShopFinish(parent,state,l){
  const decor=new THREE.Group();parent.add(decor);
  const width=l.right-l.left;
  // Furniture detail stays inside the same footprints used by navigation.
  for(const z of [l.back+.15,l.front-.16])box(decor,'#d4e4eb',[width-.3,.035,.095],[(l.left+l.right)/2,.308,z]);
  box(decor,'#c0d3dd',[.07,.11,l.front-l.back-.3],[l.left+.16,.34,(l.front+l.back)/2]);
  for(let i=0;i<state.bays;i++){
    const x=1.25+i*5.2;
    for(let row=0;row<5;row++)box(decor,'#c7d3d6',[2.65,.01,.035],[x,.327,.95-row*1.08]);
    for(const side of [-1,1])box(decor,'#387e9a',[.19,.018,4.25],[x+side*1.3,.336,-1.28]);
  }
  // Frosted glass panels and timber accents fit on the existing lounge divider.
  for(const z of [-6.8,-4.8,-2.8,-.8]){
    box(decor,'#5f9cb7',[.035,.4,1.85],[-2.69,1.59,z],true);
    box(decor,'#ecf8fd',[.065,.055,1.94],[-2.69,1.82,z]);
    box(decor,'#287cb1',[.065,.5,.055],[-2.69,1.58,z+.96]);
  }
  for(let i=0;i<activeStaff(state,'cashier');i++){
    const x=[-8.15,-5.8,-3.55][i];
    box(decor,'#eff7fa',[1.43,.52,.024],[x,.82,-6.703]);
    box(decor,'#2b83bf',[1.43,.1,.028],[x,.51,-6.697]);
    roundedBox(decor,'#213e59',[.28,.045,.2],[x-.39,1.28,-6.84]);
    box(decor,'#82cae2',[.21,.03,.14],[x-.39,1.307,-6.84],true);
  }
  box(decor,'#2f78a5',[width,.1,.4],[(l.left+l.right)/2,3.04,-9.07]);
  for(let x=l.left+.9;x<l.right-.5;x+=3.6){
    box(decor,'#e7f5fa',[2.3,.09,.25],[x,3.01,-8.96]);
    box(decor,'#3b8bbe',[.08,.25,.22],[x,2.87,-9.02]);
  }
  if(state.garageLevel>=2){
    for(const rack of [-.9,2.25,5.3,8.35]){
      box(decor,'#cde5ee',[.85,.06,.045],[rack,1.09,rack===-.9?-4.91:-5.587]);
    }
    for(let x=l.left+.9;x<l.right;x+=3.6)box(decor,'#dae7ef',[1.7,.06,.22],[x,2.91,l.clBack+.15]);
  }
  if(state.garageLevel>=4){
    for(let x=l.officeLeft+.5;x<l.officeRight-.4;x+=1.5){
      box(decor,'#a3cadc',[.035,.44,1.3],[l.officeRight-.01,.93,-2.0-(x-l.officeLeft)*.6],true);
    }
    box(decor,'#23679e',[l.officeRight-l.officeLeft,.07,.28],[(l.officeLeft+l.officeRight)/2,2.98,l.officeBack+.03]);
  }
  batchStatic(decor);
  return decor;
}

function smallPark(parent,x,z,width=8){
  box(parent,'#c9d9cd',[width+.6,.11,width+.6],[x,.07,z]);
  box(parent,'#6fab79',[width,.055,width],[x,.16,z]);
  box(parent,'#e2e6d8',[width,.065,1.15],[x,.2,z]);
  for(const side of [-1,1]){
    tree(parent,x+side*(width/2-1.25),z-side*1.7,.83);
    box(parent,'#b1805f',[1.65,.09,.48],[x+side*1.6,.69,z+1.25]);
    box(parent,'#b1805f',[1.65,.42,.075],[x+side*1.6,.94,z+1.55]);
    for(const dx of [-.55,.55])box(parent,'#4c7285',[.075,.49,.38],[x+side*1.6+dx,.45,z+1.25]);
  }
  cylinder(parent,'#e2e9e3',.73,.17,[x,.3,z-1.8],12);
  cylinder(parent,'#81cada',.57,.06,[x,.42,z-1.8],12);
}

export function addCityDetails(city,state,l,roads,extent,buildings=[]){
  const m=state.garageLevel>=7?maxparLayout(state,roads.zs[1]):null,access=logisticsAccess(state),occupied=(x,z,r=2)=>m&&x+r>m.plotLeft&&x-r<m.plotRight&&z+r>m.plotBack&&z-r<m.plotFront||state.garageLevel>=2&&Math.abs(x-access.entryX)<3.4+r&&z+r>access.road&&z-r<l.plotBack+2||(x+r>l.plotLeft&&x-r<l.plotRight&&z+r>l.plotBack&&z-r<driveway(state).front)||(state.garageLevel>=15&&(Math.abs(z-32)<r+4||Math.abs(x+46)<r+4||x>-84-r&&x<-46+r&&z>l.plotBack-5&&z<5))||(state.garageLevel>=16&&z>43-r);const curb=state.garageLevel>=6?4.6:3.42;
  for(const z of roads.zs){
    for(const side of [-1,1]){
      for(let x=-extent/2+1;x<extent/2;x+=2){if(roads.xs.some(v=>Math.abs(x-v)<6)||side===-1&&z===roads.zs[0]&&x>-12&&x<l.officeRight+1||m&&side===-1&&z===roads.zs[1]&&x>m.left&&x<m.right||state.garageLevel>=2&&side===1&&z===access.road&&Math.abs(x-access.entryX)<4.5||state.maxparLevel&&side===1&&z===roads.zs[1]&&Math.abs(x+12.5)<3)continue;box(city,'#aabac0',[2,.11,.14],[x,.095,z+side*curb]);}
      for(let x=-extent/2+4;x<extent/2-4;x+=14){
        if(roads.xs.some(v=>Math.abs(x-v)<8)||occupied(x,z+side*(curb+2.2),1.2))continue;
        box(city,'#c3d2c6',[2.25,.11,1.3],[x,.06,z+side*(curb+2.2)]);
        tree(city,x,z+side*(curb+2.2),.83);
        if(side===-1&&!onCityRoad(state,x+3,z-curb-.75,.15)){
          cylinder(city,'#456c82',.055,3.5,[x+3,1.78,z-curb-.75],6);
          roundedBox(city,'#edf6ef',[.52,.1,.18],[x+3.19,3.55,z-curb-.75]);
        }
      }
    }
  }
  for(const x of roads.xs)for(const side of [-1,1]){
    for(let z=-extent/2+1;z<(state.garageLevel>=16?43:extent/2);z+=2){if(roads.zs.some(v=>Math.abs(z-v)<6)||z<l.plotBack-10)continue;box(city,'#aabac0',[.14,.11,2],[x+side*curb,.095,z]);}
    for(let z=-extent/2+8;z<extent/2-4;z+=16){
      if(roads.zs.some(v=>Math.abs(z-v)<8)||occupied(x+side*(curb+2.4),z,1.3))continue;
      tree(city,x+side*(curb+2.4),z,.8);
    }
  }
  for(const [x,z] of [[-11,25],[-40,4],[43,23],[-40,-30],[11,-39]]){
    if(occupied(x,z,5)||roads.xs.some(v=>Math.abs(x-v)<9)||roads.zs.some(v=>Math.abs(z-v)<9)||buildings.some(([bx,bz,w])=>Math.abs(x-bx)<w/2+4.5&&Math.abs(z-bz)<w*.4+4.5))continue;
    smallPark(city,x,z,7);
  }
  // Corner buildings get facade accents, roof equipment and sheltered entrances.
  return shades;
}

export function addHouseDetail(parent,x,z,width,height,depth,color){
  const accent=shades[(Math.floor(Math.abs(x)+Math.abs(z)))%shades.length];
  box(parent,accent,[width,.22,.15],[x,height>.5?height*.53:1,z+depth/2+.13]);
  box(parent,'#f4f3e9',[1.48,.09,.78],[x,1.79,z+depth/2+.42]);
  for(const side of [-1,1])box(parent,'#d4e4e9',[.075,1.64,.075],[x+side*.66,.92,z+depth/2+.62]);
  if(height>=5){
    roundedBox(parent,'#e3e9e5',[.8,.38,.65],[x+width*.24,height+.6,z-depth*.2]);
    for(let i=0;i<4;i++)box(parent,'#8b9da6',[.055,.045,.5],[x+width*.24-.22+i*.14,height+.8,z-depth*.2]);
    box(parent,'#448ab5',[width*.53,.04,depth*.3],[x-width*.15,height+.43,z+depth*.16],true);
    for(let i=0;i<3;i++)box(parent,'#aacddd',[.035,.015,depth*.3],[x-width*.36+i*width*.16,height+.455,z+depth*.16]);
  }
  for(const side of [-1,1]){
    box(parent,'#cba784',[.7,.22,.4],[x+side*width*.28,.27,z+depth/2+.3]);
    roundedBox(parent,'#76a876',[.69,.23,.39],[x+side*width*.28,.49,z+depth/2+.3]);
  }
}
