"use client";

import { AdminForm, euroToCents, str } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, Empty, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import { EmailSetup } from "@/components/admin/email-setup";
import { getAdminSettings, saveSettings, useAdminData } from "@/lib/admin-store";
import { can } from "@/lib/permissions";
import { defaultSettings, type SiteSettings } from "@/lib/settings";

type FieldDef = { key: keyof SiteSettings; label: string; type?: "money" | "bool" | "int" };

const groups: { title: string; id?: string; hint?: string; fields: FieldDef[] }[] = [
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
    title: "Имейли до клиентите",
    id: "emails",
    hint: "Сайтът праща имейлите от вашия Gmail чрез безплатната услуга EmailJS (200 имейла на месец). Настройва се веднъж, вижте стъпките отдолу.",
    fields: [
      { key: "emailServiceId", label: "Service ID (от EmailJS)" },
      { key: "emailTemplateId", label: "Template ID (от EmailJS)" },
      { key: "emailPublicKey", label: "Public Key (от EmailJS)" },
      { key: "notifyEmail", label: "Къде да идват известията за нови поръчки (празно = имейла за клиенти)" },
      { key: "emailOrderConfirm", label: "Потвърждение до клиента при нова поръчка", type: "bool" },
      { key: "emailStatusUpdates", label: "Имейл до клиента при нов статус на поръчката", type: "bool" },
      { key: "emailNotifyOwner", label: "Известие до мен при нова поръчка", type: "bool" },
    ],
  },
  {
    title: "Фактури",
    hint: "Фактурите взимат данните на фирмата отгоре. Ако вече сте издавали фактури другаде, напишете следващия свободен номер.",
    fields: [
      { key: "vatRegistered", label: "Фирмата е регистрирана по ДДС", type: "bool" },
      { key: "invoiceStartNumber", label: "Номер на първата фактура от сайта", type: "int" },
      { key: "invoicePlace", label: "Място на издаване (напр. София)" },
      { key: "invoiceCompiler", label: "Съставил (име, по желание)" },
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

/** Only the fields shown on this page; the rest of the settings document is left as it is. */
function read(f: FormData): Partial<SiteSettings> {
  const values: Record<string, unknown> = {};
  for (const { key, type } of groups.flatMap((g) => g.fields)) {
    const def = defaultSettings[key];
    if (typeof def === "boolean") values[key] = f.get(key) === "on";
    else if (type === "int") {
      const n = Math.floor(Number(str(f, key)));
      values[key] = Number.isFinite(n) && n > 0 ? n : def;
    }
    else if (typeof def === "number") {
      const cents = euroToCents(str(f, key) || "0");
      values[key] = Number.isFinite(cents) ? cents : def;
    } else values[key] = str(f, key);
  }
  return values as Partial<SiteSettings>;
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
          <Card key={g.title} className="scroll-mt-6">
            <h2 id={g.id} className="scroll-mt-6 font-semibold">
              {g.title}
            </h2>
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
                      inputMode={f.type === "money" ? "decimal" : f.type === "int" ? "numeric" : undefined}
                      defaultValue={f.type === "money" ? (Number(value) / 100).toFixed(2) : String(value)}
                      className={`${inputCls} ${placeholder ? "border-amber-400 bg-amber-50" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
            {g.id === "emails" && <EmailSetup settings={s} />}
          </Card>
        ))}
      </AdminForm>
    </>
  );
}
