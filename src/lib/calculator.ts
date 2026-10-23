import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "./settings";

// Price calculator: turns "what kind of home, how many rooms, which systems" into a device list
// priced from the live shop catalogue, plus installation. Which products each system adds, how many,
// and what installing them costs is set by the owner in Admin → Калкулатор (stored as settings.calculator).

export const PROPERTY_TYPES = ["apartment", "house", "office"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Systems with ready-made names and descriptions in every language. The owner can add more. */
export const BUILTIN_SYSTEMS = ["lighting", "access", "cameras", "heating", "blinds", "sensors", "network", "sound", "energy"] as const;
export type BuiltinSystem = (typeof BUILTIN_SYSTEMS)[number];
export const isBuiltin = (key: string): key is BuiltinSystem => (BUILTIN_SYSTEMS as readonly string[]).includes(key);

/** Icons a system card can show: the built-in system icons plus a few shop categories. */
export const SYSTEM_ICONS = [...BUILTIN_SYSTEMS, "climate", "security", "cleaning", "entertainment", "hubs"] as const;

export const ROOMS_MIN = 1;
export const ROOMS_MAX = 20;
export const FLOORS_MAX = 4;
export const QTY_MAX = 50;

/**
 * How many pieces a product adds for one kind of home.
 * home: n in total · room: n per room · floor: n per floor · rooms: 1 for every n rooms (rounded up).
 * n = 0 still lists the product so the visitor can add it.
 */
export type QtyPer = "home" | "room" | "floor" | "rooms";
export type QtyRule = { n: number; per: QtyPer };
export type CalcItem = { slug: string; installCents: number; qty: Record<PropertyType, QtyRule>; /** Controller it cannot work without, or "". */ hub: string };
export type CalcSystem = {
  key: string;
  enabled: boolean;
  /** Custom name per language; empty uses the built-in name (other languages fall back to Bulgarian). */
  names: Record<Locale, string>;
  icon: string;
  items: CalcItem[];
};
export type CalcHub = { slug: string; installCents: number };
export type CalcSetup = {
  /** Visit, app set-up and training, charged once when anything is installed. */
  baseCents: number;
  /** The top of the price range is this many percent above the installation estimate. */
  spreadPercent: number;
  systems: CalcSystem[];
  hubs: CalcHub[];
};

export type CalcConfig = {
  type: PropertyType;
  rooms: number;
  floors: number;
  systems: string[];
  install: boolean;
  /** Quantities the visitor changed by hand, keyed "system.slug". */
  qty: Record<string, number>;
};

export const defaultConfig: CalcConfig = { type: "apartment", rooms: 3, floors: 1, systems: ["lighting", "sensors"], install: true, qty: {} };

type Home = Pick<CalcConfig, "type" | "rooms" | "floors">;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

export function qtyFor(rule: QtyRule, h: Home) {
  const n = Math.max(0, rule.n);
  const floors = h.type === "house" ? h.floors : 1;
  if (rule.per === "room") return n * h.rooms;
  if (rule.per === "floor") return n * floors;
  if (rule.per === "rooms") return n > 0 ? Math.ceil(h.rooms / n) : 0;
  return n;
}

// ---------- The starter setup (used until the owner saves their own) ----------

type Q = [number, QtyPer];
const r = ([n, per]: Q): QtyRule => ({ n, per });
const all = (q: Q) => ({ apartment: r(q), house: r(q), office: r(q) });
const each = (apartment: Q, house: Q, office: Q) => ({ apartment: r(apartment), house: r(house), office: r(office) });

/** Built from the old per-class installation rates in the settings, so existing prices carry over. */
export function defaultSetup(s: SiteSettings): CalcSetup {
  const pair = s.installPairCents;
  const wall = s.installWallCents;
  const mount = s.installMountCents;
  const pro = s.installProCents;
  const item = (slug: string, installCents: number, qty: CalcItem["qty"], hub = ""): CalcItem => ({ slug, installCents, qty, hub });
  const AQARA = "aqara-hub-m3";
  const HUE = "philips-hue-bridge-pro";
  const items: Record<BuiltinSystem, CalcItem[]> = {
    lighting: [
      item("shelly-1pm-gen4", wall, all([1, "room"])),
      item("philips-hue-color-e27-2-pack", pair, each([1, "home"], [1, "home"], [0, "home"]), HUE),
      item("aqara-presence-sensor-fp2", pair, all([0, "home"])),
    ],
    access: [item("aqara-smart-lock-u200-kit", pro, all([1, "home"]), AQARA), item("aqara-video-doorbell-g4", pro, all([1, "home"]))],
    cameras: [
      item("tapo-c200", mount, each([3, "rooms"], [1, "floor"], [3, "rooms"])),
      item("tapo-c320ws", mount, each([0, "home"], [2, "home"], [1, "home"])),
    ],
    heating: [
      item("netatmo-smart-thermostat", pro, each([1, "home"], [1, "floor"], [1, "home"])),
      item("aqara-door-window-sensor-p2", pair, all([0, "home"]), AQARA),
    ],
    blinds: [item("shelly-2pm-gen3", wall, all([1, "room"]))],
    sensors: [
      item("aqara-water-leak-sensor", pair, each([2, "rooms"], [2, "floor"], [2, "rooms"]), AQARA),
      item("aqara-motion-sensor-p2", pair, all([2, "rooms"]), AQARA),
      item("aqara-door-window-sensor-p2", pair, each([1, "home"], [3, "home"], [2, "home"]), AQARA),
      item("shelly-plus-smoke", pair, each([3, "rooms"], [1, "floor"], [3, "rooms"])),
    ],
    network: [item("tp-link-deco-be25-2-pack", pair, each([5, "rooms"], [1, "floor"], [4, "rooms"]))],
    sound: [
      item("sonos-era-100", pair, each([1, "home"], [2, "home"], [1, "home"])),
      item("apple-homepod-mini", pair, each([1, "home"], [1, "home"], [0, "home"])),
    ],
    energy: [item("shelly-pro-3em", pro, all([1, "home"])), item("shelly-plug-s-gen3", pair, all([2, "home"]))],
  };
  return {
    baseCents: s.installBaseCents,
    spreadPercent: 25,
    systems: BUILTIN_SYSTEMS.map((key) => ({ key, enabled: true, names: { bg: "", en: "", tr: "" }, icon: key, items: items[key] })),
    hubs: [
      { slug: AQARA, installCents: pair },
      { slug: HUE, installCents: pair },
    ],
  };
}

const PERS: QtyPer[] = ["home", "room", "floor", "rooms"];
const cents = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** The owner's setup, cleaned up so a half-filled or older save can never break the public page. */
export function setupFrom(s: SiteSettings): CalcSetup {
  const raw = s.calculator;
  if (!raw || !Array.isArray(raw.systems)) return defaultSetup(s);
  const rule = (v: Partial<QtyRule> | undefined): QtyRule => ({
    n: clamp(Number(v?.n) || 0, 0, QTY_MAX),
    per: PERS.includes(v?.per as QtyPer) ? (v?.per as QtyPer) : "home",
  });
  const seen = new Set<string>();
  const systems = raw.systems
    .filter((x) => x && /^[a-z0-9-]{1,40}$/.test(x.key) && !seen.has(x.key) && seen.add(x.key))
    .map((x) => ({
      key: x.key,
      enabled: x.enabled !== false,
      names: { bg: text(x.names?.bg, 60), en: text(x.names?.en, 60), tr: text(x.names?.tr, 60) },
      icon: (SYSTEM_ICONS as readonly string[]).includes(x.icon) ? x.icon : "hubs",
      items: (Array.isArray(x.items) ? x.items : [])
        .filter((i) => i && typeof i.slug === "string" && i.slug)
        .map((i) => ({
          slug: i.slug,
          installCents: cents(i.installCents),
          hub: typeof i.hub === "string" ? i.hub : "",
          qty: { apartment: rule(i.qty?.apartment), house: rule(i.qty?.house), office: rule(i.qty?.office) },
        })),
    }));
  const hubs = (Array.isArray(raw.hubs) ? raw.hubs : []).filter((h) => h && typeof h.slug === "string" && h.slug).map((h) => ({ slug: h.slug, installCents: cents(h.installCents) }));
  return { baseCents: cents(raw.baseCents), spreadPercent: clamp(Number(raw.spreadPercent) || 0, 0, 200), systems, hubs };
}

/** Name of a system in a language: the owner's own name, else the built-in one, else the Bulgarian one. */
export function systemTitle(sys: CalcSystem, locale: Locale, builtin: Record<BuiltinSystem, { title: string }>) {
  return sys.names[locale] || (isBuiltin(sys.key) && !sys.names.bg ? builtin[sys.key].title : sys.names.bg) || sys.key;
}

// ---------- Estimate ----------

export type CatalogueItem = { name: string; category: string; imageUrl: string | null; priceCents: number; stock: number; available: boolean };

export type Line = {
  key: string;
  system: string;
  slug: string;
  item: CatalogueItem;
  qty: number;
  defaultQty: number;
  installCents: number;
};

export function lineKey(system: string, slug: string) {
  return `${system}.${slug}`;
}

/** Device list for a configuration. Products missing from the shop are left out. */
export function buildLines(cfg: CalcConfig, setup: CalcSetup, catalogue: Map<string, CatalogueItem>): Line[] {
  const lines: Line[] = [];
  const hubsNeeded = new Set<string>();
  for (const sys of setup.systems) {
    if (!sys.enabled || !cfg.systems.includes(sys.key)) continue;
    const seen = new Set<string>();
    for (const rule of sys.items) {
      const item = catalogue.get(rule.slug);
      if (!item || seen.has(rule.slug)) continue;
      seen.add(rule.slug);
      const key = lineKey(sys.key, rule.slug);
      const defaultQty = clamp(qtyFor(rule.qty[cfg.type], cfg), 0, QTY_MAX);
      const qty = key in cfg.qty ? clamp(cfg.qty[key], 0, QTY_MAX) : defaultQty;
      lines.push({ key, system: sys.key, slug: rule.slug, item, qty, defaultQty, installCents: rule.installCents });
      if (qty > 0 && rule.hub) hubsNeeded.add(rule.hub);
    }
  }
  const chosen = new Set(lines.filter((l) => l.qty > 0).map((l) => l.slug));
  for (const hub of setup.hubs) {
    const item = catalogue.get(hub.slug);
    if (!item || chosen.has(hub.slug) || !hubsNeeded.has(hub.slug)) continue;
    lines.push({ key: lineKey("required", hub.slug), system: "required", slug: hub.slug, item, qty: 1, defaultQty: 1, installCents: hub.installCents });
    chosen.add(hub.slug);
  }
  return lines;
}

export type Estimate = {
  lines: Line[];
  deviceCount: number;
  deviceCents: number;
  installLowCents: number;
  installHighCents: number;
  /** Rounded to whole tens of euros, the way the range is shown. */
  lowCents: number;
  highCents: number;
};

export function estimate(cfg: CalcConfig, setup: CalcSetup, catalogue: Map<string, CatalogueItem>): Estimate {
  const lines = buildLines(cfg, setup, catalogue);
  const active = lines.filter((l) => l.qty > 0);
  const deviceCount = active.reduce((n, l) => n + l.qty, 0);
  const deviceCents = active.reduce((n, l) => n + l.qty * l.item.priceCents, 0);
  const installLowCents = cfg.install && active.length ? setup.baseCents + active.reduce((n, l) => n + l.qty * l.installCents, 0) : 0;
  const installHighCents = Math.round(installLowCents * (1 + setup.spreadPercent / 100));
  const low = deviceCents + installLowCents;
  const high = deviceCents + installHighCents;
  return {
    lines,
    deviceCount,
    deviceCents,
    installLowCents,
    installHighCents,
    lowCents: cfg.install ? Math.floor(low / 1000) * 1000 : low,
    highCents: cfg.install ? Math.ceil(high / 1000) * 1000 : high,
  };
}

/** Device and per-unit installation cost of one system's default kit, shown on its card. */
export function systemCost(system: string, cfg: CalcConfig, setup: CalcSetup, catalogue: Map<string, CatalogueItem>) {
  return buildLines({ ...cfg, systems: [system] }, setup, catalogue)
    .filter((l) => l.system === system)
    .reduce((n, l) => n + l.qty * (l.item.priceCents + (cfg.install ? l.installCents : 0)), 0);
}

// ---------- Shareable link ----------

export function serializeConfig(cfg: CalcConfig) {
  const p = new URLSearchParams();
  p.set("type", cfg.type);
  p.set("rooms", String(cfg.rooms));
  if (cfg.type === "house") p.set("floors", String(cfg.floors));
  p.set("sys", cfg.systems.join("."));
  if (!cfg.install) p.set("diy", "1");
  const q = Object.entries(cfg.qty).map(([k, v]) => `${k}.${v}`);
  if (q.length) p.set("q", q.join(","));
  return p.toString();
}

const KEY = /^[a-z0-9-]{1,80}$/;

/** Reads a shared link. Systems and products the setup does not know are simply ignored later. */
export function parseConfig(search: string): CalcConfig {
  const p = new URLSearchParams(search);
  const type = (PROPERTY_TYPES as readonly string[]).includes(p.get("type") ?? "") ? (p.get("type") as PropertyType) : defaultConfig.type;
  const num = (key: string, fallback: number, min: number, max: number) => {
    const n = Number(p.get(key));
    return p.has(key) && Number.isFinite(n) ? clamp(n, min, max) : fallback;
  };
  const systems = p.has("sys") ? [...new Set((p.get("sys") ?? "").split(".").filter((s) => KEY.test(s)))] : defaultConfig.systems;
  const qty: Record<string, number> = {};
  for (const entry of (p.get("q") ?? "").split(",")) {
    const [system, slug, value] = entry.split(".");
    const n = Number(value);
    if (system && slug && KEY.test(system) && KEY.test(slug) && Number.isFinite(n)) qty[lineKey(system, slug)] = clamp(n, 0, QTY_MAX);
  }
  return {
    type,
    rooms: num("rooms", defaultConfig.rooms, ROOMS_MIN, ROOMS_MAX),
    floors: type === "house" ? num("floors", 1, 1, FLOORS_MAX) : 1,
    systems,
    install: p.get("diy") !== "1",
    qty,
  };
}

/** Contact form "service" value that best matches the chosen systems. */
export function serviceFor(systems: string[]) {
  if (systems.length !== 1) return "full";
  const map: Record<string, string> = {
    lighting: "lighting",
    heating: "climate",
    access: "security",
    cameras: "security",
    sensors: "security",
    energy: "energy",
    sound: "entertainment",
  };
  return map[systems[0]] ?? "full";
}
