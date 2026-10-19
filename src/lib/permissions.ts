import type { AdminProfile } from "./admin-store";

/** Admin sections a team member can be given. Administrators always have all of them, plus managing the team. */
export const PERMISSIONS = [
  { key: "orders", label: "Поръчки", href: "/admin/orders/" },
  { key: "products", label: "Продукти", href: "/admin/products/" },
  { key: "inquiries", label: "Запитвания", href: "/admin/inquiries/" },
  { key: "chats", label: "Чат", href: "/admin/chats/" },
  { key: "faq", label: "Въпроси (FAQ)", href: "/admin/faq/" },
  { key: "requests", label: "GDPR и откази", href: "/admin/requests/" },
  { key: "settings", label: "Настройки", href: "/admin/settings/" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];

// Team members added before permissions existed keep what they had: everything except Settings.
// Keep in sync with firestore.rules (function can).
export const LEGACY_PERMISSIONS: Permission[] = ["orders", "products", "inquiries", "chats", "faq", "requests"];

export function permissionsOf(p: Pick<AdminProfile, "role" | "permissions">): Permission[] {
  if (p.role === "ADMIN") return PERMISSIONS.map((x) => x.key);
  return p.permissions ?? LEGACY_PERMISSIONS;
}

export function can(p: Pick<AdminProfile, "role" | "permissions">, permission: Permission | "users") {
  if (p.role === "ADMIN") return true;
  return permission !== "users" && permissionsOf(p).includes(permission);
}

/** Which permission an admin URL needs, or null for pages everyone on the team may open. */
export function permissionForPath(path: string): Permission | null {
  return PERMISSIONS.find((x) => path.startsWith(x.href))?.key ?? null;
}
