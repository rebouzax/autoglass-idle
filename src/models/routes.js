// Round road corners, then sample by distance so vehicles keep a steady speed.
export function route(points, radius = 1.8) {
  const samples = [{ x: points[0][0], z: points[0][1] }];
  const add = (x, z) => samples.push({ x, z });
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, az] = points[i - 1], [bx, bz] = points[i], [cx, cz] = points[i + 1];
    const before = Math.hypot(bx - ax, bz - az), after = Math.hypot(cx - bx, cz - bz);
    const r = Math.min(radius, before * .4, after * .4);
    const entry = { x: bx + (ax - bx) * r / before, z: bz + (az - bz) * r / before };
    const leave = { x: bx + (cx - bx) * r / after, z: bz + (cz - bz) * r / after };
    add(entry.x, entry.z);
    for (let j = 1; j <= 10; j++) {
      const t = j / 10, s = 1 - t;
      add(s * s * entry.x + 2 * s * t * bx + t * t * leave.x, s * s * entry.z + 2 * s * t * bz + t * t * leave.z);
    }
  }
  add(...points.at(-1));
  let length = 0;
  samples[0].distance = 0;
  for (let i = 1; i < samples.length; i++) {
    length += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
    samples[i].distance = length;
  }
  return { samples, length };
}

export function sampleRoute(path, distance) {
  distance = Math.max(0, Math.min(path.length, distance));
  let i = 1;
  while (i < path.samples.length - 1 && path.samples[i].distance < distance) i++;
  const a = path.samples[i - 1], b = path.samples[i];
  const t = (distance - a.distance) / Math.max(.0001, b.distance - a.distance);
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, facing: Math.atan2(b.x - a.x, b.z - a.z) };
}

export function travel(actor, points, speed, reversing = false) {
  actor.path = route(points, actor.isCar ? 1.8 : .35);
  actor.distance = 0; actor.targetSpeed = speed; actor.speed = 0; actor.reversing = reversing;
  actor.x = points[0][0]; actor.z = points[0][1];
}

export function advance(actor, dt) {
  if (!actor.path) { actor.moving = false; return true; }
  const remaining = actor.path.length - actor.distance;
  const desired = Math.min(actor.targetSpeed, Math.sqrt(Math.max(0, remaining) * (actor.isCar ? 4 : 8)));
  const acceleration = actor.isCar ? 3 : 6;
  actor.speed += Math.max(-acceleration * dt, Math.min(acceleration * dt, desired - actor.speed));
  actor.distance = Math.min(actor.path.length, actor.distance + Math.max(.12, actor.speed) * dt);
  const position = sampleRoute(actor.path, actor.distance);
  actor.x = position.x; actor.z = position.z; actor.facing = position.facing + (actor.reversing ? Math.PI : 0);
  actor.moving = actor.distance < actor.path.length;
  actor.walk = (actor.walk || 0) + actor.speed * dt * 5.5;
  if (!actor.moving) { actor.path = null; actor.speed = 0; return true; }
  return false;
}
