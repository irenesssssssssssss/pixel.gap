// Ground tile drawing functions.
// drawGround dispatches to the correct tile function for each scene+position.

import { TILE } from "../constants/game";
import { hash, rect, isInSet } from "../engine/mapUtils";
import { townPaths } from "../data/townMap";
import { SCENES } from "../data/scenes";

// ─── Town ground tiles ────────────────────────────────────────────────────────
export function drawGrassTile(ctx, x, y, dark = false) {
  const base    = dark ? "#6fa870" : "#a8cb94";
  const shade   = dark ? "#527354" : "#7ca06e";
  const light   = dark ? "#92bb8e" : "#c4deb4";
  const lighter = dark ? "#b5cdb1" : "#dcecd0";
  const h = hash(x, y);
  rect(ctx, x, y, TILE, TILE, base);
  rect(ctx, x, y, TILE, 2, lighter);
  rect(ctx, x + (h % 5),            y + 3,  1, 4, shade);
  rect(ctx, x + (h % 5) + 1,        y + 2,  1, 5, lighter);
  rect(ctx, x + 5 + ((h >> 2) % 5), y + 6,  1, 3, shade);
  rect(ctx, x + 6 + ((h >> 2) % 5), y + 5,  1, 4, light);
  rect(ctx, x + 1 + ((h >> 4) % 4), y + 10, 1, 3, shade);
  rect(ctx, x + 2 + ((h >> 4) % 4), y + 9,  1, 4, lighter);
  rect(ctx, x + 10 + ((h >> 6) % 4),y + 4,  1, 4, shade);
  rect(ctx, x + 11 + ((h >> 6) % 4),y + 3,  1, 5, light);
  if (((h >> 8) & 0xf) < 3) rect(ctx, x + 6 + ((h >> 12) % 4), y + 7, 2, 1, lighter);
  rect(ctx, x, y + 14, TILE, 2, shade);
}

export function drawAutumnTile(ctx, x, y) {
  const h = hash(x, y);
  rect(ctx, x, y, TILE, TILE, "#c2d492");
  rect(ctx, x, y, TILE, 2, "#e6f0d4");
  rect(ctx, x + 2,              y + 5,  1, 4, "#8a9860");
  rect(ctx, x + 3,              y + 4,  1, 5, "#dce5c0");
  rect(ctx, x + 9 + (h & 3),   y + 8,  1, 4, "#e0aa80");
  rect(ctx, x + 4 + ((h>>2)&3),y + 11, 2, 1, "#f5ddb8");
  rect(ctx, x + 11,             y + 4,  1, 4, "#dca090");
  rect(ctx, x + 6,              y + 2,  2, 2, "#f8c87a");
  rect(ctx, x, y + 14, TILE, 2, "#849860");
}

export function drawPathTile(ctx, x, y, worldX, worldY) {
  const north = isInSet(townPaths, worldX, worldY - 1);
  const south = isInSet(townPaths, worldX, worldY + 1);
  const west  = isInSet(townPaths, worldX - 1, worldY);
  const east  = isInSet(townPaths, worldX + 1, worldY);

  rect(ctx, x, y, TILE, TILE, "#c3c1b6");
  rect(ctx, x, y, TILE, 2, "#e4e1d8");
  rect(ctx, x, y + 14, TILE, 2, "#9b9689");
  if (!north) rect(ctx, x, y, TILE, 2, "#a7a092");
  if (!south) rect(ctx, x, y + 14, TILE, 2, "#90897c");
  if (!west) rect(ctx, x, y, 2, TILE, "#a7a092");
  if (!east) rect(ctx, x + 14, y, 2, TILE, "#a7a092");
  rect(ctx, x + 2, y + 2, 12, 12, "#ddd9cf");
  rect(ctx, x + 3, y + 3, 10, 2, "#f1eee7");
  rect(ctx, x + 12, y + 4, 1, 9, "#aea696");
  rect(ctx, x + 3, y + 12, 10, 1, "#aea696");
  if (north || south) {
    rect(ctx, x + 5, y, 6, TILE, "#dbd7cd");
    rect(ctx, x + 6, y + 1, 4, 3, "#f4f1ea");
    rect(ctx, x + 7, y + 4, 2, 8, "#e8e3d9");
    rect(ctx, x + 9, y + 2, 1, 12, "#a9a091");
    rect(ctx, x + 6, y + 13, 4, 1, "#a9a091");
  }
  if (west || east) {
    rect(ctx, x, y + 5, TILE, 6, "#d8d3c9");
    rect(ctx, x + 1, y + 6, 5, 2, "#f4f1e9");
    rect(ctx, x + 6, y + 7, 4, 2, "#e7e1d7");
    rect(ctx, x + 2, y + 9, 12, 1, "#a9a091");
    rect(ctx, x + 13, y + 6, 1, 4, "#a9a091");
  }
  if ((north || south) && (west || east)) {
    rect(ctx, x + 4, y + 4, 8, 8, "#e4e0d7");
    rect(ctx, x + 5, y + 5, 5, 2, "#f7f4ed");
    rect(ctx, x + 10, y + 5, 1, 6, "#b0a899");
    rect(ctx, x + 5, y + 10, 5, 1, "#b0a899");
  }
  rect(ctx, x + 1, y + 1, 2, 2, "#f4f1ea");
  rect(ctx, x + 11, y + 2, 2, 2, "#b9b09f");
  rect(ctx, x + 2, y + 11, 3, 2, "#e2ddd3");
  rect(ctx, x + 10, y + 10, 2, 2, "#f6f3ed");
}

