// AI-powered council meeting overlay.
// Voice input via Web Speech API, text fallback.
// Calls our backend council AI route to play all NPC characters adaptively.

import React, { useEffect, useEffectEvent, useRef, useState } from "react";
import { COUNCIL_NPCS, callCouncilAI, parseCouncilResponse } from "../engine/councilAI";
import { logCouncilMessage } from "../engine/logger";
import { drawCritter } from "../renderer/characters";

// ── Constants ─────────────────────────────────────────────────────────────────

const KICKSTART_MESSAGE =
  "the council is now gathered and the player has arrived. open the meeting as Olive in a warm, natural, slightly casual way, like she's genuinely glad they're here. ask one reflective question based on a specific choice they made during their journey.";
const COUNCIL_AUDIO_PLAYBACK_RATE = 1.1;

const PIXEL_OVAL_CLIP =
  "polygon(10% 0, 90% 0, 95% 4%, 98% 10%, 100% 22%, 100% 78%, 98% 90%, 95% 96%, 90% 100%, 10% 100%, 5% 96%, 2% 90%, 0 78%, 0 22%, 2% 10%, 5% 4%)";

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
      audio.playbackRate = COUNCIL_AUDIO_PLAYBACK_RATE;

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
    const canSubmit = textInput.trim() && !isLoading && !isSpeaking;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === "Tab" && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
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

        <div style={{ ...styles.titleBarEdge, justifyContent: "flex-end" }}>
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
      <div style={styles.stageGlow} />
      <div style={styles.stageBackWall} />
      <div style={styles.stageCornice} />
      <div style={styles.stageSidePostLeft} />
      <div style={styles.stageSidePostRight} />
      <div style={styles.stageWallPanels} />
      <div style={styles.stageBanner} />
      <div style={styles.stageBannerSeal} />
      <div style={styles.stageLampLeftGlow} />
      <div style={styles.stageLampRightGlow} />
      <div style={styles.stageLampLeft} />
      <div style={styles.stageLampRight} />
      <div style={styles.stageWainscot} />
      <div style={styles.stageWainscotTrim} />
      <div style={styles.stageFloor} />
      <div style={styles.stageFloorGlow} />
      <div style={styles.stageFloorPlankA} />
      <div style={styles.stageFloorPlankB} />
      <div style={styles.stageFloorPlankC} />
      <div style={styles.tableRugShadow} />
      <div style={styles.tableRug} />
      <div style={styles.tableRugInner} />
      <div style={styles.tableRugCenterRing} />
      <div style={styles.tableRugCenter} />
      <div style={styles.tableRugCenterCore} />

      {/* Floor shadow beneath table */}
      <div style={styles.floorShadow} />

      {/* Table layers, matched to the outdoor terrace sprite */}
      <div style={styles.tableDepth} />
      <div style={styles.tableOuter} />
      <div style={styles.tableMid} />
      <div style={styles.tableTop} />
      <div style={styles.tableFrontApron} />
      <div style={styles.tableFrontInset} />
      <div style={styles.tableHighlight} />
      <div style={styles.tableGrainTop} />
      <div style={styles.tableGrainMid} />
      <div style={styles.tableGrainBottom} />
      <div style={styles.tableRightShade} />

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
              name={npc.name}
              species={COUNCIL_SPECIES[npc.id]}
              direction={layout.dir}
              active={npc.id === activeNpcId}
            />
          </div>
        );
      })}
    </div>
  );
}

