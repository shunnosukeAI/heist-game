// All drawing for Moonlight Gallery Heist: the moonlit floor, walls and
// cases, vision cones, the thief, the loot with its rarity colours, and the
// HUD (alarm meter, score, tools, objective) plus the title, caught and win
// screens. Everything is drawn with the canvas 2D API; there are no images.

import { RARITY } from './museum.js';
import { alarmColor } from './alarm.js';
import { coinPosition, SMOKE_DURATION } from './tools.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

const FLOOR_A = '#1b2136';
const FLOOR_B = '#171c2e';
const WALL_FILL = '#2c3350';
const WALL_EDGE = '#4a5578';
const CASE_FILL = '#232a44';
const CASE_GLASS = 'rgba(150,190,255,0.10)';

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawGem(ctx, x, y, size, color, time) {
  const pulse = 1 + Math.sin(time * 3 + x) * 0.08;
  const s = size * pulse;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.7, -s * 0.2);
  ctx.lineTo(s * 0.45, s * 0.8);
  ctx.lineTo(-s * 0.45, s * 0.8);
  ctx.lineTo(-s * 0.7, -s * 0.2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.35, -s * 0.25);
  ctx.lineTo(s * 0.3, -s * 0.35);
  ctx.stroke();
  ctx.restore();
}

function drawLoot(ctx, loot, time) {
  for (let i = 0; i < loot.length; i += 1) {
    const piece = loot[i];
    if (piece.taken) continue;
    const rarity = RARITY[piece.rarity];
    // Glow ring so the rarity reads at a glance, even shrunk.
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = rarity.glow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = piece.rarity === 'legendary' ? 3 : 2;
    ctx.stroke();
    drawGem(ctx, piece.x, piece.y, piece.main ? 13 : 10, rarity.color, time);
    // Rarity tag and value under the piece.
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = rarity.color;
    ctx.fillText(rarity.label, piece.x, piece.y + 36);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#cdd3e8';
    ctx.fillText(String(piece.value), piece.x, piece.y + 48);
  }
}

function drawGuard(ctx, guard, time) {
  const alerted = guard.mode === 'chase';
  const coneFill = alerted
    ? 'rgba(239,68,68,0.28)'
    : guard.seesThief
      ? 'rgba(240,180,41,0.22)'
      : 'rgba(250,204,21,0.16)';
  drawCone(ctx, guard.x, guard.y, guard.angle, (75 / 2) * (Math.PI / 180), 200, coneFill);
  // Body: dark uniform with a cap brim facing the patrol direction.
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#3b4257';
  ctx.fill();
  ctx.strokeStyle = alerted ? '#ef4444' : '#8b93ad';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
  ctx.strokeStyle = '#e8ebf5';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Little "!" while chasing, "?" while investigating.
  if (guard.mode === 'chase' || guard.mode === 'investigate') {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.mode === 'chase' ? '#ef4444' : '#f0b429';
    ctx.fillText(guard.mode === 'chase' ? '!' : '?', guard.x, guard.y - 20);
  }
}

function drawCamera(ctx, camera) {
  drawCone(ctx, camera.x, camera.y, camera.angle, 30 * (Math.PI / 180), camera.range,
    camera.seesThief ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.12)');
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = '#475069';
  ctx.fillRect(-4, -6, 16, 12);
  ctx.fillStyle = camera.seesThief ? '#ef4444' : '#f0b429';
  ctx.beginPath();
  ctx.arc(12, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawThief(ctx, thief, time) {
  const r = thief.sneaking ? 11 : 13;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  // Hooded cloak: a dark teal body with a lighter hood and facing tick.
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, r, 0, Math.PI * 2);
  ctx.fillStyle = thief.sneaking ? '#1f4d4a' : '#2f6f6a';
  ctx.fill();
  ctx.strokeStyle = '#9fe8df';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.angle) * (r + 6), thief.y + Math.sin(thief.angle) * (r + 6));
  ctx.strokeStyle = '#d7fff8';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  if (thief.sneaking) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fe8df';
    ctx.fillText('SNEAK', thief.x, thief.y - r - 8);
  }
}

