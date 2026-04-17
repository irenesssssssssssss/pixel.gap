import { buildCouncilSystemPrompt, parseCouncilResponse } from "../src/engine/councilAI.js";
import { createTextResponse, mapConversationHistory, synthesizeSpeech } from "./_lib/openai.js";
import { readJsonBody, sendJson } from "./_lib/http.js";

const COUNCIL_VOICES = {
  olive: {
    voice: "sage",
    instructions:
      "warm, wise, reassuring, lightly playful moderator energy; calm pace; gentle authority; natural and conversational.",
  },
  frank: {
    voice: "marin",
    instructions:
      "grounded, practical, mildly dry, operationally savvy; steady delivery with a hint of skeptical humor.",
  },
  otis: {
    voice: "cedar",
    instructions:
      "empathetic, perceptive, warm, human, emotionally intelligent; reassuring but not vague.",
  },
  suzy: {
    voice: "alloy",
    instructions:
      "clear-headed, principled, sharp, knowledgeable, slightly sassy; precise delivery with calm bite, never cruel.",
  },
  hazel: {
    voice: "ash",
    instructions:
      "thoughtful, exacting, systems-minded, incisive; calm confidence with analytical edge.",
  },
  daisy: {
    voice: "coral",
    instructions:
      "curious, bright, socially intuitive, playful, connective; lively but still grounded.",
  },
  rowan: {
    voice: "verse",
    instructions: "reflective, poetic, gently mischievous, calm closing energy; thoughtful pace.",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(req);
    const quest = body?.quest ?? {};
    const conversationHistory = Array.isArray(body?.conversationHistory)
      ? body.conversationHistory
      : [];
    const includeAudio = body?.includeAudio !== false;

    const text = await createTextResponse({
      instructions: buildCouncilSystemPrompt(quest),
      input: mapConversationHistory(conversationHistory),
      maxOutputTokens: 320,
    });

    const parsed = parseCouncilResponse(text);
    const audioPayload = includeAudio
      ? await speakAsCouncilMember(parsed).catch((error) => ({
          audioBase64: "",
          audioMime: "audio/wav",
          audioError: error.message || "Audio generation failed.",
        }))
      : { audioBase64: "", audioMime: "audio/wav", audioError: "" };

    return sendJson(res, 200, {
      text,
      audioBase64: audioPayload.audioBase64,
      audioMime: audioPayload.audioMime,
      audioError: audioPayload.audioError || "",
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Council AI request failed.",
    });
  }
}

async function speakAsCouncilMember(parsed) {
  const voiceConfig = COUNCIL_VOICES[parsed.npcId] || COUNCIL_VOICES.olive;

  const audio = await synthesizeSpeech(parsed.text, {
    voice: voiceConfig.voice,
    instructions: buildNaturalSpeechInstructions(voiceConfig.instructions),
  });

  return {
    ...audio,
    audioError: "",
  };
}

function buildNaturalSpeechInstructions(characterInstructions) {
  return [
    "sound like a real person speaking naturally, not a polished ai assistant or announcer",
    "use subtle conversational pacing with tiny pauses where they feel natural",
    "speak slightly faster than average natural conversation, but never rushed",
    "keep the performance grounded and believable",
    "avoid exaggerated theatrical acting, sales tone, or overly perfect cadence",
    "light natural variation in emphasis is good; keep it smooth and human",
    characterInstructions,
  ].join("; ");
}
