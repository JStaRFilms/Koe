import { CheckCircle2, LogOut, MailCheck, RefreshCw } from "lucide-react";
import { AccountMode, Snapshot } from "./types";
import { formatSeconds } from "./webAppUtils";

type AccountPanelProps = {
  snapshot: Snapshot;
  modeCopy: string;
  busyLabel: string;
  onRefresh: () => void;
  onRequestVerification: () => void;
  onSignOut: () => void;
  onSwitchMode: (mode: AccountMode) => void;
};

function managedQuotaCopy(usage: Snapshot["capabilities"]["managed"]["usage"]) {
  if (usage.source !== "dynamic_free") return null;

  const remaining = Math.max(0, usage.audioSecondsLimit - usage.audioSecondsUsed);
  return {
    remaining: formatSeconds(remaining),
    floor: formatSeconds(usage.guaranteedFloorSeconds || 300),
    currentLimit: formatSeconds(usage.audioSecondsLimit),
    activeUsers: usage.activeManagedUsers24h || 1,
  };
}

export function AccountPanel({ snapshot, modeCopy, busyLabel, onRefresh, onRequestVerification, onSignOut, onSwitchMode }: AccountPanelProps) {
  const managedUsage = snapshot.capabilities.managed.usage;
  const dynamicQuota = managedQuotaCopy(managedUsage);
  const isVerified = Boolean(snapshot.user.emailVerifiedAt);

  return (
    <aside className="space-y-4 md:space-y-6">
      <div className="border-raw bg-void p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-amber text-xs font-bold mb-2">ACCOUNT</p>
            <p className="text-bone normal-case break-all">{snapshot.user.email}</p>
          </div>
          <button type="button" className="webapp-icon-button" onClick={onSignOut} aria-label="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <button type="button" className="webapp-utility-button" onClick={onRefresh} disabled={Boolean(busyLabel)}>
          <RefreshCw className={`w-4 h-4 ${busyLabel ? "animate-spin" : ""}`} />
          REFRESH
        </button>
      </div>

      <div className="border-raw bg-zinc/10 p-5 md:p-6 normal-case">
        <p className="text-amber uppercase text-xs font-bold mb-3">Email status</p>
        <div className="flex items-start gap-3">
          {isVerified ? <CheckCircle2 className="w-5 h-5 text-amber shrink-0 mt-0.5" /> : <MailCheck className="w-5 h-5 text-amber shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm text-bone">{isVerified ? "Email verified." : "Email is not verified yet."}</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {isVerified ? "Your account recovery address is confirmed." : "Send a verification link to protect account recovery and future billing changes."}
            </p>
          </div>
        </div>
        {!isVerified ? (
          <button type="button" className="webapp-utility-button mt-4" onClick={onRequestVerification} disabled={Boolean(busyLabel)}>
            <MailCheck className="w-4 h-4" />
            SEND VERIFICATION EMAIL
          </button>
        ) : null}
      </div>

      <div className="border-raw bg-zinc/10 p-5 md:p-6">
        <p className="text-amber text-xs font-bold mb-4">PROCESSING MODE</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["managed", "byok"] as const).map((mode) => {
            const selected = snapshot.user.defaultMode === mode;
            return (
              <button
                key={mode}
                type="button"
                className={`webapp-mode-button ${selected ? "webapp-mode-button-active" : ""}`}
                onClick={() => onSwitchMode(mode)}
                aria-pressed={selected}
              >
                <p className="font-bold text-sm">{mode === "managed" ? "MANAGED" : "ACCOUNT BYOK"}</p>
                <p className="normal-case text-xs mt-1">{mode === "managed" ? "No API key in browser." : "Uses saved encrypted key."}</p>
              </button>
            );
          })}
        </div>
        <p className="normal-case text-sm text-muted leading-relaxed">{modeCopy}</p>
      </div>

      <div className="border-raw bg-void p-5 md:p-6 normal-case">
        <p className="text-amber uppercase text-xs font-bold mb-3">Managed usage</p>
        <p className="text-sm text-muted">
          Audio: {formatSeconds(managedUsage.audioSecondsUsed)} / {formatSeconds(managedUsage.audioSecondsLimit)}
        </p>
        <p className="text-sm text-muted">
          Requests: {managedUsage.requestCountUsed} / {managedUsage.requestCountLimit}
        </p>
        {dynamicQuota ? (
          <p className="mt-3 text-xs text-muted leading-relaxed">
            {dynamicQuota.floor} guaranteed daily. {dynamicQuota.remaining} remains from today&apos;s {dynamicQuota.currentLimit} quiet-pool limit.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
