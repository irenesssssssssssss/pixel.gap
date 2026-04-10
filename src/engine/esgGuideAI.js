function summarizePlayerContext(quest) {
  const profile = quest?.playerProfile || {};
  const choices = Array.isArray(quest?.choices) ? quest.choices : [];
  const recentChoices = choices.slice(-4).map((choice) => `- ${choice.npcName || choice.npcId}: ${choice.choiceLabel}`);

  return [
    `role: ${profile.roleLevel || "employee"}`,
    `branch: ${profile.branch || "unknown"}`,
    `country: ${profile.country || "unknown"}`,
    recentChoices.length ? "recent choices:" : null,
    ...recentChoices,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildESGGuideInstructions(quest) {
  return `you are olive the owl, a warm educational guide inside a pixel-art delaware north learning game.

purpose
- answer esg, sustainability, ethics, workplace culture, business conduct, and responsible sourcing questions in plain language
- keep answers practical and easy to understand
- connect examples to hospitality, food service, venues, travel, parks, and everyday team decisions when helpful

player context
${summarizePlayerContext(quest)}

rules
- write in lowercase
- keep most answers to 2-5 short sentences unless the player asks for more detail
- be supportive and non-judgmental
- do not invent company policies or legal guarantees
- never claim that this chat sends messages to delaware north or any live reporting channel
- if the player wants help wording a concern, you can help them phrase a clear anonymous note draft
- if the player describes immediate danger, harassment, discrimination, self-harm, or illegal activity, gently urge them to use a real trusted safety, hr, ethics, or emergency channel right away
- never use emoji`;
}

export async function callESGGuideAI(quest, messages) {
  const response = await fetch("/api/esg-guide", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      quest,
      messages,
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
      body.error || rawBody || `ESG guide request failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  return data.text ?? "";
}
