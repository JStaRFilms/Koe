import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "INVALID_SESSION"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "MISSING_BYOK_CREDENTIAL"
  | "MODE_UNAVAILABLE"
  | "MANAGED_LIMIT_EXCEEDED"
  | "AUDIO_TOO_LARGE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "SERVER_MISCONFIGURED"
  | "INTERNAL_ERROR";

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode;
    message: string;
    retryable?: boolean;
  };
};

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  retryable?: boolean;

  constructor(code: ApiErrorCode, message: string, status = 400, retryable?: boolean) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function apiError(code: ApiErrorCode, message: string, status = 400, retryable?: boolean) {
  return NextResponse.json<ApiErrorPayload>(
    { error: { code, message, ...(retryable === undefined ? {} : { retryable }) } },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return apiError(error.code, error.message, error.status, error.retryable);
  }

  if (process.env.KOE_DEBUG_API_ERRORS === "true") {
    console.error("[Koe API] Unhandled API error", error);
  }

  return apiError("INTERNAL_ERROR", "Request failed.", 500, true);
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
}
