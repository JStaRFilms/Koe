import { Resend } from "resend";

function appUrl() {
  return (process.env.KOE_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function fromAddress() {
  return process.env.KOE_EMAIL_FROM || "Koe <noreply@example.com>";
}

function resendClient() {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendVerificationEmail(args: { email: string; token: string }) {
  const resend = resendClient();
  if (!resend) {
    return { sent: false, reason: "email_not_configured" as const };
  }

  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(args.token)}`;
  await resend.emails.send({
    from: fromAddress(),
    to: args.email,
    subject: "Verify your Koe account",
    html: `<p>Welcome to Koe.</p><p>Verify your email:</p><p><a href="${escapeHtml(url)}">Verify email</a></p><p>This link expires soon.</p>`,
    text: `Verify your Koe account: ${url}`,
  });

  return { sent: true as const };
}

export async function sendPasswordResetEmail(args: { email: string; token: string }) {
  const resend = resendClient();
  if (!resend) {
    return { sent: false, reason: "email_not_configured" as const };
  }

  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(args.token)}`;
  await resend.emails.send({
    from: fromAddress(),
    to: args.email,
    subject: "Reset your Koe password",
    html: `<p>Reset your Koe password:</p><p><a href="${escapeHtml(url)}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
    text: `Reset your Koe password: ${url}`,
  });

  return { sent: true as const };
}
