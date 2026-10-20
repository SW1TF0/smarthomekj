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
import { manifestUrl, pageMetadata, siteIcons, siteUrl } from "@/lib/seo";
import { SettingsProvider } from "@/lib/store";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter", display: "swap" });


export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  // Defaults for every page. Each indexed page adds its own canonical and hreflang links.
  const defaults = pageMetadata({ locale, title: dict.meta.title, absoluteTitle: true });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: `%s · SmartHomeKJ` },
    description: defaults.description,
    keywords: defaults.keywords,
    openGraph: defaults.openGraph,
    twitter: defaults.twitter,
    applicationName: "SmartHomeKJ",
    icons: siteIcons,
    manifest: manifestUrl,
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <html lang={htmlLang[locale]} className={inter.variable}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">
          Skip to content
        </a>
        <SettingsProvider>
        <CartProvider>
          <SiteHeader locale={locale} labels={dict.nav} />
          <main id="main">{children}</main>
          <SiteFooter locale={locale} dict={dict} />
          <ChatWidget locale={locale} labels={dict.chat} privacyHref={`/${locale}/legal/privacy`} privacyLabel={dict.legal.privacy} />
          <CookieBanner labels={dict.cookies} policyHref={`/${locale}/legal/cookies`} />
        </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
