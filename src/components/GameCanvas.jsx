// Canvas component: owns the canvas element and the RAF draw loop.
// Receives all render-relevant state as props so the draw loop is
// always working with current values.

import React, { useEffect, useRef, useState } from "react";
import { VIEW_COLS, VIEW_ROWS, TILE, SCALE } from "../constants/game";
import { drawScene } from "../renderer/drawScene";
import DialogOverlay from "./DialogOverlay";
import MiniMap from "./MiniMap";
import ResultsOverlay from "./ResultsOverlay";
import CouncilMeeting from "./CouncilMeeting";

export default function GameCanvas({
  scene,
  playerRef,
  npcRefs,      // { town: Ref, office: Ref }
  quest,
  nearbyTarget,
  objectiveTarget,
  banner,
  dialog,
  reportOpen,
  resultsReport,
  councilOpen,
  onChoice,
  onAdvance,
  onSubmitReflection,
  onCloseResults,
  onOpenResults,
  onCloseCouncil,
}) {
  const canvasRef      = useRef(null);
  const viewportWidth  = VIEW_COLS * TILE;
  const viewportHeight = VIEW_ROWS * TILE;
  const [displayScale, setDisplayScale] = useState(SCALE);

  useEffect(() => {
    function updateScale() {
      const widthScale = (window.innerWidth - 40) / viewportWidth;
      const heightScale = (window.innerHeight - 150) / viewportHeight;
      const nextScale = Math.max(1.5, Math.min(SCALE, widthScale, heightScale));
      setDisplayScale(nextScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [viewportHeight, viewportWidth]);

  // The draw loop restarts whenever these state values change so the RAF
  // closure always captures their latest versions.
  // playerRef / npcRefs are mutable refs — read fresh on every frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    function draw() {
      drawScene(ctx, {
        scene,
        player:     playerRef.current,
        townNpcs:   npcRefs.town.current,
        officeNpcs: npcRefs.office.current,
        nearbyTarget,
        objectiveTarget,
        viewportWidth,
        viewportHeight,
      });
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [scene, nearbyTarget, objectiveTarget]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div style={styles.stageCard}>
      <div style={styles.canvasShell}>
        <div style={styles.canvasInnerFrame}>
          <canvas
            ref={canvasRef}
            width={viewportWidth}
            height={viewportHeight}
            style={{
              width: viewportWidth * displayScale,
              height: viewportHeight * displayScale,
              imageRendering: "pixelated",
              display: "block",
            }}
          />
          {banner && (
            <div style={styles.objectiveBanner}>
              <div style={styles.bannerTitle}>{banner.title}</div>
              <div style={styles.bannerText}>{banner.message}</div>
            </div>
          )}
          <MiniMap
            scene={scene}
            player={playerRef.current}
            objectiveTarget={objectiveTarget}
          />
          <DialogOverlay
            dialog={dialog}
            onChoice={onChoice}
            onAdvance={onAdvance}
            onSubmitReflection={onSubmitReflection}
          />
          {councilOpen && !reportOpen && (
            <CouncilMeeting
              quest={quest}
              onClose={onCloseCouncil}
            />
          )}
          {reportOpen && (
            <ResultsOverlay
              report={resultsReport}
              onClose={onCloseResults}
            />
          )}
          {!reportOpen && quest?.stage === "complete" && (
            <button type="button" style={styles.reportButton} onClick={onOpenResults}>
              view report
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

const styles = {
  stageCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 12,
    borderRadius: 16,
    background: "rgba(250, 248, 244, 0.99)",
    border: "1.5px solid rgba(95, 112, 86, 0.2)",
    boxShadow:
      "0 16px 40px rgba(38, 54, 42, 0.14), 0 2px 8px rgba(38, 54, 42, 0.06)",
  },
  canvasShell: {
    padding: 7,
    borderRadius: 11,
    background: "#c0ccbc",
    border: "1px solid rgba(72, 92, 68, 0.24)",
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
  },
  canvasInnerFrame: {
    position: "relative",
    padding: 5,
    borderRadius: 7,
    background: "linear-gradient(180deg, #4c6852 0%, #3a5240 100%)",
    boxShadow:
      "inset 0 2px 0 rgba(255,255,255,0.16), inset 0 -2px 0 rgba(0,0,0,0.24), 0 3px 10px rgba(0,0,0,0.2)",
  },
  objectiveBanner: {
    position: "absolute",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(680px, calc(100% - 32px))",
    padding: "10px 20px",
    borderRadius: 12,
    background: "rgba(253, 250, 243, 0.96)",
    border: "1px solid rgba(110, 138, 88, 0.3)",
    boxShadow: "0 8px 20px rgba(38, 54, 42, 0.18)",
    backdropFilter: "blur(8px)",
    zIndex: 20,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#7a6e56",
    fontWeight: 700,
  },
  bannerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#37463c",
    lineHeight: 1.4,
    fontWeight: 500,
  },
  reportButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    zIndex: 25,
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    background: "rgba(248, 244, 235, 0.96)",
    color: "#33453b",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.2,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(38, 54, 42, 0.2)",
  },
};
