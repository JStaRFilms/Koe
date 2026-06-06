import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors";

const PAYSTACK_API = "https://api.paystack.co";

export type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackTransactionData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  customer?: { email?: string; customer_code?: string };
  plan?: string | { plan_code?: string };
  subscription?: string | { subscription_code?: string; email_token?: string };
  metadata?: unknown;
};

function secretKey() {
  const key = (process.env.PAYSTACK_SECRET_KEY || "").trim();
  if (!key) {
    throw new ApiError("SERVER_MISCONFIGURED", "Paystack is not configured.", 500);
  }
  return key;
}

async function paystackRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!response.ok || !payload.status || !payload.data) {
    throw new ApiError("UPSTREAM_ERROR", payload.message || "Paystack request failed.", 502, true);
  }
  return payload.data;
}

export function createPaystackReference(planCode: string) {
  return `koe-${planCode}-${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function initializePaystackTransaction(args: {
  email: string;
  amountKobo: number;
  planCode: string;
  paystackPlanCode: string;
  callbackUrl: string;
  reference: string;
  metadata: Record<string, unknown>;
}) {
  return paystackRequest<PaystackInitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: args.email,
      amount: String(args.amountKobo),
      currency: "NGN",
      plan: args.paystackPlanCode,
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: JSON.stringify(args.metadata),
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  const encoded = encodeURIComponent(reference);
  return paystackRequest<PaystackTransactionData>(`/transaction/verify/${encoded}`, { method: "GET" });
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = (process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "").trim();
  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
