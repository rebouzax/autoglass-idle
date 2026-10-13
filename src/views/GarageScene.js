import * as THREE from 'three';
import {buildUpgradeDecor,buildCargoTerminals,updateAdvancedDecor} from './AdvancedDecor.js';
import {activeStaff} from '../models/Workforce.js';
import {WorkforceScene} from './WorkforceScene.js';
import {cargoLayout,freightRoute} from '../models/CargoRoutes.js';
import {PerformanceProfile} from '../services/PerformanceProfile.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildCampus,buildFulfillment} from './CampusDecor.js';
import {MaxparScene} from './MaxparScene.js';
import {maxparLayout} from '../models/MaxparProgression.js';
import {GameEffects} from './GameEffects.js';
import {addBrandPanel,buildITDepartment,buildBusinessDisplay} from './CompanyDecor.js';
import {buildShowroom,addShopFinish,addCityDetails,addHouseDetail} from './SceneDecor.js';
import {PRODUCTS,productKeys} from '../models/Products.js';
import {CameraController} from '../services/CameraController.js';
import {bayX,workerSeat,drawerX,loungeSpot,deskX,getAddresses,shopLayout,drawerZ,cityRoads,officeDesk,meetingSeat,productPoint,packingBench,dispatchBay,driveway,docks,scanStation,collectorHome,onCityRoad,logisticsAccess,cityExtent} from '../models/ShopLayout.js';
import {box,roundedBox,cylinder,material,tree,shopSign,makeCar,makeMotorcycle,makeProduct,makePerson,animatePerson,batchStatic,emojiBubble,chair,makeTruck} from './LowPolyAssets.js';

