"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/admin/actions";
import { LogoMark, MenuIcon } from "../icons";

const items = [
  { href: "/admin", label: "Табло", exact: true },
  { href: "/admin/orders", label: "Поръчки", badge: "orders" },
  { href: "/admin/products", label: "Продукти" },
  { href: "/admin/inquiries", label: "Запитвания", badge: "inquiries" },
  { href: "/admin/chats", label: "Чат", badge: "chats" },
  { href: "/admin/faq", label: "Въпроси (FAQ)" },
  { href: "/admin/requests", label: "GDPR и откази", badge: "requests" },
  { href: "/admin/settings", label: "Настройки", role: "ADMIN" },
  { href: "/admin/users", label: "Потребители" },
] as const;

export function AdminNav({ user, badges }: { user: { name: string; role: string }; badges: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-5">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <LogoMark /> SmartHomeKJ <span className="rounded bg-cloud px-1.5 py-0.5 text-[11px] text-mute">Admin</span>
        </Link>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}>
          <MenuIcon />
        </button>
      </div>
      <nav className={`${open ? "block" : "hidden"} px-3 pb-5 md:block`}>
        <ul className="space-y-0.5">
          {items
            .filter((i) => !("role" in i) || i.role === user.role)
            .map((item) => {
              const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
              const count = "badge" in item ? badges[item.badge] : 0;
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
          <p>{user.role === "ADMIN" ? "Администратор" : "Редактор"}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/bg" target="_blank" className="text-link">
              Към сайта ↗
            </Link>
            <form action={logout}>
              <button className="text-link">Изход</button>
            </form>
          </div>
        </div>
      </nav>
    </aside>
  );
}
