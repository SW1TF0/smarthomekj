import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { CheckIcon, MinusIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { resolveLocale, type LocaleParams } from "@/i18n/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.calculator.metaTitle, description: dict.calculator.metaDescription };
}

export default async function CalculatorPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const c = dict.calculator;
  const [title1, title2] = c.title.split("\n");

  return (
    <>
      <section className="pt-16 pb-6 text-center md:pt-24 md:pb-12">
        <div className="container-apple">
          <p className="text-[17px] font-semibold text-mute">{c.eyebrow}</p>
          <h1 className="headline-xl mt-3">
            {title1}
            <br />
            <span className="text-mute">{title2}</span>
          </h1>
          <p className="lead mx-auto mt-5 max-w-[720px] text-ink-2">{c.subtitle}</p>
        </div>
      </section>

      <Calculator
        locale={locale}
        t={c}
        form={{
          consent: dict.contact.consent,
          privacy: dict.legal.privacy,
          sending: dict.common.sending,
          error: dict.common.error,
          invalid: dict.checkout.errors.invalid,
          name: dict.contact.fields.name,
          email: dict.contact.fields.email,
        }}
      />

      <section className="section bg-cloud">
        <div className="container-wide">
          <Reveal>
            <h2 className="headline-lg mx-auto max-w-[900px] text-center">{c.includedTitle}</h2>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Reveal className="tile h-full bg-white p-8">
              <h3 className="text-[21px] font-semibold tracking-tight">{c.included.title}</h3>
              <ul className="mt-5 space-y-3">
                {c.included.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[17px] text-ink-2">
                    <CheckIcon size={20} className="mt-0.5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={80} className="tile h-full bg-white p-8">
              <h3 className="text-[21px] font-semibold tracking-tight">{c.excluded.title}</h3>
              <ul className="mt-5 space-y-3">
                {c.excluded.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[17px] text-ink-2">
                    <MinusIcon size={20} className="mt-0.5 shrink-0 text-faint" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={160} className="tile h-full bg-white p-8">
              <h3 className="text-[21px] font-semibold tracking-tight">{c.why.title}</h3>
              {c.why.text.map((p) => (
                <p key={p} className="mt-4 text-[17px] text-ink-2">
                  {p}
                </p>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
