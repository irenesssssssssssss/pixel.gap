function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const OUTLINE = "#000000";
const FUR = "#c99974";
const FUR_SHADE = "#be8563";
const MUZZLE = "#a66a49";
const BELLY = "#f2c1b8";
const BLUSH = "#eba1cb";
const SMILE = "#c98768";

export function drawHeroBeaverSprite(ctx, ox = 0, oy = 0) {
  // Ears
  fill(ctx, ox + 5, oy + 0, 3, 2, OUTLINE);
  fill(ctx, ox + 18, oy + 0, 3, 2, OUTLINE);
  fill(ctx, ox + 4, oy + 2, 5, 4, OUTLINE);
  fill(ctx, ox + 17, oy + 2, 5, 4, OUTLINE);
  fill(ctx, ox + 5, oy + 2, 4, 4, MUZZLE);
  fill(ctx, ox + 17, oy + 2, 4, 4, MUZZLE);

  // Head
  fill(ctx, ox + 3, oy + 5, 20, 11, OUTLINE);
  fill(ctx, ox + 4, oy + 5, 18, 11, FUR);
  fill(ctx, ox + 5, oy + 6, 16, 9, FUR);
  fill(ctx, ox + 8, oy + 16, 10, 2, FUR);

  // Body silhouette
  fill(ctx, ox + 5, oy + 16, 16, 10, OUTLINE);
  fill(ctx, ox + 3, oy + 18, 20, 7, OUTLINE);
  fill(ctx, ox + 2, oy + 21, 22, 3, OUTLINE);
  fill(ctx, ox + 4, oy + 16, 18, 10, FUR);
  fill(ctx, ox + 3, oy + 19, 20, 5, FUR);
  fill(ctx, ox + 4, oy + 21, 18, 4, FUR);

  // Arms
  fill(ctx, ox + 4, oy + 17, 2, 5, FUR_SHADE);
  fill(ctx, ox + 20, oy + 17, 2, 5, FUR_SHADE);

  // Legs
  fill(ctx, ox + 6, oy + 22, 5, 6, OUTLINE);
  fill(ctx, ox + 15, oy + 22, 5, 6, OUTLINE);
  fill(ctx, ox + 7, oy + 22, 4, 5, FUR);
  fill(ctx, ox + 15, oy + 22, 4, 5, FUR);

  // Eyes and blush
  fill(ctx, ox + 8, oy + 7, 1, 3, OUTLINE);
  fill(ctx, ox + 18, oy + 7, 1, 3, OUTLINE);
  fill(ctx, ox + 7, oy + 9, 2, 1, BLUSH);
  fill(ctx, ox + 17, oy + 9, 2, 1, BLUSH);

  // Muzzle
  fill(ctx, ox + 10, oy + 10, 7, 6, MUZZLE);
  fill(ctx, ox + 9, oy + 11, 9, 4, MUZZLE);
  fill(ctx, ox + 11, oy + 9, 5, 1, MUZZLE);

  // Nose and mouth
  fill(ctx, ox + 12, oy + 11, 2, 1, OUTLINE);
  fill(ctx, ox + 15, oy + 11, 2, 1, OUTLINE);
  fill(ctx, ox + 14, oy + 12, 1, 4, OUTLINE);

  // Smile
  fill(ctx, ox + 10, oy + 16, 1, 1, SMILE);
  fill(ctx, ox + 18, oy + 16, 1, 1, SMILE);
  fill(ctx, ox + 10, oy + 17, 9, 1, SMILE);
  fill(ctx, ox + 11, oy + 18, 7, 1, SMILE);

  // Belly
  fill(ctx, ox + 10, oy + 20, 7, 6, BELLY);
  fill(ctx, ox + 11, oy + 19, 5, 1, BELLY);
  fill(ctx, ox + 9, oy + 21, 9, 4, BELLY);
}

export function drawPlayerBeaverSprite(ctx, x, y, step = 0, isPlayer = false) {
  fill(ctx, x + 1, y + 15, 14, 2, "rgba(0,0,0,0.26)");

  // Ears
  fill(ctx, x + 2, y + 0, 3, 2, OUTLINE);
  fill(ctx, x + 11, y + 0, 3, 2, OUTLINE);
  fill(ctx, x + 2, y + 1, 3, 2, MUZZLE);
  fill(ctx, x + 11, y + 1, 3, 2, MUZZLE);

  // Head and body
  fill(ctx, x + 1, y + 2, 14, 10, OUTLINE);
  fill(ctx, x + 2, y + 2, 12, 10, FUR);
  fill(ctx, x + 1, y + 10, 14, 5, OUTLINE);
  fill(ctx, x + 2, y + 10, 12, 5, FUR);

  // Arms
  fill(ctx, x + 2, y + 10, 2, 4, FUR_SHADE);
  fill(ctx, x + 12, y + 10, 2, 4, FUR_SHADE);

  // Legs
  fill(ctx, x + 4, y + 12, 3, 4, OUTLINE);
  fill(ctx, x + 9, y + 12, 3, 4, OUTLINE);
  fill(ctx, x + 5, y + 12, 2, 3, FUR);
  fill(ctx, x + 9, y + 12, 2, 3, FUR);

  // Face
  fill(ctx, x + 5, y + 5, 1, 2, OUTLINE);
  fill(ctx, x + 10, y + 5, 1, 2, OUTLINE);
  fill(ctx, x + 4, y + 6, 2, 1, BLUSH);
  fill(ctx, x + 10, y + 6, 2, 1, BLUSH);

  // Muzzle
  fill(ctx, x + 5, y + 7, 6, 3, MUZZLE);
  fill(ctx, x + 4, y + 8, 8, 2, MUZZLE);
  fill(ctx, x + 6, y + 6, 4, 1, MUZZLE);
  fill(ctx, x + 7, y + 7, 1, 1, OUTLINE);
  fill(ctx, x + 9, y + 7, 1, 1, OUTLINE);
  fill(ctx, x + 8, y + 8, 1, 2, OUTLINE);

  // Smile
  fill(ctx, x + 5, y + 10, 1, 1, SMILE);
  fill(ctx, x + 11, y + 10, 1, 1, SMILE);
  fill(ctx, x + 5, y + 11, 7, 1, SMILE);

  // Belly
  fill(ctx, x + 5, y + 11, 6, 4, BELLY);
  fill(ctx, x + 4, y + 12, 8, 2, BELLY);

  if (isPlayer) {
    fill(ctx, x + 6, y + 14 + (step % 2), 1, 1, "#fff0a8");
    fill(ctx, x + 9, y + 14 + ((step + 1) % 2), 1, 1, "#fff0a8");
  }
}
