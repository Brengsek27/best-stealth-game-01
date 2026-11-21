// Input handling for GHOSTLIGHT stealth game.
// Exposes readInput() returning movement vector, sneak flag, interact flag
// and edge‑triggered actions (start, pause, restart, mute).

let initialized = false;
const state = {
  left: false,
  right: false,
  up: false,
  down: false,
  shift: false,
  start: false,
  pause: false,
  restart: false,
  mute: false,
  interact: false,
};

function attach() {
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyA': case 'ArrowLeft': state.left = true; break;
      case 'KeyD': case 'ArrowRight': state.right = true; break;
      case 'KeyW': case 'ArrowUp': state.up = true; break;
      case 'KeyS': case 'ArrowDown': state.down = true; break;
      case 'ShiftLeft': case 'ShiftRight': state.shift = true; break;
      case 'Enter': state.start = true; break;
      case 'KeyP': case 'Escape': state.pause = true; break;
      case 'KeyR': state.restart = true; break;
      case 'KeyM': state.mute = true; break;
      case 'KeyE': state.interact = true; break;
    }
  });
  window.addEventListener('keyup', e => {
    switch (e.code) {
      case 'KeyA': case 'ArrowLeft': state.left = false; break;
      case 'KeyD': case 'ArrowRight': state.right = false; break;
      case 'KeyW': case 'ArrowUp': state.up = false; break;
      case 'KeyS': case 'ArrowDown': state.down = false; break;
      case 'ShiftLeft': case 'ShiftRight': state.shift = false; break;
    }
  });
  window.addEventListener('blur', () => {
    state.left = state.right = state.up = state.down = state.shift = false;
  });
  initialized = true;
}

export function readInput() {
  if (!initialized) attach();
  const mx = (state.right ? 1 : 0) - (state.left ? 1 : 0);
  const my = (state.down ? 1 : 0) - (state.up ? 1 : 0);
  const sneak = !!state.shift;
  const { start, pause, restart, mute, interact } = state;
  // clear edge flags
  state.start = state.pause = state.restart = state.mute = state.interact = false;
  return { mx, my, sneak, interact, start, pause, restart, mute };
}
