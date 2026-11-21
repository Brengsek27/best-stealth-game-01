// GHOSTLIGHT rendering module – draws the world, HUD, and UI screens.
// Enhanced polish version with walls, cover, shadows, and full UI screens.

import { VIEW, PALETTE, LEVEL } from './config.js';

// ---- Constants -----------------------------------------------------------
const VIGNETTE_ALPHA = 0.15; // dark edge overlay opacity
const SHADOW_ALPHA = 0.22;   // teal shadow zone opacity
const NOISE_RING_MAX = 60;   // max radius for noise ring

// ---- Utility helpers ------------------------------------------------------
function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawFloor(ctx) {
  // Base charcoal floor.
  fillRect(ctx, 0, 0, VIEW.width, VIEW.height, PALETTE.floorCharcoal);
  // Indigo‑black checker pattern for subtle texture.
  const tile = 40;
  for (let y = 0; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      if ((x / tile + y / tile) % 2 === 0) {
        fillRect(ctx, x, y, tile, tile, PALETTE.floorIndigoBlack);
      }
    }
  }
  // Brass trim around the outer walls.
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, VIEW.width, VIEW.height);
}

function drawWalls(ctx) {
  // Draw each wall as a 3‑D block: top face, side face, and drop shadow.
  LEVEL.walls.forEach(w => {
    // Top face.
    fillRect(ctx, w.x, w.y, w.w, w.h, PALETTE.floorCharcoal);
    // Side face (simulated depth).
    ctx.fillStyle = PALETTE.brass;
    ctx.beginPath();
    ctx.moveTo(w.x, w.y + w.h);
    ctx.lineTo(w.x + w.w, w.y + w.h);
    ctx.lineTo(w.x + w.w + 4, w.y + w.h + 4);
    ctx.lineTo(w.x + 4, w.y + w.h + 4);
    ctx.closePath();
    ctx.fill();
    // Drop shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(w.x + 2, w.y + w.h + 2, w.w, 4);
  });
}

function drawCover(ctx) {
  // Simple visual variants for cover objects.
  LEVEL.cover.forEach(c => {
    // Pillar: square, dark gray with lighter highlight.
    if (c.w === c.h) {
      fillRect(ctx, c.x, c.y, c.w, c.h, '#444');
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    } else {
      // Crate: brown base with strap lines.
      fillRect(ctx, c.x, c.y, c.w, c.h, '#663300');
      ctx.strokeStyle = '#aa5500';
      ctx.lineWidth = 1;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      // straps
      ctx.beginPath();
      ctx.moveTo(c.x + c.w * 0.25, c.y);
      ctx.lineTo(c.x + c.w * 0.25, c.y + c.h);
      ctx.moveTo(c.x + c.w * 0.75, c.y);
      ctx.lineTo(c.x + c.w * 0.75, c.y + c.h);
      ctx.stroke();
    }
  });
}

function drawShadows(ctx) {
  // Apply teal shadow overlay for each room (treated as shadow zone).
  ctx.fillStyle = PALETTE.tealShadow;
  ctx.globalAlpha = SHADOW_ALPHA;
  Object.values(LEVEL.rooms).forEach(r => {
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });
  ctx.globalAlpha = 1.0;
}

