import { NextResponse } from "next/server";
import { z } from "zod";
import { deviceRegisterSchema } from "@/lib/server/contracts";
import { attachDeviceToSession, getAuthContext, registerOrTouchDevice } from "@/lib/server/auth";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const body = deviceRegisterSchema.parse(await readJson<unknown>(request));
    const device = await registerOrTouchDevice({
      userId: auth.user.id,
      platform: body.platform,
      installationId: body.installationId,
      label: body.label,
      appVersion: body.appVersion,
      osVersion: body.osVersion,
    });
    await attachDeviceToSession(auth.session.id, device.id);

    return NextResponse.json({ device });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid device registration request.", 400);
    }
    return handleApiError(error);
  }
}
