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

// Reserved stations connect to separate arrival and departure aisles.
export function workforceLayout(s,primaryRight){
  const columns=s.garageLevel>=7?6:3,spacing=s.garageLevel>=7?3.6:3,zoneWidth=columns*spacing+3.2,c=levelConfig(s);
  const capacities=STAFF_ROLES.map(role=>Math.max(0,c[role.capacity]-({worker:s.bays,cashier:3,logistics:c.activeCollectors,salesWorker:1,itWorker:Math.min(12,c.maxDevelopers),factoryWorker:1}[role.key]||0)));
  const rowHeight=row=>Math.max(1,...row.map(count=>Math.ceil(count/columns)))*5.2+19;
  // Shop, logistics and commercial teams share the first row; finance, IT and factory the second.
  const floors=s.garageLevel>=7?Math.min(6,2+Math.floor((s.garageLevel-7)/2)):0;capacities[3]=Math.max(0,capacities[3]-floors*9);capacities[4]=Math.max(0,capacities[4]-floors*9);const top=rowHeight([capacities[0],capacities[2],capacities[3]]),bottom=rowHeight([capacities[1],capacities[4],capacities[5]]);
  return {spacing,left:primaryRight+(s.garageLevel>=7?8:36),right:primaryRight+(s.garageLevel>=7?8:36)+zoneWidth*3,front:1.6,back:1.6-top-bottom,width:zoneWidth*3,columns,zoneWidth,top,bottom};
}
export function workforceCells(s,layout){
  const zones={worker:[0,0],logistics:[1,0],salesWorker:[2,0],cashier:[0,1],itWorker:[1,1],factoryWorker:[2,1]},cells=[];
  for(const role of STAFF_ROLES){
    const [column,row]=zones[role.key],startZ=layout.front-(row?layout.top:0)-15;
    for(let i=0;i<supportStaff(s,role.key);i++){const towerCount=s.garageLevel>=7&&['salesWorker','itWorker'].includes(role.key)?Math.min(6,2+Math.floor((s.garageLevel-7)/2))*9:0,j=i>=towerCount?i-towerCount:i;cells.push({role:role.key,color:role.color,index:i,y:0,x:layout.left+2.5+column*layout.zoneWidth+(j%layout.columns)*(layout.spacing||2.4),z:startZ-Math.floor(j/layout.columns)*5.2,aisleX:layout.left+.7+column*layout.zoneWidth});}
  }
  return cells;
}

export function workforceStations(s,l){
 const cells=l.workforce?workforceCells(s,l.workforce):[],towers=corporateTowers(s,l);
 for(const c of cells){const tower=towers.find(t=>t.role===c.role);if(tower&&c.index<tower.floors*9){c.x=tower.x-3.6+(c.index%3)*3.6;c.z=tower.z+3.6-Math.floor((c.index%9)/3)*3.6;c.y=4*(1+Math.floor(c.index/9));c.tower=tower;}}
 return cells;
}
