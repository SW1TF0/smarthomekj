"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { ORDER_STATUSES, restock } from "@/lib/orders";
import { CATEGORIES } from "@/lib/products";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { defaultSettings, saveSettings, type SiteSettings } from "@/lib/settings";

export type AdminState = { ok?: boolean; error?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const euroToCents = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);

// ---------- Auth ----------

export async function login(_: AdminState, form: FormData): Promise<AdminState> {
  if (!rateLimit(`login:${clientIp(await headers())}`, 8, 15 * 60_000)) return { error: "Твърде много опити. Опитайте след 15 минути." };
  const email = str(form, "email").toLowerCase();
  const user = await db.adminUser.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(str(form, "password"), user.passwordHash));
  if (!user || !ok) return { error: "Грешен имейл или парола." };
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Orders ----------

export async function updateOrder(id: string, form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return;

  const paymentStatus = str(form, "paymentStatus") || order.paymentStatus;
  await db.order.update({
    where: { id },
    data: {
      status,
      paymentStatus,
      trackingNumber: str(form, "trackingNumber") || null,
      adminNotes: str(form, "adminNotes") || null,
    },
  });
  // Cancelling an order that was not yet cancelled puts its stock back.
  if (status === "CANCELLED" && order.status !== "CANCELLED") await restock(id);

  if (form.get("notify") === "on" && status !== order.status) {
    const tracking = str(form, "trackingNumber");
    await sendMail({
      to: order.email,
      subject: `SmartHomeKJ: ${order.number} — ${statusLabels[status] ?? status}`,
      text: `Здравейте, ${order.name},\n\nСтатусът на поръчка ${order.number} е: ${statusLabels[status] ?? status}.${tracking ? `\nНомер на пратката: ${tracking}` : ""}\n\nSmartHomeKJ`,
    });
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

const statusLabels: Record<string, string> = {
  PENDING: "Чака обработка",
  PAID: "Платена",
  PROCESSING: "Обработва се",
  SHIPPED: "Изпратена",
  DELIVERED: "Доставена",
  CANCELLED: "Отказана",
  REFUNDED: "Възстановена сума",
};

// ---------- Products ----------

const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug: само малки латински букви, цифри и тирета"),
  sku: z.string().min(1),
  category: z.enum(CATEGORIES),
  priceCents: z.number().int().positive(),
  compareAtCents: z.number().int().positive().nullable(),
  stock: z.number().int().min(0),
  sortOrder: z.number().int(),
  imageUrl: z.string().url().nullable(),
  active: z.boolean(),
  featured: z.boolean(),
});