function PixelCritterAvatar({ name, species, direction, active }) {
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
      }}
    >
      <div
        style={{
          ...styles.avatarLabel,
          ...(active ? styles.avatarLabelActive : null),
        }}
      >
        {name.split(" ")[0]}
      </div>
      <div style={styles.avatarShadow} />
      <canvas
        ref={canvasRef}
        width={28}
        height={32}
        style={{
          ...styles.avatarCanvas,
          ...(active ? styles.avatarCanvasActive : null),
          opacity: 1,
          filter: "none",
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
    background: "linear-gradient(180deg, #14221a 0%, #223528 34%, #1a251d 100%)",
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
    borderBottom: "3px solid #3a2618",
    boxShadow: "0 3px 0 #140d08",
    background: "linear-gradient(180deg, #6f4a2b 0%, #52341f 100%)",
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
    color: "#f0d48a",
    textShadow:
      "3px 0 0 #362112, -3px 0 0 #362112, 0 3px 0 #362112, 0 -3px 0 #362112, 2px 2px 0 #160c07",
    lineHeight: 1,
  },
  titleDecor: {
    fontSize: 14,
    color: "rgba(255,224,148,0.65)",
    lineHeight: 1,
  },

  // ── Pixel buttons (shared base) ───────────────────────────────────────────
  pixelBtn: {
    border: "3px solid #6c4f2d",
    borderRadius: 0,
    background: "#2d3f2c",
    color: "#cde2a6",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: "7px 12px",
    boxShadow: "3px 3px 0 #182116",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  pixelBtnActive: {
    background: "#3e5938",
    color: "#e3f2b8",
    borderColor: "#88a562",
    boxShadow: "3px 3px 0 #152014",
  },
  pixelBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
    boxShadow: "2px 2px 0 #182116",
  },
  leaveBtn: {
    borderColor: "#8a6a34",
    color: "#f0d48a",
    background: "#3b2a17",
    boxShadow: "3px 3px 0 #1a1208",
  },

  // ── Stage ─────────────────────────────────────────────────────────────────
  stageWrap: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #29402f 0%, #30442c 46%, #3f2d1d 46%, #2e2116 100%)",
  },
  stageArea: {
    position: "relative",
    width: "min(1080px, 100%)",
    height: "100%",
    minHeight: 200,
    pointerEvents: "none",
  },
  stageGlow: {
    position: "absolute",
    left: "50%",
    top: "16%",
    width: 520,
    height: 140,
    transform: "translateX(-50%)",
    background: "rgba(250,214,130,0.11)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 0,
  },
  stageBackWall: {
    position: "absolute",
    inset: "0 0 44% 0",
    background: "linear-gradient(180deg, #3f5a42 0%, #304734 100%)",
    zIndex: 0,
  },
  stageCornice: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 14,
    background: "#6e4b2e",
    boxShadow: "inset 0 4px 0 #916742, inset 0 -4px 0 #3f2817",
    zIndex: 3,
  },
  stageSidePostLeft: {
    position: "absolute",
    left: "6%",
    top: 0,
    bottom: "40%",
    width: 20,
    background: "linear-gradient(180deg, #6f4f31 0%, #573a22 100%)",
    boxShadow: "inset 4px 0 0 #8f6a46, inset -4px 0 0 #422915",
    zIndex: 2,
  },
  stageSidePostRight: {
    position: "absolute",
    right: "6%",
    top: 0,
    bottom: "40%",
    width: 20,
    background: "linear-gradient(180deg, #6f4f31 0%, #573a22 100%)",
    boxShadow: "inset 4px 0 0 #8f6a46, inset -4px 0 0 #422915",
    zIndex: 2,
  },
  stageWallPanels: {
    position: "absolute",
    left: "9%",
    right: "9%",
    top: "11%",
    height: "25%",
    background:
      "repeating-linear-gradient(90deg, #5f452d 0 10px, #715338 10px 54px, #5f452d 54px 64px)",
    boxShadow: "0 0 0 4px #4a331f, inset 0 4px 0 #836142, inset 0 -4px 0 #3b2717",
    opacity: 0.48,
    zIndex: 1,
  },
  stageBanner: {
    position: "absolute",
    left: "50%",
    top: "13%",
    width: 170,
    height: 42,
    transform: "translateX(-50%)",
    background: "#a66b36",
    boxShadow: "0 0 0 4px #5b381d, inset 0 4px 0 #d39b5c, inset 0 -4px 0 #7a4e28",
    zIndex: 2,
  },
  stageBannerSeal: {
    position: "absolute",
    left: "50%",
    top: "calc(13% + 9px)",
    width: 26,
    height: 26,
    transform: "translateX(-50%)",
    background: "#f2d278",
    boxShadow: "0 0 0 3px #6e4b24, inset 0 3px 0 #fff0b8",
    zIndex: 3,
  },
  stageLampLeftGlow: {
    position: "absolute",
    left: "18%",
    top: "18%",
    width: 86,
    height: 86,
    background: "rgba(255,218,126,0.17)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 1,
  },
  stageLampRightGlow: {
    position: "absolute",
    right: "18%",
    top: "18%",
    width: 86,
    height: 86,
    background: "rgba(255,218,126,0.17)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 1,
  },
  stageLampLeft: {
    position: "absolute",
    left: "calc(18% + 24px)",
    top: "calc(18% + 18px)",
    width: 38,
    height: 30,
    background: "#f2c35c",
    boxShadow: "0 0 0 3px #6a4520, inset 0 3px 0 #fff0ae, inset 0 -3px 0 #ba8834",
    zIndex: 2,
  },
  stageLampRight: {
    position: "absolute",
    right: "calc(18% + 24px)",
    top: "calc(18% + 18px)",
    width: 38,
    height: 30,
    background: "#f2c35c",
    boxShadow: "0 0 0 3px #6a4520, inset 0 3px 0 #fff0ae, inset 0 -3px 0 #ba8834",
    zIndex: 2,
  },
  stageWainscot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "56%",
    height: "10%",
    background: "linear-gradient(180deg, #7b5430 0%, #644425 100%)",
    boxShadow: "inset 0 4px 0 #9b7148, inset 0 -4px 0 #402714",
    zIndex: 1,
  },
  stageWainscotTrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "55.2%",
    height: 8,
    background: "#b48a5c",
    boxShadow: "0 3px 0 #52331a, inset 0 2px 0 #d8ae7d",
    zIndex: 3,
  },
  stageFloor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "44%",
    background: "linear-gradient(180deg, #765433 0%, #553920 100%)",
    zIndex: 0,
  },
  stageFloorGlow: {
    position: "absolute",
    left: "50%",
    top: "74%",
    width: 620,
    height: 92,
    transform: "translate(-50%, -50%)",
    background: "rgba(244,210,150,0.045)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 1,
  },
  stageFloorPlankA: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "69%",
    height: 4,
    background: "rgba(245,214,162,0.18)",
    zIndex: 1,
  },
  stageFloorPlankB: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "78%",
    height: 4,
    background: "rgba(48,25,11,0.25)",
    zIndex: 1,
  },
  stageFloorPlankC: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "87%",
    height: 4,
    background: "rgba(245,214,162,0.12)",
    zIndex: 1,
  },
  tableRugShadow: {
    position: "absolute",
    left: "50%",
    top: "79.5%",
    width: 690,
    height: 132,
    transform: "translate(-50%, -50%)",
    background: "rgba(0,0,0,0.08)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 1,
  },
  tableRug: {
    position: "absolute",
    left: "50%",
    top: "78%",
    width: 670,
    height: 138,
    transform: "translate(-50%, -50%)",
    background: "linear-gradient(180deg, #7c3932 0%, #60302c 100%)",
    clipPath: PIXEL_OVAL_CLIP,
    boxShadow: "0 0 0 4px #3b201b, inset 0 0 0 4px #bc8f58, inset 0 0 0 10px #6a2f2b",
    zIndex: 2,
  },
  tableRugInner: {
    position: "absolute",
    left: "50%",
    top: "78%",
    width: 548,
    height: 96,
    transform: "translate(-50%, -50%)",
    background: "#8a4038",
    clipPath: PIXEL_OVAL_CLIP,
    boxShadow: "0 0 0 4px #c79a64, inset 0 0 0 4px #5b2725",
    zIndex: 3,
  },
  tableRugCenterRing: {
    position: "absolute",
    left: "50%",
    top: "78%",
    width: 228,
    height: 56,
    transform: "translate(-50%, -50%)",
    background: "#c79a64",
    clipPath: PIXEL_OVAL_CLIP,
    boxShadow: "0 0 0 4px #5b2725",
    zIndex: 3,
  },
  tableRugCenter: {
    position: "absolute",
    left: "50%",
    top: "78%",
    width: 168,
    height: 34,
    transform: "translate(-50%, -50%)",
    background: "#7c3932",
    clipPath: PIXEL_OVAL_CLIP,
    boxShadow: "0 0 0 4px #5b2725",
    zIndex: 4,
  },
  tableRugCenterCore: {
    position: "absolute",
    left: "50%",
    top: "78%",
    width: 58,
    height: 14,
    transform: "translate(-50%, -50%)",
    background: "#d8b070",
    clipPath: PIXEL_OVAL_CLIP,
    boxShadow: "0 0 0 3px #5b2725",
    zIndex: 5,
  },
  floorShadow: {
    position: "absolute",
    left: "50%",
    top: "calc(73% + 64px)",
    width: 500,
    height: 18,
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.18)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 4,
  },
  tableDepth: {
    position: "absolute",
    left: "50%",
    top: "73%",
    width: 540,
    height: 124,
    transform: "translate(-50%, -50%)",
    background: "#5c3820",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 5,
  },
  tableOuter: {
    position: "absolute",
    left: "50%",
    top: "73%",
    width: 540,
    height: 112,
    transform: "translate(-50%, -50%)",
    background: "#9a6438",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 5,
  },
  tableMid: {
    position: "absolute",
    left: "50%",
    top: "73%",
    width: 510,
    height: 98,
    transform: "translate(-50%, -50%)",
    background: "#b07844",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 5,
  },
  tableTop: {
    position: "absolute",
    left: "50%",
    top: "73%",
    width: 472,
    height: 82,
    transform: "translate(-50%, -50%)",
    background: "#c08850",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 5,
  },
  tableFrontApron: {
    position: "absolute",
    left: "50%",
    top: "calc(73% + 26px)",
    width: 500,
    height: 28,
    transform: "translateX(-50%)",
    background: "#8d562d",
    clipPath: PIXEL_OVAL_CLIP,
    boxShadow: "0 4px 0 #4a2b16",
    zIndex: 5,
  },
  tableFrontInset: {
    position: "absolute",
    left: "50%",
    top: "calc(73% + 29px)",
    width: 430,
    height: 8,
    transform: "translateX(-50%)",
    background: "#6e421f",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 6,
  },
  tableHighlight: {
    position: "absolute",
    left: "50%",
    top: "calc(73% - 22px)",
    width: 430,
    height: 10,
    transform: "translateX(-50%)",
    background: "rgba(255,255,255,0.13)",
    clipPath: PIXEL_OVAL_CLIP,
    zIndex: 6,
  },
  tableGrainTop: {
    position: "absolute",
    left: "50%",
    top: "calc(73% - 8px)",
    width: 426,
    height: 2,
    transform: "translateX(-50%)",
    background: "#8a5830",
    zIndex: 6,
  },
  tableGrainMid: {
    position: "absolute",
    left: "50%",
    top: "calc(73% + 12px)",
    width: 426,
    height: 2,
    transform: "translateX(-50%)",
    background: "#8a5830",
    zIndex: 6,
  },
  tableGrainBottom: {
    position: "absolute",
    left: "50%",
    top: "calc(73% + 32px)",
    width: 426,
    height: 2,
    transform: "translateX(-50%)",
    background: "#8a5830",
    zIndex: 6,
  },
  tableRightShade: {
    position: "absolute",
    left: "calc(50% + 186px)",
    top: "73%",
    width: 22,
    height: 82,
    transform: "translateY(-50%)",
    background: "#7a4828",
    clipPath: "polygon(28% 0, 100% 0, 100% 100%, 28% 100%, 0 86%, 0 14%)",
    zIndex: 6,
  },
  avatarSlot: {
    position: "absolute",
    transformOrigin: "center center",
  },
  avatarWrap: {
    position: "relative",
    width: 96,
    height: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    overflow: "visible",
  },
  avatarLabel: {
    position: "absolute",
    left: "50%",
    top: 1,
    transform: "translateX(-50%)",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1,
    color: "#d8e8b7",
    textShadow: "0 1px 2px rgba(20, 28, 23, 0.95), 0 0 5px rgba(20, 28, 23, 0.5)",
    whiteSpace: "nowrap",
    zIndex: 3,
    pointerEvents: "none",
  },
  avatarLabelActive: {
    color: "#f4f0ce",
  },
  avatarShadow: {
    position: "absolute",
    left: "50%",
    bottom: 10,
    width: 30,
    height: 6,
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.14)",
    clipPath: PIXEL_OVAL_CLIP,
  },
  avatarCanvas: {
    position: "relative",
    zIndex: 1,
    width: 96,
    height: 110,
    imageRendering: "pixelated",
  },
  avatarCanvasActive: {
    animation: "council-speaker-bob 0.7s steps(1, end) infinite",
  },

  // ── Speaker nameplate ─────────────────────────────────────────────────────
  nameplate: {
    padding: "6px 16px",
    background: "linear-gradient(180deg, #4a3220 0%, #362417 100%)",
    borderTop: "3px solid #6a4a2e",
    borderBottom: "3px solid #160f0a",
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
    color: "rgba(230,214,180,0.55)",
  },
  nameplateStatus: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "rgba(240,220,176,0.7)",
    marginLeft: 6,
    animation: "council-pulse 1.1s ease-in-out infinite",
  },
  nameplateIdle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "rgba(230,214,180,0.35)",
  },

  // ── Meeting record panel ──────────────────────────────────────────────────
  recordPanel: {
    flexShrink: 0,
    height: 210,
    display: "flex",
    flexDirection: "column",
    background: "#efe0bb",
    border: "3px solid #6a4727",
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "none",
    borderTop: "4px solid #8d643d",
    boxShadow: "inset 0 3px 0 #fff3cf, inset 0 -3px 0 rgba(92,58,28,0.14)",
    overflow: "hidden",
  },
  recordHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 14px 5px",
    background: "#dcc79d",
    borderBottom: "2px solid #b18f5d",
    flexShrink: 0,
  },
  recordHeaderLabel: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#6b461f",
    flexShrink: 0,
  },
  recordHeaderLine: {
    flex: 1,
    height: 1,
    background: "#b7925e",
  },
  transcriptBody: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 16px 6px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    scrollbarWidth: "thin",
    scrollbarColor: "#b7925e transparent",
  },
  emptyState: {
    fontSize: 13,
    color: "#8b7350",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  transcriptLine: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#3e2c16",
  },
  transcriptLineNpc: {},
  transcriptLinePlayer: {
    paddingLeft: 24,
    borderLeft: "3px solid #c4a16e",
  },
  transcriptLabel: {
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  transcriptText: {
    color: "#3e2c16",
  },
  loadingLine: {
    fontSize: 22,
    lineHeight: 1,
    color: "#9a7440",
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
    borderTop: "2px solid #b18f5d",
    flexShrink: 0,
  },
  micBtn: {
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "2px solid #b18f5d",
    borderRadius: 0,
    background: "#dcc79d",
    color: "#6b461f",
    boxShadow: "none",
    padding: "0 14px",
    fontSize: 10,
  },
  micBtnActive: {
    background: "#d7e3c1",
    color: "#37522d",
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
    background: "#f7eed8",
    color: "#3e2c16",
    fontSize: 14,
    lineHeight: 1.5,
    padding: "10px 14px",
    fontFamily: "inherit",
    outline: "none",
  },
  inputHandsFree: {
    color: "#9a8764",
    background: "#f1e6cf",
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
    borderLeft: "2px solid #b18f5d",
    borderRadius: 0,
    background: "#dcc79d",
    color: "#47643a",
    boxShadow: "none",
    padding: "0 18px",
    fontSize: 11,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  olive: { left: "31%", top: "45%", scale: 1.02, dir: "down",  layer: 4 },
  otis:  { left: "50%", top: "43%", scale: 1.08, dir: "down",  layer: 4 },
  daisy: { left: "69%", top: "45%", scale: 1.04, dir: "down",  layer: 4 },
  hazel: { left: "22%", top: "77%", scale: 1.1,  dir: "right", layer: 7 },
  frank: { left: "79%", top: "77%", scale: 1.18, dir: "left",  layer: 7 },
  rowan: { left: "39%", top: "92%", scale: 1.12, dir: "up",    layer: 8 },
  suzy:  { left: "62%", top: "92%", scale: 1.14, dir: "up",    layer: 8 },
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
    @keyframes council-speaker-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes council-pulse {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
