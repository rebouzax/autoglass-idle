import {levelConfig} from './Progression.js';

export const STAFF_ROLES=[
  {key:'worker',field:'workers',label:'Técnicos',icon:'wrench',color:'#278bc1',capacity:'maxWorkers'},
  {key:'cashier',field:'cashiers',label:'Caixas',icon:'cashier',color:'#4aa995',capacity:'maxCashiers'},
  {key:'logistics',field:'logisticsWorkers',label:'Coletores',icon:'scanner',color:'#e7a43f',capacity:'maxCollectors'},
  {key:'salesWorker',field:'salesWorkers',label:'Vendedores',icon:'phone',color:'#4276a1',capacity:'maxSales'},
  {key:'itWorker',field:'itWorkers',label:'Desenvolvedores',icon:'code',color:'#8970c3',capacity:'maxDevelopers'},
  {key:'factoryWorker',field:'factoryWorkers',label:'Operadores',icon:'factory',color:'#39a7a8',capacity:'maxFactoryWorkers'}
];
export const staffRole=key=>STAFF_ROLES.find(role=>role.key===key);
export function activeStaff(s,key){
  const hired=s[staffRole(key)?.field]||0,c=levelConfig(s);
  const limit={worker:s.bays,cashier:3,logistics:c.activeCollectors,salesWorker:Math.min(s.garageLevel>=7?12:8,1+s.officeComputers),itWorker:s.garageLevel>=7?Math.min(12,Math.max(6,s.itComputers)):6,factoryWorker:s.productionLines}[key]||0;
  return Math.min(hired,limit);
}
export const supportStaff=(s,key)=>Math.max(0,(s[staffRole(key)?.field]||0)-activeStaff(s,key));
export const staffTotal=s=>STAFF_ROLES.reduce((total,role)=>total+(s[role.field]||0),0);
export const staffCapacity=s=>STAFF_ROLES.reduce((total,role)=>total+levelConfig(s)[role.capacity],0);
export const staffEfficiency=(s,key)=>{const present=s.shiftPresent?.[key],support=present===undefined?supportStaff(s,key):Math.min(supportStaff(s,key),Math.max(0,present));return 1+support/(Math.max(1,activeStaff(s,key))*2);};

export function corporateTowers(s,l){
  if(s.garageLevel<7)return [];
  const floors=Math.min(6,2+Math.floor((s.garageLevel-7)/2));
  return [{role:'salesWorker',x:l.officeLeft+8,z:-46.6,floors},{role:'itWorker',x:l.officeRight-8,z:-46.6,floors}];
}

// Departments fit the hired team, instead of reserving empty halls for future hires.
export function workforceLayout(s,primaryRight){
  const floors=s.garageLevel>=7?Math.min(6,2+Math.floor((s.garageLevel-7)/2)):0;
  const groundCount=role=>Math.max(0,supportStaff(s,role)-(['salesWorker','itWorker'].includes(role)?floors*9:0));
  const maxCount=Math.max(1,...STAFF_ROLES.map(role=>groundCount(role.key))),columns=Math.min(s.garageLevel>=7?8:4,Math.max(2,Math.ceil(Math.sqrt(maxCount))));
  const amenities=staffTotal(s)>50,header=amenities?15:3.8,spacing=3.4,rowSpacing=4.2,zoneWidth=columns*spacing+3.2,left=primaryRight+5,front=1.6;
  const order=[['worker','cashier'],['logistics','itWorker'],['salesWorker','factoryWorker']],zones=[];
  let occupiedColumns=0;
  for(const group of order){
    if(!group.some(role=>supportStaff(s,role)>(['salesWorker','itWorker'].includes(role)?floors*9:0)))continue;
    const column=occupiedColumns++;
    let cursor=front;
    for(const role of group){
      const count=groundCount(role);
      if(!count)continue;
      const depth=header+2+Math.ceil(count/columns)*rowSpacing;
      zones.push({role,column,count,left:left+column*zoneWidth,right:left+(column+1)*zoneWidth,front:cursor,back:cursor-depth,depth,width:zoneWidth});cursor-=depth+2;
    }
  }
  if(!zones.length&&s.garageLevel<7)return null;
  const width=Math.max(1,occupiedColumns*zoneWidth),back=Math.min(front-12,...zones.map(zone=>zone.back)),top=Math.max(12,...zones.filter(z=>['worker','logistics','salesWorker'].includes(z.role)).map(z=>z.depth));
  return {spacing,rowSpacing,header,amenities,left,right:left+width,front,back,width,columns,zoneWidth,top,bottom:Math.max(0,front-back-top),zones};
}
export function workforceCells(s,layout){
  const cells=[];
  for(const role of STAFF_ROLES){
    const zone=layout.zones.find(z=>z.role===role.key),towerCount=s.garageLevel>=7&&['salesWorker','itWorker'].includes(role.key)?Math.min(6,2+Math.floor((s.garageLevel-7)/2))*9:0;
    for(let i=0;i<supportStaff(s,role.key);i++){
      const j=Math.max(0,i-towerCount);cells.push({role:role.key,color:role.color,index:i,y:0,x:(zone?.left??layout.left)+2.5+(j%layout.columns)*layout.spacing,z:(zone?.front??layout.front)-layout.header-Math.floor(j/layout.columns)*layout.rowSpacing,aisleX:(zone?.left??layout.left)+.7,zone});
    }
  }
  return cells;
}

export function workforceStations(s,l){
 const cells=l.workforce?workforceCells(s,l.workforce):[],towers=corporateTowers(s,l);
 for(const c of cells){const tower=towers.find(t=>t.role===c.role);if(tower&&c.index<tower.floors*9){c.x=tower.x-3.6+(c.index%3)*3.6;c.z=tower.z+3.6-Math.floor((c.index%9)/3)*3.6;c.y=4*(1+Math.floor(c.index/9));c.tower=tower;}}
 return cells;
}
