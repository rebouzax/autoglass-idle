import * as THREE from 'three';
import {material} from './LowPolyAssets.js';

export class GameEffects{
  constructor(world){
    this.group=new THREE.Group();world.add(this.group);this.particles=[];this.seen=new Set();this.clock=0;
    this.pool=new THREE.InstancedMesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:'white'}),innerWidth<680?100:180);this.pool.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.pool.frustumCulled=false;this.pool.count=0;this.group.add(this.pool);this.dummy=new THREE.Object3D();
    const count=innerWidth<680?240:520;this.drops=Array.from({length:count},()=>({x:(Math.random()-.5)*85,z:(Math.random()-.5)*85,y:Math.random()*22}));
    this.rainGeometry=new THREE.BufferGeometry();this.rainGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*6),3));this.rain=new THREE.LineSegments(this.rainGeometry,new THREE.LineBasicMaterial({color:'#a6d5e7',transparent:true,opacity:.65,depthWrite:false}));this.rain.frustumCulled=false;this.group.add(this.rain);
    this.puddles=[];for(const [x,z,s] of [[-13,2,1.6],[-15,-13,1.2],[15,7,1.1],[25,6,1.4],[-1,15,2.1]]){const puddle=new THREE.Mesh(new THREE.CircleGeometry(s,18),new THREE.MeshStandardMaterial({color:'#a3c7d6',transparent:true,opacity:0,roughness:.09,metalness:.25,depthWrite:false}));puddle.rotation.x=-Math.PI/2;puddle.scale.y=.45;puddle.position.set(x,.15,z);this.group.add(puddle);this.puddles.push(puddle);}
  }
  burst(x,z,color='#91dcaa',count=12,y=1.5){for(let i=0;i<count;i++)this.particles.push({x,y,z,vx:(Math.random()-.5)*2.5,vy:1.1+Math.random()*1.5,vz:(Math.random()-.5)*2.5,life:1.15,color});this.particles=this.particles.slice(-this.pool.instanceMatrix.count);}
  celebrate(x,z){this.burst(x,z,'#ffe180',35,2.5);}
  update(dt,sim,scene,sun,inGame,target){
    const intensity=inGame?sim.weather.intensity:0;
    material('#455d6d').roughness=.85-intensity*.53;
    sun.intensity=2.1*(1-intensity*.52)+sim.weather.flash*2;scene.fog=inGame&&intensity>.02?(scene.fog||new THREE.FogExp2('#9bbbc9',.004)):null;if(scene.fog)scene.fog.density=.0025+intensity*.002;
    scene.background.set(inGame?'#c3e8ef':'#0c3779');if(intensity)scene.background.lerp(new THREE.Color('#829ba9'),intensity*.6);this.rain.visible=intensity>.02;this.rain.material.opacity=intensity*.62;
    for(const puddle of this.puddles){puddle.visible=intensity>.02;puddle.material.opacity=intensity*.5;}
    if(this.rain.visible){const positions=this.rainGeometry.attributes.position.array,l=sim.economy.state.garageLevel,layout=sim.navigation.bounds;for(let i=0;i<this.drops.length;i++){const d=this.drops[i];d.y-=dt*(12+intensity*8);if(d.y<.4)d.y=22;const x=d.x+target.x,z=d.z+target.z,inside=x>layout.minX+.8&&x<layout.maxX-.8&&z>layout.minZ&&z<3.2;if(inside&&d.y<4)d.y=22;const n=i*6;positions[n]=x;positions[n+1]=d.y;positions[n+2]=z;positions[n+3]=x-.16;positions[n+4]=d.y-.55;positions[n+5]=z+.1;}this.rainGeometry.attributes.position.needsUpdate=true;}
    this.clock+=dt;if(dt&&this.clock>.22){this.clock=0;for(const w of sim.workers)if(w.working&&['installing','packing','unloadStock'].includes(w.phase))this.burst(w.x+.4,w.z,w.product==='glass'?'#bcf3ff':'#ffe19b',2,1.15);}
    for(const event of sim.events)if(!this.seen.has(event.id)){this.seen.add(event.id);if(event.kind==='payment'||event.kind==='delivery')this.burst(event.x,event.z,'#80db9b',15);else if(['deploy','online','graduation','production'].includes(event.kind))this.burst(event.x,event.z,'#b5afff',14,1.8);}
    if(this.seen.size>80)this.seen=new Set(sim.events.map(e=>e.id));
    this.particles=this.particles.filter(p=>p.life>0);for(let i=0;i<this.particles.length;i++){const p=this.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=dt*2.5;this.dummy.position.set(p.x,p.y,p.z);this.dummy.rotation.set(p.life*3,p.life*4,p.life*2);this.dummy.scale.setScalar(Math.min(1,p.life*3));this.dummy.updateMatrix();this.pool.setMatrixAt(i,this.dummy.matrix);this.pool.setColorAt(i,new THREE.Color(p.color));}this.pool.count=this.particles.length;this.pool.instanceMatrix.needsUpdate=true;if(this.pool.instanceColor)this.pool.instanceColor.needsUpdate=true;
  }
}
