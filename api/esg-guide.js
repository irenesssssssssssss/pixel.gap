import { buildESGGuideInstructions } from "../src/engine/esgGuideAI.js";
import { createTextResponse, mapConversationHistory } from "./_lib/openai.js";
import { readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const quest = body?.quest ?? {};
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const text = await createTextResponse({
      instructions: buildESGGuideInstructions(quest),
      input: mapConversationHistory(messages),
      maxOutputTokens: 420,
    });

    return sendJson(res, 200, { text });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "ESG guide request failed.",
    });
  }
}
