import { createTextResponse } from "./_lib/openai.js";
import { readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return sendJson(res, 400, { error: "Missing prompt." });
    }

    const text = await createTextResponse({
      instructions: "Answer helpfully and concisely.",
      input: prompt,
      maxOutputTokens: 300,
    });

    return sendJson(res, 200, {
      text,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Something went wrong.",
    });
  }
}
