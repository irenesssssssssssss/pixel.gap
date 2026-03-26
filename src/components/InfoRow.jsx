// Bottom info cards — static descriptive copy below the canvas.

import React from "react";

export default function InfoRow() {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoCard}>
        <div style={styles.infoLabel}>vibe</div>
        <div style={styles.infoValue}>small town, soft colors, helpful little coworkers</div>
      </div>
      <div style={styles.infoCard}>
        <div style={styles.infoLabel}>goal</div>
        <div style={styles.infoValue}>keep things cozy and readable while you explore</div>
      </div>
    </div>
  );
}

const styles = {
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 16,
    flexWrap: "wrap",
  },
  infoCard: {
    flex: "1 1 280px",
    padding: "14px 16px",
    borderRadius: 22,
    background: "rgba(255,250,241,0.7)",
    border: "1px solid rgba(149,169,132,0.26)",
    boxShadow: "0 12px 28px rgba(71,92,77,0.1)",
  },
  infoLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    color: "#8a7b57",
    marginBottom: 6,
  },
  infoValue: { fontSize: 14, lineHeight: 1.5, color: "#5d6f5f" },
};
