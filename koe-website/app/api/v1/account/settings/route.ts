import { NextResponse } from "next/server";
import { z } from "zod";
import { settingsPatchSchema } from "@/lib/server/contracts";
import { getAuthContext } from "@/lib/server/auth";
import { one, sql, toIso } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const body = settingsPatchSchema.parse(await readJson<unknown>(request));
    const current = one<{
      language: string;
      prompt_style: string;
      custom_prompt: string;
      enhance_text: boolean;
      model: string;
      updated_at: string;
    }>(
      await sql()`
        INSERT INTO user_settings (user_id)
        VALUES (${auth.user.id})
        ON CONFLICT (user_id) DO UPDATE SET
          language = COALESCE(${body.language ?? null}, user_settings.language),
          prompt_style = COALESCE(${body.promptStyle ?? null}, user_settings.prompt_style),
          custom_prompt = COALESCE(${body.customPrompt ?? null}, user_settings.custom_prompt),
          enhance_text = COALESCE(${body.enhanceText ?? null}, user_settings.enhance_text),
          model = COALESCE(${body.model ?? null}, user_settings.model),
          updated_at = now()
        RETURNING language, prompt_style, custom_prompt, enhance_text, model, updated_at
      `,
    );

    return NextResponse.json({
      settings: {
        language: current?.language || "auto",
        promptStyle: current?.prompt_style || "Clean",
        customPrompt: current?.custom_prompt || "",
        enhanceText: current?.enhance_text ?? true,
        model: current?.model || "whisper-large-v3-turbo",
        updatedAt: toIso(current?.updated_at),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid settings request.", 400);
    }
    return handleApiError(error);
  }
}
