"use client";

import { AdminForm, euroToCents, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, Empty, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { getAdminSettings, saveSettings, useAdminData } from "@/lib/admin-store";
import { defaultSettings, type SiteSettings } from "@/lib/settings";

type FieldDef = { key: keyof SiteSettings; label: string; type?: "money" | "bool" };

const groups: { title: string; hint?: string; fields: FieldDef[] }[] = [
  {
    title: "Данни за фирмата",
    hint: "Показват се в долната част на сайта, в Общите условия, Политиката за поверителност и в потвърждението на поръчката. Задължителни по Закона за електронната търговия.",
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
      { key: "bankIban", label: "IBAN (показва се след поръчка с банков превод)" },
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
    hint: "Ботът отговаря от „Въпроси и отговори“. Когато не знае отговора, дава вашия имейл и телефон или предлага човек от екипа.",
    fields: [
      { key: "chatEnabled", label: "Показвай чата на сайта", type: "bool" },
      { key: "chatBotName", label: "Име на бота" },
    ],
  },
];

function read(f: FormData): SiteSettings {
  const values = { ...defaultSettings } as Record<string, unknown>;
  for (const [key, def] of Object.entries(defaultSettings)) {
    if (typeof def === "boolean") values[key] = f.get(key) === "on";
    else if (typeof def === "number") {
      const cents = euroToCents(str(f, key) || "0");
      values[key] = Number.isFinite(cents) ? cents : def;
    } else values[key] = str(f, key);
  }
  return values as SiteSettings;
}

export default function SettingsPage() {
  const admin = useAdmin();
  const { data: s, error } = useAdminData(getAdminSettings);
  if (admin.role !== "ADMIN") return <Empty text="Само администратор може да променя настройките." />;
  if (!s) return <Loading error={error} />;

  return (
    <>
      <PageHeader title="Настройки" subtitle="Полетата в [скоби] са примерни и трябва да се попълнят преди пускане." />
      <AdminForm className="space-y-6" successText="Запазено. Сайтът показва новите данни веднага." onSubmit={(f) => saveSettings(read(f))}>
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
                const placeholder = typeof value === "string" && value.includes("[");
                return (
                  <div key={f.key}>
                    <label className={labelCls} htmlFor={f.key}>
                      {f.label}
                    </label>
                    <input
                      id={f.key}
                      name={f.key}
                      inputMode={f.type === "money" ? "decimal" : undefined}
                      defaultValue={f.type === "money" ? (Number(value) / 100).toFixed(2) : String(value)}
                      className={`${inputCls} ${placeholder ? "border-amber-400 bg-amber-50" : ""}`}
                    />
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
