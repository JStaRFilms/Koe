import { one, sql, toIso } from "./db";
import { ApiError } from "./errors";
import { AccountMode, Platform } from "./contracts";
import { decryptSecret } from "./crypto";
import { getManagedFreeQuota, isDynamicFreeAllocation } from "./managed-free-quota";

type CredentialRow = {
  id: string;
  provider: "groq";
  encrypted_secret: string; encryption_iv: string; encryption_tag: string;
  encryption_key_id: string; encryption_version: number;
  secret_last4: string | null;
  updated_at: string;
};

type AllocationRow = {
  id: string;
  status: "active" | "suspended" | "canceled";
  source: string;
  plan_code: string | null;
  period_start: string; period_end: string | null;
  monthly_audio_seconds: number; monthly_request_count: number;
};

type UsagePeriodRow = {
  audio_seconds_used: string | number;
  request_count_used: number;
};

export type ResolvedMode =
  | { mode: "byok"; provider: "groq"; credentialId: string; reason: "byok_credential_present" }
  | { mode: "managed"; provider: "groq"; allocationId: string; reason: "managed_allocation_active" };

export function currentPeriodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getActiveCredential(userId: string) {
  return one<CredentialRow>(
    await sql()`
      SELECT id, provider, encrypted_secret, encryption_iv, encryption_tag,
             encryption_key_id, encryption_version, secret_last4, updated_at
      FROM user_credentials
      WHERE user_id = ${userId} AND provider = 'groq' AND deleted_at IS NULL AND status = 'active'
      LIMIT 1
    `,
  );
}

export async function getActiveManagedAllocation(userId: string) {
  return one<AllocationRow>(
    await sql()`
      SELECT id, status, source, plan_code, period_start, period_end,
             monthly_audio_seconds, monthly_request_count
      FROM managed_allocations
      WHERE user_id = ${userId}
        AND status = 'active'
        AND (period_end IS NULL OR period_end > now())
      ORDER BY period_end NULLS LAST, created_at DESC
      LIMIT 1
    `,
  );
}

export async function getManagedUsage(allocationId: string, periodKey = currentPeriodKey()) {
  return one<UsagePeriodRow>(
    await sql()`
      SELECT audio_seconds_used, request_count_used
      FROM managed_usage_periods
      WHERE allocation_id = ${allocationId} AND period_key = ${periodKey}
      LIMIT 1
    `,
  );
}

function hasManagedProviderKey() {
  return Boolean((process.env.GROQ_MANAGED_API_KEY || "").trim());
}

export async function getCapabilities(userId: string) {
  const [credential, allocation] = await Promise.all([
    getActiveCredential(userId),
    getActiveManagedAllocation(userId),
  ]);

  const dynamicFree = isDynamicFreeAllocation(allocation) ? await getManagedFreeQuota(userId) : null;
  const usage = allocation && !dynamicFree ? await getManagedUsage(allocation.id) : null;
  const audioUsed = dynamicFree?.audioSecondsUsed ?? (usage ? Number(usage.audio_seconds_used || 0) : 0);
  const requestsUsed = dynamicFree?.requestCountUsed ?? (usage ? Number(usage.request_count_used || 0) : 0);
  const audioLimit = dynamicFree?.audioSecondsLimit ?? (allocation ? Number(allocation.monthly_audio_seconds || 0) : 0);
  const requestLimit = dynamicFree?.requestCountLimit ?? (allocation ? Number(allocation.monthly_request_count || 0) : 0);
  const providerAvailable = hasManagedProviderKey();
  const quotaSource = dynamicFree?.source || (allocation?.source === "paystack" ? "paid" : "allocation");
  const withinAudio = audioLimit > 0 && audioUsed < audioLimit;
  const withinRequests = requestLimit > 0 && requestsUsed < requestLimit;

  return {
    credential,
    allocation,
    byok: credential
      ? {
          available: true,
          provider: "groq" as const,
          last4: credential.secret_last4,
          updatedAt: toIso(credential.updated_at),
        }
      : { available: false, provider: "groq" as const, last4: null, updatedAt: null },
    managed: allocation
      ? {
          available: providerAvailable && withinAudio && withinRequests,
          status: allocation.status,
          source: allocation.source,
          planCode: allocation.plan_code,
          periodEndsAt: toIso(allocation.period_end),
          usage: {
            audioSecondsUsed: audioUsed, audioSecondsLimit: audioLimit,
            requestCountUsed: requestsUsed, requestCountLimit: requestLimit,
            quotaWindow: dynamicFree?.quotaWindow || "monthly",
            guaranteedFloorSeconds: dynamicFree?.guaranteedFloorSeconds,
            bonusCeilingSeconds: dynamicFree?.bonusCeilingSeconds,
            activeManagedUsers24h: dynamicFree?.activeManagedUsers24h,
            safeDailyPoolSeconds: dynamicFree?.safeDailyPoolSeconds,
            source: quotaSource,
          },
        }
      : {
          available: false,
          status: "unallocated",
          source: null,
          planCode: null,
          periodEndsAt: null,
          usage: { audioSecondsUsed: 0, audioSecondsLimit: 0, requestCountUsed: 0, requestCountLimit: 0, quotaWindow: "monthly", source: "allocation" },
        },
  };
}

