import { NextResponse } from "next/server";
import { z } from "zod";
import { deriveAudioSeconds } from "@/lib/server/audio-duration";
import { promptStyleSchema, transcribeModelSchema, parseBooleanFormValue } from "@/lib/server/contracts";
import { ApiError, apiError, handleApiError } from "@/lib/server/errors";
import { transcribeWithGroq, refineWithGroq } from "@/lib/server/provider/groq";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const MAX_DEMO_AUDIO_BYTES = 6 * 1024 * 1024;
const DEFAULT_MAX_DEMO_SECONDS = 30;

function publicDemoEnabled() {
  return process.env.KOE_PUBLIC_DEMO_ENABLED !== "false";
}

function getMaxDemoSeconds() {
  const configured = Number(process.env.KOE_PUBLIC_DEMO_MAX_AUDIO_SECONDS || DEFAULT_MAX_DEMO_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 90) : DEFAULT_MAX_DEMO_SECONDS;
}

function getManagedApiKey() {
  return (process.env.GROQ_MANAGED_API_KEY || "").trim();
}

export async function POST(request: Request) {
  try {
    if (!publicDemoEnabled()) {
      return apiError("MODE_UNAVAILABLE", "The public browser demo is not available right now.", 503, true);
    }

    const apiKey = getManagedApiKey();
    if (!apiKey) {
      return apiError("SERVER_MISCONFIGURED", "The public browser demo is not configured yet.", 503, true);
    }

    await assertRateLimit(request, { scope: "public-demo:ip:minute", max: 5, windowMs: 60_000 });
    await assertRateLimit(request, { scope: "public-demo:ip:day", max: 25, windowMs: 24 * 60 * 60_000 });

    const form = await request.formData();
    const audio = form.get("audio") || form.get("file");
    if (!(audio instanceof Blob)) {
      throw new ApiError("BAD_REQUEST", "No audio file was uploaded.", 400);
    }

    if (audio.size === 0) {
      return apiError("BAD_REQUEST", "No audio was captured.", 400);
    }

    if (audio.size > MAX_DEMO_AUDIO_BYTES) {
      return apiError("AUDIO_TOO_LARGE", "Demo audio is too large. Keep recordings short.", 413);
    }

    const serverAudioSeconds = await deriveAudioSeconds(audio);
    const clientEstimatedAudioSeconds = Math.max(0, Number(form.get("audioSeconds") || 0) || 0);
    const audioSeconds = serverAudioSeconds ?? clientEstimatedAudioSeconds;
    const maxDemoSeconds = getMaxDemoSeconds();

    if (!audioSeconds || audioSeconds > maxDemoSeconds) {
      return apiError(
        "AUDIO_TOO_LARGE",
        `The public demo is limited to ${maxDemoSeconds} seconds. Sign in or use the app for longer dictation.`,
        413,
      );
    }

    const language = String(form.get("language") || "auto").trim().slice(0, 24) || "auto";
    const model = transcribeModelSchema.parse(String(form.get("model") || "whisper-large-v3-turbo"));
    const promptStyle = promptStyleSchema.parse(String(form.get("promptStyle") || "Clean"));
    const customPrompt = String(form.get("customPrompt") || "").slice(0, 4000);
    const enhanceText = parseBooleanFormValue(form.get("enhanceText"), true);

    const rawText = await transcribeWithGroq({ apiKey, audio, language, model });
    const empty = !rawText || rawText.toLowerCase().includes("thanks for watching");
    const refinedText = !empty && enhanceText
      ? await refineWithGroq({ apiKey, rawText, promptStyle, customPrompt })
      : rawText;

    return NextResponse.json({
      mode: "managed_demo",
      rawText,
      refinedText: refinedText || rawText,
      empty,
      stored: false,
      usage: { audioSecondsUsedThisRequest: audioSeconds },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid demo request.", 400);
    }
    return handleApiError(error);
  }
}
