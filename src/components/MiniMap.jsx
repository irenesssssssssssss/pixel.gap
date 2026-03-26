import React, { useEffect, useRef } from "react";
import { SCENES } from "../data/scenes";
import { VIEW_COLS, VIEW_ROWS } from "../constants/game";
import { clamp } from "../engine/mapUtils";

const WIDTH = 176;
const HEIGHT = 120;
const PADDING = 8;

function colorForGround(type) {
  switch (type) {
    case "path":
      return "#d8d2c5";
    case "water":
      return "#88c2c7";
    case "sand":
      return "#ddd2bb";
    case "dirt":
      return "#bea784";
    case "tilled":
      return "#875c37";
    case "autumnGrass":
      return "#c1ce9a";
    case "darkGrass":
      return "#759671";
    case "officeFloor":
      return "#e3e9e5";
    case "carpet":
      return "#819583";
    case "meeting":
      return "#ccd3d9";
    case "wood":
      return "#cba57d";
    case "wall":
      return "#808890";
    default:
      return "#adcaa1";
  }
}

export default function MiniMap({ scene, player, objectiveTarget }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !player) return;

    const ctx = canvas.getContext("2d");
    const sceneData = SCENES[scene];
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (WIDTH - PADDING * 2) / sceneData.w,
          (HEIGHT - PADDING * 2) / sceneData.h
        )
      )
    );
    const mapWidth = sceneData.w * scale;
    const mapHeight = sceneData.h * scale;
    const offsetX = Math.floor((WIDTH - mapWidth) / 2);
    const offsetY = Math.floor((HEIGHT - mapHeight) / 2);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#f3efe6";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#d7ddd0";
    ctx.fillRect(2, 2, WIDTH - 4, HEIGHT - 4);
    ctx.fillStyle = "#eef2ea";
    ctx.fillRect(4, 4, WIDTH - 8, HEIGHT - 8);

    for (let y = 0; y < sceneData.h; y++) {
      for (let x = 0; x < sceneData.w; x++) {
        ctx.fillStyle = colorForGround(sceneData.groundTypeAt(x, y));
        ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
      }
    }

    const camX = clamp(
      player.x - Math.floor(VIEW_COLS / 2),
      0,
      Math.max(0, sceneData.w - VIEW_COLS)
    );
    const camY = clamp(
      player.y - Math.floor(VIEW_ROWS / 2),
      0,
      Math.max(0, sceneData.h - VIEW_ROWS)
    );

    ctx.strokeStyle = "rgba(52, 68, 58, 0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      offsetX + camX * scale + 0.5,
      offsetY + camY * scale + 0.5,
      VIEW_COLS * scale,
      VIEW_ROWS * scale
    );

    if (objectiveTarget && (!objectiveTarget.scene || objectiveTarget.scene === scene)) {
      ctx.fillStyle = "#d9b85e";
      ctx.fillRect(
        offsetX + objectiveTarget.x * scale,
        offsetY + objectiveTarget.y * scale,
        Math.max(2, scale),
        Math.max(2, scale)
      );
    }

    ctx.fillStyle = "#2e6d58";
    ctx.fillRect(
      offsetX + player.x * scale - (scale > 2 ? 1 : 0),
      offsetY + player.y * scale - (scale > 2 ? 1 : 0),
      Math.max(3, scale + 1),
      Math.max(3, scale + 1)
    );

    ctx.strokeStyle = "rgba(74, 84, 76, 0.6)";
    ctx.strokeRect(0.5, 0.5, WIDTH - 1, HEIGHT - 1);
  }, [objectiveTarget, player, scene]);

  return (
    <div style={styles.wrap}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={styles.canvas}
      />
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    right: 12,
    bottom: 12,
    padding: 6,
    borderRadius: 8,
    background: "rgba(245, 241, 232, 0.92)",
    border: "1px solid rgba(88, 104, 81, 0.35)",
    boxShadow: "0 8px 18px rgba(34, 46, 37, 0.18)",
    zIndex: 22,
    pointerEvents: "none",
  },
  canvas: {
    display: "block",
    width: WIDTH,
    height: HEIGHT,
    imageRendering: "pixelated",
  },
};