function drawHud(ctx, state) {
  const { width } = state.museum;
  ctx.save();
  ctx.fillStyle = 'rgba(10,13,26,0.85)';
  ctx.fillRect(0, 0, width, 44);
  ctx.strokeStyle = '#3a4266';
  ctx.beginPath();
  ctx.moveTo(0, 44.5);
  ctx.lineTo(width, 44.5);
  ctx.stroke();

  // Alarm meter.
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = state.alarm.seen ? '#ff6b6b' : '#cdd3e8';
  ctx.fillText(state.alarm.seen ? 'SPOTTED!' : 'ALARM', 14, 27);
  ctx.fillStyle = '#10142a';
  ctx.fillRect(88, 14, 220, 16);
  ctx.fillStyle = alarmColor(state.alarm.value);
  ctx.fillRect(88, 14, 220 * (state.alarm.value / 100), 16);
  ctx.strokeStyle = '#5a6288';
  ctx.strokeRect(88.5, 14.5, 220, 16);
  ctx.fillStyle = '#e8ebf5';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${Math.round(state.alarm.value)}%`, 316, 27);

  // Score and tools.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`SCORE ${state.score}`, width - 14, 20);
  ctx.fillStyle = '#cdd3e8';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Coins ${state.tools.coins}   Smoke ${state.tools.smokeCount}   Time ${Math.floor(state.time)}s`, width - 14, 37);

  // Objective line under the bar.
  ctx.textAlign = 'left';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = state.gemTaken ? '#ffd23f' : '#9fe8df';
  const objective = state.gemTaken
    ? 'The Star is yours — reach the green EXIT door before the alarm peaks!'
    : 'Steal the legendary Moonlight Star in the deep gallery, then escape.';
  ctx.fillText(objective, 14, 62);
  ctx.restore();
}

function drawMessage(ctx, state) {
  if (!state.message || state.messageTimer <= 0) return;
  ctx.save();
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  const alpha = Math.min(1, state.messageTimer);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(state.message, state.museum.width / 2, state.museum.height - 24);
  ctx.restore();
}

function drawOverlay(ctx, state, title, lines, accent) {
  const { width, height } = state.museum;
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,22,0.78)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, width / 2, height / 2 - 70);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#e8ebf5';
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], width / 2, height / 2 - 24 + i * 26);
  }
  ctx.restore();
}

export function drawTitle(ctx, state) {
  const { width, height } = state.museum;
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,22,0.82)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('A MOONLIT MUSEUM HEIST', width / 2, 150);
  ctx.fillStyle = '#f4f6ff';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText('Moonlight Gallery', width / 2, 210);
  ctx.fillText('Heist', width / 2, 268);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#cdd3e8';
  const lines = [
    'Slip past the guards and their sweeping cameras, lift the loot,',
    'and steal the legendary Moonlight Star — then run for the green EXIT door.',
    '',
    'Move: WASD / Arrows    Sneak (silent): Shift    Throw a decoy coin: Q (aim with mouse)',
    'Drop smoke: E    Mute: M    Restart: R',
    '',
    'Green loot is common and safe; gold is legendary — deep inside, under the heaviest patrols.',
    'Walking makes noise. Being seen fills the alarm. At 100% you are caught.',
  ];
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], width / 2, 320 + i * 24);
  }
  ctx.fillStyle = '#9fe8df';
  ctx.font = 'bold 18px sans-serif';
  const blink = Math.sin(state.time * 4) > -0.2 ? 1 : 0.25;
  ctx.globalAlpha = blink;
  ctx.fillText('Press ENTER or click to begin', width / 2, 560);
  ctx.restore();
}