export function drawDirtTile(ctx, x, y) {
  const h = hash(x, y);
  rect(ctx, x, y, TILE, TILE, "#c1ab82");
  rect(ctx, x, y, TILE, 2, "#deccaa");
  rect(ctx, x + 2,              y + 5,  10, 1, "#a88d66");
  rect(ctx, x + 4,              y + 9,   8, 1, "#a88d66");
  rect(ctx, x + (h & 3) + 1,   y + 12,  4, 1, "#ead7b2");
  rect(ctx, x, y + 14, TILE, 2, "#907655");
}

export function drawTilledTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#7e5530");
  rect(ctx, x, y, TILE, 2, "#9e6c40");
  for (let row = 3; row < 15; row += 4) {
    rect(ctx, x + 2, y + row,     12, 1, "#5c3a1e");
    rect(ctx, x + 2, y + row + 1, 12, 1, "#8a6035");
  }
  rect(ctx, x, y + 14, TILE, 2, "#5c3a1e");
}

export function drawSandTile(ctx, x, y) {
  const h = hash(x, y);
  rect(ctx, x, y, TILE, TILE, "#ddd1b4");
  rect(ctx, x, y, TILE, 2, "#f0e7d1");
  rect(ctx, x + 3,              y + 6,  2, 1, "#c1af90");
  rect(ctx, x + 10,             y + 4,  2, 1, "#c1af90");
  rect(ctx, x + 7 + (h & 3),   y + 10, 3, 1, "#fbf2df");
  rect(ctx, x + 2 + ((h>>2)&3),y + 13, 2, 1, "#c1af90");
  rect(ctx, x, y + 14, TILE, 2, "#bca98b");
}

export function drawWaterTile(ctx, x, y) {
  const h = hash(x, y);
  rect(ctx, x, y, TILE, TILE, "#78b8c4");
  rect(ctx, x, y, TILE, 2, "#bae4e8");
  // Wave ripples
  rect(ctx, x + 1,              y + 3,  9, 1, "#a4d8dc");
  rect(ctx, x + 2,              y + 4,  7, 1, "#549298");
  rect(ctx, x + 5 + ((h)&3),   y + 7, 10, 1, "#a4d8dc");
  rect(ctx, x + 6 + ((h)&3),   y + 8,  7, 1, "#549298");
  rect(ctx, x + 1,              y + 11, 8, 1, "#a4d8dc");
  rect(ctx, x + 2,              y + 12, 5, 1, "#549298");
  rect(ctx, x + 1 + ((h>>3)&3),y + 12, 6, 1, "#daf4f4");
  // Sparkles
  if (((h>>6) & 0x7) < 2)
    rect(ctx, x + 4 + ((h>>9)&7), y + 5 + ((h>>12)&3), 2, 1, "#f4ffff");
  if (((h>>14) & 0x7) < 1)
    rect(ctx, x + 2 + ((h>>10)&5), y + 10 + ((h>>8)&3), 1, 1, "#e8ffff");
  rect(ctx, x, y + 14, TILE, 2, "#4e8a92");
}

// ─── Office ground tiles ──────────────────────────────────────────────────────
export function drawOfficeFloorTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#e0e6e3");
  rect(ctx, x, y, TILE, 1, "#bcc7c0");
  rect(ctx, x, y, 1, TILE, "#bcc7c0");
  rect(ctx, x + 1, y + 1, 14, 14, "#f0f4f1");
  rect(ctx, x + 2, y + 2, 10, 3, "#fafcfa");
  rect(ctx, x + 12, y + 3, 1, 10, "#c9d3cc");
  rect(ctx, x + 3, y + 12, 9, 1, "#c9d3cc");
  rect(ctx, x, y + 14, TILE, 2, "#aab5ae");
}

