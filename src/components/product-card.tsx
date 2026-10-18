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
    <article className="tile tile-hover group flex flex-col bg-cloud">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <ProductVisual category={product.category} imageUrl={product.imageUrl} alt={product.name} className="aspect-[4/3]" />
      </Link>
      <div className="flex flex-1 flex-col p-6 pt-5">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#bf4800]">
          {dict.shop.categories[product.category]}
        </p>
        <h3 className="mt-1 text-[21px] font-semibold leading-tight tracking-tight">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-[14px] text-mute line-clamp-2">{product.tagline}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <p className="text-[13px] text-faint line-through">{formatMoney(product.compareAtCents, locale)}</p>
            )}
            <p className="text-[17px] font-semibold">{formatMoney(product.priceCents, locale)}</p>
            <p className="text-[11px] text-faint">{dict.common.inclVat}</p>
          </div>
          <AddToCartButton
            className="btn btn-primary btn-sm"
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
