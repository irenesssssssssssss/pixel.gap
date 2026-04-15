// Main render function — called every animation frame from GameCanvas.
// Pure: takes all state as params, draws to ctx, returns nothing.
// Dialog/speech is now handled by the HTML DialogOverlay component.

import { TILE, VIEW_COLS, VIEW_ROWS } from "../constants/game";
import { clamp, worldToScreen, rect } from "../engine/mapUtils";
import { SCENES, OFFICE_EXIT_TILE, OWL_HOUSE_EXIT_TILE } from "../data/scenes";
import {
  townTrees, townBuildings, townFences, townSigns, townBenches,
  townBarrels, townCrates, townLamps, townCanalPosts, townBridges,
  townRocks, townFlowers, townFarmBeds, townStatues,
  townHazardCones, townWasteBins, townWaterMarkers, townNoticeboards,
  townWatchPosts, townMachines,
  townCouncilTable, townCouncilChairs,
  townBillboards,
} from "../data/townMap";
import {
  officeDesks, officeCounters, officePlants, officeDecor, officeFolder,
} from "../data/officeMap";
import {
  owlHouseCounters,
  owlHouseDecor,
  owlHouseDesks,
  owlHouseGuide,
  owlHousePlants,
} from "../data/owlHouseMap";
import { drawGround } from "./tiles";
import {
  drawBillboard, drawFence, drawSign, drawBench, drawBarrel, drawCrate, drawLamp,
  drawCanalPost, drawBridge, drawRock, drawFlower, drawCropBed, drawTree,
  drawHazardCone, drawWasteBin, drawWaterMarker, drawNoticeboard, drawWatchPost, drawMachine,
  drawCouncilTable, drawChair, drawPixelText,
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

  // ── Exit markers (drawn on top of ground, before sorted objects) ─────────
  function drawExitMarker(wx, wy) {
    const s = worldToScreen(wx, wy, camX, camY);
    if (s.x < -TILE || s.y < -TILE || s.x > viewportWidth + TILE || s.y > viewportHeight + TILE) return;
    const sx = s.x, sy = s.y;

    // Drop-shadow behind each chevron row for crispness
    rect(ctx, sx + 3, sy + 5,  10, 2, "rgba(0,0,0,0.55)");
    rect(ctx, sx + 4, sy + 7,   8, 2, "rgba(0,0,0,0.55)");
    rect(ctx, sx + 5, sy + 9,   6, 2, "rgba(0,0,0,0.55)");
    rect(ctx, sx + 6, sy + 11,  4, 2, "rgba(0,0,0,0.55)");

    // Downward-pointing chevron arrow — solid saturated green
    rect(ctx, sx + 4, sy + 4,  8, 2, "#4ecb38");
    rect(ctx, sx + 5, sy + 6,  6, 2, "#4ecb38");
    rect(ctx, sx + 6, sy + 8,  4, 2, "#4ecb38");
    rect(ctx, sx + 7, sy + 10, 2, 2, "#4ecb38");
    // Top highlight row
    rect(ctx, sx + 4, sy + 4,  8, 1, "#9cf07a");
    rect(ctx, sx + 5, sy + 6,  6, 1, "#9cf07a");
    rect(ctx, sx + 6, sy + 8,  4, 1, "#9cf07a");

    // Pixel sign plate so the label reads clearly against indoor floors
    rect(ctx, sx - 1, sy - 10, 18, 7, "rgba(0,0,0,0.5)");
    rect(ctx, sx,     sy - 11, 18, 7, "#27452c");
    rect(ctx, sx,     sy - 11, 18, 1, "#5f9563");
    rect(ctx, sx,     sy - 5,  18, 1, "#16261a");
    rect(ctx, sx + 1, sy - 10, 16, 5, "#395d3d");
    drawPixelText(ctx, "EXIT", sx + 2, sy - 9, "#eef8d8", 1);
  }

  if (scene === "office")   drawExitMarker(OFFICE_EXIT_TILE.x,    OFFICE_EXIT_TILE.y);
  if (scene === "owlhouse") drawExitMarker(OWL_HOUSE_EXIT_TILE.x, OWL_HOUSE_EXIT_TILE.y);

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
    townBillboards.forEach((d) => drawables.push({ type: "billboard", sortY: d.y + 1,  data: d }));
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
  } else if (scene === "office") {
    officeDesks.forEach((d) => drawables.push({ type: "desk",       sortY: d.y + d.h, data: d }));
    officeCounters.forEach((d) => drawables.push({ type: "counter", sortY: d.y + d.h, data: d }));
    officePlants.forEach((d) => drawables.push({ type: "plant",     sortY: d.y,       data: d }));
    officeDecor.forEach((d) => drawables.push({ type: "decor",      sortY: d.y,       data: d }));
    drawables.push({ type: "decor", sortY: officeFolder.y, data: officeFolder });
    officeNpcs.forEach((d) => drawables.push({ type: "npc",         sortY: d.y,       data: d }));
  } else if (scene === "owlhouse") {
    owlHouseDesks.forEach((d) => drawables.push({ type: "desk", sortY: d.y + d.h, data: d }));
    owlHouseCounters.forEach((d) => drawables.push({ type: "counter", sortY: d.y + d.h, data: d }));
    owlHousePlants.forEach((d) => drawables.push({ type: "plant", sortY: d.y, data: d }));
    owlHouseDecor.forEach((d) => drawables.push({ type: "decor", sortY: d.y, data: d }));
    drawables.push({ type: "npc", sortY: owlHouseGuide.y, data: owlHouseGuide });
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
      case "billboard":   drawBillboard(ctx, s.x, s.y); break;
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
      // Golden star marker above on-screen objective
      rect(ctx, s.x - 2, s.y - 3, 20, 20, "rgba(255,245,221,0.2)");
      rect(ctx, s.x + 1, s.y - 19, 14, 5, "#455748");
      rect(ctx, s.x + 3, s.y - 18, 10, 3, "#f4e2a1");
      rect(ctx, s.x + 4, s.y - 14, 8, 8, "#dbc172");
      rect(ctx, s.x + 6, s.y - 12, 4, 4, "#fff6d6");
      rect(ctx, s.x + 5, s.y - 6, 6, 2, "#9b8750");
    } else {
      // Directional arrow at the viewport edge pointing toward the objective
      const cx = viewportWidth / 2;
      const cy = viewportHeight / 2;
      // Use tile center of the objective as target point
      const tx = s.x + 8;
      const ty = s.y + 8;
      const dx = tx - cx;
      const dy = ty - cy;
      const angle = Math.atan2(dy, dx);
      const margin = 20;

      // Find intersection of the ray with the viewport boundary
      const scaleX = Math.abs(dx) > 0.01 ? (dx > 0 ? (viewportWidth - margin - cx) : (cx - margin)) / Math.abs(dx) : Infinity;
      const scaleY = Math.abs(dy) > 0.01 ? (dy > 0 ? (viewportHeight - margin - cy) : (cy - margin)) / Math.abs(dy) : Infinity;
      const s2     = Math.min(scaleX, scaleY);
      const ax     = Math.round(cx + dx * s2);
      const ay     = Math.round(cy + dy * s2);

      const sz = 9;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);

      // Drop shadow
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.moveTo(-sz + 1,  -sz / 2 + 1);
      ctx.lineTo( sz + 1,            1);
      ctx.lineTo(-sz + 1,   sz / 2 + 1);
      ctx.closePath();
      ctx.fill();

      // Arrow body
      ctx.fillStyle = "#dbc172";
      ctx.beginPath();
      ctx.moveTo(-sz, -sz / 2);
      ctx.lineTo( sz,        0);
      ctx.lineTo(-sz,  sz / 2);
      ctx.closePath();
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = "#fff6d6";
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo( 3,  0);
      ctx.lineTo(-4,  3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }
}
