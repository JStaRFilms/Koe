import { NextResponse } from "next/server";
import { z } from "zod";
import { authWithDeviceSchema } from "@/lib/server/contracts";
import { normalizeEmail, one, sql } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { attachDeviceToSession, createSession, hashPassword, registerOrTouchDevice, toAuthResponse } from "@/lib/server/auth";
import { ensureDefaultManagedAllocation } from "@/lib/server/usage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = authWithDeviceSchema.parse(await readJson<unknown>(request));
    const email = normalizeEmail(body.email);
    const passwordHash = await hashPassword(body.password);
    const db = sql();

    const existing = one(await db`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
    if (existing) {
      return apiError("EMAIL_ALREADY_EXISTS", "An account already exists for this email.", 409);
    }

    const user = one<{
      id: string;
      email: string;
      display_name: string | null;
      default_account_mode: "byok" | "managed";
      disabled_at: string | null;
    }>(
      await db`
        INSERT INTO users (email, password_hash, password_algo, display_name)
        VALUES (${email}, ${passwordHash}, 'bcryptjs', ${body.displayName || null})
        RETURNING id, email, display_name, default_account_mode, disabled_at
      `,
    );

    if (!user) {
      return apiError("INTERNAL_ERROR", "Could not create account.", 500);
    }

    await db`
      INSERT INTO user_settings (user_id)
      VALUES (${user.id})
      ON CONFLICT (user_id) DO NOTHING
    `;
    await ensureDefaultManagedAllocation(user.id);

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

    return NextResponse.json(toAuthResponse({ user, token: session.token, expiresAt: session.expiresAt, device }), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid signup request.", 400);
    }
    return handleApiError(error);
  }
}
