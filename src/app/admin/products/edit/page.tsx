"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminForm, euroToCents, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, Empty, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { deleteProductDoc, getProductDoc, saveProductDoc, useAdminData } from "@/lib/admin-store";
import { CATEGORIES, type ProductDoc, type ProductTranslations } from "@/lib/products";

const langs = [
  { code: "bg", label: "Български (основен)" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
] as const;

function parse(f: FormData, current: ProductDoc | null): ProductDoc | string {
  const slug = current?.slug ?? str(f, "slug");
  if (!/^[a-z0-9-]+$/.test(slug)) return "Адрес (slug): само малки латински букви, цифри и тирета.";
  const category = str(f, "category");
  if (!(CATEGORIES as readonly string[]).includes(category)) return "Изберете категория.";
  const priceCents = euroToCents(str(f, "price"));
  if (!(priceCents > 0)) return "Въведете цена.";
  const compare = str(f, "compareAt");
  const imageUrl = str(f, "imageUrl");
  if (imageUrl && !/^https:\/\//.test(imageUrl)) return "Снимката трябва да е https:// адрес.";
  const translations: ProductTranslations = Object.fromEntries(
    langs.map(({ code }) => [
      code,
      {
        name: str(f, `${code}.name`),
        tagline: str(f, `${code}.tagline`),
        description: str(f, `${code}.description`),
        specs: str(f, `${code}.specs`).split("\n").map((s) => s.trim()).filter(Boolean),
      },
    ]),
  );
  if (!translations.bg?.name) return "Въведете поне име на български.";
  return {
    slug,
    sku: str(f, "sku"),
    category,
    priceCents,
    compareAtCents: compare ? euroToCents(compare) : null,
    stock: Math.max(0, parseInt(str(f, "stock") || "0", 10)),
    sortOrder: parseInt(str(f, "sortOrder") || "0", 10),
    imageUrl: imageUrl || null,
    active: f.get("active") === "on",
    featured: f.get("featured") === "on",
    translations,
  };
}

export default function ProductEditor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const admin = useAdmin();
  const { data, error } = useAdminData(async () => ({ product: id ? await getProductDoc(id) : null }), [id]);
  if (!data) return <Loading error={error} />;
  const product = data.product;
  if (id && !product) return <Empty text="Продуктът не е намерен." />;
  const t = product?.translations ?? {};
  const euro = (c?: number | null) => (c ? (c / 100).toFixed(2) : "");

  return (
    <>
      <PageHeader
        title={product ? "Редакция на продукт" : "Нов продукт"}
        action={
          <Link href="/admin/products/" className="text-[14px] text-link">
            ← Продукти
          </Link>
        }
      />
      <AdminForm
        className="space-y-6"
        onSubmit={async (f) => {
          const parsed = parse(f, product);
          if (typeof parsed === "string") return parsed;
          await saveProductDoc(parsed, !product);
          router.push("/admin/products/");
        }}
      >
        <Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Адрес (slug)</label>
              <input name="slug" required defaultValue={product?.slug} disabled={!!product} placeholder="aqara-hub-m3" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>SKU</label>
              <input name="sku" required defaultValue={product?.sku} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Категория</label>
              <select name="category" defaultValue={product?.category ?? "hubs"} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Подредба</label>
              <input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Цена € с ДДС</label>
              <input name="price" required inputMode="decimal" defaultValue={euro(product?.priceCents)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Предишна цена € (по желание)</label>
              <input name="compareAt" inputMode="decimal" defaultValue={euro(product?.compareAtCents)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Наличност (бр.)</label>
              <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Снимка (https:// адрес, по желание)</label>
              <input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} className={inputCls} />
            </div>
          </div>
          <p className="mt-3 text-[12px] text-mute">
            Предишна цена: по закон (Директива 98/6/ЕО) трябва да е най-ниската ви цена за последните 30 дни преди намалението.
          </p>
          <div className="mt-4 flex gap-6 text-[14px]">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Видим в магазина
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Показвай на началната страница
            </label>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          {langs.map((l) => (
            <Card key={l.code}>
              <h2 className="mb-4 font-semibold">{l.label}</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Име</label>
                  <input name={`${l.code}.name`} required={l.code === "bg"} defaultValue={t[l.code]?.name} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Кратко описание (едно изречение)</label>
                  <input name={`${l.code}.tagline`} defaultValue={t[l.code]?.tagline} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Описание</label>
                  <textarea name={`${l.code}.description`} rows={5} defaultValue={t[l.code]?.description} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Характеристики (по една на ред)</label>
                  <textarea name={`${l.code}.specs`} rows={5} defaultValue={t[l.code]?.specs?.join("\n")} className={inputCls} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AdminForm>

      {product && admin.role === "ADMIN" && (
        <div className="mt-8">
          <ConfirmButton
            message="Да изтрия ли продукта? Старите поръчки го пазят. Ако искате само да го скриете, махнете „Видим в магазина“."
            onConfirm={async () => {
              await deleteProductDoc(product.slug);
              router.push("/admin/products/");
            }}
          >
            Изтрий продукта
          </ConfirmButton>
        </div>
      )}
    </>
  );
}
