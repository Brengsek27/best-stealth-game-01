// GHOSTLIGHT main loop – Node‑compatible (no top‑level DOM).
// All DOM interactions are inside functions so importing in Node is safe.

import { STEP } from './config.js';
import { makeWorld, step as worldStep } from './world.js';
import { drawWorld } from './render.js';
import { readInput } from './input.js';
import { stageShot } from './shots.js';

// tiny beep using WebAudio (noop in Node)
function beep(freq = 440, dur = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (_) { /* ignore in Node */ }
}

function readParams() {
  const sp = new URLSearchParams(window.location.search);
  const shot = sp.get('shot');
  const seed = Number.parseInt(sp.get('seed') ?? '', 10) || 1;
  return { shot, seed };
}

export function boot() {
  const { shot, seed } = readParams();
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = 1280; // logical width
  canvas.height = 720; // logical height

  if (shot) {
    const { world, screen, best } = stageShot(shot, seed);
    drawWorld(ctx, world);
    window.__shotReady = true;
    return;
  }

  let world = makeWorld(seed);
  world.screen = 'title';
  let accumulator = 0;
  let last = performance.now();
  let paused = false;

  function togglePause() {
    paused = !paused;
    world.screen = paused ? 'pause' : 'play';
    beep(660, 0.05);
  }

  function startGame() {
    world.screen = 'play';
    beep(880, 0.05);
  }

  function restartGame() {
    world = makeWorld(seed);
    world.screen = 'title';
    beep(440, 0.1);
  }

  function handleInput() {
    const { start, pause, restart } = readInput();
    if (start && world.screen === 'title') startGame();
    if (pause) togglePause();
    if (restart) restartGame();
  }

  function stepSimulation() {
    if (world.screen === 'title') {
      worldStep(world, { mx: 0, my: 0, sneak: false, interact: false }, STEP);
    } else if (world.screen === 'play') {
      const inp = readInput();
      worldStep(world, { mx: inp.mx, my: inp.my, sneak: inp.sneak, interact: inp.interact }, STEP);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = (now - last) / 1000;
    last = now;
    accumulator += Math.min(delta, 0.25);
    handleInput();
    if (!paused && (world.screen === 'title' || world.screen === 'play')) {
      while (accumulator >= STEP) {
        stepSimulation();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    drawWorld(ctx, world);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.screen === 'play') togglePause();
  });

  requestAnimationFrame(frame);

  // expose debugging API
  window.__game = {
    state: () => ({
      screen: world.screen,
      cores: world.cores.filter(c => c.taken).length,
      guards: world.guards.length,
      detection: world.detection,
      alert: world.alert,
    }),
  };
}

if (typeof document !== 'undefined') boot();
// Added constant for logical view size reference.
const LOGICAL_VIEW = { width: 1280, height: 720 };
