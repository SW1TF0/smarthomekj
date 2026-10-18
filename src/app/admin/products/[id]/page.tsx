import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/admin-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { CATEGORIES, type ProductTranslations } from "@/lib/products";
import { deleteProduct, saveProduct } from "../../actions";

const langs = [
  { code: "bg", label: "Български (основен)" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
] as const;

export default async function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = id === "new" ? null : await db.product.findUnique({ where: { id } });
  if (id !== "new" && !product) notFound();
  const t = parseJson<ProductTranslations>(product?.translations, {});
  const euro = (c?: number | null) => (c ? (c / 100).toFixed(2) : "");

  return (
    <>
      <PageHeader
        title={product ? "Редакция на продукт" : "Нов продукт"}
        action={
          <Link href="/admin/products" className="text-[14px] text-link">
            ← Продукти
          </Link>
        }
      />
      <AdminForm action={saveProduct.bind(null, product?.id ?? null)} className="space-y-6">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Slug (адрес)</label>
              <input name="slug" required defaultValue={product?.slug} placeholder="aqara-hub-m3" className={inputCls} />
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
              <label className={labelCls}>Снимка (URL, по желание)</label>
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

      {product && (
        <form action={deleteProduct.bind(null, product.id)} className="mt-8">
          <ConfirmButton message="Да изтрия ли продукта? Ако има поръчки, той само ще бъде скрит.">Изтрий продукта</ConfirmButton>
        </form>
      )}
    </>
  );
}
