// Seeded randomness for Moonlight Gallery Heist.
// Every random choice in the game flows through one of these helpers so a
// fixed seed replays the same patrol pauses, sparkles and staged shots.

// A tiny deterministic generator: the classic mulberry32 recipe.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turn a short string into a 32-bit seed so "?seed=moon" is reproducible.
export function seedFromText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Roll a value in [min, max) from a generator function.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Pick one element of an array with a generator function.
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
