import "server-only";
import bg from "./dictionaries/bg";
import en from "./dictionaries/en";
import tr from "./dictionaries/tr";
import type { Locale } from "./config";

const dictionaries = { bg, en, tr };

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? bg;
}

export type { Dictionary } from "./dictionaries/en";
