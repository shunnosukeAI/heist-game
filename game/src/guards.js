// The museum guards for Moonlight Gallery Heist.
// Each guard walks a fixed waypoint loop, pauses to look around, and reacts
// to what it sees and hears: patrol, investigate a noise or a decoy coin,
// chase the thief while visible, then search the last seen spot. Once the
// Moonlight Star is taken every guard moves faster: the getaway phase.

import { canSee, angleDifference } from './vision.js';
import { range } from './random.js';

export const GUARD_RADIUS = 14;
export const GUARD_RANGE = 200;
export const GUARD_HALF_ANGLE = (75 / 2) * (Math.PI / 180);
export const PATROL_SPEED = 72;
export const CHASE_SPEED = 132;
export const ESCAPE_MULTIPLIER = 1.45;
export const CONTACT_DISTANCE = 27;

export function createGuards(routes, rng) {
  return routes.map((waypoints, index) => {
    const start = waypoints[0];
    const next = waypoints[1];
    return {
      id: index,
      x: start.x,
      y: start.y,
      angle: Math.atan2(next.y - start.y, next.x - start.x),
      waypoints,
      waypointIndex: 1,
      mode: 'patrol', // patrol | investigate | chase | look
      pauseTimer: 0,
      lookTimer: 0,
      lookDirection: 1,
      targetX: next.x,
      targetY: next.y,
      lastSeenX: 0,
      lastSeenY: 0,
      loseTimer: 0,
      seesThief: false,
      rng,
    };
  });
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 6;
}

function turnToward(guard, targetAngle, dt, rate) {
  const diff = angleDifference(targetAngle, guard.angle);
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.angle += step;
}

// A noise or a coin landing draws a patrolling guard to look at the spot.
export function alertGuards(guards, x, y, radius) {
  for (let i = 0; i < guards.length; i += 1) {
    const guard = guards[i];
    if (guard.mode === 'chase') continue;
    if (Math.hypot(guard.x - x, guard.y - y) <= radius) {
      guard.mode = 'investigate';
      guard.targetX = x;
      guard.targetY = y;
      guard.loseTimer = 0;
    }
  }
}

export function updateGuards(guards, thief, dt, blockers, smokes, escapePhase) {
  const speedMul = escapePhase ? ESCAPE_MULTIPLIER : 1;
  for (let i = 0; i < guards.length; i += 1) {
    const guard = guards[i];
    const watcher = {
      x: guard.x,
      y: guard.y,
      angle: guard.angle,
      range: GUARD_RANGE,
      halfAngle: GUARD_HALF_ANGLE,
    };
    guard.seesThief = canSee(watcher, thief, blockers, smokes);

    if (guard.seesThief) {
      guard.lastSeenX = thief.x;
      guard.lastSeenY = thief.y;
      guard.loseTimer = 0;
      if (guard.mode !== 'chase') {
        guard.mode = 'chase';
      }
    }

    if (guard.mode === 'chase') {
      if (guard.seesThief) {
        moveToward(guard, thief.x, thief.y, CHASE_SPEED * speedMul, dt);
      } else {
        guard.loseTimer += dt;
        if (guard.loseTimer > 1.5) {
          guard.mode = 'investigate';
          guard.targetX = guard.lastSeenX;
          guard.targetY = guard.lastSeenY;
        }
      }
      continue;
    }

    if (guard.mode === 'investigate') {
      const arrived = moveToward(guard, guard.targetX, guard.targetY, PATROL_SPEED * 1.25 * speedMul, dt);
      if (arrived) {
        guard.mode = 'look';
        guard.lookTimer = 2.0;
        guard.lookDirection = guard.rng() < 0.5 ? 1 : -1;
      }
      continue;
    }

    if (guard.mode === 'look') {
      guard.lookTimer -= dt;
      guard.angle += guard.lookDirection * 1.6 * dt;
      if (guard.lookTimer <= 0) guard.mode = 'patrol';
      continue;
    }

    // Patrol: walk the waypoint loop, pausing to look around at each stop.
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
      guard.angle += Math.sin(guard.pauseTimer * 3) * 0.6 * dt;
      continue;
    }
    const wp = guard.waypoints[guard.waypointIndex];
    const arrived = moveToward(guard, wp.x, wp.y, PATROL_SPEED * speedMul, dt);
    if (arrived) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      guard.pauseTimer = range(guard.rng, 0.6, 1.4);
    }
  }
}

// True when any guard is close enough to grab the thief.
export function guardContact(guards, thief) {
  for (let i = 0; i < guards.length; i += 1) {
    if (Math.hypot(guards[i].x - thief.x, guards[i].y - thief.y) < CONTACT_DISTANCE) {
      return guards[i];
    }
  }
  return null;
}
