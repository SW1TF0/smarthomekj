import type { SiteSettings } from "@/lib/settings";

export type LegalSection = { h: string; p: string[] };
export type LegalKey = "privacy" | "cookies" | "terms" | "returns" | "imprint" | "accessibility";
export type LegalDocs = (s: SiteSettings) => Record<LegalKey, LegalSection[]>;

export const LEGAL_UPDATED = "2026-10-18";
