// Pure utility functions with no game-state dependencies.
// Canvas drawing primitives (rect/outline) live here so every
// renderer file has a single import for low-level helpers.

import { TILE } from "../constants/game";

// ─── Math helpers ─────────────────────────────────────────────────────────────
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const keyFor = (x, y) => `${x},${y}`;
export const hash = (x, y) =>
  Math.abs(((x + 17) * 92821 + (y + 29) * 68917) ^ (x * y * 11939));

// ─── Coordinate helpers ───────────────────────────────────────────────────────
/** Returns all integer points on an axis-aligned segment. */
export function line(x1, y1, x2, y2) {
  const points = [];
  if (x1 === x2) {
    const [s, e] = y1 <= y2 ? [y1, y2] : [y2, y1];
    for (let y = s; y <= e; y++) points.push({ x: x1, y });
  } else if (y1 === y2) {
    const [s, e] = x1 <= x2 ? [x1, x2] : [x2, x1];
    for (let x = s; x <= e; x++) points.push({ x, y: y1 });
  }
  return points;
}

/** Fills a rectangle of keyFor keys into a Set. */
export function addRect(set, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++)
      set.add(keyFor(xx, yy));
}

/** Creates a Set of keys for a filled rect minus optional cutouts. */
export function makePond(x, y, w, h, cutouts = []) {
  const cells = new Set();
  addRect(cells, x, y, w, h);
  cutouts.forEach((c) => {
    for (let yy = c.y; yy < c.y + c.h; yy++)
      for (let xx = c.x; xx < c.x + c.w; xx++)
        cells.delete(keyFor(xx, yy));
  });
  return cells;
}

export function isInSet(set, x, y) {
  return set.has(keyFor(x, y));
}

/** Convert world tile coords to canvas pixel coords given camera offset. */
export function worldToScreen(worldX, worldY, camX, camY) {
  return {
    x: Math.round((worldX - camX) * TILE),
    y: Math.round((worldY - camY) * TILE),
  };
}

// ─── Canvas drawing primitives ────────────────────────────────────────────────
export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function outline(ctx, x, y, w, h, color) {
  ctx.strokeStyle = color;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
