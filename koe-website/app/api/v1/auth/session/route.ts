import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    return NextResponse.json({
      authenticated: true,
      user: auth.user,
      session: { expiresAt: auth.session.expiresAt },
      device: auth.device,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
