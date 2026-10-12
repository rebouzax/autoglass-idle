import {PRODUCTS,availableProducts,productKeys} from './Products.js';
import {MAX_LEVEL,WAREHOUSE_BINS,levelConfig,LEVELS} from './Progression.js';
import {STAFF_ROLES,staffRole,staffTotal,staffCapacity,staffEfficiency} from './Workforce.js';
const SAVE_KEY='autoglass-idle-save-v1';
const SETTINGS_KEY='autoglass-idle-settings';
export const UPGRADES={
  productivity:{field:'productivity',title:'Produtividade',icon:'wrench',group:'shop',minStage:1,max:15,base:85,factor:1.6},
  tools:{field:'tools',title:'Ferramentas',icon:'tools',group:'shop',minStage:1,max:8,base:65,factor:1.85},
  stock:{field:'stockRacks',title:'Expositores',icon:'stock',group:'shop',minStage:1,max:8,base:110,factor:1.8},
  worker:{field:'workers',title:'Contratar técnicos',icon:'worker',group:'shop',minStage:2,max:120,base:95,factor:1.85,initial:1},
  cashier:{field:'cashiers',title:'Contratar caixas',icon:'cashier',group:'shop',minStage:2,max:24,base:380,factor:1.7,initial:2},
  store:{field:'storeExpansion',title:'Ampliar oficina',icon:'garage',group:'shop',minStage:3,max:9,base:650,factor:2},
  logistics:{field:'logisticsWorkers',title:'Contratar coletores',icon:'worker',group:'cl',minStage:2,max:136,base:420,factor:1.9,initial:1},
  scanning:{field:'logisticsProductivity',title:'Coletores WMS',icon:'scanner',group:'cl',minStage:2,max:8,base:380,factor:1.9},
  warehouse:{field:'warehouseExpansion',title:'Ampliar CL',icon:'warehouse',group:'cl',minStage:3,max:10,base:850,factor:2.05},
  chairs:{field:'officeChairs',title:'Cadeiras ergonômicas',icon:'chair',group:'office',minStage:4,max:6,base:700,factor:1.9},
  computers:{field:'officeComputers',title:'Computadores',icon:'computer',group:'office',minStage:4,max:11,base:900,factor:1.9},
  business:{field:'businessArea',title:'Área de negócios',icon:'briefcase',group:'office',minStage:4,max:6,base:1200,factor:1.95},
  catalog:{field:'productRange',title:'Mix de produtos',icon:'mirror',group:'shop',minStage:2,max:8,base:180,factor:1.85},
  packing:{field:'packingLevel',title:'Bancada de embalagem',icon:'parcel',group:'shop',minStage:2,max:8,base:150,factor:1.9},
  sales:{field:'salesTraining',title:'Equipe de vendas',icon:'phone',group:'office',minStage:4,max:8,base:650,factor:1.9},
  salesWorker:{field:'salesWorkers',title:'Contratar vendedores',icon:'phone',group:'office',minStage:4,max:100,base:800,factor:1.8,initial:1},
  dispatch:{field:'dispatchLevel',title:'Expedição',icon:'truck',group:'office',minStage:4,max:8,base:900,factor:1.9},
  itWorker:{field:'itWorkers',title:'Contratar desenvolvedores',icon:'worker',group:'it',minStage:6,max:80,base:6500,factor:2,initial:1},
  itComputer:{field:'itComputers',title:'Estações de TI',icon:'computer',group:'it',minStage:6,max:12,base:8500,factor:2},
  ecommerce:{field:'ecommerce',title:'Loja online',icon:'online',group:'it',minStage:6,max:6,base:12000,factor:2.05},
  server:{field:'servers',title:'Servidores',icon:'server',group:'it',minStage:6,max:6,base:15000,factor:2.1},
  marketing:{field:'onlineMarketing',title:'Marketing digital',icon:'chart',group:'it',minStage:6,max:6,base:10000,factor:2},
  academy:{field:'trainingLevel',title:'Centro de educação',icon:'education',group:'enterprise',minStage:8,max:4,base:180000,factor:2.1},
  curriculum:{field:'curriculum',title:'Formação especializada',icon:'education',group:'enterprise',minStage:8,max:6,base:230000,factor:2.2},
  wms:{field:'wmsLevel',title:'Gestão WMS',icon:'scanner',group:'cl',minStage:3,max:6,base:1200,factor:4.1},
  quality:{field:'qualityControl',title:'Controle de qualidade',icon:'shield',group:'enterprise',minStage:14,max:5,base:750000000,factor:2.1},
  production:{field:'productionLines',title:'Linha de fabricação',icon:'factory',group:'enterprise',minStage:14,max:3,base:1200000000,factor:2.2,initial:1},
  factoryWorker:{field:'factoryWorkers',title:'Contratar operadores',icon:'factory',group:'enterprise',minStage:14,max:40,base:65000000,factor:1.22,initial:1},
  branches:{field:'branches',title:'Rede de filiais',icon:'branch',group:'enterprise',minStage:7,max:5,base:80000,factor:2.05},
  fleet:{field:'fleetContracts',title:'Contratos de frotas',icon:'car',group:'enterprise',minStage:8,max:5,base:280000,factor:2.05},
  distribution:{field:'distribution',title:'Rede de distribuição',icon:'warehouse',group:'enterprise',minStage:9,max:5,base:1000000,factor:2.05},
  insurance:{field:'insurance',title:'Parcerias com seguradoras',icon:'shield',group:'enterprise',minStage:10,max:5,base:4000000,factor:2.05},
  marketplace:{field:'marketplace',title:'Marketplace',icon:'online',group:'enterprise',minStage:11,max:5,base:15000000,factor:2.05},
  automation:{field:'automation',title:'Automação da operação',icon:'scanner',group:'enterprise',minStage:12,max:8,base:60000000,factor:2},
  international:{field:'international',title:'Operação internacional',icon:'globe',group:'enterprise',minStage:13,max:5,base:240000000,factor:2.05},
  manufacturing:{field:'manufacturing',title:'Produção industrial',icon:'tools',group:'enterprise',minStage:14,max:5,base:950000000,factor:2.05},
  robots:{field:'clRobots',title:'Robôs de reposição',icon:'robot',group:'cl',minStage:10,max:6,base:2500000,factor:2},
  security:{field:'cybersecurity',title:'Segurança digital',icon:'shield',group:'it',minStage:7,max:6,base:35000,factor:2.6},
  analytics:{field:'dataAnalytics',title:'Inteligência de dados',icon:'chart',group:'it',minStage:7,max:6,base:42000,factor:2.7},
  cloud:{field:'cloudPlatform',title:'Plataforma em nuvem',icon:'server',group:'it',minStage:9,max:6,base:1200000,factor:2.8},
  network:{field:'networkHub',title:'Integração de filiais',icon:'branch',group:'enterprise',minStage:7,max:6,base:90000,factor:2.8},
  air:{field:'airCargo',title:'Carga aérea',icon:'plane',group:'enterprise',minStage:15,max:5,base:2400000000,factor:2},
  maritime:{field:'seaCargo',title:'Carga marítima',icon:'ship',group:'enterprise',minStage:16,max:5,base:6500000000,factor:2},
  global:{field:'globalTrade',title:'Rotas mundiais',icon:'globe',group:'enterprise',minStage:16,max:6,base:8000000000,factor:2},
  holding:{field:'holding',title:'Expansão do grupo',icon:'briefcase',group:'enterprise',minStage:15,max:5,base:3800000000,factor:2.05}
};
export const LIMITS=Object.fromEntries(Object.entries(UPGRADES).map(([kind,u])=>[kind,u.max]));LIMITS.garage=MAX_LEVEL;
const networkFields=['networkHub','globalTrade','airCargo','seaCargo','branches','fleetContracts','distribution','insurance','marketplace','automation','international','manufacturing','holding'];
const channelFields={branches:'branches',fleet:'fleetContracts',distribution:'distribution',insurance:'insurance',marketplace:'marketplace',automation:'automation',international:'international',manufacturing:'manufacturing',holding:'holding',online:'ecommerce',air:'airCargo',maritime:'seaCargo'};
const freshState=()=>({
  wmsStationChecks:0,staffBreaks:0,networkSyncs:0,salesMeetings:0,qualityInspections:0,cash:0,totalEarned:0,customers:0,workers:1,bays:1,garageLevel:1,productivity:0,tools:0,stockRacks:0,cashiers:1,
  logisticsWorkers:0,logisticsProductivity:0,storeExpansion:0,warehouseExpansion:0,officeChairs:0,officeComputers:0,businessArea:0,salesTraining:0,dispatchLevel:0,productRange:0,packingLevel:0,
  itWorkers:0,itComputers:0,ecommerce:0,servers:0,onlineMarketing:0,salesWorkers:0,factoryWorkers:0,
  trainingLevel:0,curriculum:0,certifications:0,productionLines:0,qualityControl:0,producedGlass:0,factoryStock:0,factoryTransfers:[],wmsLevel:0,wmsAudits:0,wmsMovements:[],nextMovementId:1,
  branches:0,fleetContracts:0,distribution:0,insurance:0,marketplace:0,automation:0,international:0,manufacturing:0,holding:0,
  clRobots:0,robotMoves:0,cybersecurity:0,dataAnalytics:0,cloudPlatform:0,networkHub:0,airCargo:0,seaCargo:0,globalTrade:0,airShipments:0,seaShipments:0,digitalReleases:0,factoryProductStocks:Object.fromEntries(productKeys.filter(k=>k!=='glass').map(k=>[k,0])),
  contracts:0,completedOrders:0,onlineOrders:0,onlineEarned:0,channelEarned:{},nextOrderId:1,orders:[],stockInTransit:[],
  productStocks:Object.fromEntries(productKeys.filter(k=>k!=='glass').map(k=>[k,0])),warehouseProducts:Object.fromEntries(productKeys.filter(k=>k!=='glass').map(k=>[k,Array(WAREHOUSE_BINS).fill(0)])),frontStock:8,warehouseStocks:Array(WAREHOUSE_BINS).fill(0),
  businessMinutes:720,shiftPresent:{},teamInvoices:[],nextTeamInvoice:1,sectorEarned:{},weatherKind:'clear',weatherRemaining:0,weatherNext:100+Math.random()*170,lifetime:0,tutorialComplete:false,tutorialStep:0
});
const requirements={
  1:[['productivity',2],['tools',2],['stock',1],['customers',6]],
  2:[['worker',3],['cashier',3],['logistics',2],['productivity',4],['tools',3],['stock',2],['customers',24]],
  3:[['store',2],['warehouse',2],['logistics',3],['scanning',2],['productivity',5],['customers',60]],
  4:[['computers',3],['business',2],['sales',2],['dispatch',2],['packing',2],['completedOrders',12]],
  5:[['worker',7],['store',3],['warehouse',4],['logistics',5],['scanning',3],['computers',4],['dispatch',3],['completedOrders',30]],
  6:[['itWorker',2],['itComputer',2],['ecommerce',2],['server',1],['marketing',1],['completedOrders',55]],
  7:[['branches',2],['worker',9],['store',5],['logistics',6],['warehouse',5],['sales',4],['completedOrders',90]],
  8:[['fleet',2],['academy',2],['certifications',6],['packing',4],['dispatch',4],['productivity',8],['tools',5],['completedOrders',140]],
  9:[['distribution',2],['logistics',7],['warehouse',6],['scanning',5],['store',6],['completedOrders',210]],
  10:[['insurance',2],['business',4],['sales',6],['itWorker',4],['itComputer',4],['server',3],['completedOrders',300]],
  11:[['marketplace',2],['ecommerce',4],['marketing',4],['server',4],['packing',6],['completedOrders',420]],
  12:[['automation',3],['warehouse',7],['scanning',6],['logistics',8],['productivity',12],['completedOrders',560]],
  13:[['international',2],['branches',4],['store',8],['dispatch',7],['sales',7],['completedOrders',720]],
  15:[['holding',2],['air',2],['robots',3],['network',3],['cloud',3],['completedOrders',1200]],
  14:[['manufacturing',2],['production',2],['quality',2],['producedGlass',48],['tools',7],['stock',7],['warehouse',9],['automation',5],['completedOrders',900]]
};
const nonnegative=(value,fallback=0)=>Number.isFinite(value)?Math.max(0,value):fallback;

