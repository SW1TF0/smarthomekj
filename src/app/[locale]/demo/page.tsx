import type { Metadata } from "next";
import Link from "next/link";
import { SmartHomeDemo } from "@/components/demo/smart-home-demo";
import { Reveal } from "@/components/reveal";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMetadata({ locale, path: "demo", title: dict.demo.metaTitle, description: dict.demo.metaDescription });
}

export default async function DemoPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const d = dict.demo;
  const [title1, title2] = d.title.split("\n");
  const [outro1, outro2] = d.outroTitle.split("\n");

  return (
    <>
      <section className="pt-16 pb-10 text-center md:pt-24 md:pb-14">
        <div className="container-apple">
          <p className="inline-flex items-center gap-2 text-[17px] font-semibold text-mute">
            <span className="relative flex h-2.5 w-2.5">
              <span className="pulse-ring absolute inset-0 rounded-full bg-[#34c759]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-[#34c759]" />
            </span>
            {d.eyebrow}
          </p>
          <h1 className="headline-xl mt-3">
            {title1}
            <br />
            <span className="text-mute">{title2}</span>
          </h1>
          <p className="lead mx-auto mt-5 max-w-[720px] text-ink-2">{d.subtitle}</p>
        </div>
      </section>

      <section className="pb-24" aria-label={d.eyebrow}>
        <SmartHomeDemo locale={locale} t={d} />
      </section>

      <section className="section bg-night text-center text-white">
        <Reveal className="container-apple">
          <h2 className="headline-lg">
            {outro1}
            <br />
            <span className="text-white/55">{outro2}</span>
          </h2>
          <p className="lead mx-auto mt-5 max-w-[640px] text-white/60">{d.outroText}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={`/${locale}/calculator`} className="btn btn-primary">
              {d.outroCalculator}
            </Link>
            <Link href={`/${locale}/contact`} className="btn bg-white/10 text-white hover:bg-white/15">
              {d.outroConsultation}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
