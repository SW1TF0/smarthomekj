"use client";

import { AdminForm, euroToCents, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, Empty, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { getAdminSettings, saveSettings, useAdminData } from "@/lib/admin-store";
import { can } from "@/lib/permissions";
import { defaultSettings, type SiteSettings } from "@/lib/settings";

type FieldDef = { key: keyof SiteSettings; label: string; type?: "money" | "bool" };

const groups: { title: string; hint?: string; fields: FieldDef[] }[] = [
  {
    title: "Включване и изключване",
    hint: "Махнете отметката и натиснете „Запази“, за да скриете нещо от сайта. Можете да го включите отново по всяко време.",
    fields: [
      { key: "bankTransferEnabled", label: "Плащане с банков превод", type: "bool" },
      { key: "codEnabled", label: "Плащане с наложен платеж", type: "bool" },
      { key: "chatEnabled", label: "Чат на сайта", type: "bool" },
    ],
  },
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
    ],
  },
  {
    title: "Калкулатор: цени за монтаж (с ДДС)",
    hint: "Калкулаторът на сайта смята устройствата по цените в магазина, а монтажа по тези цени за брой. Горната граница на диапазона е с 25% повече за монтажа.",
    fields: [
      { key: "installBaseCents", label: "Посещение, настройка на приложението и обучение (веднъж) (€)", type: "money" },
      { key: "installPairCents", label: "Лесно устройство: лампа, сензор, контакт, колона, рутер (€)", type: "money" },
      { key: "installWallCents", label: "Модул в конзола: умен ключ, щори (€)", type: "money" },
      { key: "installMountCents", label: "Камера (€)", type: "money" },
      { key: "installProCents", label: "Брава, видеозвънец, термостат, измерване в таблото (€)", type: "money" },
    ],
  },
  {
    title: "Чат за поддръжка",
    hint: "Ботът отговаря от „Въпроси и отговори“. Когато не знае отговора, дава вашия имейл и телефон или предлага човек от екипа.",
    fields: [
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
  if (!can(admin, "settings")) return <Empty text="Нямате достъп до настройките." />;
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
