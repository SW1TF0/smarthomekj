import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { ChatWidget } from "@/components/chat-widget";
import { CartProvider } from "@/components/cart-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { htmlLang, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getSettings } from "@/lib/settings";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Pages are static but refresh every minute, so admin changes (settings, products) show up quickly.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: `%s · SmartHomeKJ` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])),
    },
    openGraph: { title: dict.meta.title, description: dict.meta.description, siteName: "SmartHomeKJ", locale, type: "website" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const settings = await getSettings();

  return (
    <html lang={htmlLang[locale]} className={inter.variable}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">
          Skip to content
        </a>
        <CartProvider>
          <SiteHeader locale={locale} labels={dict.nav} />
          <main id="main">{children}</main>
          <SiteFooter locale={locale} dict={dict} settings={settings} />
          {settings.chatEnabled && (
            <ChatWidget
              locale={locale}
              labels={dict.chat}
              botName={settings.chatBotName}
              privacyHref={`/${locale}/legal/privacy`}
              privacyLabel={dict.legal.privacy}
            />
          )}
          <CookieBanner labels={dict.cookies} policyHref={`/${locale}/legal/cookies`} />
        </CartProvider>
      </body>
    </html>
  );
}
