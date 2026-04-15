// Thin orchestrator — wires the hook to the component tree.
// Should contain no game logic, no canvas code, no data definitions.

import React, { useState } from "react";
import { useGameState } from "./hooks/useGameState";
import GameCanvas     from "./components/GameCanvas";
import IntroScreen    from "./components/IntroScreen";
import PrivacyScreen  from "./components/PrivacyScreen";
import ProfileScreen  from "./components/ProfileScreen";

export default function App() {
  const [screen, setScreen] = useState("start");
  const game = useGameState();
  const isDev = import.meta.env.DEV;

  if (screen === "start")   return <PrivacyScreen onConsent={() => setScreen("intro")} />;
  if (screen === "intro")   return <IntroScreen onStart={() => setScreen("profile")} />;
  if (screen === "profile") {
    return (
      <ProfileScreen
        onSubmit={(profile) => {
          game.setPlayerProfile(profile);
          setScreen("game");
        }}
      />
    );
  }

  return (
    <div style={styles.page}>
      {isDev && (
        <div style={styles.devTools}>
          <button
            style={styles.skipBtn}
            onClick={game.skipToDelaware}
            title="dev: skip to delaware office"
          >
            ⏭ skip to delaware
          </button>
          <button
            style={styles.skipBtn}
            onClick={game.skipToDebate}
            title="dev: skip to council debate"
          >
            ⏭ skip to debate
          </button>
        </div>
      )}
      <div style={styles.gameWrap}>
        <GameCanvas
          scene={game.scene}
          player={game.player}
          townNpcs={game.townNpcs}
          officeNpcs={game.officeNpcs}
          playerRef={game.playerRef}
          npcRefs={{ town: game.townNpcsRef, office: game.officeNpcsRef }}
          nearbyTarget={game.nearbyTarget}
          objectiveTarget={game.objectiveTarget}
          objectiveLabel={game.objectiveLabel}
          quest={game.quest}
          banner={game.banner}
          dialog={game.dialog}
          reportOpen={game.reportOpen}
          resultsReport={game.resultsReport}
          councilOpen={game.councilOpen}
          learningHouseOpen={game.learningHouseOpen}
          onChoice={game.handleChoice}
          onAdvance={game.handleAdvanceDialog}
          onSubmitReflection={game.handleReflectionSubmit}
          onCloseResults={game.closeResultsReport}
          onOpenResults={game.openResultsReport}
          onCloseCouncil={game.closeCouncil}
          onOpenLearningHouse={game.openLearningHouse}
          onCloseLearningHouse={game.closeLearningHouse}
        />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    background: "#dfe6da",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    fontFamily: '"Avenir Next", "Trebuchet MS", system-ui, sans-serif',
    color: "#31423a",
    position: "relative",
    overflow: "hidden",
  },
  devTools: {
    position: "fixed",
    right: 12,
    bottom: 12,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  skipBtn: {
    padding: "6px 12px",
    background: "rgba(20,20,20,0.82)",
    border: "1px solid rgba(255,200,80,0.5)",
    borderRadius: 4,
    color: "rgba(255,200,80,0.85)",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  gameWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    width: "fit-content",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
};
