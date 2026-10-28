"use client";

import { useState } from "react";
import { getAdminSettings } from "@/lib/admin-store";
import { emailConfigured, sendEmail } from "@/lib/email";
import type { SiteSettings } from "@/lib/settings";

const templateFields = [
  { where: "Subject", value: "{{subject}}" },
  { where: "Content (Edit Content → Code Editor, изтрийте всичко)", value: "{{{html}}}" },
  { where: "To Email", value: "{{to_email}}" },
  { where: "From Name", value: "{{from_name}}" },
  { where: "Reply To", value: "{{reply_to}}" },
];

function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="shrink-0 rounded-full bg-white px-3 py-1 text-[12px] ring-1 ring-black/10"
      onClick={() => navigator.clipboard.writeText(value).then(() => (setDone(true), setTimeout(() => setDone(false), 1500)))}
    >
      {done ? "Копирано" : "Копирай"}
    </button>
  );
}

/** Step-by-step EmailJS setup and a test button, under the email fields in Settings. */
export function EmailSetup({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(!emailConfigured(settings));
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendTest() {
    setBusy(true);
    setTest(null);
    try {
      // Fresh from the database, so it tests what was saved, not what is typed.
      const s = await getAdminSettings();
      const to = s.notifyEmail || s.email;
      await sendEmail(s, to, {
        subject: `${s.companyName}: пробен имейл`,
        html: `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;padding:24px"><h2 style="margin:0">Имейлите работят ✓</h2><p>Клиентите вече ще получават потвърждения, нов статус и фактури.</p></div>`,
      });
      setTest({ ok: true, text: `Изпратен до ${to}. Проверете пощата (и папка Спам).` });
    } catch (e) {
      setTest({ ok: false, text: e instanceof Error ? e.message : "Не беше изпратен." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl bg-cloud/60 p-4 text-[14px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="font-medium text-link" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Скрий стъпките" : "Как се настройва (5 минути)"}
        </button>
        <button type="button" className="btn btn-sm bg-white ring-1 ring-black/10" disabled={busy} onClick={sendTest}>
          {busy ? "…" : "Изпрати пробен имейл"}
        </button>
      </div>
      {test && (
        <p className={`mt-3 ${test.ok ? "text-success" : "text-danger"}`} role="status">
          {test.text}
        </p>
      )}
      {open && (
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed">
          <li>
            Отворете{" "}
            <a href="https://dashboard.emailjs.com/sign-up" target="_blank" rel="noreferrer" className="text-link">
              emailjs.com
            </a>{" "}
            и се регистрирайте безплатно.
          </li>
          <li>
            <b>Email Services → Add New Service → Gmail → Connect Account</b>. Изберете пощата на фирмата и натиснете <b>Create Service</b>. Копирайте <b>Service ID</b> в полето горе.
          </li>
          <li>
            <b>Email Templates → Create New Template</b>. Попълнете полетата така и натиснете <b>Save</b>:
            <ul className="mt-2 space-y-1.5">
              {templateFields.map((f) => (
                <li key={f.where} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-[12px] text-mute">{f.where}</span>
                    <code className="text-[13px]">{f.value}</code>
                  </span>
                  <Copy value={f.value} />
                </li>
              ))}
            </ul>
            После копирайте <b>Template ID</b> (в раздел Settings на шаблона) в полето горе.
          </li>
          <li>
            Натиснете името си горе вдясно → <b>Account</b>. Копирайте <b>Public Key</b> в полето горе.
          </li>
          <li>
            Натиснете <b>Запази</b> най-долу, после <b>Изпрати пробен имейл</b>.
          </li>
        </ol>
      )}
    </div>
  );
}
