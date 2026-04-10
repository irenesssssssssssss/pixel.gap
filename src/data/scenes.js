

import { TOWN_W, TOWN_H, OFFICE_W, OFFICE_H } from "../constants/game";
import { townBlocking, townGroundTypeAt } from "./townMap";
import { officeBlocking, officeGroundTypeAt } from "./officeMap";
import { keyFor } from "../engine/mapUtils";

export const SCENES = {
  town: {
    w: TOWN_W,
    h: TOWN_H,
    blocking: townBlocking,
    groundTypeAt: townGroundTypeAt,
  },
  office: {
    w: OFFICE_W,
    h: OFFICE_H,
    blocking: officeBlocking,
    groundTypeAt: officeGroundTypeAt,
  },
};

// Tile the player walks onto to enter/exit the office.
export const TOWN_OFFICE_ENTRY = { x: 25, y: 7 };
export const OFFICE_EXIT_TILE  = { x: 21, y: 8 };


export function isWalkable(sceneData, x, y, occupied = new Set()) {
  if (x < 0 || y < 0 || x >= sceneData.w || y >= sceneData.h) return false;
  if (sceneData.blocking.has(keyFor(x, y))) return false;
  if (occupied.has(keyFor(x, y))) return false;
  return true;
}