export class GameModel{
  constructor({storage=globalThis.localStorage}={}){this.state=freshState();this.settings={shadows:true,musicVolume:.18,musicMuted:false,performance:'auto'};this.listeners=new Set();this.paused=true;this.started=false;this.storage=storage;this.constructionSafe=true;this.footprintSafe=true;this.load();}
  normalizeTeams(){
    const s=this.state,c=levelConfig(s);s.bays=c.bays;
    s.workers=s.garageLevel===1?1:Math.max(1,Math.min(c.maxWorkers,s.workers));s.cashiers=s.garageLevel===1?1:Math.max(2,Math.min(c.maxCashiers,s.cashiers));
    s.logisticsWorkers=s.garageLevel>=2?Math.max(s.garageLevel>=3?2:1,Math.min(c.maxCollectors,s.logisticsWorkers)):0;
    s.itWorkers=s.garageLevel>=6?Math.max(1,Math.min(c.maxDevelopers,s.itWorkers)):0;
    s.salesWorkers=s.garageLevel>=4?Math.max(1,Math.min(c.maxSales,s.salesWorkers)):0;
    s.factoryWorkers=s.garageLevel>=14?Math.max(1,Math.min(c.maxFactoryWorkers,s.factoryWorkers)):0;
    s.trainingLevel=s.garageLevel>=8?Math.max(1,Math.min(4,s.trainingLevel)):0;
    s.productionLines=s.garageLevel>=14?Math.max(1,Math.min(3,s.productionLines)):0;
    s.warehouseExpansion=Math.max(c.minWarehouse,s.warehouseExpansion);
    s.clRobots=s.garageLevel>=10?Math.max(1,Math.min(6,s.clRobots)):0;
  }
  load(){
    try{
      const saved=JSON.parse(this.storage?.getItem(SAVE_KEY)||'{}');
      for(const field of Object.keys(this.state))if(typeof this.state[field]==='number'&&Number.isFinite(saved[field])&&saved[field]>=0)this.state[field]=saved[field];
      if(this.state.bays>1||this.state.workers>1)this.state.garageLevel=Math.max(2,this.state.garageLevel);
      const s=this.state;s.garageLevel=Math.min(MAX_LEVEL,Math.max(1,Math.floor(s.garageLevel)));
      for(const u of Object.values(UPGRADES))s[u.field]=Math.min(u.max,Math.max(0,Math.floor(s[u.field])));
      if(saved.salesWorkers===undefined&&s.garageLevel>=4)s.salesWorkers=1+s.officeComputers;
      if(saved.factoryWorkers===undefined&&s.garageLevel>=14)s.factoryWorkers=Math.max(1,s.productionLines);
      this.normalizeTeams();s.frontStock=Math.min(this.frontCapacity(),Math.floor(s.frontStock));
      s.warehouseStocks=s.warehouseStocks.map((_,i)=>Math.min(12,Math.floor(nonnegative(saved.warehouseStocks?.[i]))));
      for(const product of productKeys.filter(k=>k!=='glass')){
        s.productStocks[product]=Math.min(this.frontCapacity(),Math.floor(nonnegative(saved.productStocks?.[product],availableProducts(s).includes(product)?4:0)));
        s.warehouseProducts[product]=s.warehouseProducts[product].map((_,i)=>Math.min(12,Math.floor(nonnegative(saved.warehouseProducts?.[product]?.[i]))));
      }
      for(let i=0;i<WAREHOUSE_BINS;i++){let free=12;for(const product of productKeys){const stock=this.warehouseStock(product);stock[i]=Math.min(free,stock[i]);free-=stock[i];}}
      if(Array.isArray(saved.orders))s.orders=saved.orders.filter(o=>PRODUCTS[o.product]&&Number.isFinite(o.id)&&Number.isFinite(o.quantity)&&o.quantity>0).slice(-36).map(o=>{
        const quantity=Math.min(12,Math.max(1,Math.floor(o.quantity))),collected=Math.min(quantity,Math.floor(nonnegative(o.collected))),packed=Math.min(quantity,Math.floor(nonnegative(o.packed))),batchMultiplier=Math.max(1,Math.floor(nonnegative(o.batchMultiplier,1)));
        return {...o,quantity,collected,packed,batchMultiplier,batchSize:Math.max(quantity,Math.floor(nonnegative(o.batchSize,quantity*batchMultiplier))),value:nonnegative(o.value,this.saleValue(o.product)*quantity),phase:o.phase==='delivered'?'delivered':packed>=quantity?'packed':'queued',workerId:null,courierId:null,transportId:null,source:typeof o.source==='string'?o.source:'office',carId:null};
      });
      s.nextOrderId=Math.max(s.nextOrderId,...s.orders.map(o=>o.id+1));
      if(saved.channelEarned&&typeof saved.channelEarned==='object'&&!Array.isArray(saved.channelEarned))for(const [channel,value] of Object.entries(saved.channelEarned))if(Number.isFinite(value)&&value>=0)s.channelEarned[channel]=value;
      if(['rain','storm'].includes(saved.weatherKind))s.weatherKind=saved.weatherKind;
      if(Array.isArray(saved.stockInTransit))for(const transfer of saved.stockInTransit)if(PRODUCTS[transfer.product]&&Number.isFinite(transfer.units)&&transfer.units>0)this.replenish(transfer.product,Math.min(this.frontCapacity(),transfer.units));
      s.stockInTransit=[];
      s.factoryStock=Math.min(this.factoryCapacity(),s.factoryStock);for(const key of productKeys.filter(k=>k!=='glass'))s.factoryProductStocks[key]=Math.min(this.factoryCapacity(),Math.floor(nonnegative(saved.factoryProductStocks?.[key])));
      if(Array.isArray(saved.factoryTransfers))for(const transfer of saved.factoryTransfers)if(Number.isFinite(transfer.units)&&transfer.units>0)this.addFactoryStock(PRODUCTS[transfer.product]?transfer.product:'glass',Math.min(12,transfer.units));
      s.factoryTransfers=[];
      if(Array.isArray(saved.teamInvoices))s.teamInvoices=saved.teamInvoices.filter(i=>PRODUCTS[i.product]&&Number.isFinite(i.value)&&i.value>=0).slice(-30).map(i=>({...i,owner:null}));if(saved.sectorEarned&&typeof saved.sectorEarned==='object')for(const role of STAFF_ROLES)s.sectorEarned[role.key]=nonnegative(saved.sectorEarned[role.key]);
      if(Array.isArray(saved.wmsMovements))s.wmsMovements=saved.wmsMovements.filter(m=>PRODUCTS[m.product]&&Number.isFinite(m.units)&&m.units>0&&['receive','scan','putaway','replenish','pick','pack','ship','produce'].includes(m.kind)).slice(-40).map(m=>({...m,from:String(m.from||'').slice(0,40),to:String(m.to||'').slice(0,40),ref:String(m.ref||'').slice(0,40)}));
      s.tutorialComplete=typeof saved.tutorialComplete==='boolean'?saved.tutorialComplete:!!(s.customers||s.garageLevel>1);s.tutorialStep=Math.min(2,Math.floor(s.tutorialStep));
      const settings=JSON.parse(this.storage?.getItem(SETTINGS_KEY)||'{}');this.settings.shadows=settings.shadows!==false;this.settings.musicMuted=settings.musicMuted===true;
      if(Number.isFinite(settings.musicVolume))this.settings.musicVolume=Math.max(0,Math.min(1,settings.musicVolume));
      if(['auto','low','medium','high'].includes(settings.performance))this.settings.performance=settings.performance;
    }catch{}
  }
  save(){try{this.storage?.setItem(SAVE_KEY,JSON.stringify(this.state));}catch{}}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  emit(){this.save();for(const listener of this.listeners)listener(this.state);}
  tick(dt){if(this.paused||!this.started)return 0;this.state.lifetime+=dt;return dt;}
  sale(amount){if(!Number.isFinite(amount)||amount<0)return;this.state.cash+=amount;this.state.totalEarned+=amount;this.state.customers++;this.state.channelEarned.counter=(this.state.channelEarned.counter||0)+amount;this.attributeRevenue(amount);this.emit();}
  attributeRevenue(amount){const weights={worker:.28,cashier:.08,logistics:.22,salesWorker:.2,itWorker:.12,factoryWorker:.1},s=this.state,roles=Object.keys(weights).filter(k=>s[staffRole(k).field]>0),total=roles.reduce((n,k)=>n+weights[k],0);for(const k of roles)s.sectorEarned[k]=(s.sectorEarned[k]||0)+amount*weights[k]/total;}
  contract(amount,source='commercial'){
    if(!Number.isFinite(amount)||amount<0)return;const s=this.state;s.cash+=amount;s.totalEarned+=amount;s.contracts++;
    this.attributeRevenue(amount);s.channelEarned[source]=(s.channelEarned[source]||0)+amount;if(source==='online'){s.onlineOrders++;s.onlineEarned+=amount;}this.emit();
  }
  frontCapacity(){return (this.state.garageLevel===1?8:12)+this.state.stockRacks*4;}
  stock(product){return product==='glass'?this.state.frontStock:this.state.productStocks[product]||0;}
  setStock(product,value){if(product==='glass')this.state.frontStock=value;else this.state.productStocks[product]=value;}
  consume(product,units=1){if(this.stock(product)<units)return false;this.setStock(product,this.stock(product)-units);return true;}
  replenish(product,units){this.setStock(product,Math.min(this.frontCapacity(),this.stock(product)+units));}
  warehouseStock(product){return product==='glass'?this.state.warehouseStocks:this.state.warehouseProducts[product];}
  addressTotal(index){return productKeys.reduce((n,product)=>n+(this.warehouseStock(product)[index]||0),0);}
  warehouseTotal(product){return(product?[product]:productKeys).reduce((total,key)=>total+this.warehouseStock(key).reduce((a,b)=>a+b,0),0);}
  saleValue(product){const s=this.state;return Math.round(PRODUCTS[product].price*(1+s.tools*.12+s.productRange*.1));}
  orderCapacity(){return 8+Math.min(4,Math.floor(this.state.garageLevel/4))+Math.min(3,Math.floor(this.state.servers/2));}
  trainingBonus(){const s=this.state;return 1+Math.min(.5,Math.log1p(s.certifications)*.045+s.curriculum*.025);}
  staffTotal(){return staffTotal(this.state);}
  staffCapacity(){return staffCapacity(this.state);}
  teamEfficiency(key){return staffEfficiency(this.state,key);}
  factoryStock(product='glass'){return product==='glass'?this.state.factoryStock:this.state.factoryProductStocks[product]||0;}
  factoryTotal(){return productKeys.reduce((n,key)=>n+this.factoryStock(key),0);}
  addFactoryStock(product,units){if(product==='glass')this.state.factoryStock=Math.max(0,this.state.factoryStock+units);else this.state.factoryProductStocks[product]=Math.max(0,(this.state.factoryProductStocks[product]||0)+units);}
  factoryCapacity(){return 24+this.state.productionLines*8+this.state.manufacturing*4;}
  recordMovement(kind,product,units,from,to,ref=''){
    if(!PRODUCTS[product]||!(units>0))return;
    const s=this.state;s.wmsMovements.push({id:s.nextMovementId++,kind,product,units,from,to,ref,time:Math.floor(s.lifetime)});s.wmsMovements=s.wmsMovements.slice(-40);
  }
  batchMultiplier(source){
    if(source==='counter')return 1;const s=this.state,c=levelConfig(s),network=networkFields.reduce((sum,key)=>sum+s[key],0),specialty=s[channelFields[source]]||0;
    return Math.max(1,Math.round(c.orderBatch*(source==='air'?2:source==='maritime'?6:1)*(1+Math.min(4,network*.08+specialty*.3+(source==='online'?s.ecommerce*.15:0)))));
  }
  createOrder(product,quantity,source='office',carId=null){
    if(!PRODUCTS[product]||!Number.isFinite(quantity)||quantity<1||this.state.orders.filter(o=>o.phase!=='delivered').length>=this.orderCapacity())return null;
    const localQuantity=Math.min(12,Math.max(1,Math.floor(quantity))),batchMultiplier=this.batchMultiplier(source),batchSize=localQuantity*batchMultiplier;
    const order={id:this.state.nextOrderId++,product,quantity:localQuantity,batchSize,batchMultiplier,source,carId,phase:'queued',collected:0,packed:0,value:Math.round(this.saleValue(product)*batchSize*(source==='meeting'?1.2:source==='counter'?1:1.1)),workerId:null,courierId:null,transportId:null};
    this.state.orders.push(order);this.state.orders=this.state.orders.filter(o=>o.phase!=='delivered').concat(this.state.orders.filter(o=>o.phase==='delivered').slice(-8));this.emit();return order;
  }
  completeOrder(order,paidAtCounter=false){if(order.phase==='delivered')return;order.phase='delivered';this.state.completedOrders++;this.recordMovement('ship',order.product,order.quantity,'Expedição',paidAtCounter?'Cliente':order.source==='air'?'Aeroporto':order.source==='maritime'?'Porto mundial':'Entrega','#'+order.id);if(!paidAtCounter)this.contract(order.value,order.source);else this.emit();}
  value(kind){return ['customers','completedOrders','certifications','producedGlass'].includes(kind)?this.state[kind]:this.state[UPGRADES[kind]?.field]??0;}
  expansionRequirements(){const metrics={customers:'Clientes atendidos',completedOrders:'Encomendas entregues',certifications:'Funcionários formados',producedGlass:'Vidros fabricados'};return(requirements[this.state.garageLevel]||[]).map(([kind,target])=>({kind,target,current:this.value(kind),title:metrics[kind]||UPGRADES[kind].title,complete:this.value(kind)>=target}));}
  expansionReady(){return this.state.garageLevel<MAX_LEVEL&&this.expansionRequirements().every(r=>r.complete);}
  hiringCount(kind,quantity=1){return staffRole(kind)?Math.max(0,Math.min(this.limit(kind)-this.value(kind),Math.floor(quantity)||1)):1;}
  price(kind,quantity=1){
    if(kind==='garage')return this.state.garageLevel<MAX_LEVEL?levelConfig(this.state).cost:Infinity;
    const u=UPGRADES[kind];if(!u)return Infinity;
    if(!staffRole(kind))return Math.floor(u.base*u.factor**Math.max(0,this.value(kind)-(u.initial??0)));
    const count=this.hiringCount(kind,quantity),stageBudget=this.state.garageLevel>1?LEVELS[this.state.garageLevel-2].cost*.002:0;
    let total=0;for(let i=0;i<count;i++){const n=this.value(kind)+i,exponent=Math.max(0,n-(u.initial??0));total+=Math.floor(Math.max(u.base*u.factor**Math.min(6,exponent)*1.1**Math.max(0,exponent-6),stageBudget*(1+n/u.max*.75)));}
    return total;
  }
  limit(kind){
    const s=this.state,c=levelConfig(s),level=s.garageLevel;let cap;
    switch(kind){
      case 'garage':return MAX_LEVEL;
      case 'worker':cap=c.maxWorkers;break;case 'cashier':cap=c.maxCashiers;break;case 'logistics':cap=c.maxCollectors;break;
      case 'store':cap=c.maxStore;break;case 'warehouse':cap=c.maxWarehouse;break;case 'computers':cap=c.maxOffice;break;
      case 'itWorker':cap=c.maxDevelopers;break;case 'itComputer':cap=c.maxIT;break;
      case 'salesWorker':cap=c.maxSales;break;case 'factoryWorker':cap=c.maxFactoryWorkers;break;
      case 'productivity':cap=Math.min(15,level+2);break;
      case 'tools':cap=Math.min(8,level<=3?level+1:Math.floor(level/2)+1);break;
      case 'stock':cap=Math.min(8,level<=5?level:Math.ceil(level/2)+1);break;
      case 'scanning':cap=Math.min(8,Math.max(1,level-1));break;
      case 'packing':case 'dispatch':cap=Math.min(8,Math.max(2,Math.ceil(level/2)));break;
      case 'chairs':case 'business':cap=Math.min(6,Math.max(3,Math.ceil(level/2)));break;
      case 'sales':cap=Math.min(8,Math.max(3,level-3));break;
      case 'ecommerce':case 'server':case 'marketing':cap=Math.min(6,Math.max(2,level-4));break;
      case 'wms':cap=Math.min(6,Math.max(1,level-2));break;
      default:cap=UPGRADES[kind]?.max??0;
    }
    return Math.max(this.value(kind),Math.min(UPGRADES[kind]?.max??cap,cap));
  }
  unlocked(kind){return kind==='garage'||!!UPGRADES[kind]&&this.state.garageLevel>=UPGRADES[kind].minStage;}
  maxed(kind){return kind==='garage'?this.state.garageLevel>=MAX_LEVEL:this.value(kind)>=this.limit(kind);}
  canBuy(kind,quantity=1){const needsClearance=this.state.garageLevel>=2;return (!needsClearance||kind!=='garage'||this.footprintSafe!==false)&&(!needsClearance||!['garage','warehouse','store'].includes(kind)||this.constructionSafe!==false)&&this.unlocked(kind)&&!this.maxed(kind)&&this.state.cash>=this.price(kind,quantity)&&(kind!=='garage'||this.expansionReady());}
  buy(kind,quantity=1){
    if(!this.canBuy(kind,quantity))return false;const s=this.state;s.cash-=this.price(kind,quantity);
    if(kind==='garage'){s.garageLevel++;this.normalizeTeams();for(const product of availableProducts(s))this.replenish(product,4);}
    else s[UPGRADES[kind].field]+=this.hiringCount(kind,quantity);
    if(kind==='stock')for(const product of availableProducts(s))this.replenish(product,4);
    this.emit();return true;
  }
  setSetting(key,value){if(!['shadows','musicVolume','musicMuted','performance'].includes(key))return;if(key==='performance'&&!['auto','low','medium','high'].includes(value))return;this.settings[key]=key==='performance'?value:key==='musicVolume'?Math.max(0,Math.min(1,Number(value))):!!value;try{this.storage?.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}this.emit();}
  setShadows(enabled){this.setSetting('shadows',enabled);}
  completeTutorial(){this.state.tutorialComplete=true;this.state.tutorialStep=0;this.emit();}
  reset(){this.state=freshState();this.constructionSafe=true;this.footprintSafe=true;this.emit();}
}
