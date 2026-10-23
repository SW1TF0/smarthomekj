"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminSignOut, type AdminProfile } from "@/lib/admin-store";
import { can, permissionForPath } from "@/lib/permissions";
import { LogoMark, MenuIcon } from "../icons";

const items = [
  { href: "/admin/", label: "Табло", exact: true },
  { href: "/admin/orders/", label: "Поръчки", badge: "orders" },
  { href: "/admin/products/", label: "Продукти" },
  { href: "/admin/inquiries/", label: "Запитвания", badge: "inquiries" },
  { href: "/admin/chats/", label: "Чат", badge: "chats" },
  { href: "/admin/faq/", label: "Въпроси (FAQ)" },
  { href: "/admin/requests/", label: "GDPR и откази", badge: "requests" },
  { href: "/admin/settings/calculator/", label: "Калкулатор" },
  { href: "/admin/settings/", label: "Настройки" },
  { href: "/admin/users/", label: "Потребители" },
] as const;

export function AdminNav({ user, badges }: { user: AdminProfile; badges: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-5">
        <Link href="/admin/" className="flex items-center gap-2 font-semibold">
          <LogoMark /> SmartHomeKJ <span className="rounded bg-cloud px-1.5 py-0.5 text-[11px] text-mute">Admin</span>
        </Link>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}>
          <MenuIcon />
        </button>
      </div>
      <nav className={`${open ? "block" : "hidden"} px-3 pb-5 md:block`}>
        <ul className="space-y-0.5">
          {items
            .filter((i) => {
              const needed = permissionForPath(i.href);
              return needed ? can(user, needed) : true;
            })
            .map((item) => {
              const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
              // The most specific match wins, so Калкулатор (under Настройки) does not light up both.
              const active =
                "exact" in item
                  ? path === item.href
                  : path.startsWith(item.href) && !items.some((o) => o.href.length > item.href.length && o.href.startsWith(item.href) && path.startsWith(o.href));
              const count = "badge" in item ? (badges[item.badge] ?? 0) : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-[14px] ${active ? "bg-ink text-white" : "text-ink-2 hover:bg-cloud"}`}
                  >
                    {item.label}
                    {count > 0 && (
                      <span className={`rounded-full px-2 text-[11px] font-semibold ${active ? "bg-white text-ink" : "bg-accent text-white"}`}>{count}</span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
        <div className="mt-6 border-t border-line px-3 pt-4 text-[13px] text-mute">
          <p className="font-medium text-ink">{user.name}</p>
          <p>{user.role === "ADMIN" ? "Администратор" : "Служител"}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/bg/" target="_blank" className="text-link">
              Към сайта ↗
            </Link>
            <button className="text-link" onClick={() => adminSignOut()}>
              Изход
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
