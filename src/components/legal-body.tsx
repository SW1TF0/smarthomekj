"use client";

import type { Locale } from "@/i18n/config";
import { getLegalDocs, type LegalKey } from "@/i18n/legal";
import { useSettings } from "@/lib/store";

/** Legal text filled with the company details from Admin → Settings. */
export function LegalBody({ locale, doc }: { locale: Locale; doc: LegalKey }) {
  const sections = getLegalDocs(locale)(useSettings())[doc];
  return (
    <div className="prose-legal mt-4">
      {sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
