import { REFLECTION_PROMPTS } from "../data/npcs";

const DEFAULT_SCORES = {
  environment: 0,
  social: 0,
  governance: 0,
};

const CHOICE_ANALYTICS = {
  "olive_signal:waste": { scores: { social: 2, governance: 1 }, tags: ["action", "operations"] },
  "olive_signal:signs": { scores: { social: 1, governance: 2 }, tags: ["communication", "transparency"] },
  "olive_signal:attention": { scores: { environment: 2, governance: 1 }, tags: ["risk", "attention"] },

  "olive_read:care": { scores: { social: 2, governance: 1 }, tags: ["care", "operations"] },
  "olive_read:distance": { scores: { governance: 2, social: 1 }, tags: ["credibility", "skepticism"] },
  "olive_read:visibleRisk": { scores: { environment: 2, governance: 2 }, tags: ["risk", "transparency"] },

  "olive_fix:action": { scores: { social: 1, governance: 2 }, tags: ["action", "followThrough"] },
  "olive_fix:communication": { scores: { social: 2, governance: 1 }, tags: ["communication", "transparency"] },
  "olive_fix:transparency": { scores: { governance: 3 }, tags: ["transparency", "evidence"] },

  "olive_confidence:confident": { scores: { governance: 1 }, tags: ["confidenceHigh"] },
  "olive_confidence:unsure": { scores: { governance: 1 }, tags: ["confidenceMid"] },
  "olive_confidence:notConfident": { scores: { governance: 2 }, tags: ["confidenceLow", "skepticism"] },

  "frank:actionFirst": { scores: { environment: 3, governance: 1 }, tags: ["action", "risk"] },
  "frank:transparent": { scores: { environment: 2, governance: 2 }, tags: ["transparency", "evidence"] },
  "frank:wait": { scores: { governance: 2 }, tags: ["process", "delay"] },

  "otis:visibleChange": { scores: { governance: 2, social: 1 }, tags: ["action", "followThrough"] },
  "otis:trackedTarget": { scores: { governance: 3 }, tags: ["process", "followThrough", "transparency"] },
  "otis:strategyDoc": { scores: { governance: 2 }, tags: ["process", "planning"] },

  "suzy:equity": { scores: { social: 3 }, tags: ["fairness", "care"] },
  "suzy:equal": { scores: { social: 2, governance: 1 }, tags: ["fairness", "balance"] },
  "suzy:negotiate": { scores: { social: 2, governance: 1 }, tags: ["dialogue", "selfOrganization"] },

  "daisy:raiseNow": { scores: { social: 2, governance: 2 }, tags: ["speakUp", "action"] },
  "daisy:raiseCarefully": { scores: { social: 2, governance: 1 }, tags: ["speakUp", "care"] },
  "daisy:leaveToLeadership": { scores: { governance: 1 }, tags: ["deference", "delay"] },

  "hazel:traceable": { scores: { governance: 3 }, tags: ["evidence", "transparency", "followThrough"] },
  "hazel:parked": { scores: { governance: 2 }, tags: ["skepticism", "delay"] },
  "hazel:influence": { scores: { governance: 3 }, tags: ["skepticism", "politics"] },

  "rowan:followThrough": { scores: { governance: 3, social: 1 }, tags: ["followThrough", "action"] },
  "rowan:direction": { scores: { governance: 2 }, tags: ["planning", "direction"] },
  "rowan:signals": { scores: { governance: 1, social: 1 }, tags: ["signals", "credibility"] },
};

