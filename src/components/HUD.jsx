// Top header card: game title, scene indicator, current status line.

import React from "react";

export default function HUD({ scene, status }) {
  const isTown = scene === "town";
  return (
    <div style={styles.headerCard}>
      <div style={styles.headerText}>
        <div style={styles.title}>Pixel Gap</div>
        <div style={styles.subtitle}>Guided workplace walkthrough</div>
      </div>
      <div style={styles.headerAside}>
        <div style={{
          ...styles.scenePill,
          background: isTown ? "#ddefd6" : "#d6e6f4",
          border: `1px solid ${isTown ? "rgba(88, 128, 76, 0.24)" : "rgba(68, 112, 160, 0.24)"}`,
          color: isTown ? "#3e6836" : "#2e5878",
        }}>
          {isTown ? "Campus Route" : "Delaware Building"}
        </div>
        <div style={styles.status}>{status}</div>
      </div>
    </div>
  );
}

const styles = {
  headerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
    padding: "12px 18px",
    borderRadius: 14,
    background: "rgba(250, 248, 244, 0.98)",
    border: "1.5px solid rgba(95, 112, 86, 0.18)",
    boxShadow: "0 8px 24px rgba(40, 56, 44, 0.09)",
  },
  headerText: { display: "flex", flexDirection: "column", gap: 2 },
  headerAside: {
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    marginLeft: "auto",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.05,
    color: "#263c2e",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: "#6c7a72",
    lineHeight: 1.35,
  },
  scenePill: {
    padding: "5px 10px",
    borderRadius: 999,
    background: "#eef1ec",
    border: "1px solid rgba(112, 126, 106, 0.12)",
    fontSize: 11,
    color: "#5c6b60",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: 700,
  },
  status: {
    textAlign: "right",
    color: "#6a776d",
    fontSize: 12,
    lineHeight: 1.35,
  },
};