export async function saveProduct(id: string | null, _: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const compare = str(form, "compareAt");
  const parsed = productSchema.safeParse({
    slug: str(form, "slug"),
    sku: str(form, "sku"),
    category: str(form, "category"),
    priceCents: euroToCents(str(form, "price")),
    compareAtCents: compare ? euroToCents(compare) : null,
    stock: parseInt(str(form, "stock") || "0", 10),
    sortOrder: parseInt(str(form, "sortOrder") || "0", 10),
    imageUrl: str(form, "imageUrl") || null,
    active: form.get("active") === "on",
    featured: form.get("featured") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join(", ") };

  const translations = Object.fromEntries(
    ["bg", "en", "tr"].map((l) => [
      l,
      {
        name: str(form, `${l}.name`),
        tagline: str(form, `${l}.tagline`),
        description: str(form, `${l}.description`),
        specs: str(form, `${l}.specs`).split("\n").map((s) => s.trim()).filter(Boolean),
      },
    ]),
  );
  if (!translations.bg.name) return { error: "Въведете поне име на български." };

  const data = { ...parsed.data, translations: JSON.stringify(translations) };
  try {
    if (id) await db.product.update({ where: { id }, data });
    else await db.product.create({ data });
  } catch {
    return { error: "Slug или SKU вече се използва от друг продукт." };
  }
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(id: string) {
  await requireAdmin("ADMIN");
  // Products with orders are hidden instead of deleted, so order history stays intact.
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used) await db.product.update({ where: { id }, data: { active: false } });
  else await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

// ---------- Inquiries ----------

export async function updateInquiry(id: string, form: FormData) {
  await requireAdmin();
  await db.inquiry.update({ where: { id }, data: { status: str(form, "status"), notes: str(form, "notes") || null } });
  revalidatePath("/admin/inquiries");
}

export async function deleteInquiry(id: string) {
  await requireAdmin();
  await db.inquiry.delete({ where: { id } });
  revalidatePath("/admin/inquiries");
}

// ---------- Chats ----------

export async function adminChatReply(conversationId: string, form: FormData) {
  const admin = await requireAdmin();
  const content = str(form, "content");
  if (!content) return;
  const conversation = await db.chatConversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return;
  if (conversation.mode !== "HUMAN") {
    await db.chatMessage.create({
      data: { conversationId, role: "SYSTEM", content: joinedText[conversation.locale] ?? joinedText.bg },
    });
  }
  await db.chatMessage.create({ data: { conversationId, role: "ADMIN", content } });
  await db.chatConversation.update({
    where: { id: conversationId },
    data: { mode: "HUMAN", unreadForAdmin: false, lastMessageAt: new Date() },
  });
  void admin;
  revalidatePath(`/admin/chats/${conversationId}`);
}

const joinedText: Record<string, string> = {
  bg: "Член на екипа ни се включи в разговора.",
  en: "A member of our team has joined the chat.",
  tr: "Ekibimizden biri sohbete katıldı.",
};

export async function setChatMode(conversationId: string, mode: "BOT" | "HUMAN" | "CLOSED") {
  await requireAdmin();
  await db.chatConversation.update({ where: { id: conversationId }, data: { mode, unreadForAdmin: false } });
  revalidatePath(`/admin/chats/${conversationId}`);
  revalidatePath("/admin/chats");
}

export async function deleteChat(conversationId: string) {
  await requireAdmin();
  await db.chatConversation.delete({ where: { id: conversationId } });
  revalidatePath("/admin/chats");
  redirect("/admin/chats");
}

// ---------- FAQ ----------

export async function saveFaq(id: string | null, form: FormData) {
  await requireAdmin();
  const translations = Object.fromEntries(["bg", "en", "tr"].map((l) => [l, { q: str(form, `${l}.q`), a: str(form, `${l}.a`) }]));
  const data = {
    translations: JSON.stringify(translations),
    keywords: str(form, "keywords"),
    sortOrder: parseInt(str(form, "sortOrder") || "0", 10),
    active: form.get("active") === "on",
  };
  if (!translations.bg.q || !translations.bg.a) return;
  if (id) await db.faqEntry.update({ where: { id }, data });
  else await db.faqEntry.create({ data });
  revalidatePath("/admin/faq");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  await db.faqEntry.delete({ where: { id } });
  revalidatePath("/admin/faq");
}

// ---------- GDPR & withdrawals ----------

export async function updatePrivacyRequest(id: string, form: FormData) {
  await requireAdmin();
  await db.privacyRequest.update({ where: { id }, data: { status: str(form, "status"), notes: str(form, "notes") || null } });
  revalidatePath("/admin/requests");
}

export async function updateWithdrawal(id: string, form: FormData) {
  await requireAdmin();
  await db.withdrawalRequest.update({ where: { id }, data: { status: str(form, "status"), notes: str(form, "notes") || null } });
  revalidatePath("/admin/requests");
}

/** GDPR art. 17: erase a customer's personal data, keeping invoices that the law requires us to retain. */
export async function eraseCustomerData(form: FormData) {
  await requireAdmin("ADMIN");
  const email = str(form, "email").toLowerCase();
  if (!email.includes("@")) return;
  await db.inquiry.deleteMany({ where: { email } });
  await db.chatConversation.deleteMany({ where: { visitorEmail: email } });
  // Orders are anonymised only after the 10-year accounting retention, so we only strip optional fields.
  await db.order.updateMany({ where: { email }, data: { note: null, adminNotes: null } });
  revalidatePath("/admin/requests");
  redirect(`/admin/requests?erased=${encodeURIComponent(email)}`);
}

// ---------- Settings ----------

export async function updateSettings(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin("ADMIN");
  const values: Partial<SiteSettings> = {};
  for (const [key, def] of Object.entries(defaultSettings) as [keyof SiteSettings, unknown][]) {
    if (typeof def === "boolean") (values as Record<string, unknown>)[key] = form.get(key) === "on";
    else if (typeof def === "number") {
      const raw = str(form, key);
      if (raw) (values as Record<string, unknown>)[key] = key.endsWith("Cents") ? euroToCents(raw) : Number(raw);
    } else if (form.has(key)) (values as Record<string, unknown>)[key] = str(form, key);
  }
  await saveSettings(values);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Users ----------

export async function createAdminUser(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin("ADMIN");
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  if (!email.includes("@") || password.length < 10) return { error: "Нужен е валиден имейл и парола от поне 10 символа." };
  try {
    await db.adminUser.create({
      data: { email, name: str(form, "name") || email, role: str(form, "role") === "EDITOR" ? "EDITOR" : "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
  } catch {
    return { error: "Този имейл вече съществува." };
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteAdminUser(id: string) {
  const admin = await requireAdmin("ADMIN");
  if (admin.sub === id) return;
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function changePassword(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const user = await db.adminUser.findUnique({ where: { id: admin.sub } });
  if (!user || !(await bcrypt.compare(str(form, "current"), user.passwordHash))) return { error: "Текущата парола е грешна." };
  const next = str(form, "next");
  if (next.length < 10) return { error: "Новата парола трябва да е поне 10 символа." };
  await db.adminUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true };
}
