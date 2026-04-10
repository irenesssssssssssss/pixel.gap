// World prop drawing: fences, signs, benches, trees, small objects.

import { TILE } from "../constants/game";
import { rect, outline } from "../engine/mapUtils";

// ─── Pixel font (used by drawSign) ────────────────────────────────────────────
const PIXEL_GLYPHS = {
  A: ["010","101","111","101","101"],
  D: ["110","101","101","101","110"],
  E: ["111","100","110","100","111"],
  G: ["011","100","101","101","011"],
  L: ["100","100","100","100","111"],
  M: ["101","111","111","101","101"],
  N: ["101","111","111","111","101"],
  O: ["111","101","101","101","111"],
  R: ["110","101","110","101","101"],
  S: ["011","100","010","001","110"],
  W: ["101","101","111","111","101"],
};

export function drawPixelText(ctx, text, x, y, color, scale = 1) {
  let cursor = x;
  for (const char of text) {
    if (char === " ") { cursor += scale * 2; continue; }
    const glyph = PIXEL_GLYPHS[char];
    if (!glyph) { cursor += scale * 4; continue; }
    glyph.forEach((row, ri) =>
      [...row].forEach((bit, ci) => {
        if (bit === "1") rect(ctx, cursor + ci * scale, y + ri * scale, scale, scale, color);
      })
    );
    cursor += scale * 4;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
export function drawFence(ctx, x, y) {
  rect(ctx, x + 2,  y + 3, 3, 10, "#8c6246");
  rect(ctx, x + 7,  y + 2, 3, 11, "#93694c");
  rect(ctx, x + 12, y + 3, 2, 10, "#845b41");
  rect(ctx, x,      y + 5, TILE, 2, "#a87657");
  rect(ctx, x,      y + 9, TILE, 2, "#6b4938");
  rect(ctx, x + 1,  y + 5, TILE - 2, 1, "#c99472");
}

export function drawSign(ctx, x, y, text) {
  rect(ctx, x + 5,  y + 7, 6, 8, "#8f6746");
  rect(ctx, x + 10, y + 7, 1, 8, "#5f4330");
  rect(ctx, x + 2,  y + 2, 12, 7, "#e6cfab");
  rect(ctx, x + 2,  y + 2, 12, 2, "#faf0d8");
  rect(ctx, x + 3,  y + 4, 10, 1, "#efe4cf");
  rect(ctx, x + 13, y + 3,  1, 6, "#b29262");
  rect(ctx, x + 2,  y + 8, 12, 1, "#9d7f58");
  rect(ctx, x + 4,  y + 9,  8, 1, "#6f5640");
  outline(ctx, x + 2, y + 2, 12, 7, "#7e6548");
  rect(ctx, x + 3,  y + 3,  2, 1, "#fffaf0");
  ctx.fillStyle = "#5b4633";
  ctx.font = "bold 5px sans-serif";
  ctx.fillText(text, x + 3, y + 8);
}

export function drawBench(ctx, x, y) {
  // Shadow
  rect(ctx, x + 2, y + 14, 12, 2, "rgba(0,0,0,0.18)");
  // Legs
  rect(ctx, x + 3,  y + 2,  2, 12, "#7a5640");
  rect(ctx, x + 11, y + 2,  2, 12, "#7a5640");
  rect(ctx, x + 4,  y + 3,  1, 11, "#5c3e2c");
  rect(ctx, x + 12, y + 3,  1, 11, "#5c3e2c");
  // Seat slats
  rect(ctx, x + 1,  y + 8, 14, 3, "#a87a60");
  rect(ctx, x + 1,  y + 8, 14, 1, "#c49878");
  rect(ctx, x + 1,  y + 10,14, 1, "#7a5840");
  rect(ctx, x + 3,  y + 9, 10, 1, "#d4ac8a");
  // Backrest slats
  rect(ctx, x + 1,  y + 4, 14, 3, "#c09070");
  rect(ctx, x + 1,  y + 4, 14, 1, "#ddb090");
  rect(ctx, x + 2,  y + 4, 12, 1, "#e4c0a0");
  rect(ctx, x + 2,  y + 6, 12, 1, "#8d6447");
}

export function drawBarrel(ctx, x, y, color) {
  rect(ctx, x + 2, y + 2, 12, 12, color);
  rect(ctx, x + 3, y + 3, 10,  2, "rgba(255,255,255,0.22)");
  rect(ctx, x + 4, y + 5,  2,  7, "rgba(255,255,255,0.12)");
  rect(ctx, x + 2, y + 4, 12,  2, "#64584f");
  rect(ctx, x + 2, y + 10,12,  2, "#64584f");
  rect(ctx, x + 6, y + 4,  1,  8, "#4e433d");
  outline(ctx, x + 2, y + 2, 12, 12, "#584d44");
}

export function drawCrate(ctx, x, y, color) {
  rect(ctx, x + 2, y + 2, 12, 12, color);
  rect(ctx, x + 3, y + 3, 10,  2, "rgba(255,255,255,0.22)");
  rect(ctx, x + 4, y + 4,  8,  1, "rgba(255,255,255,0.16)");
  rect(ctx, x + 3, y + 7, 10,  1, "#7c5c45");
  rect(ctx, x + 3, y + 11,10,  1, "#7c5c45");
  rect(ctx, x + 7, y + 3,  1, 10, "#7c5c45");
  outline(ctx, x + 2, y + 2, 12, 12, "#6c513d");
}

export function drawLamp(ctx, x, y) {
  // Soft warm glow halo behind the head
  rect(ctx, x + 1, y - 2, 14, 10, "rgba(255,228,140,0.12)");
  rect(ctx, x + 2, y - 1, 12, 8, "rgba(255,228,140,0.16)");
  rect(ctx, x + 4, y,      8, 6, "rgba(255,228,140,0.2)");
  // Pole
  rect(ctx, x + 7, y + 3,  2, 11, "#6b756e");
  rect(ctx, x + 8, y + 3,  1, 11, "#4e5a53");
  // Lamp head
  rect(ctx, x + 5, y + 1,  6,  4, "#f5c86a");
  rect(ctx, x + 6, y + 1,  4,  3, "#fff3c2");
  rect(ctx, x + 6, y + 2,  3,  1, "#fffff8");
  rect(ctx, x + 5, y + 4,  6,  1, "#b78d3e");
  // Cap and base
  rect(ctx, x + 5, y,      6,  1, "#fff4d6");
  rect(ctx, x + 6, y + 14, 4,  1, "#555f58");
  // Ground glow
  rect(ctx, x + 3, y + 11, 10, 4, "rgba(255,230,150,0.18)");
}

export function drawCanalPost(ctx, x, y) {
  rect(ctx, x + 5, y + 4,  6, 10, "#9f7754");
  rect(ctx, x + 4, y + 3,  8,  2, "#c89c74");
  rect(ctx, x + 10,y + 4,  1, 10, "#76553b");
}

export function drawBridge(ctx, x, y, w, _h) {
  rect(ctx, x, y + 4, w * TILE, 8, "#b68863");
  for (let xx = 2; xx < w * TILE; xx += 5)
    rect(ctx, x + xx, y + 5, 2, 6, "#d7ac80");
  rect(ctx, x, y + 3,  w * TILE, 1, "#8a6144");
  rect(ctx, x, y + 12, w * TILE, 1, "#8a6144");
}

export function drawRock(ctx, x, y) {
  rect(ctx, x + 3,  y + 15, 10,  2, "rgba(0,0,0,0.22)");
  rect(ctx, x + 2,  y + 7,  12,  7, "#a8aea8");
  rect(ctx, x + 4,  y + 5,   8,  4, "#d8ddcf");
  rect(ctx, x + 4,  y + 5,   4,  2, "#eff3e6");
  rect(ctx, x + 6,  y + 8,   4,  2, "#c6ccc2");
  rect(ctx, x + 13, y + 7,   1,  7, "#7f857d");
  rect(ctx, x + 2,  y + 13, 12,  1, "#7f857d");
  rect(ctx, x + 7,  y + 10,  2,  1, "#7f857d");
}

export function drawFlower(ctx, x, y) {
  // Stem and leaf
  rect(ctx, x + 7, y + 7,  2, 8, "#4e8f3a");
  rect(ctx, x + 5, y + 10, 3, 2, "#5da044");
  rect(ctx, x + 9, y + 12, 3, 2, "#5da044");
  // Petals — warm pink
  rect(ctx, x + 6, y + 2,  4, 7, "#f9d0e2");
  rect(ctx, x + 5, y + 3,  6, 5, "#f9d0e2");
  rect(ctx, x + 8, y + 1,  2, 4, "#f0a0c8");
  rect(ctx, x + 9, y + 4,  3, 3, "#f0a0c8");
  rect(ctx, x + 4, y + 4,  3, 3, "#f7b8d6");
  rect(ctx, x + 6, y + 7,  1, 2, "#f0a0c8");
  // Bright yellow centre
  rect(ctx, x + 7, y + 4,  2, 3, "#ffdd3c");
  rect(ctx, x + 7, y + 4,  1, 1, "#fff9b0");
}

export function drawCropBed(ctx, x, y, crop) {
  const flower = crop === "yellow" ? "#f7e092" : "#a8e0ae";
  for (let xx = 2; xx < 16; xx += 6) {
    rect(ctx, x + xx,     y + 8, 2, 5, "#5d9747");
    rect(ctx, x + xx - 1, y + 5, 4, 4, flower);
    rect(ctx, x + xx,     y + 5, 1, 1, "#fff6dc");
  }
}

// ─── ESG props ────────────────────────────────────────────────────────────────

export function drawHazardCone(ctx, x, y) {
  rect(ctx, x + 3, y + 15, 10, 2, "rgba(0,0,0,0.22)");   // shadow
  rect(ctx, x + 6, y + 13,  4, 3, "#f0c040");             // base plate
  rect(ctx, x + 5, y + 11,  6, 3, "#e65c00");             // lower stripe
  rect(ctx, x + 6, y +  8,  4, 4, "#ff7a00");             // cone body
  rect(ctx, x + 6, y +  9,  4, 1, "#ffffff");             // reflective band
  rect(ctx, x + 7, y +  5,  2, 4, "#ff7a00");             // tip
  rect(ctx, x + 5, y + 11,  6, 1, "#ffcc44");             // highlight
}

export function drawWasteBin(ctx, x, y, kind) {
  const lid  = kind === "recycling" ? "#1a7acc"
             : kind === "organic"   ? "#4aaa34"
             :                        "#666666";
  const body = kind === "recycling" ? "#2390e0"
             : kind === "organic"   ? "#5fc040"
             :                        "#888888";
  rect(ctx, x + 3,  y + 15, 10, 2, "rgba(0,0,0,0.22)");  // shadow
  rect(ctx, x + 3,  y +  5,  10, 9, body);                // bin body
  rect(ctx, x + 4,  y +  6,   8, 3, "rgba(255,255,255,0.16)"); // sheen
  rect(ctx, x + 4,  y + 10,   2, 3, "rgba(0,0,0,0.18)"); // seam
  rect(ctx, x + 7,  y +  7,   2, 5, "rgba(0,0,0,0.08)");
  rect(ctx, x + 3,  y +  3,  10, 3, lid);                 // lid
  rect(ctx, x + 4,  y +  3,   8, 1, "rgba(255,255,255,0.2)");  // lid highlight
  outline(ctx, x + 3, y + 3,  10, 11, "rgba(0,0,0,0.3)");
}

export function drawWaterMarker(ctx, x, y) {
  rect(ctx, x + 7,  y +  4,  2, 12, "#8ea8b8");           // pole
  rect(ctx, x + 6,  y +  3,  4,  2, "#c0d8e8");           // pole cap
  rect(ctx, x + 4,  y +  5,  3,  1, "#4488cc");           // gauge mark high
  rect(ctx, x + 4,  y +  8,  3,  1, "#44aacc");           // gauge mark mid
  rect(ctx, x + 4,  y + 11,  3,  1, "#22cc88");           // gauge mark low
  rect(ctx, x + 3,  y + 14,  4,  2, "#6a9ab8");           // base left
  rect(ctx, x + 9,  y + 14,  4,  2, "#6a9ab8");           // base right
  rect(ctx, x + 3,  y + 15, 10,  2, "rgba(0,0,0,0.22)");  // shadow
}

export function drawNoticeboard(ctx, x, y) {
  rect(ctx, x + 3,  y + 15, 10, 2, "rgba(0,0,0,0.22)");  // shadow
  rect(ctx, x + 6,  y +  9,  2, 7, "#8f6746");            // post left
  rect(ctx, x + 8,  y +  9,  2, 7, "#7a5738");            // post right
  rect(ctx, x + 2,  y +  2, 12, 9, "#c8a96a");            // board
  rect(ctx, x + 2,  y +  2, 12, 2, "#dfc080");            // board top
  rect(ctx, x + 13, y +  3,  1, 8, "#9a7846");            // board right shadow
  outline(ctx, x + 2, y + 2, 12, 9, "#7a5c30");
  // pinned papers
  rect(ctx, x + 3,  y +  4,  4, 3, "#f8f2e0");
  rect(ctx, x + 3,  y +  4,  4, 1, "#fff8ec");
  rect(ctx, x + 8,  y +  4,  5, 3, "#f0ebe0");
  rect(ctx, x + 3,  y +  8,  3, 2, "#e8d0b0");
  rect(ctx, x + 7,  y +  8,  4, 2, "#f4ecd8");
  rect(ctx, x + 4,  y +  5,  2, 1, "#c8b888");            // text stub
  rect(ctx, x + 9,  y +  5,  3, 1, "#b8a878");
  rect(ctx, x + 4,  y +  6,  1, 1, "#c8b888");
  rect(ctx, x + 8,  y +  9,  2, 1, "#c8b888");
}

export function drawWatchPost(ctx, x, y) {
  rect(ctx, x + 2, y + 15, 12, 2, "rgba(0,0,0,0.22)");
  rect(ctx, x + 4, y + 6, 2, 9, "#8f6746");
  rect(ctx, x + 10, y + 6, 2, 9, "#7a5738");
  rect(ctx, x + 2, y + 4, 12, 3, "#c8a96a");
  rect(ctx, x + 3, y + 3, 10, 2, "#dfc080");
  rect(ctx, x + 5, y + 8, 6, 4, "#6a7d88");
  rect(ctx, x + 6, y + 9, 4, 2, "#b8d2de");
  rect(ctx, x + 4, y + 12, 8, 2, "#7f5b3c");
  rect(ctx, x + 6, y + 5, 4, 1, "#f4e1bb");
}

export function drawMachine(ctx, x, y) {
  rect(ctx, x + 1, y + 15, 14, 2, "rgba(0,0,0,0.24)");
  rect(ctx, x + 2, y + 5, 12, 8, "#58656d");
  rect(ctx, x + 2, y + 5, 12, 2, "#7d8a92");
  rect(ctx, x + 3, y + 6, 10, 1, "#97a4ab");
  rect(ctx, x + 3, y + 7, 4, 4, "#2c353a");
  rect(ctx, x + 8, y + 7, 4, 4, "#3f4a50");
  rect(ctx, x + 8, y + 8, 3, 1, "#f0c040");
  rect(ctx, x + 4, y + 8, 2, 2, "#6fa0b8");
  rect(ctx, x + 4, y + 12, 2, 3, "#7d8a92");
  rect(ctx, x + 10, y + 12, 2, 3, "#65747c");
  rect(ctx, x + 1, y + 6, 1, 7, "#3e494f");
  rect(ctx, x + 14, y + 6, 1, 7, "#3e494f");
}

// ─── Council terrace furniture ────────────────────────────────────────────────

export function drawCouncilTable(ctx, x, y, w, h) {
  const tw = w * TILE, th = h * TILE;
  // Drop shadow
  rect(ctx, x + 8,  y + th + 1, tw - 10, 6, "rgba(0,0,0,0.22)");
  // Oval illusion — narrower rects layered to fake rounded ends
  rect(ctx, x + 10, y + 2,  tw - 20, th - 2, "#5c3820");   // depth base
  rect(ctx, x + 10, y + 0,  tw - 20, th - 2, "#9a6438");   // surface oval top/bottom
  rect(ctx, x + 6,  y + 4,  tw - 12, th - 6, "#9a6438");   // surface wide mid
  // Lighter centre surface
  rect(ctx, x + 8,  y + 3,  tw - 16, th - 6, "#b07844");
  rect(ctx, x + 10, y + 4,  tw - 20, th - 8, "#c08850");
  // Polish highlight
  rect(ctx, x + 12, y + 4,  tw - 24, 4, "rgba(255,255,255,0.13)");
  // Wood grain
  rect(ctx, x + 12, y +  9,  tw - 24, 1, "#8a5830");
  rect(ctx, x + 12, y + 17,  tw - 24, 1, "#8a5830");
  rect(ctx, x + 12, y + 25,  tw - 24, 1, "#8a5830");
  // Right depth edge
  rect(ctx, x + tw - 14, y + 3, 6, th - 6, "#7a4828");
  // Place cards / notepads at each seat position
  const nc = "#eeeae0", nhl = "#fffff4";
  // North row
  rect(ctx, x + 12, y + 4,  8, 5, nc); rect(ctx, x + 12, y + 4, 8, 1, nhl);
  rect(ctx, x + 36, y + 4,  8, 5, nc); rect(ctx, x + 36, y + 4, 8, 1, nhl);
  // South row
  rect(ctx, x + 12, y + th - 10, 8, 5, nc);
  rect(ctx, x + 36, y + th - 10, 8, 5, nc);
  // West / East sides
  rect(ctx, x + 6,  y + 17, 5, 8, nc);
  rect(ctx, x + tw - 11, y + 17, 5, 8, nc);
}

export function drawChair(ctx, x, y, dir) {
  // Outdoor slatted chair, pixel-art, viewed from slight top-down angle.
  rect(ctx, x + 3, y + 14, 10, 3, "rgba(0,0,0,0.18)"); // shadow
  // Legs
  rect(ctx, x + 4,  y + 9, 2, 6, "#6c4828");
  rect(ctx, x + 10, y + 9, 2, 6, "#6c4828");
  // Seat slats
  rect(ctx, x + 3,  y + 7, 10, 3, "#b07840");
  rect(ctx, x + 3,  y + 7, 10, 1, "#d0a060");
  rect(ctx, x + 3,  y + 9, 10, 1, "#884820");
  // Backrest — direction sets which side
  if (dir === "down") {
    rect(ctx, x + 3,  y + 2, 10, 6, "#b88048");
    rect(ctx, x + 3,  y + 2, 10, 1, "#dda860");
    rect(ctx, x + 3,  y + 5, 10, 1, "#884820");
  } else if (dir === "up") {
    rect(ctx, x + 3,  y + 9, 10, 5, "#b88048");
    rect(ctx, x + 3,  y + 9, 10, 1, "#dda860");
    rect(ctx, x + 13, y + 9,  1, 5, "#884820");
  } else if (dir === "right") {
    rect(ctx, x + 1,  y + 4,  4, 8, "#b88048");
    rect(ctx, x + 1,  y + 4,  4, 1, "#dda860");
    rect(ctx, x + 4,  y + 4,  1, 8, "#884820");
  } else {  // left
    rect(ctx, x + 11, y + 4,  4, 8, "#b88048");
    rect(ctx, x + 11, y + 4,  4, 1, "#dda860");
    rect(ctx, x + 14, y + 4,  1, 8, "#884820");
  }
}

export function drawTree(ctx, x, y, style) {
  const trunk      = style === "palm" ? "#8a6548" : "#8f6748";
  const trunkShade = style === "palm" ? "#6d4d34" : "#6e4c35";
  rect(ctx, x + 3, y + 15, 10,  2, "rgba(0,0,0,0.28)");
  rect(ctx, x + 6, y + 9,   4,  7, trunk);
  rect(ctx, x + 9, y + 9,   1,  7, trunkShade);

  if (style === "pine") {
    rect(ctx, x + 1,  y + 7,  14, 5, "#4f8d55");
    rect(ctx, x + 14, y + 7,   1, 5, "#35603c");
    rect(ctx, x + 1,  y + 11, 14, 1, "#35603c");
    rect(ctx, x + 2,  y + 4,  12, 5, "#6cab67");
    rect(ctx, x + 13, y + 4,   1, 5, "#35603c");
    rect(ctx, x + 2,  y + 8,  12, 1, "#35603c");
    rect(ctx, x + 4,  y + 1,   8, 5, "#9fd87e");
    rect(ctx, x + 11, y + 1,   1, 5, "#35603c");
    rect(ctx, x + 4,  y + 1,   4, 1, "#c8e79a");
  } else if (style === "palm") {
    rect(ctx, x + 6,  y + 2,  4, 8, "#8d6649");
    rect(ctx, x + 9,  y + 2,  1, 8, "#6c4c35");
    rect(ctx, x + 1,  y + 2, 14, 3, "#8ac86c");
    rect(ctx, x,      y + 5,  6, 2, "#67a04e");
    rect(ctx, x + 10, y + 5,  6, 2, "#67a04e");
    rect(ctx, x + 3,  y,     10, 2, "#c8ee9e");
    rect(ctx, x + 3,  y,      4, 1, "#f2fcd0");
    rect(ctx, x + 7,  y + 2,  2, 1, "#d8f0a8");
  } else if (style === "autumn") {
    rect(ctx, x + 1,  y + 3, 14, 8, "#9ccb6e");
    rect(ctx, x + 3,  y + 1, 10, 5, "#e0f0a8");
    rect(ctx, x + 14, y + 3,  1, 8, "#6a8e4c");
    rect(ctx, x + 1,  y + 10,14, 1, "#6a8e4c");
    rect(ctx, x + 5,  y + 5,  3, 2, "#e8aa78");
    rect(ctx, x + 9,  y + 4,  2, 3, "#e8aa78");
    rect(ctx, x + 5,  y + 1,  5, 1, "#fce5b4");
    rect(ctx, x + 4,  y + 2,  2, 1, "#f8d888");
  } else {
    // bright / default
    rect(ctx, x + 1,  y + 4,  14, 8, "#6ec058");
    rect(ctx, x + 3,  y + 1,  10, 5, "#b8e880");
    rect(ctx, x + 14, y + 4,   1, 8, "#408838");
    rect(ctx, x + 1,  y + 11, 14, 1, "#408838");
    rect(ctx, x + 5,  y + 6,   3, 2, "#408838");
    rect(ctx, x + 5,  y + 1,   5, 1, "#eafab6");
    rect(ctx, x + 7,  y + 2,   3, 1, "#d8f490");
  }
}
