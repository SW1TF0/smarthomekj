import type { Locale } from "../config";
import bg from "./bg";
import en from "./en";
import tr from "./tr";
import type { LegalKey } from "./types";

const docs = { bg, en, tr };
export const LEGAL_KEYS: LegalKey[] = ["privacy", "cookies", "terms", "returns", "imprint", "accessibility"];

export function getLegalDocs(locale: Locale) {
  return docs[locale] ?? bg;
}

export { LEGAL_UPDATED } from "./types";
export type { LegalKey } from "./types";
