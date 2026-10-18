"use client";

import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card, Empty, Loading, PageHeader, inputCls } from "@/components/admin/ui";
import { adminReply, deleteChat, markChatRead, setChatMode, toDate, type ChatRow } from "@/lib/admin-store";
import { firestore } from "@/lib/firebase";
import { formatDate } from "@/lib/money";
import type { ChatMessage } from "@/lib/store";

const who: Record<string, string> = { USER: "Клиент", BOT: "Бот", ADMIN: "Екип", SYSTEM: "Система" };

export default function ChatPage() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const [chat, setChat] = useState<ChatRow | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = firestore();
    if (!db || !id) return setChat(null);
    const stopChat = onSnapshot(doc(db, "chats", id), (snap) => {
      const data = snap.exists() ? (snap.data() as ChatRow) : null;
      setChat(data);
      if (data?.unreadForAdmin) void markChatRead(id);
    });
    const stopMessages = onSnapshot(query(collection(db, "chats", id, "messages"), orderBy("createdAt", "asc")), (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))),
    );
    return () => {
      stopChat();
      stopMessages();
    };
  }, [id]);

  useEffect(() => bottom.current?.scrollIntoView({ block: "nearest" }), [messages.length]);

  if (chat === undefined) return <Loading />;
  if (!chat) return <Empty text="Разговорът не е намерен." />;

  return (
    <>
      <PageHeader
        title={chat.visitorName || "Разговор"}
        subtitle={`Започнат ${formatDate(toDate(chat.createdAt))} · език ${chat.locale.toUpperCase()}${chat.visitorEmail ? ` · ${chat.visitorEmail}` : ""}`}
        action={
          <Link href="/admin/chats/" className="text-[14px] text-link">
            ← Всички разговори
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <Card className="flex flex-col">
          <div className="max-h-[60vh] flex-1 space-y-3 overflow-y-auto pr-2" aria-live="polite">
            {messages.map((m) =>
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
                      {who[m.role]} · {m.createdAt ? formatDate(toDate(m.createdAt)) : "…"}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ),
            )}
            <div ref={bottom} />
          </div>
          {chat.mode !== "CLOSED" && (
            <form
              className="mt-4 flex gap-2 border-t border-line pt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const content = text.trim();
                if (!content) return;
                setSending(true);
                try {
                  await adminReply(id, chat, content);
                  setText("");
                } finally {
                  setSending(false);
                }
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                required
                aria-label="Отговор"
                placeholder="Отговорете като човек от екипа…"
                className={`${inputCls} flex-1`}
              />
              <button className="btn btn-primary btn-sm self-end" disabled={sending}>
                Изпрати
              </button>
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
              <button className="btn btn-sm w-full bg-cloud" onClick={() => setChatMode(id, "BOT")}>
                Върни на бота
              </button>
            )}
            {chat.mode !== "HUMAN" && (
              <button className="btn btn-sm w-full bg-cloud" onClick={() => setChatMode(id, "HUMAN")}>
                Поеми разговора
              </button>
            )}
            {chat.mode !== "CLOSED" && (
              <button className="btn btn-sm w-full bg-cloud" onClick={() => setChatMode(id, "CLOSED")}>
                Затвори
              </button>
            )}
          </div>
          <ConfirmButton
            message="Да изтрия ли целия разговор?"
            onConfirm={async () => {
              await deleteChat(id);
              router.push("/admin/chats/");
            }}
          >
            Изтрий разговора
          </ConfirmButton>
        </Card>
      </div>
    </>
  );
}
