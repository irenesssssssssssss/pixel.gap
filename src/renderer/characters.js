// Character (NPC + player) sprite drawing and speech bubble rendering.

import { rect } from "../engine/mapUtils";
import { clamp } from "../engine/mapUtils";
import { VIEW_COLS, TILE } from "../constants/game";
import { drawPlayerBeaverSprite } from "./beaverSprite";

export const ANIMAL_PALETTES = {
  beaver: { fur: "#7a4c2d", light: "#d2a074", accent: "#4b8f4a", dark: "#2d1f17" },
  fox:    { fur: "#ca6a24", light: "#f5d9be", accent: "#4b8f4a", dark: "#2f1d13" },
  owl:    { fur: "#7b6db2", light: "#d7d0f4", accent: "#4f7bcd", dark: "#2b2549" },
  badger: { fur: "#707784", light: "#d6dae2", accent: "#8f6b48", dark: "#22252b" },
  rabbit: { fur: "#dcbfa0", light: "#f3e7d7", accent: "#6cb56f", dark: "#684c39" },
  fish:   { fur: "#4f86b8", light: "#d7eef9", accent: "#3f6d96", dark: "#203247" },
  otter:  { fur: "#8f6241", light: "#d8b08a", accent: "#4f8f6a", dark: "#312116" },
  sheep:  { fur: "#d7d7d0", light: "#f5f3ec", accent: "#7d9d68", dark: "#5a544e" },
  deer:   { fur: "#b17a4f", light: "#efd2b4", accent: "#6d8c50", dark: "#3d2a20" },
  hedgehog:{ fur: "#82684f", light: "#e2cfbb", accent: "#6f8f68", dark: "#2b231e" },
  hare:   { fur: "#d8bf9f", light: "#f3e6d4", accent: "#7da36d", dark: "#664c39" },
};

