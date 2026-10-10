export class ShiftClock {
  constructor(economy){this.economy=economy;this.speed=1;this.refresh();}
  refresh(){this.minutes=(this.economy.state.businessMinutes??480)%1440;this.hour=this.minutes/60;this.day=this.hour>=7&&this.hour<19;this.light=Math.max(.06,Math.min(1,(this.hour-6)/2,(20-this.hour)/2));}
  tick(dt){this.economy.state.businessMinutes=(this.economy.state.businessMinutes??480)+dt*2*(this.day?1:this.speed);this.refresh();if(this.day)this.speed=1;}
  dawn(){const m=this.economy.state.businessMinutes??480;this.economy.state.businessMinutes=Math.floor(m/1440)*1440+(this.hour>=19?1440:0)+420;this.speed=1;this.refresh();}
  label(){return `${this.day?'☀':'☾'} ${String(Math.floor(this.minutes/60)).padStart(2,'0')}:${String(Math.floor(this.minutes%60)).padStart(2,'0')}`;}
}
