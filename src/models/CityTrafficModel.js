import { cityRoads, roadExit } from './ShopLayout.js';
import { route, sampleRoute } from './routes.js';
import { touchesRectangle } from './NavigationSystem.js';

const heading = actor => Number.isFinite(actor.facing) ? actor.facing : 0;
const movementHeading = actor => heading(actor) + (actor.reversing ? Math.PI : 0);
const axes = actor => [{ x: Math.sin(heading(actor)), z: Math.cos(heading(actor)) }, { x: Math.cos(heading(actor)), z: -Math.sin(heading(actor)) }];
const projection = (actor, basis, axis) => Math.abs(basis[0].x * axis.x + basis[0].z * axis.z) * (actor.halfLength ?? 1.6)
  + Math.abs(basis[1].x * axis.x + basis[1].z * axis.z) * (actor.halfWidth ?? .94);
export function vehicleBounds(actor) {
  const s = Math.abs(Math.sin(heading(actor))), c = Math.abs(Math.cos(heading(actor))), length = actor.halfLength ?? 1.6, width = actor.halfWidth ?? .94;
  return { minX: actor.x - (s * length + c * width), maxX: actor.x + (s * length + c * width), minZ: actor.z - (c * length + s * width), maxZ: actor.z + (c * length + s * width) };
}
function overlapDepth(a, b) {
  const aa = axes(a), bb = axes(b), dx = b.x - a.x, dz = b.z - a.z;
  let depth = Infinity;
  for (const axis of [...aa, ...bb]) {
    const overlap = projection(a, aa, axis) + projection(b, bb, axis) + .04 - Math.abs(dx * axis.x + dz * axis.z);
    if (overlap <= 0) return 0;
    depth = Math.min(depth, overlap);
  }
  return depth;
}
export const vehiclesOverlap = (a, b) => overlapDepth(a, b) > 0;
export function vehicleCollisionBlocks(before, after, other) {
  const nextDepth = overlapDepth(after, other);
  if (!nextDepth) return false;
  const oldDepth = overlapDepth(before, other);
  return !oldDepth || nextDepth >= oldDepth - .0001;
}
function followingGap(a, b) {
  const facing = movementHeading(a), sx = Math.sin(facing), cz = Math.cos(facing), dx = b.x - a.x, dz = b.z - a.z;
  const angle = movementHeading(b) - facing;
  if (Math.cos(angle) < .6) return null;
  const along = dx * sx + dz * cz, lateral = Math.abs(dx * cz - dz * sx);
  if (along <= 0 || lateral > (a.halfWidth ?? .94) + (b.halfWidth ?? .94) + .1) return null;
  const otherLength = Math.abs(Math.cos(angle)) * (b.halfLength ?? 1.6) + Math.abs(Math.sin(angle)) * (b.halfWidth ?? .94);
  return along - (a.halfLength ?? 1.6) - otherLength;
}
export function followsTooClosely(a, b) {
  const gap = followingGap(a, b);
  return gap !== null && gap < .8;
}
export function vehicleSpeedLimit(actor, vehicles, requested = actor.targetSpeed ?? 3.2) {
  let speed = requested;
  for (const other of vehicles) {
    if (other === actor || other.phase === 'gone') continue;
    // Collision recovery can move out of an existing overlap; a following cap must not pin it there.
    if (overlapDepth(actor, other)) continue;
    const gap = followingGap(actor, other);
    if (gap === null || gap > 13) continue;
    const desiredGap = .95 + Math.max(0, actor.speed || 0) * .55;
    speed = Math.min(speed, Math.max(0, (other.speed || 0) + (gap - desiredGap) * 1.4));
  }
  return speed;
}
function pedestrianCollisionBlocks(before, after, vehicle, radius = .34) {
  const box = vehicleBounds(vehicle);
  if (!touchesRectangle(after.x, after.z, radius, box)) return false;
  const clearance = p => p.x >= box.minX && p.x <= box.maxX && p.z >= box.minZ && p.z <= box.maxZ
    ? -Math.min(p.x - box.minX, box.maxX - p.x, p.z - box.minZ, box.maxZ - p.z)
    : Math.hypot(p.x - Math.max(box.minX, Math.min(box.maxX, p.x)), p.z - Math.max(box.minZ, Math.min(box.maxZ, p.z)));
  return !touchesRectangle(before.x, before.z, radius, box) || clearance(after) <= clearance(before) + .00001;
}
export const green = (axis, time) => { const phase = time % 26; return axis === 'x' ? phase < 9 : phase >= 13 && phase < 22; };
export function signalSpeedLimit(actor, time, roads, requested = actor.targetSpeed ?? 3.2) {
  if (!roads) return requested;
  const facing = movementHeading(actor), sx = Math.sin(facing), cz = Math.cos(facing), axis = Math.abs(sx) > Math.abs(cz) ? 'x' : 'z';
  const lane = axis === 'x' ? actor.z : actor.x, streets = axis === 'x' ? roads.zs : roads.xs;
  if (green(axis, time) || !streets.some(street => Math.abs(lane - street) < 3.5)) return requested;
  const direction = Math.sign(axis === 'x' ? sx : cz), setback = 7 + Math.max(0, (actor.halfLength ?? 1.6) - 1.6);
  let speed = requested;
  for (const crossing of axis === 'x' ? roads.xs : roads.zs) {
    const gap = (crossing - direction * setback - actor[axis]) * direction;
    if (gap < -.02 || gap > 22) continue;
    speed = Math.min(speed, gap <= .08 ? 0 : Math.sqrt(Math.max(0, gap - .08) * 5));
  }
  return speed;
}
export function obeysSignals(before, after, time, roads = { xs: [-25, 22], zs: [10, -24, 38] }) {
  const dx = after.x - before.x, dz = after.z - before.z, axis = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z';
  if (axis === 'x' && !roads.zs.some(z => Math.abs(before.z - z) < 3.5)) return true;
  if (axis === 'z' && !roads.xs.some(x => Math.abs(before.x - x) < 3.5)) return true;
  if (green(axis, time)) return true;
  const direction = Math.sign(axis === 'x' ? dx : dz);
  if (!direction) return true;
  // Long supply trucks stop with their front clear of the crossing as well.
  const setback = 7 + Math.max(0, (before.halfLength ?? 1.6) - 1.6);
  for (const crossing of axis === 'x' ? roads.xs : roads.zs) {
    const line = crossing - direction * setback, old = (before[axis] - line) * direction, next = (after[axis] - line) * direction;
    if (old < 0 && next >= 0) return false;
  }
  return true;
}

