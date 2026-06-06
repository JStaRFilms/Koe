import { one, sql } from "./db";

type ActiveManagedUsersRow = {
  active_count: number;
  current_user_active: boolean;
};

type DailyUsageRow = {
  audio_seconds_used: string | number;
  request_count_used: number;
};

const DEFAULT_PROVIDER_DAILY_AUDIO_SECONDS = 28_800;
const DEFAULT_POOL_SAFETY_RATIO = 0.7;
const DEFAULT_GUARANTEED_FLOOR_SECONDS = 300;
const DEFAULT_BONUS_CEILING_SECONDS = 7_200;
const DEFAULT_MIN_REQUEST_LIMIT = 30;
const DEFAULT_MAX_REQUEST_LIMIT = 720;

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function isDynamicFreeAllocation(allocation: { source?: string | null; plan_code?: string | null } | null) {
  return allocation?.source === "default_free" || allocation?.plan_code === "free_daily";
}

export async function getManagedFreeQuota(userId: string) {
  const db = sql();
  const [activeRow, dailyUsage] = await Promise.all([
    one<ActiveManagedUsersRow>(await db`
      SELECT
        count(DISTINCT user_id)::int AS active_count,
        bool_or(user_id = ${userId}) AS current_user_active
      FROM usage_events
      WHERE mode = 'managed'
        AND status = 'success'
        AND created_at >= now() - interval '24 hours'
    `),
    one<DailyUsageRow>(await db`
      SELECT COALESCE(SUM(audio_seconds), 0) AS audio_seconds_used,
             COUNT(*)::int AS request_count_used
      FROM usage_events
      WHERE user_id = ${userId}
        AND mode = 'managed'
        AND status = 'success'
        AND created_at >= date_trunc('day', now())
    `),
  ]);

  const providerDailyAudioSeconds = numberEnv("KOE_MANAGED_FREE_PROVIDER_DAILY_AUDIO_SECONDS", DEFAULT_PROVIDER_DAILY_AUDIO_SECONDS);
  const poolSafetyRatio = clamp(numberEnv("KOE_MANAGED_FREE_POOL_SAFETY_RATIO", DEFAULT_POOL_SAFETY_RATIO), 0.1, 1);
  const guaranteedFloorSeconds = numberEnv("KOE_MANAGED_FREE_GUARANTEED_SECONDS", DEFAULT_GUARANTEED_FLOOR_SECONDS);
  const bonusCeilingSeconds = numberEnv("KOE_MANAGED_FREE_BONUS_CEILING_SECONDS", DEFAULT_BONUS_CEILING_SECONDS);
  const activeManagedUsers24h = Math.max(1, Number(activeRow?.active_count || 0) + (activeRow?.current_user_active ? 0 : 1));
  const safeDailyPoolSeconds = Math.floor(providerDailyAudioSeconds * poolSafetyRatio);
  const rawDynamicLimit = Math.floor(safeDailyPoolSeconds / activeManagedUsers24h);
  const audioSecondsLimit = clamp(rawDynamicLimit, guaranteedFloorSeconds, bonusCeilingSeconds);
  const requestCountLimit = clamp(
    Math.ceil(audioSecondsLimit / 10),
    numberEnv("KOE_MANAGED_FREE_MIN_DAILY_REQUESTS", DEFAULT_MIN_REQUEST_LIMIT),
    numberEnv("KOE_MANAGED_FREE_MAX_DAILY_REQUESTS", DEFAULT_MAX_REQUEST_LIMIT),
  );

  return {
    audioSecondsUsed: Number(dailyUsage?.audio_seconds_used || 0),
    audioSecondsLimit,
    requestCountUsed: Number(dailyUsage?.request_count_used || 0),
    requestCountLimit,
    quotaWindow: "daily" as const,
    guaranteedFloorSeconds,
    bonusCeilingSeconds,
    activeManagedUsers24h,
    safeDailyPoolSeconds,
    source: "dynamic_free" as const,
  };
}
