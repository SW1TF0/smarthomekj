import { AdminForm } from "@/components/admin/admin-form";
import { Card, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings, type SiteSettings } from "@/lib/settings";
import { updateSettings } from "../actions";

type FieldDef = { key: keyof SiteSettings; label: string; type?: "money" | "bool" | "textarea" };

const groups: { title: string; hint?: string; fields: FieldDef[] }[] = [
  {
    title: "Данни за фирмата",
    hint: "Показват се в долната част на сайта, в Общите условия, Политиката за поверителност и в имейлите. Задължителни по Закона за електронната търговия.",
    fields: [
      { key: "companyName", label: "Търговско име" },
      { key: "legalName", label: "Регистрирано наименование (напр. СмартХоум КЖ ЕООД)" },
      { key: "eik", label: "ЕИК" },
      { key: "vatNumber", label: "ДДС номер" },
      { key: "manager", label: "Управител" },
      { key: "address", label: "Адрес" },
      { key: "city", label: "Град и пощенски код" },
      { key: "country", label: "Държава" },
      { key: "email", label: "Имейл за клиенти" },
      { key: "phone", label: "Телефон" },
      { key: "workingHours", label: "Работно време" },
      { key: "dpoEmail", label: "Имейл за лични данни" },
      { key: "bankName", label: "Банка" },
      { key: "bankIban", label: "IBAN" },
      { key: "instagram", label: "Instagram URL" },
      { key: "facebook", label: "Facebook URL" },
    ],
  },
  {
    title: "Доставка и плащане",
    fields: [
      { key: "shippingCents", label: "Цена на доставка (€)", type: "money" },
      { key: "freeShippingFromCents", label: "Безплатна доставка над (€)", type: "money" },
      { key: "codEnabled", label: "Наложен платеж", type: "bool" },
      { key: "bankTransferEnabled", label: "Банков превод", type: "bool" },
    ],
  },
  {
    title: "Чат за поддръжка",
    hint: "С ANTHROPIC_API_KEY ботът отговаря с изкуствен интелект. Без ключ отговаря от „Въпроси и отговори“.",
    fields: [
      { key: "chatEnabled", label: "Показвай чата на сайта", type: "bool" },
      { key: "chatAiEnabled", label: "AI отговори (ако има ключ)", type: "bool" },
      { key: "chatBotName", label: "Име на бота" },
      { key: "chatExtraInstructions", label: "Допълнителни инструкции към бота (напр. промоции, срокове)", type: "textarea" },
    ],
  },
];

export default async function SettingsPage() {
  await requireAdmin("ADMIN");
  const s = await getSettings();

  return (
    <>
      <PageHeader title="Настройки" subtitle="Полетата в [скоби] са примерни и трябва да се попълнят преди пускане." />
      <AdminForm action={updateSettings} className="space-y-6">
        {groups.map((g) => (
          <Card key={g.title}>
            <h2 className="font-semibold">{g.title}</h2>
            {g.hint && <p className="mb-4 mt-1 text-[13px] text-mute">{g.hint}</p>}
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {g.fields.map((f) => {
                const value = s[f.key];
                if (f.type === "bool") {
                  return (
                    <label key={f.key} className="flex items-center gap-2 text-[14px]">
                      <input type="checkbox" name={f.key} defaultChecked={Boolean(value)} /> {f.label}
                    </label>
                  );
                }
                const placeholder = typeof value === "string" && value.startsWith("[");
                return (
                  <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className={labelCls}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea name={f.key} rows={4} defaultValue={String(value)} className={inputCls} />
                    ) : (
                      <input
                        name={f.key}
                        defaultValue={f.type === "money" ? (Number(value) / 100).toFixed(2) : String(value)}
                        className={`${inputCls} ${placeholder ? "border-amber-400 bg-amber-50" : ""}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </AdminForm>
    </>
  );
}
