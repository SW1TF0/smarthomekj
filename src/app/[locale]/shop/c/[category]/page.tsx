import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopDelivery, ShopGrid } from "@/components/product-lists";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { breadcrumbJsonLd, categoriesWithPages, categoryPath, ldJson } from "@/lib/product-seo";
import { buildCatalogue } from "@/lib/catalogue";
import { absoluteUrl, localePath, pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; category: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const cats = await categoriesWithPages();
  return locales.flatMap((locale) => cats.map((category) => ({ locale, category })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isLocale(locale)) return {};
  const meta = getDictionary(locale).meta.pages.categories[category as keyof ReturnType<typeof getDictionary>["meta"]["pages"]["categories"]];
  if (!meta) return {};
  return pageMetadata({ locale, path: categoryPath(category), ...meta });
}

export default async function CategoryPage({ params }: Params) {
  const { locale, category } = await params;
  if (!isLocale(locale) || !(await categoriesWithPages()).includes(category)) notFound();
  const dict = getDictionary(locale);
  const name = dict.shop.categories[category as keyof typeof dict.shop.categories];
  const meta = dict.meta.pages.categories[category as keyof typeof dict.meta.pages.categories];
  const ld = breadcrumbJsonLd([
    [dict.shop.title, absoluteUrl(localePath(locale, "shop"))],
    [name, absoluteUrl(localePath(locale, categoryPath(category)))],
  ]);
  return (
    <section className="pt-16 pb-28 md:pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className="container-wide">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="headline-xl">{name}</h1>
            <p className="lead mt-3 max-w-[720px] text-mute">{meta.description}</p>
          </div>
          <ShopDelivery locale={locale} dict={dict} />
        </div>
        <ShopGrid locale={locale} dict={dict} category={category} pageCategories={await categoriesWithPages()} initial={await buildCatalogue()} />
      </div>
    </section>
  );
}
