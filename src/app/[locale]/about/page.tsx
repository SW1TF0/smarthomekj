import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMetadata({ locale, path: "about", ...dict.meta.pages.about });
}

export default async function AboutPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const a = dict.about;

  return (
    <>
      <section className="relative overflow-hidden pt-24 pb-20 text-center md:pt-32">
        <div className="container-apple relative">
          <h1 className="headline-hero">{a.title}</h1>
          <p className="headline-md mx-auto mt-6 max-w-[800px] text-mute">{a.lead}</p>
        </div>
      </section>
      <section className="pb-24">
        <div className="container-apple mx-auto max-w-[760px] space-y-6">
          {a.story.map((p) => (
            <Reveal key={p}>
              <p className="lead text-ink-2">{p}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section bg-cloud">
        <div className="container-apple">
          <h2 className="headline-lg text-center">{a.valuesTitle}</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {a.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80} className="tile bg-white p-10">
                <h3 className="text-[32px] font-bold tracking-tight">{v.title}</h3>
                <p className="mt-3 text-[17px] text-ink-2">{v.text}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href={`/${locale}/contact`} className="btn btn-primary">
              {dict.nav.consultation}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
