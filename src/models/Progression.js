export const MAX_LEVEL=16;
export const WAREHOUSE_BINS=72;

const names=['Garagem de bairro','Loja e recebimento','Centro logístico','Sede comercial','Hub de expedição','Comércio digital','Rede de filiais','Frotas corporativas','Distribuição regional','Central de seguros','Marketplace nacional','Operação automatizada','Expansão internacional','Polo industrial','Grupo Autoglass','Comércio mundial'];
const costs=[600,2200,7500,14500,48000,160000,650000,2200000,8000000,32000000,140000000,650000000,2800000000,12000000000,48000000000,0];
const bays=[1,4,5,6,7,8,9,10,10,11,12,12,12,12,12];
const collectors=[0,2,6,8,10,12,14,18,22,26,30,34,38,42,46,48];
const technicians=[1,4,7,10,14,18,24,32,40,50,62,74,86,98,110,120];
const cashiers=[1,3,4,5,6,7,8,10,12,14,16,18,20,21,22,24];
const warehouseTeams=[0,2,8,12,16,22,30,40,52,64,76,90,102,114,126,136];
const salesTeams=[0,0,0,5,8,12,18,24,32,40,50,60,70,80,90,100];
const developers=[0,0,0,0,0,3,6,10,16,24,32,40,48,58,68,80];
const factoryTeams=[0,0,0,0,0,0,0,0,0,0,0,0,0,12,26,40];
const stores=[0,1,2,3,4,4,5,5,6,6,7,7,8,8,9];
const warehouses=[0,1,2,3,4,4,5,5,6,6,7,7,8,9,10];
const offices=[0,0,0,3,5,6,7,8,9,10,11,11,11,11,11,11];
const teamsIT=[0,0,0,0,0,3,4,5,6,7,8,9,10,11,12,12];
const batches=[1,1,1,1,2,5,15,40,120,400,1500,6000,25000,100000,500000];

/** Hiring grows separately from the number of service stations. */
export const LEVELS=names.map((name,i)=>{const at=list=>list[Math.min(i,list.length-1)];return Object.freeze({
  level:i+1,name,cost:at(costs),bays:at(bays),maxWorkers:at(technicians),maxCashiers:at(cashiers),
  maxCollectors:at(warehouseTeams),activeCollectors:at(collectors),maxStore:at(stores),maxWarehouse:at(warehouses),
  maxSales:at(salesTeams),maxDevelopers:at(developers),maxFactoryWorkers:at(factoryTeams),
  maxOffice:at(offices),maxIT:at(teamsIT),docks:i===0?0:i>=12?4:i>=8?3:i>=4?2:1,
  minWarehouse:i>=12?6:i>=8?4:i>=4?2:0,orderBatch:i===15?2000000:at(batches)
});});

export function levelConfig(stateOrNumber){
  const raw=typeof stateOrNumber==='number'?stateOrNumber:stateOrNumber?.garageLevel;
  const level=Number.isFinite(raw)?Math.max(1,Math.min(MAX_LEVEL,Math.floor(raw))):1;
  return LEVELS[level-1];
}

