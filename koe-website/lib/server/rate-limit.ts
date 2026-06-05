import { createHash } from "node:crypto";
import { ApiError } from "./errors";

const DEFAULT_WINDOW_MS = 60_000;

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  scope: string;
  key?: string | null;
  max: number;
  windowMs?: number;
};

const buckets = new Map<string, Bucket>();

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

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function assertRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  cleanup(now);

  const windowMs = Math.max(1_000, options.windowMs || DEFAULT_WINDOW_MS);
  const rawKey = options.key?.trim() || readClientIp(request);
  const bucketKey = `${options.scope}:${hashKey(rawKey)}`;
  const bucket = buckets.get(bucketKey) || { count: 0, resetAt: now + windowMs };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(bucketKey, bucket);

  if (bucket.count > options.max) {
    throw new ApiError(
      "RATE_LIMITED",
      "Too many requests. Please wait and try again.",
      429,
      true,
    );
  }
}
