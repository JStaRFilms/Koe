import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthEmailToken, revokeUserSessions } from "@/lib/server/auth-email-tokens";
import { hashPassword } from "@/lib/server/auth";
import { passwordSchema } from "@/lib/server/contracts";
import { sql } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, { scope: "auth:reset-password:ip", max: 20, windowMs: 60_000 });
    const body = resetPasswordSchema.parse(await readJson<unknown>(request));
    const consumed = await consumeAuthEmailToken(body.token, "password_reset");
    const passwordHash = await hashPassword(body.password);

    await sql()`
      UPDATE users
      SET password_hash = ${passwordHash}, password_algo = 'bcryptjs', updated_at = now()
      WHERE id = ${consumed.userId}
    `;
    await revokeUserSessions(consumed.userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid password reset request.", 400);
    }
    return handleApiError(error);
  }
}
