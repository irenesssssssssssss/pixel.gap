// All static map data for the town scene.
// The outdoor route is a mostly straight guided walk up the center spine.

import { addRect, makePond, keyFor, line, isInSet } from "../engine/mapUtils";

// ─── Water ────────────────────────────────────────────────────────────────────
export const townWater = new Set();
[
  ...makePond(0, 12, 10, 12, [
    { x: 0, y: 12, w: 2, h: 2 },
    { x: 8, y: 22, w: 2, h: 2 },
  ]),
  ...makePond(41, 25, 6, 5, [{ x: 46, y: 25, w: 1, h: 1 }]),
].forEach((k) => townWater.add(k));

// ─── Paths ────────────────────────────────────────────────────────────────────
export const townPaths = new Set();
[
  ...line(22, 4, 22, 33), ...line(23, 4, 23, 33), ...line(24, 4, 24, 33),
  ...line(25, 4, 25, 33), ...line(26, 4, 26, 33), ...line(27, 4, 27, 33),
  ...line(19, 18, 22, 18), ...line(19, 19, 22, 19),
  ...line(27, 13, 33, 13), ...line(27, 14, 33, 14), ...line(27, 15, 33, 15),
  ...line(27, 8, 40, 8), ...line(27, 9, 40, 9), ...line(27, 10, 40, 10),
].forEach((p) => townPaths.add(keyFor(p.x, p.y)));

// ─── Ground-type zones ────────────────────────────────────────────────────────
export const townDirt = new Set();
addRect(townDirt, 15, 22, 18, 9);
addRect(townDirt, 27, 11, 10, 6);
addRect(townDirt, 34, 6, 10, 6);

export const townAutumn = new Set();
addRect(townAutumn, 0, 20, 20, 14);

export const townDarkGrass = new Set();
addRect(townDarkGrass, 10, 0, 40, 22);

export const townSand = new Set();
addRect(townSand, 0, 12, 10, 12);

export const townCropCells = new Set();
addRect(townCropCells, 15, 26, 5, 2);
addRect(townCropCells, 15, 29, 5, 2);

// ─── Decorative objects ───────────────────────────────────────────────────────
export const townFlowers = [
  // Original placements
  { x: 30, y: 30 }, { x: 32, y: 24 },
  { x: 18, y: 22 }, { x: 20, y: 20 }, { x: 33, y: 12 }, { x: 35, y: 11 },
  { x: 39, y: 11 }, { x: 41, y: 9 }, { x: 44, y: 9 }, { x: 8, y: 18 },
  { x: 12, y: 17 }, { x: 36, y: 24 }, { x: 43, y: 24 }, { x: 47, y: 28 },
  // Autumn zone — south-west meadow
  { x: 3, y: 22 }, { x: 5, y: 25 }, { x: 2, y: 28 }, { x: 7, y: 31 }, { x: 10, y: 33 },
  { x: 13, y: 31 }, { x: 11, y: 28 },
  // Sand zone — near water edge
  { x: 5, y: 16 }, { x: 2, y: 21 },
  // North-east dark grass — open parkland
  { x: 38, y: 16 }, { x: 42, y: 20 }, { x: 48, y: 19 }, { x: 46, y: 15 },
  // Near lodge fencing
  { x: 35, y: 29 }, { x: 37, y: 32 },
  // Cabin area
  { x: 42, y: 31 }, { x: 40, y: 28 },
];

export const townLamps = [
  { x: 21, y: 31 }, { x: 28, y: 31 },
  { x: 21, y: 26 }, { x: 28, y: 26 },
  { x: 21, y: 21 }, { x: 28, y: 21 },
  { x: 21, y: 16 }, { x: 28, y: 16 },
  { x: 21, y: 11 }, { x: 28, y: 11 },
  { x: 31, y: 9 },
  // Council terrace entry lamps
  { x: 38, y: 7 }, { x: 46, y: 7 },
];

export const townCrates = [
  { x: 30, y: 12, color: "#9b6d43" }, { x: 31, y: 12, color: "#b07d50" },
  { x: 32, y: 12, color: "#8e5f36" },
  // { x: 41, y: 11 } removed — now inside council terrace
];

export const townCanalPosts = [
  { x: 10, y: 17 }, { x: 10, y: 20 }, { x: 11, y: 17 }, { x: 11, y: 20 },
];

