export class WeatherModel{
  constructor(economy){this.economy=economy;const s=economy.state;this.kind=s.weatherKind||'clear';this.remaining=s.weatherRemaining||0;this.next=s.weatherNext||100+Math.random()*170;this.intensity=0;this.flash=0;this.lightningIn=15;}
  tick(dt){
    if(!dt)return;this.flash=Math.max(0,this.flash-dt*2);
    if(this.kind==='clear'){this.next-=dt;if(this.next<=0){this.kind=Math.random()<.45?'storm':'rain';this.remaining=360+Math.random()*180;this.lightningIn=15+Math.random()*30;}}
    else{this.remaining-=dt;this.lightningIn-=dt;if(this.kind==='storm'&&this.lightningIn<=0){this.flash=.7;this.lightningIn=18+Math.random()*35;}if(this.remaining<=0){this.kind='clear';this.remaining=0;this.next=480+Math.random()*480;}}
    this.intensity+=((this.kind==='clear'?0:1)-this.intensity)*Math.min(1,dt*.35);
    Object.assign(this.economy.state,{weatherKind:this.kind,weatherRemaining:Math.max(0,this.remaining),weatherNext:Math.max(0,this.next)});
  }
  label(){return this.kind==='clear'?'':`${this.kind==='storm'?'⛈':'🌧'} ${Math.ceil(this.remaining/60)} min`;}
  get roadSpeed(){return 1-this.intensity*.18;}
}
