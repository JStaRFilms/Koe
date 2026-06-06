import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { one, sql, toIso } from "./db";
import { ApiError } from "./errors";
import { Platform } from "./contracts";

const SESSION_DAYS = 30;
const BCRYPT_COST = 12;

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  default_account_mode: "byok" | "managed";
  email_verified_at?: string | null;
  disabled_at: string | null;
  created_at?: string;
  updated_at?: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
  device_id: string | null;
};

type DeviceRow = {
  id: string;
  platform: Platform;
  label: string | null;
};

export type AuthContext = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    defaultMode: "byok" | "managed";
    emailVerifiedAt: string | null;
  };
  session: {
    id: string;
    expiresAt: string;
    tokenHash: string;
  };
  device: {
    id: string;
    platform: Platform;
    label: string | null;
  } | null;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashOpaque(value: string) {
  return sha256(value);
}

export function hashOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? sha256(trimmed) : null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken() {
  return `kses_${randomBytes(32).toString("base64url")}`;
}

export function sessionExpiryDate() {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires;
}

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function readClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function readClientPlatform(request: Request): Platform | undefined {
  const raw = request.headers.get("x-koe-client") || undefined;
  const parsed = z.enum(["desktop", "ios", "android", "web"]).safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

function publicUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    defaultMode: row.default_account_mode,
    emailVerifiedAt: toIso(row.email_verified_at),
  };
}

export async function createSession(args: {
  userId: string;
  request: Request;
  deviceId?: string | null;
}) {
  const token = createSessionToken();
  const tokenHash = hashOpaque(token);
  const expires = sessionExpiryDate();
  const ipHash = hashOptional(readClientIp(args.request));
  const userAgent = args.request.headers.get("user-agent") || null;
  const db = sql();
  const row = one<SessionRow>(
    await db`
      INSERT INTO auth_sessions (user_id, token_hash, device_id, expires_at, user_agent, ip_hash)
      VALUES (${args.userId}, ${tokenHash}, ${args.deviceId || null}, ${expires.toISOString()}, ${userAgent}, ${ipHash})
      RETURNING id, user_id, expires_at, revoked_at, device_id
    `,
  );

  if (!row) {
    throw new ApiError("INTERNAL_ERROR", "Could not create session.", 500);
  }

  return { token, tokenHash, session: row, expiresAt: toIso(row.expires_at) || expires.toISOString() };
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const token = readBearerToken(request);
  if (!token) {
    throw new ApiError("INVALID_SESSION", "Missing session token.", 401);
  }

  const tokenHash = hashOpaque(token);
  const db = sql();
  const row = one<UserRow & SessionRow & { session_id: string; session_expires_at: string; session_device_id: string | null; device_platform: Platform | null; device_label: string | null }>(
    await db`
      SELECT
        users.id,
        users.email,
        users.display_name,
        users.default_account_mode,
        users.email_verified_at,
        users.disabled_at,
        auth_sessions.id AS session_id,
        auth_sessions.expires_at AS session_expires_at,
        auth_sessions.device_id AS session_device_id,
        user_devices.platform AS device_platform,
        user_devices.label AS device_label
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      LEFT JOIN user_devices ON user_devices.id = auth_sessions.device_id
      WHERE auth_sessions.token_hash = ${tokenHash}
        AND auth_sessions.revoked_at IS NULL
        AND auth_sessions.expires_at > now()
      LIMIT 1
    `,
  );

  if (!row || row.disabled_at) {
    throw new ApiError("INVALID_SESSION", "Session is invalid or expired.", 401);
  }

  await db`
    UPDATE auth_sessions
    SET last_seen_at = now()
    WHERE id = ${row.session_id}
  `;

  if (row.session_device_id) {
    await db`
      UPDATE user_devices
      SET last_seen_at = now()
      WHERE id = ${row.session_device_id} AND user_id = ${row.id}
    `;
  }

  return {
    user: publicUser(row),
    session: {
      id: row.session_id,
      expiresAt: toIso(row.session_expires_at) || String(row.session_expires_at),
      tokenHash,
    },
    device: row.session_device_id && row.device_platform
      ? { id: row.session_device_id, platform: row.device_platform, label: row.device_label }
      : null,
  };
}

export async function revokeSession(tokenHash: string) {
  await sql()`
    UPDATE auth_sessions
    SET revoked_at = now()
    WHERE token_hash = ${tokenHash} AND revoked_at IS NULL
  `;
}

export async function registerOrTouchDevice(args: {
  userId: string;
  platform: Platform;
  installationId?: string;
  label?: string;
  appVersion?: string;
  osVersion?: string;
}) {
  const db = sql();
  const installationHash = hashOptional(args.installationId);

  if (installationHash) {
    const existing = one<DeviceRow>(
      await db`
        SELECT id, platform, label
        FROM user_devices
        WHERE user_id = ${args.userId} AND installation_id_hash = ${installationHash}
        LIMIT 1
      `,
    );

    if (existing) {
      const updated = one<DeviceRow>(
        await db`
          UPDATE user_devices
          SET platform = ${args.platform},
              label = COALESCE(${args.label || null}, label),
              app_version = COALESCE(${args.appVersion || null}, app_version),
              os_version = COALESCE(${args.osVersion || null}, os_version),
              last_seen_at = now()
          WHERE id = ${existing.id} AND user_id = ${args.userId}
          RETURNING id, platform, label
        `,
      );
      return updated || existing;
    }
  }

  const inserted = one<DeviceRow>(
    await db`
      INSERT INTO user_devices (user_id, platform, label, installation_id_hash, app_version, os_version)
      VALUES (${args.userId}, ${args.platform}, ${args.label || null}, ${installationHash}, ${args.appVersion || null}, ${args.osVersion || null})
      RETURNING id, platform, label
    `,
  );

  if (!inserted) {
    throw new ApiError("INTERNAL_ERROR", "Could not register device.", 500);
  }

  return inserted;
}

export async function attachDeviceToSession(sessionId: string, deviceId: string) {
  await sql()`
    UPDATE auth_sessions
    SET device_id = ${deviceId}
    WHERE id = ${sessionId}
  `;
}

export function toAuthResponse(args: {
  user: UserRow;
  token: string;
  expiresAt: string;
  device?: DeviceRow | null;
}) {
  return {
    user: publicUser(args.user),
    session: { token: args.token, expiresAt: args.expiresAt },
    device: args.device ? { id: args.device.id, platform: args.device.platform, label: args.device.label } : null,
  };
}
