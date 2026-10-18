"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import {
  defaultConfig,
  estimate,
  FLOORS_MAX,
  parseConfig,
  PROPERTY_TYPES,
  QTY_MAX,
  ratesFrom,
  ROOMS_MAX,
  ROOMS_MIN,
  serializeConfig,
  serviceFor,
  SYSTEMS,
  systemCost,
  type CalcConfig,
  type CatalogueItem,
  type Line,
  type PropertyType,
  type SystemKey,
} from "@/lib/calculator";
import { formatMoney } from "@/lib/money";
import { localizeProduct, productHref, starterProducts } from "@/lib/products";
import { useProducts, useSettings } from "@/lib/store";
import { ActionForm, Field, LinkedText } from "./action-form";
import { useCart } from "./cart-provider";
import {
  BlindsIcon,
  BuildingIcon,
  CameraIcon,
  CategoryIcon,
  CheckIcon,
  HouseIcon,
  LinkIcon,
  LockIcon,
  MinusIcon,
  OfficeIcon,
  PlusIcon,
  ThermoIcon,
  WifiIcon,
} from "./icons";

type Labels = Dictionary["calculator"];
type FormLabels = {
  consent: string;
  privacy: string;
  sending: string;
  error: string;
  invalid: string;
  email: string;
  name: string;
};

const typeIcons: Record<PropertyType, typeof HouseIcon> = { apartment: BuildingIcon, house: HouseIcon, office: OfficeIcon };

const systemIcons: Record<SystemKey, { icon: (p: { size?: number }) => React.ReactElement; tint: string }> = {
  lighting: { icon: (p) => <CategoryIcon category="lighting" {...p} />, tint: "bg-[#ffcc00]" },
  access: { icon: (p) => <LockIcon {...p} />, tint: "bg-[#0071e3]" },
  cameras: { icon: (p) => <CameraIcon {...p} />, tint: "bg-[#30b14c]" },
  heating: { icon: (p) => <ThermoIcon {...p} />, tint: "bg-[#ff9500]" },
  blinds: { icon: (p) => <BlindsIcon {...p} />, tint: "bg-[#5ac8fa]" },
  sensors: { icon: (p) => <CategoryIcon category="security" {...p} />, tint: "bg-[#5e5ce6]" },
  network: { icon: (p) => <WifiIcon {...p} />, tint: "bg-[#64748b]" },
  sound: { icon: (p) => <CategoryIcon category="entertainment" {...p} />, tint: "bg-[#af52de]" },
  energy: { icon: (p) => <CategoryIcon category="energy" {...p} />, tint: "bg-[#34c759]" },
};

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

