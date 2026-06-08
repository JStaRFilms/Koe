import { History, KeyRound, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { AuthMode } from "./types";

type AuthPanelProps = {
  authMode: AuthMode;
  email: string;
  displayName: string;
  password: string;
  busyLabel: string;
  status: string;
  onAuthModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onPasswordReset: () => void;
};

export function AuthPanel({
  authMode,
  email,
  displayName,
  password,
  busyLabel,
  status,
  onAuthModeChange,
  onEmailChange,
  onDisplayNameChange,
  onPasswordChange,
  onSubmit,
  onPasswordReset,
}: AuthPanelProps) {
  const isReset = authMode === "reset";
  const title = isReset ? "RECOVER ACCOUNT" : authMode === "signin" ? "SIGN IN" : "CREATE ACCOUNT";

  return (
    <section className="max-w-7xl mx-auto w-full border-x border-zinc py-12 px-4 md:px-8 relative z-10">
      <div className="grid lg:grid-cols-[1fr_0.9fr] gap-8">
        <div className="panel-brutal p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-amber font-bold text-xs mb-3">SIGNED-IN WEB KOE</p>
            <h1 className="font-deco text-4xl md:text-6xl text-bone mb-6 crt-flicker">USE KOE IN THE BROWSER</h1>
            <p className="text-muted normal-case text-lg leading-relaxed max-w-2xl">
              Sign in with the same Koe account you use on desktop or mobile. Managed mode works without an API key, and account BYOK uses your encrypted server-side key without exposing it to the browser.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] p-4"><ShieldCheck className="w-5 h-5 text-amber mb-3" /><p className="text-sm text-bone">Managed key stays server-side.</p></div>
              <div className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] p-4"><KeyRound className="w-5 h-5 text-amber mb-3" /><p className="text-sm text-bone">BYOK only uses saved account credentials.</p></div>
              <div className="border-raw bg-[color-mix(in_srgb,var(--color-zinc)_10%,var(--color-void))] p-4"><History className="w-5 h-5 text-amber mb-3" /><p className="text-sm text-bone">Signed-in transcripts sync foundation.</p></div>
            </div>
          </div>
        </div>

        <div className="panel-brutal p-6 md:p-8">
          <div className="flex gap-2 mb-6">
            {(["signin", "signup"] as const).map((mode) => (
              <button key={mode} type="button" className={`webapp-utility-button ${authMode === mode ? "bg-amber text-void" : ""}`} onClick={() => onAuthModeChange(mode)}>
                {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
            ))}
          </div>

          <div className="space-y-4 normal-case">
            <div>
              <p className="text-amber text-xs font-bold uppercase mb-2">{title}</p>
              <p className="text-sm text-muted leading-relaxed">
                {isReset
                  ? "Enter your account email and Koe will send a reset link if the account exists."
                  : "Use your Koe account for managed processing, synced settings, and account history."}
              </p>
            </div>

            {authMode === "signup" ? (
              <label className="block text-sm text-muted">
                Display name
                <input className="mt-2 w-full border-raw bg-zinc/10 p-3 text-bone" value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} placeholder="Optional" />
              </label>
            ) : null}
            <label className="block text-sm text-muted">
              Email
              <input className="mt-2 w-full border-raw bg-zinc/10 p-3 text-bone" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} autoComplete="email" />
            </label>
            {!isReset ? (
              <label className="block text-sm text-muted">
                Password
                <input className="mt-2 w-full border-raw bg-zinc/10 p-3 text-bone" type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"} />
              </label>
            ) : null}
            <button type="button" className="btn-brutal webapp-action justify-center w-full" onClick={isReset ? onPasswordReset : onSubmit} disabled={Boolean(busyLabel)}>
              {busyLabel ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserRound className="w-5 h-5" />}
              {busyLabel || (isReset ? "SEND RESET LINK" : authMode === "signin" ? "SIGN IN" : "CREATE ACCOUNT")}
            </button>
            {authMode === "signin" ? (
              <button type="button" className="webapp-inline-action" onClick={() => onAuthModeChange("reset")}>
                FORGOT PASSWORD?
              </button>
            ) : null}
            {isReset ? (
              <button type="button" className="webapp-inline-action" onClick={() => onAuthModeChange("signin")}>
                BACK TO SIGN IN
              </button>
            ) : null}
            <p className="text-sm text-muted">{status}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
