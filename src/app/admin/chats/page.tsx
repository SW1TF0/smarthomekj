"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Empty, Filters, Loading, PageHeader, Table, Td } from "@/components/admin/ui";
import { toDate, type ChatRow, type Row } from "@/lib/admin-store";
import { firestore } from "@/lib/firebase";
import { formatDate } from "@/lib/money";

export default function ChatsPage() {
  const [status, setStatus] = useState("");
  const [chats, setChats] = useState<Row<ChatRow>[] | null>(null);
  const [error, setError] = useState("");

  // Live list: new conversations and messages show up without reloading.
  useEffect(() => {
    const db = firestore();
    if (!db) return;
    return onSnapshot(
      query(collection(db, "chats"), orderBy("lastMessageAt", "desc"), limit(150)),
      (snap) => setChats(snap.docs.map((d) => ({ ...(d.data() as ChatRow), id: d.id }))),
      (e) => setError(e.message),
    );
  }, []);

  if (!chats) return <Loading error={error} />;
  const rows = chats.filter((c) => !status || c.mode === status);

  return (
    <>
      <PageHeader title="Чат" subtitle="Ботът отговаря от „Въпроси и отговори“. Отворете разговор и напишете, за да поемете. „Човек“ значи, че клиентът чака вас." />
      <Filters current={status} onChange={setStatus} options={{ HUMAN: "Чакат човек", BOT: "Бот", CLOSED: "Затворени" }} />
      {rows.length === 0 ? (
        <Empty text="Няма разговори." />
      ) : (
        <Table head={["Разговор", "Режим", "Език", "Активност"]}>
          {rows.map((c) => (
            <tr key={c.id} className={c.unreadForAdmin ? "bg-blue-50/40" : ""}>
              <Td>
                <Link href={`/admin/chats/view/?id=${c.id}`} className="text-link">
                  {c.unreadForAdmin && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" />}
                  {c.visitorName || c.visitorEmail || `Посетител ${c.visitorId?.slice(0, 6) ?? ""}`}
                </Link>
              </Td>
              <Td>
                <Badge value={c.mode} />
              </Td>
              <Td>{c.locale?.toUpperCase()}</Td>
              <Td className="whitespace-nowrap text-mute">{formatDate(toDate(c.lastMessageAt))}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
