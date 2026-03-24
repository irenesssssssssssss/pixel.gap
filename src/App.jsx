import React, { useEffect, useMemo, useRef, useState } from "react";

const TILE = 16;
const SCALE = 3;
const VIEW_COLS = 22;
const VIEW_ROWS = 14;
const PLAYER_MOVE_MS = 120;
const NPC_MOVE_MS = 520;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const keyFor = (x, y) => `${x},${y}`;
const hash = (x, y) => Math.abs(((x + 17) * 92821 + (y + 29) * 68917) ^ (x * y * 11939));

function line(x1, y1, x2, y2) {
  const points = [];
  if (x1 === x2) {
    const [start, end] = y1 <= y2 ? [y1, y2] : [y2, y1];
    for (let y = start; y <= end; y += 1) points.push({ x: x1, y });
  } else if (y1 === y2) {
    const [start, end] = x1 <= x2 ? [x1, x2] : [x2, x1];
    for (let x = start; x <= end; x += 1) points.push({ x, y: y1 });
  }
  return points;
}

function addRect(set, x, y, w, h) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      set.add(keyFor(xx, yy));
    }
  }
}

function makePond(x, y, w, h, cutouts = []) {
  const cells = new Set();
  addRect(cells, x, y, w, h);
  cutouts.forEach((cut) => addRect(cells, cut.x, cut.y, cut.w, cut.h));
  return cells;
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function outline(ctx, x, y, w, h, color) {
  ctx.strokeStyle = color;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function isInSet(set, x, y) {
  return set.has(keyFor(x, y));
}

const TOWN_W = 50;
const TOWN_H = 34;
const OFFICE_W = 24;
const OFFICE_H = 18;

// ── Town map ─────────────────────────────────────────────────────────────
const townWater = new Set();
[
  ...makePond(2, 2, 7, 5, [{ x: 2, y: 2, w: 2, h: 1 }, { x: 8, y: 6, w: 1, h: 1 }]),
  ...makePond(0, 27, 5, 4, [{ x: 4, y: 27, w: 1, h: 1 }]),
].forEach((cellKey) => townWater.add(cellKey));

const townPaths = new Set();
[
  ...line(22, 0, 22, 27),
  ...line(23, 0, 23, 27),
  ...line(24, 0, 24, 27),
  ...line(10, 14, 42, 14),
  ...line(10, 15, 42, 15),
  ...line(10, 16, 42, 16),
  ...line(6, 22, 19, 22),
  ...line(6, 23, 19, 23),
  ...line(6, 24, 19, 24),
  ...line(15, 21, 15, 31),
  ...line(16, 21, 16, 31),
  ...line(17, 21, 17, 31),
  ...line(33, 6, 39, 6),
  ...line(33, 7, 39, 7),
].forEach((p) => townPaths.add(keyFor(p.x, p.y)));

const townDirt = new Set();
addRect(townDirt, 5, 21, 14, 11);
addRect(townDirt, 6, 20, 13, 2);

const townAutumn = new Set();
addRect(townAutumn, 0, 5, 20, 17);

const townDarkGrass = new Set();
addRect(townDarkGrass, 28, 18, 22, 16);

const townSand = new Set();
addRect(townSand, 0, 0, 8, 3);

const townCropCells = new Set();
addRect(townCropCells, 7, 24, 4, 2);
addRect(townCropCells, 12, 24, 4, 2);
addRect(townCropCells, 7, 28, 4, 2);
addRect(townCropCells, 12, 28, 4, 2);

const townFlowers = [
  { x: 36, y: 10 },
  { x: 37, y: 10 },
  { x: 38, y: 11 },
  { x: 39, y: 11 },
  { x: 33, y: 20 },
  { x: 34, y: 20 },
  { x: 35, y: 20 },
  { x: 7, y: 7 },
  { x: 8, y: 18 },
  { x: 3, y: 18 },
  { x: 12, y: 26 },
  { x: 26, y: 12 },
  { x: 27, y: 12 },
  { x: 28, y: 12 },
  { x: 30, y: 18 },
  { x: 31, y: 18 },
];

const townLamps = [
  { x: 21, y: 12 },
  { x: 25, y: 12 },
  { x: 29, y: 14 },
  { x: 33, y: 14 },
  { x: 37, y: 14 },
];

const townCrates = [
  { x: 30, y: 8, color: "#9b6d43" },
  { x: 31, y: 8, color: "#b07d50" },
  { x: 27, y: 22, color: "#8e5f36" },
  { x: 28, y: 22, color: "#b78654" },
];

const townCanalPosts = [
  { x: 9, y: 2 },
  { x: 9, y: 4 },
  { x: 9, y: 6 },
  { x: 5, y: 26 },
  { x: 5, y: 28 },
];

const townBridges = [
  { x: 8, y: 4, w: 2, h: 1 },
  { x: 4, y: 28, w: 2, h: 1 },
];

const townSigns = [
  { x: 17, y: 17, text: "inn" },
  { x: 36, y: 14, text: "town" },
  { x: 15, y: 30, text: "farm" },
  { x: 37, y: 8, text: "office" },
];

const townBenches = [
  { x: 11, y: 22 },
  { x: 14, y: 22 },
  { x: 35, y: 8 },
];

const townBarrels = [
  { x: 48, y: 29, color: "#2f6db3" },
  { x: 49, y: 29, color: "#9acd32" },
  { x: 47, y: 29, color: "#8b5a2b" },
];

const townRocks = [
  { x: 17, y: 8 },
  { x: 18, y: 8 },
  { x: 18, y: 10 },
  { x: 43, y: 17 },
  { x: 41, y: 26 },
];

const townFences = [
  ...line(19, 21, 27, 21),
  ...line(30, 23, 39, 23),
  ...line(30, 27, 39, 27),
  ...line(39, 23, 39, 27),
  ...line(7, 24, 17, 24),
  ...line(7, 30, 17, 30),
  ...line(6, 25, 6, 29),
  ...line(18, 25, 18, 29),
];

const townBuildings = [
  { id: "lodge", type: "lodge", x: 17, y: 2, w: 16, h: 5, doorX: 24, doorY: 7 },
  { id: "office", type: "office", x: 34, y: 2, w: 8, h: 4, doorX: 37, doorY: 6 },
  { id: "house-b", type: "house", x: 43, y: 2, w: 6, h: 4, doorX: 46, doorY: 6 },
  { id: "cabin", type: "cabin", x: 44, y: 28, w: 5, h: 4, doorX: 46, doorY: 32 },
];

const townFarmBeds = [
  { x: 7, y: 24, w: 4, h: 2, crop: "yellow" },
  { x: 12, y: 24, w: 4, h: 2, crop: "yellow" },
  { x: 7, y: 28, w: 4, h: 2, crop: "green" },
  { x: 12, y: 28, w: 4, h: 2, crop: "green" },
];

const townStatues = [
  { x: 40, y: 25, type: "owl" },
  { x: 16, y: 21, type: "totem" },
];

function makeTownTrees() {
  const trees = [];
  for (let x = 2; x < 18; x += 2) {
    for (let y = 17; y < 22; y += 2) {
      if ((x + y) % 3 !== 0) trees.push({ x, y, style: "autumn" });
    }
  }
  for (let x = 31; x < 41; x += 2) {
    for (let y = 20; y < 28; y += 2) {
      if ((x + y) % 4 !== 1) trees.push({ x, y, style: "pine" });
    }
  }
  trees.push({ x: 10, y: 8, style: "palm" });
  trees.push({ x: 13, y: 7, style: "autumn" });
  trees.push({ x: 6, y: 8, style: "palm" });
  trees.push({ x: 45, y: 21, style: "bright" });
  trees.push({ x: 47, y: 8, style: "bright" });
  trees.push({ x: 25, y: 1, style: "bright" });
  trees.push({ x: 28, y: 1, style: "bright" });
  trees.push({ x: 31, y: 9, style: "bright" });
  return trees;
}

const townTrees = makeTownTrees();
const townBlocking = new Set();
townWater.forEach((cell) => townBlocking.add(cell));
townFences.forEach((cell) => townBlocking.add(keyFor(cell.x, cell.y)));
townRocks.forEach((rock) => townBlocking.add(keyFor(rock.x, rock.y)));
townSigns.forEach((sign) => townBlocking.add(keyFor(sign.x, sign.y)));
townBenches.forEach((bench) => townBlocking.add(keyFor(bench.x, bench.y)));
townBarrels.forEach((barrel) => townBlocking.add(keyFor(barrel.x, barrel.y)));
townCrates.forEach((crate) => townBlocking.add(keyFor(crate.x, crate.y)));
townLamps.forEach((lamp) => townBlocking.add(keyFor(lamp.x, lamp.y)));
townCanalPosts.forEach((post) => townBlocking.add(keyFor(post.x, post.y)));
townStatues.forEach((statue) => townBlocking.add(keyFor(statue.x, statue.y)));
townTrees.forEach((tree) => townBlocking.add(keyFor(tree.x, tree.y)));
townBuildings.forEach((building) => {
  for (let y = building.y; y < building.y + building.h; y += 1) {
    for (let x = building.x; x < building.x + building.w; x += 1) {
      townBlocking.add(keyFor(x, y));
    }
  }
});

function townGroundTypeAt(x, y) {
  if (isInSet(townWater, x, y)) return "water";
  if (isInSet(townPaths, x, y)) return "path";
  if (isInSet(townCropCells, x, y)) return "tilled";
  if (isInSet(townDirt, x, y)) return "dirt";
  if (isInSet(townSand, x, y)) return "sand";
  if (isInSet(townDarkGrass, x, y)) return "darkGrass";
  if (isInSet(townAutumn, x, y)) return "autumnGrass";
  return "grass";
}

// ── Office map ───────────────────────────────────────────────────────────
const officeWalls = new Set();
addRect(officeWalls, 0, 0, OFFICE_W, 1);
addRect(officeWalls, 0, 0, 1, OFFICE_H);
addRect(officeWalls, OFFICE_W - 1, 0, 1, OFFICE_H);
addRect(officeWalls, 0, OFFICE_H - 1, OFFICE_W, 1);
addRect(officeWalls, 14, 2, 1, 8);
addRect(officeWalls, 16, 11, 7, 1);

const officeCarpet = new Set();
addRect(officeCarpet, 8, 12, 8, 4);
addRect(officeCarpet, 8, 2, 4, 4);

const officeMeeting = new Set();
addRect(officeMeeting, 16, 2, 6, 8);

const officeWood = new Set();
addRect(officeWood, 2, 2, 11, 8);
addRect(officeWood, 16, 12, 6, 4);

const officeDesks = [
  { x: 3, y: 3, w: 3, h: 2, computer: true },
  { x: 8, y: 3, w: 3, h: 2, computer: true },
  { x: 3, y: 7, w: 3, h: 2, computer: true },
  { x: 8, y: 7, w: 3, h: 2, computer: true },
  { x: 17, y: 4, w: 4, h: 2, computer: false },
];

const officeCounters = [
  { x: 9, y: 13, w: 4, h: 2, type: "reception" },
  { x: 17, y: 13, w: 3, h: 2, type: "break" },
];

const officePlants = [
  { x: 2, y: 14 },
  { x: 5, y: 14 },
  { x: 20, y: 13 },
  { x: 21, y: 4 },
];

const officeDecor = [
  { x: 11, y: 2, kind: "printer" },
  { x: 18, y: 13, kind: "cooler" },
  { x: 18, y: 8, kind: "whiteboard" },
  { x: 5, y: 2, kind: "window" },
  { x: 8, y: 2, kind: "window" },
  { x: 18, y: 2, kind: "window" },
];

const officeFolder = { x: 19, y: 14, kind: "folder" };
const officeBlocking = new Set();
officeWalls.forEach((cell) => officeBlocking.add(cell));
officeDesks.forEach((desk) => addRect(officeBlocking, desk.x, desk.y, desk.w, desk.h));
officeCounters.forEach((counter) => addRect(officeBlocking, counter.x, counter.y, counter.w, counter.h));
officePlants.forEach((plant) => officeBlocking.add(keyFor(plant.x, plant.y)));
officeDecor
  .filter((item) => item.kind !== "window" && item.kind !== "whiteboard")
  .forEach((item) => officeBlocking.add(keyFor(item.x, item.y)));

function officeGroundTypeAt(x, y) {
  if (isInSet(officeWalls, x, y)) return "wall";
  if (isInSet(officeCarpet, x, y)) return "carpet";
  if (isInSet(officeMeeting, x, y)) return "meeting";
  if (isInSet(officeWood, x, y)) return "wood";
  return "officeFloor";
}

const SCENES = {
  town: { w: TOWN_W, h: TOWN_H, blocking: townBlocking, groundTypeAt: townGroundTypeAt },
  office: { w: OFFICE_W, h: OFFICE_H, blocking: officeBlocking, groundTypeAt: officeGroundTypeAt },
};

const TOWN_OFFICE_ENTRY = { x: 37, y: 6 };
const OFFICE_EXIT_TILE = { x: 12, y: 15 };

function drawGrassTile(ctx, x, y, dark = false) {
  const base = dark ? "#22695b" : "#68b640";
  const shade = dark ? "#1a564a" : "#4f972f";
  const light = dark ? "#2f8d78" : "#8cdc56";
  rect(ctx, x, y, TILE, TILE, base);
  const h = hash(x, y);
  rect(ctx, x, y, TILE, 2, light);
  rect(ctx, x + (h % 5), y + 4, 1, 4, shade);
  rect(ctx, x + 5 + ((h >> 2) % 4), y + 7, 1, 3, shade);
  rect(ctx, x + 2 + ((h >> 3) % 3), y + 10, 2, 1, light);
  rect(ctx, x + 10, y + 5 + ((h >> 4) % 3), 1, 4, light);
}

function drawAutumnTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#d86a48");
  rect(ctx, x, y, TILE, 2, "#f29c52");
  rect(ctx, x + 2, y + 6, 1, 3, "#b14b35");
  rect(ctx, x + 10, y + 9, 1, 3, "#f3c15d");
  rect(ctx, x + 5, y + 11, 2, 1, "#f7da77");
}

function drawPathTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#cde3df");
  rect(ctx, x, y, TILE, 2, "#e8f6f3");
  rect(ctx, x + 3, y + 3, 4, 1, "#b3cbc6");
  rect(ctx, x + 9, y + 9, 4, 1, "#b3cbc6");
  rect(ctx, x + 6, y + 12, 3, 1, "#d7edeb");
}

function drawDirtTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#c89b60");
  rect(ctx, x, y, TILE, 2, "#ddb176");
  rect(ctx, x + 2, y + 5, 10, 1, "#b6844f");
  rect(ctx, x + 4, y + 10, 8, 1, "#b6844f");
}

function drawTilledTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#8a6137");
  rect(ctx, x, y, TILE, 2, "#a87946");
  for (let row = 3; row < 15; row += 4) rect(ctx, x + 2, y + row, 12, 1, "#6e4a2b");
}

function drawSandTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#edd9a0");
  rect(ctx, x, y, TILE, 2, "#f7e8bc");
  rect(ctx, x + 3, y + 8, 2, 1, "#cfbb83");
  rect(ctx, x + 11, y + 5, 2, 1, "#cfbb83");
}

function drawWaterTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#2fb7df");
  rect(ctx, x, y, TILE, 2, "#75e5ff");
  rect(ctx, x + 2, y + 5, 10, 1, "#75d7f4");
  rect(ctx, x + 5, y + 10, 8, 1, "#1d91c4");
}

function drawOfficeFloorTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#dfe7ea");
  rect(ctx, x, y, TILE, 2, "#f4f8fa");
  rect(ctx, x + 3, y + 6, 10, 1, "#c7d1d7");
}

function drawOfficeCarpetTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#5c7cba");
  rect(ctx, x, y, TILE, 2, "#7f96d8");
  rect(ctx, x + 3, y + 4, 8, 1, "#4d6aa0");
  rect(ctx, x + 5, y + 10, 6, 1, "#90a4dc");
}

function drawOfficeMeetingTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#bcc6dd");
  rect(ctx, x, y, TILE, 2, "#d9e1f1");
  rect(ctx, x + 2, y + 8, 12, 1, "#a0acc7");
}

function drawWoodTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#c89962");
  rect(ctx, x, y, TILE, 2, "#dbaf7d");
  rect(ctx, x + 1, y + 5, 14, 1, "#ae7b48");
  rect(ctx, x + 1, y + 10, 14, 1, "#ae7b48");
}

function drawWallTile(ctx, x, y) {
  rect(ctx, x, y, TILE, TILE, "#8d95a1");
  rect(ctx, x, y, TILE, 2, "#b3bac4");
  rect(ctx, x + 4, y + 5, 8, 1, "#6f7580");
  rect(ctx, x + 4, y + 10, 8, 1, "#6f7580");
}

function drawGround(ctx, sceneKey, worldX, worldY, screenX, screenY) {
  const type = SCENES[sceneKey].groundTypeAt(worldX, worldY);
  if (type === "grass") drawGrassTile(ctx, screenX, screenY, false);
  else if (type === "darkGrass") drawGrassTile(ctx, screenX, screenY, true);
  else if (type === "autumnGrass") drawAutumnTile(ctx, screenX, screenY);
  else if (type === "path") drawPathTile(ctx, screenX, screenY);
  else if (type === "dirt") drawDirtTile(ctx, screenX, screenY);
  else if (type === "tilled") drawTilledTile(ctx, screenX, screenY);
  else if (type === "sand") drawSandTile(ctx, screenX, screenY);
  else if (type === "water") drawWaterTile(ctx, screenX, screenY);
  else if (type === "officeFloor") drawOfficeFloorTile(ctx, screenX, screenY);
  else if (type === "carpet") drawOfficeCarpetTile(ctx, screenX, screenY);
  else if (type === "meeting") drawOfficeMeetingTile(ctx, screenX, screenY);
  else if (type === "wood") drawWoodTile(ctx, screenX, screenY);
  else if (type === "wall") drawWallTile(ctx, screenX, screenY);

  rect(ctx, screenX, screenY + TILE - 1, TILE, 1, "rgba(0,0,0,0.08)");
  rect(ctx, screenX + TILE - 1, screenY, 1, TILE, "rgba(255,255,255,0.04)");
}

function drawFence(ctx, x, y) {
  rect(ctx, x + 6, y + 2, 4, 12, "#f0efe8");
  rect(ctx, x, y + 5, TILE, 3, "#d8d7d1");
  rect(ctx, x, y + 9, TILE, 2, "#b6b5ae");
}

function drawSign(ctx, x, y, text) {
  rect(ctx, x + 5, y + 7, 6, 8, "#8a5e2c");
  rect(ctx, x + 2, y + 2, 12, 7, "#c9944e");
  outline(ctx, x + 2, y + 2, 12, 7, "#78461d");
  ctx.fillStyle = "#5b3514";
  ctx.font = "5px sans-serif";
  ctx.fillText(text, x + 3, y + 7);
}

function drawBench(ctx, x, y) {
  rect(ctx, x + 1, y + 8, 14, 3, "#8f5a36");
  rect(ctx, x + 1, y + 4, 14, 3, "#a56d43");
  rect(ctx, x + 3, y + 2, 2, 12, "#6e4328");
  rect(ctx, x + 11, y + 2, 2, 12, "#6e4328");
}

function drawBarrel(ctx, x, y, color) {
  rect(ctx, x + 2, y + 2, 12, 12, color);
  rect(ctx, x + 2, y + 4, 12, 2, "#1f2937");
  rect(ctx, x + 2, y + 10, 12, 2, "#1f2937");
  outline(ctx, x + 2, y + 2, 12, 12, "#0f172a");
}

function drawCrate(ctx, x, y, color) {
  rect(ctx, x + 2, y + 2, 12, 12, color);
  rect(ctx, x + 3, y + 3, 10, 2, "rgba(255,255,255,0.18)");
  rect(ctx, x + 3, y + 7, 10, 1, "#6d4a2a");
  rect(ctx, x + 7, y + 3, 1, 10, "#6d4a2a");
  outline(ctx, x + 2, y + 2, 12, 12, "#5a3b20");
}

function drawLamp(ctx, x, y) {
  rect(ctx, x + 7, y + 3, 2, 11, "#44505d");
  rect(ctx, x + 5, y + 1, 6, 4, "#ffd36b");
  rect(ctx, x + 6, y + 2, 4, 2, "#fff1b8");
  rect(ctx, x + 4, y + 13, 8, 2, "rgba(0,0,0,0.18)");
}

function drawCanalPost(ctx, x, y) {
  rect(ctx, x + 5, y + 4, 6, 10, "#8a5e2c");
  rect(ctx, x + 4, y + 3, 8, 2, "#b07b3d");
}

function drawBridge(ctx, x, y, w, h) {
  rect(ctx, x, y + 4, w * TILE, 8, "#9b6a3e");
  for (let xx = 2; xx < w * TILE; xx += 5) rect(ctx, x + xx, y + 5, 2, 6, "#c08a58");
  rect(ctx, x, y + 3, w * TILE, 1, "#704723");
  rect(ctx, x, y + 12, w * TILE, 1, "#704723");
}

