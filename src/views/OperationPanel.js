import {STAFF_ROLES,activeStaff,supportStaff,staffTotal,staffCapacity} from '../models/Workforce.js';
import {icon} from './icons.js';
import {PRODUCTS,availableProducts} from '../models/Products.js';
import {getAddresses} from '../models/ShopLayout.js';
import {MAX_LEVEL} from '../models/Progression.js';
import {MILESTONES} from '../models/Milestones.js';

const number=value=>Math.floor(value||0).toLocaleString('pt-BR');
const money=value=>{const unit=value>=1e9?[1e9,' bi']:value>=1e6?[1e6,' mi']:value>=1e3?[1e3,' mil']:null;return 'R$ '+(unit?(value/unit[0]).toLocaleString('pt-BR',{maximumFractionDigits:1})+unit[1]:number(value));};
const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const channels={billing:'Faturamento de acessórios',counter:'Loja',office:'Telefone',meeting:'Reuniões',online:'Loja online',branches:'Filiais',fleet:'Frotas',distribution:'Distribuição',insurance:'Seguradoras',marketplace:'Marketplace',automation:'Automação',international:'Exportação',manufacturing:'Indústria',holding:'Grupo empresarial',air:'Carga aérea',maritime:'Carga marítima'};
const movementNames={receive:'Recebimento',scan:'Conferência',putaway:'Endereçamento',replenish:'Reposição',pick:'Separação',pack:'Embalagem',ship:'Expedição',produce:'Fabricação',transfer:'Transferência de carga'};
export function operationPanel(model,tab,page,pageSize){
 const s=model.state,orders=s.orders.filter(o=>o.phase!=='delivered'),addresses=getAddresses(s),revenue=Object.entries(s.channelEarned).filter(([,value])=>value>0);
 const metrics=[...(staffTotal(s)>50?[{area:'amenities',icon:'chair',value:number(s.staffBreaks)+' pausas concluídas',detail:'Refeitório, convivência e bem-estar · +12% por 2 min'}]:[]),...(s.garageLevel>=6?[{area:'it',icon:'code',value:number(s.digitalReleases)+' publicações',detail:number(s.networkSyncs)+' integrações de rede · site e nuvem'}]:[]),...(s.garageLevel>=8?[{area:'academy',icon:'education',value:number(s.certifications)+' formações',detail:'+'+Math.round((model.trainingBonus()-1)*100)+'% no ritmo das equipes'}]:[]),...(s.garageLevel>=14?[{area:'factory',icon:'factory',value:number(s.producedGlass)+' vidros fabricados',detail:s.productionLines+' linhas · '+model.factoryTotal()+' produtos em coleta'}]:[]),...(s.garageLevel>=10?[{area:'robots',icon:'robot',value:s.clRobots+' robôs WMS',detail:number(s.robotMoves)+' itens repostos'}]:[]),...(s.garageLevel>=15?[{area:'air',icon:'plane',value:number(s.airShipments)+' cargas aéreas',detail:'Separação, embalagem e voo'}]:[]),...(s.garageLevel>=16?[{area:'port',icon:'ship',value:number(s.seaShipments)+' cargas marítimas',detail:'Contêineres e exportação mundial'}]:[])];
 let rows=tab==='orders'?orders:tab==='wms'?addresses:tab==='movements'?[...s.wmsMovements].reverse():tab==='journey'?MILESTONES:tab==='team'?STAFF_ROLES.filter(role=>model.unlocked(role.key)||s[role.field]>0):tab==='business'?[...metrics,...revenue]:revenue;
 if(tab==='journey')pageSize=innerHeight<500?2:3;
 if(tab==='business')pageSize=innerHeight<500?1:Math.min(pageSize,3);
 const pages=tab==='stock'?Math.max(1,Math.ceil(availableProducts(s).length/pageSize)):Math.max(1,Math.ceil(rows.length/pageSize)),current=Math.max(0,Math.min(pages-1,page||0));let html='';
 const slice=rows.slice(current*pageSize,(current+1)*pageSize);
 if(tab==='stock')html=availableProducts(s).slice(current*pageSize,(current+1)*pageSize).map(key=>`<div class="inventory-row">${icon(PRODUCTS[key].icon)}<span>${PRODUCTS[key].name}</span><b>${model.stock(key)} / ${model.frontCapacity()}</b><small>CL: ${model.warehouseTotal(key)}</small></div>`).join('');
 else if(tab==='team'){
  html=`<div class="team-summary"><b>${staffTotal(s)} / ${staffCapacity(s)}</b><span>funcionários · até 500 no nível 16</span></div>`;
  html+=slice.map(role=>`<div class="team-row">${icon(role.icon)}<span><b>${role.label}</b><small>${activeStaff(s,role.key)} na operação · ${supportStaff(s,role.key)} no apoio</small></span><strong>${s[role.field]} / ${model.limit(role.key)}</strong><small class="team-effect">${number(s.shiftPresent[role.key]??0)} em atividade · ${money(s.sectorEarned[role.key]||0)} gerados pelo fluxo</small></div>`).join('');
  if(s.garageLevel>=3)html+='<button class="team-focus" data-action="focus-team">'+icon('center')+' Ver equipes</button>';
 }else if(tab==='wms'){
  html=`<div class="wms-summary"><span>${icon('scanner')}<b>${number(model.warehouseTotal())} / ${addresses.length*12}</b><small>itens endereçados</small></span><span>${icon('check')}<b>${number(s.wmsAudits)}</b><small>conferências de estoque</small></span></div><div class="wms-toolbar"><button data-action="inventory-movements">Movimentações ${icon('right')}</button><button data-action="focus-cl">${icon('center')} Ver CL</button></div>`;
  html+=slice.length?slice.map((address,index)=>{const i=current*pageSize+index,total=model.addressTotal(i),items=availableProducts(s).filter(k=>model.warehouseStock(k)[i]).map(k=>`${model.warehouseStock(k)[i]} ${PRODUCTS[k].name.toLowerCase()}`).join(' · ');return `<div class="bin-row"><b>${address.id}</b><span>${items||'Disponível'}</span><strong>${total}/12</strong><i style="--fill:${total/12*100}%"></i></div>`;}).join(''):'<p class="orders-empty">O recebimento começa na segunda etapa.</p>';
 }else if(tab==='movements'){
  html='<div class="wms-toolbar"><button data-action="inventory-wms">'+icon('left')+' Endereços</button><span>Últimas 40 movimentações</span></div>';
  html+=slice.length?slice.map(m=>`<div class="movement-row"><span>${icon(m.kind==='produce'?'factory':m.kind==='ship'?'truck':'scanner')}<b>${movementNames[m.kind]}</b><small>${safe(m.ref)}</small></span><p>${number(m.units)} ${PRODUCTS[m.product].name.toLowerCase()} · ${safe(m.from)} → ${safe(m.to)}</p></div>`).join(''):'<p class="orders-empty">As movimentações aparecem quando a equipe recebe e separa produtos.</p>';
 }else if(tab==='journey'){
  html=`<div class="journey-progress"><b>${s.garageLevel} / ${MAX_LEVEL}</b><span>${MILESTONES[s.garageLevel-1][1]}</span><i style="--fill:${s.garageLevel/MAX_LEVEL*100}%"></i></div>`;
  html+=slice.map((m,index)=>{const level=current*pageSize+index+1,status=level<s.garageLevel?'done':level===s.garageLevel?'current':'locked';return `<article class="milestone ${status}"><span class="milestone-icon">${icon(status==='done'?'check':m[0])}</span><div><b>${level}. ${m[1]}</b><p>${m[2]}</p><small>${icon('branch')} ${m[3]}</small></div></article>`;}).join('');
 }else if(tab==='business'){
  html=`<div class="company-summary"><span>${icon('branch')}<b>${MILESTONES[s.garageLevel-1][1]}</b></span><small>${s.garageLevel} / ${MAX_LEVEL} · ${s.bays} boxes · ${staffTotal(s)} funcionários</small></div>`;
  html+=slice.length?slice.map(row=>row.area?`<button class="campus-stat" data-action="focus-${row.area}">${icon(row.icon)}<span>${row.value}<small>${row.detail}</small></span>${icon('center')}</button>`:`<div class="revenue-row">${icon(row[0]==='online'?'online':row[0]==='counter'?'garage':row[0]==='air'?'plane':row[0]==='maritime'?'ship':'branch')}<span>${safe(channels[row[0]]||row[0])}</span><b>${money(row[1])}</b></div>`).join(''):'<div class="orders-empty">A primeira venda inicia seu faturamento.</div>';
 }else{
  const phases={airTransfer:'Carga a caminho do aeroporto',seaTransfer:'Carga a caminho do porto',airLoading:'Carregando avião',seaLoading:'Carregando navio',airTransit:'Voo em andamento',seaTransit:'Rota marítima',packed:'Pronta para expedição',counterReady:'Pronta para retirada',dispatching:'Carregando entrega',loaded:'Saindo para entrega'};
  html=slice.length?slice.map(o=>`<div class="order-row"><span>${icon(PRODUCTS[o.product].icon)}<b>#${o.id} · ${number(o.batchSize||o.quantity)} ${PRODUCTS[o.product].name.toLowerCase()}</b><strong>${money(o.value)}</strong></span><small>${safe(channels[o.source]||'Venda comercial')} · ${o.workerId!==null?(o.packed?'Expedição':o.collected?'Embalando':'Separando'):o.phase==='queued'?(model.stock(o.product)<o.quantity-o.collected?'Aguardando estoque':'Aguardando técnico'):phases[o.phase]||'Em entrega'}</small><div class="order-steps">${['Venda','Separação','Embalagem','Entrega'].map((name,i)=>`<i class="${i===0||i===1&&o.collected>=o.quantity||i===2&&o.packed>=o.quantity?'is-complete':''}">${name}</i>`).join('')}</div></div>`).join(''):'<div class="orders-empty">Nenhuma encomenda pendente.</div>';
 }
 return{html,pages,current};
}
