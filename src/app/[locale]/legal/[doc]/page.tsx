import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { LEGAL_KEYS, LEGAL_UPDATED, type LegalKey } from "@/i18n/legal";
import { LegalBody } from "@/components/legal-body";

type Params = { params: Promise<{ locale: string; doc: string }> };

function isDoc(doc: string): doc is LegalKey {
  return (LEGAL_KEYS as string[]).includes(doc);
}

export function generateStaticParams() {
  return locales.flatMap((locale) => LEGAL_KEYS.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !isDoc(doc)) return {};
  return { title: getDictionary(locale).legal[doc] };
}

export default async function LegalPage({ params }: Params) {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !isDoc(doc)) notFound();
  const dict = getDictionary(locale);

  return (
    <article className="pt-20 pb-28 md:pt-28">
      <div className="container-apple max-w-[760px]">
        <h1 className="headline-lg">{dict.legal[doc]}</h1>
        <p className="mt-3 text-[14px] text-mute">
          {dict.legal.updated}: {new Date(LEGAL_UPDATED).toLocaleDateString(locale)}
        </p>
        <LegalBody locale={locale} doc={doc} />
        {doc === "returns" && (
          <Link href={`/${locale}/withdraw/`} className="btn btn-primary mt-10">
            {dict.legal.withdraw}
          </Link>
        )}
        {doc === "privacy" && (
          <Link href={`/${locale}/data-request/`} className="btn btn-primary mt-10">
            {dict.legal.dataRequest}
          </Link>
        )}
      </div>
    </article>
  );
}
