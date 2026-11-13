// Product photos are uploaded to smartmenukj.com as PNG (https://smartmenukj.com/<name>.png, 100–200 KB each).
// The same site has WebP copies (img/shop/<name>.webp, ~13 KB) served from www, without the 301 from the bare
// domain. Other image URLs are used as they are.
const PNG_ON_SMARTMENU = /^https?:\/\/(?:www\.)?smartmenukj\.com\/([a-z0-9_-]+)\.png$/i;

/** The fast version of a product image URL (WebP on www.smartmenukj.com), or the URL itself. */
export function fastImage(url: string): string {
  const m = url.match(PNG_ON_SMARTMENU);
  return m ? `https://www.smartmenukj.com/img/shop/${m[1]}.webp` : url;
}
