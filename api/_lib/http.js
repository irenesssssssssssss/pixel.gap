import { Buffer } from "node:buffer";

export function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return parseJson(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) return {};

  return parseJson(Buffer.concat(chunks).toString("utf8"));
}

function parseJson(raw) {
  if (!raw || !raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new Error("Request body was not valid JSON.");
  }
}
