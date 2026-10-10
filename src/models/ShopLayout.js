import {activeStaff,workforceLayout,staffCapacity} from './Workforce.js';
import {rectangle} from './NavigationSystem.js';
import {levelConfig} from './Progression.js';
export const bayX=index=>1.25+index*5.2;
export const workerSeat=index=>({x:bayX(index)+1.05,z:-6.8,facing:0});
export const drawerX=index=>bayX(index)-1;
export const drawerZ=-7.7;
export const loungeSpot=index=>({x:-8.7+Math.floor(index/4)*2.05,z:-3.9+(index%4)*1.55,facing:Math.PI/2});
export const deskX=index=>[-8.15,-5.8,-3.55][index];
export const stockPoint={x:.05,z:-5.75};
export const packingPoint={x:13.7,z:-5.3};
export const pickupPoint={x:-6.9,z:-4.9};
export const packingBench={x:15.1,z:-5.3};
export const productPoint=product=>product==='glass'?stockPoint:{x:product==='carMirror'?2.25:product==='motoMirror'?5.3:8.35,z:-4.85};
export const dispatchBay=(s,i)=>({x:shopLayout(s).officeLeft+3.45+i*4.6,z:driveway(s).front-4.3});
export const dispatchPoint=(s,i)=>({x:dispatchBay(s,i).x-1.8,z:dispatchBay(s,i).z-1.1});
export const courierSeat=(s,i)=>({x:dispatchBay(s,i).x-1.8,z:dispatchBay(s,i).z+.4});
export const frontDoor={x:-6.1,z:3.2};
export const driveway=s=>({arrival:8.8+(s.storeExpansion||0),exit:6.8+(s.storeExpansion||0),front:6.6+(s.storeExpansion||0)});
export const clDoor={x:13.1,z:-9.2};
export const scanPoint={x:-7.6,z:-14.6};
export const dockPoint={x:-11.7,z:-15.2};
export const addresses=Array.from({length:72},(_,i)=>({id:`A-${String(i+1).padStart(2,'0')}`,x:i<36?[-3.8,3.2,10.2][i%3]:[22,29,36,43][(i-36)%4],z:i>=36?-24-Math.floor((i-36)/4)*8:i<3?-17.5:i<6?-12.4:-22.6-Math.floor((i-6)/3)*5.1,capacity:12}));
export const getAddresses=s=>s.garageLevel<2?[]:addresses.slice(0,s.garageLevel===2?3:s.garageLevel>=7?36+Math.min(36,4*(s.garageLevel-6)+2*(s.warehouseExpansion||0)):Math.min(36,6+3*(s.warehouseExpansion??0)));
export const rackPoint=i=>({x:addresses[i].x,z:addresses[i].z+1.25});
export function shopLayout(s={garageLevel:1}){
 const stage=s.garageLevel||1,front=3.2+(s.storeExpansion??0),right=stage===1?5.45:bayX((s.bays||levelConfig(s).bays)-1)+4.2,clBack=Math.min(stage>=7?Math.min(-78-(stage-7)*5,-20.3-5.1*(s.warehouseExpansion??0)-Math.max(0,stage-6)*4):-20.3-5.1*(s.warehouseExpansion??0),stage>=2?-19-4.4*(Math.ceil(levelConfig(s).activeCollectors/(stage>=7?4:2))-1):0),officeLeft=right+.9,officeRight=officeLeft+(stage>=7?32+(stage-7)*2:stage>=6?18:stage>=5?16:12);
 const academyLeft=officeRight+2,academyRight=officeRight+21,factoryRight=officeRight+25;
 const primaryRight=stage>=14?factoryRight:stage>=8?academyRight:stage>=4?officeRight:right;
 const workforce=stage>=3?workforceLayout(s,primaryRight):null;
 const campusBack=Math.min(workforce?workforce.back-.7:0,stage>=7?Math.min(clBack-.7,-58-(stage-7)*5):stage>=6?Math.min(clBack-.7,-30):stage>=2?clBack-.7:-10.5),plotLeft=stage>=2?-21.5:-11.4;
 const parkingLeft=stage>=7?officeLeft+8:stage>=2?primaryRight+4:-9.3,parkingRoom=stage>=7?workforce.left-9-parkingLeft:stage>=2?24:16.4,columns=Math.max(2,Math.floor((parkingRoom-4)/3.1)),capacity=Math.ceil(staffCapacity(s)*.65)+4,rows=Math.ceil(capacity/columns),parkingWidth=columns*3.1+4,parkingFront=stage>=7?-62:stage>=2?1.6:-12.5;
 const employeeParking={columns,rows,capacity,left:parkingLeft,right:parkingLeft+parkingWidth,front:parkingFront,back:parkingFront-rows*10.8-7,access:stage>=7?'left':'right'};
 const plotRight=Math.max(workforce?workforce.right+1.3:primaryRight+1.3,employeeParking.right+14),plotBack=Math.min(campusBack,employeeParking.back-2);
 return{campusBack,employeeParking,left:-10.3,right,front,back:-9.2,clBack,stage,officeLeft,officeRight,officeBack:-13.5,officeFront:1.6,itBack:-29,itFront:-13.5,academyLeft,academyRight,factoryRight,workforce,plotLeft,plotRight,plotBack};
}
export function docks(s){const l=shopLayout(s),count=Math.min(levelConfig(s).docks,1+Math.floor((l.back-l.clBack-10)/10.2));return Array.from({length:Math.max(1,count)},(_,i)=>({id:`dock-${i}`,index:i,x:-14.3,z:-15.2-i*10.2,point:{x:-11.7,z:-15.2-i*10.2}}));}
export const collectorHome=(s,i)=>({x:s.garageLevel>=7&&i%2?shopLayout(s).right-1.4:14.8,z:-11.5-Math.floor(i/(s.garageLevel>=7?2:1))*2.1,facing:-Math.PI/2});
export const scanStation=(s,i)=>({x:(s.garageLevel>=7&&Math.floor(i/2)%2?shopLayout(s).right-8.4:-7.6)+(i%2)*1.35,z:-14.6-Math.floor(i/(s.garageLevel>=7?4:2))*4.4});
export function cityRoads(s={garageLevel:1}){const l=shopLayout(s);return{xs:[-28.5,Math.max(22,l.plotRight+(s.garageLevel>=6?30:6))],zs:[10+(s.storeExpansion||0),l.plotBack-7,38]};}
export function employeeHome(l,number){const columns=Math.min(25,Math.max(1,Math.ceil(staffCapacity({garageLevel:l.stage})/2))),house=Math.floor(number/2),raw=l.employeeParking.left-(columns*6.4+30)+(house%columns)*6.4,x=raw>-35?raw+14:raw,z=l.plotBack-18-Math.floor(house/columns)*12.4;return {house:{x,z},home:{x:x+(number%2?1:-1)*1.65,z:z+2.9}};}
export const parkingGate=(l,arriving=false)=>l.employeeParking.access==='left'?l.employeeParking.left-(arriving?1.2:5.6):l.employeeParking.right+(arriving?12.4:8);
export function onCityRoad(s,x,z,r=0){const roads=cityRoads(s),half=s.garageLevel>=6?4.7:3.7;return roads.xs.some(v=>Math.abs(x-v)<half+r)||roads.zs.some(v=>Math.abs(z-v)<half+r);}
export const logisticsRoad=s=>shopLayout(s).clBack-7;
export const roadExit=s=>Math.max(100,shopLayout(s).plotRight+32);
export function officeDesk(s,i){const l=shopLayout(s),cols=s.garageLevel>=7?4:s.garageLevel>=5?3:2,row=Math.floor(i/cols);return{x:l.officeLeft+(s.garageLevel>=7?6:4.1)+(i%cols)*4.4,z:-1.1-row*3.2,facing:Math.PI};}
export function meetingSeat(s,i){const l=shopLayout(s);return{x:l.officeLeft+5.9+(i?1.7:-1.7),z:-11.1,facing:i?-Math.PI/2:Math.PI/2};}
export function itDesk(s,i){const l=shopLayout(s),cols=s.garageLevel>=7?4:3;return{x:l.officeLeft+3+(i%cols)*4.5,z:-17-Math.floor(i/cols)*3.5,facing:Math.PI};}
export const deploymentPoint=s=>({x:shopLayout(s).officeRight-2.7,z:-26.3,facing:Math.PI});
export const academySeat=(s,i)=>({x:shopLayout(s).academyLeft+5+(i%2)*6,z:-2.4-Math.floor(i/2)*3,facing:Math.PI});
export const academyPractice=s=>({x:shopLayout(s).academyLeft+15.5,z:-9.8,facing:Math.PI});
export const academyTeacher=s=>({x:shopLayout(s).academyLeft+2,z:-10.1,facing:Math.PI/2});
export const factoryStation=(s,i,step)=>({x:shopLayout(s).academyLeft+2.6+i*6,z:[-28.2,-24.5,-20.5][step],facing:Math.PI/2});
export const factoryPickup=s=>({x:shopLayout(s).academyLeft+1.3,z:-16.6,facing:Math.PI/2});
export function portals(s){const l=shopLayout(s);return[
 {id:'lounge',axis:'x',line:-2.7,low:1.22,high:2.48,offset:1.6},
 ...(s.garageLevel>=2?[{id:'cl',axis:'z',line:-9.2,low:12.35,high:13.85,offset:1.05}]:[]),
 ...(s.garageLevel>=4?[{id:'office',axis:'x',line:(l.right+l.officeLeft)/2,low:-4.15,high:-2.65,offset:.9},{id:'dispatch',axis:'z',line:1.6,low:l.officeLeft+.8,high:l.officeLeft+2.4,offset:1.2}]:[]),
 ...(s.garageLevel>=6?[{id:'it',axis:'z',line:l.itFront,low:l.officeRight-3.6,high:l.officeRight-2,offset:1.2}]:[]),
 ...(s.garageLevel>=8?[{id:'academy',axis:'z',line:1.6,low:l.academyLeft+.8,high:l.academyLeft+2.4,offset:1.2}]:[]),
 ...(s.garageLevel>=14?[{id:'factory',axis:'z',line:-13.5,low:l.academyLeft+14.8,high:l.academyLeft+16.4,offset:1.2}]:[])
 ];}
