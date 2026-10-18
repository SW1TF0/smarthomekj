import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { botReply, humanRequestedText } from "@/lib/chat-bot";
import { db } from "@/lib/db";
import { notifyTeam } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

const select = { id: true, role: true, content: true, createdAt: true } as const;

const postSchema = z.object({
  conversationId: z.string().nullish(),
  visitorId: z.string().min(8).max(64),
  message: z.string().max(1500).default(""),
  locale: z.string().optional(),
  requestHuman: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  if (!rateLimit(`chat:${clientIp(request.headers)}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const settings = await getSettings();
  if (!settings.chatEnabled) return NextResponse.json({ error: "disabled" }, { status: 503 });

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { visitorId, requestHuman } = parsed.data;
  const message = parsed.data.message.trim();
  const locale: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : "bg";
  if (!message && !requestHuman) return NextResponse.json({ error: "empty" }, { status: 400 });

  let conversation = parsed.data.conversationId
    ? await db.chatConversation.findFirst({ where: { id: parsed.data.conversationId, visitorId } })
    : null;
  if (!conversation || conversation.mode === "CLOSED") {
    conversation = await db.chatConversation.create({ data: { visitorId, locale } });
  }

  const since = new Date();
  if (message) {
    await db.chatMessage.create({ data: { conversationId: conversation.id, role: "USER", content: message } });
  }

  let mode = conversation.mode;
  if (requestHuman && mode !== "HUMAN") {
    mode = "HUMAN";
    await db.chatMessage.create({
      data: { conversationId: conversation.id, role: "SYSTEM", content: humanRequestedText(locale) },
    });
    const admin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    notifyTeam("Chat: a visitor asked for a person", `Open the conversation: ${admin}/admin/chats/${conversation.id}`);
  } else if (mode === "BOT" && message) {
    const history = await db.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 40,
    });
    const reply = await botReply(history, locale);
    await db.chatMessage.create({ data: { conversationId: conversation.id, role: "BOT", content: reply } });
  }

  await db.chatConversation.update({
    where: { id: conversation.id },
    data: { mode, unreadForAdmin: true, lastMessageAt: new Date(), locale },
  });

  const messages = await db.chatMessage.findMany({
    where: { conversationId: conversation.id, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select,
  });
  return NextResponse.json({ conversationId: conversation.id, mode, messages });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const conversationId = params.get("conversationId");
  const visitorId = params.get("visitorId");
  if (!conversationId || !visitorId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!rateLimit(`chat-poll:${clientIp(request.headers)}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const conversation = await db.chatConversation.findFirst({ where: { id: conversationId, visitorId } });
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const after = params.get("after");
  const messages = await db.chatMessage.findMany({
    where: { conversationId, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    orderBy: { createdAt: "asc" },
    select,
    take: 100,
  });
  return NextResponse.json({ mode: conversation.mode, messages });
}
