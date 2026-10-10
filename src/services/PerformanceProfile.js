export const smartphone=()=>{
  const params=new URLSearchParams(location.search);
  if(import.meta.env.DEV&&params.has('preview')&&params.get('device')==='phone')return true;
  return matchMedia('(pointer:coarse)').matches&&Math.min(screen.width||innerWidth,screen.height||innerHeight)<600;
};

export class PerformanceProfile{
  constructor(){this.samples=0;this.elapsed=0;this.average=1/60;this.slowWindows=0;this.fastWindows=0;this.tier=smartphone()?'low':matchMedia('(pointer:coarse)').matches?'medium':'high';}
  setMode(mode){this.mode=mode;this.tier=mode==='auto'?(smartphone()?'low':matchMedia('(pointer:coarse)').matches?'medium':'high'):mode;this.samples=0;this.elapsed=0;this.slowWindows=0;this.fastWindows=0;}
  observe(dt){
    if(this.mode!=='auto'||dt<=0||dt>.2)return false;
    this.elapsed+=dt;this.samples++;if(this.elapsed<4)return false;
    this.average=this.elapsed/this.samples;this.samples=0;this.elapsed=0;
    this.slowWindows=this.average>1/26?this.slowWindows+1:0;this.fastWindows=this.average<1/52?this.fastWindows+1:0;
    const previous=this.tier;
    if(this.slowWindows>=2&&this.tier!=='low'){this.tier=this.tier==='high'?'medium':'low';this.slowWindows=0;}
    if(this.fastWindows>=5&&this.tier!=='high'&&!smartphone()){this.tier=this.tier==='low'?'medium':'high';this.fastWindows=0;}
    return previous!==this.tier;
  }
  get options(){return {low:{pixelRatio:1,shadowSize:512,shadows:false,fps:30,effects:.45},medium:{pixelRatio:1.3,shadowSize:1024,shadows:true,fps:45,effects:.7},high:{pixelRatio:1.7,shadowSize:2048,shadows:true,fps:60,effects:1}}[this.tier];}
}
