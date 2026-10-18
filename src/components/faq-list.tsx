"use client";

import type { Locale } from "@/i18n/config";
import { useFaqs } from "@/lib/store";

export function FaqList({ locale }: { locale: Locale }) {
  const faqs = useFaqs(locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <div className="mt-14 divide-y divide-line border-y border-line">
        {faqs.map((f, i) => (
          <details key={i} className="group py-6">
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
