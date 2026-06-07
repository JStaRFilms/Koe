import { Resend } from "resend";
import { ApiError } from "./errors";

type EmailPayload = Parameters<Resend["emails"]["send"]>[0];

async function sendEmail(resend: Resend, payload: EmailPayload) {
  const result = await resend.emails.send(payload);

  if (result.error || !result.data?.id) {
    console.error("[Email] Resend delivery failed", {
      code: result.error?.name,
      statusCode: result.error?.statusCode,
    });
    throw new ApiError("UPSTREAM_ERROR", "Email provider rejected the message.", 502, true);
  }

  return result.data.id;
}

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

function shell(args: { title: string; eyebrow: string; body: string; buttonLabel: string; url: string; footer: string }) {
  const safeUrl = escapeHtml(args.url);
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${escapeHtml(args.title)}</title>
  </head>
  <body style="margin:0;background:#050505;color:#E2DFD2;font-family:'IBM Plex Mono',Consolas,monospace;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(args.eyebrow)} for your Koe account.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2A2A2A;background:#0B0B0B;">
            <tr>
              <td style="padding:18px 22px;border-bottom:1px solid #2A2A2A;background:#FFB000;color:#050505;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;font-size:14px;">
                KOE // VOICE OS
              </td>
            </tr>
            <tr>
              <td style="padding:34px 26px 28px;">
                <p style="margin:0 0 12px;color:#FFB000;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(args.eyebrow)}</p>
                <h1 style="margin:0 0 16px;color:#E2DFD2;font-size:30px;line-height:1.05;letter-spacing:-1px;text-transform:uppercase;">${escapeHtml(args.title)}</h1>
                <p style="margin:0 0 26px;color:#B0ADA1;font-size:15px;line-height:1.7;text-transform:none;">${escapeHtml(args.body)}</p>
                <a href="${safeUrl}" style="display:inline-block;background:#FFB000;color:#050505;text-decoration:none;font-weight:900;padding:15px 22px;border:2px solid #FFB000;text-transform:uppercase;letter-spacing:0.8px;">${escapeHtml(args.buttonLabel)}</a>
                <p style="margin:26px 0 0;color:#888888;font-size:12px;line-height:1.7;text-transform:none;">If the button does not work, copy this link:<br><span style="word-break:break-all;color:#E2DFD2;">${safeUrl}</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 26px;border-top:1px solid #2A2A2A;color:#888888;font-size:12px;line-height:1.6;text-transform:none;">
                ${escapeHtml(args.footer)}<br />J StaR Studios // Koe
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export async function sendVerificationEmail(args: { email: string; token: string }) {
  const resend = resendClient();
  if (!resend) {
    return { sent: false, reason: "email_not_configured" as const };
  }

  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(args.token)}`;
  const id = await sendEmail(resend, {
    from: fromAddress(),
    to: args.email,
    subject: "Verify your Koe account",
    html: shell({
      eyebrow: "Confirm your email",
      title: "Verify your Koe account",
      body: "Tap the button below to confirm this email address and finish securing your Koe account across desktop and mobile.",
      buttonLabel: "Verify email",
      url,
      footer: "This verification link expires in 24 hours. If you did not create a Koe account, you can ignore this email.",
    }),
    text: `Verify your Koe account: ${url}`,
  });

  return { sent: true as const, id };
}

export async function sendPasswordResetEmail(args: { email: string; token: string }) {
  const resend = resendClient();
  if (!resend) {
    return { sent: false, reason: "email_not_configured" as const };
  }

  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(args.token)}`;
  const id = await sendEmail(resend, {
    from: fromAddress(),
    to: args.email,
    subject: "Reset your Koe password",
    html: shell({
      eyebrow: "Password reset",
      title: "Reset your Koe password",
      body: "We received a request to reset your Koe password. Use the button below to choose a new password for your account.",
      buttonLabel: "Reset password",
      url,
      footer: "This password reset link expires in 30 minutes. If you did not request this, you can safely ignore this email.",
    }),
    text: `Reset your Koe password: ${url}`,
  });

  return { sent: true as const, id };
}
