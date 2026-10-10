const STEP = .4;
const BUCKET = 3.2;
export const PERSON_RADIUS = .44;
export const actorRadius = actor => actor.radius ?? PERSON_RADIUS;
export const rectangle = (x, z, w, d) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
export function touchesRectangle(x, z, r, o) {
  const cx = Math.max(o.minX, Math.min(o.maxX, x)), cz = Math.max(o.minZ, Math.min(o.maxZ, z));
  return Math.hypot(x - cx, z - cz) < r - .005;
}
const overlaps = (x, z, r, o) => o.radius
  ? Math.hypot(x - o.x, z - o.z) < r + o.radius - .005
  : touchesRectangle(x, z, r, o);
const clearance = (x, z, o) => o.radius
  ? Math.hypot(x - o.x, z - o.z) - o.radius
  : x >= o.minX && x <= o.maxX && z >= o.minZ && z <= o.maxZ
    ? -Math.min(x - o.minX, o.maxX - x, z - o.minZ, o.maxZ - z)
    : Math.hypot(x - Math.max(o.minX, Math.min(o.maxX, x)), z - Math.max(o.minZ, Math.min(o.maxZ, z)));
const segmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dz = b.z - a.z, length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length)) : 0;
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
};

function spatialIndex(obstacles) {
  const index = new Map();
  for (const obstacle of obstacles) {
    const minX = obstacle.minX ?? obstacle.x - obstacle.radius, maxX = obstacle.maxX ?? obstacle.x + obstacle.radius;
    const minZ = obstacle.minZ ?? obstacle.z - obstacle.radius, maxZ = obstacle.maxZ ?? obstacle.z + obstacle.radius;
    for (let x = Math.floor(minX / BUCKET); x <= Math.floor(maxX / BUCKET); x++)
      for (let z = Math.floor(minZ / BUCKET); z <= Math.floor(maxZ / BUCKET); z++) {
        const key = `${x},${z}`;
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(obstacle);
      }
  }
  return index;
}
function nearby(index, x, z, r) {
  const found = new Set();
  for (let bx = Math.floor((x - r) / BUCKET); bx <= Math.floor((x + r) / BUCKET); bx++)
    for (let bz = Math.floor((z - r) / BUCKET); bz <= Math.floor((z + r) / BUCKET); bz++)
      for (const obstacle of index.get(`${bx},${bz}`) || []) found.add(obstacle);
  return found;
}
class MinHeap {
  constructor() { this.items = []; }
  push(item) { const a = this.items; a.push(item); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p].score <= item.score) break; a[i] = a[p]; i = p; } a[i] = item; }
  pop() { const a = this.items, first = a[0], last = a.pop(); if (a.length) { let i = 0; while (i * 2 + 1 < a.length) { let child = i * 2 + 1; if (child + 1 < a.length && a[child + 1].score < a[child].score) child++; if (a[child].score >= last.score) break; a[i] = a[child]; i = child; } a[i] = last; } return first; }
  get size() { return this.items.length; }
}

