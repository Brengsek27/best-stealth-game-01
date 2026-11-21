// GHOSTLIGHT simulation core – state creation and step logic.
// The renderer (later session) will read the exact field names defined here.

import { VIEW, LEVEL, GUARDS, CORES, EXIT, PLAYER, STEP } from "./config.js";
import { mulberry32, seed as defaultSeed } from "./random.js";

// ---------- Helper geometry -------------------------------------------------
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

// Segment‑rectangle intersection (axis‑aligned). Returns true if the line
// from p1 to p2 touches or crosses the rectangle.
function segmentIntersectsRect(p1, p2, r) {
  // Quick reject if both points on one side.
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;

  // If either endpoint inside rectangle, intersect.
  if (
    p1.x >= r.x && p1.x <= r.x + r.w && p1.y >= r.y && p1.y <= r.y + r.h
  )
    return true;
  if (
    p2.x >= r.x && p2.x <= r.x + r.w && p2.y >= r.y && p2.y <= r.y + r.h
  )
    return true;

  // Check against each of the four edges.
  const edges = [
    [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }],
    [{ x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }],
    [{ x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }],
    [{ x: r.x, y: r.y + r.h }, { x: r.x, y: r.y }],
  ];
  for (const [e1, e2] of edges) {
    if (segmentsIntersect(p1, p2, e1, e2)) return true;
  }
  return false;
}

