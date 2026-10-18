import type { Metadata } from "next";
import { ActionForm, Field, LinkedText, SelectField } from "@/components/action-form";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { submitInquiry } from "@/lib/public-actions";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.nav.contact, description: dict.contact.subtitle };
}

export default async function ContactPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ service?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const { service } = await searchParams;
  const settings = await getSettings();
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
            action={submitInquiry}
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
              defaultValue={service && service in c.services ? service : "full"}
            />
            <Field label={c.fields.message} name="message" textarea required />
            <label className="flex items-start gap-3 text-[14px] text-ink-2">
              <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-accent" />
              <span>
                <LinkedText template={c.consent} links={{ privacy: { href: `/${locale}/legal/privacy`, label: dict.legal.privacy } }} />
              </span>
            </label>
          </ActionForm>

          <aside className="tile h-fit bg-cloud p-8">
            <h2 className="text-[21px] font-semibold tracking-tight">{c.infoTitle}</h2>
            <dl className="mt-5 space-y-4 text-[15px]">
              <div>
                <dt className="text-mute">Email</dt>
                <dd>
                  <a href={`mailto:${settings.email}`} className="text-link">
                    {settings.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-mute">{c.fields.phone.replace(/\s*\(.*\)/, "")}</dt>
                <dd>
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="text-link">
                    {settings.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-mute">{c.hours}</dt>
                <dd>{settings.workingHours}</dd>
              </div>
              <div>
                <dt className="text-mute">{dict.legal.imprint}</dt>
                <dd>
                  {settings.address}
                  <br />
                  {settings.city}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
