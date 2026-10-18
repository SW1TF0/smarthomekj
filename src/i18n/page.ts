import "server-only";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { getDictionary } from "./index";

export type LocaleParams = { params: Promise<{ locale: string }> };

export async function resolveLocale(params: Promise<{ locale: string }>): Promise<{ locale: Locale; dict: ReturnType<typeof getDictionary> }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}
