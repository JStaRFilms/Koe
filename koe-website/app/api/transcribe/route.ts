import { NextResponse } from "next/server";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const DEFAULT_MODEL = "whisper-large-v3-turbo";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
