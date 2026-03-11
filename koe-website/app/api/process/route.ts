import { buildSystemPrompt, ENHANCE_MODEL, sanitizeRefinedText } from "@/lib/refinement";
import { NextResponse } from "next/server";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_TRANSCRIBE_MODEL = "whisper-large-v3-turbo";
const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const BLOCK_DURATION_MS = 10 * 60_000;

export const runtime = "nodejs";

type ClientState = {
  count: number;
  resetAt: number;
  blockedUntil: number;
};

type StreamMessage =
  | { type: "status"; stage: string; label: string; progress: number }
  | { type: "empty"; label: string }
  | { type: "complete"; rawText: string; refinedText: string }
  | { type: "error"; error: string };

const clientBuckets = new Map<string, ClientState>();

function readClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(origin);
}

function readGroqApiKey(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const headerKey = request.headers.get("x-groq-api-key");
  if (headerKey) {
    return headerKey.trim();
  }

  return String(process.env.GROQ_API_KEY || "").trim();
}

function applyRateLimit(clientId: string) {
  const now = Date.now();
  const prev = clientBuckets.get(clientId);
  const bucket: ClientState = prev
    ? { ...prev }
    : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS, blockedUntil: 0 };

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;

  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    bucket.blockedUntil = now + BLOCK_DURATION_MS;
    clientBuckets.set(clientId, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      remaining: 0,
    };
  }

  clientBuckets.set(clientId, bucket);

  for (const [id, state] of clientBuckets) {
    if (state.blockedUntil <= now && state.resetAt + RATE_LIMIT_WINDOW_MS < now) {
      clientBuckets.delete(id);
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Processing failed.";
}

async function transcribeAudio(args: {
  apiKey: string;
  audio: Blob;
  language: string;
  model: string;
}) {
  const upstreamForm = new FormData();
  upstreamForm.append("file", args.audio, "audio.wav");
  upstreamForm.append("model", args.model || DEFAULT_TRANSCRIBE_MODEL);

  if (args.language && args.language !== "auto") {
    upstreamForm.append("language", args.language);
  }

  const upstream = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: upstreamForm,
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => ({}))) as {
    text?: string;
    error?: { message?: string };
  };

  if (!upstream.ok) {
    throw new Error(payload.error?.message || `Groq request failed (${upstream.status}).`);
  }

  return (payload.text || "").trim();
}

async function refineText(args: {
  apiKey: string;
  rawText: string;
  promptStyle: string;
  customPrompt: string;
}) {
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ENHANCE_MODEL,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(args.promptStyle, args.customPrompt),
        },
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
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };

    throw new Error(payload.error?.message || `Refinement failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return sanitizeRefinedText(payload.choices?.[0]?.message?.content || args.rawText);
}

export async function POST(request: Request) {
  const clientId = readClientIp(request);
  const rate = applyRateLimit(clientId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  const apiKey = readGroqApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Groq API key." }, { status: 400 });
  }

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const language = String(form.get("language") || "auto");
    const model = String(form.get("model") || DEFAULT_TRANSCRIBE_MODEL);
    const promptStyle = String(form.get("promptStyle") || "Clean");
    const customPrompt = String(form.get("customPrompt") || "");
    const enhanceText = String(form.get("enhanceText") || "true") !== "false";

    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "No audio file was uploaded." }, { status: 400 });
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio file too large. Keep uploads under 20 MB." },
        { status: 413 },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (message: StreamMessage) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n`));
        };

        try {
          send({
            type: "status",
            stage: "transcribing",
            label: "Transcribing",
            progress: 58,
          });

          const rawText = await transcribeAudio({
            apiKey,
            audio,
            language,
            model,
          });

          if (!rawText || rawText.toLowerCase().includes("thanks for watching")) {
            send({ type: "empty", label: "No speech detected" });
            return;
          }

          let refinedText = rawText;
          if (enhanceText) {
            send({
              type: "status",
              stage: "refining",
              label: "Refining",
              progress: 86,
            });

            refinedText = await refineText({
              apiKey,
              rawText,
              promptStyle,
              customPrompt,
            });
          }

          send({
            type: "complete",
            rawText,
            refinedText: refinedText || rawText,
          });
        } catch (error) {
          send({ type: "error", error: getErrorMessage(error) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
