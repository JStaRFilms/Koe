import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { activatePaidPlanFromTransaction } from "@/lib/server/billing-paystack-events";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { verifyPaystackTransaction } from "@/lib/server/paystack";

export const runtime = "nodejs";

const verifySchema = z.object({
  reference: z.string().trim().min(8).max(120),
});

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const body = verifySchema.parse(await readJson<unknown>(request));
    const transaction = await verifyPaystackTransaction(body.reference);
    const result = await activatePaidPlanFromTransaction(transaction, auth.user.id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid billing verification request.", 400);
    }
    return handleApiError(error);
  }
}
