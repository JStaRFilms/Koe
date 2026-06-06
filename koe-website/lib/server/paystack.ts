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

export type PaystackPlanData = {
  id: number;
  name: string;
  amount: number;
  interval: string;
  currency: string;
  plan_code: string;
  description?: string | null;
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

export async function listPaystackPlans() {
  return paystackRequest<PaystackPlanData[]>("/plan?perPage=100", { method: "GET" });
}

export async function createPaystackPlan(args: {
  name: string;
  amountKobo: number;
  description: string;
}) {
  return paystackRequest<PaystackPlanData>("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: args.name,
      amount: args.amountKobo,
      interval: "monthly",
      currency: "NGN",
      description: args.description,
      send_invoices: true,
      send_sms: false,
    }),
  });
}

export async function updatePaystackPlan(planCode: string, args: {
  name: string;
  amountKobo: number;
  description: string;
}) {
  return paystackRequest<PaystackPlanData>(`/plan/${encodeURIComponent(planCode)}`, {
    method: "PUT",
    body: JSON.stringify({
      name: args.name,
      amount: args.amountKobo,
      interval: "monthly",
      currency: "NGN",
      description: args.description,
      send_invoices: true,
      send_sms: false,
    }),
  });
}

export async function disablePaystackSubscription(code: string, token: string) {
  const response = await fetch(`${PAYSTACK_API}/subscription/disable`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, token }),
  });
  const payload = (await response.json().catch(() => ({}))) as { status?: boolean; message?: string };
  if (!response.ok || !payload.status) {
    throw new ApiError("UPSTREAM_ERROR", payload.message || "Could not disable Paystack subscription.", 502, true);
  }
  return true;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = (process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "").trim();
  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
