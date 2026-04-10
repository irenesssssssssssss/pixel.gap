import React from "react";

const PILLAR_LABELS = {
  env: "Environmental Stewardship",
  people: "People & Culture",
  conduct: "Business Conduct",
  chain: "Responsible Value Chain",
  // legacy keys kept for backward compatibility
  environment: "Environmental",
  social: "Social",
  governance: "Governance",
};

export default function ResultsOverlay({ report, onClose }) {
  if (!report) return null;

  const scoreEntries = Object.entries(report.scores || {});

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Final Report</div>
            <h2 style={styles.title}>{report.profile.title}</h2>
            <p style={styles.summary}>{report.profile.summary}</p>
          </div>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            back to site
          </button>
        </div>

        <div style={styles.content}>
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Pillar visibility scores</div>
            <div style={styles.scoreGrid}>
              {scoreEntries.map(([pillar, value]) => (
                <div key={pillar} style={styles.scoreCard}>
                  <div style={styles.scoreTopRow}>
                    <span style={styles.scoreLabel}>{PILLAR_LABELS[pillar] || pillar}</span>
                    <span style={styles.scoreValue}>{value}%</span>
                  </div>
                  <div style={styles.scoreTrack}>
                    <div
                      style={{
                        ...styles.scoreFill,
                        width: `${value}%`,
                        background: PILLAR_FILL_COLORS[pillar] || styles.environmentFill.background,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>Stats from your answers</div>
            <div style={styles.statsGrid}>
              {report.stats.map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>Your answers</div>
            <div style={styles.answerStack}>
              {report.choiceAnswers.map((answer, index) => (
                <article key={answer.id} style={styles.answerCard}>
                  <div style={styles.answerMeta}>
                    <span style={styles.answerIndex}>{index + 1}</span>
                    <span style={styles.answerSpeaker}>{answer.npcName}</span>
                    {answer.npcRole && <span style={styles.answerRole}>{answer.npcRole}</span>}
                  </div>
                  <div style={styles.answerPrompt}>{answer.prompt}</div>
                  <div style={styles.answerText}>{answer.answer}</div>
                </article>
              ))}
            </div>
          </section>

          {report.reflectionAnswers.length > 0 && (
            <section style={styles.section}>
              <div style={styles.sectionTitle}>Written reflections</div>
              <div style={styles.answerStack}>
                {report.reflectionAnswers.map((answer) => (
                  <article key={answer.id} style={styles.answerCard}>
                    <div style={styles.answerMeta}>
                      <span style={styles.answerSpeaker}>{answer.npcName}</span>
                    </div>
                    <div style={styles.answerPrompt}>{answer.prompt}</div>
                    <div style={styles.longAnswerText}>{answer.answer}</div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const PILLAR_FILL_COLORS = {
  env: "linear-gradient(90deg, #7ab68b, #4e8f64)",
  people: "linear-gradient(90deg, #d8b58c, #b48659)",
  conduct: "linear-gradient(90deg, #8ca6a0, #617d77)",
  chain: "linear-gradient(90deg, #a08cb4, #7a6391)",
  // legacy
  environment: "linear-gradient(90deg, #7ab68b, #4e8f64)",
  social: "linear-gradient(90deg, #d8b58c, #b48659)",
  governance: "linear-gradient(90deg, #8ca6a0, #617d77)",
};

const styles = {
  backdrop: {
    position: "absolute",
    inset: 0,
    zIndex: 40,
    background: "rgba(34, 46, 38, 0.5)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  panel: {
    width: "min(860px, calc(100% - 16px))",
    maxHeight: "calc(100% - 16px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    borderRadius: 18,
    background: "#f7f3ea",
    border: "1px solid rgba(93, 109, 91, 0.28)",
    boxShadow: "0 22px 44px rgba(22, 30, 25, 0.28)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "22px 24px 18px",
    borderBottom: "1px solid rgba(93, 109, 91, 0.18)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
  },
  kicker: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: "#7b7a6b",
    fontWeight: 700,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.05,
    color: "#304239",
    fontWeight: 800,
  },
  summary: {
    margin: "10px 0 0",
    maxWidth: 540,
    fontSize: 15,
    lineHeight: 1.55,
    color: "#516257",
  },
  closeButton: {
    border: "none",
    borderRadius: 999,
    padding: "11px 16px",
    background: "#d7e0d3",
    color: "#33473c",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
    whiteSpace: "nowrap",
  },
  content: {
    overflowY: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    color: "#758271",
    fontWeight: 800,
  },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  scoreCard: {
    padding: 14,
    borderRadius: 14,
    background: "#fffdf8",
    border: "1px solid rgba(111, 127, 109, 0.14)",
  },
  scoreTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 13,
    color: "#4e5f55",
    fontWeight: 700,
  },
  scoreValue: {
    fontSize: 18,
    color: "#2f4338",
    fontWeight: 800,
  },
  scoreTrack: {
    height: 10,
    borderRadius: 999,
    background: "#e3e8e0",
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    borderRadius: 999,
  },
  environmentFill: {
    background: "linear-gradient(90deg, #7ab68b, #4e8f64)",
  },
  socialFill: {
    background: "linear-gradient(90deg, #d8b58c, #b48659)",
  },
  governanceFill: {
    background: "linear-gradient(90deg, #8ca6a0, #617d77)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statCard: {
    padding: "14px 16px",
    borderRadius: 14,
    background: "#eef2ea",
    border: "1px solid rgba(111, 127, 109, 0.14)",
  },
  statValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#2f4338",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 1.45,
    color: "#607067",
  },
  answerStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  answerCard: {
    padding: 16,
    borderRadius: 14,
    background: "#fffdf8",
    border: "1px solid rgba(111, 127, 109, 0.14)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  answerMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  answerIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dce6d8",
    color: "#304239",
    fontSize: 12,
    fontWeight: 800,
  },
  answerSpeaker: {
    fontSize: 13,
    fontWeight: 800,
    color: "#364a3f",
  },
  answerRole: {
    fontSize: 12,
    color: "#7b7a6b",
    letterSpacing: 0.2,
  },
  answerPrompt: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#4f6157",
    fontWeight: 600,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 1.55,
    color: "#2d3b34",
  },
  longAnswerText: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#2d3b34",
    whiteSpace: "pre-wrap",
  },
};
