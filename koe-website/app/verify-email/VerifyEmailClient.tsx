"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = "checking" | "success" | "error";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const verifiedTokenRef = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Confirming your Koe account...");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token. Request a new verification email from the app.");
        return;
      }
      if (verifiedTokenRef.current === token) {
        return;
      }
      verifiedTokenRef.current = token;

      try {
        const response = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Verification failed.");
        }

        if (!cancelled) {
          setStatus("success");
          setMessage("Email verified. Your Koe account is ready across desktop and mobile.");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Verification failed.");
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="w-full max-w-2xl border-raw bg-void/95 shadow-2xl">
      <div className="bg-amber text-void px-5 py-4 font-bold tracking-[0.2em] text-sm">KOE // ACCOUNT</div>
      <div className="p-8 sm:p-10">
        <p className="text-amber text-xs font-bold tracking-[0.22em] mb-4">
          {status === "success" ? "VERIFIED" : status === "error" ? "ACTION NEEDED" : "CHECKING"}
        </p>
        <h1 className="font-display text-4xl sm:text-6xl leading-none mb-6">Verify Email</h1>
        <p className="text-muted normal-case leading-7 mb-8">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="btn-brutal text-center">
            Back to Koe
          </Link>
          {status === "success" && (
            <p className="text-sm text-muted normal-case self-center">You can close this tab and return to the app.</p>
          )}
        </div>
      </div>
    </section>
  );
}
