export const MAX_LEVEL=15;
export const WAREHOUSE_BINS=36;

const names=['Garagem de bairro','Loja e recebimento','Centro logístico','Sede comercial','Hub de expedição','Comércio digital','Rede de filiais','Frotas corporativas','Distribuição regional','Central de seguros','Marketplace nacional','Operação automatizada','Expansão internacional','Polo industrial','Grupo Autoglass'];
const costs=[600,2200,7500,14500,48000,160000,650000,2200000,8000000,32000000,140000000,650000000,2800000000,12000000000,0];
const bays=[1,4,5,6,7,8,9,10,10,11,12,12,12,12,12];
const collectors=[0,2,3,4,5,5,6,6,7,7,7,8,8,8,8];
const stores=[0,1,2,3,4,4,5,5,6,6,7,7,8,8,9];
const warehouses=[0,1,2,3,4,4,5,5,6,6,7,7,8,9,10];
const offices=[0,0,0,3,5,5,6,6,6,6,7,7,7,7,7];
const teamsIT=[0,0,0,0,0,2,3,3,4,4,5,5,6,6,6];
const batches=[1,1,1,1,2,5,15,40,120,400,1500,6000,25000,100000,500000];

/** Capacities describe visible teams; large contracts represent their wider network. */
export const LEVELS=names.map((name,i)=>Object.freeze({
  level:i+1,name,cost:costs[i],bays:bays[i],maxWorkers:bays[i],maxCashiers:i===0?1:3,
  maxCollectors:collectors[i],maxStore:stores[i],maxWarehouse:warehouses[i],
  maxOffice:offices[i],maxIT:teamsIT[i],docks:i===0?0:i>=12?4:i>=8?3:i>=4?2:1,
  minWarehouse:i>=12?6:i>=8?4:i>=4?2:0,orderBatch:batches[i]
}));

export function levelConfig(stateOrNumber){
  const raw=typeof stateOrNumber==='number'?stateOrNumber:stateOrNumber?.garageLevel;
  const level=Number.isFinite(raw)?Math.max(1,Math.min(MAX_LEVEL,Math.floor(raw))):1;
  return LEVELS[level-1];
}

