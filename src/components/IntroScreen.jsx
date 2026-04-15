import React, { useEffect, useRef } from "react";
import { drawTree } from "../renderer/props";

const TITLE_GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
};

function PixelCanvas({ width, height, scale, draw, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    draw(ctx);
  }, [draw, height, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: width * scale,
        height: height * scale,
        imageRendering: "pixelated",
        display: "block",
        ...style,
      }}
    />
  );
}

function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPixelWord(ctx, word, x, y, color) {
  let cursor = x;
  for (const char of word) {
    const glyph = TITLE_GLYPHS[char];
    if (!glyph) {
      cursor += 6;
      continue;
    }
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((bit, colIndex) => {
        if (bit === "1") fill(ctx, cursor + colIndex, y + rowIndex, 1, 1, color);
      });
    });
    cursor += 6;
  }
}

function drawTitle(ctx) {
  drawPixelWord(ctx, "BEAVERBUILD", 0, 0, "#000000");
  fill(ctx, 0, 8, 65, 1, "#000000");
}

function drawCloud(ctx) {
  const white = "#f7fbff";
  const blue1 = "#bfdcf7";
  const blue2 = "#8fc1f0";

  fill(ctx, 6, 3, 8, 5, white);
  fill(ctx, 11, 0, 7, 6, white);
  fill(ctx, 17, 4, 8, 4, white);
  fill(ctx, 3, 6, 22, 4, white);

  fill(ctx, 7, 4, 6, 3, blue1);
  fill(ctx, 12, 1, 5, 4, blue1);
  fill(ctx, 18, 5, 5, 2, blue1);
  fill(ctx, 4, 7, 19, 2, blue1);

  fill(ctx, 6, 7, 4, 2, blue2);
  fill(ctx, 13, 5, 4, 2, blue2);
  fill(ctx, 19, 7, 3, 1, blue2);
}

export default function IntroScreen({ onStart }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "2" || e.key === "Enter" || e.key === " " || e.key === "Tab") {
        e.preventDefault();
        onStart();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart]);

  return (
    <div style={styles.screen}>
      <div style={styles.panel}>
        <PixelCanvas
          width={26}
          height={10}
          scale={9}
          draw={drawCloud}
          style={styles.cloud}
        />

        <PixelCanvas
          width={65}
          height={9}
          scale={9}
          draw={drawTitle}
          style={styles.titleCanvas}
        />

        <div style={styles.content}>
          <p style={styles.subtitle}>
            a short interactive workplace
            <br />
            simulation about ESG decisions
          </p>

          <div style={styles.bodyCopy}>
            <p style={styles.bodyLine}>explore a workplace, meet different characters, and respond</p>
            <p style={styles.bodyLine}>to everyday situations connected to environmental, social,</p>
            <p style={styles.bodyLine}>and governance issues. each conversation reflects a real</p>
            <p style={styles.bodyLine}>tension that can happen inside organizations, and each choice</p>
            <p style={styles.bodyLine}>helps reveal how esg is understood in practice.</p>
          </div>

          <div style={styles.noticeWrap}>
            <div style={styles.noticeLine} />
            <div style={styles.noticeText}>your answers are kept anonymous</div>
          </div>

          <button type="button" style={styles.playButton} onClick={onStart}>
            PLAY
          </button>
        </div>
      </div>

      <PixelCanvas
        width={16}
        height={17}
        scale={9}
        draw={(ctx) => drawTree(ctx, 0, 0, "pine")}
        style={styles.tree}
      />
    </div>
  );
}

const styles = {
  screen: {
    height: "100vh",
    background: "#a3b787",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  panel: {
    position: "relative",
    width: "min(1340px, calc(100vw - 64px))",
    height: "min(740px, calc(100vh - 48px))",
    background: "#e8ecd7",
    overflow: "hidden",
  },
  cloud: {
    position: "absolute",
    right: -16,
    top: -10,
  },
  titleCanvas: {
    position: "absolute",
    top: 56,
    left: "50%",
    transform: "translateX(-50%)",
  },
  content: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 54,
    color: "#000000",
  },
  subtitle: {
    margin: "72px 0 20px",
    textAlign: "center",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(18px, 2vw, 30px)",
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: "-0.05em",
  },
  bodyCopy: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  bodyLine: {
    margin: 0,
    textAlign: "center",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(24px, 2vw, 34px)",
    lineHeight: 1.38,
    fontWeight: 900,
    letterSpacing: "-0.06em",
  },
  noticeWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  noticeLine: {
    width: "min(540px, 52vw)",
    borderTop: "4px solid #000000",
  },
  noticeText: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(18px, 1.6vw, 28px)",
    fontWeight: 900,
    letterSpacing: "-0.05em",
  },
  playButton: {
    marginTop: 2,
    padding: "22px 56px",
    background: "#f8efe7",
    color: "#000000",
    border: "8px solid #000000",
    outline: "8px solid #ffffff",
    boxShadow: "12px 12px 0 rgba(227, 200, 186, 0.9)",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(52px, 4.8vw, 86px)",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.08em",
    cursor: "pointer",
  },
  tree: {
    position: "absolute",
    left: 22,
    bottom: 12,
  },
};
