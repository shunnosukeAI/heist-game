// Staged screenshot scenes behind ?shot=cover|sneak|escape|caught.
// Each scene resets the game from a fixed seed, then plays it forward with a
// scripted key plan — the same step function the live game uses — so every
// screenshot is a real render of real play, and the same seed always gives
// the same frame. The alarm is then set to a staged value for the cover and
// escape frames so the meter reads mid-tension, as it does in real play.

const STEP = 1 / 60;
const IDLE_KEYS = { up: false, down: false, left: false, right: false, sneak: false };

function runPlan(game, plan) {
  for (let i = 0; i < plan.length; i += 1) {
    const move = plan[i];
    if (move.teleport) {
      game.state.thief.x = move.teleport[0];
      game.state.thief.y = move.teleport[1];
      continue;
    }
    const keys = { ...IDLE_KEYS, ...(move.keys || {}) };
    const steps = Math.round(move.dur / STEP);
    for (let s = 0; s < steps; s += 1) {
      game.step(STEP, keys);
      if (game.state.screen !== 'play') return;
    }
  }
}

// From the spawn, cross the low door into the middle gallery, then the high
// door into the deep gallery: the thief mid-crossing, a guard cone, a
// camera, epic loot and the alarm meter all in one frame.
function stageCover(game) {
  game.staging = true;
  runPlan(game, [
    { dur: 0.35, keys: { up: true } },
    { dur: 2.4, keys: { right: true } },
    { dur: 1.4, keys: { up: true } },
    { dur: 1.4, keys: { right: true } },
  ]);
  game.state.alarm.value = 48;
  return 'play';
}

// Sneak low and slow behind the entrance-hall cases toward the Jade Turtle.
function stageSneak(game) {
  game.staging = true;
  runPlan(game, [
    { dur: 0.4, keys: { up: true, sneak: true } },
    { dur: 1.8, keys: { right: true, sneak: true } },
    { dur: 1.2, keys: { up: true, sneak: true } },
  ]);
  game.state.alarm.value = 12;
  return 'play';
}

// Grab the Moonlight Star, then run for the doors while the guards speed up.
function stageEscape(game) {
  game.staging = true;
  runPlan(game, [
    { teleport: [872, 118] },
    { dur: 0.4, keys: {} },
    { dur: 0.9, keys: { down: true } },
    { dur: 2.0, keys: { left: true } },
    { dur: 1.2, keys: { down: true } },
    { dur: 1.6, keys: { left: true } },
  ]);
  game.state.alarm.value = 72;
  return 'play';
}

// Stand in the middle gallery guard's path until the alarm tops out.
function stageCaught(game) {
  game.staging = false;
  runPlan(game, [
    { teleport: [480, 80] },
    { dur: 6, keys: {} },
  ]);
  return game.state.screen;
}

// Set `game` to the named scene and return the screen to draw over it.
export function stageShot(name, game) {
  game.reset(7);
  game.state.screen = 'play';
  if (name === 'sneak') return stageSneak(game);
  if (name === 'escape') return stageEscape(game);
  if (name === 'caught') return stageCaught(game);
  return stageCover(game);
}
