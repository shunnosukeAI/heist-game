// Line of sight and vision cones for Moonlight Gallery Heist.
// Walls and display cases block sight; smoke puffs block it too. A watcher
// sees the thief only inside range, inside the cone angle, and with a clear
// line between them.

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the segment between two points crosses any solid rectangle.
// Samples along the line; a step of 6px is far finer than any wall.
export function segmentBlocked(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    for (let j = 0; j < blockers.length; j += 1) {
      const b = blockers[j];
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return true;
    }
  }
  return false;
}

// True when the segment passes through any live smoke puff.
export function segmentSmoked(x1, y1, x2, y2, smokes) {
  for (let i = 0; i < smokes.length; i += 1) {
    const s = smokes[i];
    if (s.t <= 0) continue;
    // Distance from the smoke centre to the segment.
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) t = Math.max(0, Math.min(1, ((s.x - x1) * dx + (s.y - y1) * dy) / len2));
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (Math.hypot(s.x - px, s.y - py) < s.radius) return true;
  }
  return false;
}

// Is the thief standing inside a smoke puff? Then nobody can see them.
export function insideSmoke(x, y, smokes) {
  for (let i = 0; i < smokes.length; i += 1) {
    const s = smokes[i];
    if (s.t > 0 && Math.hypot(s.x - x, s.y - y) < s.radius) return true;
  }
  return false;
}

// Full visibility test for one watcher (a guard or a camera):
// range, cone half-angle, wall/case blocking, smoke blocking.
export function canSee(watcher, target, blockers, smokes) {
  const dx = target.x - watcher.x;
  const dy = target.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > watcher.range) return false;
  const toTarget = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(toTarget, watcher.angle)) > watcher.halfAngle) return false;
  if (insideSmoke(target.x, target.y, smokes)) return false;
  if (segmentBlocked(watcher.x, watcher.y, target.x, target.y, blockers)) return false;
  if (segmentSmoked(watcher.x, watcher.y, target.x, target.y, smokes)) return false;
  return true;
}