export class CityTrafficModel {
  constructor(state) {
    this.time = 0;
    const placeholder = route([[-120, 0], [120, 0]]), colors = ['#edb859', '#74baca', '#da8170', '#e8efea', '#97b475', '#668dbb'];
    this.cars = Array.from({ length: 8 }, (_, i) => ({ id: `traffic-${i}`, color: colors[i % colors.length], path: placeholder,
      distance: Math.floor(i / 4) * placeholder.length * .5, lane: i % 4, speed: 0, targetSpeed: 3.2, glass: 1, ...sampleRoute(placeholder, 0) }));
    this.pedestrians = Array.from({ length: 8 }, (_, i) => ({ id: `pedestrian-${i}`, path: placeholder, distance: Math.floor(i / 2) * 24,
      lane: i % 2, walk: 0, moving: true, carrying: false, ...sampleRoute(placeholder, 0) }));
    this.configure(state);
  }
  configure(state) {
    const roads = cityRoads(state), span = Math.max(110, roadExit(state) + 18, -roads.zs[1] + 24, roads.xs[1] + 32), signature = JSON.stringify({ roads, span, stage:state.garageLevel });
    if (signature === this.signature) return;
    this.signature = signature; this.roads = roads; this.span = span;
    const carCount=8+4*Math.floor((state.garageLevel-1)/5),peopleCount=8+2*Math.floor((state.garageLevel-1)/2),placeholder=route([[-span,0],[span,0]]);
    while(this.cars.length<carCount){const i=this.cars.length;this.cars.push({id:`traffic-${i}`,color:['#f0b666','#8cd0cf','#6d98c9'][i%3],lane:i%4,speed:0,targetSpeed:3.2,glass:1,path:placeholder,distance:Math.floor(i/4)*placeholder.length/(carCount/4),...sampleRoute(placeholder,0)});}
    while(this.pedestrians.length<peopleCount){const i=this.pedestrians.length;this.pedestrians.push({id:`pedestrian-${i}`,lane:i%2,walk:0,moving:false,carrying:false,path:placeholder,distance:Math.floor(i/2)*placeholder.length/(peopleCount/2),...sampleRoute(placeholder,0)});}
    const front = roads.zs[0], back = roads.zs[1], left = roads.xs[0], right = roads.xs[1];
    const paths = [route([[span, front + 1.5], [-span, front + 1.5]]), route([[right - 1.5, state.garageLevel>=16?38:span], [right - 1.5, -span]]),
      route([[-span, back + 1.5], [span, back + 1.5]]), route([[left + 1.5, -span], [left + 1.5, state.garageLevel>=16?38:span]])];
    for (const [index,car] of this.cars.entries()) {
      const fraction = Math.floor(index/4)/(this.cars.length/4);
      car.path = paths[car.lane]; car.distance = fraction * car.path.length; Object.assign(car, sampleRoute(car.path, car.distance));
    }
    for (const [index,person] of this.pedestrians.entries()) {
      const fraction = Math.floor(index/2)/(this.pedestrians.length/2), z = person.lane ? back + 4.2 : front + 4.4;
      person.path = route([[-span + 2, z], [span - 2, z]]); person.distance = fraction * person.path.length;
      Object.assign(person, sampleRoute(person.path, person.distance));
    }
  }
  tick(dt, garageCars = [], roadSpeed = 1) {
    if (!(dt > 0)) return;
    this.time += dt;
    const vehicles = [...this.cars, ...garageCars];
    const ordered = [...this.cars].sort((a, b) => (b.stoppedFor || 0) - (a.stoppedFor || 0));
    for (const car of ordered) {
      let desired = signalSpeedLimit(car, this.time, this.roads, vehicleSpeedLimit(car, vehicles, 3.2 * roadSpeed));
      // Freight crossings reserve space before either vehicle enters it.
      // A car already crossing clears first; following cars wait behind the stop line.
      for(const truck of garageCars.filter(v=>String(v.id).startsWith('freight')&&v.path)){
        const carX=Math.abs(Math.sin(car.facing))>.8,truckX=Math.abs(Math.sin(truck.facing))>.8;if(carX===truckX)continue;
        const ahead=(carX?truck.x-car.x:truck.z-car.z)*Math.sign(carX?Math.sin(car.facing):Math.cos(car.facing));
        const cargoAhead=(truckX?car.x-truck.x:car.z-truck.z)*Math.sign(truckX?Math.sin(truck.facing):Math.cos(truck.facing));
        if(ahead>6&&ahead<24&&cargoAhead>-5&&cargoAhead<16)desired=Math.min(desired,Math.sqrt(Math.max(0,ahead-7)*4));
      }
      const speed = Math.max(0, car.speed + Math.max(-4.5 * dt, Math.min(2.4 * dt, desired - car.speed)));
      const nextDistance = car.distance + speed * dt, wrapping = nextDistance >= car.path.length;
      const next = sampleRoute(car.path, wrapping ? 0 : nextDistance), candidate = { ...car, ...next };
      const blocked = !wrapping && !obeysSignals(car, candidate, this.time, this.roads)
        || vehicles.some(other => other !== car && vehicleCollisionBlocks(car, candidate, other))
        || this.pedestrians.some(person => touchesRectangle(person.x, person.z, .36, vehicleBounds(candidate)));
      if (blocked) { car.speed = 0; car.moving = false; car.stoppedFor = (car.stoppedFor || 0) + dt; continue; }
      car.distance = wrapping ? 0 : nextDistance; Object.assign(car, next); car.speed = speed; car.moving = speed > .01; car.stoppedFor = 0;
    }
    for (const person of this.pedestrians) {
      if (person.yieldVehicle) {
        const truck = person.yieldVehicle, box = vehicleBounds(truck), sidewalk = person.path.samples[0].z;
        if (!garageCars.includes(truck) || truck.phase === 'gone' || sidewalk < box.minZ - .55 || sidewalk > box.maxZ + .55) {
          person.yieldVehicle = null;
        } else {
          const direction = Math.sign(person.yieldX - person.x), amount = Math.min(Math.abs(person.yieldX - person.x), 1.2 * dt);
          const next = { x: person.x + direction * amount, z: person.z };
          const blocked = vehicles.some(car => pedestrianCollisionBlocks(person, next, car))
            || this.pedestrians.some(other => other !== person && Math.hypot(next.x - other.x, next.z - other.z) < .8
              && Math.hypot(next.x - other.x, next.z - other.z) <= Math.hypot(person.x - other.x, person.z - other.z));
          person.moving = !blocked && amount > .001;
          if (person.moving) {
            person.x = next.x; person.z = next.z; person.facing = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
            person.distance = Math.max(0, Math.min(person.path.length, person.x - person.path.samples[0].x)); person.walk += amount * 5.5;
          }
          continue;
        }
      }
      const nextDistance = person.distance + dt, wrapping = nextDistance >= person.path.length, next = sampleRoute(person.path, wrapping ? 0 : nextDistance);
      let blocked = this.pedestrians.some(other => other !== person && Math.hypot(next.x - other.x, next.z - other.z) < .8)
        || vehicles.some(car => pedestrianCollisionBlocks(person, next, car));
      const stoppedVehicle = garageCars.find(car => car.phase !== 'gone' && (car.speed || 0) < .15 && pedestrianCollisionBlocks(person, next, car));
      if (stoppedVehicle) {
        const box = vehicleBounds(stoppedVehicle);
        person.yieldVehicle = stoppedVehicle; person.yieldX = person.x <= stoppedVehicle.x ? box.minX - .85 : box.maxX + .85;
        person.moving = false; continue;
      }
      if (!wrapping) for (const crossing of this.roads.xs) {
        const stop = crossing - 4.9;
        if (person.x < stop && next.x >= stop && this.time % 26 > 2.2) blocked = true;
      }
      if (blocked) { person.moving = false; continue; }
      person.distance = wrapping ? 0 : nextDistance; Object.assign(person, next); person.walk += dt * 5.5; person.moving = true;
    }
  }
}
