import { NextResponse } from "next/server";
import { getAuthContext, revokeSession } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    await revokeSession(auth.session.tokenHash);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
