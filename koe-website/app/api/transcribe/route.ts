import { NextResponse } from "next/server";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const DEFAULT_MODEL = "whisper-large-v3-turbo";
const MAX_AUDIO_BYTES = 6 * 1024 * 1024; // 6 MB
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 6;
const BLOCK_DURATION_MS = 10 * 60_000; // 10 minutes

export const runtime = "nodejs";

type ClientState = {
  count: number;
  resetAt: number;
  blockedUntil: number;
};

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
    return NextResponse.json(
      { error: "Origin not allowed." },
      { status: 403 },
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing GROQ_API_KEY." },
      { status: 500 },
    );
  }

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const language = form.get("language");

    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json(
        { error: "No audio file was uploaded." },
        { status: 400 },
      );
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio file too large. Keep uploads under 6 MB." },
        { status: 413 },
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", audio, "demo.webm");
    upstreamForm.append("model", process.env.GROQ_TRANSCRIBE_MODEL || DEFAULT_MODEL);
    if (typeof language === "string" && language !== "auto") {
      upstreamForm.append("language", language);
    }

    const upstream = await fetch(GROQ_TRANSCRIBE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
      cache: "no-store",
    });

    const payload = (await upstream.json().catch(() => ({}))) as {
      text?: string;
      error?: { message?: string };
    };

    if (!upstream.ok) {
      return NextResponse.json(
        { error: payload.error?.message || `Groq request failed (${upstream.status}).` },
        { status: upstream.status },
      );
    }

    return NextResponse.json({ text: (payload.text || "").trim() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed." },
      { status: 500 },
    );
  }
}
