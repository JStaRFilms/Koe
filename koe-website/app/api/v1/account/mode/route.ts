import { NextResponse } from "next/server";
import { z } from "zod";
import { modePatchSchema } from "@/lib/server/contracts";
import { resolveAccountMode } from "@/lib/server/account-mode";
import { getAuthContext } from "@/lib/server/auth";
import { one, sql } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const body = modePatchSchema.parse(await readJson<unknown>(request));
    const resolved = await resolveAccountMode({
      userId: auth.user.id,
      defaultMode: auth.user.defaultMode,
      requestedMode: body.defaultMode,
      devicePlatform: auth.device?.platform,
    });

    const row = one<{ default_account_mode: "byok" | "managed" }>(
      await sql()`
        UPDATE users
        SET default_account_mode = ${body.defaultMode}, updated_at = now()
        WHERE id = ${auth.user.id}
        RETURNING default_account_mode
      `,
    );

    return NextResponse.json({
      defaultMode: row?.default_account_mode || body.defaultMode,
      resolvedMode: { mode: resolved.mode, available: true, reason: resolved.reason },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid account mode request.", 400);
    }
    return handleApiError(error);
  }
}
