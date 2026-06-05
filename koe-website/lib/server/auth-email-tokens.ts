import { createHash, randomBytes } from "node:crypto";
import { one, sql, toIso } from "./db";
import { ApiError } from "./errors";

export type AuthEmailTokenType = "email_verification" | "password_reset";

const TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_MINUTES = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiryFor(type: AuthEmailTokenType) {
  const expires = new Date();
  if (type === "password_reset") {
    expires.setMinutes(expires.getMinutes() + PASSWORD_RESET_MINUTES);
  } else {
    expires.setHours(expires.getHours() + EMAIL_VERIFICATION_HOURS);
  }
  return expires;
}

export async function createAuthEmailToken(userId: string, type: AuthEmailTokenType) {
  const token = `${type === "password_reset" ? "krst" : "kver"}_${randomBytes(TOKEN_BYTES).toString("base64url")}`;
  const tokenHash = hashToken(token);
  const expires = expiryFor(type);

  await sql()`
    INSERT INTO auth_email_tokens (user_id, token_hash, type, expires_at)
    VALUES (${userId}, ${tokenHash}, ${type}, ${expires.toISOString()})
  `;

  return { token, expiresAt: expires.toISOString() };
}

export async function consumeAuthEmailToken(token: string, type: AuthEmailTokenType) {
  const tokenHash = hashToken(token.trim());
  const row = one<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
    await sql()`
      UPDATE auth_email_tokens
      SET used_at = now()
      WHERE token_hash = ${tokenHash}
        AND type = ${type}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING id, user_id, expires_at, used_at
    `,
  );

  if (!row) {
    throw new ApiError("INVALID_CREDENTIALS", "The token is invalid or expired.", 400);
  }

  return { userId: row.user_id, expiresAt: toIso(row.expires_at) };
}

export async function revokeUserSessions(userId: string) {
  await sql()`
    UPDATE auth_sessions
    SET revoked_at = now()
    WHERE user_id = ${userId} AND revoked_at IS NULL
  `;
}
