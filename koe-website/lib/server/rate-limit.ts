import { createHash } from "node:crypto";
import { sql } from "./db";
import { ApiError } from "./errors";

const DEFAULT_WINDOW_MS = 60_000;

type RateLimitOptions = {
  scope: string;
  key?: string | null;
  max: number;
  windowMs?: number;
};

function readClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function assertRateLimit(request: Request, options: RateLimitOptions) {
  const windowMs = Math.max(1_000, options.windowMs || DEFAULT_WINDOW_MS);
  const rawKey = options.key?.trim() || readClientIp(request);
  const keyHash = hashKey(rawKey);
  const resetAt = new Date(Date.now() + windowMs).toISOString();
  const db = sql();

  const rows = await db`
    INSERT INTO rate_limits (scope, key_hash, count, reset_at)
    VALUES (${options.scope}, ${keyHash}, 1, ${resetAt})
    ON CONFLICT (scope, key_hash)
    DO UPDATE SET
      count = CASE
        WHEN rate_limits.reset_at <= now() THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at
        ELSE rate_limits.reset_at
      END,
      updated_at = now()
    RETURNING count, reset_at
  `;

  const count = Number(rows[0]?.count || 0);
  if (count > options.max) {
    throw new ApiError(
      "RATE_LIMITED",
      "Too many requests. Please wait and try again.",
      429,
      true,
    );
  }
}

export async function pruneExpiredRateLimits() {
  await sql()`
    DELETE FROM rate_limits
    WHERE reset_at < now() - interval '1 day'
  `;
}
