import {TutorialGuide,GUIDE_STEPS} from './TutorialGuide.js';
import { GarageModel } from '../models/GarageModel.js';
import {UPGRADES} from '../models/GameModel.js';
import {staffRole} from '../models/Workforce.js';
import {MusicPlayer} from '../services/MusicPlayer.js';

export class GameViewModel {
  constructor(model,view) {
    this.model=model;this.view=view;this.simulation=new GarageModel(model);this.last=performance.now();this.savedAt=0;
    this.music=new MusicPlayer(model.settings);this.unsubscribe=model.subscribe(()=>{this.dirty=true;});
  }
  start(){
    this.frame=now=>{
      const dt=Math.min(.25,(now-this.last)/1000);this.last=now;
      if(document.hidden){this.accumulator=0;this.renderElapsed=0;this.raf=requestAnimationFrame(this.frame);return;}
      const step=this.model.tick(dt);this.accumulator=step?Math.min(.1,(this.accumulator||0)+step):0;
      if(this.guide){this.guideElapsed=Math.min(.25,(this.guideElapsed||0)+dt);while(this.guideElapsed>=1/30){this.guide.tick(1/30);this.guideElapsed-=1/30;}}
      while(this.accumulator>=1/30){this.simulation.tick(1/30);this.accumulator-=1/30;}
      if(this.view.scene.performance.observe(dt))this.view.scene.applyPerformance();
      if(this.dirty){this.view.render(this.model.state);this.music.apply(this.model.settings);this.dirty=false;}this.renderElapsed=(this.renderElapsed||0)+dt;
      if(this.renderElapsed>=1/this.view.scene.performance.options.fps){if(this.guide)this.view.scene.update(this.renderElapsed,this.guide.simulation,true);else this.view.update(this.renderElapsed,this.simulation,step>0);this.renderElapsed=0;}
      this.savedAt+=step;if(this.savedAt>15){this.model.save();this.savedAt=0;}
      this.raf=requestAnimationFrame(this.frame);
    };
    this.raf=requestAnimationFrame(this.frame);
    this.saveOnExit=()=>this.model.save();window.addEventListener('pagehide',this.saveOnExit);
  }
  play(){this.model.started=true;this.model.paused=false;this.view.showGame();this.music.activate(true);if(!this.model.state.tutorialComplete)this.startTutorial();}
  startTutorial(){this.view.tutorialActive=true;this.model.paused=true;this.view.toggleUpgrades(false);for(const selector of ['.inventory-backdrop','.requirements-backdrop','.settings-backdrop'])this.view.q(selector).classList.add('hidden');this.guide=new TutorialGuide(this.view);this.view.render(this.model.state);this.guide.open(this.model.state.tutorialStep);}
  finishTutorial(){this.guide=null;this.guideElapsed=0;this.view.tutorialActive=false;this.view.root.classList.remove('is-touring');this.view.q('.tutorial-backdrop').classList.add('hidden');this.model.paused=false;this.model.completeTutorial();this.view.scene.setMode(true,this.model.state);this.view.scene.setGrowth(this.model.state);this.view.scene.controls.center(this.model.state);this.view.scene.controls.setEnabled(true);this.music.activate(true);}
  action(name){
    if(name==='tutorial-interact'){this.guide?.interact();return;}
    if(this.guide&&!['tutorial-next','tutorial-prev','tutorial-skip','tutorial-done','home'].includes(name))return;
    if(name==='play')this.play();
    else if(name==='night-speed'&&!this.simulation.clock.day){this.simulation.clock.speed=this.simulation.clock.speed===1?2:1;this.view.hudTimer=1;}
    else if(name==='night-skip'&&!this.simulation.clock.day){this.simulation.clock.dawn();this.simulation.staff.startDay(this.simulation);this.model.save();this.view.hudTimer=1;}
    else if(name==='pause'&&!this.view.tutorialActive){this.model.paused=!this.model.paused;this.view.render(this.model.state);this.music.activate(!this.model.paused);}
    else if(name==='garage'||UPGRADES[name]){const quantity=staffRole(name)?this.view.hireBatch||1:1,before=this.model.value(name);if(this.model.buy(name,quantity))this.view.showUpgrade(name,this.model.value(name)-before);}
    else if(name==='home'){if(this.guide){this.guide=null;this.view.tutorialActive=false;this.view.root.classList.remove('is-touring');this.view.q('.tutorial-backdrop').classList.add('hidden');this.view.scene.setGrowth(this.model.state);}this.model.paused=true;this.model.save();this.view.showMenu();this.music.activate(false);}
    else if(name==='settings')this.view.toggleSettings();
    else if(name==='exit')this.view.toggleExit();
    else if(name==='upgrades')this.view.toggleUpgrades();
    else if(name.startsWith('tab-'))this.view.selectUpgradeTab(name.slice(4));
    else if(name.startsWith('hire-')){this.view.hireBatch=Number(name.slice(5))||1;this.view.renderUpgrades(this.model.state);}
    else if(name==='page-next'||name==='page-prev')this.view.pageUpgrades(name==='page-next'?1:-1);
    else if(name==='inventory')this.view.toggleInventory();
    else if(name.startsWith('inventory-'))this.view.inventoryAction(name.slice(10));
    else if(name.startsWith('focus-'))this.view.focusArea(name.slice(6));
    else if(name==='requirements')this.view.toggleRequirements();
    else if(name==='tutorial'){this.view.q('.settings-backdrop').classList.add('hidden');this.model.state.tutorialStep=0;if(!this.view.showingGame)this.play();this.startTutorial();}
    else if(name==='tutorial-skip'||name==='tutorial-done')this.finishTutorial();
    else if(name==='tutorial-next'||name==='tutorial-prev'){this.model.state.tutorialStep=Math.max(0,Math.min(GUIDE_STEPS.length-1,this.model.state.tutorialStep+(name==='tutorial-next'?1:-1)));this.model.save();this.guide?.open(this.model.state.tutorialStep);}
    else if(['zoom-in','zoom-out','center','roof'].includes(name))this.view.cameraAction(name);
    else if(name==='reset'&&confirm('Apagar o progresso e começar de novo?')){
      this.music.activate(false);this.view.tutorialActive=false;this.model.reset();this.simulation.reset();this.model.paused=true;this.model.started=false;this.view.q('.settings-backdrop').classList.add('hidden');this.view.showMenu();
    }
  }
  dispose(){cancelAnimationFrame(this.raf);this.music.dispose();this.unsubscribe();window.removeEventListener('pagehide',this.saveOnExit);this.view.dispose();}
}
