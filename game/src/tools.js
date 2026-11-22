// The thief's tools for Moonlight Gallery Heist: decoy coins and smoke.
// Both are limited, so spending one is a real decision. A coin is thrown
// toward the mouse and clinks where it lands, pulling nearby guards over to
// look; smoke blooms where the thief stands and blinds every watcher for a
// few seconds.

export const COIN_COUNT = 3;
export const SMOKE_COUNT = 2;
export const COIN_THROW_RANGE = 200;
export const COIN_LURE_RADIUS = 210;
export const SMOKE_RADIUS = 95;
export const SMOKE_DURATION = 4;
export const COIN_FLIGHT_TIME = 0.35;

export function createTools() {
  return {
    coins: COIN_COUNT,
    smokeCount: SMOKE_COUNT,
    coin: null, // flying coin: {fromX, fromY, x, y, t}
    puffs: [], // live smoke: {x, y, radius, t}
  };
}

// Start a coin throw from the thief toward a point (usually the mouse).
// Returns false when no coins are left or one is already in the air.
export function throwCoin(tools, fromX, fromY, toX, toY) {
  if (tools.coins <= 0 || tools.coin) return false;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, COIN_THROW_RANGE);
  const nx = dist > 0 ? dx / dist : 1;
  const ny = dist > 0 ? dy / dist : 0;
  tools.coins -= 1;
  tools.coin = {
    fromX,
    fromY,
    x: fromX + nx * reach,
    y: fromY + ny * reach,
    t: 0,
  };
  return true;
}

// Drop a smoke puff at the thief. Returns false when none are left.
export function dropSmoke(tools, x, y) {
  if (tools.smokeCount <= 0) return false;
  tools.smokeCount -= 1;
  tools.puffs.push({ x, y, radius: SMOKE_RADIUS, t: SMOKE_DURATION });
  return true;
}

// Advance flying coins and fading puffs. Calls onCoinLand(x, y) the moment
// a thrown coin hits the floor.
export function updateTools(tools, dt, onCoinLand) {
  if (tools.coin) {
    tools.coin.t += dt;
    if (tools.coin.t >= COIN_FLIGHT_TIME) {
      const landed = tools.coin;
      tools.coin = null;
      if (onCoinLand) onCoinLand(landed.x, landed.y);
    }
  }
  for (let i = tools.puffs.length - 1; i >= 0; i -= 1) {
    tools.puffs[i].t -= dt;
    if (tools.puffs[i].t <= 0) tools.puffs.splice(i, 1);
  }
}

// Where a flying coin is drawn right now (it arcs toward its target).
export function coinPosition(coin) {
  const k = Math.min(1, coin.t / COIN_FLIGHT_TIME);
  const x = coin.fromX + (coin.x - coin.fromX) * k;
  const y = coin.fromY + (coin.y - coin.fromY) * k - Math.sin(k * Math.PI) * 26;
  return { x, y };
}
