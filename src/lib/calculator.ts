import type { SiteSettings } from "./settings";

// Price calculator: turns "what kind of home, how many rooms, which systems" into a device list
// priced from the live shop catalogue, plus installation at the rates set in Admin → Settings.

export const PROPERTY_TYPES = ["apartment", "house", "office"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const SYSTEMS = ["lighting", "access", "cameras", "heating", "blinds", "sensors", "network", "sound", "energy"] as const;
export type SystemKey = (typeof SYSTEMS)[number];

/** How much work one unit takes to install. Each class has its own rate in the settings. */
export type InstallClass = "pair" | "wall" | "mount" | "pro";

export const ROOMS_MIN = 1;
export const ROOMS_MAX = 20;
export const FLOORS_MAX = 4;
export const QTY_MAX = 50;
/** Installation can cost more than the base estimate when wiring or walls need extra work. */
export const INSTALL_SPREAD = 1.25;

export type CalcConfig = {
  type: PropertyType;
  rooms: number;
  floors: number;
  systems: SystemKey[];
  install: boolean;
  /** Quantities the visitor changed by hand, keyed "system.slug". */
  qty: Record<string, number>;
};

export const defaultConfig: CalcConfig = { type: "apartment", rooms: 3, floors: 1, systems: ["lighting", "sensors"], install: true, qty: {} };

type Home = Pick<CalcConfig, "type" | "rooms" | "floors">;
type Rule = { slug: string; install: InstallClass; qty: (h: Home) => number };

const per = (n: number, size: number) => Math.ceil(n / size);

/** The default kit for each system. A rule that returns 0 is still listed so the visitor can add it. */
export const RULES: Record<SystemKey, Rule[]> = {
  lighting: [
    { slug: "shelly-1pm-gen4", install: "wall", qty: (h) => h.rooms },
    { slug: "philips-hue-color-e27-2-pack", install: "pair", qty: (h) => (h.type === "office" ? 0 : 1) },
    { slug: "aqara-presence-sensor-fp2", install: "pair", qty: () => 0 },
  ],
  access: [
    { slug: "aqara-smart-lock-u200-kit", install: "pro", qty: () => 1 },
    { slug: "aqara-video-doorbell-g4", install: "pro", qty: () => 1 },
  ],
  cameras: [
    { slug: "tapo-c200", install: "mount", qty: (h) => (h.type === "house" ? h.floors : h.type === "office" ? per(h.rooms, 3) : h.rooms >= 4 ? 2 : 1) },
    { slug: "tapo-c320ws", install: "mount", qty: (h) => (h.type === "house" ? 2 : h.type === "office" ? 1 : 0) },
  ],
  heating: [
    { slug: "netatmo-smart-thermostat", install: "pro", qty: (h) => (h.type === "house" ? h.floors : 1) },
    { slug: "aqara-door-window-sensor-p2", install: "pair", qty: () => 0 },
  ],
  blinds: [{ slug: "shelly-2pm-gen3", install: "wall", qty: (h) => h.rooms }],
  sensors: [
    { slug: "aqara-water-leak-sensor", install: "pair", qty: (h) => (h.type === "house" ? 1 + h.floors : h.rooms >= 4 ? 3 : 2) },
    { slug: "aqara-motion-sensor-p2", install: "pair", qty: (h) => per(h.rooms, 2) },
    { slug: "aqara-door-window-sensor-p2", install: "pair", qty: (h) => (h.type === "house" ? 3 : h.type === "office" ? 2 : 1) },
    { slug: "shelly-plus-smoke", install: "pair", qty: (h) => (h.type === "house" ? h.floors + 1 : per(h.rooms, 3)) },
  ],
  network: [{ slug: "tp-link-deco-be25-2-pack", install: "pair", qty: (h) => (h.type === "house" ? h.floors : per(h.rooms, h.type === "office" ? 4 : 5)) }],
  sound: [
    { slug: "sonos-era-100", install: "pair", qty: (h) => (h.type === "house" ? 2 : 1) },
    { slug: "apple-homepod-mini", install: "pair", qty: (h) => (h.type !== "office" && h.rooms >= 3 ? 1 : 0) },
  ],
  energy: [
    { slug: "shelly-pro-3em", install: "pro", qty: () => 1 },
    { slug: "shelly-plug-s-gen3", install: "pair", qty: () => 2 },
  ],
};

/** Controllers that other devices cannot work without. Added once when any device that needs them is in the list. */
const REQUIRED: { slug: string; install: InstallClass; for: string[] }[] = [
  {
    slug: "aqara-hub-m3",
    install: "pair",
    for: ["aqara-water-leak-sensor", "aqara-motion-sensor-p2", "aqara-door-window-sensor-p2", "aqara-smart-lock-u200-kit"],
  },
  { slug: "philips-hue-bridge-pro", install: "pair", for: ["philips-hue-color-e27-2-pack"] },
];

export type CatalogueItem = { name: string; category: string; imageUrl: string | null; priceCents: number; stock: number; available: boolean };

export type Line = {
  key: string;
  system: SystemKey | "required";
  slug: string;
  item: CatalogueItem;
  qty: number;
  defaultQty: number;
  install: InstallClass;
};

export type InstallRates = Record<"base" | InstallClass, number>;

export function ratesFrom(s: SiteSettings): InstallRates {
  return { base: s.installBaseCents, pair: s.installPairCents, wall: s.installWallCents, mount: s.installMountCents, pro: s.installProCents };
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

export function lineKey(system: string, slug: string) {
  return `${system}.${slug}`;
}

/** Device list for a configuration. Products missing from the catalogue are left out. */
export function buildLines(cfg: CalcConfig, catalogue: Map<string, CatalogueItem>): Line[] {
  const lines: Line[] = [];
  for (const system of SYSTEMS) {
    if (!cfg.systems.includes(system)) continue;
    for (const rule of RULES[system]) {
      const item = catalogue.get(rule.slug);
      if (!item) continue;
      const key = lineKey(system, rule.slug);
      const defaultQty = clamp(rule.qty(cfg), 0, QTY_MAX);
      const qty = key in cfg.qty ? clamp(cfg.qty[key], 0, QTY_MAX) : defaultQty;
      lines.push({ key, system, slug: rule.slug, item, qty, defaultQty, install: rule.install });
    }
  }
  const chosen = new Set(lines.filter((l) => l.qty > 0).map((l) => l.slug));
  for (const req of REQUIRED) {
    const item = catalogue.get(req.slug);
    if (!item || chosen.has(req.slug) || !req.for.some((s) => chosen.has(s))) continue;
    lines.push({ key: lineKey("required", req.slug), system: "required", slug: req.slug, item, qty: 1, defaultQty: 1, install: req.install });
    chosen.add(req.slug);
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

export function estimate(cfg: CalcConfig, catalogue: Map<string, CatalogueItem>, rates: InstallRates): Estimate {
  const lines = buildLines(cfg, catalogue);
  const active = lines.filter((l) => l.qty > 0);
  const deviceCount = active.reduce((n, l) => n + l.qty, 0);
  const deviceCents = active.reduce((n, l) => n + l.qty * l.item.priceCents, 0);
  const installLowCents = cfg.install && active.length ? rates.base + active.reduce((n, l) => n + l.qty * rates[l.install], 0) : 0;
  const installHighCents = Math.round(installLowCents * INSTALL_SPREAD);
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
export function systemCost(system: SystemKey, cfg: CalcConfig, catalogue: Map<string, CatalogueItem>, rates: InstallRates) {
  return buildLines({ ...cfg, systems: [system] }, catalogue)
    .filter((l) => l.system === system)
    .reduce((n, l) => n + l.qty * (l.item.priceCents + (cfg.install ? rates[l.install] : 0)), 0);
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

export function parseConfig(search: string): CalcConfig {
  const p = new URLSearchParams(search);
  const type = (PROPERTY_TYPES as readonly string[]).includes(p.get("type") ?? "") ? (p.get("type") as PropertyType) : defaultConfig.type;
  const num = (key: string, fallback: number, min: number, max: number) => {
    const n = Number(p.get(key));
    return p.has(key) && Number.isFinite(n) ? clamp(n, min, max) : fallback;
  };
  const systems = p.has("sys")
    ? SYSTEMS.filter((s) => (p.get("sys") ?? "").split(".").includes(s))
    : defaultConfig.systems;
  const qty: Record<string, number> = {};
  for (const entry of (p.get("q") ?? "").split(",")) {
    const [system, slug, value] = entry.split(".");
    const n = Number(value);
    if (system && slug && Number.isFinite(n) && (system in RULES) && RULES[system as SystemKey].some((r) => r.slug === slug)) {
      qty[lineKey(system, slug)] = clamp(n, 0, QTY_MAX);
    }
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
export function serviceFor(systems: SystemKey[]) {
  if (systems.length !== 1) return "full";
  const map: Partial<Record<SystemKey, string>> = {
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
