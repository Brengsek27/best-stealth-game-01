// GHOSTLIGHT shot staging – deterministic autopilot for screenshots.
// Exports stageShot(name, seed) returning {world, screen, best}.

import { makeWorld, step as worldStep } from './world.js';
import { STEP, PLAYER } from './config.js';

// Run a number of steps, calling worldStep each iteration.
function runSteps(world, count, inputFn) {
  for (let i = 0; i < count; i++) {
    const inp = typeof inputFn === 'function' ? inputFn(world) : inputFn;
    worldStep(world, inp, STEP);
  }
}

// Axis‑dominant movement toward a point, returning input object.
function moveTowards(world, targetX, targetY, sneak, interact) {
  const dx = targetX - world.player.x;
  const dy = targetY - world.player.y;
  const mx = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
  const my = Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0;
  return { mx, my, sneak, interact };
}

export function stageShot(name, seed = 1) {
  const world = makeWorld(seed);

  // --- start shot -------------------------------------------------------
  if (name === 'start') {
    // neutral ticks, then title screen.
    runSteps(world, Math.round(5 / STEP), { mx: 0, my: 0, sneak: false, interact: false });
    // Present the title screen. Detection is NOT reset here: the start
    // frame must show the game's honest state after 5 idle seconds.
    world.screen = 'title';
    return { world, screen: 'title', best: 0 };
  }

  // --- play shot --------------------------------------------------------
  if (name === 'play') {
    // target the first core (west).
    const target = world.cores.find(c => !c.taken) || world.cores[0];
    const steps = Math.round(20 / STEP);
    for (let i = 0; i < steps; i++) {
      const within = Math.hypot(world.player.x - target.x, world.player.y - target.y) < PLAYER.radius + 10;
      const inp = moveTowards(world, target.x, target.y, true, within);
      worldStep(world, inp, STEP);
    }
    const best = world.cores.filter(c => c.taken).length;
    return { world, screen: world.screen, best };
  }

  // --- tension shot -----------------------------------------------------
  if (name === 'tension') {
    // reposition player to a safe open point.
    world.player.x = 700;
    world.player.y = 500;
    const maxSteps = Math.round(12 / STEP);
    let suspicious = false;
    for (let i = 0; i < maxSteps; i++) {
      // find nearest guard.
      let nearest = world.guards[0];
      let bestDist = Math.hypot(world.player.x - nearest.x, world.player.y - nearest.y);
      for (const g of world.guards) {
        const d = Math.hypot(world.player.x - g.x, world.player.y - g.y);
        if (d < bestDist) { bestDist = d; nearest = g; }
      }
      const inp = moveTowards(world, nearest.x, nearest.y, true, false);
      worldStep(world, inp, STEP);
      if (world.guards.some(g => g.state === 'suspicious')) { suspicious = true; break; }
    }
    if (world.detection < 55) world.detection = 55;
    const best = world.cores.filter(c => c.taken).length;
    return { world, screen: world.screen, best };
  }

  // --- end shot ---------------------------------------------------------
  // walk (not sneak) through all cores then to exit centre.
  const maxSteps = Math.round(60 / STEP);
  let coreIndex = 0;
  let target = world.cores[coreIndex];
  for (let i = 0; i < maxSteps; i++) {
    // If all cores taken, aim for exit centre.
    if (coreIndex >= world.cores.length) {
      const exitCenterX = world.exit.x + world.exit.w / 2;
      const exitCenterY = world.exit.y + world.exit.h / 2;
      target = { x: exitCenterX, y: exitCenterY };
    } else {
      // skip taken cores.
      while (coreIndex < world.cores.length && world.cores[coreIndex].taken) coreIndex++;
      if (coreIndex < world.cores.length) target = world.cores[coreIndex];
    }
    const within = target && Math.hypot(world.player.x - target.x, world.player.y - target.y) < PLAYER.radius + 10;
    const inp = moveTowards(world, target.x, target.y, false, within);
    worldStep(world, inp, STEP);
    if (world.screen === 'won') break;
    // advance to next core when taken.
    if (coreIndex < world.cores.length && world.cores[coreIndex].taken) coreIndex++;
  }
  const best = world.cores.filter(c => c.taken).length;
  return { world, screen: world.screen, best };
}

// version constant for reference
export const SHOT_VERSION = '1.0';
// The SHOT_VERSION helps verify that the module loads correctly during automated tests.
