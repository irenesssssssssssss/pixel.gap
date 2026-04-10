
import { OFFICE_W, OFFICE_H } from "../constants/game";
import { addRect, keyFor, isInSet } from "../engine/mapUtils";

// ─── Walls ────────────────────────────────────────────────────────────────────
export const officeWalls = new Set();
addRect(officeWalls, 0, 0, OFFICE_W, 1);
addRect(officeWalls, 0, 0, 1, OFFICE_H);
addRect(officeWalls, OFFICE_W - 1, 0, 1, OFFICE_H);
addRect(officeWalls, 0, OFFICE_H - 1, OFFICE_W, 1);
addRect(officeWalls, 7, 2, 1, 6);
addRect(officeWalls, 7, 10, 1, 5);
addRect(officeWalls, 15, 3, 1, 4);
addRect(officeWalls, 15, 9, 1, 6);
addRect(officeWalls, 17, 6, 5, 1);

// ─── Floor zones ──────────────────────────────────────────────────────────────
export const officeCarpet = new Set();
addRect(officeCarpet, 2, 12, 6, 4);
addRect(officeCarpet, 8, 8, 8, 4);
addRect(officeCarpet, 16, 7, 6, 4);
addRect(officeCarpet, 7, 12, 9, 3);

export const officeMeeting = new Set();
addRect(officeMeeting, 16, 2, 6, 4);
addRect(officeMeeting, 17, 12, 5, 4);
addRect(officeMeeting, 8, 2, 7, 5);

export const officeWood = new Set();
addRect(officeWood, 2, 2, 5, 9);

// ─── Furniture ────────────────────────────────────────────────────────────────
export const officeDesks = [
  { x: 2, y: 3, w: 3, h: 2, computer: true },
  { x: 2, y: 7, w: 3, h: 2, computer: true },
  { x: 9, y: 3, w: 3, h: 2, computer: true },
  { x: 17, y: 3, w: 4, h: 2, computer: false },
];

export const officeCounters = [
  { x: 2, y: 13, w: 3, h: 2, type: "reception" },
  { x: 18, y: 13, w: 3, h: 2, type: "break" },
];

export const officePlants = [
  { x: 6, y: 12 },
  { x: 9, y: 13 },
  { x: 12, y: 7 },
  { x: 16, y: 9 },
  { x: 21, y: 11 },
];

export const officeDecor = [
  { x: 6, y: 2, kind: "window" },
  { x: 10, y: 2, kind: "window" },
  { x: 18, y: 2, kind: "window" },
  { x: 20, y: 6, kind: "whiteboard" },
  { x: 6, y: 13, kind: "trainingkits" },
  { x: 11, y: 9, kind: "paperpile" },
  { x: 15, y: 8, kind: "energymonitor" },
  { x: 17, y: 8, kind: "archivebox" },
  { x: 19, y: 13, kind: "cooler" },
];

export const officeFolder = { x: 12, y: 9, kind: "folder" };

// ─── Blocking set ─────────────────────────────────────────────────────────────
export const officeBlocking = new Set();
officeWalls.forEach((k) => officeBlocking.add(k));
officeDesks.forEach((d) => addRect(officeBlocking, d.x, d.y, d.w, d.h));
officeCounters.forEach((c) => addRect(officeBlocking, c.x, c.y, c.w, c.h));
officePlants.forEach((p) => officeBlocking.add(keyFor(p.x, p.y)));
officeDecor
  .filter((i) => i.kind !== "window" && i.kind !== "whiteboard")
  .forEach((i) => officeBlocking.add(keyFor(i.x, i.y)));

// ─── Ground type lookup ───────────────────────────────────────────────────────
export function officeGroundTypeAt(x, y) {
  if (isInSet(officeWalls, x, y)) return "wall";
  if (isInSet(officeCarpet, x, y)) return "carpet";
  if (isInSet(officeMeeting, x, y)) return "meeting";
  if (isInSet(officeWood, x, y)) return "wood";
  return "officeFloor";
}
