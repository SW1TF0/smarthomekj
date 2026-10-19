"use client";

import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth, firestore, secondaryAuth } from "./firebase";
import { starterFaqs, starterProducts, type FaqDoc, type ProductDoc } from "./products";
import { defaultSettings, type SiteSettings } from "./settings";
import type { Permission } from "./permissions";
import type { OrderDoc } from "./store";

export type AdminRole = "ADMIN" | "EDITOR";
export type AdminProfile = { uid: string; email: string; name: string; role: AdminRole; permissions?: Permission[]; lastLoginAt?: Timestamp | null };

export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

function db() {
  const d = firestore();
  if (!d) throw new Error("Firebase is not configured");
  return d;
}

export function toDate(ts: Timestamp | Date | null | undefined) {
  if (!ts) return new Date(0);
  return ts instanceof Date ? ts : ts.toDate();
}

// ---------- Auth ----------

export type AuthState =
  | { status: "loading" }
  | { status: "signedOut"; setupDone: boolean }
  | { status: "noAccess"; user: User }
  | { status: "admin"; user: User; profile: AdminProfile };

async function setupDone() {
  try {
    return (await getDoc(doc(db(), "config", "setup"))).exists();
  } catch {
    return true;
  }
}

export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ status: "signedOut", setupDone: await setupDone() });
      try {
        const snap = await getDoc(doc(db(), "admins", user.uid));
        if (!snap.exists()) return setState({ status: "noAccess", user });
        setState({ status: "admin", user, profile: { uid: user.uid, ...(snap.data() as Omit<AdminProfile, "uid">) } });
        void updateDoc(snap.ref, { lastLoginAt: serverTimestamp() }).catch(() => {});
      } catch {
        setState({ status: "noAccess", user });
      }
    });
  }, []);
  return state;
}

export async function adminSignIn(email: string, password: string) {
  await signInWithEmailAndPassword(firebaseAuth()!, email.trim(), password);
}

export async function adminSignOut() {
  await signOut(firebaseAuth()!);
}

/** First run only: creates the owner account. firestore.rules allow this once, while config/setup does not exist. */
export async function createFirstAdmin(name: string, email: string, password: string) {
  const auth = firebaseAuth()!;
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const batch = writeBatch(db());
  batch.set(doc(db(), "admins", cred.user.uid), { email: email.trim().toLowerCase(), name: name || email, role: "ADMIN", createdAt: serverTimestamp() });
  batch.set(doc(db(), "config", "setup"), { ownerUid: cred.user.uid, createdAt: serverTimestamp() });
  await batch.commit();
  // Reload so the auth hook re-reads the new admin profile.
  window.location.reload();
}

export async function changeOwnPassword(current: string, next: string) {
  const user = firebaseAuth()!.currentUser!;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email!, current));
  await updatePassword(user, next);
}

// ---------- Generic helpers ----------

export type Row<T> = T & { id: string };

async function list<T>(name: string, order = "createdAt", max = 300): Promise<Row<T>[]> {
  const snap = await getDocs(query(collection(db(), name), orderBy(order, "desc"), limit(max)));
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

/** Loads data once and offers a reload; keeps admin pages simple. */
export function useAdminData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    load()
      .then((d) => alive && (setData(d), setError("")))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}

export async function countWhere(name: string, field: string, values: unknown[]) {
  const snap = await getCountFromServer(query(collection(db(), name), where(field, "in", values)));
  return snap.data().count;
}

// ---------- Orders ----------

export const listOrders = () => list<Omit<OrderDoc, "id">>("orders");

export async function getOrder(id: string) {
  const snap = await getDoc(doc(db(), "orders", id));
  return snap.exists() ? ({ ...(snap.data() as OrderDoc), id: snap.id } as OrderDoc) : null;
}

const STOCK_HELD = new Set(["PROCESSING", "SHIPPED", "DELIVERED"]);

/** Saves an order. Stock is taken when the order is confirmed and given back when it is cancelled or refunded. */
export async function saveOrder(order: OrderDoc, changes: { status: string; paymentStatus: string; trackingNumber: string; adminNotes: string }) {
  const batch = writeBatch(db());
  let stockApplied = !!order.stockApplied;
  const take = STOCK_HELD.has(changes.status) && !stockApplied;
  const giveBack = (changes.status === "CANCELLED" || changes.status === "REFUNDED") && stockApplied;
  if (take || giveBack) {
    for (const item of order.items) {
      const ref = doc(db(), "products", item.slug);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;
      const stock = Number(snap.data().stock ?? 0);
      batch.update(ref, { stock: Math.max(0, stock + (take ? -item.quantity : item.quantity)) });
    }
    stockApplied = take;
  }
  batch.update(doc(db(), "orders", order.id), { ...changes, stockApplied, updatedAt: serverTimestamp() });
  await batch.commit();
}

