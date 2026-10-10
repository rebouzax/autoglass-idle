const turn = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

// Rounded corners are sampled by travelled distance, including a smooth tangent for steering.
export function route(points, radius = 1.8) {
  const clean = [];
  for (const point of points || []) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
    if (!clean.length || Math.hypot(point[0] - clean.at(-1)[0], point[1] - clean.at(-1)[1]) > .001) clean.push(point);
  }
  if (!clean.length) clean.push([0, 0]);
  const samples = [{ x: clean[0][0], z: clean[0][1] }];
  const add = (x, z) => { if (Math.hypot(x - samples.at(-1).x, z - samples.at(-1).z) > .001) samples.push({ x, z }); };
  for (let i = 1; i < clean.length - 1; i++) {
    const [ax, az] = clean[i - 1], [bx, bz] = clean[i], [cx, cz] = clean[i + 1];
    const before = Math.hypot(bx - ax, bz - az), after = Math.hypot(cx - bx, cz - bz);
    const r = Math.min(radius, before * .4, after * .4);
    const entry = { x: bx + (ax - bx) * r / before, z: bz + (az - bz) * r / before };
    const leave = { x: bx + (cx - bx) * r / after, z: bz + (cz - bz) * r / after };
    add(entry.x, entry.z);
    const steps = Math.max(10, Math.ceil(r * 8));
    for (let j = 1; j <= steps; j++) {
      const t = j / steps, s = 1 - t;
      add(s * s * entry.x + 2 * s * t * bx + t * t * leave.x, s * s * entry.z + 2 * s * t * bz + t * t * leave.z);
    }
  }
  add(...clean.at(-1));
  let length = 0;
  for (let i = 0; i < samples.length; i++) {
    if (i) length += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
    samples[i].distance = length;
    const previous = samples[Math.max(0, i - 1)], next = samples[Math.min(samples.length - 1, i + 1)];
    samples[i].facing = Math.atan2(next.x - previous.x, next.z - previous.z);
  }
  return { samples, length };
}

export function sampleRoute(path, distance) {
  if (!path?.samples?.length) return { x: 0, z: 0, facing: 0 };
  distance = Math.max(0, Math.min(path.length, distance));
  if (path.samples.length === 1) return { x: path.samples[0].x, z: path.samples[0].z, facing: path.samples[0].facing || 0 };
  let low = 1, high = path.samples.length - 1;
  while (low < high) { const mid = (low + high) >> 1; if (path.samples[mid].distance < distance) low = mid + 1; else high = mid; }
  const a = path.samples[low - 1], b = path.samples[low];
  const t = (distance - a.distance) / Math.max(.0001, b.distance - a.distance);
  const facingA = a.facing ?? Math.atan2(b.x - a.x, b.z - a.z), facingB = b.facing ?? facingA;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, facing: facingA + turn(facingB - facingA) * t };
}

export function travel(actor, points, speed, reversing = false) {
  const radius = actor.isCar ? Math.max(1.8, Math.min(3.8, (actor.halfLength || 1.6) * .9)) : .35;
  actor.path = route(points, radius);
  actor.distance = 0; actor.targetSpeed = speed; actor.baseSpeed = speed; actor.speed = 0; actor.reversing = reversing;
  const initial = sampleRoute(actor.path, 0);
  actor.x = initial.x; actor.z = initial.z; actor.facing = initial.facing + (reversing ? Math.PI : 0); actor.moving = false;
}

export function advance(actor, dt) {
  if (!actor.path) { actor.moving = false; return true; }
  const remaining = Math.max(0, actor.path.length - actor.distance), acceleration = actor.isCar ? 3 : 6;
  let desired = Math.min(actor.targetSpeed, Math.sqrt(remaining * (actor.isCar ? 4 : 8)));
  if (actor.isCar && remaining > .05) {
    const here = sampleRoute(actor.path, actor.distance), ahead = sampleRoute(actor.path, actor.distance + Math.max(1.2, (actor.halfLength || 1.6) * 1.1));
    const bend = Math.abs(turn(ahead.facing - here.facing));
    desired = Math.min(desired, Math.max(1.5, actor.targetSpeed / (1 + bend * 1.7)));
  }
  actor.speed = Math.max(0, (actor.speed || 0) + Math.max(-acceleration * dt, Math.min(acceleration * dt, desired - (actor.speed || 0))));
  const oldDistance = actor.distance;
  actor.distance = Math.min(actor.path.length, actor.distance + actor.speed * dt);
  if (remaining < .02) actor.distance = actor.path.length;
  const position = sampleRoute(actor.path, actor.distance);
  actor.x = position.x; actor.z = position.z; actor.facing = position.facing + (actor.reversing ? Math.PI : 0);
  const complete = actor.distance >= actor.path.length;
  actor.moving = !complete && actor.distance - oldDistance > .0001;
  actor.walk = (actor.walk || 0) + Math.max(0, actor.distance - oldDistance) * 5.5;
  if (complete) { actor.path = null; actor.speed = 0; return true; }
  return false;
}
