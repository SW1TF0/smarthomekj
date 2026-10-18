import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { parseJson } from "./json";
import { formatMoney } from "./money";
import { getSettings, type SiteSettings } from "./settings";

type FaqTranslations = Record<string, { q: string; a: string }>;
type ProductTranslations = Record<string, { name: string; tagline?: string }>;
type HistoryMessage = { role: string; content: string };

const fallbackText: Record<Locale, (s: SiteSettings) => string> = {
  bg: (s) =>
    `Благодаря за въпроса! Нямам точен отговор, но колега ще ви помогне. Натиснете „Искам да говоря с човек“, пишете на ${s.email} или се обадете на ${s.phone}.`,
  en: (s) =>
    `Thanks for your question! I don't have an exact answer, but a colleague can help. Tap "Talk to a person", email ${s.email} or call ${s.phone}.`,
  tr: (s) =>
    `Sorunuz için teşekkürler! Kesin bir cevabım yok ama bir meslektaşım yardımcı olabilir. "Bir insanla konuşmak istiyorum" düğmesine basın, ${s.email} adresine yazın veya ${s.phone} numarasını arayın.`,
};

const humanText: Record<Locale, string> = {
  bg: "Благодарим, уведомихме екипа. Човек ще ви отговори тук възможно най-скоро.",
  en: "Thanks, we've notified the team. A person will reply here as soon as possible.",
  tr: "Teşekkürler, ekibe haber verdik. Bir kişi en kısa sürede burada yanıt verecek.",
};

export function humanRequestedText(locale: Locale) {
  return humanText[locale];
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Keyword match against the FAQ, used when no AI key is configured or the AI call fails. */
async function faqAnswer(question: string, locale: Locale, settings: SiteSettings) {
  const faqs = await db.faqEntry.findMany({ where: { active: true } });
  const words = new Set(normalize(question));
  let best: { score: number; answer: string } = { score: 0, answer: "" };

  for (const faq of faqs) {
    const tr = parseJson<FaqTranslations>(faq.translations, {});
    const entry = tr[locale] ?? tr.bg ?? tr.en;
    if (!entry) continue;
    const keywords = normalize(`${faq.keywords} ${entry.q}`);
    let score = 0;
    for (const k of keywords) {
      for (const w of words) {
        if (w === k) score += 2;
        else if (w.length > 4 && k.length > 4 && (w.startsWith(k.slice(0, 5)) || k.startsWith(w.slice(0, 5)))) score += 1;
      }
    }
    if (score > best.score) best = { score, answer: entry.a };
  }

  return best.score >= 2 ? best.answer : fallbackText[locale](settings);
}

async function buildSystemPrompt(locale: Locale, settings: SiteSettings) {
  const [faqs, products] = await Promise.all([
    db.faqEntry.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const faqText = faqs
    .map((f) => {
      const t = parseJson<FaqTranslations>(f.translations, {});
      const e = t[locale] ?? t.bg;
      return e ? `Q: ${e.q}\nA: ${e.a}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const productText = products
    .map((p) => {
      const t = parseJson<ProductTranslations>(p.translations, {});
      const e = t[locale] ?? t.bg;
      const stock = p.stock > 0 ? `in stock (${p.stock})` : "out of stock";
      return `- ${e?.name ?? p.slug}: ${formatMoney(p.priceCents, locale)} incl. VAT, ${stock}, ${site}/${locale}/shop/${p.slug}`;
    })
    .join("\n");

  const language = { bg: "Bulgarian", en: "English", tr: "Turkish" }[locale];

  return `You are ${settings.chatBotName}, the support assistant on the website of ${settings.companyName}, a Bulgarian company that designs, installs and supports smart homes and sells smart home devices online.

Answer in ${language} unless the visitor clearly writes in another language; then answer in theirs. Keep answers short and friendly: two to four sentences, plain text, no markdown headings. Lead with the answer.

What you can help with: choosing devices, how smart home systems work, our installation service, delivery, payment, returns and the 14-day right of withdrawal, and general questions about an order.

Rules:
- Only state prices, stock and policies that appear below. Never invent prices, discounts or delivery dates. For installation prices say that we give a fixed quote after a free consultation, and point to ${site}/${locale}/contact.
- Never ask for or accept card numbers, passwords or ID numbers. Order status questions: ask for the order number and say the team will confirm; you cannot see orders.
- If the visitor wants a person, has a complaint, or you are not sure, tell them to tap the "talk to a person" button in the chat or contact ${settings.email} / ${settings.phone}.
- To withdraw from a purchase, point to ${site}/${locale}/withdraw. For privacy requests, point to ${site}/${locale}/data-request.
- You are an AI assistant. If asked, say so plainly.

Company: ${settings.legalName}, ${settings.address}, ${settings.city}. Email ${settings.email}, phone ${settings.phone}, hours ${settings.workingHours}.
Delivery in Bulgaria: ${formatMoney(settings.shippingCents, locale)}, free from ${formatMoney(settings.freeShippingFromCents, locale)}. Payment: card${settings.codEnabled ? ", cash on delivery" : ""}${settings.bankTransferEnabled ? ", bank transfer" : ""}. Prices in EUR incl. 20% VAT.

Products:
${productText || "(none listed)"}

FAQ:
${faqText || "(none)"}
${settings.chatExtraInstructions ? `\nExtra instructions from the shop owner:\n${settings.chatExtraInstructions}` : ""}`;
}

let client: Anthropic | null = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

/** Generate the bot reply for the latest visitor message. */
export async function botReply(history: HistoryMessage[], locale: Locale): Promise<string> {
  const settings = await getSettings();
  const lastUser = [...history].reverse().find((m) => m.role === "USER")?.content ?? "";
  const ai = settings.chatAiEnabled ? anthropic() : null;
  if (!ai) return faqAnswer(lastUser, locale, settings);

  // The API needs alternating user/assistant turns that start with the user.
  const turns: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of history.slice(-20)) {
    if (m.role === "SYSTEM") continue;
    const role = m.role === "USER" ? "user" : "assistant";
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content = `${last.content}\n\n${m.content}`;
    else turns.push({ role, content: m.content });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return faqAnswer(lastUser, locale, settings);

  try {
    const response = await ai.beta.messages.create({
      model: process.env.CHAT_MODEL || "claude-opus-5-5",
      max_tokens: 1024,
      system: await buildSystemPrompt(locale, settings),
      messages: turns,
      output_config: { effort: "low" },
      // If the model declines, the API retries on a fallback model automatically.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    if (response.stop_reason === "refusal") return fallbackText[locale](settings);
    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    return text || faqAnswer(lastUser, locale, settings);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.warn("Chat AI rate limited, using FAQ");
    else if (error instanceof Anthropic.AuthenticationError) console.error("Chat AI: invalid ANTHROPIC_API_KEY");
    else if (error instanceof Anthropic.APIError) console.error(`Chat AI error ${error.status}: ${error.message}`);
    else console.error("Chat AI failed", error);
    return faqAnswer(lastUser, locale, settings);
  }
}
