const STEP=.4;
export const PERSON_RADIUS=.56;
export const actorRadius=()=>PERSON_RADIUS;
export const rectangle=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
export function touchesRectangle(x,z,r,o){const cx=Math.max(o.minX,Math.min(o.maxX,x)),cz=Math.max(o.minZ,Math.min(o.maxZ,z));return Math.hypot(x-cx,z-cz)<r-.005;}
export class NavigationSystem {
  constructor(){this.bounds={minX:-5.8,maxX:16.3,minZ:-5.1,maxZ:6.5};this.obstacles=[];this.revision=0;}
  configure(obstacles,bounds,invalidate=true){this.obstacles=obstacles;if(typeof bounds==='number')this.bounds.maxX=bounds;else Object.assign(this.bounds,bounds);if(invalidate)this.revision++;}
  clearPoint(x,z,r=PERSON_RADIUS){const b=this.bounds;return x>=b.minX+r&&x<=b.maxX-r&&z>=b.minZ+r&&z<=b.maxZ-r&&!this.obstacles.some(o=>touchesRectangle(x,z,r,o));}
  clearSegment(a,b,r=PERSON_RADIUS){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1));for(let i=1;i<=n;i++)if(!this.clearPoint(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,r))return false;return true;}
  path(start,goal,r=PERSON_RADIUS){
    if(!this.clearPoint(goal.x,goal.z,r))return [];if(this.clearSegment(start,goal,r))return [goal];
    const b=this.bounds,width=Math.ceil((b.maxX-b.minX)/STEP)+1,height=Math.ceil((b.maxZ-b.minZ)/STEP)+1;
    const point=i=>({x:b.minX+(i%width)*STEP,z:b.minZ+Math.floor(i/width)*STEP});
    const nearest=position=>{let best=-1,distance=Infinity;const ix=Math.round((position.x-b.minX)/STEP),iz=Math.round((position.z-b.minZ)/STEP);
      for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=ix+dx,z=iz+dz;if(x<0||z<0||x>=width||z>=height)continue;const index=z*width+x,p=point(index),d=Math.hypot(p.x-position.x,p.z-position.z);if(d<distance&&this.clearPoint(p.x,p.z,r)&&this.clearSegment(position,p,r)){best=index;distance=d;}}return best;};
    const begin=nearest(start),end=nearest(goal);if(begin<0||end<0)return [];
    const scores=new Map([[begin,0]]),parents=new Map(),open=new Set([begin]),closed=new Set();let found=false;
    while(open.size){let current=-1,best=Infinity;for(const i of open){const p=point(i),score=scores.get(i)+Math.hypot(p.x-goal.x,p.z-goal.z);if(score<best){best=score;current=i;}}
      if(current===end){found=true;break;}open.delete(current);closed.add(current);const p=point(current),cx=current%width,cz=Math.floor(current/width);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const x=cx+dx,z=cz+dz;if(x<0||z<0||x>=width||z>=height)continue;const next=z*width+x;if(closed.has(next))continue;const q=point(next);if(!this.clearPoint(q.x,q.z,r)||!this.clearSegment(p,q,r))continue;const cost=scores.get(current)+Math.hypot(q.x-p.x,q.z-p.z);if(cost<(scores.get(next)??Infinity)){scores.set(next,cost);parents.set(next,current);open.add(next);}}
    }
    if(!found)return [];const raw=[goal];let current=end;while(current!==begin){raw.unshift(point(current));current=parents.get(current);}raw.unshift(point(begin));
    const simplified=[];let previous=start;while(raw.length){let last=0;for(let i=0;i<raw.length;i++)if(this.clearSegment(previous,raw[i],r))last=i;const next=raw[last];simplified.push(next);raw.splice(0,last+1);previous=next;}return simplified;
  }
  actorPath(actor){const fixed=this.obstacles;this.obstacles=[...fixed,...(this.crowd||[]).filter(other=>other!==actor&&(!other.goal||other.reached||other.working||other.blocked>.35)).map(other=>rectangle(other.x,other.z,actorRadius(other)*2+.05,actorRadius(other)*2+.05))];const path=this.path(actor,actor.goal,actorRadius(actor));this.obstacles=fixed;return path;}
  moveTo(actor,x,z,speed,via=[]){actor.seated=false;actor.navTargets=[...via,{x,z}];actor.goal=actor.navTargets[0];actor.route=this.actorPath(actor);actor.navRevision=this.revision;actor.moveSpeed=speed;actor.reached=false;actor.blocked=0;actor.progressTimer=0;actor.previousDistance=Infinity;}
  tick(actors,dt){
    // Every candidate is swept against furniture and all other circle colliders.
    this.crowd=actors;
    for(const actor of actors){actor.moving=false;actor.vx=0;actor.vz=0;if(!actor.goal||actor.reached)continue;
      const goalDistance=Math.hypot(actor.x-actor.goal.x,actor.z-actor.goal.z);actor.progressTimer=(actor.progressTimer||0)+dt;
      if(actor.progressTimer>1){if(actor.previousDistance-goalDistance<.12)actor.blocked=.8;actor.previousDistance=goalDistance;actor.progressTimer=0;}
      if(actor.navRevision!==this.revision||actor.blocked>.75||!actor.route?.length){actor.route=this.actorPath(actor);actor.navRevision=this.revision;actor.blocked=0;}
      if(goalDistance<.09){actor.navTargets.shift();actor.goal=actor.navTargets[0]||null;actor.previousDistance=Infinity;if(actor.goal)actor.route=this.actorPath(actor);else actor.reached=true;continue;}
      while(actor.route?.length>1&&Math.hypot(actor.x-actor.route[0].x,actor.z-actor.route[0].z)<.12)actor.route.shift();const waypoint=actor.route?.[0];if(!waypoint){actor.blocked+=dt;continue;}
      const heading=Math.atan2(waypoint.z-actor.z,waypoint.x-actor.x),distance=Math.min(actor.moveSpeed*dt,Math.hypot(waypoint.x-actor.x,waypoint.z-actor.z));let chosen=null,score=Infinity;
      for(const angle of [0,.4,-.4,.8,-.8,1.2,-1.2,1.55,-1.55]){const x=actor.x+Math.cos(heading+angle)*distance,z=actor.z+Math.sin(heading+angle)*distance;if(!this.clearSegment(actor,{x,z},actorRadius(actor)))continue;
        if(actors.some(other=>other!==actor&&Math.hypot(x-other.x,z-other.z)<actorRadius(actor)+actorRadius(other)+.025))continue;
        let penalty=Math.abs(angle)*.04;for(const other of actors)if(other!==actor){const separation=Math.hypot(x-other.x,z-other.z);if(separation<1.25)penalty+=(1.25-separation)*.04;}
        const candidate=Math.hypot(x-waypoint.x,z-waypoint.z)+penalty;if(candidate<score){score=candidate;chosen={x,z};}
      }
      if(chosen){actor.vx=(chosen.x-actor.x)/dt;actor.vz=(chosen.z-actor.z)/dt;actor.facing=Math.atan2(actor.vx,actor.vz);actor.walk=(actor.walk||0)+Math.hypot(actor.vx,actor.vz)*dt*5.5;actor.x=chosen.x;actor.z=chosen.z;actor.moving=distance>.001;actor.blocked=0;}else actor.blocked+=dt;
    }
  }
}
