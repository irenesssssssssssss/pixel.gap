// Delaware sustainability report builder.
// Converts quest choices into a structured report for the dashboard.

const PILLAR_LABELS = {
  env: "Environmental Stewardship",
  people: "People & Culture",
  conduct: "Business Conduct",
  chain: "Responsible Value Chain",
};

const PILLAR_COLORS = {
  env: "#7ab68b",
  people: "#d8b58c",
  conduct: "#8ca6a0",
  chain: "#a08cb4",
};

// Extract choice from the choices array by stepId
function getChoice(choices, stepId) {
  return choices.find((c) => c.stepId === stepId) || null;
}

// Get numeric value from a scale step (1-5)
function getScale(choices, stepId) {
  const c = getChoice(choices, stepId);
  return c ? parseInt(c.choiceKey, 10) : null;
}

// Determine whether personal choice differs from Delaware perception choice for a pillar
function hasGap(choices, prefix) {
  const personal = getChoice(choices, `${prefix}_scenario_personal`);
  const delaware = getChoice(choices, `${prefix}_scenario_delaware`);
  if (!personal || !delaware) return false;
  return personal.choiceKey !== delaware.choiceKey;
}

// Build a display profile title based on opening dilemma tendency and pillar scores
function getProfile(openingDilemmaKey, pillars) {
  const pillarLabel = PILLAR_LABELS[openingDilemmaKey] || "Sustainability";

  // Find the pillar with highest visibility score
  const pillarScores = Object.entries(pillars).map(([key, data]) => ({
    key,
    score: data.visibility || 0,
  }));
  pillarScores.sort((a, b) => b.score - a.score);
  const dominantPillar = pillarScores[0]?.key || openingDilemmaKey || "env";

  const profileMap = {
    env: { title: "Environmental Risk Watcher", summary: "You tend to notice environmental trade-offs early and prefer action over extended process when the risk is visible." },
    people: { title: "People & Culture Advocate", summary: "You prioritize the wellbeing, fairness, and psychological safety of the people around you — especially under pressure." },
    conduct: { title: "Integrity-First Practitioner", summary: "You place a high value on process integrity, ethical conduct, and doing things the right way even when it's slower." },
    chain: { title: "Responsible Value Chain Thinker", summary: "You think beyond internal operations and consider the longer-term impact on partners, suppliers, and external stakeholders." },
  };

  const profileEntry = profileMap[openingDilemmaKey] || profileMap[dominantPillar] || profileMap.env;
  return {
    ...profileEntry,
    dominantPillar,
    openingTendency: openingDilemmaKey,
  };
}

// Build pillar visibility scores (0-100) from scale answers for the score bars
function buildPillarScores(pillars) {
  return {
    env: pillars.env.visibility ? Math.round((pillars.env.visibility / 5) * 100) : 0,
    people: pillars.people.visibility ? Math.round((pillars.people.visibility / 5) * 100) : 0,
    conduct: pillars.conduct.visibility ? Math.round((pillars.conduct.visibility / 5) * 100) : 0,
    chain: pillars.chain.visibility ? Math.round((pillars.chain.visibility / 5) * 100) : 0,
  };
}

export function extractQuestionPrompt(message) {
  if (!message) return "";

  const quoted = [...message.matchAll(/[""]([^""]+)[""]/g)]
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  if (quoted.length > 0) return quoted[quoted.length - 1];

  return (
    message
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(-1)[0] || ""
  );
}