export const townBridges = [
  { x: 10, y: 18, w: 2, h: 1 },
];

export const townSigns = [
  { x: 20, y: 32, text: "start" },
  { x: 20, y: 27, text: "lookout" },
  { x: 17, y: 19, text: "river" },
  { x: 30, y: 15, text: "works" },
  { x: 30, y: 10, text: "Delaware" },
  { x: 39, y: 14, text: "terrace" }, // moved to south entrance of expanded terrace
];

export const townBenches = [
  { x: 18, y: 18 },
  // { x: 38, y: 8 }, { x: 42, y: 8 } removed — now inside council terrace
  // Extra benches — autumn meadow rest spots
  { x: 6, y: 26 }, { x: 11, y: 30 },
  // Overlooking the pond
  { x: 40, y: 26 },
];

export const townBarrels = [
  // Barrels relocated from terrace — now in the works area
  { x: 30, y: 17, color: "#2f6db3" },
  { x: 31, y: 17, color: "#9acd32" },
  { x: 30, y: 18, color: "#8b5a2b" },
];

export const townRocks = [
  { x: 18, y: 14 }, { x: 16, y: 19 }, { x: 35, y: 13 }, { x: 39, y: 23 }, { x: 48, y: 28 },
  // Extra rocks for natural texture
  { x: 4, y: 19 }, { x: 9, y: 23 }, { x: 44, y: 22 }, { x: 49, y: 27 },
];

export const townFences = [
  ...line(14, 25, 20, 25), ...line(29, 25, 34, 25),
  ...line(14, 31, 20, 31), ...line(29, 31, 34, 31),
  ...line(14, 26, 14, 30), ...line(34, 26, 34, 30),
  ...line(28, 11, 36, 11), ...line(28, 16, 36, 16), ...line(36, 11, 36, 16),
  // Council terrace — expanded 3-sided enclosure (open on west for entry via east path)
  ...line(37, 7, 47, 7), ...line(37, 14, 47, 14), ...line(47, 7, 47, 14),
];

export const townBuildings = [
  { id: "lodge", type: "lodge", x: 29, y: 25, w: 5, h: 5, doorX: 31, doorY: 30 },
  { id: "office", type: "office", x: 22, y: 2, w: 8, h: 5, doorX: 25, doorY: 7 },
  { id: "house-b", type: "house", x: 42, y: 2, w: 6, h: 4, doorX: 45, doorY: 6 },
  { id: "cabin", type: "cabin", x: 44, y: 30, w: 5, h: 4, doorX: 46, doorY: 34 },
];

export const townFarmBeds = [
  { x: 15, y: 26, w: 5, h: 2, crop: "yellow" },
  { x: 15, y: 29, w: 5, h: 2, crop: "green" },
];

export const townStatues = [
  // totem moved out of the council terrace — now near the works area
  { x: 36, y: 17, type: "totem" },
];

// ─── Council terrace — meeting table, chairs, player seat ────────────────────
// Table occupies x=42-45, y=9-11 (4×3 tiles).  Open west side lets player enter.
export const townCouncilTable = { x: 42, y: 9, w: 4, h: 3 };

// Chairs at every seat around the table (always present as outdoor furniture).
// dir = backrest direction (facing the table).
export const townCouncilChairs = [
  { x: 43, y:  8, dir: "down"  }, // Olive   — north centre
  { x: 40, y:  8, dir: "down"  }, // Frank   — north-west
  { x: 46, y:  8, dir: "down"  }, // Otis    — north-east
  { x: 40, y: 11, dir: "right" }, // Suzy    — west
  { x: 46, y: 11, dir: "left"  }, // Hazel   — east
  { x: 42, y: 13, dir: "up"    }, // Daisy   — south-west
  { x: 44, y: 12, dir: "left"  }, // Rowan   — south-east (adjacent to player seat)
  { x: 43, y: 12, dir: "up"    }, // player seat — south-centre
];

// The tile the player must step onto to start the council reflection.
export const COUNCIL_SEAT = {
  id: "councilSeat",
  label: "your seat at the council table",
  x: 43,
  y: 12,
};

// ─── ESG props / route stations ──────────────────────────────────────────────
export const townHazardCones = [
  { x: 27, y: 15 },
  { x: 28, y: 15 },
];

