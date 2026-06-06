import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";
import { VerifyEmailClient } from "./VerifyEmailClient";

export const metadata: Metadata = pageMetadata({
  title: "Verify Email",
  description: "Confirm your Koe account email address.",
  path: "/verify-email/",
  index: false,
});

export default function VerifyEmailPage() {
  return (
    <>
      <div className="giant-kanji font-jp pointer-events-none">声</div>
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <Suspense fallback={<div className="text-muted normal-case">Checking...</div>}>
          <VerifyEmailClient />
        </Suspense>
      </main>
    </>
  );
}
