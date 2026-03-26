// HTML dialog overlay rendered on top of the game canvas.
// Supports info cards, choice prompts, reactions, and reflection text input.

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { parseSpeechSegments } from "../engine/dialogSegments";

export default function DialogOverlay({ dialog, anchor, onChoice, onAdvance, onSubmitReflection }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [values, setValues] = useState({});
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [cardPosition, setCardPosition] = useState(null);
  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const positionLockRef = useRef(null);

  useEffect(() => {
    if (dialog?.phase === "reflection") {
      setValues(dialog.initialValues || {});
    } else {
      setValues({});
    }
    setSegmentIndex(0);
  }, [dialog]);

  useEffect(() => {
    if (!dialog) {
      positionLockRef.current = null;
      setCardPosition(null);
    }
  }, [dialog]);

  const isQuestion = dialog?.phase === "question";
  const isReaction = dialog?.phase === "reaction";
  const isReflection = dialog?.phase === "reflection";
  const isInfo = dialog?.phase === "info";
  const bodyText = isReaction ? dialog?.reaction : dialog?.message;
  const historySegments = !isReflection && dialog?.history ? dialog.history : [];
  const activeSegments = isReflection || !dialog ? [] : parseSpeechSegments(dialog, bodyText);
  const visibleActiveSegments = !isReflection && activeSegments.length > 0
    ? activeSegments.slice(0, segmentIndex + 1)
    : activeSegments;
  const visibleSegments = [...historySegments, ...visibleActiveSegments];
  const hasMoreSegments = segmentIndex < activeSegments.length - 1;

  useLayoutEffect(() => {
    if (!dialog || isReflection) {
      setCardPosition(null);
      return;
    }

    if (positionLockRef.current) {
      setCardPosition(positionLockRef.current);
      return;
    }

    const backdrop = backdropRef.current;
    const card = cardRef.current;
    if (!backdrop || !card) return;

    const margin = 12;
    const backdropRect = backdrop.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const maxLeft = Math.max(margin, backdropRect.width - cardRect.width - margin);
    const maxTop = Math.max(margin, backdropRect.height - cardRect.height - margin);

    let left = (backdropRect.width - cardRect.width) / 2;
    let top = margin;
    let placement = "above";

    if (anchor) {
      left = Math.max(margin, Math.min(anchor.left - cardRect.width / 2, maxLeft));

      if (anchor.placement === "below") {
        top = anchor.top + 18;
        placement = "below";
        if (top > maxTop) {
          top = Math.max(margin, anchor.top - cardRect.height - 12);
          placement = "above";
        }
      } else {
        top = anchor.top - cardRect.height - 12;
        placement = "above";
        if (top < margin) {
          top = Math.min(maxTop, anchor.top + 18);
          placement = "below";
        }
      }
    }

    const lockedPosition = {
      left,
      top: Math.max(margin, Math.min(top, maxTop)),
      placement,
    };

    positionLockRef.current = lockedPosition;
    setCardPosition(lockedPosition);
  }, [anchor, dialog, isReflection]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!dialog.prompts?.every((prompt) => (values[prompt.id] || "").trim())) return;
    onSubmitReflection(values);
  }

  function handleContinueSegment() {
    if (hasMoreSegments) {
      setSegmentIndex((prev) => prev + 1);
      return;
    }

    onAdvance?.();
  }

  if (!dialog) return null;

  return (
    <div
      ref={backdropRef}
      style={{
        ...styles.backdrop,
        ...(isReflection ? styles.reflectionBackdrop : styles.inGameBackdrop),
      }}
    >
      <div
        ref={cardRef}
        style={{
          ...styles.card,
          ...(isReflection ? styles.reflectionCard : styles.speechBubbleCard),
          ...(!isReflection
            ? cardPosition || styles.defaultInGameCard
            : {}),
        }}
      >
        {isReflection && dialog.npcName && (
          <div style={styles.header}>
            <span style={styles.npcName}>{dialog.npcName}</span>
            {dialog.npcRole && <span style={styles.npcRole}>{dialog.npcRole}</span>}
          </div>
        )}

        {!isReflection && visibleSegments.length > 0 && (
          <div style={styles.speechStack}>
            {visibleSegments.map((segment, index) => {
              const isPlayerBubble = segment.variant === "player";
              const isNoteBubble = segment.variant === "note";

              return (
                <div
                  key={`${segment.speaker}-${index}`}
                  style={{
                    ...styles.speechRow,
                    ...(isPlayerBubble ? styles.speechRowPlayer : {}),
                    ...(isNoteBubble ? styles.speechRowNote : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.speechBubble,
                      ...(isPlayerBubble ? styles.playerSpeechBubble : {}),
                      ...(isNoteBubble ? styles.noteSpeechBubble : {}),
                    }}
                  >
                    <div style={styles.speechMeta}>
                      <span style={styles.speechSpeaker}>{segment.speaker}</span>
                      {segment.role && !isPlayerBubble && (
                        <span style={styles.speechRole}>{segment.role}</span>
                      )}
                    </div>
                    <div style={styles.message}>{segment.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isReflection && activeSegments.length === 0 && bodyText && <div style={styles.message}>{bodyText}</div>}

        {isQuestion && dialog.choices && !hasMoreSegments && (
          <div style={styles.choices}>
            {dialog.choices.map((c, i) => (
              <button
                key={c.key}
                style={{
                  ...styles.choice,
                  ...(hoveredIdx === i ? styles.choiceHover : {}),
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  setHoveredIdx(null);
                  onChoice(c);
                }}
              >
                <span style={styles.choiceIndex}>{i + 1}</span>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {isReflection && (
          <form style={styles.form} onSubmit={handleSubmit}>
            {dialog.prompts.map((prompt) => (
              <label key={prompt.id} style={styles.promptBlock}>
                <span style={styles.promptSpeaker}>{prompt.speaker}</span>
                <span style={styles.promptText}>{prompt.prompt}</span>
                <textarea
                  value={values[prompt.id] || ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [prompt.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  style={styles.textarea}
                />
              </label>
            ))}

            <button
              type="submit"
              style={{
                ...styles.submit,
                ...(dialog.prompts.every((prompt) => (values[prompt.id] || "").trim()) ? null : styles.submitDisabled),
              }}
            >
              continue to Rowan
            </button>
          </form>
        )}

        {isQuestion && hasMoreSegments && (
          <div style={styles.notedRow}>
            <button type="button" style={styles.notedButton} onClick={handleContinueSegment}>
              continue
            </button>
          </div>
        )}

        {isReaction && (
          <div style={styles.notedRow}>
            <button type="button" style={styles.notedButton} onClick={handleContinueSegment}>
              continue
            </button>
          </div>
        )}

        {isInfo && (
          <div style={styles.notedRow}>
            <button type="button" style={styles.notedButton} onClick={handleContinueSegment}>
              continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 100,
    pointerEvents: "none",
    fontFamily: '"Courier New", "Lucida Console", monospace',
  },
  inGameBackdrop: {
    paddingTop: 0,
  },
  reflectionBackdrop: {
    alignItems: "center",
    background: "rgba(32, 41, 34, 0.28)",
  },
  card: {
    width: "min(600px, 92vw)",
    maxHeight: "calc(100% - 24px)",
    overflowY: "auto",
    padding: "14px 14px 12px",
    borderRadius: 18,
    background: "#eef3eb",
    border: "2px solid rgba(74, 95, 80, 0.38)",
    boxShadow: "0 18px 36px rgba(37, 50, 41, 0.22)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "auto",
    position: "absolute",
  },
  speechBubbleCard: {
    width: "min(640px, calc(100% - 24px))",
    maxWidth: "calc(100% - 24px)",
    height: "min(236px, calc(100% - 24px))",
    scrollbarGutter: "stable",
  },
  defaultInGameCard: {
    left: 12,
    right: 12,
    top: 12,
  },
  reflectionCard: {
    width: "min(760px, 94vw)",
    height: "auto",
    background: "#f5eedf",
    boxShadow: "0 18px 36px rgba(37, 50, 41, 0.22)",
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    paddingBottom: 4,
    borderBottom: "3px solid #405145",
  },
  speechStack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 4,
    borderRadius: 16,
    background: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(95, 114, 97, 0.12)",
  },
  speechRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  speechRowPlayer: {
    justifyContent: "flex-end",
  },
  speechRowNote: {
    justifyContent: "center",
  },
  speechBubble: {
    position: "relative",
    width: "fit-content",
    maxWidth: "84%",
    padding: "10px 12px",
    background: "#fffdf8",
    border: "1px solid rgba(70, 92, 77, 0.2)",
    borderRadius: "18px 18px 18px 8px",
    boxShadow: "0 4px 14px rgba(39, 53, 43, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  playerSpeechBubble: {
    background: "#dfeae0",
    borderColor: "rgba(90, 122, 102, 0.28)",
    borderRadius: "18px 18px 8px 18px",
    boxShadow: "0 4px 14px rgba(52, 76, 59, 0.12)",
  },
  noteSpeechBubble: {
    background: "#f2efe7",
    borderColor: "rgba(127, 135, 120, 0.26)",
    borderRadius: 16,
    boxShadow: "0 4px 14px rgba(66, 72, 62, 0.08)",
  },
  speechMeta: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  speechSpeaker: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#4f6556",
  },
  speechRole: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#8d7d62",
  },
  npcName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#2d3d34",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  npcRole: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#7a6b52",
  },
  message: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#2c3831",
    whiteSpace: "pre-line",
  },
  choices: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    marginTop: 4,
  },
  choice: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(104, 126, 104, 0.28)",
    background: "#f7faf4",
    color: "#2d3d34",
    fontSize: 12,
    fontFamily: "inherit",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(52, 76, 59, 0.08)",
    transition: "background 0.12s, transform 0.08s",
    width: "100%",
  },
  choiceHover: {
    background: "#edf4ea",
    transform: "translateY(-1px)",
  },
  choiceIndex: {
    flexShrink: 0,
    width: 20,
    height: 20,
    background: "#5d7763",
    color: "#f7f2e8",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  promptBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  promptSpeaker: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#7a6b52",
  },
  promptText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#364239",
  },
  textarea: {
    resize: "vertical",
    minHeight: 82,
    borderRadius: 0,
    border: "3px solid #6f816d",
    background: "#fcfaf4",
    padding: "10px 10px",
    font: "inherit",
    color: "#2d3d34",
    outline: "none",
    boxShadow: "inset 0 2px 0 rgba(64,81,69,0.1)",
  },
  submit: {
    alignSelf: "flex-end",
    marginTop: 4,
    padding: "9px 14px",
    borderRadius: 0,
    border: "3px solid #6f816d",
    background: "#e4eadf",
    color: "#2d3d34",
    font: "inherit",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 3px 0 #6f816d",
  },
  submitDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  notedRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  notedButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 13px",
    borderRadius: 999,
    background: "#e6eee4",
    border: "1px solid rgba(104, 126, 104, 0.34)",
    color: "#3b5941",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    fontFamily: "inherit",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(52, 76, 59, 0.08)",
  },
};
