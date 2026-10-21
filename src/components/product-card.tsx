import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { formatMoney } from "@/lib/money";
import { productHref, type ProductView } from "@/lib/products";
import { AddToCartButton } from "./add-to-cart";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product, locale, dict }: { product: ProductView; locale: Locale; dict: Dictionary }) {
  const href = productHref(locale, product.slug);
  return (
    <article className="tile tile-hover group flex flex-col bg-cloud max-sm:rounded-[20px]">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <ProductVisual category={product.category} imageUrl={product.imageUrl} alt={product.name} className="aspect-square sm:aspect-[4/3]" />
      </Link>
      <div className="flex flex-1 flex-col p-3.5 sm:p-6 sm:pt-5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#bf4800] sm:text-[12px]">
          {dict.shop.categories[product.category]}
        </p>
        <h3 className="mt-1 line-clamp-3 text-[15px] font-semibold leading-snug tracking-tight sm:line-clamp-none sm:text-[21px] sm:leading-tight">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 hidden text-[14px] text-mute line-clamp-2 sm:block">{product.tagline}</p>
        <div className="mt-auto flex flex-col gap-2.5 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-5">
          <div>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <p className="text-[13px] text-faint line-through">{formatMoney(product.compareAtCents, locale)}</p>
            )}
            <p className="text-[17px] font-semibold">{formatMoney(product.priceCents, locale)}</p>
            <p className="text-[11px] text-faint">{dict.common.inclVat}</p>
          </div>
          <AddToCartButton
            className="btn btn-primary btn-sm max-sm:w-full"
            disabled={product.stock <= 0}
            label={product.stock > 0 ? dict.common.buy : dict.common.outOfStock}
            addedLabel={dict.common.added}
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              category: product.category,
              imageUrl: product.imageUrl,
              priceCents: product.priceCents,
            }}
          />
        </div>
      </div>
    </article>
  );
}
