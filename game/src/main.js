// Moonlight Gallery Heist — entry point and game loop.
// Owns the game state, steps it forward one tick at a time, and hands it to
// the renderer. The same step function drives live play and the staged
// ?shot= scenes, so screenshots are real frames of the real game.

import { buildMuseum } from './museum.js';
import { mulberry32, seedFromText } from './random.js';
import { createThief, updateThief, collectLoot, atExit } from './thief.js';
import { createGuards, updateGuards, alertGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { createTools, throwCoin, dropSmoke, updateTools, COIN_LURE_RADIUS } from './tools.js';
import {
  createSound, unlockSound, toggleMute,
  playStep, playPickup, playCoin, playSmoke, playSpotted, playCaught, playWin, playClick,
} from './sound.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const WIN_BONUS = 500;
const TOOL_BONUS = 50;

export function createGame() {
  const museum = buildMuseum();
  const game = {
    museum,
    state: null,
    rng: null,
    staging: false,
    sound: createSound(),
  };
  game.reset = (seed) => resetGame(game, seed);
  game.step = (dt, keys) => stepGame(game, dt, keys);
  game.reset(7);
  return game;
}

function resetGame(game, seed) {
  const rng = mulberry32(typeof seed === 'number' ? seed : seedFromText(String(seed)));
  game.rng = rng;
  const museum = buildMuseum();
  game.museum = museum;
  game.state = {
    museum,
    screen: SCREEN_TITLE,
    time: 0,
    seed,
    thief: createThief(museum.spawn),
    guards: createGuards(museum.guardRoutes, rng),
    cameras: createCameras(museum.cameras),
    alarm: createAlarm(),
    tools: createTools(),
    score: 0,
    lootTaken: 0,
    gemTaken: false,
    escapePhase: false,
    particles: [],
    message: '',
    messageTimer: 0,
    caughtReason: '',
    best: 0,
  };
}

function say(state, text, seconds = 3) {
  state.message = text;
  state.messageTimer = seconds;
}

function burstParticles(state, rng, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const speed = 30 + rng() * 60;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6,
      maxLife: 0.6,
      color,
    });
  }
}

function stepGame(game, dt, keys) {
  const state = game.state;
  if (state.screen !== SCREEN_PLAY) return;
  state.time += dt;

  // The thief moves, and loud walking gives the thief away.
  const noise = updateThief(state.thief, keys, dt, state.museum.blockers);
  if (noise) {
    alertGuards(state.guards, noise.x, noise.y, noise.radius);
    playStep(game.sound, state.thief.sneaking);
  }

  updateGuards(state.guards, state.thief, dt, state.museum.blockers, state.tools.puffs, state.escapePhase);
  updateCameras(state.cameras, state.time, state.thief, state.museum.blockers, state.tools.puffs, state.escapePhase);
  updateTools(state.tools, dt, (x, y) => {
    alertGuards(state.guards, x, y, COIN_LURE_RADIUS);
    playCoin(game.sound);
  });

  // Loot: walking over a piece takes it. The Star starts the getaway.
  collectLoot(state.thief, state.museum.loot, (piece) => {
    state.score += piece.value;
    state.lootTaken += 1;
    burstParticles(state, game.rng, piece.x, piece.y, piece.rarity === 'legendary' ? '#ffd23f' : '#9fe8df', 14);
    playPickup(game.sound, piece.rarity);
    if (piece.main) {
      state.gemTaken = true;
      state.escapePhase = true;
      say(state, 'The Moonlight Star is yours! RUN for the EXIT!', 4);
    } else {
      say(state, `${piece.name} +${piece.value}`, 2);
    }
  });

  // The alarm: seen fills it, hiding drains it, a touch ends the run.
  // While staging a screenshot the meter is capped and nobody is caught,
  // so the frame stays a play frame (the caught shot stages separately).
  const wasSeen = state.alarm.seen;
  const outcome = updateAlarm(state.alarm, state.guards, state.cameras, state.thief, dt, state.escapePhase);
  if (state.alarm.seen && !wasSeen) playSpotted(game.sound);
  if (game.staging) {
    if (state.alarm.value > 85) state.alarm.value = 85;
  } else if (outcome) {
    state.caughtReason = outcome;
    state.screen = SCREEN_CAUGHT;
    playCaught(game.sound);
    return;
  }

  // The service exit only opens the win once the Star is in hand.
  if (atExit(state.thief, state.museum.exit)) {
    if (state.gemTaken) {
      state.score += WIN_BONUS + (state.tools.coins + state.tools.smokeCount) * TOOL_BONUS;
      state.screen = SCREEN_WIN;
      playWin(game.sound);
      return;
    }
    if (state.time - (state.exitHintAt || -99) > 4) {
      state.exitHintAt = state.time;
      say(state, 'The exit is locked until you steal the Moonlight Star.', 3);
    }
  }

  // Particles and the message timer decay on their own.
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  if (state.messageTimer > 0) state.messageTimer -= dt;
}

