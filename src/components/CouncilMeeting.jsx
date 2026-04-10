// AI-powered council meeting overlay.
// Voice input via Web Speech API, text fallback.
// Calls our backend council AI route to play all NPC characters adaptively.

import React, { useEffect, useRef, useState } from "react";
import { COUNCIL_NPCS, callCouncilAI, parseCouncilResponse } from "../engine/councilAI";

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
  const sceneSpeech =
    isLoading && !latestNpcMessage
      ? "the council is gathering around the table..."
      : isLoading
      ? `${activeNpc.name.split(" ")[0].toLowerCase()} is thinking...`
      : summarizeSceneSpeech(latestNpcMessage?.text);

  return (
    <div style={styles.overlay}>
      <CouncilScene activeNpc={activeNpc} activeNpcId={activeNpcId} speech={sceneSpeech} />

      <div style={styles.bottomDock}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerDot} />
            <span style={styles.headerTitle}>council meeting</span>
            <span style={styles.headerSub}>
              {handsFreeMode && canHandsFree ? "ai-generated voice conversation" : "reflect together"}
            </span>
          </div>
          <div style={styles.headerActions}>
            {canHandsFree && (
              <button
                style={{
                  ...styles.modeBtn,
                  ...(handsFreeMode ? styles.modeBtnActive : {}),
                }}
                onClick={toggleHandsFree}
              >
                {handsFreeMode ? "voice on" : "voice off"}
              </button>
            )}
            {canConclude && (
              <button style={styles.concludeBtn} onClick={handleConclude}>
                conclude &amp; finish ▶
              </button>
            )}
          </div>
        </div>

        <div style={styles.messageList}>
          {displayMsgs.map((msg) =>
            msg.type === "npc" ? (
              <NpcBubble key={msg.id} msg={msg} />
            ) : (
              <PlayerBubble key={msg.id} msg={msg} />
            )
          )}

          {isLoading && <LoadingDots />}
          {error && <ErrorLine text={error} />}

          <div ref={listEndRef} />
        </div>

        <div style={styles.inputRow}>
          {hasVoice && (
            <button
              style={{
                ...styles.micBtn,
                ...(isListening ? styles.micBtnActive : {}),
              }}
              onClick={toggleMic}
              disabled={isLoading}
              title={isListening ? "stop listening" : "speak"}
            >
              {isListening ? "◉" : handsFreeMode ? "live" : "mic"}
            </button>
          )}

          <div style={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              style={{
                ...styles.input,
                ...(handsFreeMode && canHandsFree ? styles.inputHandsFree : {}),
              }}
              value={inputValue}
              onChange={(e) => !isListening && setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                handsFreeMode && canHandsFree
                  ? isSpeaking
                    ? "the council is speaking..."
                    : isListening
                    ? "listening… your reply will send automatically"
                    : "hands-free mode is on — you can still type if you want"
                  : isListening
                  ? "listening…"
                  : hasVoice
                  ? "speak or type your response…"
                  : "type your response…"
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
              style={{
                ...styles.sendBtn,
                ...((!textInput.trim() || isLoading || isSpeaking) ? styles.sendBtnDisabled : {}),
              }}
              onClick={handleSubmit}
              disabled={!textInput.trim() || isLoading || isSpeaking}
            >
              ▶
            </button>
          )}
        </div>

        <div style={styles.hint}>
          {handsFreeMode && canHandsFree
            ? isSpeaking
              ? "the council's ai-generated voice is speaking — the mic will reopen when they finish"
              : isListening
              ? "listening — pause when you're done and your reply will send automatically"
              : "hands-free is on — listen to the ai voice, then speak naturally"
            : isListening
            ? "listening — click ◉ or pause to stop"
            : canConclude
            ? 'when you\'re done, click "conclude & finish" to view your report'
            : "share your thoughts with the council"}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NpcBubble({ msg }) {
  return (
    <div style={styles.npcRow}>
      <div style={{ ...styles.npcDot, background: msg.accent }} />
      <div style={styles.npcBubble}>
        <div style={{ ...styles.npcName, color: msg.accent }}>{msg.name}</div>
        <div style={styles.npcText}>{msg.text}</div>
      </div>
    </div>
  );
}

