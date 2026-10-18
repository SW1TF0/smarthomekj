import type { Metadata } from "next";
import { FaqList } from "@/components/faq-list";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMetadata({ locale, path: "faq", ...dict.meta.pages.faq });
}

export default async function FaqPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  return (
    <section className="pt-20 pb-28 md:pt-28">
      <div className="container-apple max-w-[840px]">
        <h1 className="headline-xl text-center">{dict.faq.title}</h1>
        <p className="lead mt-4 text-center text-mute">{dict.faq.subtitle}</p>
        <FaqList locale={locale} />
      </div>
    </section>
  );
}