export function roomOf(p,s){const l=shopLayout(s);if(s.garageLevel>=8&&p.x>l.officeRight+.4){if(p.z>1.6||p.x<l.academyLeft)return 'yard';return s.garageLevel>=14&&p.z<-13.5?'factory':'academy';}return s.garageLevel>=4&&p.x>(l.right+l.officeLeft)/2?(p.z>l.officeFront?'yard':s.garageLevel>=6&&p.z<l.itFront?'it':'office'):s.garageLevel>=2&&p.z<l.back?'cl':p.x<-2.7?'lounge':'shop';}
export function interiorWaypoints(start,end,s){
 const source=roomOf(start,s),destination=roomOf(end,s),result=[],available=portals(s);if(source===destination)return result;
 const chains={shop:[],lounge:['lounge'],cl:['cl'],office:['office'],yard:['office','dispatch'],it:['office','it'],academy:['office','dispatch','academy'],factory:['office','dispatch','academy','factory']},a=chains[source]||[],b=chains[destination]||[];let common=0;while(common<a.length&&common<b.length&&a[common]===b[common])common++;
 const cross=(id,entering)=>{const p=available.find(v=>v.id===id);if(!p)return;const axis=p.axis,other=axis==='x'?'z':'x',dir=(['office','dispatch'].includes(id)?1:-1)*(entering?1:-1),lane=dir<0?p.low:p.high;result.push({[axis]:p.line-dir*p.offset,[other]:lane},{[axis]:p.line+dir*p.offset,[other]:lane,portal:id+(dir<0?'-out':'-in')});};
 for(let i=a.length-1;i>=common;i--)cross(a[i],false);for(let i=common;i<b.length;i++)cross(b[i],true);return result;
}
export function shopObstacles(s){
 const l=shopLayout(s),depth=l.front-l.back,mid=(l.front+l.back)/2,o=[rectangle(l.left,mid,.22,depth)];
 if(s.garageLevel<4)o.push(rectangle(l.right,mid,.22,depth));else o.push(rectangle(l.right,(l.back-4.85)/2,.22,-4.85-l.back),rectangle(l.right,(-1.95+l.front)/2,.22,l.front+1.95));
 o.push(rectangle(-2.7,(-9.2+.55)/2,.2,9.75));if(l.front>3.15)o.push(rectangle(-2.7,(3.15+l.front)/2,.2,l.front-3.15));o.push(rectangle(-8.85,l.front,2.9,.2),rectangle(-3.75,l.front,2.1,.2));
 if(l.stage<2)o.push(rectangle((l.left+l.right)/2,l.back,l.right-l.left,.24));else{
  o.push(rectangle((l.left+11.5)/2,l.back,11.5-l.left,.24),rectangle((14.7+l.right)/2,l.back,l.right-14.7,.24),rectangle((l.left+l.right)/2,l.clBack,l.right-l.left,.24),rectangle(l.right,(l.clBack+l.back)/2,.22,l.back-l.clBack));
  const openings=docks(s).map(d=>({low:d.z-1.55,high:d.z+1.55})).sort((a,b)=>a.low-b.low);let z=l.clBack;for(const gap of openings){if(gap.low>z)o.push(rectangle(l.left,(z+gap.low)/2,.22,gap.low-z));z=gap.high;}if(z<l.back)o.push(rectangle(l.left,(z+l.back)/2,.22,l.back-z));
  for(const rack of getAddresses(s))o.push(rectangle(rack.x,rack.z,3.1,1.05));for(let i=0;i<Math.max(1,Math.ceil(activeStaff(s,'logistics')/2));i++){const p=scanStation(s,i*2);o.push(rectangle(p.x+.5,p.z-1.45,2.4,.8));}
  for(let i=0;i<activeStaff(s,'logistics');i++){const p=collectorHome(s,i);o.push(rectangle(p.x+.65,p.z,.13,.8));}
  if(s.garageLevel>=7){o.push(rectangle((18+l.right-2)/2,-14.9,l.right-20,1.35));if(s.garageLevel>=12)for(const x of [l.right-3,l.right-6])o.push(rectangle(x,-16.4,1.1,1.1));}
 }
 for(let i=0;i<activeStaff(s,'cashier');i++)o.push(rectangle(deskX(i),-7.05,1.65,.75));for(let i=0;i<s.bays;i++){const p=loungeSpot(i);o.push(rectangle(p.x-.65,p.z,.13,.8));}
 for(let i=0;i<s.bays;i++){const p=workerSeat(i);o.push(rectangle(p.x,p.z-.65,.8,.13),rectangle(drawerX(i),drawerZ,.58,.65));}o.push(rectangle(-.9,-5.75,.65,1.65));
 if(s.garageLevel>=2){for(const key of ['carMirror','motoMirror','parts']){const p=productPoint(key);o.push(rectangle(p.x,p.z-1.1,1.45,.65));}o.push(rectangle(packingBench.x,packingBench.z,1.5,.8),rectangle(-6.9,-5.8,1.4,.5));}
 if(s.garageLevel>=4){const width=l.officeRight-l.officeLeft;
  o.push(rectangle(l.officeRight,(l.officeBack+l.officeFront)/2,.22,l.officeFront-l.officeBack));
  if(s.garageLevel<6)o.push(rectangle((l.officeLeft+l.officeRight)/2,l.officeBack,width,.22));else{
   const doorX=l.officeRight-2.8;o.push(rectangle((l.officeLeft+doorX-1.5)/2,l.officeBack,doorX-1.5-l.officeLeft,.22),rectangle((doorX+1.5+l.officeRight)/2,l.officeBack,l.officeRight-doorX-1.5,.22),rectangle((l.officeLeft+l.officeRight)/2,l.itBack,width,.22),rectangle(l.officeLeft,(l.itBack+l.itFront)/2,.22,l.itFront-l.itBack),rectangle(l.officeRight,(l.itBack+l.itFront)/2,.22,l.itFront-l.itBack));
   for(let i=0;i<activeStaff(s,'itWorker');i++){const p=itDesk(s,i);o.push(rectangle(p.x,p.z-1.1,2.6,.8));}o.push(rectangle(l.officeRight-2.7,-27.4,2.2,.8));for(let i=0;i<Math.min(3,s.cloudPlatform+Math.floor(s.servers/2));i++)o.push(rectangle(l.officeLeft+2.5+i*1.65,-27.9,1.2,.6));
  }
  o.push(rectangle((l.officeLeft+3.25+l.officeRight)/2,l.officeFront,l.officeRight-l.officeLeft-3.25,.22),rectangle(l.officeLeft,(l.officeBack-4.85)/2,.22,-4.85-l.officeBack),rectangle(l.officeLeft,(-1.95+l.officeFront)/2,.22,l.officeFront+1.95));
  for(let i=0;i<activeStaff(s,'salesWorker');i++){const p=officeDesk(s,i);o.push(rectangle(p.x,p.z-1.1,2.4,.8));}if(s.officeChairs>=2)o.push(rectangle(l.officeRight-.8,-8.2,1.25,.5));if(s.businessArea)o.push(rectangle(l.officeLeft+5.9,-11.1,1.3,2.4));if(s.businessArea>=2)o.push(rectangle(l.officeLeft+9.1,-11.1,.08,2.4));
 }
 if(s.garageLevel>=8){
  const left=l.academyLeft,right=l.academyRight,center=(left+right)/2;
  o.push(rectangle(left,-5.95,.22,15.1),rectangle(right,-5.95,.22,15.1),rectangle(left+.15,1.6,.3,.22),rectangle((left+3.2+right)/2,1.6,right-left-3.2,.22));
  if(s.garageLevel<14)o.push(rectangle(center,-13.5,right-left,.22));else{o.push(rectangle((left+left+13.8)/2,-13.5,13.8,.22),rectangle((left+17.4+right)/2,-13.5,right-left-17.4,.22));}
  for(let i=0;i<Math.min(6,2+s.trainingLevel);i++){const p=academySeat(s,i);o.push(rectangle(p.x,p.z-.95,2,.6));}
  const practice=academyPractice(s);o.push(rectangle(practice.x,practice.z-1.1,2.3,.7));
 }
 if(s.garageLevel>=14){
  const left=l.academyLeft,right=l.factoryRight;
  o.push(rectangle(left,-24.8,.22,22.6),rectangle(right,-24.8,.22,22.6),rectangle((left+right)/2,-36.1,right-left,.22),rectangle((l.academyRight+right)/2,-13.5,right-l.academyRight,.22));
  for(let i=0;i<s.productionLines;i++)o.push(rectangle(left+4.2+i*6,-24.5,1.65,9.5));
  o.push(rectangle(left+2.7,-16.6,1.4,1.3));
 }
 return o;
}

