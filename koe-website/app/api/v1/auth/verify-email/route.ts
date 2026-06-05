import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthEmailToken } from "@/lib/server/auth-email-tokens";
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
    const consumed = await consumeAuthEmailToken(body.token, "email_verification");

    await sql()`
      UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
      WHERE id = ${consumed.userId}
    `;

    return NextResponse.json({ ok: true, verified: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid verification request.", 400);
    }
    return handleApiError(error);
  }
}
