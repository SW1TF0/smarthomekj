import generated from "@/data/product-images.json";

// WebP copies of the product photos, made at build time by scripts/product-images.mjs and served from this site
// (public/img/products/). A photo without a copy (e.g. added in the admin after the last build) is used as it is.
const copies: Record<string, string> = generated;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** The fast version of a product image URL (this site's WebP copy), or the URL itself. */
export function fastImage(url: string): string {
  const copy = copies[url];
  return copy ? `${basePath}${copy}` : url;
}
