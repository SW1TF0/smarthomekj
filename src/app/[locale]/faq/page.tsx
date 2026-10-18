import type { Metadata } from "next";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.faq.title };
}

export const dynamic = "force-dynamic";

export default async function FaqPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const rows = await db.faqEntry.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }).catch(() => []);
  const faqs = rows
    .map((r) => {
      const t = parseJson<Record<string, { q: string; a: string }>>(r.translations, {});
      return { id: r.id, ...(t[locale] ?? t.bg) };
    })
    .filter((f) => f.q);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <section className="pt-20 pb-28 md:pt-28">
      <div className="container-apple max-w-[840px]">
        <h1 className="headline-xl text-center">{dict.faq.title}</h1>
        <p className="lead mt-4 text-center text-mute">{dict.faq.subtitle}</p>
        <div className="mt-14 divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.id} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[21px] font-semibold tracking-tight">
                {f.q}
                <span className="text-[28px] font-light text-mute transition-transform duration-300 group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