export function buildResultsReport(quest) {
  const choices = quest.choices || [];

  // ── Baseline ───────────────────────────────────────────────────────────────
  const baseline = {
    understanding: getScale(choices, "baseline_understanding"),
    relevance: getScale(choices, "baseline_relevance"),
    confidence: getScale(choices, "baseline_confidence"),
  };

  // ── Opening dilemma ────────────────────────────────────────────────────────
  const openingDilemmaChoice = getChoice(choices, "opening_dilemma");
  const openingDilemmaKey = openingDilemmaChoice?.choiceKey || null;

  // ── Pillar data ────────────────────────────────────────────────────────────
  const pillars = {
    env: {
      label: PILLAR_LABELS.env,
      color: PILLAR_COLORS.env,
      personal: getChoice(choices, "env_scenario_personal")?.choiceKey || null,
      delaware: getChoice(choices, "env_scenario_delaware")?.choiceKey || null,
      visibility: getScale(choices, "env_scale"),
      gap: hasGap(choices, "env"),
      adaptiveAnswer: getChoice(choices, "env_adaptive_gap")?.choiceKey || null,
    },
    people: {
      label: PILLAR_LABELS.people,
      color: PILLAR_COLORS.people,
      personal: getChoice(choices, "people_scenario_personal")?.choiceKey || null,
      delaware: getChoice(choices, "people_scenario_delaware")?.choiceKey || null,
      visibility: getScale(choices, "people_scale"),
      gap: hasGap(choices, "people"),
      adaptiveAnswer: getChoice(choices, "people_adaptive_gap")?.choiceKey || null,
    },
    conduct: {
      label: PILLAR_LABELS.conduct,
      color: PILLAR_COLORS.conduct,
      personal: getChoice(choices, "conduct_scenario_personal")?.choiceKey || null,
      delaware: getChoice(choices, "conduct_scenario_delaware")?.choiceKey || null,
      visibility: getScale(choices, "conduct_scale"),
      gap: hasGap(choices, "conduct"),
      adaptiveAnswer: getChoice(choices, "conduct_adaptive_gap")?.choiceKey || null,
    },
    chain: {
      label: PILLAR_LABELS.chain,
      color: PILLAR_COLORS.chain,
      personal: getChoice(choices, "chain_scenario_personal")?.choiceKey || null,
      delaware: getChoice(choices, "chain_scenario_delaware")?.choiceKey || null,
      visibility: getScale(choices, "chain_scale"),
      gap: hasGap(choices, "chain"),
      adaptiveAnswer: getChoice(choices, "chain_adaptive_gap")?.choiceKey || null,
    },
  };

  // ── Final reflection ───────────────────────────────────────────────────────
  const finalReflection = {
    strongest: getChoice(choices, "final_strongest")?.choiceKey || null,
    mostImportant: getChoice(choices, "final_important")?.choiceKey || null,
    biggestGap: getChoice(choices, "final_gap")?.choiceKey || null,
    focusNext: getChoice(choices, "final_focus")?.choiceKey || null,
  };

  // ── Post-game ──────────────────────────────────────────────────────────────
  const postGame = {
    understanding: getScale(choices, "postGame_understanding"),
    reflection: getChoice(choices, "postGame_reflection")?.choiceKey || null,
    learning: getScale(choices, "postGame_learning"),
  };

  // ── Learning gain (post - baseline) ───────────────────────────────────────
  const learningGain =
    postGame.understanding !== null && baseline.understanding !== null
      ? postGame.understanding - baseline.understanding
      : null;

  const profile = getProfile(openingDilemmaKey, pillars);
  const pillarScores = buildPillarScores(pillars);

  // ── Gap count ─────────────────────────────────────────────────────────────
  const gapCount = Object.values(pillars).filter((p) => p.gap).length;

  // ── All choice answers for the answers list ────────────────────────────────
  const choiceAnswers = choices.map((choice, index) => ({
    id: `${choice.npcId}-${choice.stepId}-${index}`,
    npcId: choice.npcId,
    npcName: choice.npcName,
    npcRole: choice.npcRole,
    stepId: choice.stepId,
    prompt: choice.prompt || "Question",
    answer: choice.choiceLabel,
    choiceKey: choice.choiceKey,
  }));

  return {
    generatedAt: new Date().toISOString(),
    playerProfile: quest.playerProfile || null,
    profile,
    baseline,
    openingDilemma: openingDilemmaKey,
    pillars,
    finalReflection,
    postGame,
    learningGain,
    pillarOrder: quest.pillarOrder || null,
    choiceAnswers,
    reflectionAnswers: [], // kept for backward compatibility
    // Simplified scores for the score bars in ResultsOverlay
    scores: pillarScores,
    stats: [
      { label: "Questions answered", value: `${choiceAnswers.length}` },
      { label: "Pillar gaps found", value: `${gapCount} of 4` },
      {
        label: "Understanding gain",
        value: learningGain !== null
          ? learningGain > 0 ? `+${learningGain}` : String(learningGain)
          : "—",
      },
      {
        label: "Baseline confidence",
        value: baseline.confidence !== null ? `${baseline.confidence}/5` : "—",
      },
      {
        label: "Post-game learning",
        value: postGame.learning !== null ? `${postGame.learning}/5` : "—",
      },
      {
        label: "Value chain visibility",
        value: pillars.chain.visibility !== null ? `${pillars.chain.visibility}/5` : "—",
      },
    ],
  };
}