export function drawOfficeCarpetTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#7f9583");
  rect(ctx, x, y, TILE, 2, "#a8b8a8");
  rect(ctx, x + 2,  y + 3,  1, 1, "#96aa96");
  rect(ctx, x + 5,  y + 3,  1, 1, "#647665");
  rect(ctx, x + 8,  y + 3,  1, 1, "#96aa96");
  rect(ctx, x + 11, y + 3,  1, 1, "#647665");
  rect(ctx, x + 14, y + 3,  1, 1, "#96aa96");
  rect(ctx, x + 3,  y + 7,  1, 1, "#647665");
  rect(ctx, x + 6,  y + 7,  1, 1, "#96aa96");
  rect(ctx, x + 9,  y + 7,  1, 1, "#647665");
  rect(ctx, x + 12, y + 7,  1, 1, "#96aa96");
  rect(ctx, x + 2,  y + 11, 1, 1, "#96aa96");
  rect(ctx, x + 5,  y + 11, 1, 1, "#647665");
  rect(ctx, x + 8,  y + 11, 1, 1, "#96aa96");
  rect(ctx, x + 11, y + 11, 1, 1, "#647665");
  rect(ctx, x + 14, y + 11, 1, 1, "#96aa96");
  rect(ctx, x + 4, y + 6, 8, 3, "rgba(255,255,255,0.08)");
  rect(ctx, x, y + 14, TILE, 2, "#586a58");
}

export function drawOfficeMeetingTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#c8d0d7");
  rect(ctx, x, y, TILE, 1, "#9ea9b4");
  rect(ctx, x, y, 1, TILE, "#9ea9b4");
  rect(ctx, x + 1, y + 1, 9, 5, "#dde4ea");
  rect(ctx, x + 2, y + 2, 5, 2, "rgba(255,255,255,0.18)");
  rect(ctx, x, y + 14, TILE, 2, "#9ea9b4");
}

export function drawWoodTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#caa37a");
  rect(ctx, x, y, TILE, 2, "#dec0a1");
  rect(ctx, x + 1, y + 5,  14, 1, "#aa835d");
  rect(ctx, x + 1, y + 10, 14, 1, "#aa835d");
}

export function drawWallTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#8a9199");
  rect(ctx, x, y, TILE, 2, "#aeb6c0");
  rect(ctx, x, y, 1, TILE, "#78808a");
  rect(ctx, x + 4, y + 5, 8, 1, "#6e7680");
  rect(ctx, x, y + 12, TILE, 4, "#666e78");
  rect(ctx, x, y + 12, TILE, 1, "#b8c0c8");
  rect(ctx, x, y + 15, TILE, 1, "#404850");
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export function drawGround(ctx, sceneKey, worldX, worldY, screenX, screenY) {
  const type = SCENES[sceneKey].groundTypeAt(worldX, worldY);
  if      (type === "grass")       drawGrassTile(ctx, screenX, screenY, false);
  else if (type === "darkGrass")   drawGrassTile(ctx, screenX, screenY, true);
  else if (type === "autumnGrass") drawAutumnTile(ctx, screenX, screenY);
  else if (type === "path")        drawPathTile(ctx, screenX, screenY, worldX, worldY);
  else if (type === "dirt")        drawDirtTile(ctx, screenX, screenY);
  else if (type === "tilled")      drawTilledTile(ctx, screenX, screenY);
  else if (type === "sand")        drawSandTile(ctx, screenX, screenY);
  else if (type === "water")       drawWaterTile(ctx, screenX, screenY);
  else if (type === "officeFloor") drawOfficeFloorTile(ctx, screenX, screenY);
  else if (type === "carpet")      drawOfficeCarpetTile(ctx, screenX, screenY);
  else if (type === "meeting")     drawOfficeMeetingTile(ctx, screenX, screenY);
  else if (type === "wood")        drawWoodTile(ctx, screenX, screenY);
  else if (type === "wall")        drawWallTile(ctx, screenX, screenY);
  // Depth shadow on every tile
  rect(ctx, screenX, screenY + TILE - 2, TILE, 2, "rgba(0,0,0,0.28)");
  rect(ctx, screenX + TILE - 1, screenY, 1, TILE - 1, "rgba(255,255,255,0.14)");
}
