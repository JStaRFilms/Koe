import { NextResponse } from "next/server";
import { getCapabilities, snapshotResolvedMode } from "@/lib/server/account-mode";
import { getAuthContext } from "@/lib/server/auth";
import { getActiveBillingSubscription, listBillingPlans } from "@/lib/server/billing";
import { applyDuePlanChanges, getPendingPlanChange } from "@/lib/server/billing-plan-changes";
import { one, sql, toIso } from "@/lib/server/db";
import { handleApiError } from "@/lib/server/errors";
import type { Platform } from "@/lib/server/contracts";

export const runtime = "nodejs";

const ORPHAN_REFINEMENT_MATCH_WINDOW_MS = 15 * 60 * 1000;

type HistoryRow = {
  id: string;
  request_id: string;
  client_session_id: string | null;
  device_id: string | null;
  device_platform: Platform | null;
  device_label: string | null;
  mode: "byok" | "managed";
  provider: string;
  model: string | null;
  raw_text: string;
  refined_text: string | null;
  audio_seconds: string | number | null;
  created_at: string;
};

function compactTranscript(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function createdAtMs(row: HistoryRow) {
  const time = new Date(row.created_at).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isAudioRow(row: HistoryRow) {
  return Number(row.audio_seconds || 0) > 0;
}

function isSessionRefinementRow(row: HistoryRow) {
  return !isAudioRow(row) && Boolean(String(row.refined_text || "").trim());
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function transcriptLooksRelated(refinementRow: HistoryRow, groupRows: HistoryRow[]) {
  const audioText = normalizeForMatch(compactTranscript(groupRows.filter(isAudioRow).map((row) => row.raw_text)));
  const refinementRaw = normalizeForMatch(refinementRow.raw_text);

  if (!audioText || !refinementRaw) {
    return true;
  }

  const probe = audioText.slice(0, 120).trim();
  return probe.length < 24 || refinementRaw.includes(probe) || audioText.includes(refinementRaw.slice(0, 120).trim());
}

function findRefinementSessionKey(refinementRow: HistoryRow, groups: Map<string, HistoryRow[]>) {
  const refinementTime = createdAtMs(refinementRow);
  let best: { key: string; distanceMs: number } | null = null;

  for (const [key, groupRows] of groups.entries()) {
    const sessionId = groupRows.find((row) => row.client_session_id)?.client_session_id;
    if (!sessionId || !groupRows.some(isAudioRow)) {
      continue;
    }

    const candidateDeviceId = groupRows.find((row) => row.device_id)?.device_id;
    if (refinementRow.device_id && candidateDeviceId && refinementRow.device_id !== candidateDeviceId) {
      continue;
    }

    const latestAudioTime = Math.max(...groupRows.filter(isAudioRow).map(createdAtMs));
    const distanceMs = refinementTime - latestAudioTime;
    if (distanceMs < 0 || distanceMs > ORPHAN_REFINEMENT_MATCH_WINDOW_MS) {
      continue;
    }

    if (!transcriptLooksRelated(refinementRow, groupRows)) {
      continue;
    }

    if (!best || distanceMs < best.distanceMs) {
      best = { key, distanceMs };
    }
  }

  return best?.key || null;
}

function groupHistoryRows(rows: HistoryRow[]) {
  const groups = new Map<string, HistoryRow[]>();
  const orphanRefinementRows: HistoryRow[] = [];

  rows.forEach((row) => {
    if (!row.client_session_id?.trim() && isSessionRefinementRow(row)) {
      orphanRefinementRows.push(row);
      return;
    }

    const key = row.client_session_id?.trim() || String(row.request_id);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  });

  orphanRefinementRows.forEach((row) => {
    const sessionKey = findRefinementSessionKey(row, groups);
    const key = sessionKey || String(row.request_id);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  });

  return Array.from(groups.entries())
    .map(([key, groupRows]) => {
      const sortedRows = groupRows.slice().sort((a, b) => createdAtMs(b) - createdAtMs(a));
      const latest = sortedRows[0];
      const orderedRows = sortedRows.slice().reverse();
      const audioRows = orderedRows.filter(isAudioRow);
      const contentRows = audioRows.length > 0 ? audioRows : orderedRows;
      const sessionRefinementRows = audioRows.length > 0
        ? orderedRows.filter(isSessionRefinementRow)
        : [];
      const latestSessionRefinement = sessionRefinementRows[sessionRefinementRows.length - 1];
      const rawText = compactTranscript(contentRows.map((row) => row.raw_text));
      const hasRefinedText = contentRows.some((row) => String(row.refined_text || "").trim());
      const refinedText = latestSessionRefinement?.refined_text
        ? String(latestSessionRefinement.refined_text).trim()
        : hasRefinedText
          ? compactTranscript(contentRows.map((row) => row.refined_text || row.raw_text))
          : null;
      const sourceRow = contentRows.find((row) => row.device_platform) || latest;

      return {
        id: key,
        requestId: String(latest.request_id),
        requestIds: orderedRows.map((row) => String(row.request_id)),
        clientSessionId: latest.client_session_id || contentRows.find((row) => row.client_session_id)?.client_session_id || null,
        devicePlatform: sourceRow.device_platform || null,
        deviceLabel: sourceRow.device_label || null,
        segmentCount: contentRows.length,
        mode: latest.mode,
        provider: latest.provider,
        model: latest.model,
        rawText,
        refinedText,
        audioSeconds: contentRows.reduce((total, row) => total + Number(row.audio_seconds || 0), 0),
        createdAt: toIso(latest.created_at),
      };
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10);
}

async function getBillingSnapshot(userId: string) {
  try {
    await applyDuePlanChanges(userId);
    const [subscription, plans, pendingPlanChange] = await Promise.all([
      getActiveBillingSubscription(userId),
      listBillingPlans(),
      getPendingPlanChange(userId),
    ]);
    return { subscription, plans, pendingPlanChange };
  } catch (error) {
    console.error("[AccountSnapshot] Billing data unavailable.", error);
    return { subscription: null, plans: [], pendingPlanChange: null };
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    const db = sql();
    const settings = one<{
      language: string;
      prompt_style: string;
      custom_prompt: string;
      enhance_text: boolean;
      model: string;
      updated_at: string;
    }>(
      await db`
        INSERT INTO user_settings (user_id)
        VALUES (${auth.user.id})
        ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING language, prompt_style, custom_prompt, enhance_text, model, updated_at
      `,
    );

    const history = await db`
      SELECT
        transcript_history.id,
        transcript_history.request_id,
        transcript_history.client_session_id,
        transcript_history.device_id,
        user_devices.platform AS device_platform,
        user_devices.label AS device_label,
        transcript_history.mode,
        transcript_history.provider,
        transcript_history.model,
        transcript_history.raw_text,
        transcript_history.refined_text,
        transcript_history.audio_seconds,
        transcript_history.created_at
      FROM transcript_history
      LEFT JOIN user_devices ON user_devices.id = transcript_history.device_id
      WHERE transcript_history.user_id = ${auth.user.id}
      ORDER BY transcript_history.created_at DESC
      LIMIT 100
    `;

    const capabilities = await getCapabilities(auth.user.id);
    const resolvedMode = await snapshotResolvedMode(auth.user.id, auth.user.defaultMode);
    const billing = await getBillingSnapshot(auth.user.id);

    return NextResponse.json({
      user: auth.user,
      resolvedMode,
      capabilities: {
        byok: capabilities.byok,
        managed: capabilities.managed,
      },
      billing: {
        provider: "paystack",
        subscription: billing.subscription,
        plans: billing.plans,
        pendingPlanChange: billing.pendingPlanChange,
      },
      settings: {
        language: settings?.language || "auto",
        promptStyle: settings?.prompt_style || "Clean",
        customPrompt: settings?.custom_prompt || "",
        enhanceText: settings?.enhance_text ?? true,
        model: settings?.model || "whisper-large-v3-turbo",
        updatedAt: toIso(settings?.updated_at),
      },
      recentHistory: groupHistoryRows(history as HistoryRow[]),
      policy: { mobilePurchaseUiEnabled: false },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
