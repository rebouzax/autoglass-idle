import { GarageScene } from './GarageScene.js';
import { icon } from './icons.js';

const money = value => `R$ ${Math.floor(value).toLocaleString('pt-BR')}`;
const button = (action, symbol, label) => `<button class="icon-button" data-action="${action}" aria-label="${label}" title="${label}">${icon(symbol)}</button>`;

export class GameView {
  constructor(root,model) {
    this.root=root; this.model=model; this.showingGame=false;
    root.innerHTML=`<div class="world" data-mode="menu">
      <canvas class="world-canvas" aria-label="Cidade e oficina em 3D"></canvas>
      <section class="menu-screen" aria-label="Menu principal">
        <div class="menu-content"><div class="brand-symbol" aria-hidden="true">A</div><h1>AUTOGLASS<span>Inc.</span></h1>
          <nav class="main-menu"><button class="primary-button" data-action="play">${icon('play')}Jogar</button><button data-action="settings">${icon('gear')}Configuração</button><button data-action="exit">${icon('exit')}Sair</button></nav>
        </div>
      </section>
      <section class="game-screen hidden" aria-label="Controles da oficina">
        <header class="hud-top"><div class="wallet" title="Dinheiro disponível" aria-label="Dinheiro disponível">${icon('coin')}<strong class="cash-value">R$ 0</strong><span class="sale-pop" aria-live="polite"></span></div>
          <div class="hud-tools">${button('pause','pause','Pausar')}${button('settings','gear','Configuração')}${button('home','home','Menu')}</div></header>
        <div class="hud-stats"><span class="earned-stat" title="Total arrecadado" aria-label="Total arrecadado">${icon('earned')}<b class="earned-value">R$ 0</b></span><span title="Clientes atendidos" aria-label="Clientes atendidos">${icon('person')}<b class="customers-value">0</b></span><span title="Técnicos de instalação" aria-label="Técnicos de instalação">${icon('worker')}<b class="workers-value">1</b></span><span title="Boxes de serviço" aria-label="Boxes de serviço">${icon('garage')}<b class="bays-value">1</b></span><span title="Vidros disponíveis" aria-label="Vidros disponíveis">${icon('stock')}<b class="stock-value">8</b></span><span class="cl-stat hidden" title="Vidros no centro logístico" aria-label="Vidros no centro logístico">${icon('warehouse')}<b class="warehouse-value">0</b></span></div>
        <div class="logistics-hud hidden">${icon('truck')}<span class="delivery-status"></span></div>
        <div class="camera-tools">${button('zoom-in','plus','Aproximar')}${button('zoom-out','minus','Afastar')}${button('center','center','Centralizar oficina')}${button('roof','roof','Mostrar teto')}</div>
        <aside class="business-panel"><button class="panel-toggle" data-action="upgrades" aria-expanded="true" aria-controls="upgrade-list">${icon('garage')}<b>Melhorias</b>${icon('chevron')}</button>
          <div id="upgrade-list" class="upgrade-list"><div class="upgrade-tabs hidden"><button class="is-selected" data-action="tab-shop">Loja</button><button data-action="tab-cl">CL</button></div><div class="upgrade-grid" data-upgrade-group="shop">${[['productivity','wrench','Produtividade'],['worker','worker','Contratar técnico'],['cashier','cashier','Adicionar caixa'],['garage','garage','Ampliar loja']].map(([kind,symbol,title])=>`<button class="upgrade-button" data-action="${kind}"><span class="upgrade-icon">${icon(symbol)}</span><b class="${kind}-title">${title}</b><strong class="${kind}-price"></strong><small class="${kind}-detail"></small><span class="buy-mark">${icon('plus')}</span></button>`).join('')}</div><div class="upgrade-grid hidden" data-upgrade-group="cl"><button class="upgrade-button" data-action="logistics"><span class="upgrade-icon">${icon('worker')}</span><b>Contratar no CL</b><strong class="logistics-price"></strong><small class="logistics-detail"></small><span class="buy-mark">${icon('plus')}</span></button></div></div>
        </aside>
        <div class="camera-hint">${icon('hand')}<span>Arraste para mover</span></div>
        <div class="pause-overlay hidden"><button data-action="pause">${icon('play')}Continuar</button></div>
      </section>
      <div class="touch-pad" aria-hidden="true"><i></i></div>
      <div class="settings-backdrop hidden"><section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><h2 id="settings-title">Configuração</h2>${button('settings','close','Fechar configuração')}</header><label><span>Sombras</span><input type="checkbox" data-setting="shadows" checked></label><button class="reset-button" data-action="reset">Reiniciar progresso</button></section></div>
      <div class="exit-backdrop hidden"><section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="exit-title"><header><h2 id="exit-title">Até logo!</h2>${button('exit','close','Fechar')}</header><p>Progresso salvo. Você pode fechar esta aba.</p><button class="primary-button" data-action="exit">Voltar</button></section></div>
    </div>`;
    this.scene=new GarageScene(this.q('canvas'),this.q('.touch-pad'));
    this.scene.setMode(false);
    if(matchMedia('(max-width: 680px), (max-height: 500px)').matches) this.toggleUpgrades(false);
    this.abort=new AbortController(); const options={signal:this.abort.signal};
    root.addEventListener('click',event=>{const element=event.target.closest('[data-action]');if(element&&!element.disabled)this.onAction?.(element.dataset.action);},options);
    root.addEventListener('change',event=>{if(event.target.matches('[data-setting="shadows"]'))model.setShadows(event.target.checked);},options);
    window.addEventListener('keydown',event=>{if(event.code==='Escape'&&!event.repeat){if(!this.q('.settings-backdrop').classList.contains('hidden'))this.toggleSettings();else if(this.showingGame)this.onAction?.('pause');}},options);
    this.render(model.state); this.scene.setShadows(model.settings.shadows);
  }
  q(selector){return this.root.querySelector(selector);}
  setController(controller){this.onAction=controller;}
  toggleSettings(){const overlay=this.q('.settings-backdrop');const open=overlay.classList.toggle('hidden')===false;this.scene.controls.setEnabled(this.showingGame&&!open);if(open)this.q('.settings-card .icon-button').focus();}
  toggleExit(){this.model.save();this.q('.exit-backdrop').classList.toggle('hidden');}
  toggleUpgrades(force){const collapsed=typeof force==='boolean'?!force:!this.q('.business-panel').classList.contains('is-collapsed');this.q('.business-panel').classList.toggle('is-collapsed',collapsed);this.q('.panel-toggle').setAttribute('aria-expanded',String(!collapsed));}
  selectUpgradeTab(tab){for(const group of this.root.querySelectorAll('[data-upgrade-group]'))group.classList.toggle('hidden',group.dataset.upgradeGroup!==tab);for(const button of this.root.querySelectorAll('.upgrade-tabs button'))button.classList.toggle('is-selected',button.dataset.action===`tab-${tab}`);}
  showGame(){
    this.showingGame=true;this.q('.world').dataset.mode='game';this.q('.menu-screen').classList.add('hidden');this.q('.game-screen').classList.remove('hidden');
    this.q('.settings-backdrop').classList.add('hidden');this.scene.setMode(true,this.model.state);
    this.q('[data-action="roof"]').classList.remove('is-selected');this.q('[data-action="roof"]').setAttribute('aria-pressed','false');this.render(this.model.state);
  }
  showMenu(){this.showingGame=false;this.q('.world').dataset.mode='menu';this.q('.game-screen').classList.add('hidden');this.q('.menu-screen').classList.remove('hidden');this.scene.setMode(false);}
  cameraAction(action){
    const controls=this.scene.controls;
    if(action==='zoom-in')controls.zoom(.84);
    if(action==='zoom-out')controls.zoom(1.19);
    if(action==='center')controls.center(this.model.state);
    if(action==='roof'){const visible=this.scene.toggleRoof();this.q('[data-action="roof"]').classList.toggle('is-selected',visible);this.q('[data-action="roof"]').setAttribute('aria-pressed',String(visible));}
  }
  update(dt,simulation,active){
    this.scene.update(dt,simulation,active);this.hudTimer=(this.hudTimer||0)+dt;
    if(this.hudTimer>.3){
      this.q('.delivery-status').textContent=simulation.logistics.status();this.hudTimer=0;
      if(import.meta.env.DEV&&new URLSearchParams(location.search).has('preview')){
        this.q('canvas').dataset.actors=JSON.stringify(simulation.people().map(a=>({id:a.id,phase:a.phase,x:a.x,z:a.z,goal:a.goal,route:a.route?.length,blocked:a.blocked,seated:a.seated})));
        this.q('canvas').dataset.vehicles=JSON.stringify(simulation.vehicles().map(a=>({id:a.id,phase:a.phase,x:a.x,z:a.z,speed:a.speed,facing:a.facing})));
      }
    }
  }
  render(state){
    const set=(selector,value)=>this.q(selector).textContent=value;
    if(this.previousCash!==undefined&&state.totalEarned>this.previousEarned) {
      set('.sale-pop',`+ ${money(state.totalEarned-this.previousEarned)}`);this.q('.sale-pop').classList.remove('is-visible');
      void this.q('.sale-pop').offsetWidth;this.q('.sale-pop').classList.add('is-visible');
    }
    this.previousCash=state.cash;this.previousEarned=state.totalEarned;
    set('.cash-value',money(state.cash));set('.earned-value',money(state.totalEarned));set('.customers-value',state.customers);set('.workers-value',state.workers);set('.bays-value',state.bays);set('.stock-value',state.frontStock);set('.warehouse-value',this.model.warehouseTotal());
    for(const kind of ['worker','cashier','garage','productivity','logistics']) {
      const maxed=this.model.maxed(kind);set(`.${kind}-price`,maxed?'Máximo':money(this.model.price(kind)));
      this.q(`[data-action="${kind}"]`).disabled=maxed||!this.model.unlocked(kind)||state.cash<this.model.price(kind);
      if(['worker','cashier'].includes(kind))this.q(`[data-action="${kind}"]`).classList.toggle('hidden',!this.model.unlocked(kind));
    }
    set('.garage-title',state.garageLevel===1?'Ampliar loja':state.garageLevel===2?'Construir CL':'Loja ampliada');set('.garage-detail',state.garageLevel===1?'4 boxes · 2 caixas':state.garageLevel===2?'Recebimento · estoque':'');set('.productivity-detail',`+${state.productivity*25}%`);set('.worker-detail',`${state.workers}/4 técnicos`);set('.cashier-detail',`${state.cashiers}/3 caixas`);set('.logistics-detail',`${state.logisticsWorkers}/4 funcionários`);
    for(const selector of ['.cl-stat','.logistics-hud','.upgrade-tabs'])this.q(selector).classList.toggle('hidden',state.garageLevel<3);
    if(state.garageLevel<3)this.selectUpgradeTab('shop');
    const pause=this.q('[data-action="pause"]');pause.innerHTML=icon(this.model.paused?'play':'pause');pause.setAttribute('aria-label',this.model.paused?'Continuar':'Pausar');pause.title=this.model.paused?'Continuar':'Pausar';
    this.q('.pause-overlay').classList.toggle('hidden',!this.model.paused);this.q('[data-setting="shadows"]').checked=this.model.settings.shadows;
    this.scene.setGrowth(state);
    if(this.shadows!==this.model.settings.shadows){this.shadows=this.model.settings.shadows;this.scene.setShadows(this.shadows);}
  }
  dispose(){this.abort.abort();this.scene.dispose();}
}