function drawRock(ctx, x, y) {
  rect(ctx, x + 2, y + 6, 12, 8, "#9ca3af");
  rect(ctx, x + 4, y + 4, 8, 3, "#d1d5db");
  rect(ctx, x + 7, y + 9, 2, 1, "#6b7280");
}

function drawFlower(ctx, x, y) {
  rect(ctx, x + 7, y + 7, 2, 5, "#317f36");
  rect(ctx, x + 5, y + 4, 3, 3, "#ffffff");
  rect(ctx, x + 8, y + 4, 3, 3, "#f472b6");
}

function drawCropBed(ctx, x, y, crop) {
  const flower = crop === "yellow" ? "#f5c542" : "#4ade80";
  for (let xx = 2; xx < 16; xx += 6) {
    rect(ctx, x + xx, y + 8, 2, 5, "#2f7b33");
    rect(ctx, x + xx - 1, y + 5, 4, 4, flower);
  }
}

function drawTree(ctx, x, y, style) {
  const trunk = style === "palm" ? "#5a3821" : "#7a4c29";
  rect(ctx, x + 6, y + 9, 4, 7, trunk);
  if (style === "pine") {
    rect(ctx, x + 1, y + 7, 14, 5, "#0f6a68");
    rect(ctx, x + 2, y + 4, 12, 5, "#138079");
    rect(ctx, x + 4, y + 1, 8, 5, "#1da093");
  } else if (style === "palm") {
    rect(ctx, x + 6, y + 2, 4, 8, "#6c4325");
    rect(ctx, x + 1, y + 2, 14, 3, "#75b24a");
    rect(ctx, x + 0, y + 5, 6, 2, "#4b8e30");
    rect(ctx, x + 10, y + 5, 6, 2, "#4b8e30");
    rect(ctx, x + 3, y + 0, 10, 2, "#88cc58");
  } else if (style === "autumn") {
    rect(ctx, x + 1, y + 3, 14, 8, "#9d713a");
    rect(ctx, x + 3, y + 1, 10, 5, "#d9b16b");
    rect(ctx, x + 5, y + 5, 3, 2, "#8a5a2c");
  } else {
    rect(ctx, x + 1, y + 4, 14, 8, "#54ad2d");
    rect(ctx, x + 3, y + 1, 10, 5, "#89d449");
    rect(ctx, x + 5, y + 6, 3, 2, "#37781b");
  }
  rect(ctx, x + 4, y + 14, 8, 2, "rgba(0,0,0,0.18)");
}

function drawHouse(ctx, building, x, y) {
  const px = x;
  const py = y - TILE * 2;
  const width = building.w * TILE;
  const height = building.h * TILE + TILE * 2;
  rect(ctx, px + 2, py + 12, width - 4, height - 14, "#fbfaf8");
  rect(ctx, px, py + 6, width, 18, building.type === "office" ? "#2a6f9b" : "#613221");
  rect(ctx, px + 3, py + 3, width - 6, 8, building.type === "office" ? "#4b9ad0" : "#7f422d");
  if (building.type === "office") {
    rect(ctx, px + 8, py + 28, width - 16, 12, "#b6d8f3");
    rect(ctx, px + 8, py + 28, width - 16, 2, "#e9f7ff");
    rect(ctx, px + width / 2 - 7, py + 36, 14, 16, "#28445d");
    rect(ctx, px + width / 2 - 4, py + 39, 8, 10, "#6dc6f0");
  } else {
    rect(ctx, px + 8, py + 28, 12, 10, "#b7c6ee");
    rect(ctx, px + width - 20, py + 28, 12, 10, "#b7c6ee");
    rect(ctx, px + width / 2 - 6, py + 34, 12, 14, "#6a4d2f");
    rect(ctx, px + width / 2 - 5, py + 36, 10, 10, "#845f39");
  }
}

function drawLodge(ctx, building, x, y) {
  const px = x;
  const py = y - TILE * 2;
  const width = building.w * TILE;
  rect(ctx, px, py + 8, width, 18, "#5a3720");
  rect(ctx, px + 3, py + 3, width - 6, 10, "#6e4429");
  rect(ctx, px + 5, py + 24, width - 10, 40, "#8c5d37");
  for (let i = 0; i < 5; i += 1) {
    rect(ctx, px + 18 + i * 40, py + 34, 16, 10, "#b4bce2");
    rect(ctx, px + 18 + i * 40, py + 34, 16, 2, "#dce2f6");
  }
  rect(ctx, px + width / 2 - 12, py + 44, 24, 20, "#5d4129");
  rect(ctx, px + width / 2 - 10, py + 46, 20, 16, "#765233");
}

function drawCabin(ctx, building, x, y) {
  const px = x;
  const py = y - TILE;
  const width = building.w * TILE;
  rect(ctx, px, py + 8, width, 16, "#cc7d2e");
  rect(ctx, px + 3, py + 3, width - 6, 10, "#7f4f2e");
  rect(ctx, px + 10, py + 16, 14, 16, "#7d3a2a");
  rect(ctx, px + width - 24, py + 16, 18, 10, "#95c9f1");
}

function drawBuilding(ctx, building, screenX, screenY) {
  if (building.type === "lodge") drawLodge(ctx, building, screenX, screenY);
  else if (building.type === "cabin") drawCabin(ctx, building, screenX, screenY);
  else drawHouse(ctx, building, screenX, screenY);
}

function drawStatue(ctx, x, y, type) {
  rect(ctx, x + 5, y + 8, 6, 8, "#6b7280");
  rect(ctx, x + 4, y + 4, 8, 5, "#8b949f");
  if (type === "owl") {
    rect(ctx, x + 6, y + 2, 4, 3, "#5e6a75");
    rect(ctx, x + 6, y + 0, 1, 2, "#c6f84e");
    rect(ctx, x + 9, y + 0, 1, 2, "#c6f84e");
  } else {
    rect(ctx, x + 4, y + 1, 8, 4, "#7d5a38");
    rect(ctx, x + 7, y + 0, 2, 2, "#a6e36b");
  }
}

function drawDesk(ctx, x, y, w = 3, h = 2, computer = true) {
  rect(ctx, x, y, w * TILE, h * TILE, "#7f5b3b");
  rect(ctx, x, y, w * TILE, 4, "#a77a52");
  rect(ctx, x + 4, y + h * TILE - 5, 4, 5, "#57402b");
  rect(ctx, x + w * TILE - 8, y + h * TILE - 5, 4, 5, "#57402b");
  if (computer) {
    rect(ctx, x + 10, y + 7, 12, 6, "#23354d");
    rect(ctx, x + 12, y + 9, 8, 3, "#8de0ff");
    rect(ctx, x + 14, y + 13, 4, 2, "#2f3b48");
  }
}

function drawCounter(ctx, x, y, w, h, type) {
  rect(ctx, x, y, w * TILE, h * TILE, type === "reception" ? "#4b6886" : "#7b5e4a");
  rect(ctx, x, y, w * TILE, 4, type === "reception" ? "#8fb0d6" : "#b08968");
  if (type === "reception") rect(ctx, x + 12, y + 9, 14, 4, "#d7e4f4");
  if (type === "break") rect(ctx, x + 8, y + 7, 10, 7, "#f3f0ea");
}