export function drawCritter(ctx, x, y, species, dir, step, isPlayer = false) {
  if (species === "beaver") {
    drawPlayerBeaverSprite(ctx, x, y, step, isPlayer);
    return;
  }

  const palette = ANIMAL_PALETTES[species] || ANIMAL_PALETTES.beaver;
  const { fur, light, accent, dark } = palette;

  rect(ctx, x + 1, y + 15, 14, 2, "rgba(0,0,0,0.26)");
  rect(ctx, x + 3, y + 14, 10, 1, "rgba(255,255,255,0.08)");

  // Outline silhouette
  if (species === "rabbit" || species === "hare") {
    rect(ctx, x + 3,  y - 2, 3, 6, dark);
    rect(ctx, x + 10, y - 2, 3, 6, dark);
  }
  rect(ctx, x + 2, y,     4, 4, dark);
  rect(ctx, x + 10, y,    4, 4, dark);
  rect(ctx, x + 3, y + 2,10, 9, dark);
  rect(ctx, x + 2, y + 7,12, 8, dark);

  // Beaver tail
  if (species === "beaver") {
    if      (dir === "up")    rect(ctx, x + 5,  y + 13, 6, 3, "#4a2e16");
    else if (dir === "left")  rect(ctx, x + 10, y + 12, 5, 3, "#4a2e16");
    else if (dir === "right") rect(ctx, x + 1,  y + 12, 5, 3, "#4a2e16");
    else                      rect(ctx, x + 5,  y + 13, 6, 3, "#5a3416");
  }

  // Body shirt
  rect(ctx, x + 3, y + 8,10, 6, accent);
  rect(ctx, x + 3, y + 8,10, 1, "rgba(255,255,255,0.18)");
  rect(ctx, x + 4, y + 9, 1, 4, "rgba(255,255,255,0.24)");
  rect(ctx, x + 11,y + 9, 1, 2, "rgba(255,255,255,0.2)");
  rect(ctx, x + 4, y + 13, 8, 1, "rgba(0,0,0,0.16)");
  rect(ctx, x + 2, y + 10, 1, 3, fur);
  rect(ctx, x + 13, y + 10, 1, 3, fur);

  // Head
  rect(ctx, x + 4, y + 3, 8, 6, fur);
  rect(ctx, x + 5, y + 5, 6, 3, light);
  rect(ctx, x + 5, y + 4, 4, 1, "rgba(255,255,255,0.26)");
  rect(ctx, x + 10, y + 5, 1, 2, "rgba(0,0,0,0.08)");

  // Ears
  rect(ctx, x + 3, y + 1, 3, 3, fur);
  rect(ctx, x + 10, y + 1, 3, 3, fur);
  rect(ctx, x + 4, y + 2, 1, 1, light);
  rect(ctx, x + 11,y + 2, 1, 1, light);

  if (species === "rabbit" || species === "hare") {
    rect(ctx, x + 4,  y - 1, 2, 4, light);
    rect(ctx, x + 10, y - 1, 2, 4, light);
    rect(ctx, x + 4,  y - 1, 1, 3, fur);
    rect(ctx, x + 11, y - 1, 1, 3, fur);
  }
  if (species === "owl") {
    rect(ctx, x + 3,  y + 3, 2, 2, dark);
    rect(ctx, x + 11, y + 3, 2, 2, dark);
    rect(ctx, x + 6,  y + 6, 4, 2, "#f4c542");
    rect(ctx, x + 6,  y + 4, 1, 1, "#fff7dc");
    rect(ctx, x + 9,  y + 4, 1, 1, "#fff7dc");
  }
  if (species === "fish") {
    rect(ctx, x + 1,  y + 7, 2, 4, accent);
    rect(ctx, x + 13, y + 7, 2, 4, accent);
    rect(ctx, x + 7,  y + 11, 2, 3, accent);
    rect(ctx, x + 4,  y + 5, 1, 2, "#d7eef9");
  }
  if (species === "deer") {
    rect(ctx, x + 4, y, 1, 2, dark);
    rect(ctx, x + 11, y, 1, 2, dark);
    rect(ctx, x + 3, y + 2, 1, 1, "#c79b70");
    rect(ctx, x + 12, y + 2, 1, 1, "#c79b70");
  }
  if (species === "hedgehog") {
    rect(ctx, x + 4, y + 2, 8, 2, dark);
    rect(ctx, x + 3, y + 4, 10, 2, dark);
    rect(ctx, x + 4, y + 2, 1, 1, "#b3997f");
    rect(ctx, x + 11, y + 2, 1, 1, "#b3997f");
  }

  // Face — direction-dependent
  if (dir === "down") {
    rect(ctx, x + 6, y + 5, 1, 1, "#ffffff");
    rect(ctx, x + 9, y + 5, 1, 1, "#ffffff");
    rect(ctx, x + 6, y + 5, 1, 1, "#0d0d0d");
    rect(ctx, x + 9, y + 5, 1, 1, "#0d0d0d");
    rect(ctx, x + 7, y + 7, 2, 1, "#e88080");
    rect(ctx, x + 7, y + 8, 1, 1, "#f4b0b0");
    rect(ctx, x + 8, y + 8, 1, 1, "#f4b0b0");
  } else if (dir === "left") {
    rect(ctx, x + 5, y + 5, 1, 1, "#ffffff");
    rect(ctx, x + 5, y + 5, 1, 1, "#0d0d0d");
    rect(ctx, x + 6, y + 7, 2, 1, "#e88080");
  } else if (dir === "right") {
    rect(ctx, x + 10, y + 5, 1, 1, "#ffffff");
    rect(ctx, x + 10, y + 5, 1, 1, "#0d0d0d");
    rect(ctx, x + 9,  y + 7, 2, 1, "#e88080");
  }

  // Player badge
  if (isPlayer) {
    rect(ctx, x + 5, y + 8, 6, 1, "#ffffff");
    rect(ctx, x + 6, y + 9, 4, 1, "#ffe2f0");
    rect(ctx, x + 7, y + 10, 2, 1, "#fff7b0");
  }

  // Feet walk cycle
  if (step % 2 === 0) {
    rect(ctx, x + 4,  y + 14, 2, 2, dark);
    rect(ctx, x + 10, y + 14, 2, 2, dark);
  } else {
    rect(ctx, x + 3,  y + 14, 2, 2, dark);
    rect(ctx, x + 11, y + 14, 2, 2, dark);
  }
}

// ─── Speech bubble ────────────────────────────────────────────────────────────
export function drawSpeechBubble(ctx, x, y, text) {
  const padding  = 6;
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
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);

  const width  = Math.min(
    maxWidth,
    Math.max(...lines.map((l) => ctx.measureText(l).width)) + padding * 2
  );
  const height = lines.length * 11 + padding * 2;
  const left   = clamp(x - width / 2, 8, VIEW_COLS * TILE - width - 8);
  const top    = Math.max(8, y - height - 18);

  rect(ctx, left, top, width, height, "#fffdf8");
  rect(ctx, left, top, width, 2, "#ffffff");
  ctx.strokeStyle = "#434343";
  ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
  rect(ctx, x - 4, top + height - 1, 8, 6, "#fffdf8");
  ctx.strokeRect(x - 4 + 0.5, top + height - 1 + 0.5, 7, 5);

  ctx.fillStyle = "#2f2f2f";
  lines.forEach((line, i) =>
    ctx.fillText(line, left + padding, top + padding + 8 + i * 11)
  );
}
