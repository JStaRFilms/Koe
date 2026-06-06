import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ApiError } from "./errors";

const ALGORITHM = "aes-256-gcm";
const VERSION = 1;

type KeyMap = Record<string, string>;

function loadKeyMap(): KeyMap {
  const raw = process.env.KOE_CREDENTIAL_ENCRYPTION_KEYS || "";
  if (!raw.trim()) {
    throw new ApiError("SERVER_MISCONFIGURED", "Credential encryption is not configured.", 500);
  }

  try {
    return JSON.parse(raw) as KeyMap;
  } catch {
    throw new ApiError("SERVER_MISCONFIGURED", "Credential encryption key map is invalid.", 500);
  }
}

function getKey(keyId: string) {
  const encoded = loadKeyMap()[keyId];
  if (!encoded) {
    throw new ApiError("SERVER_MISCONFIGURED", "Credential encryption key is missing.", 500);
  }

  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== 32) {
    throw new ApiError("SERVER_MISCONFIGURED", "Credential encryption key must be 32 bytes.", 500);
  }

  return key;
}

function activeKeyId() {
  const keyId = (process.env.KOE_CREDENTIAL_ENCRYPTION_ACTIVE_KEY_ID || "").trim();
  if (!keyId) {
    throw new ApiError("SERVER_MISCONFIGURED", "Active credential encryption key is not configured.", 500);
  }
  return keyId;
}

function aad(userId: string, provider: string, version = VERSION) {
  return Buffer.from(`${userId}:${provider}:${version}`, "utf8");
}

export function encryptSecret(args: { userId: string; provider: string; plaintext: string }) {
  const keyId = activeKeyId();
  const key = getKey(keyId);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(aad(args.userId, args.provider));

  const encrypted = Buffer.concat([cipher.update(args.plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedSecret: encrypted.toString("base64"),
    encryptionIv: iv.toString("base64"),
    encryptionTag: tag.toString("base64"),
    encryptionKeyId: keyId,
    encryptionVersion: VERSION,
  };
}

export function decryptSecret(args: {
  userId: string;
  provider: string;
  encryptedSecret: string;
  encryptionIv: string;
  encryptionTag: string;
  encryptionKeyId: string;
  encryptionVersion: number;
}) {
  if (args.encryptionVersion !== VERSION) {
    throw new ApiError("SERVER_MISCONFIGURED", "Unsupported credential encryption version.", 500);
  }

  const key = getKey(args.encryptionKeyId);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(args.encryptionIv, "base64"));
  decipher.setAAD(aad(args.userId, args.provider, args.encryptionVersion));
  decipher.setAuthTag(Buffer.from(args.encryptionTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(args.encryptedSecret, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function secretLast4(secret: string) {
  return secret.slice(-4);
}
