// Office interior prop drawing: desks, counters, plants, decor items.

import { TILE } from "../constants/game";
import { rect, outline } from "../engine/mapUtils";

export function drawDesk(ctx, x, y, w = 3, h = 2, computer = true) {
  const dw = w * TILE, dh = h * TILE;
  rect(ctx, x,          y,       dw,  dh, "#7f5b3b");
  rect(ctx, x,          y,       dw,   4, "#a77a52");
  rect(ctx, x + 2,      y + 4,  dw - 4, 1, "#bf9164");
  rect(ctx, x,          y,        3,  dh, "#9a6f48");
  rect(ctx, x + dw - 3, y,        3,  dh, "#58402c");
  rect(ctx, x,          y+dh-3,  dw,   3, "#58402c");
  rect(ctx, x + 4,      y+dh-5,   4,   5, "#57402b");
  rect(ctx, x + dw - 8, y+dh-5,   4,   5, "#57402b");

  if (computer) {
    rect(ctx, x + 9,      y + 3,  14, 12, "#1a2838");
    rect(ctx, x + 10,     y + 4,  12, 10, "#1a8fcc");
    rect(ctx, x + 10,     y + 4,  12,  4, "#5ed2f8");
    rect(ctx, x + 11,     y + 5,   5,  2, "#d2f4ff");
    rect(ctx, x + 10,     y + 8,  12,  1, "#0f6090");
    rect(ctx, x + 15,     y + 14,  4,  3, "#2a3844");
    rect(ctx, x + 13,     y + 16,  8,  1, "#1e2c38");
    rect(ctx, x + 4,      y+dh-9, 12,  5, "#c0c8d0");
    rect(ctx, x + 4,      y+dh-9, 12,  1, "#dde4ea");
    rect(ctx, x + 5,      y+dh-8,  2,  3, "#a8b4bc");
    rect(ctx, x + 8,      y+dh-8,  2,  3, "#a8b4bc");
    rect(ctx, x + 11,     y+dh-8,  2,  3, "#a8b4bc");
    rect(ctx, x + 14,     y+dh-8,  1,  3, "#a8b4bc");
    rect(ctx, x + 1,      y+dh-9,  4,  5, "#c8d2da");
    rect(ctx, x + 1,      y+dh-9,  4,  1, "#e0e8f0");
    rect(ctx, x + 3,      y+dh-9,  1,  3, "#a8b0ba");
    rect(ctx, x + dw - 7, y + 3,   5,  6, "#f0ede6");
    rect(ctx, x + dw - 7, y + 3,   5,  1, "#d8d4cc");
    rect(ctx, x + dw - 6, y + 10,  4,  5, "#b04830");
    rect(ctx, x + dw - 6, y + 10,  4,  2, "#cc6040");
  } else {
    rect(ctx, x + 4,      y + 4,  10,  7, "#f0ece4");
    rect(ctx, x + 4,      y + 4,  10,  1, "#dedad2");
    rect(ctx, x + 5,      y + 13,  1,  8, "#28508a");
    rect(ctx, x + dw - 14,y + 4,  10,  7, "#f0ece4");
    rect(ctx, x + dw - 14,y + 4,  10,  1, "#dedad2");
    rect(ctx, x + dw - 7, y + 13,  1,  8, "#28508a");
  }
}

export function drawCounter(ctx, x, y, w, h, type) {
  const cw = w * TILE, ch = h * TILE;
  if (type === "reception") {
    rect(ctx, x,          y,    cw,  ch, "#3a5878");
    rect(ctx, x,          y,    cw,   4, "#7aa4cc");
    rect(ctx, x + 2,      y + 4,cw - 4, 1, "#9ec0e0");
    rect(ctx, x,          y,     3,  ch, "#507aaa");
    rect(ctx, x + cw - 3, y,     3,  ch, "#1e3048");
    rect(ctx, x,          y+ch-2,cw,  2, "#1e3048");
    rect(ctx, x + 6,      y + 2, 10,  8, "#18283a");
    rect(ctx, x + 7,      y + 3,  8,  6, "#2a9dd4");
    rect(ctx, x + 7,      y + 3,  8,  2, "#5ec8f0");
    rect(ctx, x + cw - 9, y + 3,  6,  5, "#2c3d50");
    rect(ctx, x + cw - 8, y + 4,  4,  3, "#1a2a3a");
    rect(ctx, x + 2,      y+ch-7,14,  4, "#c0d4ee");
    rect(ctx, x + 2,      y+ch-7,14,  1, "#e8f0ff");
  } else {
    rect(ctx, x,          y,    cw,  ch, "#7b5e4a");
    rect(ctx, x,          y,    cw,   4, "#b08968");
    rect(ctx, x + 2,      y + 4,cw - 4, 1, "#c59a79");
    rect(ctx, x,          y,     3,  ch, "#9a7458");
    rect(ctx, x + cw - 3, y,     3,  ch, "#4a3020");
    rect(ctx, x + 2,      y + 1, 10, 14, "#282020");
    rect(ctx, x + 3,      y + 2,  8,  6, "#b83818");
    rect(ctx, x + 4,      y + 3,  4,  4, "#901810");
    rect(ctx, x + 5,      y + 4,  2,  2, "#f8c040");
    rect(ctx, x + 3,      y + 9,  8,  4, "#d09838");
    rect(ctx, x + 4,      y + 10, 6,  2, "#886020");
    rect(ctx, x + cw - 8, y + 5,  4,  5, "#f2eee4");
    rect(ctx, x + cw - 8, y + 5,  4,  1, "#d8d4ca");
    rect(ctx, x + cw - 5, y + 4,  4,  5, "#e8d8c0");
    rect(ctx, x + cw - 5, y + 4,  4,  1, "#c8c0b0");
  }
}

