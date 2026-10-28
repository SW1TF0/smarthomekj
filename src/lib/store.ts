"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { createContext, createElement, useContext, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { firestore } from "./firebase";
import { localizeProduct, starterFaqs, starterProducts, type FaqDoc, type ProductDoc, type ProductView } from "./products";
import { defaultSettings, type SiteSettings } from "./settings";

// ---------- Catalogue ----------

let productCache: ProductDoc[] | null = null;

export async function loadProducts(): Promise<ProductDoc[]> {
  const db = firestore();
  if (!db) return starterProducts;
  if (productCache) return productCache;
  try {
    const snap = await getDocs(query(collection(db, "products"), where("active", "==", true)));
    const rows = snap.docs.map((d) => ({ ...(d.data() as ProductDoc), slug: d.id }));
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
    // An empty collection means the starter data has not been loaded yet (Admin → Dashboard).
    productCache = rows.length ? rows : starterProducts;
    return productCache;
  } catch {
    return starterProducts;
  }
}

/** Products for a locale. Starts with the starter catalogue (pre-rendered) and swaps in live data. */
export function useProducts(locale: Locale, filter: { category?: string; featured?: boolean } = {}) {
  const pick = (rows: ProductDoc[]) =>
    rows
      .filter((p) => (!filter.category || p.category === filter.category) && (!filter.featured || p.featured))
      .map((p) => localizeProduct(p, locale));
  const [products, setProducts] = useState<ProductView[]>(() => pick(starterProducts));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    loadProducts().then((rows) => {
      if (!alive) return;
      setProducts(pick(rows));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, filter.category, filter.featured]);
  return { products, loading };
}

