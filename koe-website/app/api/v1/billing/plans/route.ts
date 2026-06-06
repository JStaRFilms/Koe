import { NextResponse } from "next/server";
import { listBillingPlans } from "@/lib/server/billing";
import { handleApiError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ plans: await listBillingPlans() });
  } catch (error) {
    return handleApiError(error);
  }
}