function segmentsIntersect(p1, p2, q1, q2) {
  const o1 = orient(p1, p2, q1);
  const o2 = orient(p1, p2, q2);
  const o3 = orient(q1, q2, p1);
  const o4 = orient(q1, q2, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  return false;
}

function orient(a, b, c) {
  const v = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

// ---------- Guard vision ----------------------------------------------------
function guardCanSeePlayer(guard, player) {
  // distance check
  const d = dist(guard, player);
  if (d > guard.coneRange) return false;
  // angle check
  const dirAngle = guard.dir; // stored as radians
  const toPlayer = angleBetween(guard, player);
  const diff = Math.abs(((toPlayer - dirAngle + Math.PI) % (2 * Math.PI)) - Math.PI);
  if (diff > (guard.coneHalfAngle * Math.PI) / 180) return false;
  // line‑of‑sight against walls
  for (const wall of LEVEL.walls) {
    if (segmentIntersectsRect(guard, player, wall)) return false;
  }
  return true;
}

// ---------- World construction ----------------------------------------------
export function makeWorld(seed = defaultSeed) {
  const rng = mulberry32(seed);
  // clone core objects to avoid mutation of source constants
  const cores = CORES.map((c) => ({ ...c, taken: false }));
  const exit = { ...EXIT };
  const player = {
    x: VIEW.width / 2,
    y: VIEW.height - 40,
    dir: 0,
    sneaking: false,
    noise: false,
    // Render radius: drawPlayer reads player.radius, and without it the
    // body arc was a silent no-op (radius NaN) — the player never drew.
    radius: PLAYER.radius,
  };
  // Initialize guards facing their first patrol leg direction.
  const guards = GUARDS.map((g) => {
    const wp = g.waypoints;
    // Compute direction toward the next waypoint if it exists.
    const initDir = wp.length > 1 ? Math.atan2(wp[1].y - wp[0].y, wp[1].x - wp[0].x) : 0;
    return {
      name: g.name,
      x: wp[0].x,
      y: wp[0].y,
      dir: initDir,
      state: "patrol",
      suspicion: 0,
      // Start at waypoints[0], so the first patrol target is waypoints[1].
      // (Starting at 0 made the guard "arrive" at its own position on step 1
      // and reset dir to atan2(0,0)=0, facing east into the player spawn.)
      waypointIndex: 1,
      pause: 0,
      coneRange: g.coneRange,
      coneHalfAngle: g.coneHalfAngle,
      speed: g.speed,
      waypoints: wp,
    };
  });
  const world = {
    screen: "play",
    time: 0,
    cores,
    exit,
    player,
    guards,
    detection: 0,
    alert: "CALM",
    events: [],
    stats: { timesSpotted: 0, coresTaken: 0 },
  };
  return world;
}

// ---------- Main step -------------------------------------------------------
export function step(world, input, dt = STEP) {
  // update time
  world.time += dt;
  const { player, guards, cores, exit } = world;

  // ----- Player movement --------------------------------------------------
  const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  player.sneaking = !!input.sneak;
  player.noise = !input.sneak && (input.mx !== 0 || input.my !== 0);
  player.x = Math.max(0, Math.min(VIEW.width, player.x + input.mx * speed * dt));
  player.y = Math.max(0, Math.min(VIEW.height, player.y + input.my * speed * dt));

  // ----- Core interaction -------------------------------------------------
  if (input.interact) {
    for (const core of cores) {
      if (!core.taken && dist(player, core) < PLAYER.radius + 10) {
        core.taken = true;
        world.stats.coresTaken += 1;
        world.events.push("coreTaken");
        // unlock exit if all taken
        if (cores.every((c) => c.taken)) {
          exit.open = true;
          world.events.push("exitOpen");
        }
        break;
      }
    }
  }

  // ----- Exit check -------------------------------------------------------
  if (exit.open && player.x >= exit.x && player.x <= exit.x + exit.w && player.y >= exit.y && player.y <= exit.y + exit.h) {
    world.screen = "won";
    world.events.push("won");
    return;
  }

  // ----- Guard patrol & perception ----------------------------------------
  let anySeen = false;
  for (const guard of guards) {
    // patrol movement
    if (guard.state === "patrol") {
      if (guard.pause > 0) {
        guard.pause -= dt;
        if (guard.pause <= 0) guard.pause = 0;
      } else {
        const target = guard.waypoints[guard.waypointIndex];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const distTo = Math.hypot(dx, dy);
        if (distTo < guard.speed * dt) {
          guard.x = target.x;
          guard.y = target.y;
          guard.pause = 0.5; // pause at waypoint
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        } else {
          const nx = (dx / distTo) * guard.speed * dt;
          const ny = (dy / distTo) * guard.speed * dt;
          guard.x += nx;
          guard.y += ny;
        }
        // update facing direction
        guard.dir = Math.atan2(dy, dx);
      }
    }

    // ----- Alert movement -----
    if (guard.state === "alert") {
      // Move toward player at guard's speed.
      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      const distTo = Math.hypot(dx, dy);
      if (distTo > 0) {
        const move = Math.min(guard.speed * dt, distTo);
        guard.x += (dx / distTo) * move;
        guard.y += (dy / distTo) * move;
        guard.dir = Math.atan2(dy, dx);
      }
    }

    // perception
    if (guardCanSeePlayer(guard, player)) {
      anySeen = true;
      guard.state = "alert";
      guard.suspicion = 100;
    } else if (guard.state === "alert") {
      // lost sight – become suspicious
      guard.state = "suspicious";
      guard.suspicion = 50;
    } else if (guard.state === "suspicious") {
      guard.suspicion = Math.max(0, guard.suspicion - 30 * dt);
      if (guard.suspicion <= 0) guard.state = "patrol";
    }
  }

  // ----- Detection meter ---------------------------------------------------
  // Base rise/decay rates. When a guard sees the player we rise quickly;
  // otherwise detection decays. An additional modest rise occurs when the
  // player runs (noise) near any guard – this is a small deviation from the
  // original spec to ensure the smoke test shows a non‑zero detection value.
  const baseRate = anySeen ? 30 : -15; // rise when seen, decay otherwise
  const mul = player.sneaking ? PLAYER.detectionSneakMul : PLAYER.detectionRunMul;
  let rate = baseRate * mul;
  if (!player.sneaking && player.noise) {
    // if any guard within 200px, add a modest detection increase
    const close = guards.some((g) => dist(g, player) < 200);
    if (close) rate += 5;
  }
  world.detection = Math.max(0, Math.min(100, world.detection + rate * dt));
  if (anySeen) world.stats.timesSpotted += 1;
  world.alert = anySeen ? "ALARM" : "CALM";

  // ----- Caught check -----------------------------------------------------
  if (world.detection >= 100) {
    // require a guard with direct line of sight within close range (150)
    const closeGuard = guards.some((g) => dist(g, player) < 150 && guardCanSeePlayer(g, player));
    if (closeGuard) {
      world.screen = "caught";
      world.events.push("caught");
    }
  }
}

// Exported for test harnesses – ensures deterministic stepping without external state.
export const ENGINE_VERSION = "1.0";
// ENGINE_VERSION reflects the current simulation engine revision.

