import { GarageModel } from '../models/GarageModel.js';
import {UPGRADES} from '../models/GameModel.js';
import {MusicPlayer} from '../services/MusicPlayer.js';

export class GameViewModel {
  constructor(model,view) {
    this.model=model;this.view=view;this.simulation=new GarageModel(model);this.last=performance.now();this.savedAt=0;
    this.music=new MusicPlayer(model.settings);this.unsubscribe=model.subscribe(state=>{view.render(state);this.music.apply(model.settings);});
  }
  start(){
    this.frame=now=>{
      const dt=Math.min(.25,(now-this.last)/1000);this.last=now;
      const step=this.model.tick(document.hidden?0:dt);let remaining=step;while(remaining>0){const slice=Math.min(.04,remaining);this.simulation.tick(slice);remaining-=slice;}this.view.update(dt,this.simulation,step>0);
      this.savedAt+=step;if(this.savedAt>15){this.model.save();this.savedAt=0;}
      this.raf=requestAnimationFrame(this.frame);
    };
    this.raf=requestAnimationFrame(this.frame);
    this.saveOnExit=()=>this.model.save();window.addEventListener('pagehide',this.saveOnExit);
  }
  play(){this.model.started=true;this.model.paused=false;this.view.showGame();this.music.activate(true);if(!this.model.state.tutorialComplete)this.startTutorial();}
  startTutorial(){this.view.tutorialActive=true;this.model.paused=true;this.view.toggleUpgrades(true);this.view.selectUpgradeTab('shop');this.view.showTutorial(this.model.state.tutorialStep);this.view.render(this.model.state);}
  finishTutorial(){this.view.tutorialActive=false;this.view.q('.tutorial-backdrop').classList.add('hidden');this.model.paused=false;this.model.completeTutorial();this.view.scene.controls.setEnabled(true);this.music.activate(true);}
  action(name){
    if(name==='play')this.play();
    else if(name==='pause'&&!this.view.tutorialActive){this.model.paused=!this.model.paused;this.view.render(this.model.state);this.music.activate(!this.model.paused);}
    else if(name==='garage'||UPGRADES[name]){if(this.model.buy(name))this.view.showUpgrade(name);}
    else if(name==='home'){this.model.paused=true;this.model.save();this.view.showMenu();this.music.activate(false);}
    else if(name==='settings')this.view.toggleSettings();
    else if(name==='exit')this.view.toggleExit();
    else if(name==='upgrades')this.view.toggleUpgrades();
    else if(name.startsWith('tab-'))this.view.selectUpgradeTab(name.slice(4));
    else if(name==='page-next'||name==='page-prev')this.view.pageUpgrades(name==='page-next'?1:-1);
    else if(name==='inventory')this.view.toggleInventory();
    else if(name.startsWith('inventory-'))this.view.inventoryAction(name.slice(10));
    else if(name.startsWith('focus-'))this.view.focusArea(name.slice(6));
    else if(name==='requirements')this.view.toggleRequirements();
    else if(name==='tutorial'){this.view.q('.settings-backdrop').classList.add('hidden');this.model.state.tutorialStep=0;if(!this.view.showingGame)this.play();this.startTutorial();}
    else if(name==='tutorial-skip'||name==='tutorial-done')this.finishTutorial();
    else if(name==='tutorial-next'||name==='tutorial-prev'){this.model.state.tutorialStep=Math.max(0,Math.min(5,this.model.state.tutorialStep+(name==='tutorial-next'?1:-1)));this.model.save();this.view.showTutorial(this.model.state.tutorialStep);}
    else if(['zoom-in','zoom-out','center','roof'].includes(name))this.view.cameraAction(name);
    else if(name==='reset'&&confirm('Apagar o progresso e começar de novo?')){
      this.music.activate(false);this.view.tutorialActive=false;this.model.reset();this.simulation.reset();this.model.paused=true;this.model.started=false;this.view.q('.settings-backdrop').classList.add('hidden');this.view.showMenu();
    }
  }
  dispose(){cancelAnimationFrame(this.raf);this.music.dispose();this.unsubscribe();window.removeEventListener('pagehide',this.saveOnExit);this.view.dispose();}
}
