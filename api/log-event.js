import process from "node:process";

import { readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const sheetsEndpoint = process.env.SHEETS_ENDPOINT || "";
  if (!sheetsEndpoint) {
    return sendJson(res, 202, { ok: false, disabled: true });
  }

  try {
    const body = await readJsonBody(req);
    const payload = normalizeLogPayload(body, req);

    const sheetsResponse = await fetch(sheetsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await sheetsResponse.text();
    let responsePayload = null;
    try {
      responsePayload = rawText ? JSON.parse(rawText) : null;
    } catch {
      responsePayload = null;
    }

    if (!sheetsResponse.ok) {
      const details =
        responsePayload?.error ||
        responsePayload?.message ||
        rawText ||
        "Unknown Google Sheets logging error.";
      return sendJson(res, 502, { error: `Google Sheets logging failed: ${details}` });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Log event request failed.",
    });
  }
}

function normalizeLogPayload(body, req) {
  const data = body && typeof body === "object" && !Array.isArray(body) ? body : {};

  return {
    receivedAt: new Date().toISOString(),
    timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
    eventType: typeof data.eventType === "string" ? data.eventType : "",
    userId: typeof data.userId === "string" ? data.userId : "",
    sessionId: typeof data.sessionId === "string" ? data.sessionId : "",
    questStage: typeof data.questStage === "string" ? data.questStage : "",
    turnIndex: data.turnIndex ?? "",
    conversationRole: typeof data.conversationRole === "string" ? data.conversationRole : "",
    npcId: typeof data.npcId === "string" ? data.npcId : "",
    npcName: typeof data.npcName === "string" ? data.npcName : "",
    npcRole: typeof data.npcRole === "string" ? data.npcRole : "",
    stepId: typeof data.stepId === "string" ? data.stepId : "",
    prompt: typeof data.prompt === "string" ? data.prompt : "",
    choiceKey: data.choiceKey ?? "",
    choiceLabel: typeof data.choiceLabel === "string" ? data.choiceLabel : "",
    text: typeof data.text === "string" ? data.text : "",
    roleLevel: typeof data.roleLevel === "string" ? data.roleLevel : "",
    team:
      typeof data.team === "string"
        ? data.team
        : typeof data.branch === "string"
          ? data.branch
          : "",
    country: typeof data.country === "string" ? data.country : "",
    userAgent: req.headers["user-agent"] || "",
  };
}
