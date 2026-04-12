// AI-powered council meeting overlay.
// Voice input via Web Speech API, text fallback.
// Calls our backend council AI route to play all NPC characters adaptively.

import React, { useEffect, useEffectEvent, useRef, useState } from "react";
import { COUNCIL_NPCS, callCouncilAI, parseCouncilResponse } from "../engine/councilAI";
import { logCouncilMessage } from "../engine/logger";
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
  const [interimText, setInterimText]     = useState("");
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
  const restartListenTimeoutRef = useRef(0);

  const hasVoice = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const canPlayAudio = typeof window !== "undefined" && typeof Audio !== "undefined";
  const canHandsFree = hasVoice && canPlayAudio;

  const submitConversationTextFromEffect = useEffectEvent((nextText) => {
    submitConversationText(nextText);
  });
  const startOpeningTurn = useEffectEvent(() => {
    const opening = [{ role: "user", content: KICKSTART_MESSAGE }];
    sendToAI(opening, opening, 0);
  });

  useEffect(() => { apiHistoryRef.current = apiHistory; }, [apiHistory]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { handsFreeRef.current = handsFreeMode; }, [handsFreeMode]);

  useEffect(() => {
    if (!canHandsFree && handsFreeMode) setHandsFreeMode(false);
  }, [canHandsFree, handsFreeMode]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMsgs, isLoading]);

  function clearListeningRestart() {
    if (restartListenTimeoutRef.current) {
      window.clearTimeout(restartListenTimeoutRef.current);
      restartListenTimeoutRef.current = 0;
    }
  }

  function scheduleListeningRestart(delay = 280) {
    clearListeningRestart();
    restartListenTimeoutRef.current = window.setTimeout(() => {
      restartListenTimeoutRef.current = 0;
      startListening();
    }, delay);
  }

  function stopListening(useAbort = false) {
    clearListeningRestart();
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
    clearListeningRestart();
    if (!recognitionRef.current || isListeningRef.current || isLoadingRef.current || isSpeakingRef.current) return;
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
    const turnIndex   = userTurns + 1;

    logCouncilMessage({
      turnIndex,
      conversationRole: "user",
      npcName: "You",
      text,
      questStage: quest?.stage,
      playerProfile: quest?.playerProfile,
    });

    setDisplayMsgs((prev) => [...prev, { id: Date.now(), type: "player", text }]);
    setTextInput("");
    setInterimText("");
    setUserTurns((n) => n + 1);
    sendToAI(nextHistory, nextHistory, turnIndex);
  }

  async function playCouncilReply(reply) {
    if (!handsFreeRef.current) return;
    stopCouncilAudio();
    stopListening(true);
    if (!reply.audioBase64) {
      if (reply.audioError) setError(reply.audioError);
      if (!isLoadingRef.current) scheduleListeningRestart();
      return;
    }
    try {
      const audioBytes = Uint8Array.from(atob(reply.audioBase64), (char) => char.charCodeAt(0));
      const audioBlob  = new Blob([audioBytes], { type: reply.audioMime || "audio/mpeg" });
      const audioUrl   = URL.createObjectURL(audioBlob);
      const audio      = new Audio(audioUrl);

      audioRef.current    = audio;
      audioUrlRef.current = audioUrl;

      audio.onended = () => {
        stopCouncilAudio();
        if (handsFreeRef.current && !isLoadingRef.current) scheduleListeningRestart();
      };
      audio.onerror = () => {
        stopCouncilAudio();
        if (handsFreeRef.current && !isLoadingRef.current) scheduleListeningRestart();
      };

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      await audio.play();
    } catch (playbackError) {
      stopCouncilAudio();
      setError(`Voice playback failed: ${String(playbackError?.message || playbackError)}`);
      if (handsFreeRef.current && !isLoadingRef.current) scheduleListeningRestart();
    }
  }

  // ── Speech recognition ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasVoice) return;
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = "en-US";

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
    rec.onerror = () => { setIsListening(false); setInterimText(""); };
    rec.onend   = () => {
      setIsListening(false);
      setInterimText("");
      if (suppressEndRef.current) { suppressEndRef.current = false; return; }
      if (handsFreeRef.current && autoDraftRef.current.trim() && !isLoadingRef.current && !isSpeakingRef.current) {
        const spokenReply = autoDraftRef.current;
        autoDraftRef.current = "";
        submitConversationTextFromEffect(spokenReply);
      }
    };

    recognitionRef.current = rec;
    return () => rec.abort();
  }, [hasVoice]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { startOpeningTurn(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      clearListeningRestart();
      if (recognitionRef.current) recognitionRef.current.abort();
      stopCouncilAudio();
    };
  }, []);

  // ── Core AI call ─────────────────────────────────────────────────────────────
  async function sendToAI(historyForApi, nextHistory, turnIndex = "") {
    isLoadingRef.current = true;
    stopListening(true);
    setIsLoading(true);
    setError(null);
    let didReply = false;
    try {
      const reply  = await callCouncilAI(quest, historyForApi, { includeAudio: handsFreeRef.current });
      const parsed = parseCouncilResponse(reply.text);

      const assistantEntry = { role: "assistant", content: reply.text };
      setApiHistory([...nextHistory, assistantEntry]);

      logCouncilMessage({
        turnIndex,
        conversationRole: "assistant",
        npcId: parsed.npcId,
        npcName: parsed.name,
        text: parsed.text,
        questStage: quest?.stage,
        playerProfile: quest?.playerProfile,
      });

      setDisplayMsgs((prev) => [
        ...prev,
        { id: Date.now(), type: "npc", npcId: parsed.npcId, name: parsed.name, accent: parsed.accent, text: parsed.text },
      ]);

      didReply = true;
      await playCouncilReply(reply);
    } catch (e) {
      setError(e.message || "The council fell silent. Please try again.");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      if (!didReply && handsFreeRef.current && canHandsFree) {
        scheduleListeningRestart();
      } else if (didReply && handsFreeRef.current && canHandsFree && !isSpeakingRef.current && !isListeningRef.current) {
        scheduleListeningRestart();
      }
    }
  }

  function handleSubmit() { submitConversationText(textInput); }
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }
  function toggleMic() {
    if (!recognitionRef.current) return;
    if (isListeningRef.current) stopListening();
    else startListening();
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
        scheduleListeningRestart(180);
      }
      return next;
    });
  }
  function handleConclude() {
    clearListeningRestart();
    if (recognitionRef.current) recognitionRef.current.abort();
    handsFreeRef.current = false;
    stopCouncilAudio();
    onClose();
  }

  // ── Render ─────────────────────────────────────────────────────────────────────
  const canConclude      = userTurns > 0 && !isLoading;
  const inputValue       = isListening ? (textInput + interimText) : textInput;
  const latestNpcMessage = [...displayMsgs].reverse().find((msg) => msg.type === "npc") || null;
  const activeNpcId      = latestNpcMessage?.npcId || "olive";
  const activeNpc        = COUNCIL_NPCS.find((npc) => npc.id === activeNpcId) || COUNCIL_NPCS[0];

  return (
    <div style={styles.overlay}>

      {/* ── Title header ── */}
      <div style={styles.titleBar}>
        <div style={styles.titleBarEdge}>
          {canHandsFree && (
            <button
              type="button"
              style={{ ...styles.pixelBtn, ...(handsFreeMode ? styles.pixelBtnActive : null) }}
              onClick={toggleHandsFree}
            >
              {handsFreeMode ? "Voice On" : "Voice Off"}
            </button>
          )}
        </div>

        <div style={styles.titleCenter}>
          <span style={styles.titleDecor}>◆</span>
          <span style={styles.titleText}>Council Meeting</span>
          <span style={styles.titleDecor}>◆</span>
        </div>

        <div style={styles.titleBarEdge} style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            style={{
              ...styles.pixelBtn,
              ...styles.leaveBtn,
              ...(!canConclude ? styles.pixelBtnDisabled : null),
            }}
            onClick={handleConclude}
            disabled={!canConclude}
            title={canConclude ? "leave the council" : "share at least one reply first"}
          >
            Leave ▶
          </button>
        </div>
      </div>

      {/* ── Stage ── */}
      <div style={styles.stageWrap}>
        <CouncilScene activeNpcId={activeNpcId} />
      </div>

      {/* ── Speaker nameplate ── */}
      <div style={styles.nameplate}>
        {latestNpcMessage ? (
          <div style={styles.nameplateInner}>
            <div style={{ ...styles.nameplateDot, background: activeNpc.accent }} />
            <span style={{ ...styles.nameplateName, color: activeNpc.accent }}>
              {activeNpc.name}
            </span>
            <span style={styles.nameplateRole}>&nbsp;·&nbsp;{activeNpc.role}</span>
            {isSpeaking && (
              <span style={styles.nameplateStatus}>speaking</span>
            )}
            {isListening && !isSpeaking && (
              <span style={styles.nameplateStatus}>listening</span>
            )}
          </div>
        ) : (
          <div style={styles.nameplateIdle}>the council is gathering...</div>
        )}
      </div>

      {/* ── Meeting record (transcript + input) ── */}
      <div style={styles.recordPanel}>
        <div style={styles.recordHeader}>
          <span style={styles.recordHeaderLabel}>Meeting Record</span>
          <div style={styles.recordHeaderLine} />
        </div>

        <div style={styles.transcriptBody}>
          {displayMsgs.length === 0 && !isLoading && (
            <div style={styles.emptyState}>
              Olive will open the conversation.
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
                ...styles.pixelBtn,
                ...styles.micBtn,
                ...(isListening ? styles.micBtnActive : null),
              }}
              onClick={toggleMic}
              disabled={isLoading || isSpeaking}
              title={isListening ? "stop listening" : "start listening"}
            >
              {isListening ? "● LIVE" : "MIC"}
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
                    ? `${activeNpc.name.split(" ")[0]} is speaking...`
                    : isListening
                    ? "Listening... reply sends automatically"
                    : "Voice mode on — you can still type"
                  : isListening
                  ? "Listening..."
                  : "Speak your mind..."
              }
              rows={2}
              disabled={isListening || isLoading || isSpeaking}
            />
            {isListening && interimText && (
              <div style={styles.interimOverlay}>{interimText}</div>
            )}
          </div>
          {!(handsFreeMode && canHandsFree) && (
            <button
              type="button"
              style={{
                ...styles.pixelBtn,
                ...styles.sendBtn,
                ...(!textInput.trim() || isLoading || isSpeaking ? styles.pixelBtnDisabled : null),
              }}
              onClick={handleSubmit}
              disabled={!textInput.trim() || isLoading || isSpeaking}
            >
              Send ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TranscriptLine({ msg }) {
  return (
    <div
      style={{
        ...styles.transcriptLine,
        ...(msg.type === "player" ? styles.transcriptLinePlayer : styles.transcriptLineNpc),
      }}
    >
      <span
        style={{
          ...styles.transcriptLabel,
          color: msg.type === "npc" ? msg.accent : "#b8a878",
        }}
      >
        {msg.type === "npc" ? msg.name : "You"}
        {" — "}
      </span>
      <span style={styles.transcriptText}>{msg.text}</span>
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
      {/* Floor shadow beneath table */}
      <div style={styles.floorShadow} />

      {/* Table: wood sides */}
      <div style={styles.tableBody} />
      {/* Table: green felt surface */}
      <div style={styles.tableFelt} />
      {/* Table edge/lip */}
      <div style={styles.tableLip} />
      {/* Small item on table */}
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
      style={styles.avatarWrap}
    >
      <canvas
        ref={canvasRef}
        width={28}
        height={32}
        style={{
          ...styles.avatarCanvas,
          opacity: active ? 1 : 0.6,
          filter: active
            ? `drop-shadow(0 2px 0 ${hexToRgba(accent, 0.5)})`
            : "none",
        }}
      />
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  // ── Shell ──────────────────────────────────────────────────────────────────
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 110,
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, #1e3428 0%, #243c2c 50%, #1a2e22 100%)",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    pointerEvents: "auto",
    overflow: "hidden",
  },

  // ── Title bar ──────────────────────────────────────────────────────────────
  titleBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px 8px",
    borderBottom: "3px solid #1a2e20",
    boxShadow: "0 3px 0 #0e1e14",
    background: "#1a2e22",
    flexShrink: 0,
    gap: 10,
  },
  titleBarEdge: {
    width: 120,
    display: "flex",
    alignItems: "center",
  },
  titleCenter: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 3,
    color: "#c8a840",
    textShadow:
      "3px 0 0 #1a2e20, -3px 0 0 #1a2e20, 0 3px 0 #1a2e20, 0 -3px 0 #1a2e20, 2px 2px 0 #0a1a0e",
    lineHeight: 1,
  },
  titleDecor: {
    fontSize: 14,
    color: "rgba(200,168,64,0.5)",
    lineHeight: 1,
  },

  // ── Pixel buttons (shared base) ───────────────────────────────────────────
  pixelBtn: {
    border: "3px solid #4a7848",
    borderRadius: 0,
    background: "#243c28",
    color: "#90c880",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: "7px 12px",
    boxShadow: "3px 3px 0 #122018",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  pixelBtnActive: {
    background: "#2e5030",
    color: "#b0e89a",
    borderColor: "#6aaa58",
    boxShadow: "3px 3px 0 #0e1810",
  },
  pixelBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
    boxShadow: "2px 2px 0 #122018",
  },
  leaveBtn: {
    borderColor: "#7a7040",
    color: "#c8a840",
    background: "#2e2a18",
    boxShadow: "3px 3px 0 #1a1608",
  },

  // ── Stage ─────────────────────────────────────────────────────────────────
  stageWrap: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #1e3428 0%, #1a2e22 70%, #162a1e 100%)",
  },
  stageArea: {
    position: "relative",
    width: "min(1080px, 100%)",
    height: "100%",
    minHeight: 200,
    pointerEvents: "none",
  },
  floorShadow: {
    position: "absolute",
    left: "50%",
    bottom: "12%",
    width: 520,
    height: 32,
    transform: "translateX(-50%)",
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
  },
  // Table wood body (slightly larger, behind felt)
  tableBody: {
    position: "absolute",
    left: "50%",
    top: "52%",
    width: 548,
    height: 120,
    transform: "translate(-50%, -50%)",
    borderRadius: 999,
    background: "linear-gradient(180deg, #6b3f1e 0%, #4a2c12 100%)",
    boxShadow: "0 9px 0 #2e1a08, 0 0 0 3px #3a2010",
  },
  // Table felt surface (green, slightly inset from wood)
  tableFelt: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 510,
    height: 90,
    transform: "translate(-50%, -50%)",
    borderRadius: 999,
    background: "linear-gradient(180deg, #1e5028 0%, #183e20 100%)",
    boxShadow: "inset 0 3px 8px rgba(0,0,0,0.4)",
    border: "2px solid #143018",
  },
  tableLip: {
    position: "absolute",
    left: "50%",
    top: "58%",
    width: 590,
    height: 24,
    transform: "translate(-50%, -50%)",
    borderRadius: 999,
    background: "#3a2010",
  },
  tableCup: {
    position: "absolute",
    left: "50%",
    top: "47%",
    width: 12,
    height: 16,
    transform: "translate(-50%, -50%)",
    borderRadius: 2,
    background: "linear-gradient(180deg, #c8a840 0%, #a08028 100%)",
    boxShadow: "2px 2px 0 #3a2010",
  },
  avatarSlot: {
    position: "absolute",
    transformOrigin: "center center",
  },
  avatarWrap: {
    width: 96,
    height: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    transition: "box-shadow 0.15s, background 0.15s",
  },
  avatarCanvas: {
    width: 96,
    height: 110,
    imageRendering: "pixelated",
    transition: "opacity 0.15s, filter 0.15s",
  },

  // ── Speaker nameplate ─────────────────────────────────────────────────────
  nameplate: {
    padding: "5px 16px",
    background: "#1a2e22",
    borderTop: "3px solid #1a2e20",
    borderBottom: "3px solid #0e1e14",
    flexShrink: 0,
    minHeight: 30,
    display: "flex",
    alignItems: "center",
  },
  nameplateInner: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  nameplateDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    flexShrink: 0,
    boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
  },
  nameplateName: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  nameplateRole: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "rgba(180,200,160,0.45)",
  },
  nameplateStatus: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "rgba(180,200,160,0.5)",
    marginLeft: 6,
    animation: "council-pulse 1.1s ease-in-out infinite",
  },
  nameplateIdle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "rgba(160,190,140,0.3)",
  },

  // ── Meeting record panel ──────────────────────────────────────────────────
  recordPanel: {
    flexShrink: 0,
    height: 210,
    display: "flex",
    flexDirection: "column",
    background: "#f0e8d0",
    border: "3px solid #7a6040",
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "none",
    borderTop: "4px solid #7a6040",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  recordHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 14px 5px",
    background: "#e4d8bc",
    borderBottom: "2px solid #c8b888",
    flexShrink: 0,
  },
  recordHeaderLabel: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#7a5a28",
    flexShrink: 0,
  },
  recordHeaderLine: {
    flex: 1,
    height: 1,
    background: "#c8b888",
  },
  transcriptBody: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 16px 6px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    scrollbarWidth: "thin",
    scrollbarColor: "#c8b888 transparent",
  },
  emptyState: {
    fontSize: 13,
    color: "#9a8868",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  transcriptLine: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#3a2e18",
  },
  transcriptLineNpc: {},
  transcriptLinePlayer: {
    paddingLeft: 24,
    borderLeft: "3px solid #c8b888",
  },
  transcriptLabel: {
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  transcriptText: {
    color: "#3a2e18",
  },
  loadingLine: {
    fontSize: 22,
    lineHeight: 1,
    color: "#9a8050",
    paddingLeft: 2,
  },
  dot: {
    display: "inline-block",
    animation: "council-bounce 0.8s steps(1, end) infinite",
  },
  errorLine: {
    fontSize: 13,
    lineHeight: 1.4,
    color: "#9a3030",
    background: "rgba(180,60,60,0.08)",
    padding: "6px 10px",
    borderLeft: "3px solid rgba(180,60,60,0.3)",
  },

  // ── Input dock ────────────────────────────────────────────────────────────
  inputDock: {
    display: "flex",
    alignItems: "stretch",
    borderTop: "2px solid #c8b888",
    flexShrink: 0,
  },
  micBtn: {
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "2px solid #c8b888",
    borderRadius: 0,
    background: "#e4d8bc",
    color: "#7a5a28",
    boxShadow: "none",
    padding: "0 14px",
    fontSize: 10,
  },
  micBtnActive: {
    background: "#d4e8c8",
    color: "#3a6030",
    borderColor: "#90b878",
    animation: "council-pulse 0.9s ease-in-out infinite",
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  input: {
    width: "100%",
    minHeight: 52,
    boxSizing: "border-box",
    resize: "none",
    border: "none",
    background: "#faf4e4",
    color: "#3a2e18",
    fontSize: 14,
    lineHeight: 1.5,
    padding: "10px 14px",
    fontFamily: "inherit",
    outline: "none",
  },
  inputHandsFree: {
    color: "#a09070",
    background: "#f4eedc",
  },
  interimOverlay: {
    position: "absolute",
    inset: 0,
    padding: "10px 14px",
    color: "rgba(90,70,40,0.4)",
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: "inherit",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },
  sendBtn: {
    borderTop: "none",
    borderBottom: "none",
    borderRight: "none",
    borderLeft: "2px solid #c8b888",
    borderRadius: 0,
    background: "#e4d8bc",
    color: "#5a7840",
    boxShadow: "none",
    padding: "0 18px",
    fontSize: 11,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const normalizedBase  = base.trim();
  const normalizedExtra = extra.replace(/\s+/g, " ").trim();
  if (!normalizedExtra) return normalizedBase;
  if (!normalizedBase)  return normalizedExtra;
  return `${normalizedBase} ${normalizedExtra}`;
}

// ── Static data ────────────────────────────────────────────────────────────────

const COUNCIL_SPECIES = {
  olive: "owl",
  frank: "fish",
  otis:  "otter",
  suzy:  "sheep",
  hazel: "hedgehog",
  daisy: "deer",
  rowan: "hare",
};

const COUNCIL_STAGE_LAYOUT = {
  olive: { left: "28%", top: "37%", scale: 1.02, dir: "down",  layer: 6 },
  otis:  { left: "48%", top: "34%", scale: 1.08, dir: "down",  layer: 7 },
  daisy: { left: "67%", top: "37%", scale: 1.04, dir: "down",  layer: 6 },
  hazel: { left: "20%", top: "61%", scale: 1.1,  dir: "right", layer: 5 },
  frank: { left: "84%", top: "55%", scale: 1.18, dir: "left",  layer: 5 },
  rowan: { left: "43%", top: "78%", scale: 1.12, dir: "down",  layer: 8 },
  suzy:  { left: "69%", top: "77%", scale: 1.14, dir: "down",  layer: 8 },
};

// ── Keyframe injection ─────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("council-anim")) {
  const style = document.createElement("style");
  style.id = "council-anim";
  style.textContent = `
    @keyframes council-bounce {
      0%, 100% { opacity: 0.3; transform: translateY(0); }
      50%       { opacity: 1;   transform: translateY(-3px); }
    }
    @keyframes council-pulse {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
