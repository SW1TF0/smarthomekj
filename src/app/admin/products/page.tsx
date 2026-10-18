import Link from "next/link";
import { Badge, Empty, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { localizeProduct } from "@/lib/products";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const products = await db.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageHeader
        title="Продукти"
        subtitle="Цени с ДДС в евро. Наличността намалява автоматично при поръчка."
        action={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            + Нов продукт
          </Link>
        }
      />
      {saved && <p className="mb-4 rounded-2xl bg-green-50 p-3 text-[14px] text-green-800">Продуктът е запазен.</p>}
      {products.length === 0 ? (
        <Empty text="Няма продукти." />
      ) : (
        <Table head={["Продукт", "SKU", "Категория", "Цена", "Наличност", "Статус"]}>
          {products.map((p) => {
            const v = localizeProduct(p, "bg");
            return (
              <tr key={p.id} className="hover:bg-cloud/50">
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-link">
                    {v.name}
                  </Link>
                  {p.featured && <span className="ml-2 text-[11px] text-amber-600">★ на началната</span>}
                </Td>
                <Td className="text-mute">{p.sku}</Td>
                <Td>{p.category}</Td>
                <Td className="whitespace-nowrap">{formatMoney(p.priceCents)}</Td>
                <Td className={p.stock === 0 ? "text-danger" : p.stock <= 5 ? "text-amber-600" : ""}>{p.stock}</Td>
                <Td>{p.active ? <Badge value="DONE" /> : <Badge value="CLOSED" />}</Td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
