import * as THREE from 'three';
import logoUrl from '../assets/autoglass-logo.png';
import {itDesk,deploymentPoint} from '../models/ShopLayout.js';
import {box,roundedBox,chair} from './LowPolyAssets.js';

function panelTexture(draw,width=768,height=384){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function screen(parent,texture,width,height,x,y,z,type='business',color='#b8ecff'){
  const material=new THREE.MeshStandardMaterial({map:texture,color:'#ffffff',emissive:color,emissiveMap:texture,emissiveIntensity:.24,roughness:.38});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mesh.position.set(x,y,z);mesh.userData={sign:true,type,pulse:.24};parent.add(mesh);return mesh;
}
function textTexture(text,color='#24478e'){
  return panelTexture((ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.fillStyle=color;ctx.font='900 108px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2,w-20);},1024,160);
}

/** Uses the supplied PNG directly; UV coordinates exclude its transparent margin. */
export function addBrandPanel(parent,width,x,y,z,rotation=0){
  const panel=new THREE.Group();panel.position.set(x,y,z);panel.rotation.y=rotation;parent.add(panel);
  const height=width*.235;roundedBox(panel,'#f7fbfe',[width,height,.13],[0,0,0]);
  roundedBox(panel,'#23448c',[width*.96,.04,.145],[0,-height*.44,0]);
  const texture=new THREE.TextureLoader().load(logoUrl);texture.colorSpace=THREE.SRGBColorSpace;texture.repeat.set(.93,.315);texture.offset.set(.035,.395);
  const mark=new THREE.Mesh(new THREE.PlaneGeometry(width*.46,width*.156),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));mark.position.set(-width*.235,.015,.078);mark.userData.sign=true;panel.add(mark);
  const name=new THREE.Mesh(new THREE.PlaneGeometry(width*.445,width*.072),new THREE.MeshBasicMaterial({map:textTexture('AUTOGLASS'),transparent:true,depthWrite:false}));name.position.set(width*.252,.015,.08);name.userData.sign=true;panel.add(name);
  return panel;
}

function codingTexture(index){
  return panelTexture((ctx,w,h)=>{
    ctx.fillStyle='#0c263f';ctx.fillRect(0,0,w,h);ctx.fillStyle='#183a56';ctx.fillRect(0,0,w,52);for(let n=0;n<3;n++){ctx.fillStyle=['#f9b286','#7fe2bc','#8ad7f0'][n];ctx.beginPath();ctx.arc(27+n*25,26,6,0,Math.PI*2);ctx.fill();}
    const colors=['#62ddbc','#92c8ff','#dda9ff','#80cde5'];
    for(let i=0;i<8;i++){const indent=(i+index)%3*28;ctx.fillStyle=colors[i%4];ctx.fillRect(28+indent,83+i*32,180+((i*77+index*42)%250),7);ctx.fillStyle='#34576c';ctx.fillRect(32+indent,95+i*32,80+((i*39)%190),5);}
    ctx.fillStyle='#26a886';ctx.fillRect(w-178,h-48,148,25);ctx.strokeStyle='#e4fff8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(w-140,h-36);ctx.lineTo(w-130,h-28);ctx.lineTo(w-115,h-42);ctx.stroke();
  });
}
function websiteTexture(state){
  return panelTexture((ctx,w,h)=>{
    ctx.fillStyle='#edf6ff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#21448f';ctx.fillRect(0,0,w,64);ctx.fillStyle='#ffffff';ctx.font='900 30px system-ui';ctx.fillText('AUTOGLASS',30,43);
    ctx.fillStyle='#bbd9f5';ctx.fillRect(w*.53,23,w*.32,24);ctx.fillStyle='#4ce4b2';ctx.beginPath();ctx.arc(w-37,35,11,0,Math.PI*2);ctx.fill();
    const colors=['#7fc4e2','#85b4d7','#f5c575'];
    for(let i=0;i<3;i++){const x=28+i*245;ctx.fillStyle='#ffffff';ctx.fillRect(x,96,223,230);ctx.fillStyle=colors[i];ctx.fillRect(x+28,117,167,112);ctx.fillStyle='#244572';ctx.fillRect(x+28,250,150,8);ctx.fillStyle='#7fa1bd';ctx.fillRect(x+28,269,95,6);ctx.fillStyle='#2587d7';ctx.fillRect(x+28,289,167,20);}
    ctx.fillStyle='#27a980';ctx.fillRect(28,h-34,Math.min(w-56,150+state.ecommerce*76),10);
  });
}

export function buildITDepartment(parent,roof,state,layout){
  if(state.garageLevel<6)return[];const l=layout,width=l.officeRight-l.officeLeft,depth=l.itFront-l.itBack,center=(l.officeLeft+l.officeRight)/2,mid=(l.itFront+l.itBack)/2,displays=[];
  box(parent,'#e1edf5',[width,.17,depth],[center,.2,mid]);
  for(let x=l.officeLeft+1.5;x<l.officeRight;x+=1.5)box(parent,'#bfd4e3',[.015,.008,depth-.3],[x,.289,mid]);
  for(let z=l.itBack+1.5;z<l.itFront;z+=1.5)box(parent,'#bfd4e3',[width-.3,.008,.015],[center,.29,z]);
  for(const x of [l.officeLeft,l.officeRight]){box(parent,'#d5e3ec',[.22,.8,depth],[x,.685,mid]);box(parent,'#1b78b8',[.235,.07,depth],[x,1.115,mid]);}
  box(parent,'#d5e3ec',[width,1.75,.22],[center,1.16,l.itBack]);box(parent,'#2456a0',[width,.33,.24],[center,2.2,l.itBack]);
  box(roof,'#23558a',[width+.3,.24,depth+.25],[center,3.7,mid]);
  for(let i=0;i<state.itWorkers;i++){
    const p=itDesk(state,i),z=p.z-1.1;chair(parent,p.x,p.z,p.facing,'#477cba');
    for(const x of [p.x-1.08,p.x+1.08])box(parent,'#507489',[.085,.78,.48],[x,.67,z]);
    roundedBox(parent,'#eff7fb',[2.6,.12,.8],[p.x,1.13,z]);
    const count=state.itComputers>i?2:1;
    for(let j=0;j<count;j++){
      const x=p.x+(count===1?0:(j? .58:-.58));box(parent,'#263c59',[1.04,.66,.075],[x,1.61,z-.13]);box(parent,'#56758e',[.08,.21,.075],[x,1.2,z-.13]);box(parent,'#56758e',[.4,.035,.2],[x,1.2,z-.13]);
      displays.push(screen(parent,j===1?websiteTexture(state):codingTexture(i),.94,.56,x,1.61,z-.085,j===1?'online':'coding'));
    }
    roundedBox(parent,'#325574',[.8,.03,.2],[p.x,1.215,z+.18]);
    for(let k=0;k<6;k++)box(parent,'#9ebbcf',[.035,.01,.15],[p.x-.29+k*.11,1.235,z+.18]);
    roundedBox(parent,'#567d99',[.115,.025,.16],[p.x+.54,1.218,z+.2]);
    box(parent,'#294b6d',[.25,.49,.55],[p.x+1.03,.79,z]);
    for(let n=0;n<Math.min(3,1+Math.floor(state.itComputers/2));n++)box(parent,'#56d8cb',[.035,.035,.025],[p.x+1.035,.8+n*.085,z+.287]);
  }
  const deploy=deploymentPoint(state),sx=deploy.x,sz=-27.4;
  roundedBox(parent,'#224261',[2.12,2.18,.75],[sx,1.38,sz]);
  for(let i=0;i<6;i++){
    const y=.53+i*.3,active=i<Math.max(1,state.servers);roundedBox(parent,active?'#304f71':'#253b56',[1.9,.24,.06],[sx,y,sz+.405]);
    for(let k=0;k<5;k++)box(parent,active?'#65d6ae':'#55677b',[.028,.035,.015],[sx+.22+k*.115,y,sz+.446]);
  }
  const serverTexture=panelTexture((ctx,w,h)=>{ctx.fillStyle='#112e4d';ctx.fillRect(0,0,w,h);for(let i=0;i<12;i++){ctx.fillStyle=i%3===0?'#7bc5ff':'#42d7a0';ctx.fillRect(28+i*57,72+(i%4)*26,35,166-(i%4)*26);}ctx.fillStyle='#71e2be';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(32+i*26,30,7,0,Math.PI*2);ctx.fill();}},768,272);
  displays.push(screen(parent,serverTexture,1.7,.61,sx,2.45,sz+.45,'server','#73ffd1'));
  box(parent,'#2a77bc',[5.9,1.45,.09],[l.officeLeft+5.3,1.17,l.itBack+.18]);
  displays.push(screen(parent,websiteTexture(state),5.5,1.2,l.officeLeft+5.3,1.19,l.itBack+.235,'online'));
  addBrandPanel(parent,3.9,l.officeRight-3.0,3.02,l.itBack+.15);
  return displays;
}

const channels=[['branches',7],['fleetContracts',8],['distribution',9],['insurance',10],['marketplace',11],['automation',12],['international',13],['manufacturing',14],['holding',15]];
export function buildBusinessDisplay(parent,state,layout){
  if(state.garageLevel<4)return[];const list=channels.filter(([,stage])=>state.garageLevel>=stage),l=layout;
  const texture=panelTexture((ctx,w,h)=>{
    ctx.fillStyle='#173b5c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#3a6b8b';ctx.fillRect(24,22,180,9);ctx.fillStyle='#5bddb5';ctx.beginPath();ctx.arc(w-40,27,7,0,Math.PI*2);ctx.fill();
    const visible=list.length?list:[['salesTraining'],['businessArea']];
    visible.forEach(([field],i)=>{
      const x=24+(i%3)*242,y=53+Math.floor(i/3)*104,active=state[field]>0;ctx.fillStyle=active?'#245b7d':'#27485d';ctx.fillRect(x,y,220,92);
      ctx.strokeStyle='#5785a0';ctx.lineWidth=1.5;for(let row=0;row<3;row++){ctx.beginPath();ctx.moveTo(x+15,y+22+row*23);ctx.lineTo(x+205,y+22+row*23);ctx.stroke();}
      ctx.strokeStyle=active?'#74dfc0':'#94b5c6';ctx.lineWidth=4;ctx.beginPath();for(let k=0;k<7;k++){const px=x+18+k*30,py=y+73-(k*(state[field]+1)*4+i*7)%53;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();
      ctx.fillStyle=active?'#b0f4dc':'#829fb0';ctx.beginPath();ctx.arc(x+18,y+18,4,0,Math.PI*2);ctx.fill();
    });
  });
  const width=list.length>3?7.8:5.8,height=list.length>3?2.25:1.65,x=l.officeLeft+5.9,z=l.officeBack+.14;
  box(parent,'#214c6b',[width+.15,height+.15,.065],[x,1.68,z]);
  return[screen(parent,texture,width,height,x,1.68,z+.045,'business')];
}