/** Whole euros for the big numbers; exact cents elsewhere. */
function euros(cents: number, locale: Locale) {
  return new Intl.NumberFormat({ bg: "bg-BG", en: "en-IE", tr: "tr-TR" }[locale], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function Calculator({ locale, t, form }: { locale: Locale; t: Labels; form: FormLabels }) {
  const settings = useSettings();
  const { add } = useCart();
  const { products, loading } = useProducts(locale);
  const [cfg, setCfg] = useState<CalcConfig>(defaultConfig);
  const [ready, setReady] = useState(false);
  const [showList, setShowList] = useState(false);
  const [added, setAdded] = useState<"" | "all" | "partial">("");
  const [copied, setCopied] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);

  // Start from the link (shared estimates and the demo's "I want this" button), then keep the link in sync.
  useEffect(() => {
    setCfg(parseConfig(window.location.search));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) window.history.replaceState(null, "", `${window.location.pathname}?${serializeConfig(cfg)}`);
    setAdded("");
  }, [cfg, ready]);

  // The phone price bar steps aside while the summary card itself is on screen.
  useEffect(() => {
    const el = document.getElementById("summary");
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setSummaryVisible(e.isIntersecting), { rootMargin: "-120px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Live shop prices; products the shop no longer lists fall back to the starter catalogue for the estimate only.
  const catalogue = useMemo(() => {
    const map = new Map<string, CatalogueItem>();
    for (const p of starterProducts) {
      const v = localizeProduct(p, locale);
      map.set(v.slug, { name: v.name, category: v.category, imageUrl: v.imageUrl, priceCents: v.priceCents, stock: 0, available: false });
    }
    if (!loading) {
      for (const p of products) {
        map.set(p.slug, { name: p.name, category: p.category, imageUrl: p.imageUrl, priceCents: p.priceCents, stock: p.stock, available: true });
      }
    }
    return map;
  }, [products, loading, locale]);

  const rates = ratesFrom(settings);
  const est = useMemo(() => estimate(cfg, catalogue, rates), [cfg, catalogue, rates.base, rates.pair, rates.wall, rates.mount, rates.pro]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = est.lines.filter((l) => l.qty > 0);
  const hasSystems = cfg.systems.length > 0 && active.length > 0;

  const update = (patch: Partial<CalcConfig>) => setCfg((c) => ({ ...c, ...patch }));
  // Changing the home recalculates every quantity, so hand-made changes start over.
  const setHome = (patch: Partial<Pick<CalcConfig, "type" | "rooms" | "floors">>) => setCfg((c) => ({ ...c, ...patch, qty: {} }));
  const toggleSystem = (s: SystemKey) =>
    setCfg((c) => ({ ...c, systems: c.systems.includes(s) ? c.systems.filter((x) => x !== s) : SYSTEMS.filter((x) => x === s || c.systems.includes(x)) }));
  const setQty = (line: Line, qty: number) =>
    setCfg((c) => {
      const next = { ...c.qty };
      if (qty === line.defaultQty) delete next[line.key];
      else next[line.key] = Math.max(0, Math.min(QTY_MAX, qty));
      return { ...c, qty: next };
    });

  const typeLabel = t.types[cfg.type].title;
  const roomsLabel = cfg.rooms === 1 ? t.summary.room : fill(t.summary.rooms, { n: cfg.rooms });
  const priceText = !hasSystems ? "—" : cfg.install ? `${euros(est.lowCents, locale)} – ${euros(est.highCents, locale)}` : formatMoney(est.deviceCents, locale);

  function addToCart() {
    const bySlug = new Map<string, { line: Line; qty: number }>();
    for (const l of active) {
      const prev = bySlug.get(l.slug);
      bySlug.set(l.slug, { line: l, qty: (prev?.qty ?? 0) + l.qty });
    }
    let partial = false;
    for (const { line, qty } of bySlug.values()) {
      const n = Math.min(qty, line.item.available ? line.item.stock : 0);
      if (n < qty) partial = true;
      if (n > 0) {
        add({ productId: line.slug, slug: line.slug, name: line.item.name, category: line.item.category, imageUrl: line.item.imageUrl, priceCents: line.item.priceCents }, n);
      }
    }
    setAdded(partial ? "partial" : "all");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.cta.share, window.location.href);
    }
  }

  // What the team receives with the visit request.
  const message = useMemo(() => {
    const m = t.message;
    const lines = active.map((l) => `- ${l.qty} × ${l.item.name} (${formatMoney(l.qty * l.item.priceCents, locale)})`);
    const home = [typeLabel, roomsLabel, cfg.type === "house" ? fill(t.summary.floors, { n: cfg.floors }) : ""].filter(Boolean).join(", ");
    const text = [
      `[${m.header}]`,
      `${m.home}: ${home}`,
      `${m.systems}: ${cfg.systems.map((s) => t.systems[s].title).join(", ") || "—"}`,
      `${m.install}: ${cfg.install ? t.install.pro.title : t.install.diy.title}`,
      `${m.price}: ${priceText} (${t.summary.vat})`,
      `${m.devices}:`,
      ...lines,
      `${m.link}: ${typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}?${serializeConfig(cfg)}`}`,
    ].join("\n");
    return text.slice(0, 3800);
  }, [active, cfg, priceText, roomsLabel, t, typeLabel, locale]);

  const groups = [...SYSTEMS.filter((s) => cfg.systems.includes(s)), "required" as const]
    .map((g) => ({ key: g, lines: est.lines.filter((l) => l.system === g) }))
    .filter((g) => g.lines.length);

  return (
    <>
      {/* Price bar for phones: the summary card is further down the page there. */}
      <div className={`glass sticky top-12 z-30 border-b border-black/5 transition-[opacity,visibility] duration-300 lg:hidden ${summaryVisible ? "invisible opacity-0" : ""}`}>
        <div className="container-wide flex h-14 items-center justify-between gap-3">
          <div className="min-w-0 leading-tight">
            <span className="block text-[11px] text-mute">{cfg.install ? t.summary.estimate : t.summary.exact}</span>
            <span className="price block truncate text-[17px] font-semibold">{priceText}</span>
          </div>
          <a href="#summary" className="btn btn-primary btn-sm shrink-0">
            {t.summary.mobileCta}
          </a>
        </div>
      </div>

      {/* Phones: steps, then the price, then the form. Desktop: the price stays beside the steps. */}
      <div className="container-wide grid grid-cols-1 gap-16 pb-24 pt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-14 lg:pt-4">
        <div className="min-w-0 space-y-16 lg:col-start-1">
          {/* 1. Home */}
          <Step n={1} title={t.steps.type}>
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t.steps.type}>
              {PROPERTY_TYPES.map((type) => {
                const Icon = typeIcons[type];
                const on = cfg.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setHome({ type, floors: type === "house" ? Math.max(cfg.floors, 1) : 1 })}
                    className={`flex items-start gap-4 rounded-[20px] bg-white p-5 text-left transition-[box-shadow,background-color] ${on ? "ring-2 ring-accent" : "ring-1 ring-line hover:ring-ink/30"}`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${on ? "bg-accent text-white" : "bg-cloud text-ink"}`}>
                      <Icon size={22} />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[17px] font-semibold">{t.types[type].title}</span>
                      <span className="mt-1 block text-[14px] text-mute">{t.types[type].text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          {/* 2. Size */}
          <Step n={2} title={t.steps.rooms}>
            <div className="flex flex-wrap gap-3">
              <Stepper
                label={t.rooms}
                value={cfg.rooms}
                min={ROOMS_MIN}
                max={ROOMS_MAX}
                fewer={t.fewer}
                more={t.more}
                onChange={(rooms) => setHome({ rooms })}
              />
              {cfg.type === "house" && (
                <Stepper
                  label={t.floors}
                  value={cfg.floors}
                  min={1}
                  max={FLOORS_MAX}
                  fewer={t.fewer}
                  more={t.more}
                  onChange={(floors) => setHome({ floors })}
                />
              )}
            </div>
            <p className="mt-3 text-[14px] text-mute">{t.roomsHint}</p>
          </Step>

          {/* 3. Systems */}
          <Step n={3} title={t.steps.systems}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SYSTEMS.map((s) => {
                const on = cfg.systems.includes(s);
                const { icon: Icon, tint } = systemIcons[s];
                const cost = systemCost(s, cfg, catalogue, rates);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSystem(s)}
                    className={`group relative flex min-h-[132px] flex-col justify-between rounded-[20px] p-5 text-left transition-[box-shadow,background-color] ${on ? "bg-white ring-2 ring-accent" : "bg-white ring-1 ring-line hover:ring-ink/30"}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors ${on ? tint : "bg-[#d2d2d7]"}`}>
                        <Icon size={20} />
                      </span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${on ? "bg-accent text-white" : "ring-1 ring-line text-transparent"}`}
                        aria-hidden="true"
                      >
                        <CheckIcon size={15} strokeWidth={2.4} />
                      </span>
                    </span>
                    <span className="mt-4 leading-tight">
                      <span className="block text-[17px] font-semibold">{t.systems[s].title}</span>
                      <span className="mt-1 block text-[14px] text-mute">{t.systems[s].text}</span>
                      {cost > 0 && <span className="price mt-2 block text-[13px] font-medium text-ink-2">{fill(t.from, { price: euros(cost, locale) })}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          {/* 4. Who installs */}
          <Step n={4} title={t.steps.install}>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t.steps.install}>
              {(["pro", "diy"] as const).map((k) => {
                const on = cfg.install === (k === "pro");
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => update({ install: k === "pro" })}
                    className={`rounded-[20px] bg-white p-5 text-left transition-[box-shadow] ${on ? "ring-2 ring-accent" : "ring-1 ring-line hover:ring-ink/30"}`}
                  >
                    <span className="block text-[17px] font-semibold">{t.install[k].title}</span>
                    <span className="mt-1 block text-[14px] text-mute">{t.install[k].text}</span>
                  </button>
                );
              })}
            </div>
          </Step>

          {/* 5. Device list */}
          <Step n={5} title={t.steps.list}>
            {!hasSystems ? (
              <p className="text-[15px] text-mute">{t.summary.empty}</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowList((v) => !v)}
                  aria-expanded={showList}
                  aria-controls="calc-list"
                  className="link-chevron text-[17px]"
                >
                  {showList ? t.list.hide : fill(t.list.show, { n: est.deviceCount })}
                </button>
                {showList && (
                  <div id="calc-list" className="mt-6 space-y-8">
                    {groups.map((g) => (
                      <div key={g.key}>
                        <h3 className="text-[15px] font-semibold">{g.key === "required" ? t.list.required : t.systems[g.key].title}</h3>
                        {g.key === "required" && <p className="mt-0.5 text-[13px] text-mute">{t.list.requiredText}</p>}
                        <ul className="mt-3 divide-y divide-line/70 rounded-[18px] bg-white ring-1 ring-line">
                          {g.lines.map((l) => (
                            <li key={l.key} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${l.qty === 0 ? "text-mute" : ""}`}>
                              <div className="min-w-0 flex-1">
                                <Link href={productHref(locale, l.slug)} className="block truncate text-[15px] font-medium hover:underline">
                                  {l.item.name}
                                </Link>
                                <span className="price text-[13px] text-mute">
                                  {formatMoney(l.item.priceCents, locale)} {t.list.each}
                                  {l.defaultQty === 0 && l.qty === 0 && ` · ${t.list.optional}`}
                                  {!cfg.install && l.qty > 0 && l.item.available && l.item.stock < l.qty && ` · ${fill(t.list.stockLeft, { n: l.item.stock })}`}
                                </span>
                              </div>
                              {g.key === "required" ? (
                                <span className="price w-[104px] text-center text-[15px]">1</span>
                              ) : (
                                <SmallStepper value={l.qty} onChange={(n) => setQty(l, n)} fewer={t.fewer} more={t.more} name={l.item.name} />
                              )}
                              <span className="price w-[88px] text-right text-[15px] font-medium">{formatMoney(l.qty * l.item.priceCents, locale)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {Object.keys(cfg.qty).length > 0 && (
                      <button type="button" onClick={() => update({ qty: {} })} className="text-[14px] text-link hover:underline">
                        {t.list.reset}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </Step>
        </div>

        {/* Summary */}
        <aside id="summary" className="min-w-0 scroll-mt-28 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-[28px] bg-[#1d1d1f] p-7 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">{cfg.install ? t.summary.estimate : t.summary.exact}</p>
            <p className="price mt-2 text-[40px] font-bold leading-[1.05] tracking-tight" aria-live="polite">
              {priceText}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2 text-[13px]">
              {[typeLabel, roomsLabel, ...(cfg.type === "house" && cfg.floors > 1 ? [fill(t.summary.floors, { n: cfg.floors })] : []), ...cfg.systems.map((s) => t.systems[s].title)].map((chip) => (
                <li key={chip} className="rounded-full bg-white/10 px-3 py-1.5">
                  {chip}
                </li>
              ))}
            </ul>

            {hasSystems && (
              <dl className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/65">{fill(t.summary.devices, { n: est.deviceCount })}</dt>
                  <dd className="price">{formatMoney(est.deviceCents, locale)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/65">{t.summary.install}</dt>
                  <dd className="price text-right">
                    {cfg.install ? `${euros(est.installLowCents, locale)} – ${euros(est.installHighCents, locale)}` : t.summary.notIncluded}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-6 space-y-3">
              {cfg.install ? (
                <a href="#quote" className={`btn btn-primary w-full ${hasSystems ? "" : "pointer-events-none opacity-45"}`}>
                  {t.cta.quote}
                </a>
              ) : null}
              {added ? (
                <Link href={`/${locale}/cart`} className="btn w-full bg-white text-ink hover:bg-white/90">
                  <CheckIcon size={18} /> {t.cta.added} · {t.cta.viewCart}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!hasSystems || loading}
                  className={`btn w-full ${cfg.install ? "bg-white/10 text-white hover:bg-white/15" : "btn-primary"}`}
                >
                  {t.cta.cart}
                </button>
              )}
              {!cfg.install && (
                <a href="#quote" className={`btn w-full bg-white/10 text-white hover:bg-white/15 ${hasSystems ? "" : "pointer-events-none opacity-45"}`}>
                  {t.cta.quote}
                </a>
              )}
            </div>
            {added === "partial" && <p className="mt-3 text-[13px] text-[#ffd60a]">{t.cta.partial}</p>}

            <p className="mt-5 text-[13px] leading-relaxed text-white/55">
              {hasSystems ? (cfg.install ? t.summary.note : fill(t.summary.diyNote, { amount: formatMoney(settings.freeShippingFromCents, locale) })) : t.summary.empty}{" "}
              {t.summary.vat}
            </p>
            <button type="button" onClick={copyLink} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-[#2997ff] hover:underline">
              <LinkIcon size={15} /> {copied ? t.cta.copied : t.cta.share}
            </button>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          {/* 6. Visit request */}
          <Step n={6} title={t.steps.quote} id="quote">
            <p className="-mt-2 mb-6 max-w-[560px] text-[15px] text-mute">{t.form.text}</p>
            <div className="max-w-[640px]">
              <ActionForm
                kind="inquiry"
                locale={locale}
                submitLabel={t.form.submit}
                sendingLabel={form.sending}
                successText={t.form.success}
                errorText={form.error}
                invalidText={form.invalid}
              >
                <input type="hidden" name="service" value={serviceFor(cfg.systems)} />
                <input type="hidden" name="propertyType" value={cfg.type} />
                <input type="hidden" name="message" value={message} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={form.name} name="name" required autoComplete="name" />
                  <Field label={t.form.phone} name="phone" type="tel" required autoComplete="tel" />
                </div>
                <Field label={form.email} name="email" type="email" required autoComplete="email" />
                <Field label={t.form.extra} name="extra" textarea rows={3} />
                <label className="flex items-start gap-3 text-[14px] text-ink-2">
                  <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-accent" />
                  <span>
                    <LinkedText template={form.consent} links={{ privacy: { href: `/${locale}/legal/privacy`, label: form.privacy } }} />
                  </span>
                </label>
              </ActionForm>
            </div>
          </Step>
        </div>

      </div>
    </>
  );
}

function Step({ n, title, id, children }: { n: number; title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-6 flex items-center gap-3 text-[24px] font-semibold tracking-tight md:text-[28px]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  fewer,
  more,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  fewer: string;
  more: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[20px] bg-white p-2 pl-5 ring-1 ring-line">
      <span className="mr-3 text-[15px] text-mute">{label}</span>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`${fewer}: ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-cloud transition-colors hover:bg-[#e8e8ed] disabled:opacity-35"
      >
        <MinusIcon size={18} />
      </button>
      <output className="price min-w-[2.5ch] text-center text-[28px] font-semibold tracking-tight" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`${more}: ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-cloud transition-colors hover:bg-[#e8e8ed] disabled:opacity-35"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}

function SmallStepper({ value, onChange, fewer, more, name }: { value: number; onChange: (n: number) => void; fewer: string; more: string; name: string }) {
  return (
    <div className="flex w-[104px] items-center justify-between rounded-full bg-cloud p-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        aria-label={`${fewer}: ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white disabled:opacity-35"
      >
        <MinusIcon size={15} />
      </button>
      <span className="price text-[15px] font-medium">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= QTY_MAX}
        aria-label={`${more}: ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white disabled:opacity-35"
      >
        <PlusIcon size={15} />
      </button>
    </div>
  );
}

