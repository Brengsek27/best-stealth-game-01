// GHOSTLIGHT deterministic random utilities
// The seed comes from the optional "?seed=" query parameter; default 1.
export const seed = (() => {
  if (typeof window !== "undefined") {
    const m = /[?&]seed=([0-9]+)/.exec(window.location.search);
    return m ? Number(m[1]) : 1;
  }
  // Node environment – no URL, fallback to 1.
  return 1;
})();

// Mulberry32 PRNG – returns a function that yields numbers in [0,1).
export function mulberry32(s) {
  let a = s >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper: random integer in [min, max) using a rng function.
export function range(rng, min, max) {
  return Math.floor(rng() * (max - min)) + min;
}

// Helper: pick a random element from an array.
export function pick(rng, items) {
  if (!items.length) return undefined;
  return items[range(rng, 0, items.length)];
}

// Helper to expose a seeded RNG directly for external debugging.
export const rng = mulberry32(seed);