export class NavigationSystem {
  constructor() {
    this.bounds = { minX: -5.8, maxX: 16.3, minZ: -5.1, maxZ: 6.5 };
    this.obstacles = []; this.index = new Map(); this.revision = 0; this.doors = new Map(); this.sequence = 0;
    this.gridWalkable = new Map(); this.time = 0;
  }
  isCrossing(actor) { return !!actor.goal?.portal && this.doors.get(actor.goal.portal)?.owner === actor; }
  cancel(actor) {
    for (const door of this.doors.values()) { door.queue = door.queue.filter(a => a !== actor); if (door.owner === actor) door.owner = null; }
    actor.navTargets = []; actor.goal = null; actor.route = []; actor.yieldTargets = null; actor.waitingDoor = false;
    actor.doorHold = null; actor.portalEntry = null; actor.doorCooldown = 0; actor.approachPoint = null; actor.approachFor = null;
    actor.doorRetreat = null; actor.yieldWaitFor = null; actor.yieldWait = 0; actor.waitingTarget = false;actor.approachWait=0;
    actor.holdRetryAt = 0; actor.holdOwner = null;
  }
  gate(actor) {
    const id = actor.goal?.portal;
    if (!id) return true;
    if (!this.doors.has(id)) this.doors.set(id, { owner: null, queue: [] });
    const door = this.doors.get(id);
    actor.portalEntry ??= { x: actor.x, z: actor.z };
    if (door.owner === actor) return true;
    if (!door.queue.includes(actor)) door.queue.push(actor);
    const next = door.queue.find(a => !(a.doorCooldown > 0));
    if (!door.owner && next === actor) {
      door.owner = actor; door.queue = door.queue.filter(a => a !== actor);
      actor.doorHold = null; actor.route = this.actorPath(actor); actor.blocked = 0;
      actor.portalBestDistance = Math.hypot(actor.x - actor.goal.x, actor.z - actor.goal.z); actor.portalBlockedFor = 0;
      return true;
    }
    return false;
  }
  release(actor, id) { const door = this.doors.get(id); if (door?.owner === actor) door.owner = null; actor.portalEntry = null; actor.doorHold = null; actor.doorRetreat = null; }
  configure(obstacles, bounds, invalidate = true) {
    const signature=obstacles.map(o=>[o.minX,o.maxX,o.minZ,o.maxZ].join(',')).join(';');
    if(!invalidate&&signature===this.obstacleSignature){if(typeof bounds==='number')this.bounds.maxX=bounds;else Object.assign(this.bounds,bounds);return;}
    this.obstacleSignature=signature;
    this.obstacles = obstacles; this.index = spatialIndex(obstacles);
    this.gridWalkable.clear();
    if (typeof bounds === 'number') this.bounds.maxX = bounds; else Object.assign(this.bounds, bounds);
    if (invalidate) this.revision++;
  }
  clearPoint(x, z, r = PERSON_RADIUS, extraIndex = null) {
    const b = this.bounds;
    if (x < b.minX + r || x > b.maxX - r || z < b.minZ + r || z > b.maxZ - r) return false;
    for (const o of nearby(this.index, x, z, r)) if (overlaps(x, z, r, o)) return false;
    if (extraIndex) for (const o of nearby(extraIndex, x, z, r)) if (overlaps(x, z, r, o)) return false;
    return true;
  }
  allowedPoint(start, goal, point) {
    if (!this.roomOf) return true;
    const source = this.roomOf(start), destination = this.roomOf(goal);
    return [source, destination].some(room => {
      const b = this.roomBounds?.[room];
      return b ? point.x >= b.minX && point.x <= b.maxX && point.z >= b.minZ && point.z <= b.maxZ : this.roomOf(point) === room;
    });
  }
  clearSegment(a, b, r = PERSON_RADIUS, extraIndex = null, allowed = null) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .1));
    for (let i = 1; i <= n; i++) {
      const p = { x: a.x + (b.x - a.x) * i / n, z: a.z + (b.z - a.z) * i / n };
      if (allowed && !allowed(p) || !this.clearPoint(p.x, p.z, r, extraIndex)) return false;
    }
    return true;
  }
  escapeSegment(a, b, r, allowed = null) {
    // An actor displaced by construction can walk out of an overlap, without crossing a new wall.
    if (this.clearPoint(a.x, a.z, r)) return this.clearSegment(a, b, r, null, allowed);
    const initial = [...nearby(this.index, a.x, a.z, r)].filter(o => overlaps(a.x, a.z, r, o));
    const depth = p => Math.max(this.bounds.minX + r - p.x, p.x - this.bounds.maxX + r, this.bounds.minZ + r - p.z, p.z - this.bounds.maxZ + r, 0);
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .08));
    let previous = a;
    for (let i = 1; i <= n; i++) {
      const p = { x: a.x + (b.x - a.x) * i / n, z: a.z + (b.z - a.z) * i / n };
      if (allowed && !allowed(p)) return false;
      if (depth(p) > depth(previous) + .0001) return false;
      for (const o of nearby(this.index, p.x, p.z, r)) if (overlaps(p.x, p.z, r, o) && (!initial.includes(o) || clearance(p.x, p.z, o) < clearance(previous.x, previous.z, o) - .0001)) return false;
      previous = p;
    }
    return true;
  }
  path(start, goal, r = PERSON_RADIUS, extra = []) {
    if (!goal || !Number.isFinite(goal.x) || !Number.isFinite(goal.z)) return [];
    const extraIndex = extra.length ? spatialIndex(extra) : null;
    const allowed = p => this.allowedPoint(start, goal, p);
    const clear = (x, z) => allowed({ x, z }) && this.clearPoint(x, z, r, extraIndex);
    const segment = (a, b) => this.clearSegment(a, b, r, extraIndex, allowed);
    if (!clear(goal.x, goal.z)) return [];
    if (segment(start, goal)) return [goal];
    // A room transition searches only its two connected rooms, even in a large campus.
    const rooms = this.roomOf ? [this.roomBounds?.[this.roomOf(start)], this.roomBounds?.[this.roomOf(goal)]].filter(Boolean) : [];
    const b = rooms.length ? {
      minX: Math.max(this.bounds.minX, Math.min(...rooms.map(room => room.minX)) - STEP),
      maxX: Math.min(this.bounds.maxX, Math.max(...rooms.map(room => room.maxX)) + STEP),
      minZ: Math.max(this.bounds.minZ, Math.min(...rooms.map(room => room.minZ)) - STEP),
      maxZ: Math.min(this.bounds.maxZ, Math.max(...rooms.map(room => room.maxZ)) + STEP)
    } : this.bounds;
    const width = Math.ceil((b.maxX - b.minX) / STEP) + 1, height = Math.ceil((b.maxZ - b.minZ) / STEP) + 1;
    const point = i => ({ x: b.minX + (i % width) * STEP, z: b.minZ + Math.floor(i / width) * STEP });
    const walkable = new Map();
    const free = i => {
      if (!walkable.has(i)) {
        const p = point(i), key = `${p.x.toFixed(3)},${p.z.toFixed(3)},${r}`;
        if (!this.gridWalkable.has(key)) this.gridWalkable.set(key, this.clearPoint(p.x, p.z, r));
        walkable.set(i, this.gridWalkable.get(key) && allowed(p)
          && (!extraIndex || ![...nearby(extraIndex, p.x, p.z, r)].some(o => overlaps(p.x, p.z, r, o))));
      }
      return walkable.get(i);
    };
    const nearest = (position, escaping = false) => {
      let best = -1, distance = Infinity;
      const ix = Math.round((position.x - b.minX) / STEP), iz = Math.round((position.z - b.minZ) / STEP);
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        const x = ix + dx, z = iz + dz;
        if (x < 0 || z < 0 || x >= width || z >= height) continue;
        const index = z * width + x, p = point(index), d = Math.hypot(p.x - position.x, p.z - position.z);
        if (d < distance && free(index) && (segment(position, p) || escaping && this.escapeSegment(position, p, r, allowed))) { best = index; distance = d; }
      }
      return best;
    };
    const begin = nearest(start, true), end = nearest(goal);
    if (begin < 0 || end < 0) return [];
    const scores = new Map([[begin, 0]]), parents = new Map(), open = new MinHeap(), closed = new Set();
    let found = false;
    open.push({ index: begin, score: Math.hypot(start.x - goal.x, start.z - goal.z) });
    while (open.size) {
      const current = open.pop().index;
      if (closed.has(current)) continue;
      if (current === end) { found = true; break; }
      closed.add(current);
      const p = point(current), cx = current % width, cz = Math.floor(current / width);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const x = cx + dx, z = cz + dz;
        if (x < 0 || z < 0 || x >= width || z >= height) continue;
        const next = z * width + x;
        if (closed.has(next) || !free(next)) continue;
        const q = point(next);
        if (!segment(p, q)) continue;
        const cost = scores.get(current) + Math.hypot(q.x - p.x, q.z - p.z);
        if (cost < (scores.get(next) ?? Infinity)) {
          scores.set(next, cost); parents.set(next, current);
          open.push({ index: next, score: cost + Math.hypot(q.x - goal.x, q.z - goal.z) });
        }
      }
    }
    if (!found) return [];
    const raw = [goal]; let current = end;
    while (current !== begin) { raw.unshift(point(current)); current = parents.get(current); }
    raw.unshift(point(begin));
    const simplified = []; let previous = start;
    while (raw.length) {
      let last = 0;
      for (let i = 0; i < raw.length; i++) { if (segment(previous, raw[i])) last = i; else break; }
      const next = raw[last]; simplified.push(next); raw.splice(0, last + 1); previous = next;
    }
    return simplified;
  }
  actorPath(actor, goal = actor.goal, allowApproach = true) {
    const r = actorRadius(actor);
    // After an expansion, furniture can cover an old interaction point.
    // Walk to a nearby reachable spot in the same room instead of retrying forever.
    if(goal===actor.goal&&goal&&!goal.portal&&!this.clearPoint(goal.x,goal.z,r)){
      const room=this.roomOf?.(goal);
      let replacement=null;
      for(const distance of [.45,.75,1.05]){
        for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
          const p={x:goal.x+Math.cos(angle)*distance,z:goal.z+Math.sin(angle)*distance};
          if(this.roomOf&&this.roomOf(p)!==room||!this.clearPoint(p.x,p.z,r)||(this.crowd||[]).some(other=>other!==actor&&Math.hypot(other.x-p.x,other.z-p.z)<r+actorRadius(other)+.05))continue;
          if(this.path(actor,p,r).length){replacement=p;break;}
        }
        if(replacement)break;
      }
      if(replacement){actor.navTargets[0]=replacement;actor.goal=replacement;goal=replacement;}
    }
    const extra = (this.crowd || []).filter(other => other !== actor && (!other.goal || other.reached || other.working || other.waitingDoor || other.stallTime > 1)
      && Math.hypot(actor.x - other.x, actor.z - other.z) > r + actorRadius(other) + .04)
      .map(other => ({ x: other.x, z: other.z, radius: actorRadius(other) + .03 }));
    const path = this.path(actor, goal, r, extra);
    if (path.length) { actor.approachPoint = null; actor.approachFor = null; return path; }
    if (!allowApproach || !goal || !this.clearPoint(goal.x, goal.z, r)) return path;
    if (!extra.some(o => overlaps(goal.x, goal.z, r, o))) return [];
    if (actor.approachFor === goal && actor.approachPoint) {
      const waiting = this.path(actor, actor.approachPoint, r, extra);
      if (waiting.length) return waiting;
    }
    const room = this.roomOf?.(actor), heading = Math.atan2(actor.z - goal.z, actor.x - goal.x);
    for (const radius of [1.05, 1.45, 1.9]) for (const offset of [0, .65, -.65, 1.3, -1.3]) {
      const wait = { x: goal.x + Math.cos(heading + offset) * radius, z: goal.z + Math.sin(heading + offset) * radius };
      if (this.roomOf && this.roomOf(wait) !== room || Math.hypot(wait.x - actor.x, wait.z - actor.z) < .2) continue;
      const approach = this.path(actor, wait, r, extra);
      if (approach.length) { actor.approachPoint = wait; actor.approachFor = goal; return approach; }
    }
    return [];
  }
  yield(actor) {
    if(actor.yieldTargets&&actor.stallTime>3){actor.navTargets=actor.yieldTargets;actor.yieldTargets=null;actor.goal=actor.navTargets[0];actor.yieldCooldown=0;actor.route=[];}
    if (!actor.goal || actor.yieldTargets || actor.yieldCooldown > 0 || this.isCrossing(actor)) return false;
    const blockers = (this.crowd || []).filter(other => other !== actor && Math.hypot(actor.x - other.x, actor.z - other.z) < 1.7);
    if (blockers.some(other => other.goal && !other.reached && !other.waitingDoor && (other.order || 0) > (actor.order || 0) && !(other.stallTime > 3))) return false;
    const room = this.roomOf?.(actor), heading = Math.atan2(actor.goal.z - actor.z, actor.goal.x - actor.x);
    for (const radius of [1.1, 1.6, 2.2]) for (const offset of [Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI * .75, -Math.PI * .75]) {
      const target = { x: actor.x + Math.cos(heading + offset) * radius, z: actor.z + Math.sin(heading + offset) * radius };
      if (this.roomOf && this.roomOf(target) !== room || !this.clearPoint(target.x, target.z, actorRadius(actor))
        || (this.crowd || []).some(other => other !== actor && Math.hypot(target.x - other.x, target.z - other.z) < actorRadius(actor) + actorRadius(other) + .15)) continue;
      // A sidestep must clear the nearby person directly. A detour around that
      // same person can make both sides wait forever in front of a cabinet.
      if(!this.escapeSegment(actor,target,actorRadius(actor),p=>this.allowedPoint(actor,target,p)))continue;
      if((this.crowd||[]).some(other=>{if(other===actor)return false;const before=Math.hypot(actor.x-other.x,actor.z-other.z),radius=actorRadius(actor)+actorRadius(other)+.025;return segmentDistance(other,actor,target)<Math.min(before,radius)-.00001;}))continue;
      const route = [target];
      actor.yieldTargets = actor.navTargets; actor.navTargets = [target]; actor.goal = target; actor.route = route;
      actor.stallTime = 0; actor.yieldCooldown = 5; actor.blocked = 0;
      actor.yieldWaitFor = blockers.filter(other => other.goal && !other.reached && !other.waitingDoor)
        .sort((a, b) => (a.order || 0) - (b.order || 0))[0] || null;
      actor.yieldWait = 2.2; actor.approachPoint = null; actor.approachFor = null;
      return true;
    }
    return false;
  }
  holdingPoint(actor) {
    const owner = this.doors.get(actor.goal?.portal)?.owner;
    const outsideCrossing = p => !owner || owner === actor || !owner.portalEntry
      || segmentDistance(p, owner.portalEntry, owner.goal) > actorRadius(actor) + actorRadius(owner) + .15;
    if (actor.doorHold && this.clearPoint(actor.doorHold.x, actor.doorHold.z, actorRadius(actor))
      && outsideCrossing(actor.doorHold)
      && !(this.crowd || []).some(other => other !== actor
        && (Math.hypot(actor.doorHold.x - other.x, actor.doorHold.z - other.z) < actorRadius(actor) + actorRadius(other) + .08
          || other.doorHold && Math.hypot(actor.doorHold.x - other.doorHold.x, actor.doorHold.z - other.doorHold.z) < actorRadius(actor) + actorRadius(other) + .12))) return actor.doorHold;
    if (actor.holdRetryAt > this.time && actor.holdOwner === owner) return null;
    actor.holdOwner = owner;
    const entry = actor.portalEntry || actor, goal = actor.goal;
    const length = Math.hypot(goal.x - entry.x, goal.z - entry.z) || 1, ux = (goal.x - entry.x) / length, uz = (goal.z - entry.z) / length;
    const room = this.roomOf?.(actor), door = this.doors.get(goal.portal), slot = Math.max(0, door.queue.indexOf(actor));
    for (const distance of [1.1 + Math.min(slot, 6) * .95, 1.65, 2.5, 0, -1.1]) for (const side of [1, -1, 0, 2, -2]) {
      const target = { x: entry.x - ux * distance + uz * side * 1.05, z: entry.z - uz * distance - ux * side * 1.05 };
      if (!outsideCrossing(target) || Math.hypot(target.x - actor.x, target.z - actor.z) < .3 || this.roomOf && this.roomOf(target) !== room || !this.clearPoint(target.x, target.z, actorRadius(actor))
        || (this.crowd || []).some(other => other !== actor && (Math.hypot(target.x - other.x, target.z - other.z) < actorRadius(actor) + actorRadius(other) + .12
          || other.doorHold && Math.hypot(target.x - other.doorHold.x, target.z - other.doorHold.z) < actorRadius(actor) + actorRadius(other) + .12))) continue;
      const route = this.actorPath(actor, target, false);
      if (route.length) { actor.doorHold = target; actor.route = route; actor.holdRetryAt = 0; return target; }
    }
    actor.holdRetryAt = this.time + .35 + ((actor.order || 0) % 4) * .04;
    return null;
  }
  backOffDoor(actor) {
    const door = this.doors.get(actor.goal?.portal), entry = actor.portalEntry;
    if (!door || !entry || actor.doorRetreat) return;
    if (Math.hypot(actor.x - entry.x, actor.z - entry.z) < .25) {
      door.owner = null;
      if (!door.queue.includes(actor)) door.queue.push(actor);
      actor.doorCooldown = 2; actor.doorHold = null; actor.portalBlockedFor = 0;
      return;
    }
    const route = this.actorPath(actor, entry, false);
    if (route.length) { actor.doorRetreat = { ...entry }; actor.route = route; actor.blocked = 0; actor.retryIn = .8; }
  }
  moveTo(actor, x, z, speed, via = []) {
    this.cancel(actor); actor.seated = false; actor.navTargets = [...via, { x, z }]; actor.goal = actor.navTargets[0];
    actor.route = this.actorPath(actor); actor.navRevision = this.revision; actor.moveSpeed = speed; actor.reached = false;
    actor.blocked = 0; actor.progressTimer = 0; actor.progressX = actor.x; actor.progressZ = actor.z;
    actor.stallTime = 0; actor.retryIn = 0; actor.order = ++this.sequence;
  }
  crowdKey(actor){return `${Math.floor(actor.x/BUCKET)},${Math.floor(actor.z/BUCKET)}`;}
  indexActor(actor){
    const key=this.crowdKey(actor),old=actor.crowdBucket;
    if(old===key&&this.crowdIndex.get(key)?.has(actor))return;
    this.crowdIndex.get(old)?.delete(actor);
    if(!this.crowdIndex.has(key))this.crowdIndex.set(key,new Set());
    this.crowdIndex.get(key).add(actor);actor.crowdBucket=key;
  }
  nearbyActors(actor,r=2){
    const found=[];
    for(let x=Math.floor((actor.x-r)/BUCKET);x<=Math.floor((actor.x+r)/BUCKET);x++)
      for(let z=Math.floor((actor.z-r)/BUCKET);z<=Math.floor((actor.z+r)/BUCKET);z++)
        for(const other of this.crowdIndex.get(`${x},${z}`)||[])if(other!==actor)found.push(other);
    return found;
  }
  tick(actors, dt) {
    if (!(dt > 0)) return;
    this.time += dt;
    this.crowd = actors;
    this.crowdIndex=new Map();for(const actor of actors)this.indexActor(actor);
    for (const [id, door] of this.doors) {
      door.queue = door.queue.filter(a => actors.includes(a) && a.goal?.portal === id);
      if (door.owner && (!actors.includes(door.owner) || door.owner.goal?.portal !== id)) door.owner = null;
    }
    const ordered = [...actors].sort((a, b) => Number(this.isCrossing(b)) - Number(this.isCrossing(a)) || (a.order || 0) - (b.order || 0));
    for (const actor of ordered) {
      actor.moving = false; actor.vx = 0; actor.vz = 0;
      actor.yieldCooldown = Math.max(0, (actor.yieldCooldown || 0) - dt); actor.doorCooldown = Math.max(0, (actor.doorCooldown || 0) - dt);
      if (!actor.goal || actor.reached) continue;
      if (this.isCrossing(actor)) {
        const distance = Math.hypot(actor.x - actor.goal.x, actor.z - actor.goal.z);
        if (distance < (actor.portalBestDistance ?? Infinity) - .1) { actor.portalBestDistance = distance; actor.portalBlockedFor = 0; }
        else actor.portalBlockedFor = (actor.portalBlockedFor || 0) + dt;
      }
      // A stuck owner must physically retreat before another direction enters the doorway.
      if (this.isCrossing(actor) && (actor.portalBlockedFor > 4 || actor.stallTime > 4 && actor.blocked > .3)
        && this.doors.get(actor.goal.portal)?.queue.length) this.backOffDoor(actor);
      const crossing = this.gate(actor);
      actor.waitingDoor = !crossing;
      const holding = crossing ? null : this.holdingPoint(actor);
      if (!crossing && !holding) continue;
      actor.retryIn = Math.max(0, (actor.retryIn || 0) - dt);
      actor.progressTimer = (actor.progressTimer || 0) + dt; actor.progressX ??= actor.x; actor.progressZ ??= actor.z;
      if (actor.progressTimer > 2) {
        actor.stallTime = Math.hypot(actor.x - actor.progressX, actor.z - actor.progressZ) < .22 ? Math.max(actor.stallTime || 0, 2.6) : 0;
        actor.progressX = actor.x; actor.progressZ = actor.z; actor.progressTimer = 0;
      }
      const awaitingTarget = actor.approachFor === actor.goal && actor.approachPoint && Math.hypot(actor.x - actor.approachPoint.x, actor.z - actor.approachPoint.z) < .15;
      actor.waitingTarget = !!awaitingTarget;
      if (awaitingTarget && !holding && !actor.doorRetreat) {
        const occupied = actors.some(other => other !== actor
          && Math.hypot(other.x - actor.goal.x, other.z - actor.goal.z) < actorRadius(actor) + actorRadius(other) + .05);
        if (occupied) {
          actor.approachWait=(actor.approachWait||0)+dt;actor.blocked=0;actor.stallTime=0;
          if(actor.approachWait>4){actor.approachPoint=null;actor.approachFor=null;actor.approachWait=0;actor.retryIn=0;actor.route=this.actorPath(actor);}
          else actor.route=[];
          continue;
        }
        actor.approachWait=0;
        actor.approachPoint = null; actor.approachFor = null; actor.retryIn = 0;
      }
      if (crossing && !actor.doorRetreat && !awaitingTarget
        && (actor.stallTime > 2.5 || actor.blocked > .65)) this.yield(actor);
      const destination = actor.doorRetreat || holding || actor.goal;
      if (actor.navRevision !== this.revision || actor.retryIn === 0 && (actor.blocked > .75 || !actor.route?.length)) {
        actor.route = this.actorPath(actor, destination, !holding); actor.navRevision = this.revision; actor.blocked = 0; actor.retryIn = .8;
      }
      if (Math.hypot(actor.x - destination.x, actor.z - destination.z) < .09) {
        if (actor.doorRetreat) {
          const door = this.doors.get(actor.goal.portal); door.owner = null;
          if (!door.queue.includes(actor)) door.queue.push(actor);
          actor.doorRetreat = null; actor.doorCooldown = 2; actor.portalBlockedFor = 0;
          actor.doorHold = null; actor.route = []; actor.blocked = 0; continue;
        }
        if (holding) { actor.route = []; actor.blocked = 0; continue; }
        if (actor.yieldTargets && actor.navTargets.length === 1) {
          actor.yieldWait = Math.max(0, actor.yieldWait - dt);
          const other = actor.yieldWaitFor;
          if (other?.goal && !other.reached && actor.yieldWait > 0 && Math.hypot(other.x - actor.x, other.z - actor.z) < 2.25) {
            actor.route = []; actor.blocked = 0; actor.stallTime = 0; continue;
          }
          actor.yieldWaitFor = null;
        }
        this.release(actor, actor.goal.portal); actor.navTargets.shift();
        if (!actor.navTargets.length && actor.yieldTargets) { actor.navTargets = actor.yieldTargets; actor.yieldTargets = null; }
        actor.goal = actor.navTargets[0] || null; actor.stallTime = 0; actor.blocked = 0; actor.doorHold = null;
        if (actor.goal) actor.route = this.actorPath(actor); else actor.reached = true;
        continue;
      }
      while (actor.route?.length > 1 && Math.hypot(actor.x - actor.route[0].x, actor.z - actor.route[0].z) < .12) actor.route.shift();
      const waypoint = actor.route?.[0];
      if (!waypoint || Math.hypot(actor.x - waypoint.x, actor.z - waypoint.z) < .025) {
        actor.route = []; actor.blocked += dt; actor.stallTime = (actor.stallTime || 0) + dt; continue;
      }
      const heading = Math.atan2(waypoint.z - actor.z, waypoint.x - actor.x);
      const distance = Math.min((actor.moveSpeed || .9) * dt, Math.hypot(waypoint.x - actor.x, waypoint.z - actor.z));
      const neighbors=this.nearbyActors(actor,actorRadius(actor)+2+distance);
      let chosen = null, score = Infinity;
      for (const angle of [0, .4, -.4, .8, -.8, 1.2, -1.2, 1.55, -1.55]) {
        const x = actor.x + Math.cos(heading + angle) * distance, z = actor.z + Math.sin(heading + angle) * distance;
        if (!this.escapeSegment(actor, { x, z }, actorRadius(actor), p => this.allowedPoint(actor, destination, p))) continue;
        if (neighbors.some(other => {
          if (other === actor) return false;
          const before = Math.hypot(actor.x - other.x, actor.z - other.z), after = Math.hypot(x - other.x, z - other.z), radius = actorRadius(actor) + actorRadius(other) + .025;
          if (before < radius) return after <= before + .00001 || segmentDistance(other, actor, { x, z }) < before - .00001;
          return segmentDistance(other, actor, { x, z }) < radius;
        })) continue;
        let penalty = Math.abs(angle) * .035 + (angle < 0 ? .00005 : 0);
        for (const other of neighbors) if (other !== actor) { const separation = Math.hypot(x - other.x, z - other.z); if (separation < 1.25) penalty += (1.25 - separation) * .035; }
        const candidate = Math.hypot(x - waypoint.x, z - waypoint.z) + penalty;
        if (candidate < score) { score = candidate; chosen = { x, z }; }
      }
      if (chosen) {
        actor.vx = (chosen.x - actor.x) / dt; actor.vz = (chosen.z - actor.z) / dt;
        actor.facing = Math.atan2(actor.vx, actor.vz); actor.walk = (actor.walk || 0) + Math.hypot(actor.vx, actor.vz) * dt * 5.5;
        actor.x = chosen.x; actor.z = chosen.z; actor.moving = distance > .001; actor.blocked = 0;this.indexActor(actor);
      } else { actor.blocked += dt; actor.stallTime = (actor.stallTime || 0) + dt; }
    }
  }
}
