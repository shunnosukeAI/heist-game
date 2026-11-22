// The sweeping security cameras for Moonlight Gallery Heist.
// Each camera is bolted to a wall and swings its cone back and forth on a
// fixed rhythm, so the player can time a crossing between sweeps.

import { canSee } from './vision.js';

export const CAMERA_RANGE = 230;
export const CAMERA_HALF_ANGLE = 30 * (Math.PI / 180);

export function createCameras(definitions) {
  return definitions.map((def) => ({
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    phase: def.phase,
    range: def.range,
    angle: def.baseAngle,
    seesThief: false,
  }));
}

export function updateCameras(cameras, time, thief, blockers, smokes, escapePhase) {
  const speedMul = escapePhase ? 1.3 : 1;
  for (let i = 0; i < cameras.length; i += 1) {
    const camera = cameras[i];
    camera.angle = camera.baseAngle + Math.sin(time * camera.speed * speedMul + camera.phase) * camera.sweep;
    const watcher = {
      x: camera.x,
      y: camera.y,
      angle: camera.angle,
      range: camera.range,
      halfAngle: CAMERA_HALF_ANGLE,
    };
    camera.seesThief = canSee(watcher, thief, blockers, smokes);
  }
}

// True when any camera has the thief in its cone right now.
export function cameraSees(cameras) {
  for (let i = 0; i < cameras.length; i += 1) {
    if (cameras[i].seesThief) return true;
  }
  return false;
}
