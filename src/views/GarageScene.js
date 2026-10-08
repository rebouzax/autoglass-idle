import * as THREE from 'three';
import {CameraController} from '../services/CameraController.js';
import {bayX,workerSeat,drawerX,loungeSpot,deskX,addresses,shopLayout} from '../models/ShopLayout.js';
import {box,cylinder,material,tree,label,shopSign,makeCar,makePerson,animatePerson,batchStatic,emojiBubble,chair,makeTruck} from './LowPolyAssets.js';

export class GarageScene {
  constructor(canvas,pad){
    this.canvas=canvas;this.time=0;this.carMeshes=new Map();this.workerMeshes=new Map();this.driverMeshes=new Map();this.cashierMeshes=new Map();this.receiverMeshes=new Map();this.bubbles=new Map();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#b8e3f3');this.world=new THREE.Group();this.showroom=new THREE.Group();this.scene.add(this.world,this.showroom);
    this.camera=new THREE.OrthographicCamera(-20,20,12,-12,.1,230);this.controls=new CameraController(canvas,this.camera,pad);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
    this.scene.add(new THREE.HemisphereLight('#fffef0','#97b2bc',2));this.sun=new THREE.DirectionalLight('#fff0d8',3);this.sun.position.set(-18,34,20);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:.5,far:110});this.sun.shadow.normalBias=.05;this.sun.shadow.bias=-.0002;this.scene.add(this.sun);
    this.buildTraffic();this.buildPedestrians();
    this.menuCar=makeCar('#4aa4f1');this.menuCar.position.set(4,.015,-1);this.menuCar.scale.setScalar(1.7);this.menuCar.userData.crack.visible=false;this.showroom.add(this.menuCar);
    box(this.showroom,'#0865bb',[80,.1,80],[0,-.235,0]).castShadow=false;cylinder(this.showroom,'#1a7aca',3.5,.25,[4,-.06,-1],64);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.28,.025,8,80),material('#8ed6ff'));ring.rotation.x=Math.PI/2;ring.position.set(4,.075,-1);this.showroom.add(ring);
    this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
  }
  removeStructure(group){if(!group)return;group.traverse(o=>{if(o.isSprite||o.userData.sign){o.material.map?.dispose();o.material.dispose();o.geometry?.dispose();}else if(o.geometry?.type==='ConeGeometry')o.geometry.dispose();});group.removeFromParent();}
  buildCity(state){
    if(this.city){this.city.traverse(o=>o.geometry?.dispose());this.city.removeFromParent();}
    const city=new THREE.Group();this.city=city;this.world.add(city);const l=shopLayout(state),extent=state.garageLevel===3?156:state.garageLevel===2?132:116;
    box(city,'#68ba52',[extent,.22,extent],[0,-.21,-2]).castShadow=false;box(city,'#c2b598',[extent,1,extent],[0,-.83,-2]);
    for(const z of [10,-24,38]){
      box(city,'#e5e9df',[extent,.12,9],[0,-.01,z]);box(city,'#576c7c',[extent,.1,6.4],[0,.06,z]);for(let x=-extent/2+2;x<extent/2;x+=5)box(city,'#f5efce',[2.4,.015,.11],[x,.12,z]);
    }
    for(const x of [-22,22]){
      box(city,'#e5e9df',[9,.12,extent],[x,-.01,0]);box(city,'#576c7c',[6.4,.1,extent],[x,.07,0]);for(let z=-extent/2+2;z<extent/2;z+=5)box(city,'#f5efce',[.11,.015,2.4],[x,.13,z]);
      for(const z of [10,-24,38])for(let i=-2;i<=2;i++){box(city,'#faf7e8',[.4,.025,2],[x+i*.75,.145,z-4.2]);box(city,'#faf7e8',[2,.025,.4],[x+4.2,.145,z+i*.75]);}
    }
    const buildings=[[-8,23,5.1,4.5,'#f9dca0'],[7,23,5,3.5,'#b8dcd4'],[-36,-10,6,6.5,'#c4dba5'],[-36,25,6.5,8,'#eabf8f'],[36,23,7,9,'#a0cfe8'],[36,-8,6.5,6.5,'#e8b3a4'],[-36,-36,7,10,'#a1bddb'],[-10,-36,6.5,8,'#f0c478'],[8,-36,7,9,'#d8b3a2'],[37,-36,7,8,'#b0d3be'],[-47,24,4,3.2,'#f1d9ad'],[47,0,4.5,3.5,'#bedcc4'],[-46,-2,4,3,'#ebae7e']];
    if(state.garageLevel<3)buildings.push([-15,-5,4.1,3.2,'#f4d1a0'],[-15,-14,4.1,4.1,'#eeaf86']);
    if(state.garageLevel>=2)for(const x of [-50,50])for(const z of [-39,47])buildings.push([x,z,5.8,7,'#aad3d9']);
    if(state.garageLevel===3)for(const x of [-65,-8,8,65])for(const z of [-52,54])buildings.push([x,z,6.3,8,'#e9c18f']);
    for(const args of buildings)this.house(city,...args);
    for(const [x,z] of [[-16,2],[-9,17],[15,20],[-30,-17],[-31,18],[30,18],[31,-17],[-46,-22],[44,-18],[-12,-30],[12,-30],[28,-4],[-30,-4]])tree(city,x,z,1.1);
    if(state.garageLevel<3){box(city,'#dfd9c3',[7,.14,7],[8,.03,-15]);cylinder(city,'#edeee3',1.2,.24,[8,.25,-15],12);cylinder(city,'#81cdd9',1,.1,[8,.39,-15],12);tree(city,13,-17,1);}
    for(const x of [-16,16,-28,28])for(const z of [5,-19,33]){cylinder(city,'#c7d6db',.065,3.8,[x,1.9,z],6);box(city,'#d7e2e2',[.65,.11,.28],[x+.2,3.83,z]);}
    const plotWidth=l.plotRight-l.plotLeft,depth=6.6-l.plotBack;
    box(city,'#9daeb2',[plotWidth,.14,depth],[(l.plotLeft+l.plotRight)/2,.03,(l.plotBack+6.6)/2]);
    box(city,'#d0cfc1',[plotWidth,.1,1.2],[(l.plotLeft+l.plotRight)/2,.13,6.1]);
    for(const x of [l.plotLeft,l.plotRight]){box(city,'#f1d389',[.09,.025,depth-1],[x,.12,(l.plotBack+5.6)/2]);}
    if(state.garageLevel===3){for(let z=-19;z<-11;z+=1.5)box(city,'#e8d372',[.09,.025,.75],[-16.8,.12,z]);tree(city,17.5,-19,1);}
    batchStatic(city);
  }
  house(parent,x,z,width,height,color){
    const depth=width*.8;box(parent,'#d4d8ca',[width+1,.2,depth+1],[x,.08,z]);box(parent,color,[width,height,depth],[x,height/2+.15,z]);box(parent,'#faf2d8',[width+.25,.23,depth+.25],[x,height+.2,z]);
    if(height<5){const roof=new THREE.Mesh(new THREE.ConeGeometry(width*.82,1.2,4),material('#bc775d'));roof.rotation.y=Math.PI/4;roof.position.set(x,height+.75,z);roof.scale.z=.83;roof.castShadow=true;parent.add(roof);}else box(parent,'#b7c0bc',[width-.7,.08,depth-.7],[x,height+.34,z]);
    for(let row=.95;row<height-.25;row+=1.6)for(let column=-width/2+.85;column<width/2;column+=1.45){box(parent,'#f8f4e9',[.84,.93,.08],[x+column,row+.25,z+depth/2+.06]);box(parent,'#599bb1',[.69,.78,.09],[x+column,row+.25,z+depth/2+.11],true);}
    box(parent,'#b8895c',[.75,1.4,.08],[x,.88,z+depth/2+.12]);
  }
  wall(parent,x,z,w,d,height=1){box(parent,'#e8e0cb',[w,height,d],[x,.285+height/2,z]);box(parent,'#6fa5c7',[w+.02,.07,d+.02],[x,.285+height,z]);}
  doorway(parent,x,z,width,rotation=0){
    const frame=new THREE.Group();frame.position.set(x,.285,z);frame.rotation.y=rotation;parent.add(frame);
    for(const sx of [-width/2,width/2])box(frame,'#1680c7',[.1,2.15,.16],[sx,1.075,0]);box(frame,'#1680c7',[width+.1,.12,.16],[0,2.15,0]);
    const door=new THREE.Group();door.position.x=-width/2+.04;door.rotation.y=-1.45;frame.add(door);box(door,'#a2d4e0',[width-.13,1.95,.055],[(width-.13)/2,1.05,0],true);box(door,'#ecf7f4',[.06,.12,.055],[width-.27,1.05,.06]);
  }
  buildGarage(state){
    this.removeStructure(this.garage);const garage=new THREE.Group();this.garage=garage;this.world.add(garage);this.roof=new THREE.Group();garage.add(this.roof);
    const l=shopLayout(state),width=l.right-l.left,center=(l.left+l.right)/2;this.layout=l;this.frontPanes=[];this.warehouseBoxes=[];
    box(garage,'#f6f2e8',[width,.17,12.4],[center,.2,-3]);
    this.wall(garage,l.left,-3,.22,12.4);this.wall(garage,l.right,-3,.22,12.4,.72);
    this.wall(garage,-2.7,-4.1,.2,10.2,1.15);this.wall(garage,-2.7,3.04,.2,.3,1.15);
    this.wall(garage,-8.85,3.2,2.9,.2);this.wall(garage,-3.75,3.2,2.1,.2);this.doorway(garage,-6.1,3.2,2.6);this.doorway(garage,-2.7,1.95,1.75,Math.PI/2);
    const loungeLabel=label('ESPERA','#3f7c9a',2);loungeLabel.position.set(-6.7,1.35,-.8);garage.add(loungeLabel);
    box(garage,'#dce8e7',[6.5,.025,6.5],[-6.5,.298,-1.1]);
    for(let i=0;i<state.bays;i++){const p=loungeSpot(i);chair(garage,p.x,p.z,p.facing,'#72afcc');}
    for(let i=0;i<state.cashiers;i++){
      const x=deskX(i);box(garage,'#ce9558',[1.6,.85,.65],[x,.71,-7.05]);box(garage,'#f9e2ab',[1.7,.13,.75],[x,1.19,-7.05]);box(garage,'#334e63',[.33,.22,.26],[x+.3,1.38,-7.05]);box(garage,'#63c4df',[.25,.19,.03],[x+.3,1.47,-6.9],true);
    }
    if(state.garageLevel<3)this.wall(garage,center,l.back,width,.24,2.8);
    else {this.wall(garage,(l.left+11.7)/2,l.back,11.7-l.left,.24,1);this.wall(garage,(14.5+l.right)/2,l.back,l.right-14.5,.24,1);this.doorway(garage,13.1,l.back,2.8);}
    box(garage,'#1578c7',[width,.52,.34],[center,3.33,-9.07]);const brand=shopSign('AUTOGLASS INC.',Math.min(7,width*.6));brand.position.set(center,3.33,-8.88);garage.add(brand);
    box(this.roof,'#2278bc',[width+.6,.25,12.8],[center,3.7,-3]);box(this.roof,'#3a94cf',[width+.6,.08,12.8],[center,3.86,-3]);
    for(let i=0;i<state.bays;i++){
      const x=bayX(i);box(garage,'#b5c4c7',[2.9,.025,5.4],[x,.3,-1.2]);for(const side of [-1.43,1.43])box(garage,'#f3cd65',[.055,.035,5.4],[x+side,.32,-1.2]);box(garage,'#f3cd65',[2.9,.035,.06],[x,.32,1.5]);
      const bayLabel=label(String(i+1),'#4c7887',.6);bayLabel.position.set(x,.4,1.8);garage.add(bayLabel);
    }
    for(let i=0;i<(state.garageLevel===1?1:4);i++){
      const x=drawerX(i),seat=workerSeat(i);chair(garage,seat.x,seat.z,seat.facing,'#477ea9');box(garage,'#2379b5',[.58,.85,.65],[x,.71,-8]);for(let d=0;d<3;d++)box(garage,'#92bad0',[.44,.04,.04],[x,.5+d*.22,-7.65]);
    }
    box(garage,'#6895a8',[.65,.16,1.65],[-.9,.43,-5.75]);
    for(let i=0;i<12;i++){const pane=box(garage,'#9fdae5',[.045,1.1,1.3],[-1.17+i*.048,1.03,-5.75],true);pane.rotation.z=-.12;this.frontPanes.push(pane);}
    const stockLabel=label('VIDROS','#3f7c9a',1.35);stockLabel.position.set(-.9,1.9,-5.75);garage.add(stockLabel);
    if(state.garageLevel===3)this.buildWarehouse(garage,state,l);
    this.roof.visible=this.inGame?this.roofVisible:true;
  }
  buildWarehouse(garage,state,l){
    const width=l.right-l.left,center=(l.left+l.right)/2;
    box(garage,'#e8edeb',[width,.17,11.1],[center,.2,-14.75]);this.wall(garage,center,l.clBack,width,.24,2.2);this.wall(garage,l.right,-14.75,.22,11.1,.85);
    this.wall(garage,l.left,-18.4,.22,3.8,1.2);this.wall(garage,l.left,-11.3,.22,4.2,1.2);this.doorway(garage,l.left,-15.2,3.1,Math.PI/2);
    const sign=shopSign('CENTRO LOGÍSTICO',6);sign.position.set(center,2.65,-20.14);garage.add(sign);box(garage,'#1578c7',[width,.4,.2],[center,2.65,-20.25]);
    box(this.roof,'#2377ad',[width+.6,.25,11.5],[center,3.7,-14.75]);
    box(garage,'#40617b',[2.4,.9,.8],[-7.6,.73,-16.05]);box(garage,'#bacbd3',[2.6,.12,.95],[-7.6,1.23,-16.05]);box(garage,'#184966',[.5,.33,.16],[-7.6,1.44,-16.05]);box(garage,'#69dce0',[.4,.22,.03],[-7.6,1.46,-15.96]);
    const receipt=label('RECEBIMENTO','#3582a3',2.5);receipt.position.set(-7.6,2.2,-16.05);garage.add(receipt);
    for(const [i,rack] of addresses.entries()){
      for(const x of [-1.5,1.5])for(const z of [-.5,.5])box(garage,'#206daa',[.1,2.5,.1],[rack.x+x,1.54,rack.z+z]);
      for(const y of [.55,1.25,1.95])box(garage,'#e9bd56',[3.15,.12,1.1],[rack.x,y,rack.z]);
      const addr=label(rack.id,'#1764a2',1);addr.position.set(rack.x,2.8,rack.z);garage.add(addr);const parcels=[];
      for(let p=0;p<3;p++){const group=new THREE.Group();box(group,'#d7a05c',[2.1,.47,.78],[rack.x,.85+p*.7,rack.z]);box(group,'#f8e0af',[.15,.48,.79],[rack.x,.85+p*.7,rack.z]);garage.add(group);parcels.push(group);}this.warehouseBoxes[i]=parcels;
    }
    for(let z=-19;z<-10;z+=1.3)box(garage,'#edc965',[.09,.023,.65],[15.1,.3,z]);
  }
  buildTraffic(){this.traffic=[];for(let i=0;i<8;i++){const mesh=makeCar(['#edb859','#74baca','#da8170','#e8efea','#97b475','#668dbb'][i%6]);mesh.userData.crack.visible=false;this.world.add(mesh);this.traffic.push(mesh);}}
  buildPedestrians(){this.pedestrians=[];for(let i=0;i<8;i++){const mesh=makePerson(['#ef9d64','#6c96c3','#85b386','#e1b75e'][i%4]);mesh.scale.setScalar(.88);this.world.add(mesh);this.pedestrians.push(mesh);}}
  setMode(inGame,state={bays:1,garageLevel:1}){
    this.inGame=inGame;this.controls.setEnabled(inGame);this.world.visible=inGame;this.showroom.visible=!inGame;this.scene.background.set(inGame?'#b8e3f3':'#0865bb');this.roofVisible=false;if(this.roof)this.roof.visible=!inGame;this.controls.center(state);
    if(!inGame){this.controls.target.set(0,0,0);this.controls.height=17;this.controls.resize();}
  }
  setGrowth(state){
    const signature=`${state.garageLevel}:${state.cashiers}`;
    if(signature!==this.signature){const stageChanged=this.stage!==state.garageLevel;this.signature=signature;this.stage=state.garageLevel;if(stageChanged)this.buildCity(state);this.buildGarage(state);if(this.inGame&&stageChanged)this.controls.center(state);}
    for(let i=0;i<this.frontPanes.length;i++)this.frontPanes[i].visible=i<state.frontStock;
    for(let i=0;i<this.warehouseBoxes.length;i++)for(let p=0;p<3;p++)this.warehouseBoxes[i][p].visible=p*4<state.warehouseStocks[i];
  }
  setShadows(enabled){this.renderer.shadowMap.enabled=enabled;this.scene.traverse(o=>{if(o.isMesh)o.material.needsUpdate=true;});}
  toggleRoof(){this.roofVisible=!this.roofVisible;this.roof.visible=this.roofVisible;return this.roofVisible;}
  resize(){const {width,height}=this.canvas.parentElement.getBoundingClientRect();this.renderer.setSize(width,height,false);this.controls.resize();}
  updateCar(mesh,car,dt){
    const lift=car.bay===undefined?0:THREE.MathUtils.clamp((3.2-car.z)/1.4,0,1)*.175;mesh.position.set(car.x,.08+lift,car.z);
    const turn=Math.atan2(Math.sin(car.facing-mesh.rotation.y),Math.cos(car.facing-mesh.rotation.y));mesh.rotation.y+=turn*Math.min(1,dt*7);mesh.userData.roll+=car.speed*dt/.3*(car.reversing?-1:1);
    for(const wheel of mesh.userData.wheels){wheel.rotation.x=mesh.userData.roll;wheel.rotation.y=wheel.userData.front?Math.max(-.28,Math.min(.28,turn)):0;}
    mesh.userData.crack.visible=car.glass<.9;mesh.userData.windshield.material.color.set(car.glass>.5?'#a7e4ee':'#6fa5b7');
  }
  updatePeople(map,actors,factory,time){
    for(const actor of actors){if(!map.has(actor.id)){const mesh=factory(actor);this.world.add(mesh);map.set(actor.id,mesh);}animatePerson(map.get(actor.id),actor,time,this.personHeight(actor));}
    for(const [id,mesh] of map)if(!actors.some(a=>a.id===id)){mesh.removeFromParent();map.delete(id);}
  }
  update(dt,simulation,active){
    this.time+=dt;this.controls.update(dt);for(let i=0;i<8;i++){this.updateCar(this.traffic[i],simulation.city.cars[i],active?dt:0);animatePerson(this.pedestrians[i],simulation.city.pedestrians[i],simulation.time,.006);}
    for(const car of simulation.cars){
      if(!this.carMeshes.has(car.id)){const mesh=makeCar(car.color),driver=makePerson(['#da8a5b','#80aa93','#9b86b3'][car.id%3]);this.world.add(mesh,driver);this.carMeshes.set(car.id,mesh);this.driverMeshes.set(car.id,driver);}
      this.updateCar(this.carMeshes.get(car.id),car,active?dt:0);const driver=this.driverMeshes.get(car.id);driver.visible=car.driver.visible;animatePerson(driver,car.driver,simulation.time,this.personHeight(car.driver));
    }
    for(const [id,mesh] of this.carMeshes)if(!simulation.cars.some(c=>c.id===id)){mesh.userData.windshield.material.dispose();mesh.userData.crack.geometry.dispose();mesh.userData.crack.material.dispose();mesh.removeFromParent();this.driverMeshes.get(id).removeFromParent();this.carMeshes.delete(id);this.driverMeshes.delete(id);}
    this.updatePeople(this.workerMeshes,simulation.workers,()=>makePerson('#2485ce',true,true),simulation.time);
    this.updatePeople(this.cashierMeshes,simulation.cashiers,()=>makePerson('#1979c8',true),simulation.time);
    this.updatePeople(this.receiverMeshes,simulation.logistics.workers,()=>makePerson('#e59a37',false,false,true),simulation.time);
    this.updateTruck(simulation,active?dt:0);this.updateBubbles(simulation);this.menuCar.rotation.y=-.6+this.time*.13;this.renderer.render(this.scene,this.camera);
  }
  updateTruck(simulation,dt){
    const truck=simulation.logistics.truck;
    if(!truck){if(this.truckMesh){this.removeStructure(this.truckMesh);this.truckMesh=null;}return;}
    if(!this.truckMesh){this.truckMesh=makeTruck();this.world.add(this.truckMesh);}const mesh=this.truckMesh;mesh.position.set(truck.x,.04,truck.z);
    const turn=Math.atan2(Math.sin(truck.facing-mesh.rotation.y),Math.cos(truck.facing-mesh.rotation.y));mesh.rotation.y+=turn*Math.min(1,dt*7);mesh.userData.roll+=truck.speed*dt/.4*(truck.reversing?-1:1);for(const w of mesh.userData.wheels)w.rotation.x=mesh.userData.roll;
    const open=truck.phase==='unloading';mesh.userData.side.rotation.z=THREE.MathUtils.lerp(mesh.userData.side.rotation.z,open?-1.55:0,Math.min(1,dt*3));
    const pending=simulation.logistics.workers.filter(w=>['toTruck','collecting'].includes(w.phase)).length;for(let i=0;i<8;i++)mesh.userData.cargo[i].visible=i<truck.remaining+pending;
  }
  personHeight(actor){const l=this.layout;if(l&&actor.x>l.left&&actor.x<l.right&&actor.z<l.front&&actor.z>(l.stage===3?l.clBack:l.back))return .235;return .05;}
  updateBubbles(simulation){
    const alive=new Set(),bubble=(key,text)=>{alive.add(key);if(!this.bubbles.has(key)){const sprite=emojiBubble(text);this.world.add(sprite);this.bubbles.set(key,sprite);}return this.bubbles.get(key);};
    for(const car of simulation.cars)if(car.driver.visible&&car.driver.angry){const sprite=bubble(`angry-${car.id}`,'😠');sprite.position.set(car.driver.x,2.25,car.driver.z);}
    for(const worker of simulation.logistics.workers)if(worker.scanning){const sprite=bubble(`scan-${worker.id}`,'📦 ✓');sprite.position.set(worker.x,2.3,worker.z);}
    for(const event of simulation.events){const sprite=bubble(event.id,'💳 ✅'),age=simulation.time-event.time;sprite.position.set(event.x,2.1+age*.4,event.z);sprite.material.opacity=Math.min(1,(1.3-age)*3);}
    for(const [key,sprite] of this.bubbles)if(!alive.has(key)){sprite.removeFromParent();sprite.material.map.dispose();sprite.material.dispose();this.bubbles.delete(key);}
  }
  dispose(){this.observer.disconnect();this.controls.dispose();const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});this.renderer.dispose();}
}
