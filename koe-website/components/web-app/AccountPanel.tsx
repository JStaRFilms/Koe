import { CheckCircle2, CreditCard, LogOut, MailCheck, RefreshCw } from "lucide-react";
import { AccountMode, BillingPlanCode, Snapshot } from "./types";
import { formatSeconds } from "./webAppUtils";

type AccountPanelProps = {
  snapshot: Snapshot;
  modeCopy: string;
  busyLabel: string;
  onRefresh: () => void;
  onRequestVerification: () => void;
  onSignOut: () => void;
  onSwitchMode: (mode: AccountMode) => void;
  onStartCheckout: (planCode: BillingPlanCode) => void;
  onChangePlan: (planCode: BillingPlanCode) => void;
  onCancelPlan: () => void;
};

const PLAN_RANK: Record<BillingPlanCode, number> = {
  managed_lite: 1,
  managed_plus: 2,
  managed_pro: 3,
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

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
}

function planTargetCopy(target: string) {
  if (target === "managed_free") return "Free";
  return target.replace("managed_", "Managed ");
}

export function AccountPanel({ snapshot, modeCopy, busyLabel, onRefresh, onRequestVerification, onSignOut, onSwitchMode, onStartCheckout, onChangePlan, onCancelPlan }: AccountPanelProps) {
  const managedUsage = snapshot.capabilities.managed.usage;
  const dynamicQuota = managedQuotaCopy(managedUsage);
  const isVerified = Boolean(snapshot.user.emailVerifiedAt);
  const subscription = snapshot.billing.subscription;
  const pendingPlanChange = snapshot.billing.pendingPlanChange;
  const currentPlanCode = subscription?.planCode;
  const billingBusy = Boolean(busyLabel) || Boolean(pendingPlanChange);
  const canCancel = subscription?.status === "active" && !pendingPlanChange;

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

      <div className="border-raw bg-zinc/10 p-5 md:p-6 normal-case">
        <p className="text-amber uppercase text-xs font-bold mb-3">Managed billing</p>
        {subscription ? (
          <div className="mb-4 text-sm text-muted leading-relaxed">
            <p className="text-bone">{subscription.planName}: {subscription.status.replace("_", " ")}</p>
            <p>Renews or ends: {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "pending Paystack confirmation"}</p>
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Upgrade managed mode when you want higher monthly processing limits without managing an API key.
          </p>
        )}
        <div className="space-y-3">
          {pendingPlanChange ? (
            <p className="text-xs text-muted leading-relaxed">
              Pending {pendingPlanChange.changeType} to {planTargetCopy(pendingPlanChange.toPlanCode)} on {pendingPlanChange.effectiveAt ? new Date(pendingPlanChange.effectiveAt).toLocaleDateString() : "the next billing period"}.
            </p>
          ) : null}
          <div className="hidden md:block space-y-3">
            {snapshot.billing.plans.map((plan) => {
              const isCurrent = currentPlanCode === plan.code;
              const isUpgrade = currentPlanCode ? PLAN_RANK[plan.code] > PLAN_RANK[currentPlanCode] : false;
              const actionLabel = !currentPlanCode ? "Buy" : isCurrent ? "Current" : isUpgrade ? "Upgrade" : "Downgrade next period";
              const clickHandler = !currentPlanCode ? () => onStartCheckout(plan.code) : () => onChangePlan(plan.code);
              return (
                <button
                  key={plan.code}
                  type="button"
                  className="webapp-utility-button w-full justify-between"
                  onClick={clickHandler}
                  disabled={billingBusy || isCurrent}
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {actionLabel}: {plan.name}
                  </span>
                  <span>{formatNaira(plan.amountKobo)}/mo · {formatSeconds(plan.monthlyAudioSeconds)}</span>
                </button>
              );
            })}
            {subscription ? (
              <button
                type="button"
                className="webapp-utility-button w-full justify-center"
                onClick={() => {
                  if (window.confirm("Cancel paid renewal? Your paid quota stays available until the period ends.")) onCancelPlan();
                }}
                disabled={!canCancel}
              >
                CANCEL TO FREE NEXT PERIOD
              </button>
            ) : null}
          </div>
          <p className="md:hidden text-xs text-muted leading-relaxed">
            Paid plan checkout and plan changes are available from desktop web for now.
          </p>
        </div>
      </div>
    </aside>
  );
}
