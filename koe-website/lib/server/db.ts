import { neon } from "@neondatabase/serverless";
import { ApiError } from "./errors";

type PgRow = Record<string, unknown>;
type SqlQuery = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<PgRow[]>;

let cachedSql: SqlQuery | null = null;

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
}

export function sql() {
  if (cachedSql) {
    return cachedSql;
  }

  const url = databaseUrl().trim();
  if (!url) {
    throw new ApiError("SERVER_MISCONFIGURED", "Database is not configured.", 500);
  }

  cachedSql = neon(url) as unknown as SqlQuery;
  return cachedSql;
}

export function one<T extends PgRow>(rows: PgRow[]) {
  return (rows[0] || null) as T | null;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toIso(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  return null;
}
