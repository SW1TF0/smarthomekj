import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { deleteFaq, saveFaq } from "../actions";

type T = Record<string, { q: string; a: string }>;

function FaqFields({ t, keywords, sortOrder, active }: { t: T; keywords?: string; sortOrder?: number; active?: boolean }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {(["bg", "en", "tr"] as const).map((l) => (
          <div key={l} className="space-y-2">
            <label className={labelCls}>Въпрос ({l.toUpperCase()})</label>
            <input name={`${l}.q`} defaultValue={t[l]?.q} required={l === "bg"} className={inputCls} />
            <label className={labelCls}>Отговор ({l.toUpperCase()})</label>
            <textarea name={`${l}.a`} defaultValue={t[l]?.a} required={l === "bg"} rows={4} className={inputCls} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <label className={labelCls}>Ключови думи за чат бота (със запетая, на всички езици)</label>
          <input name="keywords" defaultValue={keywords} className={inputCls} />
        </div>
        <div className="w-24">
          <label className={labelCls}>Подредба</label>
          <input name="sortOrder" type="number" defaultValue={sortOrder ?? 0} className={inputCls} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-[14px]">
          <input type="checkbox" name="active" defaultChecked={active ?? true} /> Активен
        </label>
      </div>
    </>
  );
}

export default async function FaqAdmin() {
  await requireAdmin();
  const faqs = await db.faqEntry.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Въпроси и отговори" subtitle="Показват се на страницата „Въпроси“ и чат ботът ги използва, за да отговаря." />
      <Card className="mb-8">
        <h2 className="mb-4 font-semibold">Нов въпрос</h2>
        <form action={saveFaq.bind(null, null)}>
          <FaqFields t={{}} />
          <button className="btn btn-primary btn-sm mt-4">Добави</button>
        </form>
      </Card>
      <div className="space-y-4">
        {faqs.map((f) => (
          <Card key={f.id}>
            <form action={saveFaq.bind(null, f.id)}>
              <FaqFields t={parseJson<T>(f.translations, {})} keywords={f.keywords} sortOrder={f.sortOrder} active={f.active} />
              <button className="btn btn-primary btn-sm mt-4">Запази</button>
            </form>
            <form action={deleteFaq.bind(null, f.id)} className="mt-2">
              <ConfirmButton message="Да изтрия ли въпроса?">Изтрий</ConfirmButton>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
