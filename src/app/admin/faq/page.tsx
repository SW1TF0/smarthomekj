"use client";

import { AdminForm, str } from "@/components/admin/admin-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { deleteRow, listAllFaqs, saveFaqDoc, useAdminData } from "@/lib/admin-store";
import type { FaqDoc } from "@/lib/products";

const LANGS = ["bg", "en", "tr"] as const;

function FaqFields({ faq }: { faq?: FaqDoc }) {
  const t = faq?.translations ?? {};
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {LANGS.map((l) => (
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
          <input name="keywords" defaultValue={faq?.keywords} className={inputCls} />
        </div>
        <div className="w-24">
          <label className={labelCls}>Подредба</label>
          <input name="sortOrder" type="number" defaultValue={faq?.sortOrder ?? 0} className={inputCls} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-[14px]">
          <input type="checkbox" name="active" defaultChecked={faq?.active ?? true} /> Активен
        </label>
      </div>
    </>
  );
}

function read(f: FormData): FaqDoc {
  return {
    translations: Object.fromEntries(LANGS.map((l) => [l, { q: str(f, `${l}.q`), a: str(f, `${l}.a`) }])),
    keywords: str(f, "keywords"),
    sortOrder: parseInt(str(f, "sortOrder") || "0", 10),
    active: f.get("active") === "on",
  };
}

export default function FaqAdmin() {
  const { data: faqs, error, reload } = useAdminData(listAllFaqs);
  if (!faqs) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Въпроси и отговори" subtitle="Показват се на страницата „Въпроси“ и чат ботът ги използва, за да отговаря." />
      <Card className="mb-8">
        <h2 className="mb-4 font-semibold">Нов въпрос</h2>
        <AdminForm submitLabel="Добави" successText="Добавено." resetOnSuccess onSubmit={async (f) => (await saveFaqDoc(null, read(f)), reload())}>
          <FaqFields />
        </AdminForm>
      </Card>
      <div className="space-y-4">
        {faqs.map((f) => (
          <Card key={f.id}>
            <AdminForm onSubmit={async (form) => (await saveFaqDoc(f.id, read(form)), reload())}>
              <FaqFields faq={f} />
            </AdminForm>
            <div className="mt-2">
              <ConfirmButton message="Да изтрия ли въпроса?" onConfirm={async () => (await deleteRow("faq", f.id), reload())}>
                Изтрий
              </ConfirmButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
