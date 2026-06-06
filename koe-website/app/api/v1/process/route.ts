import { NextResponse } from "next/server";
import { z } from "zod";
import { accountModeSchema, parseBooleanFormValue, promptStyleSchema, transcribeModelSchema } from "@/lib/server/contracts";
import { resolveAccountMode, resolveProviderApiKey } from "@/lib/server/account-mode";
import { deriveAudioSeconds } from "@/lib/server/audio-duration";
import { getAuthContext } from "@/lib/server/auth";
import { one, sql } from "@/lib/server/db";
import { ApiError, apiError, handleApiError } from "@/lib/server/errors";
import { refineWithGroq, transcribeWithGroq } from "@/lib/server/provider/groq";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { recordTranscriptHistory, recordUsage } from "@/lib/server/usage";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_JSON_AUDIO_BASE64_CHARS = Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 4;

const jsonProcessSchema = z.object({
  audioBase64: z.string().min(1),
  audioMimeType: z.string().trim().optional(),
  requestId: z.string().uuid(),
  clientSessionId: z.string().trim().optional().nullable(),
  mode: accountModeSchema.optional(),
  language: z.string().trim().optional(),
  model: transcribeModelSchema.optional(),
  promptStyle: promptStyleSchema.optional(),
  customPrompt: z.string().optional(),
  enhanceText: z.boolean().optional(),
  audioSeconds: z.number().optional(),
});

type ProcessInput = {
  audio: Blob;
  requestId: string;
  clientSessionId: string | null;
  requestedMode?: z.infer<typeof accountModeSchema>;
  language: string;
  model: z.infer<typeof transcribeModelSchema>;
  promptStyle: z.infer<typeof promptStyleSchema>;
  customPrompt: string;
  enhanceText: boolean;
  clientEstimatedAudioSeconds: number;
};

function wantsNdjson(request: Request) {
  return (request.headers.get("accept") || "").includes("application/x-ndjson");
}

function ndjsonResponse(messages: unknown[]) {
  return new Response(messages.map((message) => `${JSON.stringify(message)}\n`).join(""), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function parseProcessInput(request: Request): Promise<ProcessInput> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("application/json")) {
    const body = jsonProcessSchema.parse(await request.json());
    if (body.audioBase64.length > MAX_JSON_AUDIO_BASE64_CHARS) {
      throw new ApiError("AUDIO_TOO_LARGE", "Audio file too large. Keep uploads under 20 MB.", 413);
    }

    const audioBytes = Buffer.from(body.audioBase64, "base64");

    return {
      audio: new Blob([audioBytes], { type: body.audioMimeType || "audio/m4a" }),
      requestId: body.requestId,
      clientSessionId: body.clientSessionId?.trim() || null,
      requestedMode: body.mode,
      language: (body.language || "auto").trim().slice(0, 24) || "auto",
      model: body.model || "whisper-large-v3-turbo",
      promptStyle: body.promptStyle || "Clean",
      customPrompt: String(body.customPrompt || "").slice(0, 4000),
      enhanceText: body.enhanceText !== false,
      clientEstimatedAudioSeconds: Math.max(0, Number(body.audioSeconds || 0) || 0),
    };
  }

  const form = await request.formData();
  const audio = form.get("audio") || form.get("file");
  if (!(audio instanceof Blob)) {
    throw new ApiError("BAD_REQUEST", "No audio file was uploaded.", 400);
  }

  const requestedModeRaw = form.get("mode");
  return {
    audio,
    requestId: z.string().uuid().parse(String(form.get("requestId") || "")),
    clientSessionId: String(form.get("clientSessionId") || "").trim() || null,
    requestedMode: requestedModeRaw ? accountModeSchema.parse(String(requestedModeRaw)) : undefined,
    language: String(form.get("language") || "auto").trim().slice(0, 24) || "auto",
    model: transcribeModelSchema.parse(String(form.get("model") || "whisper-large-v3-turbo")),
    promptStyle: promptStyleSchema.parse(String(form.get("promptStyle") || "Clean")),
    customPrompt: String(form.get("customPrompt") || "").slice(0, 4000),
    enhanceText: parseBooleanFormValue(form.get("enhanceText"), true),
    clientEstimatedAudioSeconds: Math.max(0, Number(form.get("audioSeconds") || 0) || 0),
  };
}