export const townWasteBins = [
  { x: 30, y: 24, kind: "recycling" },
  { x: 31, y: 24, kind: "general" },
  { x: 30, y: 25, kind: "organic" },
];

export const townWaterMarkers = [
  { x: 21, y: 18 },
];

export const townNoticeboards = [
  { x: 17, y: 24 },
];

export const townWatchPosts = [
  { x: 18, y: 24 },
];

export const townMachines = [
  { x: 30, y: 13 },
];

// ─── Trees (generated clusters around the route) ─────────────────────────────
function makeTownTrees() {
  return [
    // Autumn-zone cluster — south-west
    { x: 14, y: 24, style: "autumn" },
    { x: 18, y: 23, style: "autumn" },
    { x: 3,  y: 27, style: "autumn" },
    { x: 8,  y: 32, style: "autumn" },
    // Bright trees near lodge / south area
    { x: 35, y: 25, style: "bright" },
    { x: 37, y: 27, style: "bright" },
    // Sand & water edge — palms
    { x: 8,  y: 14, style: "palm" },
    { x: 3,  y: 15, style: "palm" },
    // Mid-west cluster
    { x: 12, y: 17, style: "autumn" },
    { x: 15, y: 18, style: "bright" },
    // Pine cluster — east works area
    { x: 32, y: 18, style: "pine" },
    { x: 34, y: 19, style: "pine" },
    // North-east parkland
    { x: 39, y: 14, style: "bright" },
    { x: 42, y: 14, style: "bright" },
    { x: 45, y: 16, style: "bright" },
    { x: 47, y: 20, style: "pine" },
    // South-east corner
    { x: 46, y: 25, style: "pine" },
    { x: 48, y: 31, style: "bright" },
    { x: 43, y: 33, style: "bright" },
  ];
}

export const townTrees = makeTownTrees();

// ─── Blocking set ─────────────────────────────────────────────────────────────
export const townBlocking = new Set();
townWater.forEach((k) => townBlocking.add(k));
townFences.forEach((f) => townBlocking.add(keyFor(f.x, f.y)));
townRocks.forEach((r) => townBlocking.add(keyFor(r.x, r.y)));
townSigns.forEach((s) => townBlocking.add(keyFor(s.x, s.y)));
townBenches.forEach((b) => townBlocking.add(keyFor(b.x, b.y)));
townBarrels.forEach((b) => townBlocking.add(keyFor(b.x, b.y)));
townCrates.forEach((c) => townBlocking.add(keyFor(c.x, c.y)));
townLamps.forEach((l) => townBlocking.add(keyFor(l.x, l.y)));
townCanalPosts.forEach((p) => townBlocking.add(keyFor(p.x, p.y)));
townStatues.forEach((s) => townBlocking.add(keyFor(s.x, s.y)));
townTrees.forEach((t) => townBlocking.add(keyFor(t.x, t.y)));
townHazardCones.forEach((c) => townBlocking.add(keyFor(c.x, c.y)));
townWasteBins.forEach((b) => townBlocking.add(keyFor(b.x, b.y)));
townWaterMarkers.forEach((m) => townBlocking.add(keyFor(m.x, m.y)));
townNoticeboards.forEach((n) => townBlocking.add(keyFor(n.x, n.y)));
townWatchPosts.forEach((p) => townBlocking.add(keyFor(p.x, p.y)));
townMachines.forEach((m) => townBlocking.add(keyFor(m.x, m.y)));
townBuildings.forEach((b) => {
  for (let y = b.y; y < b.y + b.h; y++) {
    for (let x = b.x; x < b.x + b.w; x++) {
      townBlocking.add(keyFor(x, y));
    }
  }
});
// Council table tiles are solid — chairs and player seat remain walkable
addRect(townBlocking, townCouncilTable.x, townCouncilTable.y, townCouncilTable.w, townCouncilTable.h);

// ─── Ground type lookup ───────────────────────────────────────────────────────
export function townGroundTypeAt(x, y) {
  if (isInSet(townWater, x, y)) return "water";
  if (isInSet(townPaths, x, y)) return "path";
  if (isInSet(townCropCells, x, y)) return "tilled";
  if (isInSet(townDirt, x, y)) return "dirt";
  if (isInSet(townSand, x, y)) return "sand";
  if (isInSet(townDarkGrass, x, y)) return "darkGrass";
  if (isInSet(townAutumn, x, y)) return "autumnGrass";
  return "grass";
}
