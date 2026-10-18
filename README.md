# SmartHomeKJ

Website and online shop for SmartHomeKJ: smart home design, installation and devices in Bulgaria.
Hosted free on **GitHub Pages**, with **Firebase** (free Spark plan) as the database and admin login.

- **Languages:** Bulgarian (main), English, Turkish. `/bg/`, `/en/`, `/tr/`; visitors are sent to their browser language.
- **Shop:** catalogue, bag, checkout with cash on delivery or bank transfer (bank details are shown after the order). Prices in EUR incl. VAT.
- **Support chat:** answers from the FAQ; visitors can ask for a person and the team replies live from the admin panel.
- **Admin panel** (`/admin/`, in Bulgarian): dashboard, orders, products, consultation requests, live chat, FAQ, GDPR requests and withdrawals, company settings, team.
- **EU compliance:** cookie consent with equal "reject all", consent log, GDPR data request form with export/erase tools, privacy/cookie/terms/returns/accessibility/company pages, 14-day withdrawal with an online withdrawal form and printable receipt, "Order with obligation to pay" button, VAT-inclusive prices, chat-bot disclosure.

What the free plan leaves out: card payments, AI chat answers and automatic emails all need a server. Orders show a printable confirmation instead, and the admin has a "Пиши на клиента" button that opens a ready email.

## Going live (one time)

### 1. Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com), **Add project**, name it `smarthomekj` (Google Analytics: off).
2. **Build → Firestore Database → Create database**, location **eur3 (Europe)**, start in **production mode**.
3. **Firestore → Rules:** replace everything with the contents of [`firestore.rules`](firestore.rules) and press **Publish**.
4. **Build → Authentication → Get started → Email/Password → Enable → Save.**
5. **Project settings (gear) → Your apps → Web (`</>`)**, name it `site`, no hosting. Copy the six values from `firebaseConfig`.
6. **Authentication → Settings → Authorized domains → Add domain:** `sw1tf0.github.io`.

### 2. GitHub

1. Repository **Settings → Secrets and variables → Actions → Variables → New repository variable**, one per value:
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Every push to `main` publishes the site to https://sw1tf0.github.io/smarthomekj/ (tab **Actions** shows progress). To publish again without a change: **Actions → Deploy site to GitHub Pages → Run workflow**.

### 3. First login

1. Open https://sw1tf0.github.io/smarthomekj/admin/. The first time it asks you to create the owner account.
2. On the dashboard press **Зареди продуктите и въпросите** to copy the starter catalogue and FAQ into the database.
3. **Настройки:** fill in every field marked in yellow (registered name, EIK, VAT number, address, phone, IBAN). They appear in the footer, legal pages and order confirmations.
4. **Потребители:** add colleagues (editors cannot change settings).

### Before launch

- Have a lawyer review the legal texts in `src/i18n/legal/`.
- Re-check prices against eMAG/Ozone/Technopolis (see `docs/pricing-research.md`).
- New orders arrive as **Чака** (pending). Call or email the customer, then set **Потвърдена**: that takes the items out of stock. **Отказана** puts them back. The order page warns if the prices in an order do not match the catalogue.

## Local development

```bash
cp .env.example .env.local   # paste the Firebase values, or leave empty to browse with the starter catalogue
npm install
npm run dev                  # http://localhost:3000/bg/
```

To test with a local database instead of the real one: install the Firebase CLI, run `firebase emulators:start --only auth,firestore`, and set `NEXT_PUBLIC_FIREBASE_EMULATOR=1` with any `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-smarthomekj`.

`npm run build` writes the static site to `out/`.

## Where things live

- `src/i18n/dictionaries/*.ts`: all site text per language
- `src/i18n/legal/*.ts`: legal pages per language (filled from company settings)
- `src/app/[locale]/`: public pages; `src/app/admin/`: admin panel
- `src/lib/store.ts`: what the public site reads and writes in Firestore; `src/lib/admin-store.ts`: admin operations
- `firestore.rules`: who may read and write what (visitors can only create orders, requests and chat messages)
- `src/data/seed.ts`: starter products and FAQ
- `.github/workflows/deploy.yml`: build and publish to GitHub Pages
