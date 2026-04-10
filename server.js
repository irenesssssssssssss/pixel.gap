import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCouncilSystemPrompt, parseCouncilResponse } from "./src/engine/councilAI.js";
import { buildESGGuideInstructions } from "./src/engine/esgGuideAI.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = path.dirname(__dirname);
const distDir = path.join(__dirname, "dist");

loadLocalEnv(path.join(workspaceDir, ".env.local"));
loadLocalEnv(path.join(__dirname, ".env.local"));
loadLocalEnv(path.join(__dirname, ".env"));

const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const OPENAI_MODEL = "gpt-5.4-mini";
const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

const COUNCIL_VOICES = {
  olive: { voice: "sage", instructions: "warm, wise, reassuring, gentle moderator energy; calm pace; natural and conversational." },
  frank: { voice: "marin", instructions: "grounded, practical, friendly, lightly curious; clear and steady." },
  otis: { voice: "cedar", instructions: "empathetic, soft, encouraging, team-oriented; warm and human." },
  suzy: { voice: "alloy", instructions: "clear-headed, principled, calm, precise; kind rather than stern." },
  hazel: { voice: "ash", instructions: "thoughtful, measured, systems-minded, reflective; calm confidence." },
  daisy: { voice: "coral", instructions: "curious, connective, bright, welcoming; lively but gentle." },
  rowan: { voice: "verse", instructions: "reflective, slightly philosophical, calm closing energy; gentle pace." },
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "POST" && url.pathname === "/api/council-ai") {
      await handleCouncilAI(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/esg-guide") {
      await handleESGGuide(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error("Server error:", error);
    sendJson(res, 500, {
      error: "Internal server error.",
      details: isDevelopment() ? String(error?.message || error) : undefined,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Council AI server listening on http://localhost:${PORT}`);
});

async function handleCouncilAI(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "Missing OPENAI_API_KEY on the server. Add it to gap.game/.env.local or the workspace-root .env.local.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const quest = body?.quest ?? {};
  const conversationHistory = Array.isArray(body?.conversationHistory)
    ? body.conversationHistory
    : [];
  const includeAudio = body?.includeAudio !== false;

  const openAiResponse = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: buildCouncilSystemPrompt(quest),
      input: mapConversationHistory(conversationHistory),
      max_output_tokens: 320,
      text: {
        format: {
          type: "text",
        },
      },
    }),
  });

  const rawResponse = await openAiResponse.text();
  const payload = tryParseJson(rawResponse);

  if (!openAiResponse.ok) {
    const apiMessage =
      payload?.error?.message ||
      payload?.error?.type ||
      rawResponse ||
      "Unknown OpenAI error.";

    sendJson(res, openAiResponse.status, {
      error: `OpenAI API error ${openAiResponse.status}: ${apiMessage}`,
    });
    return;
  }

  const text = extractResponseText(payload);
  if (!text) {
    sendJson(res, 502, {
      error: "OpenAI returned no text output for the council response.",
      details: isDevelopment() ? payload : undefined,
    });
    return;
  }

  const parsed = parseCouncilResponse(text);
  const audioPayload = includeAudio
    ? await synthesizeCouncilSpeech(apiKey, parsed).catch((error) => ({
        audioBase64: "",
        audioMime: "audio/mpeg",
        audioError: isDevelopment()
          ? `OpenAI speech error: ${String(error?.message || error)}`
          : "",
      }))
    : { audioBase64: "", audioMime: "audio/mpeg", audioError: "" };

  sendJson(res, 200, {
    text,
    audioBase64: audioPayload.audioBase64,
    audioMime: audioPayload.audioMime,
    audioError: audioPayload.audioError,
  });
}

