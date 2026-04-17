import { Buffer } from "node:buffer";
import process from "node:process";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_MODEL = "gpt-5.4-mini";
const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";

export async function createTextResponse({ instructions, input, maxOutputTokens }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in the server environment.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "text",
        },
      },
    }),
  });

  const rawText = await response.text();
  const payload = tryParseJson(rawText);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error?.type ||
      rawText ||
      `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("OpenAI returned no text output.");
  }

  return text;
}

export async function synthesizeSpeech(text, { voice, instructions }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in the server environment.");
  }

  const response = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice,
      input: text,
      instructions,
      response_format: "wav",
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
      `OpenAI speech request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    audioBase64: audioBuffer.toString("base64"),
    audioMime: response.headers.get("content-type") || "audio/wav",
  };
}

export function mapConversationHistory(conversationHistory) {
  return conversationHistory
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .map((item) => ({
      role: item.role,
      content: [
        {
          type: item.role === "assistant" ? "output_text" : "input_text",
          text: normalizeMessageContent(item.content),
        },
      ],
    }));
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

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