function drawPlant(ctx, x, y) {
  rect(ctx, x + 5, y + 10, 6, 5, "#845b33");
  rect(ctx, x + 3, y + 4, 10, 7, "#48a85a");
  rect(ctx, x + 5, y + 1, 6, 5, "#74d47b");
}

function drawOfficeDecor(ctx, x, y, kind) {
  if (kind === "printer") {
    rect(ctx, x + 2, y + 6, 12, 8, "#dfe5ea");
    rect(ctx, x + 4, y + 4, 8, 3, "#a0b1c1");
    rect(ctx, x + 5, y + 10, 6, 2, "#6d7a86");
  } else if (kind === "cooler") {
    rect(ctx, x + 5, y + 4, 6, 11, "#d8e7f5");
    rect(ctx, x + 4, y + 1, 8, 4, "#7fd7ff");
    rect(ctx, x + 6, y + 8, 4, 1, "#346e91");
  } else if (kind === "whiteboard") {
    rect(ctx, x + 1, y + 2, 14, 10, "#fbfdff");
    outline(ctx, x + 1, y + 2, 14, 10, "#64748b");
    rect(ctx, x + 4, y + 6, 7, 1, "#7cc7e8");
    rect(ctx, x + 4, y + 8, 5, 1, "#94d86a");
  } else if (kind === "window") {
    rect(ctx, x + 1, y + 1, 14, 10, "#c8ebff");
    rect(ctx, x + 1, y + 1, 14, 2, "#eaf9ff");
    outline(ctx, x + 1, y + 1, 14, 10, "#91a5b6");
    rect(ctx, x + 7, y + 1, 2, 10, "#91a5b6");
  } else if (kind === "folder") {
    rect(ctx, x + 3, y + 6, 10, 7, "#4c8cff");
    rect(ctx, x + 4, y + 4, 6, 3, "#a3c3ff");
    outline(ctx, x + 3, y + 6, 10, 7, "#1e3a8a");
  }
}

function drawSpeechBubble(ctx, x, y, text) {
  const padding = 6;
  const maxWidth = 170;
  ctx.font = "8px sans-serif";
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth - padding * 2) {
      lines.push(current);
      current = word;
    } else current = next;
  });
  if (current) lines.push(current);
  const width = Math.min(
    maxWidth,
    Math.max(...lines.map((lineText) => ctx.measureText(lineText).width)) + padding * 2
  );
  const height = lines.length * 11 + padding * 2;
  const left = clamp(x - width / 2, 8, VIEW_COLS * TILE - width - 8);
  const top = Math.max(8, y - height - 18);
  rect(ctx, left, top, width, height, "#fffdf8");
  outline(ctx, left, top, width, height, "#434343");
  rect(ctx, x - 4, top + height - 1, 8, 6, "#fffdf8");
  outline(ctx, x - 4, top + height - 1, 8, 6, "#434343");
  ctx.fillStyle = "#2f2f2f";
  lines.forEach((lineText, index) =>
    ctx.fillText(lineText, left + padding, top + padding + 8 + index * 11)
  );
}

function worldToScreen(worldX, worldY, camX, camY) {
  return { x: Math.round((worldX - camX) * TILE), y: Math.round((worldY - camY) * TILE) };
}

function isWalkable(sceneKey, x, y, occupied = new Set()) {
  const scene = SCENES[sceneKey];
  if (x < 0 || y < 0 || x >= scene.w || y >= scene.h) return false;
  if (scene.blocking.has(keyFor(x, y))) return false;
  if (occupied.has(keyFor(x, y))) return false;
  return true;
}

const ANIMAL_PALETTES = {
  beaver: { fur: "#7a4c2d", light: "#d2a074", accent: "#4b8f4a", dark: "#2d1f17" },
  fox: { fur: "#ca6a24", light: "#f5d9be", accent: "#4b8f4a", dark: "#2f1d13" },
  owl: { fur: "#7b6db2", light: "#d7d0f4", accent: "#4f7bcd", dark: "#2b2549" },
  badger: { fur: "#707784", light: "#d6dae2", accent: "#8f6b48", dark: "#22252b" },
  rabbit: { fur: "#dcbfa0", light: "#f3e7d7", accent: "#6cb56f", dark: "#684c39" },
};

function drawCritter(ctx, x, y, species, dir, step, isPlayer = false) {
  const palette = ANIMAL_PALETTES[species] || ANIMAL_PALETTES.beaver;
  rect(ctx, x + 4, y + 14, 8, 2, "rgba(0,0,0,0.18)");

  if (species === "beaver") {
    if (dir === "up") rect(ctx, x + 5, y + 13, 6, 3, "#4a2e16");
    else if (dir === "left") rect(ctx, x + 10, y + 12, 5, 3, "#4a2e16");
    else if (dir === "right") rect(ctx, x + 1, y + 12, 5, 3, "#4a2e16");
    else rect(ctx, x + 5, y + 13, 6, 3, "#5a3416");
  }

  rect(ctx, x + 4, y + 8, 8, 5, palette.accent);
  rect(ctx, x + 5, y + 3, 6, 6, palette.fur);
  rect(ctx, x + 4, y + 9, 8, 5, palette.fur);
  rect(ctx, x + 6, y + 5, 4, 3, palette.light);
  rect(ctx, x + 4, y + 1, 3, 3, palette.fur);
  rect(ctx, x + 9, y + 1, 3, 3, palette.fur);

  if (species === "rabbit") {
    rect(ctx, x + 4, y - 1, 2, 4, palette.light);
    rect(ctx, x + 10, y - 1, 2, 4, palette.light);
  }

  if (species === "owl") {
    rect(ctx, x + 3, y + 3, 2, 2, palette.dark);
    rect(ctx, x + 11, y + 3, 2, 2, palette.dark);
    rect(ctx, x + 6, y + 6, 4, 2, "#f4c542");
  }

  if (dir === "down") {
    rect(ctx, x + 6, y + 5, 1, 1, "#111827");
    rect(ctx, x + 9, y + 5, 1, 1, "#111827");
  } else if (dir === "left") rect(ctx, x + 5, y + 5, 1, 1, "#111827");
  else if (dir === "right") rect(ctx, x + 10, y + 5, 1, 1, "#111827");

  if (isPlayer) rect(ctx, x + 5, y + 8, 6, 1, "#ffffff");

  if (step % 2 === 0) {
    rect(ctx, x + 4, y + 14, 2, 1, palette.dark);
    rect(ctx, x + 10, y + 14, 2, 1, palette.dark);
  } else {
    rect(ctx, x + 3, y + 14, 2, 1, palette.dark);
    rect(ctx, x + 11, y + 14, 2, 1, palette.dark);
  }
}

