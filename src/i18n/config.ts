export const locales = ["bg", "en", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "bg";

export const localeNames: Record<Locale, string> = {
  bg: "Български",
  en: "English",
  tr: "Türkçe",
};

export const htmlLang: Record<Locale, string> = { bg: "bg-BG", en: "en", tr: "tr-TR" };

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
