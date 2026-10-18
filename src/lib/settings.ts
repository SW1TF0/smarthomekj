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
  chatBotName: string;
  instagram: string;
  facebook: string;
  installBaseCents: number;
  installPairCents: number;
  installWallCents: number;
  installMountCents: number;
  installProCents: number;
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
  chatBotName: "KJ Assistant",
  instagram: "",
  facebook: "",
  // Installation rates used by the price calculator (gross, VAT included).
  installBaseCents: 3900,
  installPairCents: 600,
  installWallCents: 1200,
  installMountCents: 2900,
  installProCents: 3900,
};
