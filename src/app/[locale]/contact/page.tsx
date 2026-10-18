import type { Metadata } from "next";
import { ActionForm, Field, LinkedText, SelectField } from "@/components/action-form";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { ContactInfo } from "@/components/contact-info";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.nav.contact, description: dict.contact.subtitle };
}

export default async function ContactPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const c = dict.contact;

  return (
    <section className="pt-20 pb-28 md:pt-28">
      <div className="container-apple">
        <div className="text-center">
          <h1 className="headline-xl">{c.title}</h1>
          <p className="lead mx-auto mt-4 max-w-[640px] text-mute">{c.subtitle}</p>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_320px]">
          <ActionForm
            kind="inquiry"
            locale={locale}
            submitLabel={c.submit}
            sendingLabel={dict.common.sending}
            successText={c.success}
            errorText={dict.common.error}
            invalidText={dict.checkout.errors.invalid}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={c.fields.name} name="name" required autoComplete="name" />
              <Field label={c.fields.email} name="email" type="email" required autoComplete="email" />
              <Field label={c.fields.phone} name="phone" type="tel" autoComplete="tel" />
              <SelectField label={c.fields.propertyType} name="propertyType" options={c.properties} />
            </div>
            <SelectField
              label={c.fields.service}
              name="service"
              options={c.services}
              defaultValue="full"
              queryParam="service"
            />
            <Field label={c.fields.message} name="message" textarea required />
            <label className="flex items-start gap-3 text-[14px] text-ink-2">
              <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-accent" />
              <span>
                <LinkedText template={c.consent} links={{ privacy: { href: `/${locale}/legal/privacy`, label: dict.legal.privacy } }} />
              </span>
            </label>
          </ActionForm>

          <ContactInfo
            labels={{ title: c.infoTitle, phone: c.fields.phone.replace(/\s*\(.*\)/, ""), hours: c.hours, address: dict.legal.imprint }}
          />
        </div>
      </div>
    </section>
  );
}