function drawCores(ctx, cores) {
  cores.forEach(c => {
    // A stolen core is gone: only untaken cores glow on the floor.
    if (c.taken) return;
    // Soft glow for core.
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 18);
    grad.addColorStop(0, `${PALETTE.gold}AA`);
    grad.addColorStop(1, `${PALETTE.gold}00`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
    ctx.fill();
    // Core outline.
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawExit(ctx, exit) {
  fillRect(ctx, exit.x, exit.y, exit.w, exit.h, PALETTE.brass);
  if (exit.open) {
    ctx.fillStyle = 'rgba(0,255,0,0.3)';
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  }
}

function drawPlayer(ctx, player) {
  // Base hooded figure: solid white fill so the player reads instantly on
  // every background — guards are grey #555 bodies, cores are hollow gold
  // rings, and the teal shadow rooms would swallow a teal fill.
  const radius = player.radius;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sneak silhouette (smaller, semi‑transparent).
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Direction tick.
  const len = 20;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.dir) * len, player.y + Math.sin(player.dir) * len);
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  // Noise rings when running.
  if (player.noise) {
    const ringRadius = Math.min(NOISE_RING_MAX, player.noise * 30 || 30);
    ctx.beginPath();
    ctx.arc(player.x, player.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  guards.forEach(g => {
    // Vision cone gradient.
    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.coneRange);
    const base = g.state === 'alert' ? PALETTE.crimsonAlarm : PALETTE.amber;
    grad.addColorStop(0, `${base}40`);
    grad.addColorStop(1, `${base}00`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, g.coneRange, g.dir - (g.coneHalfAngle * Math.PI) / 180,
      g.dir + (g.coneHalfAngle * Math.PI) / 180);
    ctx.closePath();
    ctx.fill();

    // Guard body.
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Direction tick.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 16, g.y + Math.sin(g.dir) * 16);
    ctx.stroke();

    // Suspicion arc above head.
    if (g.suspicion > 0) {
      const start = -Math.PI / 2;
      const end = start + (2 * Math.PI * g.suspicion) / 100;
      ctx.beginPath();
      ctx.arc(g.x, g.y - 18, 10, start, end);
      ctx.strokeStyle = PALETTE.crimsonAlarm;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
}

function drawHUD(ctx, world) {
  // Top bar background.
  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(0, 0, VIEW.width, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.textBaseline = 'middle';
  // Objective line.
  const taken = world.cores.filter(c => c.taken).length;
  ctx.fillText(`Steal ${taken}/${world.cores.length} cores – reach exit unseen`, 10, 15);
  // Detection meter.
  const barW = 200;
  const barX = VIEW.width - barW - 10;
  ctx.fillStyle = '#444';
  ctx.fillRect(barX, 5, barW, 12);
  const perc = Math.min(1, world.detection / 100);
  const col = perc < 0.5 ? PALETTE.amber : PALETTE.crimsonAlarm;
  ctx.fillStyle = col;
  ctx.fillRect(barX, 5, barW * perc, 12);
  // Alert word: ALARM while a guard sees the player OR detection is high
  // (the bar turns crimson at 50, so the word must match the bar).
  const alertWord = world.alert === 'ALARM' || world.detection >= 50 ? 'ALARM' : 'CALM';
  ctx.fillText(alertWord, VIEW.width / 2 - 30, 15);
  // Timer.
  const secs = Math.floor(world.time);
  ctx.fillStyle = '#fff';
  ctx.fillText(`${secs}s`, VIEW.width - 60, 15);
  // Bottom hint bar.
  const hintY = VIEW.height - 30;
  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(0, hintY, VIEW.width, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('WASD move • Shift sneak • E grab • R restart • P pause • M mute', 10, hintY + 15);
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, Math.min(VIEW.width, VIEW.height) / 2,
    VIEW.width / 2, VIEW.height / 2, 0);
  grad.addColorStop(0, `rgba(0,0,0,0)`);
  grad.addColorStop(1, `rgba(0,0,0,${VIGNETTE_ALPHA})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawScreen(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  const centerX = VIEW.width / 2;
  const centerY = VIEW.height / 2;
  ctx.font = '48px sans-serif';
  ctx.textBaseline = 'middle';
  let title = '';
  let subtitle = '';
  let extra = '';
  switch (world.screen) {
    case 'title':
      title = 'GHOSTLIGHT';
      subtitle = 'The Meridian Vault Job';
      extra = 'Press Enter to start';
      break;
    case 'paused':
      title = 'PAUSED';
      extra = 'Press P to resume';
      break;
    case 'won':
      title = 'ESCAPED';
      subtitle = `Cores ${world.stats.coresTaken}/${world.cores.length}`;
      extra = `Time: ${Math.floor(world.time)}s`;
      break;
    case 'caught':
      title = 'CAUGHT';
      subtitle = world.events.includes('caught') ? 'Detected by guard' : 'Oops';
      extra = 'Press R to retry';
      break;
    default:
      title = '';
  }
  if (title) {
    ctx.fillText(title, centerX, centerY - 60);
    if (subtitle) {
      ctx.font = '28px sans-serif';
      ctx.fillText(subtitle, centerX, centerY);
    }
    if (extra) {
      ctx.font = '20px monospace';
      ctx.fillText(extra, centerX, centerY + 60);
    }
  }
  ctx.restore();
}

export function drawWorld(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawShadows(ctx);
  drawWalls(ctx);
  drawCover(ctx);
  drawCores(ctx, world.cores);
  drawExit(ctx, world.exit);
  drawGuards(ctx, world.guards);
  drawPlayer(ctx, world.player);
  if (world.screen === 'play') {
    drawHUD(ctx, world);
    drawVignette(ctx);
  } else {
    drawScreen(ctx, world);
  }
}

export { drawHUD, drawScreen };
// End of render module – ready for future extensions.
export const RENDER_VERSION = "2.0";
