import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthEmailToken } from "@/lib/server/auth-email-tokens";
import { normalizeEmail, one, sql } from "@/lib/server/db";
import { sendPasswordResetEmail } from "@/lib/server/email";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email().max(320),
});

export async function POST(request: Request) {
  try {
    const body = requestPasswordResetSchema.parse(await readJson<unknown>(request));
    const email = normalizeEmail(body.email);
    await assertRateLimit(request, { scope: "auth:password-reset:ip", max: 20, windowMs: 60_000 });
    await assertRateLimit(request, { scope: "auth:password-reset:email", key: email, max: 5, windowMs: 60 * 60_000 });

    const user = one<{ id: string; email: string; disabled_at: string | null }>(
      await sql()`
        SELECT id, email, disabled_at
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `,
    );

    if (user && !user.disabled_at) {
      const token = await createAuthEmailToken(user.id, "password_reset");
      await sendPasswordResetEmail({ email: user.email, token: token.token });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid password reset request.", 400);
    }
    return handleApiError(error);
  }
}
