import "server-only";
import { starterProducts, type ProductDoc } from "./products";

// The catalogue at build time: the active products from Firestore (public read, see firestore.rules),
// so products added in the admin get their own indexable page and a place in the sitemap at the next
// build (the deploy workflow also rebuilds every night). Falls back to the starter catalogue when
// Firestore cannot be reached (e.g. a build without network), so the build never fails because of it.

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "smarthomekj-ea651";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxy6lpPyxw0nMs5fXk83BCdaMof-vDVfw";

type FsValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FsValue> };
  arrayValue?: { values?: FsValue[] };
};

function plain(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue?.fields ?? {}).map(([k, x]) => [k, plain(x)]));
  if ("arrayValue" in v) return (v.arrayValue?.values ?? []).map(plain);
  return null;
}

async function fetchLive(): Promise<ProductDoc[] | null> {
  if (process.env.SKIP_LIVE_CATALOGUE === "1") return null;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: "products" }],
      where: { fieldFilter: { field: { fieldPath: "active" }, op: "EQUAL", value: { booleanValue: true } } },
    },
  };
  try {
    const res = await fetch(url, { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as { document?: { name: string; fields: Record<string, FsValue> } }[];
    const docs = rows
      .filter((r) => r.document)
      .map((r) => {
        const d = plain({ mapValue: { fields: r.document!.fields } }) as ProductDoc;
        return { ...d, slug: r.document!.name.split("/").pop()!, compareAtCents: d.compareAtCents ?? null, imageUrl: d.imageUrl ?? null };
      })
      .filter((d) => /^[a-z0-9-]+$/.test(d.slug) && typeof d.priceCents === "number" && d.translations);
    return docs.length ? docs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : null;
  } catch (e) {
    console.warn(`catalogue: Firestore not reachable at build time (${(e as Error).message}); using the starter catalogue`);
    return null;
  }
}

let cache: Promise<ProductDoc[]> | null = null;

/** Active products for pre-rendering and the sitemap (live from Firestore, else the starter catalogue). */
export function buildCatalogue(): Promise<ProductDoc[]> {
  cache ??= fetchLive().then((live) => live ?? starterProducts);
  return cache;
}
