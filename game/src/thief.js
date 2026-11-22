// The thief: movement, noise, loot pickup and the escape in
// Moonlight Gallery Heist. Movement is axis-separated against the solid
// rectangles so the thief slides along walls and cases instead of sticking.

import { hitsBlocker, RARITY } from './museum.js';

export const THIEF_RADIUS = 13;
export const WALK_SPEED = 150;
export const SNEAK_SPEED = 85;
export const PICKUP_RADIUS = 26;
export const NOISE_RADIUS = 135;

export function createThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    angle: 0,
    sneaking: false,
    moving: false,
    noiseTimer: 0,
    stepTimer: 0,
  };
}

// Move the thief one step from the current key state. Returns a noise event
// ({x, y}) when loud walking gives the thief away, or null.
export function updateThief(thief, keys, dt, blockers) {
  let mx = 0;
  let my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;
  thief.sneaking = Boolean(keys.sneak);
  thief.moving = mx !== 0 || my !== 0;
  if (!thief.moving) return null;

  const len = Math.hypot(mx, my);
  mx /= len;
  my /= len;
  thief.angle = Math.atan2(my, mx);
  const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const step = speed * dt;

  const nextX = thief.x + mx * step;
  if (!hitsBlocker(nextX, thief.y, THIEF_RADIUS, blockers)) thief.x = nextX;
  const nextY = thief.y + my * step;
  if (!hitsBlocker(thief.x, nextY, THIEF_RADIUS, blockers)) thief.y = nextY;

  // Loud walking pings the guards every 0.45s; sneaking is silent.
  if (thief.sneaking) return null;
  thief.noiseTimer -= dt;
  if (thief.noiseTimer <= 0) {
    thief.noiseTimer = 0.45;
    return { x: thief.x, y: thief.y, radius: NOISE_RADIUS };
  }
  return null;
}

// Pick up any loot within reach. Returns the taken pieces in order.
export function collectLoot(thief, loot, onTake) {
  const taken = [];
  for (let i = 0; i < loot.length; i += 1) {
    const piece = loot[i];
    if (piece.taken) continue;
    if (Math.hypot(piece.x - thief.x, piece.y - thief.y) < PICKUP_RADIUS) {
      piece.taken = true;
      taken.push(piece);
      if (onTake) onTake(piece);
    }
  }
  return taken;
}

// True when the thief stands inside the service exit doorway.
export function atExit(thief, exit) {
  return (
    thief.x >= exit.x &&
    thief.x <= exit.x + exit.w &&
    thief.y >= exit.y &&
    thief.y <= exit.y + exit.h
  );
}

export function rarityLabel(piece) {
  return RARITY[piece.rarity].label;
}
