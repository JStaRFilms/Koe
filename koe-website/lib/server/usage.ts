import { ResolvedMode, currentPeriodKey } from "./account-mode";
import { sql } from "./db";

export async function ensureDefaultManagedAllocation(userId: string) {
  if (process.env.KOE_MANAGED_DEFAULT_FREE_ENABLED !== "true") {
    return;
  }

  const audioLimit = Number(process.env.KOE_MANAGED_DEFAULT_AUDIO_SECONDS || 3600);
  const requestLimit = Number(process.env.KOE_MANAGED_DEFAULT_REQUESTS || 500);
  await sql()`
    INSERT INTO managed_allocations (user_id, status, source, plan_code, monthly_audio_seconds, monthly_request_count)
    SELECT ${userId}, 'active', 'default_free', 'free_monthly', ${audioLimit}, ${requestLimit}
    WHERE NOT EXISTS (
      SELECT 1 FROM managed_allocations WHERE user_id = ${userId} AND status = 'active'
    )
  `;
}

export async function recordUsage(args: {
  userId: string;
  deviceId?: string | null;
  requestId: string;
  resolvedMode: ResolvedMode;
  action: "process" | "transcription" | "refinement";
  model?: string | null;
  audioSeconds?: number;
  inputChars?: number;
  outputChars?: number;
  status: "success" | "error";
  errorCode?: string | null;
}) {
  const db = sql();
  const audioSeconds = Math.max(0, args.audioSeconds || 0);
  const inputChars = Math.max(0, args.inputChars || 0);
  const outputChars = Math.max(0, args.outputChars || 0);

  const chargeableUsage = await db`
    INSERT INTO usage_events (
      user_id, device_id, request_id, mode, provider, action, model,
      audio_seconds, input_chars, output_chars, status, error_code
    )
    VALUES (
      ${args.userId}, ${args.deviceId || null}, ${args.requestId}, ${args.resolvedMode.mode},
      ${args.resolvedMode.provider}, ${args.action}, ${args.model || null}, ${audioSeconds},
      ${inputChars}, ${outputChars}, ${args.status}, ${args.errorCode || null}
    )
    ON CONFLICT (user_id, request_id, action)
    DO UPDATE SET
      status = EXCLUDED.status,
      error_code = EXCLUDED.error_code,
      audio_seconds = EXCLUDED.audio_seconds,
      input_chars = EXCLUDED.input_chars,
      output_chars = EXCLUDED.output_chars,
      model = EXCLUDED.model
    WHERE usage_events.status <> 'success' AND EXCLUDED.status = 'success'
    RETURNING id
  `;

  if (args.resolvedMode.mode === "managed" && args.status === "success" && chargeableUsage.length > 0) {
    const periodKey = currentPeriodKey();
    await db`
      INSERT INTO managed_usage_periods (user_id, allocation_id, period_key, audio_seconds_used, request_count_used)
      VALUES (${args.userId}, ${args.resolvedMode.allocationId}, ${periodKey}, ${audioSeconds}, 1)
      ON CONFLICT (allocation_id, period_key)
      DO UPDATE SET
        audio_seconds_used = managed_usage_periods.audio_seconds_used + EXCLUDED.audio_seconds_used,
        request_count_used = managed_usage_periods.request_count_used + 1,
        updated_at = now()
    `;
  }
}

export async function recordTranscriptHistory(args: {
  userId: string;
  deviceId?: string | null;
  requestId: string;
  clientSessionId?: string | null;
  resolvedMode: ResolvedMode;
  model?: string | null;
  rawText: string;
  refinedText?: string | null;
  audioSeconds?: number;
}) {
  const rows = await sql()`
    INSERT INTO transcript_history (
      user_id, device_id, request_id, client_session_id, mode, provider, model,
      raw_text, refined_text, audio_seconds
    )
    VALUES (
      ${args.userId}, ${args.deviceId || null}, ${args.requestId}, ${args.clientSessionId || null},
      ${args.resolvedMode.mode}, ${args.resolvedMode.provider}, ${args.model || null},
      ${args.rawText}, ${args.refinedText || null}, ${Math.max(0, args.audioSeconds || 0)}
    )
    ON CONFLICT (user_id, request_id) DO UPDATE SET
      client_session_id = COALESCE(transcript_history.client_session_id, EXCLUDED.client_session_id),
      refined_text = COALESCE(EXCLUDED.refined_text, transcript_history.refined_text)
    RETURNING id
  `;

  return String(rows[0]?.id || "");
}