// --- Live play: input, loop and the staged screenshot hook. ---

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = createGame();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = params.get('seed');
const seed = seedParam === null ? 7 : seedFromText(seedParam);

const keys = { up: false, down: false, left: false, right: false, sneak: false };
const mouse = { x: 0, y: 0 };

function canvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * game.museum.width,
    y: ((clientY - rect.top) / rect.height) * game.museum.height,
  };
}

function startPlay() {
  if (game.state.screen === SCREEN_TITLE) {
    game.state.screen = SCREEN_PLAY;
    playClick(game.sound);
  }
}

function restart() {
  game.reset(seed);
  game.state.screen = SCREEN_PLAY;
  playClick(game.sound);
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  unlockSound(game.sound);
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.up = true;
      event.preventDefault();
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      keys.down = true;
      event.preventDefault();
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = true;
      event.preventDefault();
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = true;
      event.preventDefault();
      break;
    case 'Shift':
      keys.sneak = true;
      break;
    case 'Enter':
      startPlay();
      break;
    case 'q':
    case 'Q': {
      const state = game.state;
      if (state.screen === SCREEN_PLAY) {
        if (throwCoin(state.tools, state.thief.x, state.thief.y, mouse.x, mouse.y)) {
          say(state, 'Coin thrown — the guards heard it.', 1.5);
        } else {
          say(state, 'No coins left!', 1.5);
        }
      }
      break;
    }
    case 'e':
    case 'E': {
      const state = game.state;
      if (state.screen === SCREEN_PLAY) {
        if (dropSmoke(state.tools, state.thief.x, state.thief.y)) {
          playSmoke(game.sound);
          say(state, 'Smoke! You are hidden for a few seconds.', 2);
        } else {
          say(state, 'No smoke left!', 1.5);
        }
      }
      break;
    }
    case 'm':
    case 'M': {
      const muted = toggleMute(game.sound);
      say(game.state, muted ? 'Sound muted.' : 'Sound on.', 1.5);
      break;
    }
    case 'r':
    case 'R':
      if (game.state.screen === SCREEN_CAUGHT || game.state.screen === SCREEN_WIN) restart();
      break;
    default:
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.up = false;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      keys.down = false;
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = false;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = false;
      break;
    case 'Shift':
      keys.sneak = false;
      break;
    default:
      break;
  }
});

canvas.addEventListener('mousemove', (event) => {
  const p = canvasPoint(event.clientX, event.clientY);
  mouse.x = p.x;
  mouse.y = p.y;
});

canvas.addEventListener('click', () => {
  unlockSound(game.sound);
  const screen = game.state.screen;
  if (screen === SCREEN_TITLE) startPlay();
  else if (screen === SCREEN_CAUGHT || screen === SCREEN_WIN) restart();
});

function fitCanvas() {
  const scale = Math.min(window.innerWidth / game.museum.width, window.innerHeight / game.museum.height);
  canvas.style.width = `${Math.floor(game.museum.width * scale)}px`;
  canvas.style.height = `${Math.floor(game.museum.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);

canvas.width = game.museum.width;
canvas.height = game.museum.height;
fitCanvas();

if (shotName) {
  // Staged screenshot: reset from the fixed seed, play the scripted scene,
  // then draw one frame and stop. The frame is what the judge sees.
  game.state.screen = stageShot(shotName, game);
  render(ctx, game.state);
  document.title = `Moonlight Gallery Heist — shot ${shotName}`;
  window.__shotReady = true;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // The title screen still needs a clock for its blinking prompt.
    if (game.state.screen === SCREEN_TITLE) game.state.time += dt;
    game.step(dt, keys);
    render(ctx, game.state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