function PlayerBubble({ msg }) {
  return (
    <div style={styles.playerRow}>
      <div style={styles.playerBubble}>
        <div style={styles.playerLabel}>You</div>
        <div style={styles.playerText}>{msg.text}</div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={styles.npcRow}>
      <div style={{ ...styles.npcDot, background: "#7ab068" }} />
      <div style={{ ...styles.npcBubble, ...styles.loadingBubble }}>
        <span style={styles.dot}>·</span>
        <span style={{ ...styles.dot, animationDelay: "0.25s" }}>·</span>
        <span style={{ ...styles.dot, animationDelay: "0.5s" }}>·</span>
      </div>
    </div>
  );
}

function ErrorLine({ text }) {
  return (
    <div style={styles.errorLine}>
      ⚠ {text}
    </div>
  );
}

function CouncilScene({ activeNpc, activeNpcId, speech }) {
  return (
    <div style={styles.sceneStage}>
      <div style={styles.sceneSkyBand} />
      <div style={styles.sceneGrassHorizon} />
      <div style={styles.sceneGrassPattern} />

      <div style={styles.sceneHeader}>
        <div style={styles.sceneEyebrow}>delaware sustainability circle</div>
        <div style={styles.sceneTitle}>the council leans in</div>
      </div>

      <div style={styles.speechBubble}>
        <div style={{ ...styles.speechSpeaker, color: activeNpc.accent }}>
          {activeNpc.name}
        </div>
        <div style={styles.speechText}>{speech}</div>
      </div>

      {COUNCIL_NPCS.map((npc) => (
        <AnimalHead
          key={npc.id}
          npc={npc}
          active={npc.id === activeNpcId}
        />
      ))}

      <div style={styles.tableEdge} />
      <div style={styles.tableSurface} />
      <div style={styles.tableCenterGlow} />
      <div style={styles.playerPawLeft} />
      <div style={styles.playerPawRight} />
      <div style={styles.playerNotebook}>
        <div style={styles.playerNotebookLine} />
        <div style={styles.playerNotebookLine} />
        <div style={styles.playerNotebookLineShort} />
      </div>
    </div>
  );
}

