const soundtrack=new URL('../assets/Sunlight_on_the_Counter.mp3',import.meta.url).href;
const LOOP_SECONDS=151;

export class MusicPlayer{
  constructor(settings){this.settings=settings;this.active=false;this.abort=new AbortController();this.visibility=()=>this.updatePlayback();document.addEventListener('visibilitychange',this.visibility);}
  apply(settings){this.settings=settings;if(this.gain){const value=settings.musicMuted?0:settings.musicVolume;this.gain.gain.setTargetAtTime(value,this.context.currentTime,.08);}}
  async activate(active){
    this.active=active;
    if(active&&!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.gain=this.context.createGain();this.gain.connect(this.context.destination);this.apply(this.settings);this.loadPromise=this.load();}
    await this.updatePlayback();
  }
  async load(){
    try{
      const response=await fetch(soundtrack,{signal:this.abort.signal});if(!response.ok)throw Error('Áudio indisponível');
      const decoded=await this.context.decodeAudioData(await response.arrayBuffer());if(this.disposed)return;
      const frames=Math.min(decoded.length,Math.round(LOOP_SECONDS*decoded.sampleRate)),buffer=this.context.createBuffer(decoded.numberOfChannels,frames,decoded.sampleRate),fade=Math.round(decoded.sampleRate*.012);
      // A very short edge fade prevents a click where 02:31 wraps to 00:00.
      for(let ch=0;ch<buffer.numberOfChannels;ch++){const data=buffer.getChannelData(ch);data.set(decoded.getChannelData(ch).subarray(0,frames));for(let i=0;i<fade;i++){data[i]*=i/fade;data[frames-1-i]*=i/fade;}}
      this.source=this.context.createBufferSource();this.source.buffer=buffer;this.source.loop=true;this.source.loopStart=0;this.source.loopEnd=frames/decoded.sampleRate;this.source.connect(this.gain);this.source.start();this.apply(this.settings);await this.updatePlayback();
    }catch(error){if(error.name!=='AbortError')console.warn('Não foi possível carregar a música de gameplay.',error);}
  }
  async updatePlayback(){if(!this.context||this.disposed)return;try{if(this.active&&!document.hidden)await this.context.resume();else await this.context.suspend();}catch{}}
  dispose(){this.disposed=true;this.abort.abort();document.removeEventListener('visibilitychange',this.visibility);this.source?.stop();this.source?.disconnect();this.gain?.disconnect();this.context?.close();}
}