async function handleESGGuide(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "Missing OPENAI_API_KEY on the server. Add it to gap.game/.env.local or the workspace-root .env.local.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const quest = body?.quest ?? {};
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  const openAiResponse = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: buildESGGuideInstructions(quest),
      input: mapConversationHistory(messages),
      max_output_tokens: 420,
      text: {
        format: {
          type: "text",
        },
      },
    }),
  });

  const rawResponse = await openAiResponse.text();
  const payload = tryParseJson(rawResponse);

  if (!openAiResponse.ok) {
    const apiMessage =
      payload?.error?.message ||
      payload?.error?.type ||
      rawResponse ||
      "Unknown OpenAI error.";

    sendJson(res, openAiResponse.status, {
      error: `OpenAI API error ${openAiResponse.status}: ${apiMessage}`,
    });
    return;
  }

  const text = extractResponseText(payload);
  if (!text) {
    sendJson(res, 502, {
      error: "OpenAI returned no text output for the ESG guide response.",
      details: isDevelopment() ? payload : undefined,
    });
    return;
  }

  sendJson(res, 200, { text });
}

function mapConversationHistory(conversationHistory) {
  return conversationHistory
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .map((item) => {
      const text = normalizeMessageContent(item.content);

      return {
        role: item.role,
        content: [
          {
            type: item.role === "assistant" ? "output_text" : "input_text",
            text,
          },
        ],
      };
    });
}

function normalizeMessageContent(content) {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractResponseText(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const texts = [];
  for (const item of payload.output || []) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) continue;

    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        texts.push(part.text);
      }
    }
  }

  return texts.join("\n").trim();
}

async function synthesizeCouncilSpeech(apiKey, parsed) {
  const voiceConfig = COUNCIL_VOICES[parsed.npcId] || COUNCIL_VOICES.olive;
  const response = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice: voiceConfig.voice,
      input: parsed.text,
      instructions: voiceConfig.instructions,
      response_format: "mp3",
    }),
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    const errorText = audioBuffer.toString("utf8");
    const payload = tryParseJson(errorText);
    const message =
      payload?.error?.message ||
      payload?.error?.type ||
      errorText ||
      "Unknown OpenAI speech error.";
    throw new Error(message);
  }

  return {
    audioBase64: audioBuffer.toString("base64"),
    audioMime: response.headers.get("content-type") || "audio/mpeg",
    audioError: "",
  };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  const raw = Buffer.concat(chunks).toString("utf8");
  const data = tryParseJson(raw);
  if (data === null && raw.trim()) {
    throw new Error("Request body was not valid JSON.");
  }
  return data || {};
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  const distAvailable = await exists(distDir);
  if (!distAvailable) {
    sendJson(res, 404, {
      error: "Not found.",
      details: "Frontend assets are not built yet. Use `npm run dev` for development or `npm run build` before `npm run start`.",
    });
    return;
  }

  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const requestedFile = path.join(distDir, cleanPath.replace(/^\/+/, ""));
  const safeBase = `${distDir}${path.sep}`;
  const resolvedFile = path.resolve(requestedFile);

  if (!resolvedFile.startsWith(safeBase) && resolvedFile !== distDir) {
    sendJson(res, 403, { error: "Forbidden." });
    return;
  }

  const fileExists = await exists(resolvedFile);
  if (!fileExists && path.extname(resolvedFile)) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  const fileToServe = fileExists ? resolvedFile : path.join(distDir, "index.html");

  const content = await readFile(fileToServe);
  res.writeHead(200, { "Content-Type": contentTypeFor(fileToServe) });
  res.end(req.method === "HEAD" ? undefined : content);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".ico":
      return "image/x-icon";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    default:
      return "text/plain; charset=utf-8";
  }
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

function loadLocalEnv(filePath) {
  try {
    const raw = readFileSyncSafe(filePath);
    if (!raw) return;

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      const unquoted = value.replace(/^(['"])(.*)\1$/, "$2");

      if (!(key in process.env)) {
        process.env[key] = unquoted;
      }
    }
  } catch {
    // Missing local env files are expected in some environments.
  }
}

function readFileSyncSafe(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}
