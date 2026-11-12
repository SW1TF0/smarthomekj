import Link from "next/link";
import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { PromoPlaceholder } from "@/components/promo-placeholder";
import { CategoryIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { blackFriday } from "@/lib/black-friday";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMetadata({ locale, path: "black-friday", ...dict.meta.pages.blackFriday });
}

export default async function BlackFridayPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const t = dict.blackFriday;
  const categories = dict.shop.categories as Record<string, string>;
  return (
    <>
      <section className="bg-night pt-16 pb-16 text-center text-white md:pt-24 md:pb-24">
        <div className="container-apple max-w-[880px]">
          <p className="text-[17px] font-semibold text-white/60 md:text-[19px]">{t.eyebrow}</p>
          <h1 className="headline-hero mt-3">{t.title}</h1>
          <p className="lead mx-auto mt-6 max-w-[640px] text-white/70">{t.subtitle}</p>
          <div className="mx-auto mt-10 max-w-[560px]">
            <Countdown labels={t} dark />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/${locale}/shop`} className="btn btn-primary">
              {t.shop}
            </Link>
            <Link href={`/${locale}/contact`} className="link-chevron text-[19px] text-[#2997ff]">
              {t.consult}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-wide">
          <Reveal className="text-center">
            <h2 className="headline-lg">{t.offersTitle}</h2>
            <p className="lead mx-auto mt-4 max-w-[640px] text-mute">{t.offersText}</p>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-14 lg:grid-cols-3 md:gap-4">
            {blackFriday.offers.map((o, i) => (
              <Reveal as="li" key={o.category} delay={(i % 3) * 80}>
                <Link
                  href={`/${locale}/shop/?category=${o.category}`}
                  className="tile tile-hover flex h-full flex-col justify-between bg-cloud p-5 max-sm:rounded-[20px] sm:min-h-[220px] sm:p-8"
                >
                  <CategoryIcon category={o.category} size={30} className="text-ink" />
                  <div className="mt-6">
                    <h3 className="text-[19px] font-semibold leading-tight tracking-tight sm:text-[28px]">{categories[o.category] ?? o.category}</h3>
                    <p className="mt-3 text-[17px] text-ink-2">
                      {o.discount ? <span className="text-[24px] font-bold text-danger sm:text-[32px]">{o.discount}</span> : <PromoPlaceholder>{t.placeholder}</PromoPlaceholder>}{" "}
                      <span className="text-mute">{t.off}</span>
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
          <p className="mt-10 text-center text-[15px] text-mute">
            {t.termsLabel}: {blackFriday.terms ?? <PromoPlaceholder>{t.termsPlaceholder}</PromoPlaceholder>}
          </p>
        </div>
      </section>
    </>
  );
}
