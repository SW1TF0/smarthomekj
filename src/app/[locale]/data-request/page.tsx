import type { Metadata } from "next";
import { ActionForm, Field, SelectField } from "@/components/action-form";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { submitPrivacyRequest } from "@/lib/public-actions";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.legal.dataRequest, robots: { index: false } };
}

export default async function DataRequestPage({ params }: LocaleParams) {
  const { locale, dict } = await resolveLocale(params);
  const d = dict.dataRequest;
  return (
    <section className="pt-20 pb-28 md:pt-28">
      <div className="container-apple max-w-[720px]">
        <h1 className="headline-lg">{d.title}</h1>
        <p className="lead mt-4 text-mute">{d.subtitle}</p>
        <div className="mt-12">
          <ActionForm
            action={submitPrivacyRequest}
            locale={locale}
            submitLabel={d.submit}
            sendingLabel={dict.common.sending}
            successText={d.success}
            errorText={dict.common.error}
            invalidText={dict.checkout.errors.invalid}
          >
            <SelectField label={d.type} name="type" options={d.types} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={d.name} name="name" required autoComplete="name" />
              <Field label={d.email} name="email" type="email" required autoComplete="email" />
            </div>
            <Field label={d.message} name="message" textarea rows={4} />
          </ActionForm>
        </div>
      </div>
    </section>
  );
}
