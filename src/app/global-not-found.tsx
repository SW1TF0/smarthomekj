import type { Metadata } from "next";
import { siteIcons } from "@/lib/seo";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = { title: "404 · SmartHomeKJ", robots: { index: false }, icons: siteIcons };

export default function GlobalNotFound() {
  return (
    <html lang="bg">
      <body>
        {/* A product added in the admin after the last build has no page yet: show it from the live catalogue. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var m=location.pathname.match(/^(.*)\\/(bg|en|tr)\\/shop\\/([a-z0-9-]+)\\/?$/);if(m&&m[3]!=="product"&&m[3]!=="c")location.replace(m[1]+"/"+m[2]+"/shop/product/?p="+m[3]);})();`,
          }}
        />
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-[15px] font-semibold text-mute">404</p>
          <h1 className="headline-lg mt-2">Страницата не е намерена.</h1>
          <p className="lead mt-3 text-mute">Page not found · Sayfa bulunamadı</p>
          <a href={`${base}/bg/`} className="btn btn-primary mt-8">
            SmartHomeKJ
          </a>
        </main>
      </body>
    </html>
  );
}