const TOWN_NPCS_START = [
  {
    id: "gatekeeper",
    x: 24,
    y: 8,
    dir: "down",
    stationary: true,
    species: "badger",
    dialog: "steady paws, little beaver. the office is open today.",
  },
  {
    id: "courier",
    x: 34,
    y: 9,
    dir: "left",
    patrol: { x1: 31, y1: 7, x2: 39, y2: 13 },
    species: "fox",
    dialog: "everyone in that office walks faster when a report is due.",
  },
  {
    id: "farmer",
    x: 15,
    y: 27,
    dir: "down",
    patrol: { x1: 7, y1: 22, x2: 18, y2: 31 },
    species: "rabbit",
    dialog: "i keep the outside running. you handle the spreadsheets.",
  },
  {
    id: "walker",
    x: 22,
    y: 18,
    dir: "down",
    patrol: { x1: 20, y1: 10, x2: 26, y2: 27 },
    species: "owl",
    dialog: "head into the delaware office. sounds like they need help.",
  },
];

const OFFICE_NPCS_START = [
  {
    id: "willow",
    x: 11,
    y: 11,
    dir: "up",
    stationary: true,
    species: "fox",
    dialog: "welcome in. the morning is already chaotic.",
  },
  {
    id: "moss",
    x: 6,
    y: 6,
    dir: "down",
    stationary: true,
    species: "owl",
    dialog: "if you find the folder, i can finish the energy summary.",
  },
  {
    id: "rowan",
    x: 19,
    y: 6,
    dir: "left",
    stationary: true,
    species: "badger",
    dialog: "leaders need stories and numbers. preferably on time.",
  },
  {
    id: "pip",
    x: 4,
    y: 11,
    dir: "right",
    stationary: false,
    patrol: { x1: 2, y1: 10, x2: 7, y2: 14 },
    species: "rabbit",
    dialog: "break room gossip says the blue folder is near the water cooler.",
  },
];

function chooseNpcMove(sceneKey, npc, occupied, player) {
  if (npc.stationary) return { ...npc, step: (npc.step || 0) ^ 1 };

  const dirs = [
    { key: "up", dx: 0, dy: -1 },
    { key: "down", dx: 0, dy: 1 },
    { key: "left", dx: -1, dy: 0 },
    { key: "right", dx: 1, dy: 0 },
  ];

  const valid = dirs.filter((dir) => {
    const nx = npc.x + dir.dx;
    const ny = npc.y + dir.dy;
    if (npc.patrol) {
      if (nx < npc.patrol.x1 || nx > npc.patrol.x2 || ny < npc.patrol.y1 || ny > npc.patrol.y2) {
        return false;
      }
    }
    return isWalkable(sceneKey, nx, ny, occupied) && !(player.x === nx && player.y === ny);
  });

  if (!valid.length) return { ...npc, step: (npc.step || 0) ^ 1 };

  const same = valid.find((d) => d.key === npc.dir);
  const dir = same && Math.random() < 0.55 ? same : valid[Math.floor(Math.random() * valid.length)];

  return {
    ...npc,
    x: npc.x + dir.dx,
    y: npc.y + dir.dy,
    dir: dir.key,
    step: (npc.step || 0) ^ 1,
  };
}

