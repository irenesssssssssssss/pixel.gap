// AI-powered council meeting overlay.
// Voice input via Web Speech API, text fallback.
// Calls our backend council AI route to play all NPC characters adaptively.

import React, { useEffect, useRef, useState } from "react";
import { COUNCIL_NPCS, callCouncilAI, parseCouncilResponse } from "../engine/councilAI";
import { drawCritter } from "../renderer/characters";

// ── Constants ─────────────────────────────────────────────────────────────────

const KICKSTART_MESSAGE =
  "the council is now gathered and the player has arrived. open the meeting as Olive, welcoming them warmly and asking one reflective question based on a specific choice they made during their journey.";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CouncilMeeting({ quest, onClose }) {
  // Conversation state
  const [apiHistory, setApiHistory]       = useState([]);
  const [displayMsgs, setDisplayMsgs]     = useState([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [error, setError]                 = useState(null);
  const [userTurns, setUserTurns]         = useState(0);
  const [handsFreeMode, setHandsFreeMode] = useState(true);

  // Input state
  const [textInput, setTextInput]         = useState("");
  const [interimText, setInterimText]     = useState(""); // live speech transcript
  const [isListening, setIsListening]     = useState(false);

  // Refs
  const recognitionRef  = useRef(null);
  const listEndRef      = useRef(null);
  const inputRef        = useRef(null);
  const apiHistoryRef   = useRef(apiHistory);
  const isLoadingRef    = useRef(isLoading);
  const isListeningRef  = useRef(isListening);
  const isSpeakingRef   = useRef(false);
  const handsFreeRef    = useRef(handsFreeMode);
  const autoDraftRef    = useRef("");
  const suppressEndRef  = useRef(false);
  const audioRef        = useRef(null);
  const audioUrlRef     = useRef("");

  const hasVoice = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const canPlayAudio = typeof window !== "undefined" && typeof Audio !== "undefined";
  const canHandsFree = hasVoice && canPlayAudio;

  useEffect(() => {
    apiHistoryRef.current = apiHistory;
  }, [apiHistory]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    handsFreeRef.current = handsFreeMode;
  }, [handsFreeMode]);

  useEffect(() => {
    if (!canHandsFree && handsFreeMode) {
      setHandsFreeMode(false);
    }
  }, [canHandsFree, handsFreeMode]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMsgs, isLoading]);

  function stopListening(useAbort = false) {
    if (!recognitionRef.current || !isListeningRef.current) return;
    suppressEndRef.current = true;

    try {
      if (useAbort) recognitionRef.current.abort();
      else recognitionRef.current.stop();
    } catch {
      suppressEndRef.current = false;
    }
  }

  function startListening() {
    if (!recognitionRef.current || isListeningRef.current || isLoadingRef.current || isSpeakingRef.current) {
      return;
    }

    autoDraftRef.current = "";
    suppressEndRef.current = false;
    setTextInput("");
    setInterimText("");
    setError(null);

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }

  function stopCouncilAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }

  function submitConversationText(nextText) {
    const text = nextText.trim();
    if (!text || isLoadingRef.current) return;

    autoDraftRef.current = "";
    stopListening(true);

    const playerEntry = { role: "user", content: text };
    const nextHistory = [...apiHistoryRef.current, playerEntry];

    setDisplayMsgs((prev) => [
      ...prev,
      { id: Date.now(), type: "player", text },
    ]);
    setTextInput("");
    setInterimText("");
    setUserTurns((n) => n + 1);
    sendToAI(nextHistory, nextHistory);
  }

  async function playCouncilReply(reply) {
    if (!handsFreeRef.current) return;

    stopCouncilAudio();
    stopListening(true);
    if (!reply.audioBase64) {
      if (reply.audioError) {
        setError(reply.audioError);
      }
      if (!isLoadingRef.current) {
        window.setTimeout(() => startListening(), 280);
      }
      return;
    }

    try {
      const audioBytes = Uint8Array.from(atob(reply.audioBase64), (char) => char.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: reply.audioMime || "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      audioUrlRef.current = audioUrl;

      audio.onended = () => {
        stopCouncilAudio();
        if (handsFreeRef.current && !isLoadingRef.current) {
          window.setTimeout(() => startListening(), 280);
        }
      };

      audio.onerror = () => {
        stopCouncilAudio();
        if (handsFreeRef.current && !isLoadingRef.current) {
          window.setTimeout(() => startListening(), 280);
        }
      };

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      await audio.play();
    } catch (playbackError) {
      stopCouncilAudio();
      setError(`AI voice playback failed: ${String(playbackError?.message || playbackError)}`);
      if (handsFreeRef.current && !isLoadingRef.current) {
        window.setTimeout(() => startListening(), 280);
      }
    }
  }

  // ── Speech recognition setup ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasVoice) return;

    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = "en-US";

    rec.onresult = (event) => {
      let interim = "";
      let final   = "";
      for (const result of event.results) {
        if (result.isFinal) final   += result[0].transcript;
        else                interim += result[0].transcript;
      }
      setInterimText(interim);
      if (final) {
        const appended = appendTranscript(autoDraftRef.current, final);
        autoDraftRef.current = appended;
        setTextInput(appended);
      }
    };

    rec.onerror = () => {
      setIsListening(false);
      setInterimText("");
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText("");
      if (suppressEndRef.current) {
        suppressEndRef.current = false;
        return;
      }

      if (handsFreeRef.current && autoDraftRef.current.trim() && !isLoadingRef.current && !isSpeakingRef.current) {
        const spokenReply = autoDraftRef.current;
        autoDraftRef.current = "";
        submitConversationText(spokenReply);
      }
    };

    recognitionRef.current = rec;
    return () => rec.abort();
  }, [hasVoice]);

  // ── AI opening message on mount ─────────────────────────────────────────────
  useEffect(() => {
    const opening = [{ role: "user", content: KICKSTART_MESSAGE }];
    sendToAI(opening, opening);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopCouncilAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core AI call ─────────────────────────────────────────────────────────────
  async function sendToAI(historyForApi, nextHistory) {
    isLoadingRef.current = true;
    stopListening(true);
    setIsLoading(true);
    setError(null);
    let didReply = false;
    try {
      const reply = await callCouncilAI(quest, historyForApi, {
        includeAudio: handsFreeRef.current,
      });
      const parsed = parseCouncilResponse(reply.text);

      const assistantEntry = { role: "assistant", content: reply.text };
      setApiHistory([...nextHistory, assistantEntry]);

      setDisplayMsgs((prev) => [
        ...prev,
        { id: Date.now(), type: "npc", npcId: parsed.npcId,
          name: parsed.name, accent: parsed.accent, text: parsed.text },
      ]);

      didReply = true;
      await playCouncilReply(reply);
    } catch (e) {
      setError(e.message || "The council fell silent. Please try again.");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      if (!didReply && handsFreeRef.current && canHandsFree) {
        window.setTimeout(() => startListening(), 280);
      } else if (didReply && handsFreeRef.current && canHandsFree && !isSpeakingRef.current && !isListeningRef.current) {
        window.setTimeout(() => startListening(), 280);
      }
    }
  }

  // ── Submit user message ───────────────────────────────────────────────────────
  function handleSubmit() {
    submitConversationText(textInput);
  }

  // ── Keyboard shortcut ────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Voice controls ────────────────────────────────────────────────────────────
  function toggleMic() {
    if (!recognitionRef.current) return;
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }

  function toggleHandsFree() {
    setHandsFreeMode((prev) => {
      const next = !prev;
      handsFreeRef.current = next;

      if (!next) {
        autoDraftRef.current = "";
        stopListening(true);
        stopCouncilAudio();
      } else if (canHandsFree && !isLoadingRef.current && !isSpeakingRef.current) {
        window.setTimeout(() => startListening(), 180);
      }

      return next;
    });
  }

  // ── Conclude ─────────────────────────────────────────────────────────────────
  function handleConclude() {
    if (recognitionRef.current) recognitionRef.current.abort();
    handsFreeRef.current = false;
    stopCouncilAudio();
    onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const canConclude = userTurns > 0 && !isLoading;
  const inputValue  = isListening ? (textInput + interimText) : textInput;
  const latestNpcMessage =
    [...displayMsgs].reverse().find((msg) => msg.type === "npc") || null;
  const activeNpcId = latestNpcMessage?.npcId || "olive";
  const activeNpc =
    COUNCIL_NPCS.find((npc) => npc.id === activeNpcId) || COUNCIL_NPCS[0];

  return (
    <div style={styles.overlay}>
      <button
        type="button"
        style={{
          ...styles.closeButton,
          ...(canConclude ? null : styles.closeButtonDisabled),
        }}
        onClick={handleConclude}
        disabled={!canConclude}
        title={canConclude ? "conclude council meeting" : "share at least one reply first"}
      >
        ×
      </button>

      <div style={styles.title}>Council Meeting</div>

      <CouncilScene activeNpcId={activeNpcId} />

      <div style={styles.bottomRow}>
        <div style={styles.transcriptPanel}>
          <div style={styles.transcriptHeader}>
            <div style={styles.transcriptStatus}>
              {handsFreeMode && canHandsFree
                ? isSpeaking
                  ? `${activeNpc.name} is speaking`
                  : isListening
                  ? "Listening..."
                  : "AI voice conversation"
                : "Council transcript"}
            </div>
            {canHandsFree && (
              <button
                type="button"
                style={{
                  ...styles.miniPixelButton,
                  ...(handsFreeMode ? styles.miniPixelButtonActive : null),
                }}
                onClick={toggleHandsFree}
              >
                {handsFreeMode ? "Voice On" : "Voice Off"}
              </button>
            )}
          </div>

          <div style={styles.transcriptBody}>
            {displayMsgs.length === 0 && !isLoading && (
              <div style={styles.emptyState}>
                the council is gathering. olive will open the conversation.
              </div>
            )}

            {displayMsgs.map((msg) => (
              <TranscriptLine key={msg.id} msg={msg} />
            ))}

            {isLoading && <LoadingDots />}
            {error && <ErrorLine text={error} />}
            <div ref={listEndRef} />
          </div>

          <div style={styles.inputDock}>
            {hasVoice && (
              <button
                type="button"
                style={{
                  ...styles.sideModeButton,
                  ...(isListening ? styles.sideModeButtonActive : null),
                }}
                onClick={toggleMic}
                disabled={isLoading || isSpeaking}
                title={isListening ? "stop listening" : "start listening"}
              >
                {isListening ? "LIVE" : "MIC"}
              </button>
            )}

            <div style={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                style={{
                  ...styles.input,
                  ...(handsFreeMode && canHandsFree ? styles.inputHandsFree : null),
                }}
                value={inputValue}
                onChange={(e) => !isListening && setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  handsFreeMode && canHandsFree
                    ? isSpeaking
                      ? "the council is speaking..."
                      : isListening
                      ? "listening... your reply will send automatically"
                      : "hands-free mode is on — you can still type if you want"
                    : isListening
                    ? "listening..."
                    : "type your response..."
                }
                rows={2}
                disabled={isListening || isLoading || isSpeaking}
              />
              {isListening && interimText && (
                <div style={styles.interimOverlay}>{interimText}</div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.sideButtonColumn}>
          {!(handsFreeMode && canHandsFree) && (
            <button
              type="button"
              style={{
                ...styles.bigPixelButton,
                ...((!textInput.trim() || isLoading || isSpeaking) ? styles.bigPixelButtonDisabled : {}),
              }}
              onClick={handleSubmit}
              disabled={!textInput.trim() || isLoading || isSpeaking}
            >
              TYPE YOUR
              <br />
              ANSWERS
            </button>
          )}

          {handsFreeMode && canHandsFree && (
            <button
              type="button"
              style={{
                ...styles.bigPixelButton,
                ...(isSpeaking || isListening ? styles.bigPixelButtonActive : {}),
              }}
              onClick={toggleHandsFree}
            >
              {isSpeaking
                ? "AI VOICE"
                : isListening
                ? "LISTENING"
                : "VOICE ON"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TranscriptLine({ msg }) {
  return (
    <div
      style={{
        ...styles.transcriptLine,
        ...(msg.type === "player" ? styles.transcriptLinePlayer : styles.transcriptLineNpc),
      }}
    >
      <div
        style={{
          ...styles.transcriptLabel,
          color: msg.type === "npc" ? msg.accent : "#7b5d2b",
        }}
      >
        {msg.type === "npc" ? msg.name : "You"}
      </div>
      <div style={styles.transcriptText}>{msg.text}</div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={styles.loadingLine}>
      <span style={styles.dot}>.</span>
      <span style={{ ...styles.dot, animationDelay: "0.18s" }}>.</span>
      <span style={{ ...styles.dot, animationDelay: "0.36s" }}>.</span>
    </div>
  );
}

function ErrorLine({ text }) {
  return <div style={styles.errorLine}>{text}</div>;
}

function CouncilScene({ activeNpcId }) {
  return (
    <div style={styles.stageArea}>
      <div style={styles.tableShadow} />
      <div style={styles.tableTop} />
      <div style={styles.tableLip} />
      <div style={styles.tableCup} />

      {COUNCIL_NPCS.map((npc) => {
        const layout = COUNCIL_STAGE_LAYOUT[npc.id];
        return (
          <div
            key={npc.id}
            style={{
              ...styles.avatarSlot,
              left: layout.left,
              top: layout.top,
              zIndex: layout.layer,
              transform: `translate(-50%, -50%) scale(${layout.scale})`,
            }}
          >
            <PixelCritterAvatar
              species={COUNCIL_SPECIES[npc.id]}
              direction={layout.dir}
              active={npc.id === activeNpcId}
              accent={npc.accent}
            />
          </div>
        );
      })}
    </div>
  );
}

function PixelCritterAvatar({ species, direction, active, accent }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    drawCritter(ctx, 6, 10, species, direction, 0, false);
  }, [species, direction]);

  return (
    <div
      style={{
        ...styles.avatarWrap,
        ...(active ? { boxShadow: `0 0 0 4px ${hexToRgba(accent, 0.28)}` } : null),
      }}
    >
      <canvas
        ref={canvasRef}
        width={28}
        height={32}
        style={styles.avatarCanvas}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 110,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 18,
    padding: "26px 24px 18px",
    background: "#b8e986",
    fontFamily: '"Courier New", monospace',
    pointerEvents: "auto",
  },
  closeButton: {
    position: "absolute",
    left: 28,
    top: 26,
    width: 60,
    height: 60,
    borderRadius: "50%",
    border: "4px solid #b10000",
    background: "#ff2a2a",
    color: "#fff6f6",
    fontSize: 44,
    lineHeight: 1,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(0,0,0,0.25)",
    pointerEvents: "auto",
  },
  closeButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  title: {
    fontSize: 54,
    lineHeight: 1,
    fontWeight: 700,
    color: "#e7b33d",
    letterSpacing: 1,
    marginTop: 6,
    textShadow: "4px 0 0 #e7b33d, -4px 0 0 #e7b33d, 0 4px 0 #e7b33d, 0 -4px 0 #e7b33d",
    textTransform: "capitalize",
    pointerEvents: "none",
  },
  stageArea: {
    position: "relative",
    width: "min(1080px, 100%)",
    height: "min(430px, 42vh)",
    minHeight: 320,
    pointerEvents: "none",
  },
  tableTop: {
    position: "absolute",
    left: "50%",
    top: "52%",
    width: 560,
    height: 126,
    transform: "translate(-50%, -50%)",
    borderRadius: 999,
    background: "linear-gradient(180deg, #f4c390 0%, #efbe8a 100%)",
    boxShadow: "0 8px 0 #d19a72",
  },
  tableLip: {
    position: "absolute",
    left: "50%",
    top: "58%",
    width: 610,
    height: 34,
    transform: "translate(-50%, -50%)",
    borderRadius: 999,
    background: "#d49771",
  },
  tableShadow: {
    position: "absolute",
    left: "50%",
    bottom: 18,
    width: 500,
    height: 34,
    transform: "translateX(-50%)",
    borderRadius: 999,
    background: "rgba(120, 171, 87, 0.35)",
  },
  tableCup: {
    position: "absolute",
    left: "50%",
    top: "46.5%",
    width: 28,
    height: 42,
    transform: "translate(-50%, -50%)",
    borderRadius: 6,
    background: "linear-gradient(180deg, #fef6ef 0%, #ddd2c6 100%)",
    border: "3px solid #9f724d",
    boxShadow: "10px 0 0 -8px #fef6ef, 10px 0 0 -5px #9f724d",
  },
  avatarSlot: {
    position: "absolute",
    transformOrigin: "center center",
  },
  avatarWrap: {
    width: 110,
    height: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  avatarCanvas: {
    width: 110,
    height: 126,
    imageRendering: "pixelated",
    filter: "drop-shadow(0 4px 0 rgba(0,0,0,0.18))",
  },
  bottomRow: {
    width: "min(1400px, 100%)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 24,
  },
  transcriptPanel: {
    flex: 1,
    minWidth: 0,
    height: 214,
    background: "#e7c8a6",
    borderRadius: 18,
    border: "6px solid #fff0f0",
    boxShadow: "0 6px 0 rgba(206, 162, 128, 0.9)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  transcriptHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 14px 6px",
  },
  transcriptStatus: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#6d5428",
    letterSpacing: 1,
  },
  miniPixelButton: {
    border: "4px solid #000",
    background: "#f0debd",
    color: "#000",
    fontSize: 12,
    fontFamily: "inherit",
    fontWeight: 700,
    padding: "7px 10px",
    boxShadow: "6px 6px 0 rgba(0,0,0,0.18)",
    cursor: "pointer",
  },
  miniPixelButtonActive: {
    background: "#fff2d8",
  },
  transcriptBody: {
    flex: 1,
    overflowY: "auto",
    padding: "2px 14px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyState: {
    fontSize: 16,
    lineHeight: 1.45,
    color: "#6a5a42",
    whiteSpace: "pre-wrap",
  },
  transcriptLine: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontSize: 16,
    lineHeight: 1.4,
    color: "#3f3422",
  },
  transcriptLineNpc: {
    alignItems: "flex-start",
  },
  transcriptLinePlayer: {
    alignItems: "flex-end",
    textAlign: "right",
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  transcriptText: {
    whiteSpace: "pre-wrap",
  },
  loadingLine: {
    fontSize: 28,
    lineHeight: 1,
    color: "#6d5428",
  },
  dot: {
    display: "inline-block",
    animation: "council-bounce 0.8s steps(1, end) infinite",
  },
  errorLine: {
    fontSize: 14,
    lineHeight: 1.35,
    color: "#9a2f2f",
    background: "rgba(255,240,240,0.55)",
    padding: "8px 10px",
    border: "3px solid rgba(154,47,47,0.2)",
  },
  inputDock: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    padding: "0 14px 12px",
  },
  sideModeButton: {
    width: 86,
    minHeight: 58,
    border: "4px solid #000",
    background: "#f0debd",
    color: "#000",
    fontSize: 16,
    fontFamily: "inherit",
    fontWeight: 700,
    boxShadow: "6px 6px 0 rgba(0,0,0,0.18)",
    cursor: "pointer",
  },
  sideModeButtonActive: {
    background: "#fff2d8",
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  input: {
    width: "100%",
    minHeight: 64,
    boxSizing: "border-box",
    resize: "none",
    border: "4px solid rgba(0,0,0,0.14)",
    background: "rgba(255,248,238,0.48)",
    color: "#3f3422",
    fontSize: 16,
    lineHeight: 1.4,
    padding: "10px 12px",
    fontFamily: "inherit",
    outline: "none",
  },
  inputHandsFree: {
    background: "rgba(255,248,238,0.3)",
  },
  interimOverlay: {
    position: "absolute",
    inset: 0,
    padding: "10px 12px",
    color: "rgba(90,80,62,0.5)",
    fontSize: 16,
    lineHeight: 1.4,
    fontFamily: "inherit",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },
  sideButtonColumn: {
    width: 210,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 16,
  },
  bigPixelButton: {
    minHeight: 104,
    border: "6px solid #000",
    background: "#ecd5b4",
    color: "#000",
    fontSize: 24,
    lineHeight: 1.05,
    fontFamily: "inherit",
    fontWeight: 700,
    textAlign: "center",
    padding: "16px 10px",
    boxShadow: "12px 12px 0 rgba(0,0,0,0.2)",
    cursor: "pointer",
    whiteSpace: "pre-wrap",
  },
  bigPixelButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "8px 8px 0 rgba(0,0,0,0.12)",
  },
  bigPixelButtonActive: {
    background: "#fff0cf",
  },
};

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function appendTranscript(base, extra) {
  const normalizedBase = base.trim();
  const normalizedExtra = extra.replace(/\s+/g, " ").trim();

  if (!normalizedExtra) return normalizedBase;
  if (!normalizedBase) return normalizedExtra;
  return `${normalizedBase} ${normalizedExtra}`;
}

const COUNCIL_SPECIES = {
  olive: "owl",
  frank: "fish",
  otis: "otter",
  suzy: "sheep",
  hazel: "hedgehog",
  daisy: "deer",
  rowan: "hare",
};

const COUNCIL_STAGE_LAYOUT = {
  olive: { left: "28%", top: "37%", scale: 1.02, dir: "down", layer: 6 },
  otis: { left: "48%", top: "34%", scale: 1.08, dir: "down", layer: 7 },
  daisy: { left: "67%", top: "37%", scale: 1.04, dir: "down", layer: 6 },
  hazel: { left: "20%", top: "61%", scale: 1.1, dir: "right", layer: 5 },
  frank: { left: "84%", top: "55%", scale: 1.18, dir: "left", layer: 5 },
  rowan: { left: "43%", top: "78%", scale: 1.12, dir: "down", layer: 8 },
  suzy: { left: "69%", top: "77%", scale: 1.14, dir: "down", layer: 8 },
};

// Keyframe injection (dots animation — can't use CSS-in-JS @keyframes directly)
if (typeof document !== "undefined" && !document.getElementById("council-anim")) {
  const style = document.createElement("style");
  style.id = "council-anim";
  style.textContent = `
    @keyframes council-bounce {
      0%, 100% { opacity: 0.3; transform: translateY(0); }
      50%       { opacity: 1;   transform: translateY(-3px); }
    }
  `;
  document.head.appendChild(style);
}