export class GarageScene {
  constructor(canvas,pad){
    this.canvas=canvas;this.time=0;this.carMeshes=new Map();this.workerMeshes=new Map();this.driverMeshes=new Map();this.cashierMeshes=new Map();this.receiverMeshes=new Map();this.officeMeshes=new Map();this.itMeshes=new Map();this.campusMeshes=new Map();this.truckMeshes=new Map();this.doors=[];this.bubbles=new Map();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#c3e8ef');this.world=new THREE.Group();this.showroom=new THREE.Group();this.scene.add(this.world,this.showroom);
    this.camera=new THREE.OrthographicCamera(-20,20,12,-12,.1,420);this.controls=new CameraController(canvas,this.camera,pad);
    this.performance=new PerformanceProfile();this.performance.setMode('auto');
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.performance.options.pixelRatio));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.98;const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(environment,.045);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.18;environment.dispose();pmrem.dispose();
    this.ambient=new THREE.HemisphereLight('#fffef0','#97b2bc',1.15);this.scene.add(this.ambient);this.sun=new THREE.DirectionalLight('#fff0d8',2.1);this.sun.position.set(-18,34,20);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(innerWidth<680?1024:2048,innerWidth<680?1024:2048);Object.assign(this.sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:.5,far:110});this.sun.shadow.normalBias=.04;this.sun.shadow.bias=-.0002;this.sun.shadow.radius=2;this.scene.add(this.sun,this.sun.target);
    this.buildTraffic();this.buildPedestrians();this.effects=new GameEffects(this.world);
    this.menuCar=makeCar('#53a9df');this.menuCar.userData.crack.visible=false;this.showroom.add(this.menuCar);this.menuStage=buildShowroom(this.showroom,this.menuCar);
    this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
  }
  removeStructure(group){if(!group)return;group.traverse(o=>{if(o.userData.ownedMaterial||o.userData.batched&&o.material?.map){o.material.map?.dispose();o.material.dispose();}if(o.isSprite||o.userData.sign){o.material.map?.dispose();o.material.dispose();o.geometry?.dispose();}else if(o.userData.batched||['ConeGeometry','IcosahedronGeometry'].includes(o.geometry?.type))o.geometry.dispose();});group.removeFromParent();}
  buildCity(state){
    if(this.city){this.city.traverse(o=>o.geometry?.dispose());this.city.removeFromParent();}
    const city=new THREE.Group();this.city=city;this.world.add(city);const l=shopLayout(state),roads=cityRoads(state),access=logisticsAccess(state),extent=cityExtent(state),m=state.garageLevel>=7?maxparLayout(state,roads.zs[1]):null;
    box(city,'#72b881',[extent,.22,extent],[0,-.21,-2]).castShadow=false;box(city,'#c9b698',[extent,1,extent],[0,-.83,-2]);
    for(const z of roads.zs){
      box(city,'#dce6df',[extent,.12,state.garageLevel>=6?12:9],[0,-.01,z]);box(city,'#455d6d',[extent,.1,state.garageLevel>=6?9:6.4],[0,.06,z]);for(let x=-extent/2+2;x<extent/2;x+=5)if(!roads.xs.some(v=>Math.abs(x-v)<5))box(city,'#f1efcf',[2.4,.015,.11],[x,.12,z]);
    }
    for(const x of roads.xs){
      const roadDepth=state.garageLevel>=16?extent/2+43:extent,roadCenter=state.garageLevel>=16?(43-extent/2)/2:0;box(city,'#dce6df',[state.garageLevel>=6?12:9,.12,roadDepth],[x,-.01,roadCenter]);box(city,'#455d6d',[state.garageLevel>=6?9:6.4,.1,roadDepth],[x,.07,roadCenter]);for(let z=-extent/2+2;z<(state.garageLevel>=16?43:extent/2);z+=5)if(!roads.zs.some(v=>Math.abs(z-v)<5))box(city,'#f1efcf',[.11,.015,2.4],[x,.13,z]);
      for(const z of roads.zs)for(let i=-2;i<=2;i++){box(city,'#faf7e8',[.4,.025,2],[x+i*.75,.145,z-4.2]);box(city,'#faf7e8',[2,.025,.4],[x+4.2,.145,z+i*.75]);}
    }
    const buildings=[[-8,23,5.1,4.5,'#f9dca0'],[7,23,5,3.5,'#b8dcd4'],[-36,-10,6,6.5,'#c4dba5'],[-36,25,6.5,8,'#eabf8f'],[36,23,7,9,'#a0cfe8'],[36,-8,6.5,6.5,'#e8b3a4'],[-36,-36,7,10,'#a1bddb'],[-10,-36,6.5,8,'#f0c478'],[8,-36,7,9,'#d8b3a2'],[37,-36,7,8,'#b0d3be'],[-47,24,4,3.2,'#f1d9ad'],[47,0,4.5,3.5,'#bedcc4'],[-46,-2,4,3,'#ebae7e']];
    if(state.garageLevel<2)buildings.push([-15,-5,4.1,3.2,'#f4d1a0'],[-15,-14,4.1,4.1,'#eeaf86']);
    if(state.garageLevel>=2)for(const x of [-50,50])for(const z of [-39,47])buildings.push([x,z,5.8,7,'#aad3d9']);
    if(state.garageLevel>=3)for(const x of [-65,-8,8,65])for(const z of [-52,54])buildings.push([x,z,6.3,8,'#e9c18f']);
    if(state.garageLevel>=6)for(let x=-extent/2+12;x<extent/2-10;x+=18)for(const z of [-extent/2+13,extent/2-13])buildings.push([x,z,8,10+(Math.abs(x)%7),'#a7cbdc']);
    if(state.garageLevel>=6)for(let x=-extent/2+18;x<extent/2-15;x+=36)for(let z=-extent/2+35;z<35;z+=36)buildings.push([x,z,6.4,4+Math.min(10,state.garageLevel*.6),['#bfd6b3','#dfc297','#a5cad6'][Math.abs(Math.floor(x/27)+Math.floor(z/27))%3]]);
    if(state.garageLevel>=4)for(let x=-58;x<l.plotRight+28;x+=15){buildings.push([x,26,5.8,Math.min(7,3+state.garageLevel*.32),['#a3cfd5','#e8c68f','#b4c4de'][Math.abs(Math.floor(x/15))%3]]);if(state.garageLevel>=9)buildings.push([x,l.plotBack-17,7.5,12+(state.garageLevel-9)*1.7,'#8fbdd2']);}
    const plotFront=driveway(state).front,occupied=(x,z,r=2)=>m&&x+r>m.plotLeft&&x-r<m.plotRight&&z+r>m.plotBack&&z-r<m.plotFront||state.garageLevel>=2&&Math.abs(x-access.entryX)<3.4+r&&z+r>access.road&&z-r<l.plotBack+2||(x+r>l.plotLeft&&x-r<l.plotRight&&z+r>l.plotBack&&z-r<plotFront)||(state.garageLevel>=15&&x>-84-r&&x<-46+r&&z>l.plotBack-5-r&&z<5+r)||(state.garageLevel>=16&&z>43-r)||(state.garageLevel>=15&&(Math.abs(z-32)<r+3||Math.abs(x+46)<r+3));
    const built=[];for(const args of buildings){const [x,z,w]=args;if(occupied(x,z,w/2+1)||[...roads.xs,...(state.garageLevel>=6?[-extent/2+25,extent/2-25]:[])].some(v=>Math.abs(x-v)<w/2+7)||roads.zs.some(v=>Math.abs(z-v)<w/2+5))continue;const height=state.garageLevel===1?Math.min(args[3],4.2):Math.min(22,args[3]*(.55+state.garageLevel*.07));this.house(city,args[0],args[1],args[2],height,args[4]);built.push(args);}addCityDetails(city,state,l,roads,extent,built);
    for(const [x,z] of [[-16,2],[-9,17],[15,20],[-30,-17],[-31,18],[30,18],[31,-17],[-46,-22],[44,-18],[-12,-30],[12,-30],[28,-4],[-30,-4]])if(!occupied(x,z,1.5)&&!onCityRoad(state,x,z,1.7))tree(city,x,z,1.1);
    if(state.garageLevel<2){box(city,'#dfd9c3',[5,.14,5],[-20,.03,1]);cylinder(city,'#edeee3',1,.24,[-20,.25,1],12);cylinder(city,'#81cdd9',.85,.1,[-20,.39,1],12);tree(city,-21.3,-.5,.8);}
    for(const x of [-16,16,-28,28])for(const z of [5,-19,33]){if(occupied(x,z,.4)||onCityRoad(state,x,z,.7))continue;cylinder(city,'#c7d6db',.065,3.8,[x,1.9,z],6);box(city,'#d7e2e2',[.65,.11,.28],[x+.2,3.83,z]);}
    const plotWidth=l.plotRight-l.plotLeft,depth=plotFront-l.plotBack;
    box(city,'#9caeb8',[plotWidth,.14,depth],[(l.plotLeft+l.plotRight)/2,.03,(l.plotBack+plotFront)/2]);
    box(city,'#e4e8de',[plotWidth,.1,1.2],[(l.plotLeft+l.plotRight)/2,.13,plotFront-.5]);
    if(state.garageLevel>=7){
      const left=l.officeLeft+1.2,right=(state.garageLevel>=14?l.factoryRight:state.garageLevel>=8?l.academyRight:l.officeRight)-1.2;
      const front=-61,back=l.plotBack+3,width=right-left,depth=front-back;
      if(depth>9){
        const x=(left+right)/2,z=(front+back)/2;box(city,'#90ba91',[width,.035,depth],[x,.17,z]);
        box(city,'#dfe3cb',[2.2,.04,depth],[x,.21,z]);box(city,'#dfe3cb',[width,.04,2.2],[x,.21,z]);
        if(width>30&&depth>24){
          cylinder(city,'#dce5d6',2.7,.13,[x+9,.27,z+6],16);cylinder(city,'#749dac',2.25,.2,[x+9,.43,z+6],16);cylinder(city,'#72cbda',2,.08,[x+9,.57,z+6],16);
          cylinder(city,'#d2e7df',.25,.55,[x+9,.86,z+6],8);
          const px=x-9,pz=z-7;box(city,'#e3dac2',[9,.06,6],[px,.23,pz]);
          for(const dx of [-3.9,3.9])for(const dz of [-2.4,2.4])box(city,'#637f8b',[.14,2.7,.14],[px+dx,1.62,pz+dz]);
          for(let dx=-4;dx<=4;dx+=.65)box(city,'#d3bd8d',[.23,.12,5.4],[px+dx,3,pz]);
          box(city,'#c5ae81',[4,.12,1.2],[px,1.11,pz]);for(const side of [-1,1])for(const dx of [-1.25,1.25])chair(city,px+dx,pz+side*1.15,side>0?Math.PI:0,'#547f92');
        }
        for(const px of [left+6,right-6])for(let pz=front-5;pz>back+3;pz-=12){
          box(city,'#e4dfc8',[8,.05,7],[px,.21,pz]);for(const dx of [-2.6,2.6]){tree(city,px+dx,pz+2,.8);box(city,'#52798b',[1.9,.1,.5],[px+dx,.74,pz-.8]);for(const side of [-.7,.7])box(city,'#627d86',[.07,.55,.35],[px+dx+side,.45,pz-.8]);}
          cylinder(city,'#d3bd92',.62,.12,[px,1.03,pz-.9],10);for(const side of [-1,1])chair(city,px+side*1.1,pz-.9,side>0?-Math.PI/2:Math.PI/2,'#477f94');
        }
        for(const pz of [front-2,back+2])for(const px of [left+1,right-1]){cylinder(city,'#72918c',.045,3.3,[px,1.86,pz],6);box(city,'#f4e9c5',[.42,.1,.3],[px,3.5,pz]);}
      }
    }
    for(const x of [l.plotLeft,l.plotRight]){box(city,'#f1d389',[.09,.025,depth-1],[x,.12,(l.plotBack+plotFront-1)/2]);}
    if(state.maxparLevel){const z=roads.zs[1],back=z+(state.garageLevel>=6?4.5:3.2),front=l.plotBack+2;box(city,'#9caeb8',[4,.055,front-back],[-12.5,.06,(back+front)/2]);}
    if(state.garageLevel>=2){
      // A short apron joins the public street to the existing company yard.
      const back=access.road+(state.garageLevel>=6?4.5:3.2),front=l.plotBack+2;
      box(city,'#9caeb8',[6.8,.055,front-back],[access.entryX,.06,(back+front)/2]);
      for(let z=l.clBack+1;z<-11;z+=1.5)box(city,'#e8d372',[.09,.025,.75],[-20.6,.12,z]);
    }
    // Visitor spaces stay beside the lounge; service bays keep their own entrance.
    const parkingZ=l.front+1.8;
    for(let i=0;i<(state.garageLevel===1?2:3);i++){
      const px=(state.garageLevel===1?[-10,-3.2]:[-17,-11,-3.2])[i];box(city,'#546a78',[2.5,.025,3.1],[px,.14,parkingZ]);
      for(const side of [-1,1])box(city,'#f5f1d8',[.045,.025,3.1],[px+side*1.25,.17,parkingZ]);
      box(city,'#c4d5d8',[1.8,.14,.18],[px,.23,parkingZ-1.35]);
    }
    if(state.garageLevel>=6){
      for(const x of [-extent/2+25,extent/2-25]){
        const d=state.garageLevel>=16?extent/2+43:extent,cz=state.garageLevel>=16?(43-extent/2)/2:0;box(city,'#dce6df',[12,.12,d],[x,-.01,cz]);box(city,'#455d6d',[9,.1,d],[x,.06,cz]);
        for(let z=-extent/2+5;z<(state.garageLevel>=16?40:extent/2);z+=8)box(city,'#f1efcf',[.1,.02,3],[x,.13,z]);
      }
    }
    if(state.garageLevel>=15){
      const c=cargoLayout(state);
      for(const channel of state.garageLevel>=16?['air','maritime']:['air'])for(const returning of [false,true]){
        const pts=freightRoute(state,channel,returning);
        for(let i=1;i<pts.length;i++){const [ax,az]=pts[i-1],[bx,bz]=pts[i],length=Math.hypot(bx-ax,bz-az);const road=box(city,'#687e87',[3.1,.04,length],[(ax+bx)/2,.14,(az+bz)/2]);road.rotation.y=Math.atan2(bx-ax,bz-az);}
      }
      for(const channel of ['air','maritime']){if(channel==='maritime'&&state.garageLevel<16)continue;const x=c.origin.x-(channel==='air'?4:0);box(city,'#39596b',[3.5,.035,8],[x,.19,c.origin.z]);for(const side of [-1,1])box(city,'#e8cc76',[.08,.04,8],[x+side*1.7,.22,c.origin.z]);}
    }
    batchStatic(city);
  }
  house(parent,x,z,width,height,color){
    const depth=width*.8;box(parent,'#d4d8ca',[width+1,.2,depth+1],[x,.08,z]);box(parent,color,[width,height,depth],[x,height/2+.15,z]);box(parent,'#faf2d8',[width+.25,.23,depth+.25],[x,height+.2,z]);
    if(height<5){const roof=new THREE.Mesh(new THREE.ConeGeometry(width*.82,1.2,4),material('#bc775d'));roof.rotation.y=Math.PI/4;roof.position.set(x,height+.75,z);roof.scale.z=.83;roof.castShadow=true;parent.add(roof);}else box(parent,'#b7c0bc',[width-.7,.08,depth-.7],[x,height+.34,z]);
    for(let row=.95;row<height-.25;row+=1.6)for(let column=-width/2+.85;column<width/2;column+=1.45){box(parent,'#f8f4e9',[.84,.93,.08],[x+column,row+.25,z+depth/2+.06]);box(parent,'#599bb1',[.69,.78,.09],[x+column,row+.25,z+depth/2+.11],true);}
    box(parent,'#b8895c',[.75,1.4,.08],[x,.88,z+depth/2+.12]);
    addHouseDetail(parent,x,z,width,height,depth,color);
  }
  wall(parent,x,z,w,d,height=1){box(parent,'#e8e0cb',[w,height,d],[x,.285+height/2,z]);box(parent,'#6fa5c7',[w+.02,.07,d+.02],[x,.285+height,z]);}
  doorway(parent,x,z,width,rotation=0,id='front'){
    const frame=new THREE.Group();frame.position.set(x,.285,z);frame.rotation.y=rotation;parent.add(frame);
    for(const sx of [-width/2,width/2])box(frame,'#1680c7',[.1,2.15,.16],[sx,1.075,0]);box(frame,'#1680c7',[width+.1,.12,.16],[0,2.15,0]);
    const panels=[];for(const direction of [-1,1]){const panel=new THREE.Group();panel.position.x=direction*width/4;frame.add(panel);box(panel,'#9fcedd',[width/2-.07,1.95,.055],[0,1.05,0],true);box(panel,'#edf6f9',[.035,.9,.06],[direction*width/4*-1+.08,1.05,.06]);panels.push(panel);}this.doors.push({id,x,z,width,panels,open:0});
  }
  buildGarage(state){
    this.workforceScene?.dispose();this.removeStructure(this.garage);const garage=new THREE.Group();this.garage=garage;this.world.add(garage);this.roof=new THREE.Group();garage.add(this.roof);
    const l=shopLayout(state),width=l.right-l.left,center=(l.left+l.right)/2,depth=l.front-l.back,mid=(l.front+l.back)/2;this.layout=l;this.maxparScene=new MaxparScene(garage,this.roof,state);this.frontPanes=[];this.productShelves={};this.readyPackages=[];this.warehouseBoxes=[];this.doors=[];this.displays=[];this.campusDecor=buildCampus(garage,this.roof,state,l,(...args)=>this.doorway(...args));this.fulfillment=buildFulfillment(garage,state,l);this.workforceScene=new WorkforceScene(garage,state,l);
    box(garage,'#f6f2e8',[width,.17,depth],[center,.2,mid]);
    for(let x=l.left+2;x<l.right;x+=2)box(garage,'#dce3e2',[.015,.007,depth-.4],[x,.29,mid]);for(let z=l.back+2;z<l.front;z+=2)box(garage,'#dce3e2',[width-.3,.007,.015],[center,.29,z]);
    this.wall(garage,l.left,mid,.22,depth);
    if(state.garageLevel<4)this.wall(garage,l.right,mid,.22,depth,.72);else{this.wall(garage,l.right,(l.back-4.85)/2,.22,-4.85-l.back,.72);this.wall(garage,l.right,(-1.95+l.front)/2,.22,l.front+1.95,.72);}
    this.wall(garage,-2.7,(-9.2+.55)/2,.2,9.75,1.15);if(l.front>3.15)this.wall(garage,-2.7,(3.15+l.front)/2,.2,l.front-3.15,1.15);
    this.wall(garage,-8.85,l.front,2.9,.2);this.wall(garage,-3.75,l.front,2.1,.2);this.doorway(garage,-6.1,l.front,2.6);this.doorway(garage,-2.7,1.85,2.6,Math.PI/2,'lounge');
    box(garage,'#dde8ed',[6.7,.025,6.5],[-6.5,.298,-1.1]);
    for(let i=0;i<state.bays;i++){const p=loungeSpot(i);chair(garage,p.x,p.z,p.facing,'#72afcc');}
    for(let i=0;i<activeStaff(state,'cashier');i++){
      const x=deskX(i);box(garage,'#ce9558',[1.6,.85,.65],[x,.71,-7.05]);box(garage,'#f9e2ab',[1.7,.13,.75],[x,1.19,-7.05]);box(garage,'#334e63',[.33,.22,.26],[x+.3,1.38,-7.05]);box(garage,'#63c4df',[.25,.19,.03],[x+.3,1.47,-6.9],true);
    }
    if(state.garageLevel<2)this.wall(garage,center,l.back,width,.24,2.8);
    else {this.wall(garage,(l.left+11.5)/2,l.back,11.5-l.left,.24,1);this.wall(garage,(14.7+l.right)/2,l.back,l.right-14.7,.24,1);this.doorway(garage,13.1,l.back,3.2,0,'cl');}
    box(garage,'#1578c7',[width,.52,.34],[center,3.33,-9.07]);const brand=shopSign('AUTOGLASS INC.',Math.min(7,width*.6));brand.position.set(center,3.33,-8.88);garage.add(brand);
    addBrandPanel(garage,2,l.left+1.6,3.34,-8.85);
    if(state.garageLevel>=3){const x=-14.6,z=l.front-.8;for(const sx of [-2.5,2.5])cylinder(garage,'#637d91',.12,5.3,[x+sx,2.65,z],8);roundedBox(garage,'#0c579c',[7.2,2.6,.18],[x,5.5,z]);addBrandPanel(garage,6.4,x,5.75,z+.12);const caption=shopSign('AUTOGLASS',4.6);caption.position.set(x,4.72,z+.15);garage.add(caption);}
    box(this.roof,'#2278bc',[width+.6,.25,depth+.4],[center,3.7,mid]);box(this.roof,'#3a94cf',[width+.6,.08,depth+.4],[center,3.86,mid]);
    for(let i=0;i<state.bays;i++){
      const x=bayX(i);box(garage,'#b5c4c7',[2.9,.025,5.4],[x,.3,-1.2]);for(const side of [-1.43,1.43])box(garage,'#f3cd65',[.055,.035,5.4],[x+side,.32,-1.2]);box(garage,'#f3cd65',[2.9,.035,.06],[x,.32,1.5]);
    }
    for(let i=0;i<state.bays;i++){
      const x=drawerX(i),seat=workerSeat(i);chair(garage,seat.x,seat.z,seat.facing,'#477ea9');roundedBox(garage,'#2379b5',[.58,.85,.65],[x,.71,drawerZ]);for(let d=0;d<3;d++)box(garage,'#92bad0',[.44,.04,.04],[x,.5+d*.22,drawerZ+.35]);
      if(state.tools){box(garage,'#3273a2',[.85,.55,.05],[x,1.68,drawerZ-.32]);for(let t=0;t<state.tools;t++)box(garage,'#e5bf55',[.045,.25,.05],[x-.3+t*.17,1.68,drawerZ-.28]);}
    }
    box(garage,'#6895a8',[.65,.16,1.65],[-.9,.43,-5.75]);
    for(let i=0;i<44;i++){const pane=box(garage,'#9fdae5',[.018,1.1,1.3],[-1.18+i*.014,1.03,-5.75],true);pane.rotation.z=-.12;this.frontPanes.push(pane);}
    cylinder(garage,'#ecb680',.26,.4,[-9.5,.49,-6.1],10);cylinder(garage,'#9bbd77',.33,.8,[-9.5,1.05,-6.1],6);
    if(state.stockRacks){for(let i=0;i<state.stockRacks;i++)box(garage,'#e5c166',[.07,1.35,.07],[-1.25+i*.15,1,-6.52]);}
    if(state.garageLevel>=2){
      for(const key of ['carMirror','motoMirror','parts']){const p=productPoint(key);roundedBox(garage,'#237cba',[1.45,.72,.65],[p.x,.66,p.z-1.1]);box(garage,'#cedee2',[1.52,.1,.7],[p.x,1.06,p.z-1.1]);this.productShelves[key]=[];
        for(let i=0;i<7;i++){const item=makeProduct(key,garage,.48);item.position.set(p.x-.5+(i%4)*.34,1.19+Math.floor(i/4)*.22,p.z-1.1);this.productShelves[key].push(item);}
      }
      roundedBox(garage,'#c38b57',[1.5,.8,.8],[packingBench.x,.7,packingBench.z]);box(garage,'#efdbc1',[1.6,.12,.9],[packingBench.x,1.16,packingBench.z]);cylinder(garage,'#f4d99b',.13,.1,[packingBench.x+.4,1.28,packingBench.z],12);
      roundedBox(garage,'#237cba',[1.4,.72,.5],[-6.9,.66,-5.8]);
      for(let i=0;i<4;i++){const parcel=roundedBox(garage,'#d6a569',[.4,.33,.35],[-7.4+(i%3)*.42,1.18+Math.floor(i/3)*.34,-5.8]);this.readyPackages.push(parcel);}
      for(let i=0;i<state.packingLevel;i++)box(garage,'#55b8ce',[.07,.24,.1],[packingBench.x-.5+i*.24,1.33,packingBench.z+.1]);
    }
    if(state.storeExpansion){roundedBox(garage,'#2386c4',[1.4,.75,.5],[l.right-1,.68,l.front-.5]);for(let i=0;i<state.storeExpansion;i++)box(garage,'#aad8e6',[.32,.21,.035],[l.right-1.45+i*.4,.74,l.front-.23],true);}
    if(state.garageLevel>=2)this.buildWarehouse(garage,state,l);
    if(state.garageLevel>=4)this.buildOffice(garage,state,l);
    if(state.garageLevel>=6)this.displays.push(...buildITDepartment(garage,this.roof,state,l));
    if(state.garageLevel>=4)this.displays.push(...buildBusinessDisplay(garage,state,l));
    addShopFinish(garage,state,l);this.upgradeDecor=buildUpgradeDecor(garage,state,l);this.advancedDecor=buildCargoTerminals(garage,state,l);
    this.batchGarage();
    this.roof.visible=this.inGame?this.roofVisible:true;
  }
  batchGarage(){
    const protectedNodes=new Set([this.roof,this.maxparScene?.dynamic,this.advancedDecor.dynamic,this.workforceScene.group,...this.frontPanes,...this.readyPackages,...Object.values(this.productShelves).flat(),...this.warehouseBoxes.flat(),...this.doors.flatMap(door=>door.panels),...this.displays,...this.campusDecor.machines.flatMap(machine=>[machine.glass,machine.cutter,machine.scanner,machine.heat]),...this.campusDecor.panes,...this.fulfillment.parcels.map(parcel=>parcel.mesh),...this.fulfillment.arms]);
    const structure=new THREE.Group();this.garage.add(structure);
    for(const child of [...this.garage.children]){
      if(child===structure)continue;let movable=true;
      child.traverse(node=>{if(protectedNodes.has(node)||node.userData.sign||node.isSprite||node.isInstancedMesh)movable=false;});
      if(movable)structure.add(child);
    }
    batchStatic(structure);batchStatic(this.roof);
  }
  buildWarehouse(garage,state,l){
    const width=l.right-l.left,center=(l.left+l.right)/2,depth=l.back-l.clBack,mid=(l.back+l.clBack)/2;
    box(garage,'#e8edeb',[width,.17,depth],[center,.2,mid]);this.wall(garage,center,l.clBack,width,.24,2.2);this.wall(garage,l.right,mid,.22,depth,.85);
    let wallStart=l.clBack;for(const d of [...docks(state)].reverse()){const low=d.z-1.55,high=d.z+1.55;if(low>wallStart)this.wall(garage,l.left,(wallStart+low)/2,.22,low-wallStart,1.2);this.doorway(garage,l.left,d.z,3.1,Math.PI/2,d.id);wallStart=high;
      box(garage,'#506b81',[3.1,.035,7.8],[d.x,.15,d.z]);for(const sx of [-1.55,1.55])box(garage,'#f5d778',[.06,.025,7.8],[d.x+sx,.18,d.z]);}
    if(wallStart<l.back)this.wall(garage,l.left,(wallStart+l.back)/2,.22,l.back-wallStart,1.2);
    box(garage,'#1578c7',[width,.4,.2],[center,2.65,l.clBack+.05]);
    box(this.roof,'#2377ad',[width+.6,.25,depth+.4],[center,3.7,mid]);
    for(let i=0;i<activeStaff(state,'logistics');i++){const p=collectorHome(state,i);chair(garage,p.x,p.z,p.facing,'#e4b266');}
    for(let i=0;i<Math.max(1,Math.ceil(activeStaff(state,'logistics')/2));i++){const p=scanStation(state,i*2),x=p.x+.5,z=p.z-1.45;box(garage,'#40617b',[2.4,.9,.8],[x,.73,z]);box(garage,'#bacbd3',[2.6,.12,.95],[x,1.23,z]);box(garage,'#184966',[.5,.33,.16],[x,1.44,z]);box(garage,'#69dce0',[.4,.22,.03],[x,1.46,z+.09]);}
    for(const [i,rack] of getAddresses(state).entries()){
      for(const x of [-1.5,1.5])for(const z of [-.5,.5])box(garage,'#206daa',[.1,2.5,.1],[rack.x+x,1.54,rack.z+z]);
      for(const y of [.55,1.25,1.95])box(garage,'#e9bd56',[3.15,.12,1.1],[rack.x,y,rack.z]);
      const parcels=[];
      for(let p=0;p<3;p++){const group=new THREE.Group();box(group,'#d7a05c',[2.1,.47,.78],[rack.x,.85+p*.7,rack.z]);box(group,'#f8e0af',[.15,.48,.79],[rack.x,.85+p*.7,rack.z]);garage.add(group);parcels.push(group);}this.warehouseBoxes[i]=parcels;
    }
    for(let z=l.clBack+1;z<-10;z+=1.3)box(garage,'#edc965',[.09,.023,.65],[15.1,.3,z]);
    if(l.right>23){const x=(18+l.right)/2;box(garage,'#63909f',[l.right-19,.12,1.3],[x,.65,-15]);for(let i=0;i<6;i++)cylinder(garage,'#adbec3',.09,l.right-19,[x,.76,-15.5+i*.2],8).rotation.z=Math.PI/2;}
  }
  buildOffice(garage,state,l){
    const center=(l.officeLeft+l.officeRight)/2,depth=l.officeFront-l.officeBack,mid=(l.officeFront+l.officeBack)/2;
    box(garage,'#e9dac2',[l.officeRight-l.officeLeft,.17,depth],[center,.2,mid]);box(garage,'#f3f0e7',[.9,.17,2.9],[(l.right+l.officeLeft)/2,.2,-3.4]);
    for(let x=l.officeLeft+.6;x<l.officeRight;x+=.7)box(garage,'#d5bea0',[.018,.008,depth-.3],[x,.29,mid]);
    this.wall(garage,l.officeRight,mid,.22,depth,.8);
    if(state.garageLevel<6)this.wall(garage,center,l.officeBack,l.officeRight-l.officeLeft,.22,2.4);else{const doorX=l.officeRight-2.8;this.wall(garage,(l.officeLeft+doorX-1.5)/2,l.officeBack,doorX-1.5-l.officeLeft,.22,1);this.wall(garage,(doorX+1.5+l.officeRight)/2,l.officeBack,l.officeRight-doorX-1.5,.22,1);this.doorway(garage,doorX,l.officeBack,3,0,'it');}
    this.wall(garage,(l.officeLeft+3.25+l.officeRight)/2,l.officeFront,l.officeRight-l.officeLeft-3.25,.22,.7);this.doorway(garage,l.officeLeft+1.6,l.officeFront,3.2,0,'dispatch');
    this.wall(garage,l.officeLeft,(l.officeBack-4.85)/2,.22,-4.85-l.officeBack,.8);this.wall(garage,l.officeLeft,(-1.95+l.officeFront)/2,.22,l.officeFront+1.95,.8);
    this.doorway(garage,l.officeLeft,-3.4,2.9,Math.PI/2,'office');
    box(garage,'#167abd',[l.officeRight-l.officeLeft,.42,.21],[center,2.7,l.officeBack+.04]);
    box(this.roof,'#2184c1',[l.officeRight-l.officeLeft+.4,.25,depth+.4],[center,3.7,mid]);
    for(let i=0;i<activeStaff(state,'salesWorker');i++){
      const p=officeDesk(state,i),desk=p.z-1.1;roundedBox(garage,'#f5f2e8',[2.4,.12,.8],[p.x,1.13,desk]);for(const x of [-1,1])box(garage,'#6d8c9c',[.07,.8,.65],[p.x+x,.69,desk]);
      chair(garage,p.x,p.z,p.facing,state.officeChairs?'#174a6d':'#778d9c');
      if(state.officeChairs){box(garage,'#174a6d',[.56,.8,.16],[p.x,.94,p.z+.42]);for(const side of [-1,1])box(garage,'#466d85',[.09,.12,.55],[p.x+side*.42,.98,p.z]);}
      box(garage,'#233d52',[.9,.58,.08],[p.x,1.52,desk-.13]);box(garage,'#8ccee8',[.79,.45,.023],[p.x,1.53,desk-.075],true);box(garage,'#325971',[.045,.18,.045],[p.x,1.22,desk-.13]);roundedBox(garage,'#b3c4cd',[.65,.035,.2],[p.x,1.215,desk+.23]);
      for(let row=0;row<3;row++)box(garage,'#e4f4f7',[.47-row*.08,.017,.015],[p.x-.1,1.63-row*.09,desk-.06]);
    }
    if(state.businessArea){
      roundedBox(garage,'#395e7a',[1.3,.14,2.4],[l.officeLeft+5.9,1.15,-11.1]);box(garage,'#91a8b6',[.14,.8,1.8],[l.officeLeft+5.9,.69,-11.1]);for(let i=0;i<2;i++){const p=meetingSeat(state,i);chair(garage,p.x,p.z,p.facing,'#537fa0');}
      box(garage,'#1e435f',[2.4,1.18,.06],[center,1.45,l.officeBack+.15]);box(garage,'#80c9de',[2.18,.94,.03],[center,1.46,l.officeBack+.19]);for(let i=0;i<state.businessArea;i++)box(garage,'#f7d681',[.3,.2+i*.15,.032],[center-.65+i*.55,1.24+i*.07,l.officeBack+.22]);
    }
    const count=Math.min(state.garageLevel>=10?5:state.garageLevel>=5?4:2,1+Math.floor(state.dispatchLevel/2));
    for(let i=0;i<count;i++){const p=dispatchBay(state,i);box(garage,'#758d9b',[3.2,.015,3.9],[p.x,.15,p.z]);for(const side of [-1.6,1.6])box(garage,'#f5d778',[.07,.02,3.9],[p.x+side,.17,p.z]);}
    for(const x of [l.officeLeft+1,l.officeRight-1]){cylinder(garage,'#e0ac76',.3,.4,[x,.49,l.officeBack+1],10);cylinder(garage,'#8bbf75',.44,1.05,[x,1.2,l.officeBack+1],7);}
    if(state.garageLevel<6){const garden=new THREE.Group();garage.add(garden);box(garden,'#8eb674',[l.officeRight-l.officeLeft-.8,.1,4],[(l.officeLeft+l.officeRight)/2,.16,-16]);for(const x of [l.officeLeft+2,l.officeRight-2])tree(garden,x,-16,.85);}
  }
  buildTraffic(){this.traffic=[];for(let i=0;i<8;i++){const mesh=makeCar(['#edb859','#74baca','#da8170','#e8efea','#97b475','#668dbb'][i%6]);mesh.userData.crack.visible=false;this.world.add(mesh);this.traffic.push(mesh);}}
  buildPedestrians(){this.pedestrians=[];for(let i=0;i<8;i++){const mesh=makePerson(['#ef9d64','#6c96c3','#85b386','#e1b75e'][i%4]);mesh.scale.setScalar(.88);this.world.add(mesh);this.pedestrians.push(mesh);}}
  setMode(inGame,state={bays:1,garageLevel:1}){
    this.inGame=inGame;this.controls.setEnabled(inGame);this.world.visible=inGame;this.showroom.visible=!inGame;this.sun.visible=inGame;this.scene.environmentIntensity=inGame?.22:.64;this.scene.background.set(inGame?'#c3e8ef':'#0c3779');this.roofVisible=false;if(this.roof)this.roof.visible=!inGame;this.controls.center(state);
    if(!inGame){this.controls.target.set(1.2,0,0);this.controls.height=this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight)<.85?19:14.4;this.controls.resize();}
  }
  setGrowth(state){
    const signature=[state.garageLevel,state.bays,state.workers,state.logisticsWorkers,state.cashiers,state.storeExpansion,state.warehouseExpansion,state.stockRacks,state.tools,state.officeChairs,state.officeComputers,state.businessArea,state.packingLevel,state.productRange,state.dispatchLevel,state.productivity,state.itWorkers,state.itComputers,state.servers,state.ecommerce,state.branches,state.fleetContracts,state.distribution,state.insurance,state.marketplace,state.automation,state.international,state.manufacturing,state.holding,state.trainingLevel,state.curriculum,state.productionLines,state.qualityControl,state.wmsLevel,state.salesWorkers,state.factoryWorkers,state.clRobots,state.cybersecurity,state.dataAnalytics,state.cloudPlatform,state.networkHub,state.airCargo,state.seaCargo,state.globalTrade,state.maxparLevel,state.maxparWorkers,state.maxparTools,state.maxparSpeed,state.maxparComfort,state.maxparContracts,state.maxparCollectors,state.maxparWarehouse].join(':');
    if(signature!==this.signature){const footprint=[state.garageLevel,state.bays,state.storeExpansion,state.warehouseExpansion,state.workers,state.cashiers,state.logisticsWorkers,state.salesWorkers,state.itWorkers,state.factoryWorkers,state.officeComputers,state.itComputers,state.productionLines,state.maxparLevel,state.maxparWarehouse].join(':'),stageChanged=this.footprint!==footprint;this.footprint=footprint;this.signature=signature;this.stage=state.garageLevel;if(stageChanged)this.buildCity(state);this.buildGarage(state);if(this.inGame&&stageChanged)this.controls.center(state);const l=this.layout,span=Math.max(state.garageLevel>=16?170:state.garageLevel>=15?145:42,(l.plotRight-l.plotLeft)*.7,Math.abs(l.plotBack)*.75),cx=(l.plotLeft+l.plotRight)/2,cz=(l.plotBack+l.front)/2;this.sun.position.set(cx-24,52,cz+25);this.sun.target.position.set(cx,0,cz);if(!this.sun.target.parent)this.scene.add(this.sun.target);Object.assign(this.sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span,far:180});this.sun.shadow.camera.updateProjectionMatrix();}
    for(let i=0;i<this.frontPanes.length;i++)this.frontPanes[i].visible=i<state.frontStock;
    for(const key of Object.keys(this.productShelves))for(let i=0;i<this.productShelves[key].length;i++)this.productShelves[key][i].visible=i*4<(state.productStocks[key]||0);
    for(let i=0;i<this.readyPackages.length;i++)this.readyPackages[i].visible=i<state.orders.filter(o=>o.phase==='counterReady').length;
    for(let i=0;i<this.warehouseBoxes.length;i++){const amounts=productKeys.map(key=>({key,n:key==='glass'?state.warehouseStocks[i]:state.warehouseProducts[key][i]})),total=amounts.reduce((n,p)=>n+p.n,0);for(let p=0;p<3;p++){const mesh=this.warehouseBoxes[i][p];mesh.visible=p*4<total;const key=amounts.sort((a,b)=>b.n-a.n)[0].key;mesh.children[0].material=material(PRODUCTS[key].color);}}
  }
  setShadows(enabled){this.requestedShadows=enabled;this.applyPerformance();}
  setPerformance(mode){this.performance.setMode(mode);this.applyPerformance();}
  applyPerformance(){
    const options=this.performance.options,pixelRatio=Math.min(devicePixelRatio,options.pixelRatio),enabled=this.requestedShadows!==false&&options.shadows;
    if(this.renderer.getPixelRatio()!==pixelRatio){this.renderer.setPixelRatio(pixelRatio);this.resize();}
    if(this.sun.shadow.mapSize.x!==options.shadowSize){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(options.shadowSize,options.shadowSize);}
    if(this.renderer.shadowMap.enabled!==enabled){this.renderer.shadowMap.enabled=enabled;this.scene.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(material=>material.needsUpdate=true);}});}
    this.effects?.setQuality(options.effects);
  }
  toggleRoof(){this.roofVisible=!this.roofVisible;this.roof.visible=this.roofVisible;return this.roofVisible;}
  resize(){const {width,height}=this.canvas.parentElement.getBoundingClientRect();this.renderer.setSize(width,height,false);this.controls.resize();}
  updateCar(mesh,car,dt){
    const lift=car.bay===undefined?0:THREE.MathUtils.clamp((3.2-car.z)/1.4,0,1)*.175;mesh.position.set(car.x,.08+lift,car.z);
    const turn=Math.atan2(Math.sin(car.facing-mesh.rotation.y),Math.cos(car.facing-mesh.rotation.y));mesh.rotation.y+=turn*Math.min(1,dt*7);mesh.userData.roll+=car.speed*dt/.3*(car.reversing?-1:1);
    for(const wheel of mesh.userData.wheels){wheel.rotation.x=mesh.userData.roll;wheel.rotation.y=wheel.userData.front?Math.max(-.28,Math.min(.28,turn)):0;}
    mesh.userData.crack.visible=car.glass<.9;mesh.userData.windshield.material.color.set(car.glass>.5?'#a7e4ee':'#6fa5b7');
    if(mesh.userData.hood)mesh.userData.hood.rotation.x=THREE.MathUtils.damp(mesh.userData.hood.rotation.x,['parts','lights','sensors'].includes(car.product)&&(car.broken||car.phase==='working')?-.65:0,5,dt);
    for(const mirror of mesh.userData.mirrors||[]){mirror.visible=!['carMirror','motoMirror'].includes(car.product)||car.progress>.65||car.delivery;mirror.scale.setScalar(car.phase==='working'&&['carMirror','motoMirror'].includes(car.product)?Math.max(.1,car.progress||0):1);}
    if(mesh.userData.rider){mesh.userData.rider.visible=!car.driver?.visible;animatePerson(mesh.userData.rider,{x:0,z:-.12,facing:0,walk:0,moving:false,seated:true,phase:'riding'},this.time,.52);}
    if(mesh.userData.deliveryParcel)mesh.userData.deliveryParcel.visible=car.delivery&&['loading','boarding','reversing','leaving'].includes(car.phase);
    if(mesh.userData.serviceBar){const bar=mesh.userData.serviceBar;bar.visible=car.phase==='working'&&!car.pickup;bar.quaternion.copy(mesh.quaternion).invert().multiply(this.camera.quaternion);bar.userData.fill.scale.x=Math.max(.01,car.progress||0);bar.userData.fill.position.x=-(1-(car.progress||0))*.64;}
  }
  updatePeople(map,actors,factory,time){
    for(const actor of actors){if(!map.has(actor.id)){const mesh=factory(actor);this.world.add(mesh);map.set(actor.id,mesh);}const mesh=map.get(actor.id);mesh.visible=!actor.offDuty;if(mesh.visible)animatePerson(mesh,actor,time,this.personHeight(actor));}
    for(const [id,mesh] of map)if(!actors.some(a=>a.id===id)){mesh.removeFromParent();map.delete(id);}
  }
  update(dt,simulation,active){
    this.time+=dt;this.controls.update(dt);
    if(!this.inGame){this.menuCar.rotation.y=-.45+Math.sin(this.time*.11)*.42;this.menuCar.position.y=.26+Math.sin(this.time*.65)*.018;this.renderer.render(this.scene,this.camera);return;}
    this.sun.target.position.set(this.controls.target.x,0,this.controls.target.z);this.sun.position.set(this.controls.target.x-18,34,this.controls.target.z+20);const shadowSpan=Math.max(24,Math.min(180,this.controls.height*.75));if(Math.abs(this.sun.shadow.camera.right-shadowSpan)>1){Object.assign(this.sun.shadow.camera,{left:-shadowSpan,right:shadowSpan,top:shadowSpan,bottom:-shadowSpan});this.sun.shadow.camera.updateProjectionMatrix();}
    this.workforceScene?.update(simulation.time,simulation.staff);this.maxparScene?.update(simulation.maxpar,simulation.time);this.maxparPeople??=new Map();this.updatePeople(this.maxparPeople,simulation.maxpar.people().filter(a=>!a.id.startsWith('maxpar-client')),a=>makePerson(a.id.startsWith('maxpar-tech')?'#27a397':'#407973',true,a.id.startsWith('maxpar-tech'),true),simulation.time);this.ambient.intensity=.16+simulation.clock.light*.99;this.ambient.color.set(simulation.clock.light<.35?'#7296d4':'#fffef0');this.ambient.groundColor.set(simulation.clock.light<.35?'#253e62':'#97b2bc');updateAdvancedDecor(this.advancedDecor,this.upgradeDecor,simulation,simulation.time);
    while(this.traffic.length<simulation.city.cars.length){const mesh=makeCar(['#edb859','#74baca','#da8170','#e8efea'][this.traffic.length%4]);mesh.userData.crack.visible=false;this.world.add(mesh);this.traffic.push(mesh);}
    while(this.pedestrians.length<simulation.city.pedestrians.length){const mesh=makePerson(['#6c96c3','#85b386','#e1b75e'][this.pedestrians.length%3]);mesh.scale.setScalar(.88);this.world.add(mesh);this.pedestrians.push(mesh);}
    this.traffic.forEach((mesh,i)=>{mesh.visible=!!simulation.city.cars[i];if(mesh.visible)this.updateCar(mesh,simulation.city.cars[i],active?dt:0);});this.pedestrians.forEach((mesh,i)=>{mesh.visible=!!simulation.city.pedestrians[i];if(mesh.visible)animatePerson(mesh,simulation.city.pedestrians[i],simulation.time,.006);});
    const vehicles=[...simulation.cars,...simulation.orders.couriers,...simulation.maxpar.cars];
    for(const car of vehicles){
      if(!this.carMeshes.has(car.id)){const mesh=car.vehicleType==='moto'?makeMotorcycle(car.color):makeCar(car.color),driver=makePerson(car.delivery?'#df9e45':String(car.id).startsWith('maxpar-')?'#7fa79e':['#da8a5b','#80aa93','#9b86b3'][car.id%3]);if(car.delivery)mesh.userData.deliveryParcel=roundedBox(mesh,'#d6a569',[.65,.4,.6],[0,car.vehicleType==='moto'?1.3:1.35,-.65]);else{const bar=new THREE.Group();bar.position.y=2;const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(1.38,.12),new THREE.MeshBasicMaterial({color:'#f4faff'})),fill=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.065),new THREE.MeshBasicMaterial({color:'#41b78b'}));fill.position.z=.01;bar.add(backdrop,fill);bar.userData.fill=fill;mesh.add(bar);mesh.userData.serviceBar=bar;}this.world.add(mesh,driver);this.carMeshes.set(car.id,mesh);this.driverMeshes.set(car.id,driver);}
      this.updateCar(this.carMeshes.get(car.id),car,active?dt:0);if(car.job?.kind==='paint'){const painted=this.carMeshes.get(car.id);if(!painted.userData.paintMaterials){painted.userData.paintMaterials=[];painted.traverse(o=>{if(o.isMesh&&o.material?.color?.getHexString()===new THREE.Color(car.color).getHexString()){o.material=o.material.clone();painted.userData.paintMaterials.push(o.material);}});}for(const mat of painted.userData.paintMaterials)mat.color.lerpColors(new THREE.Color(car.color),new THREE.Color(car.paintColor),car.progress||0);}const driver=this.driverMeshes.get(car.id);driver.visible=car.driver.visible;animatePerson(driver,car.driver,simulation.time,this.personHeight(car.driver));
    }
    for(const [id,mesh] of this.carMeshes)if(!vehicles.some(c=>c.id===id)){mesh.userData.serviceBar?.children.forEach(o=>{o.geometry.dispose();o.material.dispose();});mesh.userData.paintMaterials?.forEach(m=>m.dispose());mesh.userData.windshield.material.dispose?.();mesh.userData.crack.geometry?.dispose();mesh.userData.crack.material?.dispose();mesh.removeFromParent();this.driverMeshes.get(id).removeFromParent();this.carMeshes.delete(id);this.driverMeshes.delete(id);}
    this.updatePeople(this.workerMeshes,simulation.workers,()=>makePerson('#2485ce',true,true),simulation.time);
    this.updatePeople(this.cashierMeshes,simulation.cashiers,()=>makePerson('#1979c8',true),simulation.time);
    // CL staff share the workforce instance pools instead of allocating a full mesh hierarchy per person.
    this.updatePeople(this.receiverMeshes,[],()=>makePerson('#e59a37',false,false,true),simulation.time);
    this.updatePeople(this.officeMeshes,simulation.office.people(),a=>makePerson(a.id==='business-guest'?'#b59568':'#2e577b'),simulation.time);
    this.updatePeople(this.itMeshes,simulation.it.workers,()=>makePerson('#605bba'),simulation.time);
    this.updatePeople(this.campusMeshes,simulation.campus.people().filter(a=>simulation.clock.day||a.commuting||a.id.startsWith('factory')),a=>makePerson(a.id.startsWith('factory')?'#e7a44a':a.id==='teacher'?'#247f79':'#74b8aa',a.id.startsWith('factory')),simulation.time);
    for(const parcel of this.fulfillment?.parcels||[]){parcel.mesh.visible=simulation.orders.active.length>0;parcel.mesh.position.x=parcel.start+(simulation.time*.8+parcel.index*2)%(parcel.end-parcel.start);}for(const [i,arm] of (this.fulfillment?.arms||[]).entries())arm.rotation.y=Math.sin(simulation.time*.7+i)*.55;
    for(const machine of this.campusDecor?.machines||[]){const operator=simulation.campus.operators[machine.index];if(operator){machine.glass.position.z=THREE.MathUtils.damp(machine.glass.position.z,-28.2+(operator.progress||0)*8.8,2,active?dt:0);const working=simulation.clock.day&&!operator.offDuty&&!operator.commuting;machine.glass.material.color.set(working&&operator.phase==='tempering'?'#ffa773':'#98e6e5');machine.cutter.position.x=machine.x+(working&&operator.phase==='cutting'?Math.sin(simulation.time*4)*.48:0);machine.scanner.visible=working&&operator.phase==='quality';machine.scanner.position.z=-20.5+Math.sin(simulation.time*5)*.42;machine.heat.material.emissive.set(working&&operator.phase==='tempering'?'#e96519':'#000000');machine.heat.material.emissiveIntensity=.35+.15*Math.sin(simulation.time*4);}}
    (this.campusDecor?.panes||[]).forEach((pane,i)=>pane.visible=i*4<simulation.economy.state.factoryStock);
    for(const display of this.displays||[])if(display.material?.emissive)display.material.emissiveIntensity=.15+.1*Math.sin(this.time*(display.userData.type==='server'?4:1.7));
    for(const door of this.doors){const near=simulation.people().some(a=>Math.hypot(a.x-door.x,a.z-door.z)<3)||simulation.navigation.doors.get(door.id)?.owner;door.open=THREE.MathUtils.damp(door.open,near?1:0,7,dt);door.panels[0].position.x=-door.width/4-door.open*door.width/2;door.panels[1].position.x=door.width/4+door.open*door.width/2;}
    this.updateTruck(simulation,active?dt:0);this.updateBubbles(simulation);this.menuCar.rotation.y=-.45+Math.sin(this.time*.11)*.42;this.menuCar.position.y=.26+Math.sin(this.time*.65)*.018;this.effects.update(active?dt:0,simulation,this.scene,this.sun,this.inGame,this.controls.target);this.renderer.render(this.scene,this.camera);
  }
  updateTruck(simulation,dt){
    for(const truck of [...simulation.logistics.trucks,...simulation.advanced.trucks,...(simulation.maxpar.supply.truck?[simulation.maxpar.supply.truck]:[])]){
    if(!this.truckMeshes.has(truck.id)){const mesh=makeTruck();addBrandPanel(mesh,2.6,1.11,1.55,-1,Math.PI/2);this.world.add(mesh);this.truckMeshes.set(truck.id,mesh);}const mesh=this.truckMeshes.get(truck.id);mesh.position.set(truck.x,.04,truck.z);
    const turn=Math.atan2(Math.sin(truck.facing-mesh.rotation.y),Math.cos(truck.facing-mesh.rotation.y));mesh.rotation.y+=turn*Math.min(1,dt*7);mesh.userData.roll+=truck.speed*dt/.4*(truck.reversing?-1:1);for(const w of mesh.userData.wheels)w.rotation.x=mesh.userData.roll;
    const open=truck.phase==='unloading'||truck.phase==='companyLoading';mesh.userData.side.rotation.z=THREE.MathUtils.lerp(mesh.userData.side.rotation.z,open?1.55:0,Math.min(1,dt*3));
    const pending=simulation.logistics.workers.filter(w=>w.truckId===truck.id&&['toTruck','collecting'].includes(w.phase)).length;for(let i=0;i<8;i++)mesh.userData.cargo[i].visible=i<truck.remaining+pending;
    }for(const [id,mesh] of this.truckMeshes)if(![...simulation.logistics.trucks,...simulation.advanced.trucks,...(simulation.maxpar.supply.truck?[simulation.maxpar.supply.truck]:[])].some(t=>t.id===id)){this.removeStructure(mesh);this.truckMeshes.delete(id);}
  }
  personHeight(actor){if(String(actor.id).startsWith('maxpar-'))return .235;const l=this.layout;if(l?.stage>=8&&actor.x>l.academyLeft&&actor.x<l.factoryRight&&actor.z<1.6&&actor.z>(l.stage>=14?-36.1:-13.5))return .235;if(l?.stage>=4&&actor.x>l.officeLeft&&actor.x<l.officeRight&&actor.z>(l.stage>=6?l.itBack:l.officeBack)&&actor.z<l.officeFront)return .235;if(l&&actor.x>l.left&&actor.x<l.right&&actor.z<l.front&&actor.z>(l.stage>=2?l.clBack:l.back))return .235;return .05;}
  updateBubbles(simulation){
    const alive=new Set(),bubble=(key,text)=>{alive.add(key);if(!this.bubbles.has(key)){const sprite=emojiBubble(text);this.world.add(sprite);this.bubbles.set(key,sprite);}return this.bubbles.get(key);};
    for(const car of simulation.cars)if(car.driver.visible&&car.driver.angry){const sprite=bubble(`angry-${car.id}`,'😠');sprite.position.set(car.driver.x,2.25,car.driver.z);}
    for(const worker of simulation.logistics.workers)if(worker.scanning){const sprite=bubble(`scan-${worker.id}`,'📦 ✓');sprite.position.set(worker.x,2.3,worker.z);}
    for(const worker of simulation.office.people())if(worker.phase==='calling'){const sprite=bubble('phone-'+worker.id,'☎');sprite.position.set(worker.x,2.35,worker.z);}
    for(const car of simulation.cars)if(car.driver.visible&&car.phase==='waiting'){const sprite=bubble('product-'+car.id,car.pickup?'📦':car.product==='glass'?'🪟':car.product==='motoMirror'?'🏍️':car.product==='parts'?'⚙️':'🪞');sprite.position.set(car.x,2.55,car.z);}
    for(const event of simulation.events){const sprite=bubble(event.id,event.kind==='graduation'?'🎓 ✓':event.kind==='production'?'🪟 ✓':event.kind==='online'?'🌐 📦':event.kind==='deploy'?'💻 ✓':event.kind==='order'?'☎ 📦':event.kind==='contract'?'🤝 ✅':event.kind==='delivery'?'📦 ✅':'💳 ✅'),age=simulation.time-event.time;sprite.position.set(event.x,2.1+age*.4,event.z);sprite.material.opacity=Math.min(1,(1.8-age)*3);}
    for(const [key,sprite] of this.bubbles)if(!alive.has(key)){sprite.removeFromParent();sprite.material.map.dispose();sprite.material.dispose();this.bubbles.delete(key);}
  }
  dispose(){this.workforceScene?.dispose();this.observer.disconnect();this.controls.dispose();const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});this.environment.dispose();this.renderer.dispose();}
}
