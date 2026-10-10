import './styles.css';
import {GameModel,UPGRADES} from './models/GameModel.js';
import {MAX_LEVEL,LEVELS,levelConfig} from './models/Progression.js';
import {availableProducts} from './models/Products.js';
import {getAddresses} from './models/ShopLayout.js';
import {GameView} from './views/GameView.js';
import {GameViewModel} from './viewmodels/GameViewModel.js';

// Development previews never read or write the player's saved progress.
const params=new URLSearchParams(location.search),previewStage=import.meta.env.DEV?Number(params.get('preview')):0,preview=Number.isInteger(previewStage)&&previewStage>=1&&previewStage<=MAX_LEVEL;
const model=new GameModel({storage:preview?null:globalThis.localStorage});
if(preview){
  const c=levelConfig(previewStage),s=model.state;
  Object.assign(s,{garageLevel:previewStage,bays:c.bays,workers:previewStage===1?1:Math.min(c.maxWorkers,Math.max(3,Math.min(8,previewStage))),cashiers:previewStage===1?1:3,logisticsWorkers:previewStage>=2?Math.min(c.maxCollectors,Math.max(1,Math.min(6,previewStage))):0,cash:Math.max(20000,(c.cost||LEVELS[MAX_LEVEL-2].cost)*2),frontStock:previewStage>=2?8:8,productivity:previewStage>=3?Math.min(10,previewStage+1):0,tools:previewStage>=2?Math.min(5,Math.floor(previewStage/2)+1):0,stockRacks:previewStage>=2?Math.min(5,previewStage):0,storeExpansion:Math.min(c.maxStore,Math.max(0,previewStage-3)),warehouseExpansion:Math.min(c.maxWarehouse,Math.max(c.minWarehouse,previewStage-3)),logisticsProductivity:previewStage>=2?Math.min(6,Math.max(1,previewStage-1)):0,officeComputers:previewStage>=4?Math.min(c.maxOffice,Math.max(2,Math.min(5,previewStage-2))):0,officeChairs:previewStage>=4?2:0,businessArea:previewStage>=4?Math.min(4,Math.max(1,previewStage-3)):0,productRange:previewStage>=2?Math.min(5,Math.floor(previewStage/2)):0,packingLevel:previewStage>=2?Math.min(5,Math.max(1,Math.floor(previewStage/2))):0,dispatchLevel:previewStage>=4?Math.min(6,Math.floor(previewStage/2)):0,salesTraining:previewStage>=4?Math.min(6,Math.max(1,previewStage-3)):0,itWorkers:previewStage>=6?Math.min(c.maxIT,Math.max(2,Math.min(4,previewStage-4))):0,itComputers:previewStage>=6?Math.min(c.maxIT,Math.max(2,previewStage-4)):0,ecommerce:previewStage>=6?Math.min(4,Math.max(1,previewStage-5)):0,servers:previewStage>=6?Math.min(4,Math.max(1,previewStage-5)):0,onlineMarketing:previewStage>=6?Math.min(4,Math.max(1,previewStage-5)):0,tutorialComplete:!params.has('tutorial')});
  for(const [kind,u] of Object.entries(UPGRADES))if(u.group==='enterprise'&&previewStage>=u.minStage)s[u.field]=Math.min(u.max,previewStage>=u.minStage+2?2:1);
  model.normalizeTeams();s.trainingLevel=previewStage>=8?Math.min(4,previewStage-6):0;s.curriculum=previewStage>=8?2:0;s.wmsLevel=previewStage>=3?Math.min(6,previewStage-2):0;s.productionLines=previewStage>=14?Math.min(3,previewStage-12):0;s.qualityControl=previewStage>=14?2:0;
  const products=availableProducts(s);
  if(previewStage>=2){for(const key of products)model.setStock(key,Math.min(model.frontCapacity(),12));for(const [index] of getAddresses(s).entries())model.warehouseStock(products[index%products.length])[index]=8;}
  if(previewStage>=4){model.createOrder('motoMirror',2);model.createOrder('glass',3,previewStage>=6?'online':'office');}
  if(['rain','storm'].includes(params.get('weather')))Object.assign(s,{weatherKind:params.get('weather'),weatherRemaining:420});
}
const view=new GameView(document.querySelector('#app'),model),viewModel=new GameViewModel(model,view);
view.setController(action=>viewModel.action(action));viewModel.start();
if(preview)viewModel.play();
if(import.meta.hot)import.meta.hot.dispose(()=>viewModel.dispose());
