export function parseSpeechSegments(dialog, bodyText) {
  if (!bodyText) return [];

  const parts = bodyText
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const segments = [];
  let currentSpeaker = dialog.npcName || null;
  let currentRole = dialog.npcRole || null;
  const npcFirstName = dialog.npcName?.split(" ")[0] || null;

  parts.forEach((part) => {
    const lines = part
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    let contentLines = [...lines];
    const firstLine = lines[0];

    if (firstLine === "Player") {
      currentSpeaker = "You";
      currentRole = null;
      contentLines = lines.slice(1);
    } else if (firstLine.includes(" — ")) {
      const [speaker, role] = firstLine.split(/\s+—\s+/);
      currentSpeaker = speaker.trim();
      currentRole = role?.trim() || null;
      contentLines = lines.slice(1);
    } else {
      const isStandaloneSpeakerLabel =
        !firstLine.includes('"') &&
        !firstLine.includes("“") &&
        !firstLine.includes(".") &&
        !firstLine.includes("?") &&
        !firstLine.includes("!") &&
        /^[A-Za-z][A-Za-z\s'-]{0,30}$/.test(firstLine);

      if (isStandaloneSpeakerLabel) {
        currentSpeaker =
          firstLine === "Player"
            ? "You"
            : firstLine.trim();
        currentRole =
          firstLine === "Player"
            ? null
            : currentSpeaker === dialog.npcName || currentSpeaker === npcFirstName
              ? dialog.npcRole || null
              : null;
        contentLines = lines.slice(1);
      }
    }

    if (contentLines.length === 0) return;

    const text = contentLines.join(" ").replace(/^["“]/, "").replace(/["”]$/, "").trim();
    if (!text) return;

    if (!currentSpeaker) {
      segments.push({
        speaker: "Site Note",
        role: null,
        text,
        variant: "note",
      });
      return;
    }

    segments.push({
      speaker: currentSpeaker,
      role: currentRole,
      text,
      variant: currentSpeaker === "You" ? "player" : "npc",
    });
  });

  return segments;
}

export function makePlayerChoiceSegment(text) {
  return {
    speaker: "You",
    role: null,
    text,
    variant: "player",
  };
}
