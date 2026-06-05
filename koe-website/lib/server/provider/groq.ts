import { buildSystemPrompt, ENHANCE_MODEL, sanitizeRefinedText } from "@/lib/refinement";
import { ApiError } from "../errors";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function validateGroqApiKey(apiKey: string) {
  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError("INVALID_CREDENTIALS", "Groq API key could not be validated.", 400);
  }
}

export async function transcribeWithGroq(args: {
  apiKey: string;
  audio: Blob;
  language: string;
  model: string;
}) {
  const upstreamForm = new FormData();
  upstreamForm.append("file", args.audio, "audio.wav");
  upstreamForm.append("model", args.model);

  if (args.language && args.language !== "auto") {
    upstreamForm.append("language", args.language);
  }

  const upstream = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.apiKey}` },
    body: upstreamForm,
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => ({}))) as {
    text?: string;
    error?: { message?: string };
  };

  if (!upstream.ok) {
    throw new ApiError("UPSTREAM_ERROR", "Transcription provider request failed.", 502, true);
  }

  return (payload.text || "").trim();
}

export async function refineWithGroq(args: {
  apiKey: string;
  rawText: string;
  promptStyle: string;
  customPrompt: string;
  model?: string;
}) {
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model || ENHANCE_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(args.promptStyle, args.customPrompt) },
        {
          role: "user",
          content: `Refine only the text inside <transcript> tags.\n<transcript>\n${args.rawText}\n</transcript>`,
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 1024,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError("UPSTREAM_ERROR", "Refinement provider request failed.", 502, true);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return sanitizeRefinedText(payload.choices?.[0]?.message?.content || args.rawText);
}
