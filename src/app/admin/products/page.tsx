"use client";

import Link from "next/link";
import { Badge, Empty, Loading, PageHeader, Table, Td } from "@/components/admin/ui";
import { listAllProducts, useAdminData } from "@/lib/admin-store";
import { formatMoney } from "@/lib/money";
import { localizeProduct } from "@/lib/products";

export default function ProductsPage() {
  const { data: products, error } = useAdminData(listAllProducts);
  if (!products) return <Loading error={error} />;

  return (
    <>
      <PageHeader
        title="Продукти"
        subtitle="Цени с ДДС в евро. Наличността намалява, когато потвърдите поръчка."
        action={
          <Link href="/admin/products/edit/" className="btn btn-primary btn-sm">
            + Нов продукт
          </Link>
        }
      />
      {products.length === 0 ? (
        <Empty text="Няма продукти в базата. Заредете началните продукти от таблото." />
      ) : (
        <Table head={["Продукт", "SKU", "Категория", "Цена", "Наличност", "Статус"]}>
          {products.map((p) => {
            const v = localizeProduct(p, "bg");
            return (
              <tr key={p.slug} className="hover:bg-cloud/50">
                <Td>
                  <Link href={`/admin/products/edit/?id=${p.slug}`} className="font-medium text-link">
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
