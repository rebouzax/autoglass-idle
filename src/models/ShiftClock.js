export class ShiftClock {
  // Compatibility for operation models: the company now operates in permanent daylight.
  // Old saves can contain a night time; it never changes availability or lighting.
  constructor(economy){this.day=true;this.hour=12;this.light=1;this.speed=1;economy.state.businessMinutes=720;}
  tick(){}
  label(){return '☀';}
}
