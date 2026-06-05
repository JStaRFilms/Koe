import { NextResponse } from "next/server";
import { createAuthEmailToken } from "@/lib/server/auth-email-tokens";
import { getAuthContext } from "@/lib/server/auth";
import { sendVerificationEmail } from "@/lib/server/email";
import { handleApiError } from "@/lib/server/errors";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    await assertRateLimit(request, { scope: "auth:verify-email:user", key: auth.user.id, max: 5, windowMs: 60 * 60_000 });

    const token = await createAuthEmailToken(auth.user.id, "email_verification");
    const delivery = await sendVerificationEmail({ email: auth.user.email, token: token.token });

    return NextResponse.json({
      ok: true,
      email: auth.user.email,
      sent: delivery.sent,
      expiresAt: token.expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
