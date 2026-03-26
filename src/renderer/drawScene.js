// Main render function — called every animation frame from GameCanvas.
// Pure: takes all state as params, draws to ctx, returns nothing.
// Dialog/speech is now handled by the HTML DialogOverlay component.

import { TILE, VIEW_COLS, VIEW_ROWS } from "../constants/game";
import { clamp, worldToScreen, rect } from "../engine/mapUtils";
import { SCENES } from "../data/scenes";
import {
  townTrees, townBuildings, townFences, townSigns, townBenches,
  townBarrels, townCrates, townLamps, townCanalPosts, townBridges,
  townRocks, townFlowers, townFarmBeds, townStatues,
  townHazardCones, townWasteBins, townWaterMarkers, townNoticeboards,
  townWatchPosts, townMachines,
  townCouncilTable, townCouncilChairs,
} from "../data/townMap";
import {
  officeDesks, officeCounters, officePlants, officeDecor, officeFolder,
} from "../data/officeMap";
import { drawGround } from "./tiles";
import {
  drawFence, drawSign, drawBench, drawBarrel, drawCrate, drawLamp,
  drawCanalPost, drawBridge, drawRock, drawFlower, drawCropBed, drawTree,
  drawHazardCone, drawWasteBin, drawWaterMarker, drawNoticeboard, drawWatchPost, drawMachine,
  drawCouncilTable, drawChair,
} from "./props";
import { drawBuilding, drawStatue } from "./buildings";
import { drawDesk, drawCounter, drawPlant, drawOfficeDecor } from "./furniture";
import { drawCritter } from "./characters";