export function drawPlant(ctx, x, y) {
  rect(ctx, x + 4,  y + 11, 8,  4, "#9e6040");
  rect(ctx, x + 3,  y + 10,10,  2, "#c07850");
  rect(ctx, x + 10, y + 11, 2,  4, "#6a3820");
  rect(ctx, x + 5,  y + 10, 6,  2, "#4a2e14");
  rect(ctx, x + 1,  y + 3,  6,  8, "#2e8a40");
  rect(ctx, x + 2,  y + 2,  4,  3, "#52b060");
  rect(ctx, x + 3,  y + 3,  2,  2, "#9ed89e");
  rect(ctx, x + 1,  y + 5,  2,  4, "#1e6830");
  rect(ctx, x + 9,  y + 4,  6,  7, "#267838");
  rect(ctx, x + 10, y + 3,  4,  3, "#48a852");
  rect(ctx, x + 11, y + 4,  2,  2, "#8ad08a");
  rect(ctx, x + 13, y + 5,  2,  4, "#1e6030");
  rect(ctx, x + 5,  y,      6, 10, "#40a04e");
  rect(ctx, x + 6,  y,      4,  4, "#6acc72");
  rect(ctx, x + 7,  y + 1,  2,  2, "#b8f0b8");
  rect(ctx, x + 5,  y + 4,  2,  5, "#2a7838");
}

