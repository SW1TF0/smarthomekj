"use client";

import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { createInquiry, createPrivacyRequest, createWithdrawal } from "./store";

export type FormKind = "inquiry" | "privacy" | "withdrawal";
export type FormState = { ok: boolean; error?: "invalid" | "failed"; fields?: string[]; values?: Record<string, string>; at?: string } | null;

const schemas = {
  inquiry: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).default(""),
    service: z.string().trim().max(40),
    propertyType: z.string().trim().max(40).default(""),
    message: z.string().trim().min(5).max(4000),
    consent: z.literal("on"),
  }),
  privacy: z.object({
    type: z.enum(["ACCESS", "PORTABILITY", "RECTIFICATION", "ERASURE", "OBJECTION"]),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    message: z.string().trim().max(4000).default(""),
  }),
  withdrawal: z.object({
    orderNumber: z.string().trim().min(3).max(40),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    items: z.string().trim().min(2).max(2000),
    reason: z.string().trim().max(2000).default(""),
  }),
};

/** Validates a public form and stores it in Firestore. The honeypot field "website" is never filled by people. */
export async function submitForm(kind: FormKind, form: FormData): Promise<FormState> {
  if (String(form.get("website") ?? "")) return { ok: true };
  const raw = String(form.get("locale") ?? "");
  const locale: Locale = isLocale(raw) ? raw : "bg";
  const values = Object.fromEntries(form);
  // The price calculator sends its estimate as the message and the visitor's own note separately.
  const extra = String(form.get("extra") ?? "").trim();
  if (kind === "inquiry" && extra) values.message = `${String(values.message ?? "")}\n\n${extra}`.slice(0, 4000);
  const parsed = schemas[kind].safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  try {
    if (kind === "inquiry") {
      const { consent: _consent, ...data } = parsed.data as z.infer<typeof schemas.inquiry>;
      void _consent;
      await createInquiry({ ...data, locale });
    } else if (kind === "privacy") {
      await createPrivacyRequest(parsed.data as z.infer<typeof schemas.privacy>);
    } else {
      await createWithdrawal({ ...(parsed.data as z.infer<typeof schemas.withdrawal>), locale });
    }
    return { ok: true, values: parsed.data as Record<string, string>, at: new Date().toISOString() };
  } catch {
    return { ok: false, error: "failed" };
  }
}
