import { NextResponse } from "next/server";
import { z } from "zod";
import { authWithDeviceSchema } from "@/lib/server/contracts";
import { normalizeEmail, one, sql } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { attachDeviceToSession, createSession, registerOrTouchDevice, toAuthResponse, verifyPassword } from "@/lib/server/auth";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = authWithDeviceSchema.omit({ displayName: true }).parse(await readJson<unknown>(request));
    const email = normalizeEmail(body.email);
    await assertRateLimit(request, { scope: "auth:signin:ip", max: 20, windowMs: 60_000 });
    await assertRateLimit(request, { scope: "auth:signin:email", key: email, max: 8, windowMs: 10 * 60_000 });

    const db = sql();
    const user = one<{
      id: string;
      email: string;
      password_hash: string;
      display_name: string | null;
      default_account_mode: "byok" | "managed";
      disabled_at: string | null;
    }>(
      await db`
        SELECT id, email, password_hash, display_name, default_account_mode, disabled_at
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `,
    );

    if (!user || user.disabled_at || !(await verifyPassword(body.password, user.password_hash))) {
      return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    let device = null;
    if (body.platform) {
      device = await registerOrTouchDevice({
        userId: user.id,
        platform: body.platform,
        installationId: body.installationId,
        label: body.deviceLabel,
        appVersion: body.appVersion,
        osVersion: body.osVersion,
      });
    }

    const session = await createSession({ userId: user.id, request, deviceId: device?.id || null });
    if (device) {
      await attachDeviceToSession(session.session.id, device.id);
    }

    return NextResponse.json(toAuthResponse({ user, token: session.token, expiresAt: session.expiresAt, device }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid signin request.", 400);
    }
    return handleApiError(error);
  }
}
