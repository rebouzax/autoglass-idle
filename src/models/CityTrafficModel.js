import {route,sampleRoute} from './routes.js';
import {touchesRectangle} from './NavigationSystem.js';
export function vehicleBounds(actor){const s=Math.abs(Math.sin(actor.facing)),c=Math.abs(Math.cos(actor.facing)),length=actor.halfLength??1.6,width=actor.halfWidth??.94;return {minX:actor.x-(s*length+c*width),maxX:actor.x+(s*length+c*width),minZ:actor.z-(c*length+s*width),maxZ:actor.z+(c*length+s*width)};}
export const vehiclesOverlap=(a,b)=>{const x=vehicleBounds(a),y=vehicleBounds(b);return x.minX<y.maxX&&x.maxX>y.minX&&x.minZ<y.maxZ&&x.maxZ>y.minZ;};
export function followsTooClosely(a,b){
  const sx=Math.sin(a.facing),cz=Math.cos(a.facing),dx=b.x-a.x,dz=b.z-a.z,angle=b.facing-a.facing;
  if(Math.cos(angle)<.4)return false;
  const along=dx*sx+dz*cz,lateral=Math.abs(dx*cz-dz*sx),otherLength=Math.abs(Math.cos(angle))*(b.halfLength??1.6)+Math.abs(Math.sin(angle))*(b.halfWidth??.94);
  // A queued vehicle leaves enough space for the leading vehicle's rear to turn.
  return along>0&&along<(a.halfLength??1.6)+otherLength+.9&&lateral<1.2;
}
export const green=(axis,time)=>{const phase=time%26;return axis==='x'?phase<9:phase>=13&&phase<22;};
export function obeysSignals(before,after,time){
  const dx=after.x-before.x,dz=after.z-before.z,axis=Math.abs(dx)>Math.abs(dz)?'x':'z';
  // Only city streets have traffic lights. The garage apron has a separate driveway.
  if(axis==='x'&&Math.abs(before.z-10)>3.5&&Math.abs(before.z+24)>3.5)return true;
  if(axis==='z'&&Math.abs(Math.abs(before.x)-22)>3.5)return true;
  if(green(axis,time))return true;const direction=Math.sign(axis==='x'?dx:dz);if(!direction)return true;
  for(const crossing of axis==='x'?[-22,22]:[-24,10,38]){const line=crossing-direction*7,old=(before[axis]-line)*direction,next=(after[axis]-line)*direction;if(old<0&&next>=0)return false;}
  return true;
}
export class CityTrafficModel {
  constructor(){
    this.time=0;const paths=[route([[58,11.5],[-58,11.5]]),route([[20.5,51],[20.5,-51]]),route([[-58,-22.5],[58,-22.5]]),route([[-20.5,-51],[-20.5,51]])];
    const colors=['#edb859','#74baca','#da8170','#e8efea','#97b475','#668dbb'];
    this.cars=Array.from({length:8},(_,i)=>{const path=paths[i%4],distance=Math.floor(i/4)*path.length*.5;return {id:`traffic-${i}`,color:colors[i%colors.length],path,distance,lane:i%4,speed:0,targetSpeed:3.2,...sampleRoute(path,distance),glass:1};});
    this.pedestrians=Array.from({length:8},(_,i)=>{const z=i%2? -19.8:14.4,path=route([[-55,z],[55,z]]),distance=Math.floor(i/2)*24;return {id:`pedestrian-${i}`,path,distance,lane:i%2,walk:0,moving:true,carrying:false,...sampleRoute(path,distance)};});
  }
  tick(dt,garageCars=[]){
    if(!dt)return;this.time+=dt;
    for(const car of this.cars){
      const oldDistance=car.distance,nextDistance=car.distance+3.2*dt;
      const next=nextDistance>car.path.length?sampleRoute(car.path,0):sampleRoute(car.path,nextDistance);
      // Stop before the crossing so a pedestrian has room to finish crossing.
      const blocked=!obeysSignals(car,next,this.time)||[...this.cars,...garageCars].some(other=>other!==car&&(vehiclesOverlap(next,other)||followsTooClosely({...car,...next},other)))||this.pedestrians.some(person=>touchesRectangle(person.x,person.z,1.15,vehicleBounds(next)));
      if(blocked){car.speed=0;continue;}car.distance=nextDistance%car.path.length;Object.assign(car,next);car.speed=(car.distance===oldDistance?0:3.2);
    }
    for(const person of this.pedestrians){
      const nextDistance=person.distance+.85*dt,next=sampleRoute(person.path,nextDistance%person.path.length);
      let blocked=this.pedestrians.some(other=>other!==person&&other.lane===person.lane&&Math.hypot(next.x-other.x,next.z-other.z)<.8)||[...this.cars,...garageCars].some(car=>touchesRectangle(next.x,next.z,.34,vehicleBounds(car)));
      for(const crossing of [-22,22]){const stop=crossing-4.9;if(person.x<stop&&next.x>=stop&&this.time%26>1)blocked=true;}
      if(blocked){person.moving=false;continue;}person.distance=nextDistance%person.path.length;Object.assign(person,next);person.walk+=.85*dt*5.5;person.moving=true;
    }
  }
}
