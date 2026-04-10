import React, { useEffect, useState } from "react";

import { callESGGuideAI } from "../engine/esgGuideAI";

const ANONYMOUS_NOTES_KEY = "pixel-gap-anonymous-notes";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "olive: welcome to my little learning house. ask me anything about esg, sustainability, ethics, or how these ideas show up in everyday work.",
  },
];

export default function LearningHouse({ quest, onClose }) {
  const [mode, setMode] = useState("learn");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [anonymousNote, setAnonymousNote] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(ANONYMOUS_NOTES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedNotes(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedNotes([]);
    }
  }, []);

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    setError("");

    try {
      const reply = await callESGGuideAI(quest, nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (requestError) {
      setMessages(nextMessages);
      setError(String(requestError?.message || requestError));
    } finally {
      setBusy(false);
    }
  }

  function handleDraftKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function saveAnonymousDraft() {
    const text = anonymousNote.trim();
    if (!text) return;

    const nextNotes = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        createdAt: new Date().toISOString(),
      },
      ...savedNotes,
    ];

    setSavedNotes(nextNotes);
    setAnonymousNote("");
    setSaveStatus("anonymous demo note saved on this device.");

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(ANONYMOUS_NOTES_KEY, JSON.stringify(nextNotes));
      } catch {
        setSaveStatus("couldn't save the note on this device.");
      }
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>olive's learning house</div>
            <h2 style={styles.title}>learn more about esg</h2>
            <p style={styles.subtitle}>
              ask questions, explore examples, or leave an anonymous demo note.
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton}>
            leave house
          </button>
        </div>

        <div style={styles.modeRow}>
          <button
            type="button"
            onClick={() => setMode("learn")}
            style={{ ...styles.modeButton, ...(mode === "learn" ? styles.modeButtonActive : null) }}
          >
            ask olive
          </button>
          <button
            type="button"
            onClick={() => setMode("note")}
            style={{ ...styles.modeButton, ...(mode === "note" ? styles.modeButtonActive : null) }}
          >
            anonymous note
          </button>
        </div>

        {mode === "learn" ? (
          <div style={styles.learnGrid}>
            <div style={styles.chatCard}>
              <div style={styles.chatScroller}>
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      ...styles.message,
                      ...(message.role === "user" ? styles.userMessage : styles.assistantMessage),
                    }}
                  >
                    {message.content}
                  </div>
                ))}
                {busy && <div style={styles.statusBubble}>olive is thinking...</div>}
              </div>
              <div style={styles.inputRow}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  placeholder="ask about esg, ethics, sustainability, or workplace questions..."
                  style={styles.textarea}
                  rows={3}
                />
                <button type="button" onClick={handleSend} disabled={busy || !draft.trim()} style={styles.sendButton}>
                  send
                </button>
              </div>
              {error ? <div style={styles.errorText}>{error}</div> : null}
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>good topics to ask about</div>
              <ul style={styles.promptList}>
                <li>what does esg actually mean in simple terms?</li>
                <li>how is sustainability different from compliance?</li>
                <li>what counts as responsible sourcing in hospitality?</li>
                <li>how can i raise a concern without sounding accusatory?</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={styles.noteLayout}>
            <div style={styles.noteCard}>
              <div style={styles.sideTitle}>anonymous note for this demo</div>
              <p style={styles.noteCopy}>
                this saves only on your device in this demo. it does not send a real report to delaware north.
              </p>
              <textarea
                value={anonymousNote}
                onChange={(event) => setAnonymousNote(event.target.value)}
                placeholder="share anything that has been bothering you, or draft feedback you wish leadership could hear..."
                style={styles.noteTextarea}
                rows={8}
              />
              <div style={styles.noteActions}>
                <button
                  type="button"
                  onClick={saveAnonymousDraft}
                  disabled={!anonymousNote.trim()}
                  style={styles.sendButton}
                >
                  save anonymous note
                </button>
                {saveStatus ? <div style={styles.statusText}>{saveStatus}</div> : null}
              </div>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>what this can be useful for</div>
              <ul style={styles.promptList}>
                <li>something at work that feels off but hard to name</li>
                <li>a fairness or culture concern you want to put into words</li>
                <li>a sustainability idea you wish the company would notice</li>
                <li>a draft you may later raise in a real channel</li>
              </ul>
              {savedNotes.length ? (
                <div style={styles.savedList}>
                  <div style={styles.savedTitle}>saved on this device</div>
                  {savedNotes.slice(0, 3).map((note) => (
                    <div key={note.id} style={styles.savedItem}>
                      {note.text}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 34,
    background: "rgba(24, 32, 23, 0.44)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  panel: {
    width: "min(980px, calc(100% - 24px))",
    minHeight: "min(640px, calc(100% - 24px))",
    maxHeight: "calc(100% - 24px)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 20,
    borderRadius: 20,
    border: "4px solid #2f4a2e",
    background: "linear-gradient(180deg, #f7f1df 0%, #ebdfbf 100%)",
    boxShadow: "0 24px 52px rgba(0,0,0,0.32)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#6a7c45",
    fontWeight: 800,
  },
  title: {
    margin: "4px 0 4px",
    fontSize: 34,
    lineHeight: 1,
    color: "#3e4b21",
  },
  subtitle: {
    margin: 0,
    maxWidth: 520,
    color: "#5e5b47",
    lineHeight: 1.4,
    fontSize: 14,
  },
  closeButton: {
    border: "3px solid #2f4a2e",
    background: "#d8ebb0",
    color: "#2a3920",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
    textTransform: "lowercase",
  },
  modeRow: {
    display: "flex",
    gap: 10,
  },
  modeButton: {
    border: "3px solid #48613b",
    background: "#edf4d6",
    color: "#3c4d2b",
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 800,
    cursor: "pointer",
    textTransform: "lowercase",
  },
  modeButtonActive: {
    background: "#7cab5d",
    color: "#f6f9ec",
  },
  learnGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(240px, 0.9fr)",
    gap: 16,
    minHeight: 0,
    flex: 1,
  },
  noteLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(240px, 0.9fr)",
    gap: 16,
    minHeight: 0,
    flex: 1,
  },
  chatCard: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    borderRadius: 18,
    padding: 16,
    background: "#fffaf0",
    border: "3px solid #cfbf93",
    boxShadow: "inset 0 2px 0 rgba(255,255,255,0.7)",
  },
  chatScroller: {
    flex: 1,
    minHeight: 260,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingRight: 6,
  },
  message: {
    maxWidth: "88%",
    padding: "12px 14px",
    borderRadius: 14,
    lineHeight: 1.45,
    fontSize: 14,
    whiteSpace: "pre-wrap",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    background: "#edf5d7",
    color: "#344124",
    border: "2px solid #bcd08f",
  },
  userMessage: {
    alignSelf: "flex-end",
    background: "#e5eef8",
    color: "#314257",
    border: "2px solid #b4cbe6",
  },
  statusBubble: {
    alignSelf: "flex-start",
    color: "#65724a",
    fontSize: 13,
    fontWeight: 700,
  },
  inputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 12,
    marginTop: 14,
    alignItems: "end",
  },
  textarea: {
    width: "100%",
    resize: "none",
    borderRadius: 14,
    border: "3px solid #d7c79e",
    padding: "12px 14px",
    font: "inherit",
    background: "#fffdf7",
    color: "#3b3a2f",
    outline: "none",
  },
  noteTextarea: {
    width: "100%",
    resize: "vertical",
    borderRadius: 14,
    border: "3px solid #d7c79e",
    padding: "12px 14px",
    font: "inherit",
    background: "#fffdf7",
    color: "#3b3a2f",
    outline: "none",
    minHeight: 170,
  },
  sendButton: {
    border: "3px solid #35532b",
    background: "#87b65d",
    color: "#f7faef",
    borderRadius: 14,
    padding: "11px 16px",
    fontWeight: 800,
    cursor: "pointer",
    textTransform: "lowercase",
    minWidth: 110,
  },
  errorText: {
    marginTop: 10,
    color: "#9f3c32",
    fontSize: 13,
    fontWeight: 700,
  },
  sideCard: {
    borderRadius: 18,
    padding: 16,
    background: "#f4ecd5",
    border: "3px solid #ceb982",
    color: "#54472e",
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#4a5829",
    marginBottom: 10,
  },
  promptList: {
    margin: 0,
    paddingLeft: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    lineHeight: 1.4,
    fontSize: 14,
  },
  noteCard: {
    borderRadius: 18,
    padding: 16,
    background: "#fffaf0",
    border: "3px solid #cfbf93",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  noteCopy: {
    margin: 0,
    color: "#6a6044",
    lineHeight: 1.4,
    fontSize: 14,
  },
  noteActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusText: {
    color: "#53623a",
    fontSize: 13,
    fontWeight: 700,
  },
  savedList: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  savedTitle: {
    fontWeight: 800,
    color: "#5a6638",
  },
  savedItem: {
    padding: "9px 10px",
    borderRadius: 12,
    background: "#fff8e7",
    border: "2px solid #dac99c",
    fontSize: 13,
    lineHeight: 1.4,
  },
};
