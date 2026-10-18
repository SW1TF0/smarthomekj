import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { ProductVisual } from "@/components/product-visual";
import { Reveal } from "@/components/reveal";
import { resolveLocale, type LocaleParams } from "@/i18n/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.solutions.title, description: dict.solutions.subtitle };
}

export default async function SolutionsPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const s = dict.solutions;

  return (
    <>
      <section className="pt-20 pb-12 text-center md:pt-28">
        <div className="container-apple">
          <h1 className="headline-hero">{s.title}</h1>
          <p className="lead mx-auto mt-5 max-w-[640px] text-mute">{s.subtitle}</p>
        </div>
      </section>

      <div className="container-wide space-y-4 pb-24">
        {s.items.map((item, i) => (
          <Reveal key={item.key}>
            <section id={item.key} className="tile grid scroll-mt-20 items-center gap-0 bg-cloud md:grid-cols-2">
              <div className={`p-10 md:p-16 ${i % 2 ? "md:order-2" : ""}`}>
                <p className="text-[17px] font-semibold text-[#bf4800]">{item.title}</p>
                <h2 className="headline-lg mt-2">{item.lead}</h2>
                <ul className="mt-8 space-y-3">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[17px] text-ink-2">
                      <CheckIcon size={20} className="mt-0.5 shrink-0 text-success" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href={`/${locale}/contact?service=${item.key}`} className="btn btn-primary">
                    {dict.nav.consultation}
                  </Link>
                  <Link href={`/${locale}/shop?category=${item.key}`} className="link-chevron self-center">
                    {dict.nav.shop}
                  </Link>
                </div>
              </div>
              <ProductVisual category={item.key} alt={item.title} size="lg" className={`aspect-square h-full md:aspect-auto md:min-h-[560px] ${i % 2 ? "md:order-1" : ""}`} />
            </section>
          </Reveal>
        ))}
      </div>

      <section className="section bg-night text-center text-white">
        <Reveal className="container-apple">
          <h2 className="headline-lg">{s.ctaTitle}</h2>
          <p className="lead mx-auto mt-4 max-w-[600px] text-white/60">{s.ctaText}</p>
          <Link href={`/${locale}/contact`} className="btn btn-primary mt-10">
            {dict.home.ctaPrimary}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
