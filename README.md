# SmartHomeKJ

Website and online shop for SmartHomeKJ: smart home design, installation and devices in Bulgaria.

- **Languages:** Bulgarian (main), English, Turkish. `/bg`, `/en`, `/tr`; visitors are sent to their browser language.
- **Shop:** catalogue, bag, checkout with card (Stripe), cash on delivery or bank transfer. Prices in EUR incl. VAT.
- **Support chat:** answers automatically with Claude when `ANTHROPIC_API_KEY` is set, otherwise from the FAQ. The team can take over any conversation from the admin panel.
- **Admin panel** (`/admin`, in Bulgarian): dashboard, orders, products, consultation requests, chat, FAQ, GDPR requests and withdrawals, company settings, users.
- **EU compliance:** cookie consent with equal "reject all", consent log, GDPR data request form with export/erase tools, privacy/cookie/terms/returns/accessibility/company pages, 14-day withdrawal with an online withdrawal function and email receipt, "Order with obligation to pay" button, VAT-inclusive prices, AI-chat disclosure.

## Run locally

```bash
cp .env.example .env      # then edit values
npm install
npm run setup             # creates the SQLite database and seeds products, FAQ and the admin user
npm run dev               # http://localhost:3000
```

Admin: http://localhost:3000/admin with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. Change the password after the first login.

## Before going live

1. **Admin → Settings:** fill in every field marked in yellow (registered name, EIK, VAT number, address, phone, IBAN). These appear in the footer, legal pages and emails.
2. **Database:** in `prisma/schema.prisma` change `provider = "sqlite"` to `"postgresql"`, set `DATABASE_URL`, run `npm run setup`.
3. **Stripe:** set `STRIPE_SECRET_KEY`, add a webhook to `https://YOUR-DOMAIN/api/stripe/webhook` with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, and set `STRIPE_WEBHOOK_SECRET`.
4. **Email:** set `SMTP_*` so customers get order confirmations and withdrawal receipts.
5. **Chat AI (optional):** set `ANTHROPIC_API_KEY`.
6. Set `NEXT_PUBLIC_SITE_URL` and a long random `AUTH_SECRET`.
7. Have a lawyer review the legal texts in `src/i18n/legal/`.
8. Re-check prices against eMAG/Ozone/Technopolis (see `docs/pricing-research.md`).

Hosting: any Node host (Vercel, Railway, a VPS). `npm run build && npm start`.

## Where things live

- `src/i18n/dictionaries/*.ts` — all site text per language
- `src/i18n/legal/*.ts` — legal pages per language (filled from company settings)
- `src/app/[locale]/` — public pages; `src/app/admin/` — admin panel
- `src/lib/chat-bot.ts` — chat answers (Claude + FAQ fallback)
- `prisma/seed-data.ts` — starter products and FAQ
