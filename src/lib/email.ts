import type { SiteSettings } from "./settings";

// Emails go out through EmailJS (emailjs.com), which sends from the shop's own Gmail straight from the browser,
// so the free Firebase plan needs no server. One EmailJS template does every message:
// To {{to_email}}, Subject {{subject}}, Reply-To {{reply_to}}, From name {{from_name}}, content {{{html}}}.

export function emailConfigured(s: Pick<SiteSettings, "emailServiceId" | "emailTemplateId" | "emailPublicKey">) {
  return Boolean(s.emailServiceId?.trim() && s.emailTemplateId?.trim() && s.emailPublicKey?.trim());
}

export class EmailError extends Error {}

export async function sendEmail(s: SiteSettings, to: string, message: { subject: string; html: string }) {
  if (!emailConfigured(s)) throw new EmailError("Имейлите не са настроени (Админ → Настройки → Имейли).");
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // keepalive lets the checkout move on to the thank-you page while the request finishes.
    keepalive: message.html.length < 60_000,
    body: JSON.stringify({
      service_id: s.emailServiceId.trim(),
      template_id: s.emailTemplateId.trim(),
      user_id: s.emailPublicKey.trim(),
      template_params: {
        to_email: to,
        subject: message.subject,
        html: message.html,
        reply_to: s.email,
        from_name: s.companyName,
      },
    }),
  });
  if (!res.ok) throw new EmailError(`Имейлът не беше изпратен: ${(await res.text().catch(() => "")) || res.status}`);
}
