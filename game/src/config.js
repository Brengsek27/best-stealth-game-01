// GHOSTLIGHT simulation core configuration
// This file defines colors, view size, level layout, guard patrols,
// core locations, exit, player stats, and the fixed simulation step.

// ---------- Visual palette -------------------------------------------------
export const PALETTE = {
  // dark surfaces
  floorCharcoal: "#222222",
  floorIndigoBlack: "#0b0f2b",
  // warm accents
  amber: "#ffb84d",
  gold: "#ffd700",
  // metallic trim
  brass: "#b8860b",
  // stealth zones
  tealShadow: "#006e7f",
  // alarm colour
  crimsonAlarm: "#dc143c",
};

// Version identifier for the simulation core – helps external tools verify compatibility.
export const SIM_VERSION = "1.0";

// ---------- View -----------------------------------------------------------
export const VIEW = { width: 1280, height: 720 };

// ---------- Level layout ---------------------------------------------------
// Simple rectangle definitions for walls and cover. Units are in pixels.
// Rooms are identified by name. The layout matches the description in the
// competition brief but is kept minimal for the simulation core.
export const LEVEL = {
  rooms: {
    entrance: { x: 560, y: 680, w: 160, h: 80 },
    exit: { x: 560, y: 0, w: 160, h: 80 },
    westArchive: { x: 0, y: 240, w: 240, h: 240 },
    eastGallery: { x: 1040, y: 240, w: 240, h: 240 },
    northVault: { x: 560, y: 0, w: 240, h: 240 },
  },
  // Walls block line‑of‑sight. Each wall is a rectangle.
  walls: [
    // Example interior wall separating entrance corridor.
    { x: 400, y: 360, w: 480, h: 20 },
  ],
  // Cover objects that reduce detection when between guard and player.
  cover: [
    { x: 300, y: 300, w: 80, h: 80 }, // pillar
    { x: 900, y: 300, w: 80, h: 80 }, // pillar
    { x: 560, y: 400, w: 120, h: 40 }, // crate line
  ],
};

// ---------- Guard definitions ----------------------------------------------
export const GUARDS = [
  {
    name: "Aegis",
    // Waypoints form a loop; guards pause 0.5 s at each point.
    waypoints: [
      { x: 200, y: 360 },
      { x: 1080, y: 360 },
      { x: 1080, y: 200 },
      { x: 200, y: 200 },
    ],
    speed: 80,
    coneRange: 230,
    coneHalfAngle: 35,
  },
  {
    name: "Shade",
    waypoints: [
      { x: 560, y: 600 },
      { x: 560, y: 240 },
    ],
    speed: 70,
    coneRange: 230,
    coneHalfAngle: 35,
  },
  {
    name: "Vigil",
    waypoints: [
      { x: 300, y: 120 },
      { x: 980, y: 120 },
      { x: 980, y: 480 },
      { x: 300, y: 480 },
    ],
    speed: 85,
    coneRange: 230,
    coneHalfAngle: 35,
  },
  {
    name: "Echo",
    waypoints: [
      { x: 560, y: 720 },
      { x: 560, y: 0 },
    ],
    speed: 75,
    coneRange: 230,
    coneHalfAngle: 35,
  },
  {
    name: "Specter",
    waypoints: [
      { x: 200, y: 500 },
      { x: 1080, y: 500 },
    ],
    speed: 65,
    coneRange: 230,
    coneHalfAngle: 35,
  },
];

// ---------- Core positions -------------------------------------------------
export const CORES = [
  { x: 120, y: 300, room: "westArchive" },
  { x: 1160, y: 300, room: "eastGallery" },
  { x: 680, y: 60, room: "northVault" },
];

// ---------- Exit -----------------------------------------------------------
export const EXIT = { x: 560, y: 0, w: 160, h: 80, open: false };

// ---------- Player ----------------------------------------------------------
export const PLAYER = {
  walkSpeed: 150, // units per second
  sneakSpeed: 150 * 0.45,
  radius: 20,
  detectionSneakMul: 0.45,
  detectionRunMul: 1.0,
  noiseRunMul: 1.5,
};

// ---------- Fixed step -----------------------------------------------------
export const STEP = 1 / 60;

