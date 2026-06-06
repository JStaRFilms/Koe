import { NextResponse } from "next/server";
import { reconcilePaystackPlans } from "@/lib/server/billing-plan-reconcile";
import { apiError, handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

function hasAdminToken(request: Request) {
  const configured = (process.env.KOE_ADMIN_DASHBOARD_TOKEN || "").trim();
  const supplied = request.headers.get("x-koe-admin-token") || "";
  return Boolean(configured) && supplied === configured;
}

export async function POST(request: Request) {
  try {
    if (!hasAdminToken(request)) {
      return apiError("FORBIDDEN", "Admin token is required.", 403);
    }

    const plans = await reconcilePaystackPlans();
    return NextResponse.json({ ok: true, plans });
  } catch (error) {
    return handleApiError(error);
  }
}
