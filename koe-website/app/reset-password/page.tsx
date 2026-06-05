"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Choose a new password with at least 12 characters.");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Missing reset token. Request a new password reset email from the app.");
      return;
    }

    if (password.length < 12) {
      setStatus("error");
      setMessage("Use at least 12 characters for your new password.");
      return;
    }

    setStatus("submitting");
    setMessage("Updating your password...");

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Password reset failed.");
      }

      setPassword("");
      setStatus("success");
      setMessage("Password updated. Sign in again on desktop or mobile with your new password.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
    }
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl border-raw bg-void/95 shadow-2xl">
        <div className="bg-amber text-void px-5 py-4 font-bold tracking-[0.2em] text-sm">KOE // ACCOUNT</div>
        <form onSubmit={submit} className="p-8 sm:p-10">
          <p className="text-amber text-xs font-bold tracking-[0.22em] mb-4">
            {status === "success" ? "UPDATED" : status === "error" ? "ACTION NEEDED" : "SECURE RESET"}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl leading-none mb-6">Reset Password</h1>
          <p className="text-muted normal-case leading-7 mb-6">{message}</p>

          {status !== "success" && (
            <label className="block mb-8">
              <span className="block text-xs font-bold tracking-[0.18em] text-muted mb-2">NEW PASSWORD</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                className="w-full bg-void border-raw px-4 py-4 text-bone outline-none focus:border-amber normal-case"
                placeholder="At least 12 characters"
                autoComplete="new-password"
              />
            </label>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {status !== "success" ? (
              <button type="submit" disabled={status === "submitting"} className="btn-brutal disabled:opacity-60">
                {status === "submitting" ? "Updating..." : "Update password"}
              </button>
            ) : (
              <Link href="/" className="btn-brutal text-center">
                Back to Koe
              </Link>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="giant-kanji font-jp pointer-events-none">声</div>
      <Suspense fallback={<main className="relative z-10 min-h-screen flex items-center justify-center">Loading...</main>}>
        <ResetPasswordContent />
      </Suspense>
    </>
  );
}