function wordsIn(text) {
  return (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normaliseScores(rawScores) {
  const total = rawScores.environment + rawScores.social + rawScores.governance;
  if (total <= 0) {
    return {
      environment: 0,
      social: 0,
      governance: 0,
    };
  }

  return {
    environment: Math.round((rawScores.environment / total) * 100),
    social: Math.round((rawScores.social / total) * 100),
    governance: Math.round((rawScores.governance / total) * 100),
  };
}

function getDominantPillar(scores) {
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "governance";
}

function getDominantTag(tagCounts) {
  const entries = Object.entries(tagCounts);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "followThrough";
}

function getLeadershipConfidence(choiceAnswers) {
  const confidenceAnswer = choiceAnswers.find((answer) => answer.stepId === "olive_confidence");
  if (!confidenceAnswer) return "Not captured";
  if (confidenceAnswer.choiceKey === "confident") return "Fairly confident";
  if (confidenceAnswer.choiceKey === "unsure") return "Somewhat unsure";
  return "Not confident";
}

function getProfileCopy(pillar, styleTag) {
  if (pillar === "environment") {
    return {
      title: "Environmental Risk Watcher",
      summary:
        styleTag === "action"
          ? "You tend to spot risk early and prefer practical action before problems harden into routine."
          : "You read operational details as early warning signals and pay close attention to visible risk.",
    };
  }

  if (pillar === "social") {
    return {
      title:
        styleTag === "speakUp"
          ? "Psychological Safety Advocate"
          : "People & Fairness Advocate",
      summary:
        styleTag === "speakUp"
          ? "You lean toward naming hidden strain early and treating silence itself as a workplace risk."
          : "You focus on who carries the load, who gets left out, and whether support reaches the least visible people.",
    };
  }

  return {
    title:
      styleTag === "transparency"
        ? "Transparency-Minded Governor"
        : styleTag === "process"
          ? "Systems-Oriented Strategist"
          : "Governance Follow-Through Checker",
    summary:
      styleTag === "transparency"
        ? "You judge credibility through openness, traceability, and whether difficult information stays visible."
        : styleTag === "process"
          ? "You value clear ownership, disciplined reporting, and structures that survive real-world pressure."
          : "You care most about whether leadership follows through in ways people on the ground can actually feel.",
  };
}

export function extractQuestionPrompt(message) {
  if (!message) return "";

  const quoted = [...message.matchAll(/[“"]([^"”]+)[”"]/g)]
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  if (quoted.length > 0) return quoted[quoted.length - 1];

  return message
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(-1)[0] || "";
}

export function buildResultsReport(quest) {
  const rawScores = { ...DEFAULT_SCORES };
  const tagCounts = {};

  const choiceAnswers = (quest.choices || []).map((choice, index) => {
    const analytics =
      CHOICE_ANALYTICS[`${choice.stepId}:${choice.choiceKey}`] ||
      CHOICE_ANALYTICS[`${choice.npcId}:${choice.choiceKey}`] ||
      { scores: DEFAULT_SCORES, tags: [] };

    Object.entries(analytics.scores || {}).forEach(([pillar, value]) => {
      rawScores[pillar] += value;
    });

    (analytics.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    return {
      id: `${choice.npcId}-${choice.stepId}-${index}`,
      npcId: choice.npcId,
      npcName: choice.npcName,
      npcRole: choice.npcRole,
      stepId: choice.stepId,
      prompt: choice.prompt || "Question",
      answer: choice.choiceLabel,
      choiceKey: choice.choiceKey,
      tags: analytics.tags || [],
    };
  });

  const reflectionAnswers = REFLECTION_PROMPTS.map((prompt) => ({
    id: prompt.id,
    npcName: prompt.speaker,
    prompt: prompt.prompt,
    answer: (quest.reflections?.[prompt.id] || "").trim(),
  })).filter((answer) => answer.answer);

  const scores = normaliseScores(rawScores);
  const dominantPillar = getDominantPillar(scores);
  const dominantStyle = getDominantTag(tagCounts);
  const profile = getProfileCopy(dominantPillar, dominantStyle);
  const reflectionWordCount = reflectionAnswers.reduce((sum, answer) => sum + wordsIn(answer.answer), 0);

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      ...profile,
      dominantPillar,
      dominantStyle,
    },
    scores,
    choiceAnswers,
    reflectionAnswers,
    stats: [
      { label: "Questions answered", value: `${choiceAnswers.length} multiple-choice` },
      { label: "Written reflections", value: `${reflectionAnswers.length} responses` },
      { label: "Action-first picks", value: String(tagCounts.action || 0) },
      { label: "Transparency picks", value: String((tagCounts.transparency || 0) + (tagCounts.evidence || 0)) },
      { label: "People & fairness picks", value: String((tagCounts.fairness || 0) + (tagCounts.care || 0) + (tagCounts.speakUp || 0)) },
      { label: "Leadership confidence", value: getLeadershipConfidence(choiceAnswers) },
      { label: "Reflection word count", value: String(reflectionWordCount) },
    ],
  };
}