// ---------- Products ----------

export async function listAllProducts() {
  const snap = await getDocs(collection(db(), "products"));
  return snap.docs.map((d) => ({ ...(d.data() as ProductDoc), slug: d.id })).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProductDoc(slug: string) {
  const snap = await getDoc(doc(db(), "products", slug));
  return snap.exists() ? ({ ...(snap.data() as ProductDoc), slug: snap.id } as ProductDoc) : null;
}

export async function saveProductDoc(p: ProductDoc, isNew: boolean) {
  const ref = doc(db(), "products", p.slug);
  if (isNew && (await getDoc(ref)).exists()) throw new Error("Вече има продукт с този адрес (slug).");
  await setDoc(ref, { ...p, updatedAt: serverTimestamp() });
}

export const deleteProductDoc = (slug: string) => deleteDoc(doc(db(), "products", slug));

/** Copies the starter catalogue and FAQ into Firestore so they can be edited. Existing entries are kept. */
export async function loadStarterData() {
  const batch = writeBatch(db());
  const existing = new Set((await getDocs(collection(db(), "products"))).docs.map((d) => d.id));
  for (const p of starterProducts) if (!existing.has(p.slug)) batch.set(doc(db(), "products", p.slug), p);
  if ((await getDocs(query(collection(db(), "faq"), limit(1)))).empty) {
    for (const f of starterFaqs) batch.set(doc(collection(db(), "faq")), f);
  }
  if (!(await getDoc(doc(db(), "config", "settings"))).exists()) batch.set(doc(db(), "config", "settings"), defaultSettings);
  await batch.commit();
}

// ---------- Simple collections ----------

export type Inquiry = { name: string; email: string; phone: string; service: string; propertyType: string; message: string; locale: string; status: string; notes?: string; createdAt: Timestamp | null };
export type PrivacyRequest = { type: string; name: string; email: string; message: string; status: string; notes?: string; createdAt: Timestamp | null };
export type Withdrawal = { orderNumber: string; name: string; email: string; items: string; reason: string; locale: string; status: string; notes?: string; createdAt: Timestamp | null };

export const listInquiries = () => list<Inquiry>("inquiries");
export const listPrivacyRequests = () => list<PrivacyRequest>("privacyRequests", "createdAt", 100);
export const listWithdrawals = () => list<Withdrawal>("withdrawals", "createdAt", 100);

export const updateRow = (name: string, id: string, data: DocumentData) => updateDoc(doc(db(), name, id), data);
export const deleteRow = (name: string, id: string) => deleteDoc(doc(db(), name, id));

export async function findWithdrawalsForOrder(number: string) {
  const snap = await getDocs(query(collection(db(), "withdrawals"), where("orderNumber", "==", number)));
  return snap.size;
}

export async function orderIdsByNumber(numbers: string[]) {
  const out: Record<string, string> = {};
  for (let i = 0; i < numbers.length; i += 30) {
    const chunk = numbers.slice(i, i + 30);
    if (!chunk.length) continue;
    const snap = await getDocs(query(collection(db(), "orders"), where("number", "in", chunk)));
    snap.docs.forEach((d) => (out[d.data().number] = d.id));
  }
  return out;
}

// ---------- FAQ ----------

export async function listAllFaqs() {
  const snap = await getDocs(collection(db(), "faq"));
  return snap.docs.map((d) => ({ ...(d.data() as FaqDoc), id: d.id })).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveFaqDoc(id: string | null, f: FaqDoc) {
  await setDoc(id ? doc(db(), "faq", id) : doc(collection(db(), "faq")), f);
}

// ---------- Chats ----------

export type ChatRow = { visitorId: string; locale: string; mode: string; unreadForAdmin: boolean; visitorName?: string; visitorEmail?: string; createdAt: Timestamp | null; lastMessageAt: Timestamp | null };

export const listChats = () => list<ChatRow>("chats", "lastMessageAt", 150);

const joinedText: Record<string, string> = {
  bg: "Член на екипа ни се включи в разговора.",
  en: "A member of our team has joined the chat.",
  tr: "Ekibimizden biri sohbete katıldı.",
};

export async function adminReply(chatId: string, chat: ChatRow, content: string) {
  const batch = writeBatch(db());
  const messages = collection(db(), "chats", chatId, "messages");
  if (chat.mode !== "HUMAN") batch.set(doc(messages), { role: "SYSTEM", content: joinedText[chat.locale] ?? joinedText.bg, createdAt: serverTimestamp() });
  batch.set(doc(messages), { role: "ADMIN", content, createdAt: serverTimestamp() });
  batch.update(doc(db(), "chats", chatId), { mode: "HUMAN", unreadForAdmin: false, lastMessageAt: serverTimestamp() });
  await batch.commit();
}

export const setChatMode = (chatId: string, mode: "BOT" | "HUMAN" | "CLOSED") => updateDoc(doc(db(), "chats", chatId), { mode, unreadForAdmin: false });
export const markChatRead = (chatId: string) => updateDoc(doc(db(), "chats", chatId), { unreadForAdmin: false });

export async function deleteChat(chatId: string) {
  const msgs = await getDocs(collection(db(), "chats", chatId, "messages"));
  const batch = writeBatch(db());
  msgs.docs.forEach((m) => batch.delete(m.ref));
  batch.delete(doc(db(), "chats", chatId));
  await batch.commit();
}

// ---------- GDPR ----------

async function byEmail(name: string, field: string, value: string) {
  return (await getDocs(query(collection(db(), name), where(field, "==", value)))).docs;
}

/** Everything stored about one email address (GDPR art. 15 and 20). */
export async function exportCustomerData(email: string) {
  const variants = Array.from(new Set([email.trim(), email.trim().toLowerCase()]));
  const out: Record<string, unknown[]> = {};
  for (const [name, field] of [["orders", "email"], ["inquiries", "email"], ["privacyRequests", "email"], ["withdrawals", "email"], ["chats", "visitorEmail"]] as const) {
    const docs = [];
    for (const v of variants) docs.push(...(await byEmail(name, field, v)));
    const rows = [];
    for (const d of docs) {
      const row: Record<string, unknown> = { id: d.id, ...d.data() };
      if (name === "chats") row.messages = (await getDocs(collection(db(), "chats", d.id, "messages"))).docs.map((m) => m.data());
      rows.push(row);
    }
    out[name] = rows;
  }
  return out;
}

/** GDPR art. 17: removes inquiries and chats; orders stay for the 10-year accounting retention, minus optional notes. */
export async function eraseCustomerData(email: string) {
  const data = await exportCustomerData(email);
  for (const row of data.inquiries as { id: string }[]) await deleteRow("inquiries", row.id);
  for (const row of data.chats as { id: string }[]) await deleteChat(row.id);
  for (const row of data.orders as { id: string }[]) await updateRow("orders", row.id, { note: "", adminNotes: "" });
}

export async function consentCounts() {
  const out: { analytics: boolean; marketing: boolean; count: number }[] = [];
  for (const analytics of [true, false])
    for (const marketing of [true, false]) {
      const snap = await getCountFromServer(query(collection(db(), "consents"), where("analytics", "==", analytics), where("marketing", "==", marketing)));
      if (snap.data().count) out.push({ analytics, marketing, count: snap.data().count });
    }
  return out;
}

// ---------- Settings ----------

export async function getAdminSettings(): Promise<SiteSettings> {
  const snap = await getDoc(doc(db(), "config", "settings"));
  return { ...defaultSettings, ...(snap.data() as Partial<SiteSettings> | undefined) };
}

export const saveSettings = (s: SiteSettings) => setDoc(doc(db(), "config", "settings"), s);

// ---------- Team ----------

export async function listAdmins() {
  const snap = await getDocs(collection(db(), "admins"));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<AdminProfile, "uid">), uid: d.id }));
}

