// Thin orchestrator — wires the hook to the component tree.
// Should contain no game logic, no canvas code, no data definitions.

import React, { useState } from "react";
import { useGameState } from "./hooks/useGameState";
import GameCanvas    from "./components/GameCanvas";
import PrivacyScreen from "./components/PrivacyScreen";

export default function App() {
  const [consented, setConsented] = useState(false);
  const game = useGameState();

  if (!consented) return <PrivacyScreen onConsent={() => setConsented(true)} />;

  return (
    <div style={styles.page}>
      <div style={styles.gameWrap}>
        <GameCanvas
          scene={game.scene}
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
          onChoice={game.handleChoice}
          onAdvance={game.handleAdvanceDialog}
          onSubmitReflection={game.handleReflectionSubmit}
          onCloseResults={game.closeResultsReport}
          onOpenResults={game.openResultsReport}
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
