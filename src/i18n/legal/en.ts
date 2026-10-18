import type { LegalDocs } from "./types";

const en: LegalDocs = (s) => ({
  privacy: [
    {
      h: "1. Who we are",
      p: [
        `The controller of your personal data is ${s.legalName}, UIC ${s.eik}, registered office ${s.address}, ${s.city}, ${s.country} ("SmartHomeKJ", "we"). Contact: ${s.email}, ${s.phone}. For privacy questions write to ${s.dpoEmail}.`,
      ],
    },
    {
      h: "2. What data we process and why",
      p: [
        "Orders: name, email, phone, delivery and invoice details, order contents and payment status. Legal basis: performance of a contract (Art. 6(1)(b) GDPR) and our legal obligations under accounting and tax law (Art. 6(1)(c)).",
        "Consultation and quote requests: the details you send us through the contact form. Legal basis: steps prior to entering into a contract at your request (Art. 6(1)(b)).",
        "Support chat: the messages you write, the language of the page and a random visitor identifier stored in your browser. Legal basis: our legitimate interest in answering your questions (Art. 6(1)(f)) and, where it relates to an order, performance of a contract.",
        "Cookie consent: a record of your choice, the date and your browser type, so we can prove consent (Art. 7(1)).",
        "Website security: technical logs such as IP address, kept for a short period to protect the site from abuse (Art. 6(1)(f)).",
      ],
    },
    {
      h: "3. AI-assisted support",
      p: [
        "Our chat answers automatically from our FAQ, and a member of our team can take over at any time. Messages are stored so we can answer you. Please do not share card numbers, passwords or health data in the chat.",
      ],
    },
    {
      h: "4. Who receives your data",
      p: [
        "We share data only with processors that help us run the shop: Google Ireland Ltd. (Firebase), which stores orders, requests and chat messages in the EU region we choose; GitHub, Inc., which hosts the website files and may log your IP address when pages load; courier companies for delivery; our accountant; and our email provider. Every processor is bound by a data processing agreement. Transfers to the USA rely on the EU-US Data Privacy Framework or standard contractual clauses.",
        "Some providers may process data outside the EEA (for example in the United States). In such cases transfers are based on an adequacy decision (EU–US Data Privacy Framework) or Standard Contractual Clauses.",
      ],
    },
    {
      h: "5. How long we keep it",
      p: [
        "Order and invoice data: 10 years, as required by the Bulgarian Accountancy Act. Inquiries: up to 2 years after our last contact. Chat conversations: up to 12 months. Consent records: for as long as the consent is valid plus 3 years.",
      ],
    },
    {
      h: "6. Your rights",
      p: [
        "You have the right to access, rectify and erase your data, to restrict or object to processing, to data portability and to withdraw consent at any time without affecting earlier processing. Use the 'Your data rights' form on this site or write to us. We answer within one month.",
        "You can also lodge a complaint with the Bulgarian Commission for Personal Data Protection (cpdp.bg, 2 Prof. Tsvetan Lazarov Blvd., Sofia 1592) or the authority in your EU country.",
      ],
    },
    {
      h: "7. Security",
      p: [
        "The site uses encrypted HTTPS connections. We do not take card payments online. Access to the admin system is limited to authorised staff, protected by passwords, and enforced by database access rules.",
      ],
    },
  ],
  cookies: [
    {
      h: "What cookies are",
      p: ["Cookies are small text files stored in your browser. Similar technologies such as local storage are covered by this policy too."],
    },
    {
      h: "Strictly necessary (always on)",
      p: [
        "NEXT_LOCALE: remembers your language, 1 year.",
        "shkj_consent: stores your cookie choice, 6 months.",
        "shkj_cart (local storage): keeps the contents of your bag until you clear it.",
        "shkj_visitor (local storage): a random identifier that lets the support chat show your conversation.",
        "shkj_admin: session for staff signed in to the admin panel, 12 hours.",
        "Your bag, a random visitor ID and your chat ID are kept in your browser's local storage. They are needed for the shop and chat to work and are never used for tracking.",
      ],
    },
    {
      h: "Analytics and marketing (only with consent)",
      p: [
        "These are switched off by default. We activate them only if you allow them in the cookie banner. Today the site does not load any analytics or marketing tools; if we add any, they will be listed here before they are used.",
      ],
    },
    {
      h: "Changing your choice",
      p: ["Use 'Cookie settings' in the footer of every page to change or withdraw your consent at any time. Rejecting is as easy as accepting."],
    },
  ],
  terms: [
    {
      h: "1. Seller",
      p: [
        `These terms govern purchases from the online shop of ${s.legalName}, UIC ${s.eik}, VAT ${s.vatNumber}, ${s.address}, ${s.city}, ${s.country}, email ${s.email}, phone ${s.phone}.`,
      ],
    },
    {
      h: "2. Products and prices",
      p: [
        "Product descriptions show the main characteristics of each item. Prices are in euro (EUR) and include 20% VAT. Delivery costs are shown in the bag before you order.",
      ],
    },
    {
      h: "3. How a contract is made",
      p: [
        "You add products to the bag, enter your details, choose a payment method and click 'Order with obligation to pay'. The contract is concluded when we confirm your order by email or phone. You can correct input errors at any step before you place the order. The contract language may be Bulgarian, English or Turkish. We store the contract. You can print or save it at the end of checkout, and you receive a copy with the delivery.",
      ],
    },
    {
      h: "4. Payment",
      p: ["Cash on delivery or bank transfer. For bank transfer we ship after the payment is received."],
    },
    {
      h: "5. Delivery",
      p: [
        "We deliver in Bulgaria by courier, usually within 1–3 business days and at the latest within 30 days. The risk passes to you when you or a person you name receives the goods.",
      ],
    },
    {
      h: "6. Right of withdrawal",
      p: [
        "Consumers may withdraw from the contract within 14 days without giving a reason. Details and the withdrawal form are in our Withdrawal & Returns policy, and you can withdraw online using the 'Withdraw from a contract' function linked in the footer.",
      ],
    },
    {
      h: "7. Legal guarantee and complaints",
      p: [
        "All goods have a legal guarantee of conformity of 2 years from delivery under the Bulgarian Act on the Provision of Digital Content and Digital Services and the Sale of Goods. Send complaints to our email with your order number; we resolve them within 14 days. Any commercial warranty from the manufacturer applies in addition to your legal rights.",
      ],
    },
    {
      h: "8. Installation services",
      p: [
        "Installations are agreed in a separate written offer. If you ask us to start work during the withdrawal period and the service is fully performed, you lose the right of withdrawal for that service.",
      ],
    },
    {
      h: "9. Disputes",
      p: [
        "We try to solve every issue directly. You may also contact the Commission for Consumer Protection (kzp.bg, 4A Slaveykov Square, Sofia) or a conciliation committee for out-of-court resolution. Bulgarian law applies, without removing the protection given to you by the mandatory rules of the country where you live.",
      ],
    },
  ],
  returns: [
    {
      h: "Right of withdrawal",
      p: [
        "You have the right to withdraw from this contract within 14 days without giving any reason. The period ends 14 days after the day on which you, or a third party other than the carrier indicated by you, receives the goods.",
        `To exercise the right, inform us (${s.legalName}, ${s.address}, ${s.city}, ${s.email}, ${s.phone}) of your decision with a clear statement. You can use the online 'Withdraw from a contract' form on this site, which gives you a confirmation to save or print, or the model form below, but it is not obligatory. It is enough to send your notice before the period expires.`,
      ],
    },
    {
      h: "Effects of withdrawal",
      p: [
        "We will refund all payments received from you, including the standard delivery cost, without undue delay and at the latest within 14 days of receiving your notice. We use the same payment method you used, unless you agree otherwise; you will not pay any fees for the refund. We may withhold the refund until we receive the goods back or you show proof of sending them.",
        `Please send the goods back to ${s.address}, ${s.city} within 14 days of notifying us. You bear the direct cost of returning the goods. You are only liable for any diminished value resulting from handling beyond what is necessary to establish the nature, characteristics and functioning of the goods.`,
      ],
    },
    {
      h: "Exceptions",
      p: [
        "The right of withdrawal does not apply to goods made to your specifications, sealed goods that are not suitable for return for hygiene reasons once unsealed, and services that have been fully performed with your prior express consent.",
      ],
    },
    {
      h: "Model withdrawal form",
      p: [
        `To: ${s.legalName}, ${s.address}, ${s.city}, ${s.email}`,
        "I/We hereby give notice that I/We withdraw from my/our contract of sale of the following goods: ____",
        "Ordered on / received on: ____ · Order number: ____",
        "Name of consumer(s): ____ · Address of consumer(s): ____",
        "Signature of consumer(s) (only if this form is notified on paper) · Date: ____",
      ],
    },
  ],
  imprint: [
    {
      h: "Company",
      p: [
        s.legalName,
        `UIC (EIK): ${s.eik}`,
        `VAT number: ${s.vatNumber}`,
        `Managing director: ${s.manager}`,
        `Registered office: ${s.address}, ${s.city}, ${s.country}`,
        "Registered in the Commercial Register at the Registry Agency of Bulgaria.",
      ],
    },
    { h: "Contact", p: [`Email: ${s.email}`, `Phone: ${s.phone}`, `Working hours: ${s.workingHours}`] },
    {
      h: "Supervisory authorities",
      p: [
        "Commission for Consumer Protection, kzp.bg",
        "Commission for Personal Data Protection, cpdp.bg",
        "National Revenue Agency, nra.bg",
      ],
    },
  ],
  accessibility: [
    {
      h: "Our commitment",
      p: [
        "We want everyone to be able to use our website and shop, in line with the European Accessibility Act (Directive (EU) 2019/882) and the WCAG 2.1 level AA guidelines.",
      ],
    },
    {
      h: "What we do",
      p: [
        "Semantic page structure and headings, full keyboard navigation with visible focus, text alternatives for images, sufficient colour contrast, respect for the 'reduce motion' setting, and forms with clear labels and error messages.",
      ],
    },
    {
      h: "Feedback",
      p: [`If something is hard to use, tell us at ${s.email} or ${s.phone}. We reply within 5 business days and will help you complete your order another way if needed.`],
    },
  ],
});

export default en;