export async function resolveAccountMode(args: {
  userId: string;
  defaultMode: AccountMode;
  requestedMode?: AccountMode;
  devicePlatform?: Platform;
  estimatedAudioSeconds?: number;
}) {
  const candidate = args.requestedMode || args.defaultMode;
  const capabilities = await getCapabilities(args.userId);

  if (candidate === "byok") {
    if (!capabilities.credential) {
      throw new ApiError("MISSING_BYOK_CREDENTIAL", "Save a Groq API key before using BYOK mode.", 409);
    }

    return {
      mode: "byok",
      provider: "groq",
      credentialId: capabilities.credential.id,
      reason: "byok_credential_present",
    } satisfies ResolvedMode;
  }

  if (!capabilities.allocation) {
    throw new ApiError("MODE_UNAVAILABLE", "Managed mode is not allocated for this account.", 409);
  }

  if (!hasManagedProviderKey()) {
    throw new ApiError("MODE_UNAVAILABLE", "Managed mode is not available right now.", 409, true);
  }

  const usage = capabilities.managed.usage;
  const estimated = Math.max(0, args.estimatedAudioSeconds || 0);
  if (usage.audioSecondsLimit <= 0 || usage.audioSecondsUsed + estimated > usage.audioSecondsLimit) {
    throw new ApiError("MANAGED_LIMIT_EXCEEDED", "Managed audio quota has been exceeded.", 402);
  }

  if (usage.requestCountLimit <= 0 || usage.requestCountUsed + 1 > usage.requestCountLimit) {
    throw new ApiError("MANAGED_LIMIT_EXCEEDED", "Managed request quota has been exceeded.", 402);
  }

  return {
    mode: "managed",
    provider: "groq",
    allocationId: capabilities.allocation.id,
    reason: "managed_allocation_active",
  } satisfies ResolvedMode;
}

export async function snapshotResolvedMode(userId: string, defaultMode: AccountMode) {
  try {
    const resolved = await resolveAccountMode({ userId, defaultMode });
    return { mode: resolved.mode, available: true, reason: resolved.reason };
  } catch (error) {
    if (error instanceof ApiError) {
      return { mode: defaultMode, available: false, reason: error.code };
    }
    throw error;
  }
}

export async function resolveProviderApiKey(userId: string, resolvedMode: ResolvedMode) {
  if (resolvedMode.mode === "managed") {
    const key = (process.env.GROQ_MANAGED_API_KEY || "").trim();
    if (!key) {
      throw new ApiError("MODE_UNAVAILABLE", "Managed mode is not available right now.", 409, true);
    }
    return key;
  }

  const credential = await getActiveCredential(userId);
  if (!credential || credential.id !== resolvedMode.credentialId) {
    throw new ApiError("MISSING_BYOK_CREDENTIAL", "Save a Groq API key before using BYOK mode.", 409);
  }

  try {
    return decryptSecret({
      userId,
      provider: credential.provider,
      encryptedSecret: credential.encrypted_secret,
      encryptionIv: credential.encryption_iv,
      encryptionTag: credential.encryption_tag,
      encryptionKeyId: credential.encryption_key_id,
      encryptionVersion: Number(credential.encryption_version),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error("[AccountMode] Saved BYOK credential could not be decrypted.", {
      userId,
      credentialId: credential.id,
      keyId: credential.encryption_key_id,
      error,
    });
    throw new ApiError(
      "MISSING_BYOK_CREDENTIAL",
      "Saved Groq key could not be decrypted. Delete and re-save your account Groq key, or switch to managed mode.",
      409,
    );
  }
}