export function render(ctx, state) {
  const { museum } = state;
  const time = state.time;

  // Floor: checker of two dark blues, with a soft moonlight pool in each room.
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, 0, museum.width, museum.height);
  const tile = 40;
  for (let y = 0; y < museum.height; y += tile) {
    for (let x = 0; x < museum.width; x += tile) {
      if (((x + y) / tile) % 2 === 0) {
        ctx.fillStyle = FLOOR_B;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  const pools = [
    { x: 170, y: 300, r: 210 },
    { x: 490, y: 300, r: 230 },
    { x: 800, y: 300, r: 230 },
  ];
  for (let i = 0; i < pools.length; i += 1) {
    const p = pools[i];
    const grad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.r);
    grad.addColorStop(0, 'rgba(140,170,255,0.10)');
    grad.addColorStop(1, 'rgba(140,170,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  }

  // Exit door on the entrance hall's left wall.
  ctx.fillStyle = '#123f2a';
  ctx.fillRect(museum.exit.x, museum.exit.y, museum.exit.w, museum.exit.h);
  ctx.strokeStyle = '#58c96b';
  ctx.lineWidth = 3;
  ctx.strokeRect(museum.exit.x + 1.5, museum.exit.y + 1.5, museum.exit.w - 3, museum.exit.h - 3);
  ctx.save();
  ctx.translate(museum.exit.x + museum.exit.w / 2, museum.exit.y + museum.exit.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7ddf8a';
  ctx.fillText('EXIT', 0, 5);
  ctx.restore();

  // Walls with a lighter top edge so the rooms read at a glance.
  for (let i = 0; i < museum.walls.length; i += 1) {
    const w = museum.walls[i];
    ctx.fillStyle = WALL_FILL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = WALL_EDGE;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }

  // Display cases: dark plinths with a glassy sheen and gold trim.
  for (let i = 0; i < museum.cases.length; i += 1) {
    const c = museum.cases[i];
    ctx.fillStyle = CASE_FILL;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = CASE_GLASS;
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  }

  drawLoot(ctx, museum.loot, time);

  // Smoke puffs under everything that moves.
  for (let i = 0; i < state.tools.puffs.length; i += 1) {
    const puff = state.tools.puffs[i];
    const alpha = Math.min(0.55, 0.25 + (puff.t / SMOKE_DURATION) * 0.3);
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(190,195,210,${alpha})`;
    ctx.fill();
  }

  // Cameras first (their cones sit under the guards' cones).
  for (let i = 0; i < state.cameras.length; i += 1) drawCamera(ctx, state.cameras[i]);
  for (let i = 0; i < state.guards.length; i += 1) drawGuard(ctx, state.guards[i], time);

  // Flying decoy coin.
  if (state.tools.coin) {
    const pos = coinPosition(state.tools.coin);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawThief(ctx, state.thief, time);

  // Sparkle particles on pickups.
  for (let i = 0; i < state.particles.length; i += 1) {
    const p = state.particles[i];
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawHud(ctx, state);
  drawMessage(ctx, state);

  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  if (state.screen === SCREEN_CAUGHT) {
    drawOverlay(ctx, state, 'CAUGHT!', [
      state.caughtReason === 'contact'
        ? 'A guard grabbed you in the gallery.'
        : 'The alarm hit 100% and the museum locked down.',
      `Score: ${state.score}   •   Loot taken: ${state.lootTaken} pieces`,
      'Press R or click to try again.',
    ], '#ef4444');
  }
  if (state.screen === SCREEN_WIN) {
    drawOverlay(ctx, state, 'CLEAN GETAWAY!', [
      `You slipped out with the Moonlight Star.`,
      `Score: ${state.score}   •   Loot taken: ${state.lootTaken} pieces   •   Time: ${Math.floor(state.time)}s`,
      `Tools left: ${state.tools.coins} coins, ${state.tools.smokeCount} smoke — bonus included.`,
      'Press R or click to play again.',
    ], '#ffd23f');
  }
}
