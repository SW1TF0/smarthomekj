"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { euroToCents } from "@/components/admin/admin-form";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, Empty, Loading, PageHeader, inputCls, labelCls } from "@/components/admin/ui";
import bg from "@/i18n/dictionaries/bg";
import { authError, getAdminSettings, listAllProducts, saveCalculator, useAdminData } from "@/lib/admin-store";
import {
  defaultSetup,
  isBuiltin,
  PROPERTY_TYPES,
  qtyFor,
  QTY_MAX,
  setupFrom,
  SYSTEM_ICONS,
  systemTitle,
  type CalcItem,
  type CalcSetup,
  type CalcSystem,
  type PropertyType,
  type QtyPer,
  type QtyRule,
} from "@/lib/calculator";
import { formatMoney } from "@/lib/money";
import { can } from "@/lib/permissions";
import { localizeProduct, starterProducts, type ProductDoc } from "@/lib/products";
import { defaultSettings } from "@/lib/settings";

const builtinNames = bg.calculator.systems;

const typeLabels: Record<PropertyType, string> = { apartment: "Апартамент", house: "Къща", office: "Офис" };
/** A sample home for each type, so the owner sees what a rule gives. */
const samples: Record<PropertyType, { type: PropertyType; rooms: number; floors: number; label: string }> = {
  apartment: { type: "apartment", rooms: 3, floors: 1, label: "3 стаи" },
  house: { type: "house", rooms: 6, floors: 2, label: "6 стаи, 2 етажа" },
  office: { type: "office", rooms: 6, floors: 1, label: "6 стаи" },
};
const perLabels: Record<QtyPer, { option: string; suffix: string }> = {
  home: { option: "Точен брой", suffix: "бр." },
  room: { option: "За всяка стая", suffix: "бр. на стая" },
  floor: { option: "За всеки етаж", suffix: "бр. на етаж" },
  rooms: { option: "1 бр. на няколко стаи", suffix: "стаи за 1 бр." },
};
const iconLabels: Record<string, string> = {
  lighting: "Лампа",
  access: "Катинар",
  cameras: "Камера",
  heating: "Термометър",
  blinds: "Щори",
  sensors: "Щит",
  network: "Wi-Fi",
  sound: "Музика",
  energy: "Ток",
  climate: "Климат",
  security: "Сигурност",
  cleaning: "Почистване",
  entertainment: "Забавление",
  hubs: "Управление",
};

const emptyRule = (): Record<PropertyType, QtyRule> => ({ apartment: { n: 1, per: "home" }, house: { n: 1, per: "home" }, office: { n: 1, per: "home" } });

