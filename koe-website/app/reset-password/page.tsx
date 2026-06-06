import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const metadata: Metadata = pageMetadata({
  title: "Reset Password",
  description: "Reset your Koe account password.",
  path: "/reset-password/",
  index: false,
});

export default function ResetPasswordPage() {
  return (
    <>
      <div className="giant-kanji font-jp pointer-events-none">声</div>
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <Suspense fallback={<div className="text-muted normal-case">Loading...</div>}>
          <ResetPasswordClient />
        </Suspense>
      </main>
    </>
  );
}
