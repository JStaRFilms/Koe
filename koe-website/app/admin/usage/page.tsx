import { notFound } from "next/navigation";
import { sql } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type MetricRow = {
  total_users: number;
  verified_users: number;
  active_sessions: number;
  users_with_byok: number;
  active_managed_allocations: number;
  total_transcripts: number;
  requests_30d: number;
  audio_seconds_30d: string | number;
  errors_30d: number;
};

type UserUsageRow = {
  id: string;
  email: string;
  display_name: string | null;
  default_account_mode: "byok" | "managed";
  email_verified_at: string | null;
  created_at: string;
  devices_count: number;
  device_platforms: string | null;
  active_sessions_count: number;
  last_seen_at: string | null;
  has_byok: boolean;
  byok_last4: string | null;
  managed_status: string | null;
  managed_source: string | null;
  plan_code: string | null;
  monthly_audio_seconds: number | null;
  monthly_request_count: number | null;
  period_end: string | null;
  current_audio_seconds: string | number;
  current_request_count: number;
  transcript_count: number;
  total_audio_seconds: string | number;
  total_requests: number;
  error_count: number;
  last_transcript_at: string | null;
};

type DailyRow = {
  day: string;
  requests: number;
  errors: number;
  transcripts: number;
  audio_seconds: string | number;
};

type ModeRow = {
  mode: "byok" | "managed";
  requests: number;
  errors: number;
  audio_seconds: string | number;
};

type RecentEventRow = {
  created_at: string;
  email: string;
  mode: "byok" | "managed";
  action: string;
  model: string | null;
  audio_seconds: string | number;
  status: string;
  error_code: string | null;
};

type RecentTranscriptRow = {
  created_at: string;
  email: string;
  mode: "byok" | "managed";
  audio_seconds: string | number;
  raw_text: string;
  refined_text: string | null;
};

type PlatformRow = {
  platform: "desktop" | "ios" | "android" | "web";
  devices: number;
  users: number;
  active_sessions: number;
  last_seen_at: string | null;
};

type RecentDeviceRow = {
  email: string;
  platform: "desktop" | "ios" | "android" | "web";
  label: string | null;
  app_version: string | null;
  os_version: string | null;
  last_seen_at: string | null;
  created_at: string;
  active_sessions: number;
};

