import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faqs, products } from "./seed-data";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@smarthomekj.bg").toLowerCase();
  if (process.env.VERCEL && !process.env.ADMIN_PASSWORD) throw new Error("Set ADMIN_PASSWORD before deploying.");
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  if (!(await db.adminUser.findUnique({ where: { email } }))) {
    await db.adminUser.create({ data: { email, name: "Администратор", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Admin created: ${email}`);
  }

  // Products are upserted by slug, so re-running the seed updates prices but keeps stock.
  for (const [i, p] of products.entries()) {
    const translations = JSON.stringify({ bg: p.bg, en: p.en, tr: p.tr });
    await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, sku: p.sku, category: p.category, priceCents: p.priceCents, stock: p.stock, featured: !!p.featured, sortOrder: i, translations },
      update: { priceCents: p.priceCents, translations },
    });
  }
  console.log(`${products.length} products seeded`);

  if ((await db.faqEntry.count()) === 0) {
    for (const [i, f] of faqs.entries()) {
      await db.faqEntry.create({
        data: {
          keywords: f.keywords,
          sortOrder: i,
          translations: JSON.stringify({
            bg: { q: f.bg[0], a: f.bg[1] },
            en: { q: f.en[0], a: f.en[1] },
            tr: { q: f.tr[0], a: f.tr[1] },
          }),
        },
      });
    }
    console.log(`${faqs.length} FAQ entries seeded`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
