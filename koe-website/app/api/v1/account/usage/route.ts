import { NextResponse } from "next/server";
import { getCapabilities } from "@/lib/server/account-mode";
import { getAuthContext } from "@/lib/server/auth";
import { one, sql } from "@/lib/server/db";
import { handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const capabilities = await getCapabilities(auth.user.id);
    const byok = one<{ audio_seconds_used: string | number; request_count_used: number }>(
      await sql()`
        SELECT COALESCE(SUM(audio_seconds), 0) AS audio_seconds_used,
               COUNT(*)::int AS request_count_used
        FROM usage_events
        WHERE user_id = ${auth.user.id}
          AND mode = 'byok'
          AND status = 'success'
          AND created_at >= date_trunc('month', now())
      `,
    );

    return NextResponse.json({
      managed: capabilities.managed.usage,
      byok: {
        audioSecondsUsed: Number(byok?.audio_seconds_used || 0),
        requestCountUsed: Number(byok?.request_count_used || 0),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
