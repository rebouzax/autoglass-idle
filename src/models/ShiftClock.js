export class ShiftClock {
  constructor(economy){this.economy=economy;this.refresh();}
  refresh(){this.minutes=(this.economy.state.businessMinutes??480)%1440;this.hour=this.minutes/60;this.day=this.hour>=7&&this.hour<19;this.light=Math.max(.06,Math.min(1,(this.hour-6)/2,(20-this.hour)/2));}
  tick(dt){this.economy.state.businessMinutes=(this.economy.state.businessMinutes??480)+dt*2;this.refresh();}
  label(){return `${this.day?'☀':'☾'} ${String(Math.floor(this.minutes/60)).padStart(2,'0')}:${String(Math.floor(this.minutes%60)).padStart(2,'0')}`;}
}
