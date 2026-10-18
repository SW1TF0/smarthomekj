import Link from "next/link";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { Badge, Empty, Filters, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/money";

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const chats = await db.chatConversation.findMany({
    where: status ? { mode: status } : {},
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, _count: { select: { messages: true } } },
  });

  return (
    <>
      <AutoRefresh ms={8000} />
      <PageHeader
        title="Чат"
        subtitle="Ботът отговаря сам. Отворете разговор и напишете, за да поемете. „Човек“ значи, че клиентът чака вас."
      />
      <Filters base="/admin/chats" current={status} options={{ HUMAN: "Чакат човек", BOT: "Бот", CLOSED: "Затворени" }} />
      {chats.length === 0 ? (
        <Empty text="Няма разговори." />
      ) : (
        <Table head={["Последно съобщение", "Режим", "Език", "Съобщения", "Активност"]}>
          {chats.map((c) => (
            <tr key={c.id} className={c.unreadForAdmin ? "bg-blue-50/40" : ""}>
              <Td>
                <Link href={`/admin/chats/${c.id}`} className="line-clamp-2 max-w-[460px] text-link">
                  {c.unreadForAdmin && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" />}
                  {c.messages[0]?.content ?? "—"}
                </Link>
              </Td>
              <Td>
                <Badge value={c.mode} />
              </Td>
              <Td>{c.locale.toUpperCase()}</Td>
              <Td>{c._count.messages}</Td>
              <Td className="whitespace-nowrap text-mute">{formatDate(c.lastMessageAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
