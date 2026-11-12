import Link from "next/link";
import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { CategoryIcon } from "@/components/icons";
import { AllProducts } from "@/components/product-lists";
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
          <p className="lead mx-auto mt-6 max-w-[640px] text-white/80">{t.subtitle}</p>
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
            <p className="lead mx-auto mt-4 max-w-[680px] text-mute">{t.offersText}</p>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:gap-4 lg:grid-cols-3">
            {blackFriday.categories.map((key, i) => (
              <Reveal as="li" key={key} delay={(i % 3) * 80}>
                <Link
                  href={`/${locale}/shop/?category=${key}`}
                  className="tile tile-hover flex h-full flex-col justify-between bg-cloud p-5 max-sm:rounded-[20px] sm:min-h-[220px] sm:p-8"
                >
                  <CategoryIcon category={key} size={30} className="text-ink" />
                  <div className="mt-6">
                    <h3 className="text-[19px] font-semibold leading-tight tracking-tight sm:text-[28px]">{categories[key] ?? key}</h3>
                    <p className="mt-2 text-[17px]">
                      <span className="text-[24px] font-bold text-danger sm:text-[32px]">−{blackFriday.percent}%</span> <span className="text-mute">{t.off}</span>
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-cloud">
        <div className="container-wide">
          <Reveal>
            <h2 className="headline-lg text-center">{t.productsTitle}</h2>
          </Reveal>
          <AllProducts locale={locale} dict={dict} />
          <p className="mx-auto mt-10 max-w-[720px] text-center text-[14px] text-mute">{t.terms}</p>
        </div>
      </section>
    </>
  );
}
