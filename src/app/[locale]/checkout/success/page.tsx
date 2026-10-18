import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { markOrderPaid } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
  searchParams,
}: LocaleParams & { searchParams: Promise<{ order?: string; session_id?: string; cancelled?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const { order: number, session_id, cancelled } = await searchParams;
  if (!number) notFound();
  let order = await db.order.findUnique({ where: { number } });
  if (!order) notFound();

  // Confirm the payment directly in case the webhook has not arrived yet.
  const stripe = getStripe();
  if (stripe && session_id && order.stripeSessionId === session_id && order.paymentStatus === "UNPAID") {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      await markOrderPaid(order.id);
      order = (await db.order.findUnique({ where: { id: order.id } }))!;
    }
  }

  const s = await getSettings();
  const c = dict.checkout;
  const total = formatMoney(order.totalCents, locale);

  if (cancelled && order.paymentStatus !== "PAID") {
    return (
      <section className="pt-24 pb-28 text-center">
        <div className="container-apple max-w-[640px]">
          <h1 className="headline-md">{c.cancelled}</h1>
          <p className="mt-4 text-mute">{c.successText.replace("{number}", order.number).replace("{email}", order.email)}</p>
          <Link href={`/${locale}/contact`} className="btn btn-primary mt-8">
            {dict.nav.contact}
          </Link>
        </div>
      </section>
    );
  }

  const paymentLine =
    order.paymentStatus === "PAID"
      ? c.successPaid
      : order.paymentMethod === "COD"
        ? c.successCod
        : order.paymentMethod === "BANK"
          ? c.successBank.replace("{amount}", total).replace("{iban}", s.bankIban).replace("{bank}", s.bankName).replace("{number}", order.number)
          : "";

  return (
    <section className="relative overflow-hidden pt-24 pb-28 text-center">
      <div className="container-apple relative max-w-[720px]">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-xl">
          <CheckIcon size={40} />
        </span>
        <h1 className="headline-lg mt-8">{c.successTitle}</h1>
        <p className="lead mt-4 text-mute">{c.successText.replace("{number}", order.number).replace("{email}", order.email)}</p>
        {paymentLine && <p className="mt-6 rounded-2xl bg-cloud p-5 text-[17px]">{paymentLine}</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={`/${locale}/shop`} className="btn btn-primary">
            {dict.cart.continue}
          </Link>
        </div>
        <p className="mt-10 text-[13px]">
          <Link href={`/${locale}/withdraw?order=${order.number}`} className="text-link hover:underline">
            {c.withdrawLink}
          </Link>
        </p>
      </div>
    </section>
  );
}
