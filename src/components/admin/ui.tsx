import Link from "next/link";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5 ${className}`}>{children}</div>;
}

const tones: Record<string, string> = {
  gray: "bg-cloud text-ink-2",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
};

export const statusTone: Record<string, string> = {
  PENDING: "amber",
  PAID: "blue",
  PROCESSING: "violet",
  SHIPPED: "blue",
  DELIVERED: "green",
  CANCELLED: "red",
  REFUNDED: "gray",
  NEW: "amber",
  CONTACTED: "blue",
  QUOTED: "violet",
  WON: "green",
  LOST: "gray",
  OPEN: "amber",
  IN_PROGRESS: "blue",
  DONE: "green",
  REJECTED: "red",
  RECEIVED: "amber",
  APPROVED: "blue",
  BOT: "violet",
  HUMAN: "amber",
  CLOSED: "gray",
  UNPAID: "amber",
};

export const statusLabel: Record<string, string> = {
  PENDING: "Чака",
  PAID: "Платена",
  PROCESSING: "Обработва се",
  SHIPPED: "Изпратена",
  DELIVERED: "Доставена",
  CANCELLED: "Отказана",
  REFUNDED: "Възстановена",
  NEW: "Ново",
  CONTACTED: "Свързахме се",
  QUOTED: "Изпратена оферта",
  WON: "Спечелено",
  LOST: "Загубено",
  OPEN: "Отворено",
  IN_PROGRESS: "В процес",
  DONE: "Изпълнено",
  REJECTED: "Отхвърлено",
  RECEIVED: "Получен",
  APPROVED: "Одобрен",
  BOT: "Бот",
  HUMAN: "Човек",
  CLOSED: "Затворен",
  UNPAID: "Неплатена",
  CARD: "Карта",
  COD: "Наложен платеж",
  BANK: "Банков превод",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ${tones[statusTone[value] ?? "gray"]}`}>
      {statusLabel[value] ?? value}
    </span>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-white ring-1 ring-black/5">
      <table className="w-full text-left text-[14px]">
        <thead className="border-b border-line text-[12px] uppercase tracking-wide text-mute">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-[20px] bg-white p-10 text-center text-mute ring-1 ring-black/5">{text}</p>;
}

export function Filters({ base, current, options }: { base: string; current?: string; options: Record<string, string> }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      <Link href={base} className={`rounded-full px-3 py-1.5 text-[13px] ${!current ? "bg-ink text-white" : "bg-white ring-1 ring-black/5"}`}>
        Всички
      </Link>
      {Object.entries(options).map(([value, label]) => (
        <Link
          key={value}
          href={`${base}?status=${value}`}
          className={`rounded-full px-3 py-1.5 text-[13px] ${current === value ? "bg-ink text-white" : "bg-white ring-1 ring-black/5"}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
export const labelCls = "mb-1 block text-[12px] font-medium text-mute";
