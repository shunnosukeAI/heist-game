// The museum floor plan for Moonlight Gallery Heist.
// One hand-built layout: three rooms joined by door gaps, display cases that
// block both movement and sight, loot ranked by rarity, two sweeping cameras,
// three guard patrol routes and a service exit in the entrance hall.

export const MUSEUM_WIDTH = 960;
export const MUSEUM_HEIGHT = 640;
export const WALL = 16;

export const RARITY = {
  common: { label: 'COMMON', color: '#7ddf8a', glow: 'rgba(125,223,138,0.35)' },
  rare: { label: 'RARE', color: '#5aa9ff', glow: 'rgba(90,169,255,0.35)' },
  epic: { label: 'EPIC', color: '#c07dff', glow: 'rgba(192,125,255,0.4)' },
  legendary: { label: 'LEGENDARY', color: '#ffd23f', glow: 'rgba(255,210,63,0.5)' },
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Walls are the outer border plus two interior dividers with door gaps.
// Divider 1 (x=320) separates the entrance hall from the middle gallery;
// its gap sits low so the thief crosses near the first guard's route.
// Divider 2 (x=640) separates the middle gallery from the deep gallery;
// its gap sits high, forcing a different crossing line.
function buildWalls() {
  const walls = [
    rect(0, 0, MUSEUM_WIDTH, WALL),
    rect(0, MUSEUM_HEIGHT - WALL, MUSEUM_WIDTH, WALL),
    rect(0, 0, WALL, MUSEUM_HEIGHT),
    rect(MUSEUM_WIDTH - WALL, 0, WALL, MUSEUM_HEIGHT),
    rect(320, WALL, 14, 404), // 16..420
    rect(320, 500, 14, 124), // 500..624
    rect(640, WALL, 14, 184), // 16..200
    rect(640, 280, 14, 344), // 280..624
  ];
  return walls;
}

// Display cases: solid cover the thief hides behind. Each one blocks
// movement and line of sight, so the rooms offer several covered routes.
function buildCases() {
  return [
    rect(90, 120, 90, 50),
    rect(180, 300, 90, 50),
    rect(100, 530, 70, 60),
    rect(380, 100, 110, 55),
    rect(470, 260, 60, 110),
    rect(380, 470, 110, 55),
    rect(700, 120, 110, 55),
    rect(800, 300, 60, 110),
    rect(700, 470, 110, 55),
  ];
}

// Loot. The nearer a piece sits to the entrance, the lower its rarity and
// the safer it is; the deep gallery holds the richest pieces under the
// heaviest patrols. The Moonlight Star is the main objective.
function buildLoot() {
  return [
    { id: 'cat', name: 'Porcelain Cat', rarity: 'common', value: 100, x: 140, y: 195, taken: false },
    { id: 'turtle', name: 'Jade Turtle', rarity: 'common', value: 120, x: 235, y: 365, taken: false },
    { id: 'brooch', name: 'Sapphire Brooch', rarity: 'rare', value: 300, x: 435, y: 170, taken: false },
    { id: 'fan', name: 'Ivory Fan', rarity: 'rare', value: 320, x: 545, y: 530, taken: false },
    { id: 'chalice', name: 'Ruby Chalice', rarity: 'epic', value: 600, x: 725, y: 190, taken: false },
    { id: 'mask', name: 'Emerald Mask', rarity: 'epic', value: 650, x: 885, y: 430, taken: false },
    { id: 'star', name: 'Moonlight Star', rarity: 'legendary', value: 1500, x: 885, y: 110, taken: false, main: true },
  ];
}

// Three fixed patrol routes, one per room, as waypoint loops.
function buildGuardRoutes() {
  return [
    [
      { x: 120, y: 80 }, { x: 280, y: 120 }, { x: 280, y: 420 }, { x: 120, y: 420 },
    ],
    [
      { x: 380, y: 80 }, { x: 600, y: 80 }, { x: 600, y: 560 }, { x: 380, y: 560 },
    ],
    [
      { x: 700, y: 80 }, { x: 900, y: 80 }, { x: 900, y: 560 }, { x: 700, y: 560 },
    ],
  ];
}

// Two wall-mounted cameras that sweep their cones back and forth.
function buildCameras() {
  return [
    { x: 327, y: 24, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, phase: 0, range: 230 },
    { x: 936, y: 300, baseAngle: Math.PI, sweep: 0.8, speed: 0.45, phase: 1.7, range: 230 },
  ];
}

export function buildMuseum() {
  const walls = buildWalls();
  const cases = buildCases();
  return {
    width: MUSEUM_WIDTH,
    height: MUSEUM_HEIGHT,
    walls,
    cases,
    // Everything solid, for movement collision and sight blocking.
    blockers: walls.concat(cases),
    loot: buildLoot(),
    guardRoutes: buildGuardRoutes(),
    cameras: buildCameras(),
    spawn: { x: 70, y: 500 },
    exit: rect(16, 540, 64, 84),
  };
}

// True when the point (with a small radius) touches any solid rectangle.
export function hitsBlocker(x, y, radius, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    const b = blockers[i];
    const nearestX = Math.max(b.x, Math.min(x, b.x + b.w));
    const nearestY = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}