export function drawOfficeDecor(ctx, x, y, kind) {
  if (kind === "printer") {
    rect(ctx, x + 2,  y + 5,  12, 10, "#dce4ea");
    rect(ctx, x + 2,  y + 5,  12,  2, "#eef4f8");
    rect(ctx, x + 12, y + 6,   2,  8, "#a8b8c4");
    rect(ctx, x + 2,  y + 14, 12,  1, "#b0bec8");
    rect(ctx, x + 3,  y + 7,   5,  5, "#90a4b4");
    rect(ctx, x + 4,  y + 8,   2,  2, "#3880cc");
    rect(ctx, x + 7,  y + 8,   2,  2, "#d04040");
    rect(ctx, x + 4,  y + 11,  4,  1, "#7090a0");
    rect(ctx, x + 4,  y + 2,   8,  4, "#c4ced8");
    rect(ctx, x + 5,  y + 2,   6,  3, "#eef2f8");
    rect(ctx, x + 5,  y + 2,   6,  1, "#ffffff");
    rect(ctx, x + 3,  y + 14, 10,  3, "#b8c6d0");
    rect(ctx, x + 4,  y + 15,  7,  1, "#e8eef4");
  } else if (kind === "cooler") {
    rect(ctx, x + 5,  y,       6, 10, "#c4e0f4");
    rect(ctx, x + 5,  y,       6,  2, "#e0f4ff");
    rect(ctx, x + 9,  y + 1,   2,  8, "#90c0dc");
    rect(ctx, x + 6,  y + 3,   3,  6, "#60c0e8");
    rect(ctx, x + 6,  y + 3,   3,  1, "#90d8f4");
    rect(ctx, x + 4,  y + 9,   8,  7, "#b0c8de");
    rect(ctx, x + 4,  y + 9,   8,  2, "#c8dcea");
    rect(ctx, x + 10, y + 10,  2,  5, "#7890a8");
    rect(ctx, x + 5,  y + 13,  3,  2, "#2878a8");
    rect(ctx, x + 8,  y + 13,  1,  1, "#c8e0f0");
    rect(ctx, x + 4,  y + 15,  8,  1, "#d4e4f0");
  } else if (kind === "whiteboard") {
    rect(ctx, x,      y + 1,  16, 13, "#b0bcc8");
    rect(ctx, x + 1,  y + 2,  14, 10, "#fafeff");
    rect(ctx, x + 1,  y + 2,  14,  1, "#ffffff");
    outline(ctx, x + 1, y + 2, 14, 10, "#58687c");
    rect(ctx, x + 3,  y + 5,   6,  1, "#5ab8e0");
    rect(ctx, x + 3,  y + 7,   8,  1, "#6acc58");
    rect(ctx, x + 3,  y + 9,   4,  1, "#e88040");
    rect(ctx, x + 10, y + 6,   3,  1, "#d84444");
    rect(ctx, x + 1,  y + 12, 14,  2, "#909aaa");
    rect(ctx, x + 2,  y + 12,  2,  2, "#2858c0");
    rect(ctx, x + 5,  y + 12,  2,  2, "#28a040");
    rect(ctx, x + 8,  y + 12,  2,  2, "#c83030");
    rect(ctx, x + 11, y + 12,  2,  2, "#404040");
  } else if (kind === "window") {
    rect(ctx, x,      y,      16, 12, "#788898");
    rect(ctx, x + 1,  y + 1,  14, 10, "#c8ebff");
    rect(ctx, x + 1,  y + 1,  14,  3, "#eaf9ff");
    rect(ctx, x + 7,  y + 1,   2, 10, "#7898b0");
    rect(ctx, x + 1,  y + 5,  14,  1, "#9ab8cc");
    rect(ctx, x + 2,  y + 2,   4,  2, "rgba(255,255,255,0.3)");
  } else if (kind === "energymonitor") {
    // Wall-mounted energy display — green digits on dark panel
    rect(ctx, x,      y + 1, 16, 12, "#2c3c44");
    rect(ctx, x + 1,  y + 2, 14, 10, "#1a2a30");
    rect(ctx, x + 1,  y + 2, 14,  1, "#2e3e48");
    rect(ctx, x + 2,  y + 3, 10,  6, "#0d1a1e");
    rect(ctx, x + 3,  y + 4,  8,  4, "#0a1012");
    // green digit bars
    rect(ctx, x + 3,  y + 4,  3,  1, "#2aee88");
    rect(ctx, x + 3,  y + 6,  3,  1, "#2aee88");
    rect(ctx, x + 3,  y + 7,  3,  1, "#2aee88");
    rect(ctx, x + 7,  y + 4,  3,  1, "#2aee88");
    rect(ctx, x + 7,  y + 5,  1,  3, "#2aee88");
    rect(ctx, x + 9,  y + 4,  1,  4, "#2aee88");
    // label strip
    rect(ctx, x + 2,  y + 9,  6,  2, "#304858");
    rect(ctx, x + 9,  y + 9,  4,  2, "#304858");
    ctx.fillStyle = "#2aee88";
    ctx.font = "bold 4px sans-serif";
    ctx.fillText("kWh", x + 3, y + 14);
  } else if (kind === "paperpile") {
    // Overflow stack of papers on the floor
    rect(ctx, x + 1,  y + 11, 14,  4, "#d8d0b8");
    rect(ctx, x + 1,  y + 11, 14,  1, "#ede8d8");
    rect(ctx, x + 2,  y + 8,  12,  4, "#e8e0c8");
    rect(ctx, x + 2,  y + 8,  12,  1, "#f4f0e0");
    rect(ctx, x + 3,  y + 6,  10,  3, "#f0ece0");
    rect(ctx, x + 3,  y + 6,  10,  1, "#faf8f0");
    rect(ctx, x + 1,  y + 14, 14,  1, "#b0a890");
    // text lines on top sheet
    rect(ctx, x + 5,  y + 7,   6,  1, "#b8b0a0");
    rect(ctx, x + 4,  y + 9,   7,  1, "#c0b8a8");
    rect(ctx, x + 4,  y + 12,  5,  1, "#a8a090");
  } else if (kind === "folder") {
    rect(ctx, x + 3,  y + 6,  10,  7, "#4c8cff");
    rect(ctx, x + 4,  y + 4,   6,  3, "#a3c3ff");
    outline(ctx, x + 3, y + 6, 10,  7, "#1e3a8a");
    rect(ctx, x + 4,  y + 8,   6,  1, "#6aacff");
    rect(ctx, x + 4,  y + 10,  4,  1, "#6aacff");
  } else if (kind === "trainingkits") {
    rect(ctx, x + 1,  y + 14, 14, 2, "rgba(0,0,0,0.22)");
    rect(ctx, x + 2,  y + 8,  12, 5, "#d7c39b");
    rect(ctx, x + 2,  y + 8,  12, 1, "#eadcb8");
    rect(ctx, x + 3,  y + 4,   5, 4, "#6aa1d8");
    rect(ctx, x + 8,  y + 4,   5, 4, "#7dbb6f");
    rect(ctx, x + 4,  y + 5,   3, 2, "#b8d8f4");
    rect(ctx, x + 9,  y + 5,   3, 2, "#dcecc8");
    rect(ctx, x + 4,  y + 10,  3, 2, "#8f6b48");
    rect(ctx, x + 9,  y + 10,  3, 2, "#8f6b48");
  } else if (kind === "archivebox") {
    rect(ctx, x + 2,  y + 14, 12, 2, "rgba(0,0,0,0.22)");
    rect(ctx, x + 3,  y + 6,  10, 7, "#9d744d");
    rect(ctx, x + 3,  y + 6,  10, 2, "#bc8d62");
    rect(ctx, x + 4,  y + 8,   8, 4, "#f1eadc");
    rect(ctx, x + 5,  y + 9,   6, 1, "#c0b39c");
    rect(ctx, x + 5,  y + 11,  4, 1, "#b6a790");
    rect(ctx, x + 6,  y + 4,   4, 2, "#d6c2a8");
    rect(ctx, x + 6,  y + 5,   4, 1, "#efe4d4");
  }
}