function dashboardEnabled() {
  if (process.env.KOE_ADMIN_DASHBOARD_ENABLED === "true") return true;
  if (process.env.KOE_ADMIN_DASHBOARD_ENABLED === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(value: unknown, digits = 0) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDuration(seconds: unknown) {
  const value = Math.max(0, Number(seconds || 0));
  if (value < 60) return `${formatNumber(value, 1)}s`;
  if (value < 3600) return `${formatNumber(value / 60, 1)}m`;
  return `${formatNumber(value / 3600, 1)}h`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function percent(used: unknown, limit: unknown) {
  const usedNumber = Number(used || 0);
  const limitNumber = Number(limit || 0);
  if (!limitNumber || limitNumber <= 0) return 0;
  return Math.max(0, Math.min(100, (usedNumber / limitNumber) * 100));
}

function truncate(text: string | null, max = 140) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max).trim()}…` : value || "—";
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-zinc-700 bg-black/70 p-4 shadow-[4px_4px_0_#ffb000]">
      <div className="text-[10px] tracking-[0.22em] text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-amber">{value}</div>
      {detail ? <div className="mt-2 text-xs text-zinc-400 normal-case">{detail}</div> : null}
    </div>
  );
}

function BarChart({ rows }: { rows: DailyRow[] }) {
  const maxRequests = Math.max(1, ...rows.map((row) => Number(row.requests || 0)));
  const maxAudio = Math.max(1, ...rows.map((row) => Number(row.audio_seconds || 0)));

  return (
    <div className="grid gap-2">
      {rows.map((row) => {
        const requestWidth = Math.max(3, (Number(row.requests || 0) / maxRequests) * 100);
        const audioWidth = Math.max(3, (Number(row.audio_seconds || 0) / maxAudio) * 100);
        return (
          <div key={row.day} className="grid grid-cols-[92px_1fr_96px] items-center gap-3 text-xs">
            <div className="text-zinc-400">{new Date(row.day).toLocaleDateString("en", { month: "short", day: "numeric" })}</div>
            <div className="space-y-1">
              <div className="h-3 border border-zinc-700 bg-zinc-950">
                <div className="h-full bg-amber" style={{ width: `${requestWidth}%` }} />
              </div>
              <div className="h-2 border border-zinc-800 bg-zinc-950">
                <div className="h-full bg-emerald-400" style={{ width: `${audioWidth}%` }} />
              </div>
            </div>
            <div className="text-right text-zinc-300">{row.requests} req / {formatDuration(row.audio_seconds)}</div>
          </div>
        );
      })}
    </div>
  );
}

function UsagePill({ row }: { row: UserUsageRow }) {
  const audioPct = percent(row.current_audio_seconds, row.monthly_audio_seconds);
  const requestPct = percent(row.current_request_count, row.monthly_request_count);
  return (
    <div className="space-y-2 normal-case">
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <span>Audio</span>
          <span>{formatDuration(row.current_audio_seconds)} / {formatDuration(row.monthly_audio_seconds)}</span>
        </div>
        <div className="h-2 border border-zinc-700 bg-zinc-950">
          <div className="h-full bg-amber" style={{ width: `${audioPct}%` }} />
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <span>Requests</span>
          <span>{row.current_request_count} / {row.monthly_request_count || 0}</span>
        </div>
        <div className="h-2 border border-zinc-700 bg-zinc-950">
          <div className="h-full bg-emerald-400" style={{ width: `${requestPct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default async function UsageAdminPage({ searchParams }: { searchParams: SearchParams }) {
  if (!dashboardEnabled()) {
    notFound();
  }

  const params = await searchParams;
  const requiredToken = process.env.KOE_ADMIN_DASHBOARD_TOKEN?.trim();
  const providedToken = firstParam(params.token)?.trim();
  if (requiredToken && providedToken !== requiredToken) {
    return (
      <main className="min-h-screen bg-black p-8 text-bone">
        <div className="mx-auto max-w-3xl border border-red-500 bg-red-950/30 p-6">
          <h1 className="text-3xl font-black text-red-300">Dashboard locked</h1>
          <p className="mt-3 text-sm normal-case text-red-100">Set the correct <code>?token=...</code> query parameter to view local usage data.</p>
        </div>
      </main>
    );
  }

  const db = sql();
  const periodKey = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;

  const [metricsRows, userRows, dailyRows, modeRows, platformRows, recentDeviceRows, recentEventRows, recentTranscriptRows] = await Promise.all([
    db`
      SELECT
        (SELECT count(*)::int FROM users) AS total_users,
        (SELECT count(*)::int FROM users WHERE email_verified_at IS NOT NULL) AS verified_users,
        (SELECT count(*)::int FROM auth_sessions WHERE revoked_at IS NULL AND expires_at > now()) AS active_sessions,
        (SELECT count(DISTINCT user_id)::int FROM user_credentials WHERE deleted_at IS NULL AND status = 'active') AS users_with_byok,
        (SELECT count(*)::int FROM managed_allocations WHERE status = 'active' AND (period_end IS NULL OR period_end > now())) AS active_managed_allocations,
        (SELECT count(*)::int FROM transcript_history) AS total_transcripts,
        (SELECT count(*)::int FROM usage_events WHERE created_at >= now() - interval '30 days') AS requests_30d,
        (SELECT coalesce(sum(audio_seconds), 0) FROM usage_events WHERE created_at >= now() - interval '30 days' AND status = 'success') AS audio_seconds_30d,
        (SELECT count(*)::int FROM usage_events WHERE created_at >= now() - interval '30 days' AND status = 'error') AS errors_30d
    `,
    db`
      SELECT
        u.id,
        u.email::text AS email,
        u.display_name,
        u.default_account_mode,
        u.email_verified_at,
        u.created_at,
        (SELECT count(*)::int FROM user_devices d WHERE d.user_id = u.id) AS devices_count,
        (SELECT string_agg(platform_count, ', ' ORDER BY platform_count) FROM (
          SELECT d.platform || ':' || count(*)::text AS platform_count
          FROM user_devices d
          WHERE d.user_id = u.id
          GROUP BY d.platform
        ) platform_counts) AS device_platforms,
        (SELECT count(*)::int FROM auth_sessions s WHERE s.user_id = u.id AND s.revoked_at IS NULL AND s.expires_at > now()) AS active_sessions_count,
        (SELECT max(s.last_seen_at) FROM auth_sessions s WHERE s.user_id = u.id) AS last_seen_at,
        EXISTS (SELECT 1 FROM user_credentials c WHERE c.user_id = u.id AND c.deleted_at IS NULL AND c.status = 'active') AS has_byok,
        (SELECT c.secret_last4 FROM user_credentials c WHERE c.user_id = u.id AND c.deleted_at IS NULL AND c.status = 'active' ORDER BY c.updated_at DESC LIMIT 1) AS byok_last4,
        ma.status AS managed_status,
        ma.source AS managed_source,
        ma.plan_code,
        ma.monthly_audio_seconds,
        ma.monthly_request_count,
        ma.period_end,
        coalesce(mup.audio_seconds_used, 0) AS current_audio_seconds,
        coalesce(mup.request_count_used, 0)::int AS current_request_count,
        (SELECT count(*)::int FROM transcript_history th WHERE th.user_id = u.id) AS transcript_count,
        (SELECT coalesce(sum(th.audio_seconds), 0) FROM transcript_history th WHERE th.user_id = u.id) AS total_audio_seconds,
        (SELECT count(*)::int FROM usage_events ue WHERE ue.user_id = u.id) AS total_requests,
        (SELECT count(*)::int FROM usage_events ue WHERE ue.user_id = u.id AND ue.status = 'error') AS error_count,
        (SELECT max(th.created_at) FROM transcript_history th WHERE th.user_id = u.id) AS last_transcript_at
      FROM users u
      LEFT JOIN LATERAL (
        SELECT *
        FROM managed_allocations ma
        WHERE ma.user_id = u.id
        ORDER BY (ma.status = 'active') DESC, ma.created_at DESC
        LIMIT 1
      ) ma ON true
      LEFT JOIN managed_usage_periods mup ON mup.allocation_id = ma.id AND mup.period_key = ${periodKey}
      ORDER BY u.created_at DESC
      LIMIT 200
    `,
    db`
      WITH days AS (
        SELECT generate_series((current_date - interval '29 days')::date, current_date::date, interval '1 day')::date AS day
      ), usage_by_day AS (
        SELECT date_trunc('day', created_at)::date AS day,
               count(*)::int AS requests,
               count(*) FILTER (WHERE status = 'error')::int AS errors,
               coalesce(sum(audio_seconds) FILTER (WHERE status = 'success'), 0) AS audio_seconds
        FROM usage_events
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
      ), transcripts_by_day AS (
        SELECT date_trunc('day', created_at)::date AS day,
               count(*)::int AS transcripts
        FROM transcript_history
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
      )
      SELECT d.day::text,
             coalesce(u.requests, 0)::int AS requests,
             coalesce(u.errors, 0)::int AS errors,
             coalesce(t.transcripts, 0)::int AS transcripts,
             coalesce(u.audio_seconds, 0) AS audio_seconds
      FROM days d
      LEFT JOIN usage_by_day u ON u.day = d.day
      LEFT JOIN transcripts_by_day t ON t.day = d.day
      ORDER BY d.day
    `,
    db`
      SELECT mode,
             count(*)::int AS requests,
             count(*) FILTER (WHERE status = 'error')::int AS errors,
             coalesce(sum(audio_seconds) FILTER (WHERE status = 'success'), 0) AS audio_seconds
      FROM usage_events
      WHERE created_at >= now() - interval '30 days'
      GROUP BY mode
      ORDER BY requests DESC
    `,
    db`
      SELECT d.platform,
             count(*)::int AS devices,
             count(DISTINCT d.user_id)::int AS users,
             count(s.id)::int AS active_sessions,
             max(d.last_seen_at) AS last_seen_at
      FROM user_devices d
      LEFT JOIN auth_sessions s ON s.device_id = d.id AND s.revoked_at IS NULL AND s.expires_at > now()
      GROUP BY d.platform
      ORDER BY devices DESC
    `,
    db`
      SELECT u.email::text AS email,
             d.platform,
             d.label,
             d.app_version,
             d.os_version,
             d.last_seen_at,
             d.created_at,
             (SELECT count(*)::int FROM auth_sessions s WHERE s.device_id = d.id AND s.revoked_at IS NULL AND s.expires_at > now()) AS active_sessions
      FROM user_devices d
      JOIN users u ON u.id = d.user_id
      ORDER BY d.last_seen_at DESC NULLS LAST, d.created_at DESC
      LIMIT 40
    `,
    db`
      SELECT ue.created_at,
             u.email::text AS email,
             ue.mode,
             ue.action,
             ue.model,
             ue.audio_seconds,
             ue.status,
             ue.error_code
      FROM usage_events ue
      JOIN users u ON u.id = ue.user_id
      ORDER BY ue.created_at DESC
      LIMIT 30
    `,
    db`
      SELECT th.created_at,
             u.email::text AS email,
             th.mode,
             th.audio_seconds,
             th.raw_text,
             th.refined_text
      FROM transcript_history th
      JOIN users u ON u.id = th.user_id
      ORDER BY th.created_at DESC
      LIMIT 20
    `,
  ]);

  const metrics = metricsRows[0] as unknown as MetricRow;
  const users = userRows as unknown as UserUsageRow[];
  const daily = dailyRows as unknown as DailyRow[];
  const modes = modeRows as unknown as ModeRow[];
  const platforms = platformRows as unknown as PlatformRow[];
  const recentDevices = recentDeviceRows as unknown as RecentDeviceRow[];
  const recentEvents = recentEventRows as unknown as RecentEventRow[];
  const recentTranscripts = recentTranscriptRows as unknown as RecentTranscriptRow[];

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-bone md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border border-zinc-700 bg-black/80 p-5 shadow-[6px_6px_0_#ffb000]">
          <div className="text-[10px] tracking-[0.28em] text-amber">KOE ADMIN // LOCAL USAGE OBSERVATORY</div>
          <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">Account Usage Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm normal-case text-zinc-400">
                Pulls directly from the configured Neon database. Keep this dashboard local or protect it with <code>KOE_ADMIN_DASHBOARD_TOKEN</code> before hosting.
              </p>
            </div>
            <div className="text-xs text-zinc-400">Period: <span className="text-amber">{periodKey}</span></div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Users" value={formatNumber(metrics.total_users)} detail={`${formatNumber(metrics.verified_users)} verified`} />
          <StatCard label="Active sessions" value={formatNumber(metrics.active_sessions)} />
          <StatCard label="BYOK users" value={formatNumber(metrics.users_with_byok)} />
          <StatCard label="30D requests" value={formatNumber(metrics.requests_30d)} detail={`${formatNumber(metrics.errors_30d)} errors`} />
          <StatCard label="30D audio" value={formatDuration(metrics.audio_seconds_30d)} detail={`${formatNumber(metrics.total_transcripts)} transcripts total`} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="border border-zinc-700 bg-black/80 p-5">
            <h2 className="mb-4 text-xl font-black text-amber">30-day usage trend</h2>
            <BarChart rows={daily} />
            <div className="mt-4 flex gap-4 text-xs text-zinc-400 normal-case">
              <span><span className="inline-block h-2 w-4 bg-amber" /> requests</span>
              <span><span className="inline-block h-2 w-4 bg-emerald-400" /> successful audio seconds</span>
            </div>
          </div>

          <div className="border border-zinc-700 bg-black/80 p-5">
            <h2 className="mb-4 text-xl font-black text-amber">Mode mix // 30D</h2>
            <div className="space-y-3">
              {modes.length ? modes.map((mode) => (
                <div key={mode.mode} className="border border-zinc-800 p-3">
                  <div className="flex justify-between text-sm"><span>{mode.mode}</span><span className="text-amber">{mode.requests} req</span></div>
                  <div className="mt-1 text-xs text-zinc-400 normal-case">{formatDuration(mode.audio_seconds)} audio // {mode.errors} errors</div>
                </div>
              )) : <div className="text-sm text-zinc-500">No usage events yet.</div>}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="border border-zinc-700 bg-black/80 p-5">
            <h2 className="mb-4 text-xl font-black text-amber">Device mix</h2>
            <div className="space-y-3">
              {platforms.length ? platforms.map((platform) => (
                <div key={platform.platform} className="border border-zinc-800 p-3 normal-case">
                  <div className="flex justify-between gap-3 uppercase"><span>{platform.platform}</span><span className="text-amber">{platform.devices} devices</span></div>
                  <div className="mt-1 text-xs text-zinc-400">{platform.users} users // {platform.active_sessions} active sessions</div>
                  <div className="mt-1 text-xs text-zinc-500">last seen {formatDate(platform.last_seen_at)}</div>
                </div>
              )) : <div className="text-sm text-zinc-500">No registered devices yet.</div>}
            </div>
          </div>

          <div className="border border-zinc-700 bg-black/80 p-5">
            <h2 className="mb-4 text-xl font-black text-amber">Recent devices</h2>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left text-xs">
                <thead className="text-zinc-400">
                  <tr className="border-b border-zinc-700">
                    <th className="p-2">User</th>
                    <th className="p-2">Platform</th>
                    <th className="p-2">Device</th>
                    <th className="p-2">Version</th>
                    <th className="p-2">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDevices.map((device, index) => (
                    <tr key={`${device.email}-${device.platform}-${index}`} className="border-b border-zinc-900 normal-case hover:bg-zinc-950">
                      <td className="p-2">{device.email}</td>
                      <td className="p-2 uppercase text-amber">{device.platform}</td>
                      <td className="p-2">{device.label || "Unnamed device"}<div className="text-zinc-500">{device.os_version || "unknown OS"}</div></td>
                      <td className="p-2">{device.app_version || "n/a"}</td>
                      <td className="p-2">seen {formatDate(device.last_seen_at)}<div className="text-zinc-500">{device.active_sessions} active sessions</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border border-zinc-700 bg-black/80 p-5">
          <h2 className="mb-4 text-xl font-black text-amber">Users, quota, and account state</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left text-xs">
              <thead className="text-zinc-400">
                <tr className="border-b border-zinc-700">
                  <th className="p-2">User</th>
                  <th className="p-2">Mode</th>
                  <th className="p-2">BYOK</th>
                  <th className="p-2">Managed allocation</th>
                  <th className="p-2">Current quota</th>
                  <th className="p-2">Lifetime</th>
                  <th className="p-2">Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-900 align-top hover:bg-zinc-950">
                    <td className="p-2 normal-case">
                      <div className="font-bold text-bone">{user.email}</div>
                      <div className="text-zinc-500">created {formatDate(user.created_at)} // {user.email_verified_at ? "verified" : "unverified"}</div>
                      <div className="text-zinc-500">{user.devices_count} devices // {user.active_sessions_count} sessions</div>
                      <div className="text-zinc-500">platforms: {user.device_platforms || "none"}</div>
                    </td>
                    <td className="p-2"><span className="border border-zinc-700 px-2 py-1 text-amber">{user.default_account_mode}</span></td>
                    <td className="p-2 normal-case">{user.has_byok ? `ready${user.byok_last4 ? ` ••••${user.byok_last4}` : ""}` : "not saved"}</td>
                    <td className="p-2 normal-case">
                      <div>{user.managed_status || "none"} {user.managed_source ? `// ${user.managed_source}` : ""}</div>
                      <div className="text-zinc-500">{user.plan_code || "no plan"} // ends {formatDate(user.period_end)}</div>
                    </td>
                    <td className="p-2"><UsagePill row={user} /></td>
                    <td className="p-2 normal-case">
                      <div>{user.transcript_count} transcripts</div>
                      <div>{formatDuration(user.total_audio_seconds)} total audio</div>
                      <div>{user.total_requests} events // {user.error_count} errors</div>
                    </td>
                    <td className="p-2 normal-case">
                      <div>seen {formatDate(user.last_seen_at)}</div>
                      <div>last transcript {formatDate(user.last_transcript_at)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border border-zinc-700 bg-black/80 p-5">
            <h2 className="mb-4 text-xl font-black text-amber">Recent usage events</h2>
            <div className="space-y-2">
              {recentEvents.map((event, index) => (
                <div key={`${event.created_at}-${index}`} className="border border-zinc-900 p-3 text-xs normal-case">
                  <div className="flex justify-between gap-3 uppercase"><span className="text-bone">{event.action} // {event.mode}</span><span className={event.status === "error" ? "text-red-300" : "text-emerald-300"}>{event.status}</span></div>
                  <div className="mt-1 text-zinc-400">{event.email} // {formatDate(event.created_at)} // {formatDuration(event.audio_seconds)} // {event.model || "n/a"}</div>
                  {event.error_code ? <div className="mt-1 text-red-300">error: {event.error_code}</div> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-700 bg-black/80 p-5">
            <h2 className="mb-4 text-xl font-black text-amber">Recent transcripts</h2>
            <div className="space-y-2">
              {recentTranscripts.map((transcript, index) => (
                <div key={`${transcript.created_at}-${index}`} className="border border-zinc-900 p-3 text-xs normal-case">
                  <div className="flex justify-between gap-3 uppercase"><span>{transcript.email}</span><span className="text-amber">{transcript.mode} // {formatDuration(transcript.audio_seconds)}</span></div>
                  <div className="mt-1 text-zinc-500">{formatDate(transcript.created_at)}</div>
                  <div className="mt-2 text-zinc-300">Raw: {truncate(transcript.raw_text)}</div>
                  <div className="mt-1 text-zinc-400">Refined: {truncate(transcript.refined_text)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
