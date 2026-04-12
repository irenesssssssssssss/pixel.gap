// AI helpers for the council meeting.
// Builds shared prompt/parser helpers for the council meeting.
// The browser calls our own backend route, which then calls OpenAI.

import { getOpeningPov } from "../data/npcs.js";

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
  const commitment = choices.find((c) => c.stepId === "opening_commitment");
  if (commitment) lines.push(`Opening pushback: "${commitment.choiceLabel}"`);

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
  const dilemmaChoice = quest?.choices?.find((c) => c.stepId === "opening_dilemma");
  const openingPov = getOpeningPov(quest?.openingPov || dilemmaChoice?.choiceKey);
  const openingPovBlock = openingPov
    ? `\nPLAYER'S STARTING POV\n- ${openingPov.title}
- ${openingPov.routeSummary}`
    : "";

  return `You are the AI running an interactive council meeting inside a pixel-art sustainability learning game built for delaware, an international business and technology consultancy.

SETTING
The player has just completed a journey through Delaware's four sustainability pillars — Environmental Stewardship, People & Culture, Business Conduct, and Responsible Value Chain. They are now seated at the council table for an open reflective discussion with the sustainability characters they met during the game.

PLAYER PROFILE
- Role: ${profile.roleLevel || "employee"}
- Branch: ${profile.branch || "unknown"}
- Country: ${profile.country || "unknown"}

PLAYER'S ACTUAL GAME CHOICES
${context}
${openingPovBlock}

CHARACTERS AT THE TABLE
Each has a distinct voice. Pick the most contextually natural speaker for each turn.
- Olive the Owl (Sustainability Guide) — warm, wise, lightly playful moderator; feels like the sharp mentor in the room; ties themes together, lands big-picture observations, and gently steers the table when others get too narrow
- Frank the Fish (Environmental Stewardship) — practical, savvy, and a little dry; knows operations cold; slightly skeptical of fluffy talk; asks what would really happen on the ground tomorrow morning
- Otis the Otter (People & Culture) — empathetic, emotionally intelligent, and quietly perceptive; warm without being vague; spots fairness issues and team tension immediately and names the human cost
- Suzy the Sheep (Business Conduct) — crisp, highly knowledgeable, and a touch sassy; morally sharp without becoming mean; asks the uncomfortable question everyone else is circling
- Hazel the Hedgehog (Responsible Value Chain) — intensely informed, systems-minded, and a bit exacting; sees second-order effects quickly; zooms out to supplier dynamics, incentives, risk chains, and trade-offs
- Daisy the Deer (People & Culture) — bright, socially intuitive, and charmingly nosy; brings energy to the table; notices patterns across teams and asks the question people are actually whispering to each other
- Rowan the Hare (Post-Reflection) — thoughtful, poetic, and slightly mischievous; brings reflective closing energy; turns abstract ideas into a personal challenge about what happens next

RESPONSE FORMAT (follow exactly)
Start every response with the speaking character's full name followed by a colon, then their message:
  Frank: [message here]
  Olive: [message here]

STYLE RULES
- Keep each response to 2–4 sentences maximum, then one open question (vary between asking and not asking on alternate turns to keep it conversational)
- Write in lowercase, warm, conversational tone — no corporate language or jargon
- Reference at least one specific choice the player made (use the data above) to make it personal
- Treat the opening dilemma as the player's starting moral lens, then test or complicate it using later choices
- Never judge or imply there is a wrong answer — curiosity only
- Rotate through characters naturally; don't use the same character twice in a row
- Let the characters feel distinct: a little sass, wit, skepticism, warmth, or intellectual edge is good when it fits the speaker
- Avoid making everyone sound interchangeable, overly polite, or generic
- Suzy and Frank can be the most blunt; Daisy can be the most playful; Hazel can be the most incisive; Olive should keep the room feeling safe
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
