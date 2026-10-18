import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, Field } from "@/components/action-form";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { submitWithdrawal } from "@/lib/public-actions";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { dict } = await resolveLocale(params);
  return { title: dict.withdraw.title, robots: { index: false } };
}

// Online withdrawal function required for distance contracts from 19 June 2026 (Directive (EU) 2023/2673).
export default async function WithdrawPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ order?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const { order } = await searchParams;
  const w = dict.withdraw;
  return (
    <section className="pt-20 pb-28 md:pt-28">
      <div className="container-apple max-w-[720px]">
        <h1 className="headline-lg">{w.title}</h1>
        <p className="lead mt-4 text-mute">{w.subtitle}</p>
        <p className="mt-3 text-[14px]">
          <Link href={`/${locale}/legal/returns`} className="link-chevron">
            {dict.legal.returns}
          </Link>
        </p>
        <div className="mt-12">
          <ActionForm
            action={submitWithdrawal}
            locale={locale}
            submitLabel={w.confirm}
            sendingLabel={dict.common.sending}
            successText={w.success}
            errorText={dict.common.error}
            invalidText={dict.checkout.errors.invalid}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={w.orderNumber} name="orderNumber" required defaultValue={order} />
              <Field label={w.email} name="email" type="email" required autoComplete="email" />
            </div>
            <Field label={w.name} name="name" required autoComplete="name" />
            <Field label={w.items} name="items" textarea rows={3} required />
            <Field label={w.reason} name="reason" textarea rows={3} />
          </ActionForm>
        </div>
      </div>
    </section>
  );
}