/** Creates a colleague's login on a second Firebase app instance, so the current admin stays signed in. */
export async function createAdmin(name: string, email: string, password: string, role: AdminRole, permissions: Permission[]) {
  const auth = secondaryAuth()!;
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await signOut(auth);
  await setDoc(doc(db(), "admins", cred.user.uid), {
    email: email.trim().toLowerCase(),
    name: name || email,
    role,
    permissions: role === "ADMIN" ? [] : permissions,
    createdAt: serverTimestamp(),
  });
}

export const updateAdminAccess = (uid: string, role: AdminRole, permissions: Permission[]) =>
  updateDoc(doc(db(), "admins", uid), { role, permissions: role === "ADMIN" ? [] : permissions });

export const removeAdmin = (uid: string) => deleteDoc(doc(db(), "admins", uid));

export function authError(e: unknown) {
  const code = (e as { code?: string }).code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Грешен имейл или парола.";
  if (code.includes("email-already-in-use")) return "Този имейл вече има акаунт.";
  if (code.includes("weak-password")) return "Паролата е твърде слаба (минимум 10 символа).";
  if (code.includes("too-many-requests")) return "Твърде много опити. Опитайте по-късно.";
  if (code.includes("operation-not-allowed")) return "Включете вход с имейл и парола във Firebase (Authentication → Sign-in method).";
  if (code.includes("permission-denied")) return "Нямате права за това действие.";
  return (e as Error).message || "Грешка. Опитайте отново.";
}
