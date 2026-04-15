// HTML dialog overlay rendered on top of the game canvas.
// Always anchored to the bottom of the canvas — RPG dialog-box style.

import React, { useEffect, useRef, useState } from "react";
import { parseSpeechSegments } from "../engine/dialogSegments";

const NPC_ACCENT = {
  olive: "#7ab068",
  frank: "#5ea8c4",
  otis:  "#c4955e",
  suzy:  "#b07ab8",
  hazel: "#7ab8a0",
  rowan: "#c4b45e",
  daisy: "#a0c47a",
};

export default function DialogOverlay({ dialog, onChoice, onAdvance, onSubmitReflection }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [values, setValues]         = useState({});
  const [openText, setOpenText]     = useState("");
  const historyRef                  = useRef(null);

  useEffect(() => {
    setValues(dialog?.phase === "reflection" ? dialog.initialValues || {} : {});
    setHoveredIdx(null);
    setOpenText("");
  }, [dialog]);

  // Keep history scrolled to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [dialog]);

  const phase        = dialog?.phase || null;
  const isQuestion   = phase === "question";
  const isReaction   = phase === "reaction";
  const isReflection = phase === "reflection";
  const isInfo       = phase === "info";
  const bodyText     = isReaction ? dialog?.reaction : dialog?.message;

  const accent   = dialog ? (NPC_ACCENT[dialog.npcId] || "#7ab068") : "#7ab068";
  const segments = dialog && !isReflection && bodyText ? parseSpeechSegments(dialog, bodyText) : [];
  const history  = dialog && !isReflection && dialog.history?.length > 0 ? dialog.history : [];
  const hasPromptValues = dialog?.prompts?.every((p) => (values[p.id] || "").trim());
  const canAdvanceWithShortcut =
    isInfo ||
    isReaction ||
    (isQuestion && (!dialog?.choices || dialog.choices.length === 0));

  useEffect(() => {
    if (!dialog || !canAdvanceWithShortcut) return undefined;

    function handleWindowKeyDown(event) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const isPrimaryShortcut =
        (event.key === "Tab" && !event.shiftKey) ||
        (event.key === "Enter" && !event.shiftKey);
      if (!isPrimaryShortcut) return;
      event.preventDefault();
      onAdvance();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [canAdvanceWithShortcut, dialog, onAdvance]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!hasPromptValues) return;
    onSubmitReflection(values);
  }

  if (!dialog) return null;

  // ── Centered reflection form (legacy path) ────────────────────────────────
  if (isReflection) {
    return (
      <div style={styles.reflectionBackdrop}>
        <div style={styles.reflectionCard}>
          <div style={{ ...styles.cardHeader, borderColor: accent }}>
            <div style={{ ...styles.accentDot, background: accent }} />
            <div>
              <div style={{ ...styles.npcName, color: accent }}>{dialog.npcName}</div>
              {dialog.npcRole && <div style={styles.npcRole}>{dialog.npcRole}</div>}
            </div>
          </div>
          <form style={styles.form} onSubmit={handleSubmit}>
            {dialog.prompts.map((prompt, index) => (
              <label key={prompt.id} style={styles.promptBlock}>
                <span style={styles.promptText}>{prompt.prompt}</span>
                <textarea
                  value={values[prompt.id] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [prompt.id]: e.target.value }))}
                  onKeyDown={(event) => {
                    const isLastPrompt = index === dialog.prompts.length - 1;
                    const isPrimaryShortcut =
                      (event.key === "Tab" && !event.shiftKey) ||
                      (event.key === "Enter" && !event.shiftKey);
                    if (isPrimaryShortcut && isLastPrompt && hasPromptValues) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  rows={3}
                  style={styles.textarea}
                />
              </label>
            ))}
            <button
              type="submit"
              disabled={!dialog.prompts.every((p) => (values[p.id] || "").trim())}
              style={styles.submitBtn}
            >
              continue to Rowan ▶
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── RPG dialog box — always at the bottom of the canvas ──────────────────
  return (
    <div style={styles.backdrop}>
      <div style={{ ...styles.gameCard, borderTopColor: accent }}>

        {/* Header: NPC identity */}
        <div style={styles.cardHeader}>
          <div style={{ ...styles.accentDot, background: accent }} />
          <div style={styles.headerText}>
            <span style={{ ...styles.npcName, color: accent }}>
              {dialog.npcName || "···"}
            </span>
            {dialog.npcRole && (
              <span style={styles.npcRole}>&nbsp;·&nbsp;{dialog.npcRole}</span>
            )}
          </div>
        </div>

        {/* History: previous exchanges in this dialog */}
        {history.length > 0 && (
          <div ref={historyRef} style={styles.historyArea}>
            {history.map((seg, i) => (
              <div
                key={i}
                style={
                  seg.variant === "player"
                    ? styles.historyPlayer
                    : styles.historyNpc
                }
              >
                <span style={styles.historyLabel}>
                  {seg.variant === "player" ? "You" : seg.speaker}:
                </span>{" "}
                {seg.text}
              </div>
            ))}
          </div>
        )}

        {/* Current message */}
        <div style={styles.messageArea}>
          {segments.length > 0
            ? segments.map((seg, i) => (
                <p key={i} style={styles.message}>
                  {seg.text}
                </p>
              ))
            : bodyText && <p style={styles.message}>{bodyText}</p>}
        </div>

        {/* Choices */}
        {isQuestion && dialog.choices && dialog.choices.length > 0 && (() => {
          const openChoice = dialog.choices.length === 1 && dialog.choices[0].isOpenEnded
            ? dialog.choices[0]
            : null;

          if (openChoice) {
            return (
              <div style={styles.openEndedArea}>
                <textarea
                  style={styles.openTextarea}
                  placeholder="type your response here..."
                  value={openText}
                  onChange={(e) => setOpenText(e.target.value)}
                  onKeyDown={(event) => {
                    const isPrimaryShortcut =
                      (event.key === "Tab" && !event.shiftKey) ||
                      (event.key === "Enter" && !event.shiftKey);
                    if (isPrimaryShortcut && openText.trim()) {
                      event.preventDefault();
                      onChoice({ ...openChoice, label: openText.trim() });
                    }
                  }}
                  rows={3}
                  autoFocus
                />
                <div style={styles.continueRow}>
                  <button
                    type="button"
                    disabled={!openText.trim()}
                    style={{
                      ...styles.continueBtn,
                      borderColor: openText.trim() ? accent : "rgba(180,210,175,0.2)",
                      color: openText.trim() ? accent : "rgba(180,210,175,0.3)",
                    }}
                    onClick={() => onChoice({ ...openChoice, label: openText.trim() })}
                  >
                    submit ▶
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div style={styles.choices}>
              {dialog.choices.map((c, i) => (
                <button
                  key={c.key}
                  style={{
                    ...styles.choice,
                    ...(hoveredIdx === i
                      ? { ...styles.choiceHover, borderColor: accent }
                      : {}),
                  }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => { setHoveredIdx(null); onChoice(c); }}
                >
                  <span style={{ ...styles.choiceNum, background: accent }}>{i + 1}</span>
                  <span style={styles.choiceLabel}>{c.label}</span>
                </button>
              ))}
            </div>
          );
        })()}

        {/* Continue button (info / reaction / empty-choices intro step) */}
        {(isInfo || isReaction || (isQuestion && (!dialog.choices || dialog.choices.length === 0))) && (
          <div style={styles.continueRow}>
            <button
              type="button"
              style={{ ...styles.continueBtn, borderColor: accent, color: accent }}
              onClick={onAdvance}
            >
              continue ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  // ── Backdrop ──────────────────────────────────────────────────────────────
  backdrop: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "stretch",
    zIndex: 100,
    pointerEvents: "none",
    fontFamily: '"Courier New", "Lucida Console", monospace',
  },

  // ── Main game card — RPG dialog box at the bottom ─────────────────────────
  gameCard: {
    width: "100%",
    maxHeight: "54%",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 16px 16px",
    background: "rgba(14, 20, 16, 0.96)",
    borderTop: "3px solid",
    pointerEvents: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(122,176,104,0.3) transparent",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  accentDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
  },
  headerText: {
    display: "flex",
    alignItems: "baseline",
    gap: 0,
    flexWrap: "wrap",
  },
  npcName: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  npcRole: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "rgba(180,200,175,0.55)",
  },

  // ── History area ─────────────────────────────────────────────────────────
  historyArea: {
    maxHeight: 52,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    scrollbarWidth: "none",
  },
  historyNpc: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "rgba(160,190,155,0.55)",
  },
  historyPlayer: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "rgba(190,215,185,0.55)",
    textAlign: "right",
  },
  historyLabel: {
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 10,
  },

  // ── Current message ───────────────────────────────────────────────────────
  messageArea: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  message: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.65,
    color: "#ddeedd",
    whiteSpace: "pre-line",
  },

  // ── Choices ───────────────────────────────────────────────────────────────
  choices: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginTop: 4,
  },
  choice: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(180,210,175,0.2)",
    borderRadius: 4,
    color: "#c8ddc4",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "background 0.1s, border-color 0.1s",
  },
  choiceHover: {
    background: "rgba(122,176,104,0.18)",
    color: "#e8f5e4",
  },
  choiceNum: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0e1410",
    fontSize: 11,
    fontWeight: 900,
  },
  choiceLabel: {
    lineHeight: 1.4,
  },

  // ── Continue ──────────────────────────────────────────────────────────────
  continueRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  continueBtn: {
    padding: "7px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid",
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "inherit",
    fontWeight: 800,
    letterSpacing: 1,
    cursor: "pointer",
    textTransform: "uppercase",
  },

  // ── Reflection (centered overlay) ─────────────────────────────────────────
  reflectionBackdrop: {
    position: "absolute",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(8,14,10,0.55)",
    backdropFilter: "blur(4px)",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    pointerEvents: "auto",
  },
  reflectionCard: {
    width: "min(680px, calc(100% - 32px))",
    maxHeight: "calc(100% - 32px)",
    overflowY: "auto",
    background: "rgba(14,20,16,0.97)",
    border: "2px solid rgba(122,176,104,0.5)",
    borderRadius: 8,
    padding: "20px 22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
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
  promptText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#c8ddc4",
  },
  textarea: {
    resize: "vertical",
    minHeight: 82,
    borderRadius: 4,
    border: "1px solid rgba(122,176,104,0.4)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px",
    font: "inherit",
    color: "#ddeedd",
    fontSize: 14,
    outline: "none",
  },
  openEndedArea: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 4,
  },
  openTextarea: {
    resize: "vertical",
    minHeight: 70,
    borderRadius: 4,
    border: "1px solid rgba(122,176,104,0.4)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px",
    font: "inherit",
    color: "#ddeedd",
    fontSize: 13,
    outline: "none",
    fontFamily: '"Courier New", "Lucida Console", monospace',
  },
  submitBtn: {
    alignSelf: "flex-end",
    padding: "9px 18px",
    background: "rgba(122,176,104,0.15)",
    border: "1px solid #7ab068",
    borderRadius: 4,
    color: "#7ab068",
    font: "inherit",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    cursor: "pointer",
  },
};
