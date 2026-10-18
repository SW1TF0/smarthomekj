import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AdminShell } from "@/components/admin/admin-shell";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = { title: "SmartHomeKJ Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className={inter.variable}>
      <body className="bg-cloud">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
