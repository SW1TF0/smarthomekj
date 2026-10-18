import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card, PageHeader, inputCls } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/money";
import { adminChatReply, deleteChat, setChatMode } from "../../actions";

const who: Record<string, string> = { USER: "Клиент", BOT: "Бот", ADMIN: "Екип", SYSTEM: "Система" };

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const chat = await db.chatConversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!chat) notFound();
  if (chat.unreadForAdmin) await db.chatConversation.update({ where: { id }, data: { unreadForAdmin: false } });

  return (
    <>
      <AutoRefresh ms={4000} />
      <PageHeader
        title="Разговор"
        subtitle={`Започнат ${formatDate(chat.createdAt)} · език ${chat.locale.toUpperCase()}`}
        action={
          <Link href="/admin/chats" className="text-[14px] text-link">
            ← Всички разговори
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <Card className="flex flex-col">
          <div className="max-h-[60vh] flex-1 space-y-3 overflow-y-auto pr-2">
            {chat.messages.map((m) =>
              m.role === "SYSTEM" ? (
                <p key={m.id} className="text-center text-[12px] text-mute">
                  {m.content}
                </p>
              ) : (
                <div key={m.id} className={`flex ${m.role === "USER" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] ${
                      m.role === "USER" ? "bg-cloud" : m.role === "ADMIN" ? "bg-ink text-white" : "bg-accent/10 text-ink"
                    }`}
                  >
                    <p className="mb-0.5 text-[11px] opacity-60">
                      {who[m.role]} · {formatDate(m.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ),
            )}
          </div>
          {chat.mode !== "CLOSED" && (
            <form action={adminChatReply.bind(null, chat.id)} className="mt-4 flex gap-2 border-t border-line pt-4">
              <textarea name="content" rows={2} required placeholder="Отговорете като човек от екипа…" className={`${inputCls} flex-1`} />
              <button className="btn btn-primary btn-sm self-end">Изпрати</button>
            </form>
          )}
        </Card>
        <Card className="h-fit space-y-4 text-[14px]">
          <p>
            Режим: <Badge value={chat.mode} />
          </p>
          <p className="text-[13px] text-mute">Когато пишете, ботът спира да отговаря в този разговор. Върнете го на бота, когато приключите.</p>
          <div className="flex flex-col gap-2">
            {chat.mode !== "BOT" && (
              <form action={setChatMode.bind(null, chat.id, "BOT")}>
                <button className="btn btn-sm w-full bg-cloud">Върни на бота</button>
              </form>
            )}
            {chat.mode !== "HUMAN" && (
              <form action={setChatMode.bind(null, chat.id, "HUMAN")}>
                <button className="btn btn-sm w-full bg-cloud">Поеми разговора</button>
              </form>
            )}
            {chat.mode !== "CLOSED" && (
              <form action={setChatMode.bind(null, chat.id, "CLOSED")}>
                <button className="btn btn-sm w-full bg-cloud">Затвори</button>
              </form>
            )}
          </div>
          <form action={deleteChat.bind(null, chat.id)}>
            <ConfirmButton message="Да изтрия ли целия разговор?">Изтрий разговора</ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  );
}
