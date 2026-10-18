import { cache } from "react";
import { db } from "./db";

export type SiteSettings = {
  companyName: string;
  legalName: string;
  eik: string;
  vatNumber: string;
  manager: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  workingHours: string;
  bankIban: string;
  bankName: string;
  dpoEmail: string;
  shippingCents: number;
  freeShippingFromCents: number;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  chatEnabled: boolean;
  chatAiEnabled: boolean;
  chatBotName: string;
  chatExtraInstructions: string;
  instagram: string;
  facebook: string;
};

// Placeholders are marked with [ ] so they are easy to spot on the live site
// until the real company details are entered in Admin → Settings.
export const defaultSettings: SiteSettings = {
  companyName: "SmartHomeKJ",
  legalName: "[Registered company name] EOOD",
  eik: "[EIK / UIC]",
  vatNumber: "[BG VAT number]",
  manager: "[Managing director]",
  address: "[Street and number]",
  city: "[City, postcode]",
  country: "Bulgaria",
  email: "hello@smarthomekj.bg",
  phone: "+359 [phone]",
  workingHours: "Mon–Fri 09:00–18:00",
  bankIban: "[IBAN]",
  bankName: "[Bank]",
  dpoEmail: "privacy@smarthomekj.bg",
  shippingCents: 690,
  freeShippingFromCents: 15000,
  codEnabled: true,
  bankTransferEnabled: true,
  chatEnabled: true,
  chatAiEnabled: true,
  chatBotName: "KJ Assistant",
  chatExtraInstructions: "",
  instagram: "",
  facebook: "",
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await db.setting.findMany();
    const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]));
    return { ...defaultSettings, ...stored };
  } catch {
    return defaultSettings;
  }
});

export async function saveSettings(values: Partial<SiteSettings>) {
  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(value) },
        update: { value: JSON.stringify(value) },
      }),
    ),
  );
}