function AnimalHead({ npc, active }) {
  const look = COUNCIL_LOOKS[npc.id];
  const layout = COUNCIL_LAYOUT[npc.id];

  return (
    <div
      style={{
        ...styles.headWrap,
        left: layout.left,
        top: layout.top,
        transform: `translate(-50%, -50%) scale(${layout.scale})`,
        zIndex: active ? 8 : 5,
      }}
    >
      <div
        style={{
          ...styles.headGlow,
          background: radialGradientFrom(look.accent),
          opacity: active ? 0.55 : 0.22,
        }}
      />

      {look.feature === "antlers" && (
        <>
          <div
            style={{ ...styles.antler, ...styles.antlerLeft, background: look.dark, color: look.dark }}
          />
          <div
            style={{ ...styles.antler, ...styles.antlerRight, background: look.dark, color: look.dark }}
          />
        </>
      )}

      {look.feature === "long_ears" && (
        <>
          <div style={{ ...styles.longEar, ...styles.longEarLeft, background: look.face, borderColor: look.dark }} />
          <div style={{ ...styles.longEar, ...styles.longEarRight, background: look.face, borderColor: look.dark }} />
          <div style={{ ...styles.longEarInner, ...styles.longEarInnerLeft, background: look.muzzle }} />
          <div style={{ ...styles.longEarInner, ...styles.longEarInnerRight, background: look.muzzle }} />
        </>
      )}

      {look.feature === "round_ears" && (
        <>
          <div style={{ ...styles.roundEar, ...styles.roundEarLeft, background: look.face, borderColor: look.dark }} />
          <div style={{ ...styles.roundEar, ...styles.roundEarRight, background: look.face, borderColor: look.dark }} />
        </>
      )}

      {look.feature === "tufts" && (
        <>
          <div style={{ ...styles.tuft, ...styles.tuftLeft, borderBottomColor: look.dark }} />
          <div style={{ ...styles.tuft, ...styles.tuftRight, borderBottomColor: look.dark }} />
        </>
      )}

      {look.feature === "fins" && (
        <>
          <div style={{ ...styles.fin, ...styles.finLeft, borderRightColor: look.dark }} />
          <div style={{ ...styles.fin, ...styles.finRight, borderLeftColor: look.dark }} />
        </>
      )}

      {look.feature === "spikes" && (
        <div
          style={{
            ...styles.spikes,
            background: `repeating-linear-gradient(90deg, ${look.dark} 0 8px, ${look.face} 8px 13px)`,
          }}
        />
      )}

      {look.feature === "fluff" && (
        <>
          <div style={{ ...styles.fluff, ...styles.fluffLeft, background: look.face }} />
          <div style={{ ...styles.fluff, ...styles.fluffRight, background: look.face }} />
          <div style={{ ...styles.fluff, ...styles.fluffTop, background: look.face }} />
        </>
      )}

      <div
        style={{
          ...styles.headFace,
          background: `linear-gradient(180deg, ${look.face} 0%, ${look.faceShade} 100%)`,
          borderColor: look.dark,
          boxShadow: active
            ? `0 0 0 3px ${hexToRgba(look.accent, 0.28)}`
            : "0 4px 0 rgba(34, 45, 37, 0.18)",
        }}
      >
        {look.feature === "fins" && (
          <div style={{ ...styles.fishTopFin, borderBottomColor: look.dark }} />
        )}

        <div style={styles.eyeRow}>
          <div style={styles.eyeWhite}>
            <div style={styles.eyePupil} />
          </div>
          <div style={styles.eyeWhite}>
            <div style={styles.eyePupil} />
          </div>
        </div>

        <div style={{ ...styles.muzzle, background: look.muzzle, borderColor: look.dark }}>
          <div style={{ ...styles.nose, background: look.nose }} />
          <div style={styles.mouthLine} />
        </div>
      </div>

      <div
        style={{
          ...styles.headNameTag,
          borderColor: hexToRgba(look.accent, 0.22),
          color: active ? "#243c31" : "#4f6659",
        }}
      >
        {npc.name.split(" ")[0]}
      </div>
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
    justifyContent: "space-between",
    padding: 14,
    background: "linear-gradient(180deg, #98c676 0%, #7eb15f 44%, #6f9f56 100%)",
    fontFamily: '"Avenir Next", "Trebuchet MS", system-ui, sans-serif',
    pointerEvents: "none",
  },
  sceneStage: {
    position: "relative",
    flex: 1,
    minHeight: 280,
    marginBottom: 10,
    overflow: "hidden",
    borderRadius: 28,
    background:
      "linear-gradient(180deg, #a9d484 0%, #8cc465 28%, #7bb255 28%, #6c9f48 100%)",
    border: "3px solid rgba(58, 93, 44, 0.48)",
    boxShadow: "inset 0 4px 0 rgba(255,255,255,0.18)",
    pointerEvents: "none",
  },
  sceneSkyBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "30%",
    background:
      "linear-gradient(180deg, rgba(200,233,154,0.45) 0%, rgba(200,233,154,0) 100%)",
  },
  sceneGrassHorizon: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "28%",
    height: "16%",
    background:
      "repeating-linear-gradient(90deg, #87b963 0 18px, #7aad58 18px 34px, #8bbf67 34px 48px)",
  },
  sceneGrassPattern: {
    position: "absolute",
    inset: "36% 0 0 0",
    background:
      "repeating-linear-gradient(90deg, rgba(111,159,72,0.92) 0 16px, rgba(102,148,66,0.92) 16px 32px, rgba(124,173,80,0.92) 32px 48px), repeating-linear-gradient(180deg, rgba(255,255,255,0.06) 0 3px, rgba(255,255,255,0) 3px 18px)",
  },
  sceneHeader: {
    position: "absolute",
    left: "50%",
    top: 12,
    transform: "translateX(-50%)",
    textAlign: "center",
  },
  sceneEyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#f2ffe6",
    textShadow: "0 2px 0 rgba(55,89,42,0.25)",
  },
  sceneTitle: {
    fontSize: 24,
    lineHeight: 1.1,
    fontWeight: 700,
    color: "#fbfff4",
    textShadow: "0 3px 0 rgba(55,89,42,0.25)",
  },
  speechBubble: {
    position: "absolute",
    left: "50%",
    top: 56,
    transform: "translateX(-50%)",
    width: "min(420px, calc(100% - 48px))",
    padding: "12px 14px",
    borderRadius: 8,
    background: "rgba(255, 251, 243, 0.92)",
    border: "3px solid rgba(104, 124, 78, 0.4)",
    boxShadow: "0 6px 0 rgba(64, 49, 31, 0.16)",
    textAlign: "center",
  },
  speechSpeaker: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  speechText: {
    fontSize: 13,
    lineHeight: 1.35,
    color: "#3d4c40",
  },
  headWrap: {
    position: "absolute",
    width: 92,
    height: 112,
    imageRendering: "pixelated",
  },
  headGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 6,
    filter: "none",
  },
  headFace: {
    position: "absolute",
    left: 10,
    top: 14,
    width: 72,
    height: 68,
    borderRadius: 4,
    border: "4px solid rgba(255,255,255,0.75)",
  },
  eyeRow: {
    position: "absolute",
    left: "50%",
    top: 20,
    transform: "translateX(-50%)",
    display: "flex",
    gap: 10,
  },
  eyeWhite: {
    width: 12,
    height: 12,
    borderRadius: 2,
    background: "#fffaf1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.08)",
  },
  eyePupil: {
    width: 5,
    height: 5,
    borderRadius: 1,
    background: "#2d241a",
  },
  muzzle: {
    position: "absolute",
    left: "50%",
    bottom: 10,
    transform: "translateX(-50%)",
    width: 30,
    height: 18,
    borderRadius: 3,
    border: "3px solid rgba(0,0,0,0.15)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26)",
  },
  nose: {
    position: "absolute",
    left: "50%",
    top: 3,
    transform: "translateX(-50%)",
    width: 8,
    height: 6,
    borderRadius: 1,
  },
  mouthLine: {
    position: "absolute",
    left: "50%",
    top: 10,
    width: 10,
    height: 5,
    transform: "translateX(-50%)",
    borderBottom: "2px solid rgba(67,53,41,0.55)",
  },
  roundEar: {
    position: "absolute",
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 3,
    border: "4px solid rgba(255,255,255,0.1)",
  },
  roundEarLeft: {
    left: 8,
  },
  roundEarRight: {
    right: 8,
  },
  longEar: {
    position: "absolute",
    top: -10,
    width: 18,
    height: 40,
    borderRadius: 3,
    border: "4px solid rgba(255,255,255,0.1)",
  },
  longEarLeft: {
    left: 16,
    transform: "rotate(-8deg)",
  },
  longEarRight: {
    right: 16,
    transform: "rotate(8deg)",
  },
  longEarInner: {
    position: "absolute",
    top: 4,
    width: 8,
    height: 22,
    borderRadius: 1,
  },
  longEarInnerLeft: {
    left: 22,
    transform: "rotate(-8deg)",
  },
  longEarInnerRight: {
    right: 22,
    transform: "rotate(8deg)",
  },
  tuft: {
    position: "absolute",
    top: 7,
    width: 0,
    height: 0,
    borderLeft: "9px solid transparent",
    borderRight: "9px solid transparent",
    borderBottom: "20px solid #000",
  },
  tuftLeft: {
    left: 12,
    transform: "rotate(-18deg)",
  },
  tuftRight: {
    right: 12,
    transform: "rotate(18deg)",
  },
  fin: {
    position: "absolute",
    top: 32,
    width: 0,
    height: 0,
    borderTop: "10px solid transparent",
    borderBottom: "10px solid transparent",
  },
  finLeft: {
    left: -2,
    borderRight: "18px solid #000",
  },
  finRight: {
    right: -2,
    borderLeft: "18px solid #000",
  },
  fishTopFin: {
    position: "absolute",
    left: "50%",
    top: -10,
    width: 0,
    height: 0,
    transform: "translateX(-50%)",
    borderLeft: "10px solid transparent",
    borderRight: "10px solid transparent",
    borderBottom: "16px solid #000",
  },
  antler: {
    position: "absolute",
    top: -6,
    width: 6,
    height: 26,
    borderRadius: 1,
  },
  antlerLeft: {
    left: 20,
    transform: "rotate(-22deg)",
    boxShadow: "-10px -4px 0 -1px currentColor, -6px 7px 0 -1px currentColor",
    color: "inherit",
  },
  antlerRight: {
    right: 20,
    transform: "rotate(22deg)",
    boxShadow: "10px -4px 0 -1px currentColor, 6px 7px 0 -1px currentColor",
    color: "inherit",
  },
  spikes: {
    position: "absolute",
    left: 8,
    top: 5,
    width: 76,
    height: 28,
    borderRadius: "34px 34px 14px 14px",
  },
  fluff: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 4,
    border: "4px solid rgba(255,255,255,0.08)",
  },
  fluffLeft: {
    left: 4,
    top: 8,
  },
  fluffRight: {
    right: 4,
    top: 8,
  },
  fluffTop: {
    left: "50%",
    top: -2,
    transform: "translateX(-50%)",
  },
  headNameTag: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    padding: "4px 10px",
    borderRadius: 4,
    background: "rgba(255, 251, 242, 0.82)",
    border: "2px solid rgba(122,176,104,0.22)",
    fontSize: 10,
    fontWeight: 700,
    boxShadow: "0 4px 0 rgba(45, 59, 48, 0.12)",
  },
  tableEdge: {
    position: "absolute",
    left: "-6%",
    right: "-6%",
    bottom: 118,
    height: 90,
    clipPath: "polygon(0 100%, 10% 38%, 28% 18%, 50% 8%, 72% 18%, 90% 38%, 100% 100%)",
    background: "linear-gradient(180deg, #7b5b3d 0%, #5b412c 100%)",
    boxShadow: "0 -4px 0 rgba(38, 22, 10, 0.18)",
  },
  tableSurface: {
    position: "absolute",
    left: "-8%",
    right: "-8%",
    bottom: 58,
    height: 94,
    clipPath: "polygon(0 100%, 8% 42%, 26% 20%, 50% 10%, 74% 20%, 92% 42%, 100% 100%)",
    background:
      "linear-gradient(180deg, rgba(118,86,58,0.96) 0%, rgba(96,67,46,0.98) 100%)",
  },
  tableCenterGlow: {
    position: "absolute",
    left: "50%",
    bottom: 126,
    width: 220,
    height: 36,
    transform: "translateX(-50%)",
    borderRadius: 8,
    background: "radial-gradient(circle, rgba(232,206,152,0.4) 0%, rgba(232,206,152,0) 72%)",
  },
  playerPawLeft: {
    position: "absolute",
    bottom: 42,
    left: "18%",
    width: 86,
    height: 38,
    borderRadius: 6,
    background: "linear-gradient(180deg, #a06943 0%, #7e4d31 100%)",
    boxShadow: "0 4px 0 rgba(39, 25, 12, 0.22)",
    transform: "rotate(6deg)",
  },
  playerPawRight: {
    position: "absolute",
    bottom: 42,
    right: "18%",
    width: 86,
    height: 38,
    borderRadius: 6,
    background: "linear-gradient(180deg, #a06943 0%, #7e4d31 100%)",
    boxShadow: "0 4px 0 rgba(39, 25, 12, 0.22)",
    transform: "rotate(-6deg)",
  },
  playerNotebook: {
    position: "absolute",
    left: "50%",
    bottom: 44,
    width: 88,
    height: 58,
    transform: "translateX(-50%) rotate(-1.5deg)",
    borderRadius: 3,
    background: "linear-gradient(180deg, #fbf5e8 0%, #efe3c8 100%)",
    boxShadow: "0 4px 0 rgba(44, 31, 18, 0.16)",
    padding: "12px 12px 10px",
    boxSizing: "border-box",
    border: "3px solid rgba(167, 136, 93, 0.26)",
  },
  playerNotebookLine: {
    height: 4,
    borderRadius: 999,
    background: "rgba(103,122,107,0.18)",
    marginBottom: 6,
  },
  playerNotebookLineShort: {
    width: "58%",
    height: 4,
    borderRadius: 999,
    background: "rgba(103,122,107,0.18)",
  },

  bottomDock: {
    width: "min(720px, calc(100% - 16px))",
    maxWidth: "100%",
    alignSelf: "center",
    display: "flex",
    flexDirection: "column",
    background: "rgba(249, 245, 236, 0.98)",
    border: "1px solid rgba(119, 144, 107, 0.22)",
    borderRadius: 24,
    boxShadow: "0 24px 48px rgba(26, 36, 29, 0.24)",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
    pointerEvents: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 16px 10px",
    borderBottom: "1px solid rgba(115,142,104,0.16)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#7ab068",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    color: "#58724f",
  },
  headerSub: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "rgba(80,100,86,0.52)",
  },
  modeBtn: {
    padding: "8px 12px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(122,176,104,0.24)",
    borderRadius: 999,
    color: "#58724f",
    fontSize: 10,
    fontFamily: "inherit",
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "rgba(122,176,104,0.18)",
    color: "#44603c",
    border: "1px solid rgba(122,176,104,0.36)",
  },

  concludeBtn: {
    padding: "8px 14px",
    background: "rgba(122,176,104,0.15)",
    border: "1px solid rgba(122,176,104,0.35)",
    borderRadius: 999,
    color: "#47623e",
    fontSize: 10,
    fontFamily: "inherit",
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    cursor: "pointer",
  },

  messageList: {
    flex: 1,
    overflowY: "auto",
    minHeight: 220,
    maxHeight: "32vh",
    padding: "14px 16px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(108,138,99,0.24) transparent",
  },

  npcRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    maxWidth: "90%",
  },
  npcDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    flexShrink: 0,
    marginTop: 8,
    boxShadow: "0 0 0 3px rgba(255,255,255,0.7)",
  },
  npcBubble: {
    background: "rgba(255,255,255,0.66)",
    border: "1px solid rgba(152,179,140,0.2)",
    borderRadius: "16px 16px 16px 8px",
    padding: "10px 13px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    boxShadow: "0 10px 18px rgba(45, 59, 48, 0.08)",
  },
  npcName: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  npcText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#32453a",
    whiteSpace: "pre-wrap",
  },

  loadingBubble: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    padding: "11px 15px",
  },
  dot: {
    display: "inline-block",
    fontSize: 22,
    color: "rgba(122,176,104,0.75)",
    animation: "council-bounce 0.9s ease-in-out infinite",
    lineHeight: 1,
  },

  playerRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  playerBubble: {
    background: "linear-gradient(180deg, rgba(126,176,106,0.18) 0%, rgba(109,157,93,0.13) 100%)",
    border: "1px solid rgba(122,176,104,0.24)",
    borderRadius: "16px 16px 8px 16px",
    padding: "10px 13px",
    maxWidth: "78%",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    boxShadow: "0 10px 18px rgba(45, 59, 48, 0.08)",
  },
  playerLabel: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#59754e",
    textAlign: "right",
  },
  playerText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#31463a",
    textAlign: "right",
    whiteSpace: "pre-wrap",
  },

  errorLine: {
    fontSize: 12,
    color: "#8d4d42",
    padding: "9px 10px",
    background: "rgba(224,139,110,0.1)",
    border: "1px solid rgba(224,139,110,0.2)",
    borderRadius: 12,
  },

  inputRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "12px 14px 8px",
    borderTop: "1px solid rgba(122,176,104,0.14)",
    flexShrink: 0,
  },
  micBtn: {
    width: 44,
    height: 44,
    flexShrink: 0,
    border: "1px solid rgba(122,176,104,0.28)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.68)",
    color: "#5a744f",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, box-shadow 0.15s",
  },
  micBtnActive: {
    background: "rgba(122,176,104,0.22)",
    boxShadow: "0 0 0 3px rgba(122,176,104,0.24)",
    color: "#3e5b37",
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.76)",
    border: "1px solid rgba(122,176,104,0.24)",
    borderRadius: 16,
    padding: "12px 14px",
    color: "#33483c",
    fontSize: 14,
    fontFamily: "inherit",
    lineHeight: 1.5,
    resize: "none",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  inputHandsFree: {
    background: "rgba(244, 250, 235, 0.96)",
    border: "1px solid rgba(122,176,104,0.34)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), 0 0 0 3px rgba(122,176,104,0.08)",
  },
  interimOverlay: {
    position: "absolute",
    inset: 0,
    padding: "12px 14px",
    color: "rgba(122,176,104,0.6)",
    fontSize: 14,
    fontFamily: "inherit",
    lineHeight: 1.5,
    pointerEvents: "none",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
  },
  sendBtn: {
    width: 44,
    height: 44,
    flexShrink: 0,
    border: "1px solid rgba(122,176,104,0.34)",
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(136,191,113,0.28) 0%, rgba(122,176,104,0.18) 100%)",
    color: "#45613d",
    fontSize: 15,
    fontFamily: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.1s",
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },

  hint: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "rgba(78, 99, 85, 0.55)",
    textAlign: "center",
    padding: "2px 16px 12px",
    flexShrink: 0,
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

