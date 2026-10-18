"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { db } from "./db";
import { notifyTeam, sendMail } from "./mail";
import { clientIp, rateLimit } from "./rate-limit";
import { getSettings } from "./settings";

export type FormState = { ok: boolean; error?: string; fields?: string[] } | null;

async function limited(name: string) {
  const ip = clientIp(await headers());
  return !rateLimit(`${name}:${ip}`, 5, 10 * 60_000);
}

function localeOf(form: FormData): Locale {
  const l = String(form.get("locale") ?? "");
  return isLocale(l) ? l : "bg";
}

function invalid(error: z.ZodError): FormState {
  return { ok: false, error: "invalid", fields: error.issues.map((i) => String(i.path[0])) };
}

// Honeypot field: real visitors never fill "website".
function isBot(form: FormData) {
  return String(form.get("website") ?? "").length > 0;
}

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  service: z.string().trim().max(40),
  propertyType: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(4000),
  consent: z.literal("on"),
});

export async function submitInquiry(_: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { ok: true };
  if (await limited("inquiry")) return { ok: false, error: "rate" };
  const parsed = inquirySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid(parsed.error);
  const { consent: _consent, ...data } = parsed.data;
  void _consent;
  const inquiry = await db.inquiry.create({ data: { ...data, locale: localeOf(form) } });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await notifyTeam(
    `New consultation request: ${data.name}`,
    `${data.name} <${data.email}> ${data.phone ?? ""}\nService: ${data.service}\nProperty: ${data.propertyType ?? "-"}\n\n${data.message}\n\n${site}/admin/inquiries?open=${inquiry.id}`,
  );
  return { ok: true };
}

const privacySchema = z.object({
  type: z.enum(["ACCESS", "PORTABILITY", "RECTIFICATION", "ERASURE", "OBJECTION"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(4000).optional(),
});

export async function submitPrivacyRequest(_: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { ok: true };
  if (await limited("privacy")) return { ok: false, error: "rate" };
  const parsed = privacySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid(parsed.error);
  await db.privacyRequest.create({ data: parsed.data });
  await notifyTeam(
    `GDPR request (${parsed.data.type}) from ${parsed.data.email}`,
    `Respond within 30 days.\n\n${parsed.data.name} <${parsed.data.email}>\n${parsed.data.message ?? ""}`,
  );
  return { ok: true };
}

const withdrawalSchema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  items: z.string().trim().min(2).max(2000),
  reason: z.string().trim().max(2000).optional(),
});

const withdrawalReceipt: Record<Locale, (r: z.infer<typeof withdrawalSchema>, address: string, date: string) => { subject: string; text: string }> = {
  bg: (r, address, date) => ({
    subject: `Потвърждение за отказ от договор, поръчка ${r.orderNumber}`,
    text: `Здравейте, ${r.name},\n\nПолучихме уведомлението ви за отказ от договора на ${date}.\nПоръчка: ${r.orderNumber}\nПродукти: ${r.items}\n\nМоля, изпратете стоката в срок от 14 дни на адрес: ${address}.\nЩе възстановим плащането до 14 дни от получаване на уведомлението, след като получим стоката или доказателство за изпращането ѝ.\n\nSmartHomeKJ`,
  }),
  en: (r, address, date) => ({
    subject: `Withdrawal confirmation, order ${r.orderNumber}`,
    text: `Hello ${r.name},\n\nWe received your notice of withdrawal on ${date}.\nOrder: ${r.orderNumber}\nProducts: ${r.items}\n\nPlease send the goods within 14 days to: ${address}.\nWe will refund your payment within 14 days of your notice, once we receive the goods or proof that you sent them.\n\nSmartHomeKJ`,
  }),
  tr: (r, address, date) => ({
    subject: `Cayma onayı, sipariş ${r.orderNumber}`,
    text: `Merhaba ${r.name},\n\nCayma bildiriminizi ${date} tarihinde aldık.\nSipariş: ${r.orderNumber}\nÜrünler: ${r.items}\n\nLütfen ürünleri 14 gün içinde şu adrese gönderin: ${address}.\nÜrünleri veya gönderim kanıtını aldıktan sonra ödemenizi bildiriminizden itibaren 14 gün içinde iade edeceğiz.\n\nSmartHomeKJ`,
  }),
};

export async function submitWithdrawal(_: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { ok: true };
  if (await limited("withdrawal")) return { ok: false, error: "rate" };
  const parsed = withdrawalSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid(parsed.error);
  const locale = localeOf(form);
  const settings = await getSettings();
  await db.withdrawalRequest.create({ data: parsed.data });

  // Acknowledgement on a durable medium (Directive 2011/83/EU art. 11a).
  const receipt = withdrawalReceipt[locale](parsed.data, `${settings.address}, ${settings.city}`, new Date().toISOString().slice(0, 16).replace("T", " "));
  await sendMail({ to: parsed.data.email, ...receipt });
  await notifyTeam(`Withdrawal: order ${parsed.data.orderNumber}`, `${parsed.data.name} <${parsed.data.email}>\n${parsed.data.items}\n${parsed.data.reason ?? ""}`);
  return { ok: true };
}
