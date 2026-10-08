import { GarageModel } from '../models/GarageModel.js';

export class GameViewModel {
  constructor(model,view) {
    this.model=model;this.view=view;this.simulation=new GarageModel(model);this.last=performance.now();this.savedAt=0;
    this.unsubscribe=model.subscribe(state=>view.render(state));
  }
  start(){
    this.frame=now=>{
      const dt=Math.min(.05,(now-this.last)/1000);this.last=now;
      const step=this.model.tick(dt);this.simulation.tick(step);this.view.update(dt,this.simulation,step>0);
      this.savedAt+=step;if(this.savedAt>15){this.model.save();this.savedAt=0;}
      this.raf=requestAnimationFrame(this.frame);
    };
    this.raf=requestAnimationFrame(this.frame);
    this.saveOnExit=()=>this.model.save();window.addEventListener('pagehide',this.saveOnExit);
  }
  play(){this.model.started=true;this.model.paused=false;this.view.showGame();}
  action(name){
    if(name==='play')this.play();
    else if(name==='pause'){this.model.paused=!this.model.paused;this.view.render(this.model.state);}
    else if(['worker','cashier','garage','productivity','logistics'].includes(name))this.model.buy(name);
    else if(name==='home'){this.model.paused=true;this.model.save();this.view.showMenu();}
    else if(name==='settings')this.view.toggleSettings();
    else if(name==='exit')this.view.toggleExit();
    else if(name==='upgrades')this.view.toggleUpgrades();
    else if(name==='tab-shop'||name==='tab-cl')this.view.selectUpgradeTab(name.slice(4));
    else if(['zoom-in','zoom-out','center','roof'].includes(name))this.view.cameraAction(name);
    else if(name==='reset'&&confirm('Apagar o progresso e começar de novo?')){
      this.model.reset();this.simulation.reset();this.model.paused=true;this.model.started=false;this.view.q('.settings-backdrop').classList.add('hidden');this.view.showMenu();
    }
  }
  dispose(){cancelAnimationFrame(this.raf);this.unsubscribe();window.removeEventListener('pagehide',this.saveOnExit);this.view.dispose();}
}
