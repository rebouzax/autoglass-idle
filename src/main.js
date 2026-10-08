import './styles.css';
import { GameModel } from './models/GameModel.js';
import { GameView } from './views/GameView.js';
import { GameViewModel } from './viewmodels/GameViewModel.js';

// Local previews are isolated from the player's save and removed in production builds.
const previewStage=import.meta.env.DEV?Number(new URLSearchParams(location.search).get('preview')):0;
const preview=[1,2,3].includes(previewStage);
const model=new GameModel({storage:preview?null:globalThis.localStorage});
if(preview)Object.assign(model.state,{garageLevel:previewStage,bays:previewStage===1?1:4,workers:previewStage===1?1:3,cashiers:previewStage===1?1:2,logisticsWorkers:previewStage===3?2:0,cash:2500,frontStock:previewStage===3?2:8,productivity:previewStage===3?2:0});
const view=new GameView(document.querySelector('#app'),model);
const viewModel=new GameViewModel(model,view);
view.setController(action=>viewModel.action(action));
viewModel.start();
if(preview)viewModel.play();
if(import.meta.hot)import.meta.hot.dispose(()=>viewModel.dispose());
