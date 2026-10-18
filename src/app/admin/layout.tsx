import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = { title: "SmartHomeKJ Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  const badges = admin
    ? await Promise.all([
        db.order.count({ where: { status: { in: ["PENDING", "PAID"] } } }),
        db.inquiry.count({ where: { status: "NEW" } }),
        db.chatConversation.count({ where: { unreadForAdmin: true, mode: { not: "CLOSED" } } }),
        db.privacyRequest.count({ where: { status: "OPEN" } }).then(async (n) => n + (await db.withdrawalRequest.count({ where: { status: "RECEIVED" } }))),
      ])
    : null;

  return (
    <html lang="bg" className={inter.variable}>
      <body className="bg-cloud">
        {admin && badges ? (
          <div className="min-h-screen md:flex">
            <AdminNav
              user={{ name: admin.name, role: admin.role }}
              badges={{ orders: badges[0], inquiries: badges[1], chats: badges[2], requests: badges[3] }}
            />
            <main className="min-w-0 flex-1 p-5 md:p-10">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