export function drawScene(ctx, {
  scene,
  player,
  townNpcs,
  officeNpcs,
  nearbyTarget,
  objectiveTarget,
  viewportWidth,
  viewportHeight,
}) {
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);

  const sceneData = SCENES[scene];
  const camX = clamp(player.x - Math.floor(VIEW_COLS / 2), 0, Math.max(0, sceneData.w - VIEW_COLS));
  const camY = clamp(player.y - Math.floor(VIEW_ROWS / 2), 0, Math.max(0, sceneData.h - VIEW_ROWS));

  // ── Ground layer ──────────────────────────────────────────────────────────
  for (let y = 0; y < VIEW_ROWS; y++) {
    for (let x = 0; x < VIEW_COLS; x++) {
      const wx = camX + x, wy = camY + y;
      if (wx < sceneData.w && wy < sceneData.h)
        drawGround(ctx, scene, wx, wy, x * TILE, y * TILE);
    }
  }

  // ── Build sorted drawable list ────────────────────────────────────────────
  const drawables = [];

  if (scene === "town") {
    townTrees.forEach((d) => drawables.push({ type: "tree",         sortY: d.y,       data: d }));
    townBuildings.forEach((d) => drawables.push({ type: "building", sortY: d.y + d.h, data: d }));
    townFences.forEach((d) => drawables.push({ type: "fence",       sortY: d.y,       data: d }));
    townSigns.forEach((d) => drawables.push({ type: "sign",         sortY: d.y,       data: d }));
    townBenches.forEach((d) => drawables.push({ type: "bench",      sortY: d.y,       data: d }));
    townBarrels.forEach((d) => drawables.push({ type: "barrel",     sortY: d.y,       data: d }));
    townCrates.forEach((d) => drawables.push({ type: "crate",       sortY: d.y,       data: d }));
    townLamps.forEach((d) => drawables.push({ type: "lamp",         sortY: d.y,       data: d }));
    townCanalPosts.forEach((d) => drawables.push({ type: "canalPost", sortY: d.y,     data: d }));
    townBridges.forEach((d) => drawables.push({ type: "bridge",     sortY: d.y + d.h, data: d }));
    townRocks.forEach((d) => drawables.push({ type: "rock",         sortY: d.y,       data: d }));
    townFlowers.forEach((d) => drawables.push({ type: "flower",     sortY: d.y,       data: d }));
    townFarmBeds.forEach((d) => drawables.push({ type: "bed",       sortY: d.y + d.h, data: d }));
    townStatues.forEach((d) => drawables.push({ type: "statue",     sortY: d.y,       data: d }));
    // ESG props
    townHazardCones.forEach((d) => drawables.push({ type: "hazardCone",  sortY: d.y, data: d }));
    townWasteBins.forEach((d) => drawables.push({ type: "wasteBin",      sortY: d.y, data: d }));
    townWaterMarkers.forEach((d) => drawables.push({ type: "waterMarker",sortY: d.y, data: d }));
    townNoticeboards.forEach((d) => drawables.push({ type: "noticeboard",sortY: d.y, data: d }));
    townWatchPosts.forEach((d) => drawables.push({ type: "watchPost", sortY: d.y, data: d }));
    townMachines.forEach((d) => drawables.push({ type: "machine", sortY: d.y, data: d }));
    // Council table sits behind chairs and NPCs at its south edge
    drawables.push({ type: "councilTable", sortY: townCouncilTable.y + townCouncilTable.h, data: townCouncilTable });
    townCouncilChairs.forEach((d) => drawables.push({ type: "chair", sortY: d.y, data: d }));
    townNpcs.forEach((d) => drawables.push({ type: "npc",           sortY: d.y,       data: d }));
  } else {
    officeDesks.forEach((d) => drawables.push({ type: "desk",       sortY: d.y + d.h, data: d }));
    officeCounters.forEach((d) => drawables.push({ type: "counter", sortY: d.y + d.h, data: d }));
    officePlants.forEach((d) => drawables.push({ type: "plant",     sortY: d.y,       data: d }));
    officeDecor.forEach((d) => drawables.push({ type: "decor",      sortY: d.y,       data: d }));
    drawables.push({ type: "decor", sortY: officeFolder.y, data: officeFolder });
    officeNpcs.forEach((d) => drawables.push({ type: "npc",         sortY: d.y,       data: d }));
  }

  drawables.push({ type: "player", sortY: player.y, data: player });
  drawables.sort((a, b) => a.sortY - b.sortY);

  // ── Draw each object ──────────────────────────────────────────────────────
  drawables.forEach(({ type, data }) => {
    const s = worldToScreen(data.x, data.y, camX, camY);
    if (s.x < -64 || s.y < -96 || s.x > viewportWidth + 64 || s.y > viewportHeight + 64) return;

    switch (type) {
      case "tree":        drawTree(ctx, s.x, s.y, data.style); break;
      case "building":    drawBuilding(ctx, data, s.x, s.y); break;
      case "fence":       drawFence(ctx, s.x, s.y); break;
      case "sign":        drawSign(ctx, s.x, s.y, data.text); break;
      case "bench":       drawBench(ctx, s.x, s.y); break;
      case "barrel":      drawBarrel(ctx, s.x, s.y, data.color); break;
      case "crate":       drawCrate(ctx, s.x, s.y, data.color); break;
      case "lamp":        drawLamp(ctx, s.x, s.y); break;
      case "canalPost":   drawCanalPost(ctx, s.x, s.y); break;
      case "bridge":      drawBridge(ctx, s.x, s.y, data.w, data.h); break;
      case "rock":        drawRock(ctx, s.x, s.y); break;
      case "flower":      drawFlower(ctx, s.x, s.y); break;
      case "bed":
        for (let yy = 0; yy < data.h; yy++)
          for (let xx = 0; xx < data.w; xx++) {
            const bs = worldToScreen(data.x + xx, data.y + yy, camX, camY);
            drawCropBed(ctx, bs.x, bs.y, data.crop);
          }
        break;
      case "statue":      drawStatue(ctx, s.x, s.y, data.type); break;
      case "hazardCone":  drawHazardCone(ctx, s.x, s.y); break;
      case "wasteBin":    drawWasteBin(ctx, s.x, s.y, data.kind); break;
      case "waterMarker": drawWaterMarker(ctx, s.x, s.y); break;
      case "noticeboard": drawNoticeboard(ctx, s.x, s.y); break;
      case "watchPost":   drawWatchPost(ctx, s.x, s.y); break;
      case "machine":     drawMachine(ctx, s.x, s.y); break;
      case "councilTable": drawCouncilTable(ctx, s.x, s.y, data.w, data.h); break;
      case "chair":       drawChair(ctx, s.x, s.y, data.dir); break;
      case "desk":        drawDesk(ctx, s.x, s.y, data.w, data.h, data.computer); break;
      case "counter":     drawCounter(ctx, s.x, s.y, data.w, data.h, data.type); break;
      case "plant":       drawPlant(ctx, s.x, s.y); break;
      case "decor":       drawOfficeDecor(ctx, s.x, s.y, data.kind); break;
      case "npc":         drawCritter(ctx, s.x, s.y, data.species, data.dir, data.step || 0, false); break;
      case "player":      drawCritter(ctx, s.x, s.y, "beaver", data.dir, data.step, true); break;
    }
  });

  // ── Interaction hint dot above nearby NPC ─────────────────────────────────
  if (nearbyTarget) {
    const s = worldToScreen(nearbyTarget.x, nearbyTarget.y, camX, camY);
    rect(ctx, s.x + 3, s.y - 10, 10, 8, "rgba(51,70,55,0.25)");
    rect(ctx, s.x + 4, s.y - 9, 8, 6, "#f2f0e8");
    rect(ctx, s.x + 6, s.y - 7, 4, 2, "#8aa07d");
  }

  if (objectiveTarget && objectiveTarget.scene !== scene) return;
  if (objectiveTarget) {
    const s = worldToScreen(objectiveTarget.x, objectiveTarget.y, camX, camY);
    const onScreen = s.x >= -8 && s.y >= -8 && s.x <= viewportWidth - 8 && s.y <= viewportHeight - 8;

    if (onScreen) {
      rect(ctx, s.x - 2, s.y - 3, 20, 20, "rgba(255,245,221,0.2)");
      rect(ctx, s.x + 1, s.y - 19, 14, 5, "#455748");
      rect(ctx, s.x + 3, s.y - 18, 10, 3, "#f4e2a1");
      rect(ctx, s.x + 4, s.y - 14, 8, 8, "#dbc172");
      rect(ctx, s.x + 6, s.y - 12, 4, 4, "#fff6d6");
      rect(ctx, s.x + 5, s.y - 6, 6, 2, "#9b8750");
    } else {
      const edgeX = clamp(s.x + 8, 10, viewportWidth - 18);
      const edgeY = clamp(s.y + 8, 10, viewportHeight - 18);
      rect(ctx, edgeX - 1, edgeY - 1, 12, 12, "#455748");
      rect(ctx, edgeX, edgeY, 10, 10, "#dbc172");
      rect(ctx, edgeX + 3, edgeY + 2, 4, 5, "#fff6d6");
    }
  }
}