export function useProduct(slug: string | null, locale: Locale) {
  const [product, setProduct] = useState<ProductView | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    if (!slug) {
      setLoading(false);
      return;
    }
    loadProducts().then((rows) => {
      if (!alive) return;
      const p = rows.find((r) => r.slug === slug);
      setProduct(p ? localizeProduct(p, locale) : null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug, locale]);
  return { product, loading };
}

export async function loadFaqs(): Promise<FaqDoc[]> {
  const db = firestore();
  if (!db) return starterFaqs;
  try {
    const snap = await getDocs(query(collection(db, "faq"), where("active", "==", true)));
    const rows = snap.docs.map((d) => d.data() as FaqDoc).sort((a, b) => a.sortOrder - b.sortOrder);
    return rows.length ? rows : starterFaqs;
  } catch {
    return starterFaqs;
  }
}

export function useFaqs(locale: Locale) {
  const pick = (rows: FaqDoc[]) =>
    rows.flatMap((f) => {
      const t = f.translations[locale] ?? f.translations.bg;
      return t ? [t] : [];
    });
  const [items, setItems] = useState(() => pick(starterFaqs));
  useEffect(() => {
    loadFaqs().then((rows) => setItems(pick(rows)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
  return items;
}

// ---------- Company settings ----------

export async function loadSettings(): Promise<SiteSettings> {
  const db = firestore();
  if (!db) return defaultSettings;
  try {
    const snap = await getDoc(doc(db, "config", "settings"));
    return { ...defaultSettings, ...(snap.data() as Partial<SiteSettings> | undefined) };
  } catch {
    return defaultSettings;
  }
}

const SettingsContext = createContext<SiteSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);
  return createElement(SettingsContext.Provider, { value: settings }, children);
}

export function useSettings() {
  return useContext(SettingsContext);
}

// ---------- Public submissions (create-only in firestore.rules) ----------

export class NotConfiguredError extends Error {}

function requireDb() {
  const db = firestore();
  if (!db) throw new NotConfiguredError("Firebase is not configured");
  return db;
}

export type OrderItem = { slug: string; name: string; sku: string; priceCents: number; quantity: number };

export type OrderInput = {
  number: string;
  paymentMethod: "COD" | "BANK";
  locale: Locale;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  companyName: string;
  vatNumber: string;
  note: string;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  vatCents: number;
};

export type OrderDoc = OrderInput & {
  id: string;
  status: string;
  paymentStatus: string;
  adminNotes?: string;
  trackingNumber?: string;
  emails?: { kind: string; to: string; at: string; ok: boolean; error?: string }[];
  stockApplied?: boolean;
  createdAt: Timestamp | null;
  termsAcceptedAt: Timestamp | null;
};

export function newOrderNumber() {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const rand = Array.from(bytes, (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  return `KJ${date}-${rand}`;
}

export async function createOrder(order: OrderInput) {
  const db = requireDb();
  await addDoc(collection(db, "orders"), {
    ...order,
    status: "PENDING",
    paymentStatus: "UNPAID",
    createdAt: serverTimestamp(),
    termsAcceptedAt: serverTimestamp(),
  });
}

export async function createInquiry(data: { name: string; email: string; phone: string; service: string; propertyType: string; message: string; locale: Locale }) {
  await addDoc(collection(requireDb(), "inquiries"), { ...data, status: "NEW", createdAt: serverTimestamp() });
}

export async function createPrivacyRequest(data: { type: string; name: string; email: string; message: string }) {
  await addDoc(collection(requireDb(), "privacyRequests"), { ...data, status: "OPEN", createdAt: serverTimestamp() });
}

export async function createWithdrawal(data: { orderNumber: string; name: string; email: string; items: string; reason: string; locale: Locale }) {
  await addDoc(collection(requireDb(), "withdrawals"), { ...data, status: "RECEIVED", createdAt: serverTimestamp() });
}

export async function logConsent(data: { visitorId: string; analytics: boolean; marketing: boolean; version: string }) {
  const db = firestore();
  if (!db) return;
  try {
    await addDoc(collection(db, "consents"), { ...data, userAgent: navigator.userAgent.slice(0, 300), createdAt: serverTimestamp() });
  } catch {
    // Consent is also kept in the visitor's cookie; a failed log must not block the banner.
  }
}

// ---------- Support chat ----------

export type ChatRole = "USER" | "BOT" | "ADMIN" | "SYSTEM";
export type ChatMessage = { id: string; role: ChatRole; content: string; createdAt: Timestamp | null };
export type ChatMode = "BOT" | "HUMAN" | "CLOSED";

/** Chat ids are random and unguessable; the visitor keeps theirs in localStorage. */
export async function startChat(visitorId: string, locale: Locale) {
  const db = requireDb();
  const ref = doc(collection(db, "chats"));
  await setDoc(ref, { visitorId, locale, mode: "BOT", unreadForAdmin: true, createdAt: serverTimestamp(), lastMessageAt: serverTimestamp() });
  return ref.id;
}

export async function postChatMessage(chatId: string, role: "USER" | "BOT", content: string) {
  const db = requireDb();
  await addDoc(collection(db, "chats", chatId, "messages"), { role, content, createdAt: serverTimestamp() });
  if (role === "USER") await updateDoc(doc(db, "chats", chatId), { unreadForAdmin: true, lastMessageAt: serverTimestamp() });
}

export async function requestHuman(chatId: string, name: string, email: string) {
  await updateDoc(doc(requireDb(), "chats", chatId), { mode: "HUMAN", visitorName: name, visitorEmail: email, unreadForAdmin: true, lastMessageAt: serverTimestamp() });
}

export function watchChat(chatId: string, onMode: (mode: ChatMode) => void, onMessages: (messages: ChatMessage[]) => void, onMissing: () => void) {
  const db = firestore();
  if (!db) return () => {};
  const stopChat = onSnapshot(
    doc(db, "chats", chatId),
    (snap) => (snap.exists() ? onMode((snap.data().mode as ChatMode) ?? "BOT") : onMissing()),
    () => onMissing(),
  );
  const stopMessages = onSnapshot(query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc")), (snap) =>
    onMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))),
  );
  return () => {
    stopChat();
    stopMessages();
  };
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Keyword match of a visitor question against the FAQ. Returns null when nothing fits well. */
export async function faqAnswer(question: string, locale: Locale) {
  const faqs = await loadFaqs();
  const words = new Set(normalize(question));
  let best = { score: 0, answer: "" };
  for (const faq of faqs) {
    const entry = faq.translations[locale] ?? faq.translations.bg;
    if (!entry) continue;
    let score = 0;
    for (const k of normalize(`${faq.keywords} ${entry.q}`)) {
      for (const w of words) {
        if (w === k) score += 2;
        else if (w.length > 4 && k.length > 4 && (w.startsWith(k.slice(0, 5)) || k.startsWith(w.slice(0, 5)))) score += 1;
      }
    }
    if (score > best.score) best = { score, answer: entry.a };
  }
  return best.score >= 2 ? best.answer : null;
}
