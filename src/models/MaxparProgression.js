export const MAXPAR_LEVELS=[
  {stage:7,name:'Assistência de bairro',cost:80000,bays:1,workers:2,services:0,tools:0,speed:0,contracts:0},
  {stage:8,name:'Oficina de assistência',cost:180000,bays:2,workers:4,services:4,tools:1,speed:1,contracts:0},
  {stage:9,name:'Reparos especializados',cost:650000,bays:2,workers:6,services:10,tools:2,speed:2,contracts:0},
  {stage:10,name:'Centro de diagnóstico',cost:2400000,bays:3,workers:8,services:18,tools:3,speed:2,contracts:1},
  {stage:11,name:'Assistência de frotas',cost:9000000,bays:3,workers:10,services:30,tools:3,speed:3,contracts:2},
  {stage:12,name:'Central de seguradoras',cost:34000000,bays:4,workers:12,services:48,tools:4,speed:4,contracts:3},
  {stage:13,name:'Hub de assistência',cost:150000000,bays:5,workers:16,services:70,tools:5,speed:5,contracts:4},
  {stage:15,name:'Rede regional Maxpar',cost:1600000000,bays:6,workers:20,services:110,tools:6,speed:6,contracts:5}
];
export const maxparConfig=s=>MAXPAR_LEVELS[Math.max(0,Math.min(7,(s.maxparLevel||1)-1))];
export const maxparLevelLimit=s=>MAXPAR_LEVELS.filter(c=>s.garageLevel>=c.stage).length;
export function maxparRequirements(s){
 const next=MAXPAR_LEVELS[s.maxparLevel||0];if(!next)return [];
 return [{title:'Autoglass',current:s.garageLevel,target:next.stage},{title:'Assistências concluídas',current:s.maxparServices||0,target:next.services},{title:'Ferramentas Maxpar',current:s.maxparTools||0,target:next.tools},{title:'Produtividade Maxpar',current:s.maxparSpeed||0,target:next.speed},{title:'Contratos Maxpar',current:s.maxparContracts||0,target:next.contracts},...(s.maxparLevel?[{title:'CL Maxpar',current:s.maxparWarehouse||0,target:Math.floor(s.maxparLevel/2)},{title:'Coletores Maxpar',current:s.maxparCollectors||0,target:1+Math.floor(s.maxparLevel/2)}]:[])].filter(r=>r.target>0).map(r=>({...r,complete:r.current>=r.target}));
}
export function maxparLayout(s,rearStreet){
 const c=maxparConfig(s),right=-39,front=rearStreet-10.5,clFront=front-23-(s.maxparLevel||1)*1.2,back=clFront-14-(s.maxparWarehouse||0)*.8,left=right-10-c.bays*5.2;
 return {left,right,front,back,clFront,clBack:back,street:rearStreet,lane:rearStreet-1.5,plotLeft:left-9,plotRight:right+2,plotFront:rearStreet-(s.garageLevel>=6?4.85:3.55),plotBack:back-2,bays:c.bays};
}
export const maxparCollectorLimit=s=>Math.min(6,1+Math.floor((s.maxparLevel||0)/2));
export const maxparDock=l=>({x:l.left-5,z:l.clFront-6,point:{x:l.left-1.2,z:l.clFront-6}});
export const maxparCollectorHome=(l,i)=>({x:l.left+2+(i%3)*1.4,z:l.clFront+1+Math.floor(i/3)*1.5,facing:Math.PI});
export function maxparBins(s,l){const types=['parts','paint','glass','carMirror','motoMirror','sensors','wipers','lights'],count=Math.min(16,4+2*(s.maxparLevel||1)+2*(s.maxparWarehouse||0));return Array.from({length:count},(_,i)=>({id:'M-'+String(i+1).padStart(2,'0'),product:types[i%8],x:l.left+3+(i%4)*(l.right-l.left-6)/3,z:l.clBack+2.5+Math.floor(i/4)*3.2,capacity:12}));}
export const maxparBay=(l,i)=>({x:l.right-3.6-i*5.2,z:l.front-3.7});
export const maxparSupply=(l,i)=>({x:maxparBay(l,i).x+1.7,z:l.front-10.5});
export const maxparSeat=(l,i)=>({x:maxparBay(l,i).x,z:l.front-12.6,facing:0});
export const maxparReception=l=>({x:l.left+3,z:l.front-8});
export const maxparLounge=(l,i)=>({x:l.left+2+(Math.floor(i/4)*2),z:l.front-2.2-(i%4)*1.5,facing:Math.PI/2});
export const maxparDesk=(l,i)=>({x:l.right-3.6-(i%4)*4.8,z:l.front-17.5-Math.floor(i/4)*3.1,facing:Math.PI});
export const MAXPAR_SERVICES=[
 {name:'Reparo emergencial',product:'parts',level:1,duration:28,multiplier:1.9,kind:'repair'},
 {name:'Troca de vidro',product:'glass',level:1,duration:22,multiplier:1.3},
 {name:'Retrovisor de carro',product:'carMirror',level:1,duration:18,multiplier:1.4},
 {name:'Pintura de carro',product:'paint',level:2,duration:32,multiplier:2.4,kind:'paint'},
 {name:'Pintura de moto',product:'paint',level:2,duration:24,multiplier:2.1,kind:'paint',vehicleType:'moto'},
 {name:'Roda, pneu e suspensão',product:'parts',level:2,duration:25,multiplier:2,kind:'repair'},
 {name:'Retrovisor de moto',product:'motoMirror',level:2,duration:16,multiplier:1.5},
 {name:'Lataria e pequenos reparos',product:'parts',level:3,duration:25,multiplier:2.2,kind:'repair'},
 {name:'Reparo de moto',product:'parts',level:3,duration:21,multiplier:1.8,kind:'repair',vehicleType:'moto'},
 {name:'Diagnóstico e sensores',product:'sensors',level:4,duration:30,multiplier:2.1},
 {name:'Manutenção de frotas',product:'wipers',level:5,duration:24,multiplier:2},
 {name:'Assistência de iluminação',product:'lights',level:6,duration:23,multiplier:1.9}
];