function getTaskLabel(quest) {
  switch (quest.stage) {
    case "goToOffice":
      return "walk into the delaware office building.";
    case "meetReception":
      return "talk to willow at the front desk.";
    case "talkAnalyst":
      return "find moss in the analytics bay.";
    case "findFolder":
      return "pick up the blue audit folder in the break room.";
    case "returnAnalyst":
      return "bring the folder back to moss.";
    case "talkManager":
      return "deliver the finished summary to rowan.";
    case "complete":
      return "shift complete — keep exploring or head back outside.";
    default:
      return "explore.";
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const playerRef = useRef(null);
  const townNpcsRef = useRef(null);
  const officeNpcsRef = useRef(null);
  const dialogTimeoutRef = useRef(null);

  const [scene, setScene] = useState("town");
  const [player, setPlayer] = useState({ x: 24, y: 18, dir: "down", step: 0, species: "beaver" });
  const [townNpcs, setTownNpcs] = useState(() =>
    TOWN_NPCS_START.map((npc, index) => ({ ...npc, step: index % 2 }))
  );
  const [officeNpcs, setOfficeNpcs] = useState(() =>
    OFFICE_NPCS_START.map((npc, index) => ({ ...npc, step: index % 2 }))
  );
  const [quest, setQuest] = useState({ stage: "goToOffice", hasFolder: false });
  const [status, setStatus] = useState("walk into the delaware office building.");
  const [dialog, setDialog] = useState(null);

  playerRef.current = player;
  townNpcsRef.current = townNpcs;
  officeNpcsRef.current = officeNpcs;

  const currentNpcs = scene === "town" ? townNpcs : officeNpcs;

  const nearbyNpc = useMemo(() => {
    return currentNpcs.find((npc) => Math.abs(npc.x - player.x) + Math.abs(npc.y - player.y) === 1) || null;
  }, [currentNpcs, player]);

  const nearbyFolder = useMemo(() => {
    if (scene !== "office" || quest.hasFolder || quest.stage !== "findFolder") return null;
    return Math.abs(officeFolder.x - player.x) + Math.abs(officeFolder.y - player.y) <= 1 ? officeFolder : null;
  }, [scene, player, quest]);

  const viewportWidth = VIEW_COLS * TILE;
  const viewportHeight = VIEW_ROWS * TILE;

  function flashDialog(text, npc = null, duration = 3600) {
    setDialog({ npcId: npc?.id || null, text });
    setStatus(text);
    window.clearTimeout(dialogTimeoutRef.current);
    dialogTimeoutRef.current = window.setTimeout(() => {
      setDialog(null);
      setStatus(getTaskLabel(quest));
    }, duration);
  }

  function enterOffice() {
    setScene("office");
    setPlayer((prev) => ({ ...prev, x: 12, y: 14, dir: "up" }));
    setQuest((prev) => {
      const next = prev.stage === "goToOffice" ? { ...prev, stage: "meetReception" } : prev;
      setStatus(getTaskLabel(next));
      return next;
    });
    setDialog(null);
  }

  function exitOffice() {
    setScene("town");
    setPlayer((prev) => ({ ...prev, x: 37, y: 7, dir: "down" }));
    setStatus(
      quest.stage === "complete"
        ? "nice work. you finished the office errand."
        : getTaskLabel(quest)
    );
    setDialog(null);
  }

  function handleNpcInteraction(npc) {
    if (scene === "office") {
      if (npc.id === "willow") {
        if (quest.stage === "meetReception") {
          const next = { ...quest, stage: "talkAnalyst" };
          setQuest(next);
          flashDialog(
            "willow: morning! moss lost the blue energy-audit folder. find him in analytics first.",
            npc
          );
          return;
        }
        flashDialog("willow: front desk update — the whole team is waiting on that summary.", npc);
        return;
      }

      if (npc.id === "moss") {
        if (quest.stage === "talkAnalyst") {
          const next = { ...quest, stage: "findFolder" };
          setQuest(next);
          flashDialog(
            "moss: i was halfway through the sustainability report when the blue folder vanished. check the break room by the water cooler.",
            npc
          );
          return;
        }
        if (quest.stage === "findFolder" && !quest.hasFolder) {
          flashDialog(
            "moss: the folder should be somewhere in the break room. i last had it near the cooler.",
            npc
          );
          return;
        }
        if (quest.stage === "returnAnalyst" && quest.hasFolder) {
          const next = { ...quest, stage: "talkManager" };
          setQuest(next);
          flashDialog(
            "moss: perfect. i can finish the summary now. take the final notes to rowan in the meeting room.",
            npc
          );
          return;
        }
        flashDialog("moss: once rowan has the summary, we can finally breathe.", npc);
        return;
      }

      if (npc.id === "rowan") {
        if (quest.stage === "talkManager") {
          const next = { ...quest, stage: "complete" };
          setQuest(next);
          flashDialog(
            "rowan: good work. this is the kind of small fix that stops reporting gaps from becoming real problems.",
            npc,
            4200
          );
          return;
        }
        flashDialog("rowan: good leaders still need clear signals from the people doing the work.", npc);
        return;
      }

      if (npc.id === "pip") {
        if (quest.stage === "findFolder") {
          flashDialog("pip: i saw a blue folder near the break room counter. it looked important.", npc);
        } else {
          flashDialog("pip: the office feels way calmer when everyone actually talks to each other.", npc);
        }
        return;
      }
    }

    flashDialog(npc.dialog, npc);
  }

  useEffect(() => {
    setStatus(getTaskLabel(quest));
  }, [quest.stage]);

  useEffect(() => {
    function tryMove(dx, dy, dir) {
      setPlayer((prev) => {
        const nx = prev.x + dx;
        const ny = prev.y + dy;
        const occupied = new Set(currentNpcs.map((npc) => keyFor(npc.x, npc.y)));

        if (!isWalkable(scene, nx, ny, occupied)) return { ...prev, dir };

        const nextPlayer = { ...prev, x: nx, y: ny, dir, step: prev.step ^ 1 };

        if (scene === "town" && nx === TOWN_OFFICE_ENTRY.x && ny === TOWN_OFFICE_ENTRY.y) {
          window.setTimeout(() => enterOffice(), 0);
        }

        if (scene === "office" && nx === OFFICE_EXIT_TILE.x && ny === OFFICE_EXIT_TILE.y) {
          window.setTimeout(() => exitOffice(), 0);
        }

        return nextPlayer;
      });
    }

    function interact() {
      if (nearbyFolder) {
        const next = { stage: "returnAnalyst", hasFolder: true };
        setQuest(next);
        flashDialog("you picked up the blue energy-audit folder. bring it back to moss.", null, 2800);
        return;
      }

      if (nearbyNpc) {
        handleNpcInteraction(nearbyNpc);
        return;
      }

      if (
        scene === "town" &&
        Math.abs(playerRef.current.x - TOWN_OFFICE_ENTRY.x) +
          Math.abs(playerRef.current.y - TOWN_OFFICE_ENTRY.y) <=
          1
      ) {
        flashDialog("the delaware office hums softly. step onto the doorway to head inside.", null, 2600);
        return;
      }

      setStatus(getTaskLabel(quest));
    }

    function onKeyDown(event) {
      const accepted = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        "W",
        "A",
        "S",
        "D",
        " ",
      ];
      if (accepted.includes(event.key)) event.preventDefault();
      keysRef.current[event.key] = true;
      if (event.key === " ") interact();
    }

    function onKeyUp(event) {
      keysRef.current[event.key] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let lastMove = 0;
    const movementLoop = window.setInterval(() => {
      const now = Date.now();
      if (now - lastMove < PLAYER_MOVE_MS) return;

      if (keysRef.current.ArrowUp || keysRef.current.w || keysRef.current.W) {
        tryMove(0, -1, "up");
        lastMove = now;
      } else if (keysRef.current.ArrowDown || keysRef.current.s || keysRef.current.S) {
        tryMove(0, 1, "down");
        lastMove = now;
      } else if (keysRef.current.ArrowLeft || keysRef.current.a || keysRef.current.A) {
        tryMove(-1, 0, "left");
        lastMove = now;
      } else if (keysRef.current.ArrowRight || keysRef.current.d || keysRef.current.D) {
        tryMove(1, 0, "right");
        lastMove = now;
      }
    }, 20);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(movementLoop);
      window.clearTimeout(dialogTimeoutRef.current);
    };
  }, [scene, currentNpcs, nearbyNpc, nearbyFolder, quest]);

  // npc movement loop
  useEffect(() => {
    const npcLoop = window.setInterval(() => {
      if (scene === "town") {
        setTownNpcs((prev) =>
          prev.map((npc) => {
            const occupied = new Set(
              prev.filter((other) => other.id !== npc.id).map((other) => keyFor(other.x, other.y))
            );
            return chooseNpcMove("town", npc, occupied, playerRef.current);
          })
        );
      } else {
        setOfficeNpcs((prev) =>
          prev.map((npc) => {
            const occupied = new Set(
              prev.filter((other) => other.id !== npc.id).map((other) => keyFor(other.x, other.y))
            );
            return chooseNpcMove("office", npc, occupied, playerRef.current);
          })
        );
      }
    }, NPC_MOVE_MS);

    return () => window.clearInterval(npcLoop);
  }, [scene]);

  // draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let raf = 0;

    function drawScene() {
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);

      const sceneData = SCENES[scene];
      const camX = clamp(
        playerRef.current.x - Math.floor(VIEW_COLS / 2),
        0,
        Math.max(0, sceneData.w - VIEW_COLS)
      );
      const camY = clamp(
        playerRef.current.y - Math.floor(VIEW_ROWS / 2),
        0,
        Math.max(0, sceneData.h - VIEW_ROWS)
      );

      for (let y = 0; y < VIEW_ROWS; y += 1) {
        for (let x = 0; x < VIEW_COLS; x += 1) {
          const worldX = camX + x;
          const worldY = camY + y;
          if (worldX < sceneData.w && worldY < sceneData.h) {
            drawGround(ctx, scene, worldX, worldY, x * TILE, y * TILE);
          }
        }
      }

      const drawables = [];

      if (scene === "town") {
        townTrees.forEach((tree) => drawables.push({ type: "tree", sortY: tree.y, data: tree }));
        townBuildings.forEach((building) =>
          drawables.push({ type: "building", sortY: building.y + building.h, data: building })
        );
        townFences.forEach((fence) => drawables.push({ type: "fence", sortY: fence.y, data: fence }));
        townSigns.forEach((sign) => drawables.push({ type: "sign", sortY: sign.y, data: sign }));
        townBenches.forEach((bench) => drawables.push({ type: "bench", sortY: bench.y, data: bench }));
        townBarrels.forEach((barrel) => drawables.push({ type: "barrel", sortY: barrel.y, data: barrel }));
        townCrates.forEach((crate) => drawables.push({ type: "crate", sortY: crate.y, data: crate }));
        townLamps.forEach((lamp) => drawables.push({ type: "lamp", sortY: lamp.y, data: lamp }));
        townCanalPosts.forEach((post) =>
          drawables.push({ type: "canalPost", sortY: post.y, data: post })
        );
        townBridges.forEach((bridge) =>
          drawables.push({ type: "bridge", sortY: bridge.y + bridge.h, data: bridge })
        );
        townRocks.forEach((rock) => drawables.push({ type: "rock", sortY: rock.y, data: rock }));
        townFlowers.forEach((flower) =>
          drawables.push({ type: "flower", sortY: flower.y, data: flower })
        );
        townFarmBeds.forEach((bed) => drawables.push({ type: "bed", sortY: bed.y + bed.h, data: bed }));
        townStatues.forEach((statue) =>
          drawables.push({ type: "statue", sortY: statue.y, data: statue })
        );
        townNpcsRef.current.forEach((npc) =>
          drawables.push({ type: "npc", sortY: npc.y, data: npc })
        );
      } else {
        officeDesks.forEach((desk) =>
          drawables.push({ type: "desk", sortY: desk.y + desk.h, data: desk })
        );
        officeCounters.forEach((counter) =>
          drawables.push({ type: "counter", sortY: counter.y + counter.h, data: counter })
        );
        officePlants.forEach((plant) =>
          drawables.push({ type: "plant", sortY: plant.y, data: plant })
        );
        officeDecor.forEach((item) =>
          drawables.push({ type: "decor", sortY: item.y, data: item })
        );
        if (!quest.hasFolder) {
          drawables.push({ type: "decor", sortY: officeFolder.y, data: officeFolder });
        }
        officeNpcsRef.current.forEach((npc) =>
          drawables.push({ type: "npc", sortY: npc.y, data: npc })
        );
      }

      drawables.push({ type: "player", sortY: playerRef.current.y, data: playerRef.current });
      drawables.sort((a, b) => a.sortY - b.sortY);

      drawables.forEach((item) => {
        const data = item.data;
        const screen = worldToScreen(data.x, data.y, camX, camY);

        if (
          screen.x < -64 ||
          screen.y < -96 ||
          screen.x > viewportWidth + 64 ||
          screen.y > viewportHeight + 64
        ) {
          return;
        }

        if (item.type === "tree") drawTree(ctx, screen.x, screen.y, data.style);
        else if (item.type === "building") drawBuilding(ctx, data, screen.x, screen.y);
        else if (item.type === "fence") drawFence(ctx, screen.x, screen.y);
        else if (item.type === "sign") drawSign(ctx, screen.x, screen.y, data.text);
        else if (item.type === "bench") drawBench(ctx, screen.x, screen.y);
        else if (item.type === "barrel") drawBarrel(ctx, screen.x, screen.y, data.color);
        else if (item.type === "crate") drawCrate(ctx, screen.x, screen.y, data.color);
        else if (item.type === "lamp") drawLamp(ctx, screen.x, screen.y);
        else if (item.type === "canalPost") drawCanalPost(ctx, screen.x, screen.y);
        else if (item.type === "bridge") drawBridge(ctx, screen.x, screen.y, data.w, data.h);
        else if (item.type === "rock") drawRock(ctx, screen.x, screen.y);
        else if (item.type === "flower") drawFlower(ctx, screen.x, screen.y);
        else if (item.type === "bed") {
          for (let yy = 0; yy < data.h; yy += 1) {
            for (let xx = 0; xx < data.w; xx += 1) {
              const bedScreen = worldToScreen(data.x + xx, data.y + yy, camX, camY);
              drawCropBed(ctx, bedScreen.x, bedScreen.y, data.crop);
            }
          }
        } else if (item.type === "statue") drawStatue(ctx, screen.x, screen.y, data.type);
        else if (item.type === "desk") drawDesk(ctx, screen.x, screen.y, data.w, data.h, data.computer);
        else if (item.type === "counter")
          drawCounter(ctx, screen.x, screen.y, data.w, data.h, data.type);
        else if (item.type === "plant") drawPlant(ctx, screen.x, screen.y);
        else if (item.type === "decor") drawOfficeDecor(ctx, screen.x, screen.y, data.kind);
        else if (item.type === "npc")
          drawCritter(ctx, screen.x, screen.y, data.species, data.dir, data.step || 0, false);
        else if (item.type === "player")
          drawCritter(ctx, screen.x, screen.y, "beaver", data.dir, data.step, true);
      });

      if (nearbyNpc) {
        const npcScreen = worldToScreen(nearbyNpc.x, nearbyNpc.y, camX, camY);
        rect(ctx, npcScreen.x + 6, npcScreen.y - 5, 4, 4, "#ffffff");
      }

      if (nearbyFolder) {
        const folderScreen = worldToScreen(officeFolder.x, officeFolder.y, camX, camY);
        rect(ctx, folderScreen.x + 6, folderScreen.y - 5, 4, 4, "#9be0ff");
      }

      if (dialog) {
        if (dialog.npcId) {
          const speaker = currentNpcs.find((npc) => npc.id === dialog.npcId);
          if (speaker) {
            const npcScreen = worldToScreen(speaker.x, speaker.y, camX, camY);
            drawSpeechBubble(ctx, npcScreen.x + 8, npcScreen.y - 4, dialog.text);
          }
        } else {
          drawSpeechBubble(ctx, viewportWidth / 2, 28, dialog.text);
        }
      }

      raf = window.requestAnimationFrame(drawScene);
    }

    raf = window.requestAnimationFrame(drawScene);
    return () => window.cancelAnimationFrame(raf);
  }, [scene, dialog, nearbyNpc, nearbyFolder, viewportHeight, viewportWidth, quest.hasFolder, currentNpcs]);

  return (
    <div style={styles.page}>
      <div style={styles.gameWrap}>
        <div style={styles.topBar}>
          <div>
            <div style={styles.kicker}>scenario prototype</div>
            <div style={styles.title}>beaver shift</div>
          </div>
          <div style={styles.statusBlock}>
            <div style={styles.scenePill}>{scene === "town" ? "outside town" : "inside office"}</div>
            <div style={styles.status}>{status}</div>
          </div>
        </div>

        <div style={styles.canvasShell}>
          <canvas
            ref={canvasRef}
            width={viewportWidth}
            height={viewportHeight}
            style={{
              width: viewportWidth * SCALE,
              height: viewportHeight * SCALE,
              imageRendering: "pixelated",
              display: "block",
            }}
          />
        </div>

        <div style={styles.bottomBar}>
          <div style={styles.taskBox}>task: {getTaskLabel(quest)}</div>
          <div style={styles.controls}>move: wasd / arrows · interact: space</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #17345b 0%, #08101d 70%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#eef6ff",
  },
  gameWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "fit-content",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#95d7ff",
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1,
  },
  statusBlock: {
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  scenePill: {
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(149,215,255,0.14)",
    border: "1px solid rgba(149,215,255,0.25)",
    fontSize: 12,
    color: "#d7f0ff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  status: {
    textAlign: "right",
    color: "#dbeafe",
    fontSize: 14,
    lineHeight: 1.5,
  },
  canvasShell: {
    padding: 14,
    borderRadius: 24,
    background: "rgba(3, 8, 18, 0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  },
  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  taskBox: {
    color: "#e6f7ff",
    fontSize: 13,
    background: "rgba(255,255,255,0.06)",
    padding: "8px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  controls: {
    textAlign: "center",
    color: "#9bb7d3",
    fontSize: 13,
  },
};