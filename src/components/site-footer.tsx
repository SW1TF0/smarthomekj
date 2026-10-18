"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { useSettings } from "@/lib/store";
import { CookieSettingsButton } from "./cookie-banner";
import { LogoMark } from "./icons";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const settings = useSettings();
  const l = (path: string) => `/${locale}${path}`;
  const columns = [
    {
      title: dict.footer.explore,
      links: [
        { href: l("/solutions"), label: dict.nav.solutions },
        { href: l("/demo"), label: dict.nav.demo },
        { href: l("/calculator"), label: dict.nav.calculator },
        { href: l("/shop"), label: dict.nav.shop },
        { href: l("/about"), label: dict.nav.about },
      ],
    },
    {
      title: dict.footer.help,
      links: [
        { href: l("/contact"), label: dict.nav.consultation },
        { href: l("/faq"), label: dict.nav.faq },
        { href: l("/withdraw"), label: dict.legal.withdraw },
        { href: l("/data-request"), label: dict.legal.dataRequest },
      ],
    },
    {
      title: dict.footer.legal,
      links: [
        { href: l("/legal/terms"), label: dict.legal.terms },
        { href: l("/legal/returns"), label: dict.legal.returns },
        { href: l("/legal/privacy"), label: dict.legal.privacy },
        { href: l("/legal/cookies"), label: dict.legal.cookies },
        { href: l("/legal/accessibility"), label: dict.legal.accessibility },
        { href: l("/legal/imprint"), label: dict.legal.imprint },
      ],
    },
  ];

  return (
    <footer className="bg-cloud text-[12px] text-mute">
      <div className="container-apple py-12">
        <div className="grid gap-10 border-b border-line pb-10 md:grid-cols-4">
          <div>
            <Link href={l("")} className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <LogoMark />
              SmartHomeKJ
            </Link>
            <p className="mt-3 max-w-[220px]">{dict.footer.tagline}</p>
            <address className="mt-4 not-italic leading-relaxed">
              <a href={`mailto:${settings.email}`} className="hover:text-ink">
                {settings.email}
              </a>
              <br />
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-ink">
                {settings.phone}
              </a>
            </address>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 font-semibold text-ink">{col.title}</h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-ink hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {col.title === dict.footer.legal && (
                  <li>
                    <CookieSettingsButton label={dict.cookies.settings} />
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-6 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.legalName}. {dict.footer.rights}
          </p>
          <p>{dict.footer.consumer}</p>
        </div>
      </div>
    </footer>
  );
}