export default function CalculatorSettingsPage() {
  const admin = useAdmin();
  const { data, error } = useAdminData(() => Promise.all([getAdminSettings(), listAllProducts()]));
  const [setup, setSetup] = useState<CalcSetup | null>(null);
  const [state, setState] = useState<{ ok?: boolean; error?: string; busy?: boolean }>({});

  useEffect(() => {
    if (data && !setup) setSetup(setupFrom(data[0]));
  }, [data, setup]);

  // Before the starter catalogue is loaded into the database the shop shows it as is, so offer it here too.
  const products = useMemo(() => (data ? (data[1].length ? data[1] : starterProducts) : []), [data]);

  if (!can(admin, "settings")) return <Empty text="Нямате достъп до настройките." />;
  if (!data || !setup) return <Loading error={error} />;

  const change = (next: CalcSetup) => {
    setSetup(next);
    setState({});
  };
  const setSystem = (i: number, patch: Partial<CalcSystem>) => change({ ...setup, systems: setup.systems.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const moveSystem = (i: number, by: number) => {
    const list = [...setup.systems];
    const [s] = list.splice(i, 1);
    list.splice(Math.max(0, Math.min(list.length, i + by)), 0, s);
    change({ ...setup, systems: list });
  };

  async function save() {
    if (!setup) return;
    const unnamed = setup.systems.find((s) => !isBuiltin(s.key) && !s.names.bg.trim());
    if (unnamed) return setState({ error: "Дайте име на всяка нова система (поне на български)." });
    setState({ busy: true });
    try {
      await saveCalculator(setup);
      setState({ ok: true });
    } catch (e) {
      setState({ error: authError(e) });
    }
  }

  return (
    <>
      <PageHeader
        title="Калкулатор"
        subtitle="Тук решавате какво смята калкулаторът на сайта: кои системи има, кои продукти добавя всяка, колко броя и колко струва монтажът. Цената на самите продукти идва от „Продукти“."
        action={
          <Link href="/bg/calculator/" target="_blank" className="btn btn-sm bg-white ring-1 ring-line">
            Виж калкулатора ↗
          </Link>
        }
      />

      <div className="space-y-6 pb-28">
        <Card>
          <h2 className="font-semibold">Общи цени за монтаж (с ДДС)</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Посещение, настройка на приложението и обучение, веднъж (€)</label>
              <MoneyInput cents={setup.baseCents} onChange={(baseCents) => change({ ...setup, baseCents })} />
            </div>
            <div>
              <label className={labelCls}>Резерв за трудни случаи: горната граница на цената за монтаж е с толкова % повече</label>
              <NumberInput value={setup.spreadPercent} min={0} max={200} onChange={(spreadPercent) => change({ ...setup, spreadPercent })} />
            </div>
          </div>
        </Card>

        {setup.systems.map((sys, i) => (
          <SystemCard
            key={sys.key}
            sys={sys}
            first={i === 0}
            last={i === setup.systems.length - 1}
            products={products}
            hubs={setup.hubs}
            onChange={(patch) => setSystem(i, patch)}
            onMove={(by) => moveSystem(i, by)}
            onRemove={() => change({ ...setup, systems: setup.systems.filter((_, j) => j !== i) })}
          />
        ))}

        <button
          type="button"
          className="btn btn-sm w-full bg-white ring-1 ring-line"
          onClick={() =>
            change({
              ...setup,
              systems: [
                ...setup.systems,
                { key: `s-${Date.now().toString(36)}`, enabled: true, names: { bg: "", en: "", tr: "" }, icon: "hubs", items: [] },
              ],
            })
          }
        >
          + Нова система (например „Почистване“)
        </button>

        <Card>
          <h2 className="font-semibold">Контролери (хъбове)</h2>
          <p className="mt-1 text-[13px] text-mute">
            Някои устройства не работят без контролер. Калкулаторът добавя контролера само веднъж, когато клиентът избере устройство, което го иска. Кое устройство иска контролер избирате при самото устройство.
          </p>
          <div className="mt-4 space-y-3">
            {setup.hubs.map((hub, i) => (
              <div key={i} className="grid items-end gap-3 rounded-2xl bg-cloud/60 p-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                <div>
                  <label className={labelCls}>Продукт</label>
                  <ProductSelect value={hub.slug} products={products} onChange={(slug) => change({ ...setup, hubs: setup.hubs.map((h, j) => (j === i ? { ...h, slug } : h)) })} />
                </div>
                <div>
                  <label className={labelCls}>Монтаж (€)</label>
                  <MoneyInput cents={hub.installCents} onChange={(installCents) => change({ ...setup, hubs: setup.hubs.map((h, j) => (j === i ? { ...h, installCents } : h)) })} />
                </div>
                <button
                  type="button"
                  className="h-10 px-2 text-[13px] text-danger hover:underline"
                  onClick={() =>
                    change({
                      ...setup,
                      hubs: setup.hubs.filter((_, j) => j !== i),
                      systems: setup.systems.map((s) => ({ ...s, items: s.items.map((it) => (it.hub === hub.slug ? { ...it, hub: "" } : it)) })),
                    })
                  }
                >
                  Махни
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="mt-3 text-[14px] text-link hover:underline" onClick={() => change({ ...setup, hubs: [...setup.hubs, { slug: "", installCents: 0 }] })}>
            + Добави контролер
          </button>
        </Card>

        <p className="text-[13px] text-mute">
          Искате да започнете отначало?{" "}
          <button
            type="button"
            className="text-link hover:underline"
            onClick={() => {
              if (window.confirm("Да върна ли началните системи и продукти? Вашите промени тук ще се изгубят, ако ги запазите.")) {
                change(defaultSetup({ ...defaultSettings, ...data[0] }));
              }
            }}
          >
            Върни началните настройки
          </button>
        </p>
      </div>

      {/* Save bar stays in view while scrolling a long list. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:left-64">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 md:px-10">
          <button type="button" className="btn btn-primary btn-sm" disabled={state.busy} onClick={save}>
            {state.busy ? "…" : "Запази"}
          </button>
          {state.ok && (
            <p className="text-[14px] text-success" role="status">
              Запазено. Калкулаторът на сайта вече смята така.
            </p>
          )}
          {state.error && (
            <p className="text-[14px] text-danger" role="alert">
              {state.error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function SystemCard({
  sys,
  first,
  last,
  products,
  hubs,
  onChange,
  onMove,
  onRemove,
}: {
  sys: CalcSystem;
  first: boolean;
  last: boolean;
  products: ProductDoc[];
  hubs: CalcSetup["hubs"];
  onChange: (patch: Partial<CalcSystem>) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
}) {
  const builtin = isBuiltin(sys.key);
  const [renaming, setRenaming] = useState(!builtin && !sys.names.bg);
  const setItem = (i: number, patch: Partial<CalcItem>) => onChange({ items: sys.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });

  return (
    <Card className={sys.enabled ? "" : "opacity-60"}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="mr-auto text-[18px] font-semibold">{sys.names.bg || (builtin ? systemTitle(sys, "bg", builtinNames) : "Нова система")}</h2>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={sys.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} /> Показва се на сайта
        </label>
        <div className="flex gap-1">
          <button type="button" className="h-8 w-8 rounded-full bg-cloud disabled:opacity-30" disabled={first} onClick={() => onMove(-1)} aria-label="Нагоре">
            ↑
          </button>
          <button type="button" className="h-8 w-8 rounded-full bg-cloud disabled:opacity-30" disabled={last} onClick={() => onMove(1)} aria-label="Надолу">
            ↓
          </button>
        </div>
        <button type="button" className="text-[13px] text-link hover:underline" onClick={() => setRenaming((v) => !v)}>
          {renaming ? "Скрий името" : "Име и иконка"}
        </button>
        {!builtin && (
          <button
            type="button"
            className="text-[13px] text-danger hover:underline"
            onClick={() => window.confirm("Да изтрия ли тази система?") && onRemove()}
          >
            Изтрий
          </button>
        )}
      </div>

      {renaming && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-cloud/60 p-3 md:grid-cols-4">
          {(["bg", "en", "tr"] as const).map((l) => (
            <div key={l}>
              <label className={labelCls}>Име ({l === "bg" ? "български" : l === "en" ? "английски" : "турски"})</label>
              <input
                className={inputCls}
                maxLength={60}
                value={sys.names[l]}
                placeholder={builtin ? (l === "bg" ? builtinNames[sys.key as keyof typeof builtinNames].title : "като на сайта") : l === "bg" ? "напр. Почистване" : "като на български"}
                onChange={(e) => onChange({ names: { ...sys.names, [l]: e.target.value } })}
              />
            </div>
          ))}
          <div>
            <label className={labelCls}>Иконка</label>
            <select className={inputCls} value={sys.icon} onChange={(e) => onChange({ icon: e.target.value })}>
              {SYSTEM_ICONS.map((k) => (
                <option key={k} value={k}>
                  {iconLabels[k] ?? k}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {sys.items.length === 0 && <p className="text-[14px] text-mute">Няма продукти. Системата не се показва на сайта, докато не добавите поне един.</p>}
        {sys.items.map((it, i) => (
          <ItemRow
            key={i}
            item={it}
            products={products}
            hubs={hubs}
            onChange={(patch) => setItem(i, patch)}
            onRemove={() => onChange({ items: sys.items.filter((_, j) => j !== i) })}
          />
        ))}
      </div>
      <button
        type="button"
        className="mt-3 text-[14px] text-link hover:underline"
        onClick={() => onChange({ items: [...sys.items, { slug: "", installCents: 0, hub: "", qty: emptyRule() }] })}
      >
        + Добави продукт
      </button>
    </Card>
  );
}

function ItemRow({
  item,
  products,
  hubs,
  onChange,
  onRemove,
}: {
  item: CalcItem;
  products: ProductDoc[];
  hubs: CalcSetup["hubs"];
  onChange: (patch: Partial<CalcItem>) => void;
  onRemove: () => void;
}) {
  const product = products.find((p) => p.slug === item.slug);
  const warning = !item.slug ? "Изберете продукт." : !product ? "Този продукт го няма в магазина и калкулаторът го пропуска." : !product.active ? "Продуктът е скрит в магазина и калкулаторът го пропуска." : "";
  const hubOptions = hubs.filter((h) => h.slug && h.slug !== item.slug);

  return (
    <div className="rounded-2xl bg-cloud/60 p-3">
      <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,220px)_auto]">
        <div>
          <label className={labelCls}>Продукт{product && ` · ${formatMoney(product.priceCents)} в магазина`}</label>
          <ProductSelect value={item.slug} products={products} onChange={(slug) => onChange({ slug })} />
        </div>
        <div>
          <label className={labelCls}>Монтаж за 1 бр. (€)</label>
          <MoneyInput cents={item.installCents} onChange={(installCents) => onChange({ installCents })} />
        </div>
        <div>
          <label className={labelCls}>Нужен контролер</label>
          <select className={inputCls} value={item.hub} onChange={(e) => onChange({ hub: e.target.value })}>
            <option value="">Не</option>
            {hubOptions.map((h) => (
              <option key={h.slug} value={h.slug}>
                {productName(products, h.slug)}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="h-10 px-2 text-[13px] text-danger hover:underline" onClick={onRemove}>
          Махни
        </button>
      </div>
      {warning && <p className="mt-2 text-[13px] text-amber-700">{warning}</p>}

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {PROPERTY_TYPES.map((type) => {
          const rule = item.qty[type];
          const sample = samples[type];
          const n = Math.min(QTY_MAX, qtyFor(rule, sample));
          return (
            <div key={type} className="rounded-xl bg-white p-3 ring-1 ring-line">
              <p className="text-[12px] font-semibold">{typeLabels[type]}</p>
              <div className="mt-2 flex gap-2">
                <select
                  className={`${inputCls} min-w-0 flex-1`}
                  value={rule.per}
                  aria-label={`${typeLabels[type]}: как се смята броят`}
                  onChange={(e) => {
                    const per = e.target.value as QtyPer;
                    onChange({ qty: { ...item.qty, [type]: { per, n: per === "rooms" && rule.n < 1 ? 2 : rule.n } } });
                  }}
                >
                  {(Object.keys(perLabels) as QtyPer[]).map((p) => (
                    <option key={p} value={p}>
                      {perLabels[p].option}
                    </option>
                  ))}
                </select>
                <div className="w-[72px] shrink-0">
                  <NumberInput
                    value={rule.n}
                    min={rule.per === "rooms" ? 1 : 0}
                    max={QTY_MAX}
                    label={`${typeLabels[type]}: брой`}
                    onChange={(v) => onChange({ qty: { ...item.qty, [type]: { ...rule, n: v } } })}
                  />
                </div>
              </div>
              <p className="mt-1.5 text-[12px] text-mute">
                {perLabels[rule.per].suffix} · напр. {sample.label} → <b className="text-ink">{n} бр.</b>
                {n === 0 && " (клиентът може да добави сам)"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function productName(products: ProductDoc[], slug: string) {
  const p = products.find((x) => x.slug === slug);
  return p ? localizeProduct(p, "bg").name || slug : slug;
}

function ProductSelect({ value, products, onChange }: { value: string; products: ProductDoc[]; onChange: (slug: string) => void }) {
  const known = products.some((p) => p.slug === value);
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— изберете продукт —</option>
      {value && !known && <option value={value}>{value} (няма го в магазина)</option>}
      {products.map((p) => (
        <option key={p.slug} value={p.slug}>
          {localizeProduct(p, "bg").name || p.slug}
          {p.active ? "" : " (скрит)"} · {formatMoney(p.priceCents)}
        </option>
      ))}
    </select>
  );
}

/** Euro amount typed freely (comma or dot); saved as cents when the field is left. */
function MoneyInput({ cents, onChange }: { cents: number; onChange: (cents: number) => void }) {
  const [text, setText] = useState((cents / 100).toFixed(2));
  useEffect(() => setText((cents / 100).toFixed(2)), [cents]);
  const commit = () => {
    const v = euroToCents(text || "0");
    if (Number.isFinite(v) && v >= 0) onChange(v);
    else setText((cents / 100).toFixed(2));
  };
  return <input className={inputCls} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} />;
}

function NumberInput({ value, min, max, label, onChange }: { value: number; min: number; max: number; label?: string; onChange: (n: number) => void }) {
  return (
    <input
      className={inputCls}
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const n = Math.round(Number(e.target.value));
        if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
      }}
    />
  );
}
