import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthEmailToken, readAuthEmailToken } from "@/lib/server/auth-email-tokens";
import { sql } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const verifyEmailSchema = z.object({
  token: z.string().trim().min(20).max(200),
});

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, { scope: "auth:verify-email:ip", max: 20, windowMs: 60_000 });
    const body = verifyEmailSchema.parse(await readJson<unknown>(request));
    const token = await readAuthEmailToken(body.token, "email_verification");

    if (!token?.expiresAt || new Date(token.expiresAt).getTime() <= Date.now()) {
      return apiError("INVALID_CREDENTIALS", "The token is invalid or expired.", 400);
    }

    let verifiedUserId = token.userId;
    if (!token.usedAt) {
      try {
        verifiedUserId = (await consumeAuthEmailToken(body.token, "email_verification")).userId;
      } catch (error) {
        const latest = await readAuthEmailToken(body.token, "email_verification");
        if (!latest?.usedAt || !latest.expiresAt || new Date(latest.expiresAt).getTime() <= Date.now()) {
          throw error;
        }
        verifiedUserId = latest.userId;
      }
    }

    await sql()`
      UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
      WHERE id = ${verifiedUserId}
    `;

    return NextResponse.json({ ok: true, verified: true, alreadyVerified: Boolean(token.usedAt) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid verification request.", 400);
    }
    return handleApiError(error);
  }
}
