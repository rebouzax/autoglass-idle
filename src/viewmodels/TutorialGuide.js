import {GameModel} from '../models/GameModel.js';
import {GarageModel} from '../models/GarageModel.js';

export const GUIDE_STEPS=[
  {stage:1,title:'Vamos atender juntos',copy:'Sou Fernando Carreira. Acompanhe o técnico buscar e instalar o vidro. O cliente aguarda sentado e depois paga no caixa. Arraste a tela para explorar e use dois dedos para aproximar no celular.',action:'Acompanhar atendimento',focus:'shop'},
  {stage:1,title:'Sua primeira melhoria',copy:'Com o dinheiro das vendas, compre ferramentas e produtividade. Toque abaixo e veja uma ferramenta nova e o serviço mais rápido na garagem inicial.',action:'Comprar ferramenta',focus:'shop'},
  {stage:1,title:'Prepare sua expansão',copy:'No painel de melhorias, cumpra as metas de ferramentas, produtividade, estoque e atendimentos. Depois junte R$600 para ampliar. A lista mostra o que falta; o dinheiro só é gasto ao comprar.',action:'Ver metas da garagem',focus:'shop'}
];

/** Entire tour uses isolated models; purchases never touch the player's save. */
export class TutorialGuide {
  constructor(view){this.view=view;this.index=-1;this.elapsed=0;this.acted=false;}
  open(index){
    this.index=Math.max(0,Math.min(GUIDE_STEPS.length-1,index));this.elapsed=0;this.acted=false;
    const step=GUIDE_STEPS[this.index];this.economy=new GameModel({storage:null});const s=this.economy.state;
    Object.assign(s,{garageLevel:1,bays:1,cash:600,workers:1,cashiers:1,tools:0,productivity:0,stockRacks:0});
    if(this.index===2)Object.assign(s,{customers:6,productivity:2,tools:2,stockRacks:1});
    this.economy.setStock('glass',8);this.simulation=new GarageModel(this.economy);
    this.view.scene.setGrowth(s);this.view.scene.setMode(true,s);this.view.scene.roofVisible=false;this.view.scene.roof.visible=false;
    this.focus(step.focus);this.view.scene.controls.setEnabled(true);this.view.showTutorial(this.index);
    this.view.q('.tutorial-demo-status').textContent='Demonstração · seu progresso está guardado';
    this.economy.started=true;this.economy.paused=false;
  }
  focus(area){
    const controls=this.view.scene.controls;
    controls.target.set(0,0,-2);
    const aspect=this.view.scene.canvas.clientWidth/Math.max(1,this.view.scene.canvas.clientHeight);
    controls.target.x+=aspect<1?5:0;controls.target.z+=aspect<1?5:0;
    controls.height=27;
    if(aspect<1)controls.height=Math.max(controls.height,controls.height*.8/aspect);
    else{controls.target.x+=controls.height*.13;controls.target.z-=controls.height*.13;}
    controls.resize();
  }
  interact(){
    if(this.acted)return;this.acted=true;const s=this.economy.state;
    if(this.index===1){this.economy.buy('tools');this.view.scene.effects.celebrate(2,-3);this.view.scene.setGrowth(s);this.view.q('.tutorial-demo-status').textContent='Ferramenta comprada · serviço mais rápido';}
    else if(this.index===2){this.view.q('.tutorial-demo-status').textContent='Metas: 2 ferramentas · 2 produtividade · 1 estoque · 6 clientes · R$600';}
    const button=this.view.q('[data-action="tutorial-interact"]');button.disabled=true;button.textContent='Acompanhe a demonstração';
  }
  tick(dt){
    const canvas=this.view.scene.canvas,viewport=canvas.clientWidth+'x'+canvas.clientHeight;
    if(this.viewport!==viewport){this.viewport=viewport;this.focus(GUIDE_STEPS[this.index].focus);}
    const speed=2;this.elapsed+=dt;this.simulation.tick(dt*speed);
    this.view.scene.setGrowth(this.economy.state);
    if(this.index===0&&this.simulation.cars.length&&this.simulation.payments===0){const car=this.simulation.cars[0],worker=this.simulation.workers.find(w=>w.carId===car.id);this.view.q('.tutorial-demo-status').textContent=car.phase==='working'?(worker?.phase==='installing'?'Técnico instalando · '+Math.round(car.progress*100)+'%':'Técnico buscando e levando o vidro'):car.phase==='paying'?'Cliente no caixa · pagamento em andamento':car.phase==='finished'?'Serviço concluído · cliente vai ao caixa':car.phase==='waiting'?'Cliente aguardando · técnico vai buscar o vidro':'Cliente chegando à oficina';}
    if(this.index===0&&this.simulation.payments>0)this.view.q('.tutorial-demo-status').textContent='Pagamento recebido · '+this.simulation.payments+' atendimento(s)';
  }
}
