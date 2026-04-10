import { OWL_HOUSE_H, OWL_HOUSE_W } from "../constants/game";
import { addRect, isInSet, keyFor } from "../engine/mapUtils";

export const owlHouseWalls = new Set();
addRect(owlHouseWalls, 0, 0, OWL_HOUSE_W, 1);
addRect(owlHouseWalls, 0, 0, 1, OWL_HOUSE_H);
addRect(owlHouseWalls, OWL_HOUSE_W - 1, 0, 1, OWL_HOUSE_H);
addRect(owlHouseWalls, 0, OWL_HOUSE_H - 1, OWL_HOUSE_W, 1);

export const owlHouseRug = new Set();
addRect(owlHouseRug, 5, 4, 8, 6);

export const owlHouseWood = new Set();
addRect(owlHouseWood, 1, 1, OWL_HOUSE_W - 2, OWL_HOUSE_H - 2);

export const owlHouseDesks = [
  { x: 3, y: 11, w: 3, h: 2, computer: false },
  { x: 12, y: 11, w: 3, h: 2, computer: false },
];

export const owlHouseCounters = [
  { x: 2, y: 4, w: 3, h: 2, type: "break" },
  { x: 13, y: 4, w: 3, h: 2, type: "break" },
];

export const owlHousePlants = [
  { x: 2, y: 12 },
  { x: 15, y: 12 },
];

export const owlHouseDecor = [
  { x: 2, y: 2, kind: "window" },
  { x: 13, y: 2, kind: "window" },
  { x: 7, y: 2, kind: "whiteboard" },
  { x: 6, y: 10, kind: "trainingkits" },
  { x: 11, y: 10, kind: "archivebox" },
];

export const owlHouseGuide = {
  x: 8,
  y: 7,
  dir: "down",
  species: "owl",
  step: 0,
};

export const owlHouseBlocking = new Set();
owlHouseWalls.forEach((k) => owlHouseBlocking.add(k));
owlHouseDesks.forEach((d) => addRect(owlHouseBlocking, d.x, d.y, d.w, d.h));
owlHouseCounters.forEach((c) => addRect(owlHouseBlocking, c.x, c.y, c.w, c.h));
owlHousePlants.forEach((p) => owlHouseBlocking.add(keyFor(p.x, p.y)));
owlHouseDecor
  .filter((item) => item.kind !== "window" && item.kind !== "whiteboard")
  .forEach((item) => owlHouseBlocking.add(keyFor(item.x, item.y)));
owlHouseBlocking.add(keyFor(owlHouseGuide.x, owlHouseGuide.y));

export function owlHouseGroundTypeAt(x, y) {
  if (isInSet(owlHouseWalls, x, y)) return "wall";
  if (isInSet(owlHouseRug, x, y)) return "meeting";
  if (isInSet(owlHouseWood, x, y)) return "wood";
  return "officeFloor";
}
