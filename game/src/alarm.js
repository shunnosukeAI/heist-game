// The alarm meter for Moonlight Gallery Heist.
// Being seen fills it; hiding lets it drain. At 100% the museum locks down
// and the thief is caught. A guard grabbing the thief catches them at once.

export const ALARM_MAX = 100;
export const GUARD_RISE = 42;
export const CAMERA_RISE = 30;
export const ALARM_DECAY = 14;
export const ESCAPE_RISE_MULTIPLIER = 1.3;

export function createAlarm() {
  return { value: 0, seen: false, seenBy: '' };
}

// Advance the meter one step. Returns 'alarm' when the meter tops out,
// 'contact' when a guard touches the thief, or null while play continues.
export function updateAlarm(alarm, guards, cameras, thief, dt, escapePhase) {
  let seenByGuard = false;
  for (let i = 0; i < guards.length; i += 1) {
    if (guards[i].seesThief) {
      seenByGuard = true;
      break;
    }
  }
  let seenByCamera = false;
  for (let i = 0; i < cameras.length; i += 1) {
    if (cameras[i].seesThief) {
      seenByCamera = true;
      break;
    }
  }
  alarm.seen = seenByGuard || seenByCamera;
  alarm.seenBy = seenByGuard ? 'guard' : seenByCamera ? 'camera' : '';

  if (alarm.seen) {
    let rise = (seenByGuard ? GUARD_RISE : 0) + (seenByCamera ? CAMERA_RISE : 0);
    if (escapePhase) rise *= ESCAPE_RISE_MULTIPLIER;
    alarm.value += rise * dt;
  } else {
    alarm.value -= ALARM_DECAY * dt;
  }
  if (alarm.value < 0) alarm.value = 0;
  if (alarm.value >= ALARM_MAX) {
    alarm.value = ALARM_MAX;
    return 'alarm';
  }

  for (let i = 0; i < guards.length; i += 1) {
    if (Math.hypot(guards[i].x - thief.x, guards[i].y - thief.y) < 27) return 'contact';
  }
  return null;
}

// Colour of the meter: calm green, through amber, to flashing red.
export function alarmColor(value) {
  if (value < 40) return '#58c96b';
  if (value < 75) return '#f0b429';
  return '#ef4444';
}
