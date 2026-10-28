import type { CalcSetup } from "./calculator";

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
  /** Automatic emails through EmailJS (emailjs.com, free plan). All three must be filled in for emails to go out. */
  emailServiceId: string;
  emailTemplateId: string;
  emailPublicKey: string;
  emailOrderConfirm: boolean;
  emailStatusUpdates: boolean;
  emailNotifyOwner: boolean;
  /** Where "new order" notices go; empty means the customer email above. */
  notifyEmail: string;
  /** Invoices. When the company is not VAT registered, invoices carry no VAT and cite art. 113(9) ZDDS. */
  vatRegistered: boolean;
  invoiceStartNumber: number;
  invoicePlace: string;
  invoiceCompiler: string;
  /** Price calculator setup from Admin → Калкулатор. Missing until the owner saves it; see setupFrom(). */
  calculator?: CalcSetup | null;
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
  emailServiceId: "",
  emailTemplateId: "",
  emailPublicKey: "",
  emailOrderConfirm: true,
  emailStatusUpdates: true,
  emailNotifyOwner: true,
  notifyEmail: "",
  vatRegistered: true,
  invoiceStartNumber: 1,
  invoicePlace: "",
  invoiceCompiler: "",
  // Old per-class installation rates (gross, VAT included). They seed the calculator's starter setup.
  installBaseCents: 3900,
  installPairCents: 600,
  installWallCents: 1200,
  installMountCents: 2900,
  installProCents: 3900,
};
