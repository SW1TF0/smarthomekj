"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useCart } from "./cart-provider";
import { BagIcon, CloseIcon, GlobeIcon, LogoMark, MenuIcon } from "./icons";

type Labels = {
  home: string;
  solutions: string;
  shop: string;
  about: string;
  contact: string;
  faq: string;
  demo: string;
  calculator: string;
  cart: string;
  consultation: string;
  menu: string;
  close: string;
  language: string;
};

export function SiteHeader({ locale, labels }: { locale: Locale; labels: Labels }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const links = [
    { href: `/${locale}/solutions`, label: labels.solutions },
    { href: `/${locale}/demo`, label: labels.demo },
    { href: `/${locale}/calculator`, label: labels.calculator },
    { href: `/${locale}/shop`, label: labels.shop },
    { href: `/${locale}/faq`, label: labels.faq },
    { href: `/${locale}/contact`, label: labels.contact },
  ];
  // "About" lives in the footer and the phone menu, so the top bar fits on tablets.
  const mobileLinks = [{ href: `/${locale}`, label: labels.home }, ...links.slice(0, 4), { href: `/${locale}/about`, label: labels.about }, ...links.slice(4)];

  // Path without the locale prefix, used to switch language on the same page.
  const rest = pathname.replace(/^\/(bg|en|tr)/, "");

  function chooseLocale(l: Locale) {
    document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-black/5">
        <nav className="container-wide flex h-12 items-center justify-between text-[13px]" aria-label="Main">
          <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold tracking-tight text-[15px]" aria-label="SmartHomeKJ">
            <LogoMark />
            <span>SmartHomeKJ</span>
          </Link>

          <ul className="hidden md:flex items-center gap-5 lg:gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`transition-colors hover:text-ink ${pathname.startsWith(l.href) ? "text-ink" : "text-ink/75"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-ink/75 hover:text-ink"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label={labels.language}
              >
                <GlobeIcon size={16} />
                <span className="uppercase">{locale}</span>
              </button>
              {langOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 mt-2 w-40 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-black/5"
                >
                  {locales.map((l) => (
                    <li key={l}>
                      <Link
                        href={`/${l}${rest}`}
                        onClick={() => chooseLocale(l)}
                        role="option"
                        aria-selected={l === locale}
                        hrefLang={l}
                        className={`block rounded-xl px-3 py-2 text-[14px] hover:bg-cloud ${l === locale ? "font-semibold" : ""}`}
                      >
                        {localeNames[l]}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link href={`/${locale}/cart`} className="relative rounded-full p-2 text-ink/75 hover:text-ink" aria-label={`${labels.cart} (${count})`}>
              <BagIcon size={18} />
              {ready && count > 0 && (
                <span className="absolute -right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>

            <Link href={`/${locale}/contact`} className="btn btn-primary btn-sm ml-2 hidden lg:inline-flex !py-1 !px-3.5 !text-[12px]">
              {labels.consultation}
            </Link>

            <button
              type="button"
              className="md:hidden rounded-full p-2"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? labels.close : labels.menu}
            >
              {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden fixed inset-x-0 top-12 bottom-0 bg-white/95 backdrop-blur-xl">
          <ul className="container-wide pt-6 space-y-1">
            {mobileLinks.map((l, i) => (
              <li key={l.href} style={{ animation: `fadeUp .5s ${i * 40}ms both` }}>
                <Link href={l.href} className="block py-3 text-[28px] font-semibold tracking-tight">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-6">
              <Link href={`/${locale}/contact`} className="btn btn-primary w-full">
                {labels.consultation}
              </Link>
            </li>
          </ul>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
        </div>
      )}
    </header>
  );
}
