// Player profile setup screen — collects role, team, and country before the game begins.

import React, { useState } from "react";

const ROLE_OPTIONS = [
  {
    value: "employee",
    label: "Employee",
    detail: "individual contributor or front-line team member",
  },
  {
    value: "manager",
    label: "Manager",
    detail: "people leader, supervisor, or department manager",
  },
  {
    value: "leadership",
    label: "Leadership",
    detail: "senior leader, director, or executive",
  },
];

export default function ProfileScreen({ onSubmit }) {
  const [roleLevel, setRoleLevel] = useState("");
  const [team, setTeam] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const canSubmit = Boolean(roleLevel && team.trim() && country.trim());

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError("please fill in all three fields to continue.");
      return;
    }
    setError("");
    onSubmit({ roleLevel, team: team.trim(), country: country.trim() });
  }

  function handleCountryKeyDown(e) {
    if (e.key === "Tab" && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div style={styles.screen}>
      <div style={styles.screenGlow} />
      <div style={styles.screenGlowSecondary} />
      <div style={styles.panel}>
        <div style={styles.panelTopBar} />
        <div style={styles.inner}>
          <div style={styles.kickerRow}>
            <div style={styles.stepChip}>profile setup</div>
          </div>

          <div style={styles.heroBlock}>
            <h1 style={styles.heading}>set your starting point</h1>
            <p style={styles.body}>
              a few quick details help make the experience feel more relevant. answers are
              anonymous and only used in aggregate.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <div style={styles.questionNumber}>1</div>
                <div>
                  <label style={styles.label}>your level</label>
                  <p style={styles.helper}>pick the option that best matches your current role.</p>
                </div>
              </div>
              <div style={styles.roleRow}>
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    style={{
                      ...styles.roleButton,
                      ...(roleLevel === opt.value ? styles.roleButtonActive : {}),
                    }}
                    onClick={() => setRoleLevel(opt.value)}
                  >
                    <span style={styles.roleButtonTitle}>{opt.label}</span>
                    <span style={styles.roleButtonDetail}>{opt.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.detailsGrid}>
              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <div style={styles.questionNumber}>2</div>
                  <div>
                    <label style={styles.label} htmlFor="team">team</label>
                    <p style={styles.helper}>use the team you work with most closely.</p>
                  </div>
                </div>
                <input
                  id="team"
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g. operations, guest services, finance"
                  style={styles.input}
                  autoComplete="off"
                />
              </div>

              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <div style={styles.questionNumber}>3</div>
                  <div>
                    <label style={styles.label} htmlFor="country">country</label>
                    <p style={styles.helper}>this helps us keep examples relevant to your context.</p>
                  </div>
                </div>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onKeyDown={handleCountryKeyDown}
                  placeholder="e.g. Netherlands, Belgium, Germany"
                  style={styles.input}
                  autoComplete="off"
                />
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.footerRow}>
              <p style={styles.notice}>
                anonymous and aggregated. no individual responses are visible to management.
              </p>
              <button type="submit" style={styles.submitButton}>
                start the journey
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    height: "100vh",
    background: "linear-gradient(180deg, #2b4635 0%, #436246 42%, #8ea164 42%, #728553 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  screenGlow: {
    position: "absolute",
    width: 340,
    height: 340,
    left: "10%",
    top: "8%",
    background: "rgba(250, 222, 150, 0.14)",
    borderRadius: 0,
    transform: "rotate(12deg)",
    filter: "blur(10px)",
  },
  screenGlowSecondary: {
    position: "absolute",
    width: 420,
    height: 220,
    right: "6%",
    bottom: "12%",
    background: "rgba(35, 61, 46, 0.22)",
    borderRadius: 0,
    transform: "rotate(-8deg)",
    filter: "blur(8px)",
  },
  panel: {
    width: "min(780px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 24px)",
    background: "#eadfbc",
    borderRadius: 0,
    overflow: "hidden",
    border: "4px solid #33442f",
    boxShadow: "0 16px 0 #273320, 0 32px 48px rgba(15, 24, 18, 0.28)",
    position: "relative",
    zIndex: 1,
  },
  panelTopBar: {
    height: 16,
    background: "repeating-linear-gradient(90deg, #5c7d53 0 22px, #6e8d60 22px 44px)",
    borderBottom: "4px solid #33442f",
  },
  inner: {
    padding: "clamp(18px, 2.8vw, 26px)",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    background:
      "linear-gradient(180deg, rgba(255,251,238,0.45) 0, rgba(255,251,238,0.45) 2px, transparent 2px, transparent 100%)",
  },
  kickerRow: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  stepChip: {
    padding: "6px 10px",
    background: "#32462f",
    color: "#edf3d2",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    border: "2px solid #24331f",
  },
  heroBlock: {
    marginBottom: 18,
  },
  heading: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(28px, 3.8vw, 48px)",
    fontWeight: 900,
    letterSpacing: "-0.05em",
    color: "#1f2d1c",
    margin: "0 0 8px",
    lineHeight: 1.05,
  },
  body: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(12px, 1.15vw, 15px)",
    lineHeight: 1.45,
    color: "#42523d",
    margin: 0,
    maxWidth: 540,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  questionCard: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#f5ecd1",
    border: "3px solid #c9b487",
    boxShadow: "inset 0 2px 0 #fff8e6",
    padding: "14px 14px 16px",
  },
  questionHeader: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  questionNumber: {
    width: 28,
    height: 28,
    background: "#32462f",
    color: "#edf3d2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: 13,
    fontWeight: 900,
    flexShrink: 0,
    border: "2px solid #24331f",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "clamp(11px, 1.1vw, 13px)",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#46563f",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    marginBottom: 4,
  },
  helper: {
    margin: 0,
    color: "#6a7356",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: 11,
    lineHeight: 1.35,
  },
  roleRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  roleButton: {
    padding: "12px 14px",
    background: "#dde5cf",
    border: "3px solid #b4c0a3",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    color: "#2f412b",
    cursor: "pointer",
    letterSpacing: "-0.01em",
    boxShadow: "0 3px 0 #b8c3a7",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    minHeight: 74,
    textAlign: "left",
  },
  roleButtonActive: {
    background: "#fff4df",
    border: "3px solid #24401e",
    boxShadow: "0 3px 0 #8b935e",
  },
  roleButtonTitle: {
    fontSize: "clamp(13px, 1.25vw, 17px)",
    fontWeight: 800,
  },
  roleButtonDetail: {
    fontSize: 11,
    lineHeight: 1.35,
    color: "#5a6c54",
  },
  input: {
    padding: "12px 12px",
    background: "#fff9ea",
    border: "3px solid #ccb993",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(12px, 1.15vw, 15px)",
    color: "#20301d",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "inset 0 2px 0 #fffef8",
  },
  error: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: 13,
    color: "#8b3a2a",
    margin: 0,
    background: "#f6ddd5",
    border: "2px solid #d9a497",
    padding: "10px 12px",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  submitButton: {
    padding: "14px 24px",
    background: "#f4d17c",
    color: "#24321f",
    border: "4px solid #6f5524",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(15px, 1.8vw, 21px)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    cursor: "pointer",
    alignSelf: "flex-start",
    boxShadow: "0 5px 0 #a27b32",
  },
  notice: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(10px, 0.95vw, 12px)",
    color: "#667057",
    lineHeight: 1.4,
    margin: 0,
    maxWidth: 360,
  },
};
