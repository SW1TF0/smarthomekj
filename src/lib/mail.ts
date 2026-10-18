import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getSettings } from "./settings";

let transport: Transporter | null = null;

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transport;
}

/** Sends an email when SMTP is configured; otherwise logs it so nothing breaks in development. */
export async function sendMail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const t = getTransport();
  const settings = await getSettings();
  const from = process.env.MAIL_FROM || `${settings.companyName} <${settings.email}>`;
  if (!t) {
    console.info(`[mail disabled] to=${to} subject=${subject}`);
    return false;
  }
  try {
    await t.sendMail({ from, to, subject, text });
    return true;
  } catch (error) {
    console.error("Email failed", error);
    return false;
  }
}

/** Notify the shop team (the company email in settings, or ADMIN_NOTIFY_EMAIL). */
export async function notifyTeam(subject: string, text: string) {
  const settings = await getSettings();
  return sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL || settings.email, subject, text });
}
