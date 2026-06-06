import { NextResponse } from "next/server";
import { z } from "zod";
import { refineRequestSchema } from "@/lib/server/contracts";
import { resolveAccountMode, resolveProviderApiKey } from "@/lib/server/account-mode";
import { getAuthContext } from "@/lib/server/auth";
import { ApiError, apiError, handleApiError, readJson } from "@/lib/server/errors";
import { refineWithGroq } from "@/lib/server/provider/groq";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { recordTranscriptHistory, recordUsage } from "@/lib/server/usage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    await assertRateLimit(request, { scope: "process-refine:ip", max: 80, windowMs: 60_000 });
    await assertRateLimit(request, { scope: "process-refine:user", key: auth.user.id, max: 60, windowMs: 60_000 });

    const body = refineRequestSchema.parse(await readJson<unknown>(request));
    const resolvedMode = await resolveAccountMode({
      userId: auth.user.id,
      defaultMode: auth.user.defaultMode,
      requestedMode: body.mode,
      devicePlatform: auth.device?.platform,
    });
    const apiKey = await resolveProviderApiKey(auth.user.id, resolvedMode);

    try {
      const refinedText = await refineWithGroq({
        apiKey,
        rawText: body.rawText,
        promptStyle: body.promptStyle,
        customPrompt: body.customPrompt,
        model: body.model,
      });

      await recordTranscriptHistory({
        userId: auth.user.id,
        deviceId: auth.device?.id,
        requestId: body.requestId,
        clientSessionId: body.clientSessionId,
        resolvedMode,
        model: body.model,
        rawText: body.rawText,
        refinedText,
      });

      await recordUsage({
        userId: auth.user.id,
        deviceId: auth.device?.id,
        requestId: body.requestId,
        resolvedMode,
        action: "refinement",
        model: body.model,
        inputChars: body.rawText.length,
        outputChars: refinedText.length,
        status: "success",
      });

      return NextResponse.json({
        requestId: body.requestId,
        mode: resolvedMode.mode,
        refinedText,
        usage: { inputChars: body.rawText.length, outputChars: refinedText.length },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        await recordUsage({
          userId: auth.user.id,
          deviceId: auth.device?.id,
          requestId: body.requestId,
          resolvedMode,
          action: "refinement",
          model: body.model,
          status: "error",
          errorCode: error.code,
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid refinement request.", 400);
    }
    return handleApiError(error);
  }
}
