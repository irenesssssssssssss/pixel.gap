// AI helpers for the council meeting.
// Builds shared prompt/parser helpers for the council meeting.
// The browser calls our own backend route, which then calls OpenAI.

// ── NPC roster ────────────────────────────────────────────────────────────────

export const COUNCIL_NPCS = [
  { id: "olive",  name: "Olive the Owl",     role: "Sustainability Guide",      accent: "#7ab068" },
  { id: "frank",  name: "Frank the Fish",    role: "Environmental Stewardship", accent: "#5ea8c4" },
  { id: "otis",   name: "Otis the Otter",    role: "People & Culture",          accent: "#c4955e" },
  { id: "suzy",   name: "Suzy the Sheep",    role: "Business Conduct",          accent: "#b07ab8" },
  { id: "hazel",  name: "Hazel the Hedgehog",role: "Responsible Value Chain",   accent: "#7ab8a0" },
  { id: "daisy",  name: "Daisy the Deer",    role: "People & Culture",          accent: "#a0c47a" },
  { id: "rowan",  name: "Rowan the Hare",    role: "Post-Reflection",           accent: "#c4b45e" },
];

// Maps first-name (lowercase) → accent color for fast lookup when parsing responses.
export const COUNCIL_ACCENT_BY_NAME = Object.fromEntries(
  COUNCIL_NPCS.map((n) => [n.id, n.accent])
);

// ── Choice context builder ────────────────────────────────────────────────────

const PILLAR_LABELS = {
  env: "Environmental Stewardship",
  people: "People & Culture",
  conduct: "Business Conduct",
  chain: "Responsible Value Chain",
};

function summarizeChoices(choices) {
  if (!choices?.length) return "No choices recorded.";

  const lines = [];

  // Pillar interactions
  for (const prefix of ["env", "people", "conduct", "chain"]) {
    const personal  = choices.find((c) => c.stepId === `${prefix}_scenario_personal`);
    const delaware  = choices.find((c) => c.stepId === `${prefix}_scenario_delaware`);
    const scale     = choices.find((c) => c.stepId === `${prefix}_scale`);
    if (!personal && !delaware) continue;

    lines.push(`\n${PILLAR_LABELS[prefix]}:`);
    if (personal)  lines.push(`  personal choice   → "${personal.choiceLabel}"`);
    if (delaware)  lines.push(`  Delaware view     → "${delaware.choiceLabel}"`);
    if (personal && delaware) {
      lines.push(personal.choiceKey === delaware.choiceKey
        ? `  (aligned — same answer for both)`
        : `  (gap — personal and Delaware views differed)`);
    }
    if (scale) lines.push(`  visibility at work → ${scale.choiceKey}/5`);
  }

  // Opening dilemma
  const dilemma = choices.find((c) => c.stepId === "opening_dilemma");
  if (dilemma) lines.push(`\nOpening dilemma: "${dilemma.choiceLabel}"`);

  // Final reflection
  const finalPairs = [
    ["final_strongest",  "Strongest pillar at Delaware"],
    ["final_important",  "Most important personally"],
    ["final_gap",        "Biggest gap identified"],
    ["final_focus",      "Delaware should focus on"],
  ];
  const finalLines = finalPairs
    .map(([id, label]) => {
      const c = choices.find((ch) => ch.stepId === id);
      return c ? `  ${label}: "${c.choiceLabel}"` : null;
    })
    .filter(Boolean);
  if (finalLines.length) {
    lines.push("\nFinal reflection:");
    lines.push(...finalLines);
  }

  return lines.join("\n");
}

// ── System prompt ─────────────────────────────────────────────────────────────

export function buildCouncilSystemPrompt(quest) {
  const profile  = quest?.playerProfile || {};
  const context  = summarizeChoices(quest?.choices);

  return `You are the AI running an interactive council meeting inside a pixel-art sustainability learning game built for Delaware North, a global food and hospitality company.

SETTING
The player has just completed a journey through Delaware's four sustainability pillars — Environmental Stewardship, People & Culture, Business Conduct, and Responsible Value Chain. They are now seated at the council table for an open reflective discussion with the sustainability characters they met during the game.

PLAYER PROFILE
- Role: ${profile.roleLevel || "employee"}
- Branch: ${profile.branch || "unknown"}
- Country: ${profile.country || "unknown"}

PLAYER'S ACTUAL GAME CHOICES
${context}

CHARACTERS AT THE TABLE
Each has a distinct voice. Pick the most contextually natural speaker for each turn.
- Olive the Owl (Sustainability Guide) — warm, wise moderator; ties themes together; asks the big-picture question; often opens and closes
- Frank the Fish (Environmental Stewardship) — practical, grounded, ecologically minded; asks about real-world consequences and what people actually do day-to-day
- Otis the Otter (People & Culture) — empathetic and team-focused; asks about feelings, fairness, and team dynamics; spots human cost quickly
- Suzy the Sheep (Business Conduct) — principled and clear-headed; asks about decisions, ethics, and what it feels like to speak up or stay quiet
- Hazel the Hedgehog (Responsible Value Chain) — systems thinker; asks about suppliers, long-term impact, and what happens upstream/downstream
- Daisy the Deer (People & Culture) — curious and connective; links people across topics and asks what others in the building think
- Rowan the Hare (Post-Reflection) — philosophical and closing energy; asks what the player will actually do differently after today

RESPONSE FORMAT (follow exactly)
Start every response with the speaking character's full name followed by a colon, then their message:
  Frank: [message here]
  Olive: [message here]

STYLE RULES
- Keep each response to 2–4 sentences maximum, then one open question (vary between asking and not asking on alternate turns to keep it conversational)
- Write in lowercase, warm, conversational tone — no corporate language or jargon
- Reference at least one specific choice the player made (use the data above) to make it personal
- Never judge or imply there is a wrong answer — curiosity only
- Rotate through characters naturally; don't use the same character twice in a row
- Characters may briefly build on each other: "Olive makes a good point — Frank: [question]" is acceptable
- If the player has sent 5 or more messages, Olive should gently offer to wrap up
- Never use emoji`;
}

// ── API call ──────────────────────────────────────────────────────────────────

export async function callCouncilAI(quest, conversationHistory, options = {}) {
  const response = await fetch("/api/council-ai", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      quest,
      conversationHistory,
      includeAudio: options.includeAudio ?? true,
    }),
  });

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    let body = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = {};
      }
    }
    throw new Error(
      body.error || rawBody || `Council AI request failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  return {
    text: data.text ?? "",
    audioBase64: data.audioBase64 ?? "",
    audioMime: data.audioMime ?? "audio/mpeg",
    audioError: data.audioError ?? "",
  };
}

// ── Response parser ───────────────────────────────────────────────────────────

/**
 * Parse "Frank: some text here" into { npcId, name, accent, text }.
 * Falls back to Olive if the name doesn't match.
 */
export function parseCouncilResponse(raw) {
  const match = raw.match(/^([A-Za-z]+(?:\s+the\s+\w+)?):\s*([\s\S]+)$/i);
  if (!match) return { npcId: "olive", name: "Olive the Owl", accent: "#7ab068", text: raw.trim() };

  const rawName = match[1].trim();
  const text    = match[2].trim();

  // Try matching first name (case-insensitive)
  const firstWord = rawName.toLowerCase().split(/\s+/)[0];
  const npc = COUNCIL_NPCS.find((n) => n.id === firstWord) || COUNCIL_NPCS[0];

  return { npcId: npc.id, name: npc.name, accent: npc.accent, text };
}