function radialGradientFrom(hex) {
  return `radial-gradient(circle, ${hexToRgba(hex, 0.34)} 0%, ${hexToRgba(hex, 0.08)} 48%, ${hexToRgba(hex, 0)} 72%)`;
}

function summarizeSceneSpeech(text) {
  if (!text) return "the council is ready to hear what you think.";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 137).trim()}...`;
}

function appendTranscript(base, extra) {
  const normalizedBase = base.trim();
  const normalizedExtra = extra.replace(/\s+/g, " ").trim();

  if (!normalizedExtra) return normalizedBase;
  if (!normalizedBase) return normalizedExtra;
  return `${normalizedBase} ${normalizedExtra}`;
}

const COUNCIL_LAYOUT = {
  olive: { left: "18%", top: "51%", scale: 1.1 },
  frank: { left: "8%", top: "62%", scale: 0.98 },
  otis: { left: "28%", top: "67%", scale: 1.03 },
  suzy: { left: "42%", top: "54%", scale: 1.05 },
  hazel: { left: "58%", top: "54%", scale: 1.02 },
  daisy: { left: "72%", top: "67%", scale: 1.03 },
  rowan: { left: "88%", top: "60%", scale: 1.06 },
};

const COUNCIL_LOOKS = {
  olive: {
    face: "#8378b8",
    faceShade: "#7064a4",
    muzzle: "#ddd6f2",
    nose: "#56496f",
    dark: "#453a63",
    accent: "#7ab068",
    feature: "tufts",
  },
  frank: {
    face: "#5e99c7",
    faceShade: "#4d84b0",
    muzzle: "#dff1fb",
    nose: "#2d5879",
    dark: "#356182",
    accent: "#5ea8c4",
    feature: "fins",
  },
  otis: {
    face: "#a87752",
    faceShade: "#946543",
    muzzle: "#dfbd9b",
    nose: "#5b3a27",
    dark: "#5b3a27",
    accent: "#c4955e",
    feature: "round_ears",
  },
  suzy: {
    face: "#ece8de",
    faceShade: "#d7d2c7",
    muzzle: "#faf8f0",
    nose: "#736c62",
    dark: "#736c62",
    accent: "#b07ab8",
    feature: "fluff",
  },
  hazel: {
    face: "#8f735a",
    faceShade: "#785f49",
    muzzle: "#eadbcd",
    nose: "#46392f",
    dark: "#3f342c",
    accent: "#7ab8a0",
    feature: "spikes",
  },
  daisy: {
    face: "#c18c61",
    faceShade: "#a97551",
    muzzle: "#efd6bc",
    nose: "#5c4330",
    dark: "#6d5039",
    accent: "#a0c47a",
    feature: "antlers",
  },
  rowan: {
    face: "#ddc5a7",
    faceShade: "#c7b08f",
    muzzle: "#f4e7d7",
    nose: "#705341",
    dark: "#705341",
    accent: "#c4b45e",
    feature: "long_ears",
  },
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
