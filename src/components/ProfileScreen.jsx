// Player profile setup screen — collects role, branch, and country before the game begins.

import React, { useState } from "react";

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "leadership", label: "Leadership" },
];

export default function ProfileScreen({ onSubmit }) {
  const [roleLevel, setRoleLevel] = useState("");
  const [branch, setBranch] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!roleLevel || !branch.trim() || !country.trim()) {
      setError("please fill in all three fields to continue.");
      return;
    }
    setError("");
    onSubmit({ roleLevel, branch: branch.trim(), country: country.trim() });
  }

  return (
    <div style={styles.screen}>
      <div style={styles.panel}>
        <div style={styles.inner}>
          <div style={styles.kicker}>Delaware · Sustainability Journey</div>
          <h1 style={styles.heading}>before you begin</h1>
          <p style={styles.body}>
            these three questions help put your responses in context. answers are kept
            anonymous and only used in aggregate.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>your level</label>
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
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="branch">branch</label>
              <input
                id="branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Rotterdam, Antwerp, Singapore"
                style={styles.input}
                autoComplete="off"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="country">country</label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Netherlands, Belgium, Germany"
                style={styles.input}
                autoComplete="off"
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.submitButton}>
              start the journey
            </button>
          </form>

          <p style={styles.notice}>
            your answers are anonymous and aggregated. no individual responses are visible to
            management.
          </p>
        </div>
      </div>
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
  },
  panel: {
    width: "min(680px, calc(100vw - 48px))",
    background: "#e8ecd7",
    borderRadius: 0,
    overflow: "hidden",
  },
  inner: {
    padding: "clamp(28px, 5vw, 52px)",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  kicker: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(11px, 1.2vw, 14px)",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#5a6e54",
    marginBottom: 12,
  },
  heading: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(28px, 4vw, 52px)",
    fontWeight: 900,
    letterSpacing: "-0.05em",
    color: "#1e2e22",
    margin: "0 0 16px",
    lineHeight: 1.05,
  },
  body: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(13px, 1.4vw, 17px)",
    lineHeight: 1.55,
    color: "#3a4e40",
    margin: "0 0 28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(11px, 1.1vw, 13px)",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#4a5e48",
  },
  roleRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  roleButton: {
    padding: "10px 20px",
    background: "#d4dcc8",
    border: "3px solid transparent",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(13px, 1.3vw, 16px)",
    fontWeight: 700,
    color: "#2e3e2c",
    cursor: "pointer",
    letterSpacing: "-0.02em",
  },
  roleButtonActive: {
    background: "#f8efe7",
    border: "3px solid #1e2e22",
    outline: "3px solid #ffffff",
    outlineOffset: "-6px",
  },
  input: {
    padding: "12px 14px",
    background: "#f5f8ef",
    border: "2px solid #b8c9b0",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(13px, 1.3vw, 16px)",
    color: "#1e2e22",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: 13,
    color: "#8b3a2a",
    margin: 0,
  },
  submitButton: {
    marginTop: 8,
    padding: "16px 28px",
    background: "#f8efe7",
    color: "#1e2e22",
    border: "5px solid #1e2e22",
    outline: "5px solid #ffffff",
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(16px, 2vw, 24px)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    cursor: "pointer",
    alignSelf: "flex-start",
    boxShadow: "6px 6px 0 rgba(30,46,34,0.15)",
  },
  notice: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    fontSize: "clamp(11px, 1vw, 13px)",
    color: "#6a7e68",
    lineHeight: 1.5,
    margin: "20px 0 0",
  },
};