export async function POST(request: Request) {
  const stream = wantsNdjson(request);

  try {
    const auth = await getAuthContext(request);
    await assertRateLimit(request, { scope: "process:ip", max: 60, windowMs: 60_000 });
    await assertRateLimit(request, { scope: "process:user", key: auth.user.id, max: 30, windowMs: 60_000 });

    const {
      audio,
      requestId,
      clientSessionId,
      requestedMode,
      language,
      model,
      promptStyle,
      customPrompt,
      enhanceText,
      clientEstimatedAudioSeconds,
    } = await parseProcessInput(request);

    if (audio.size === 0) {
      return apiError("BAD_REQUEST", "No audio file was uploaded.", 400);
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return apiError("AUDIO_TOO_LARGE", "Audio file too large. Keep uploads under 20 MB.", 413);
    }

    const serverAudioSeconds = await deriveAudioSeconds(audio);
    const billableAudioSeconds = serverAudioSeconds ?? clientEstimatedAudioSeconds;

    const existing = one<{
      id: string;
      mode: "byok" | "managed";
      raw_text: string;
      refined_text: string | null;
    }>(
      await sql()`
        SELECT id, mode, raw_text, refined_text
        FROM transcript_history
        WHERE user_id = ${auth.user.id} AND request_id = ${requestId}
        LIMIT 1
      `,
    );

    if (existing) {
      const payload = {
        requestId,
        historyId: existing.id,
        mode: existing.mode,
        rawText: existing.raw_text,
        refinedText: existing.refined_text || existing.raw_text,
        empty: !existing.raw_text,
        usage: { audioSecondsUsedThisRequest: 0 },
      };
      return stream ? ndjsonResponse([{ type: "complete", ...payload }]) : NextResponse.json(payload);
    }

    const resolvedMode = await resolveAccountMode({
      userId: auth.user.id,
      defaultMode: auth.user.defaultMode,
      requestedMode,
      devicePlatform: auth.device?.platform,
      estimatedAudioSeconds: billableAudioSeconds,
    });

    if (resolvedMode.mode === "managed" && !billableAudioSeconds) {
      throw new ApiError(
        "BAD_REQUEST",
        "Could not determine audio duration for managed processing.",
        400,
      );
    }

    const apiKey = await resolveProviderApiKey(auth.user.id, resolvedMode);

    try {
      const rawText = await transcribeWithGroq({ apiKey, audio, language, model });
      const empty = !rawText || rawText.toLowerCase().includes("thanks for watching");
      const refinedText = !empty && enhanceText
        ? await refineWithGroq({ apiKey, rawText, promptStyle, customPrompt })
        : rawText;

      const historyId = await recordTranscriptHistory({
        userId: auth.user.id,
        deviceId: auth.device?.id,
        requestId,
        clientSessionId,
        resolvedMode,
        model,
        rawText,
        refinedText,
        audioSeconds: billableAudioSeconds,
      });

      await recordUsage({
        userId: auth.user.id,
        deviceId: auth.device?.id,
        requestId,
        resolvedMode,
        action: "process",
        model,
        audioSeconds: billableAudioSeconds,
        inputChars: rawText.length,
        outputChars: refinedText.length,
        status: "success",
      });

      const payload = {
        requestId,
        historyId: historyId || null,
        mode: resolvedMode.mode,
        rawText,
        refinedText: refinedText || rawText,
        empty,
        usage: { audioSecondsUsedThisRequest: billableAudioSeconds },
      };

      if (stream) {
        const messages = [
          { type: "status", stage: "transcribing", label: "Transcribing", progress: 58 },
          ...(enhanceText && !empty
            ? [{ type: "status", stage: "refining", label: "Refining", progress: 86 }]
            : []),
          { type: "complete", ...payload },
        ];
        return ndjsonResponse(messages);
      }

      return NextResponse.json(payload);
    } catch (error) {
      if (error instanceof ApiError) {
        await recordUsage({
          userId: auth.user.id,
          deviceId: auth.device?.id,
          requestId,
          resolvedMode,
          action: "process",
          model,
          audioSeconds: billableAudioSeconds,
          status: "error",
          errorCode: error.code,
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid processing request.", 400);
    }
    return stream && error instanceof ApiError
      ? ndjsonResponse([{ type: "error", error: { code: error.code, message: error.message, retryable: error.retryable } }])
      : handleApiError(error);
  }
}
