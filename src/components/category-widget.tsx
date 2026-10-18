import type { Dictionary } from "@/i18n";
import { CategoryIcon } from "./icons";

type AppLabels = Dictionary["home"]["app"];

const card = "w-full max-w-[260px] rounded-[24px] bg-white p-5 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04]";

/** Small live-looking widget that illustrates each solution tile on the home page. */
export function CategoryWidget({ category, title, app }: { category: string; title: string; app: AppLabels }) {
  switch (category) {
    case "lighting":
      return (
        <div className={card} aria-hidden="true">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffcc00] text-white shadow-[0_0_30px_6px_rgba(255,204,0,0.45)]">
              <CategoryIcon category="lighting" size={20} strokeWidth={1.8} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold">{app.living}</span>
              <span className="block text-[13px] text-mute">80%</span>
            </span>
          </div>
          <div className="mt-5 h-9 overflow-hidden rounded-[12px] bg-[#e8e8ed]">
            <div className="h-full w-[80%] rounded-[12px] bg-gradient-to-r from-[#ffe08a] to-[#ffcc00]" />
          </div>
        </div>
      );
    case "climate":
      return (
        <div className={`${card} flex items-center gap-5`} aria-hidden="true">
          <div className="relative h-[92px] w-[92px] shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-[225deg]">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#e8e8ed" strokeWidth="12" strokeDasharray="226 302" strokeLinecap="round" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#ff9500" strokeWidth="12" strokeDasharray="150 302" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold tracking-tight">22°</span>
          </div>
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold">{app.bedroom}</span>
            <span className="block text-[13px] text-mute">{title}</span>
          </span>
        </div>
      );
    case "security":
      return (
        <div className={card} aria-hidden="true">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3] text-white">
              <CategoryIcon category="security" size={20} strokeWidth={1.8} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold">{app.frontDoor}</span>
              <span className="block text-[13px] text-[#1d8a3a]">{app.locked}</span>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="aspect-video rounded-[10px] bg-[linear-gradient(160deg,#5b6b7c,#2a333d)]" />
            <div className="aspect-video rounded-[10px] bg-[linear-gradient(160deg,#7a8a6a,#2f3a2a)]" />
          </div>
        </div>
      );
    case "energy":
      return (
        <div className={card} aria-hidden="true">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">{app.today}</span>
            <span className="text-[22px] font-semibold tracking-tight">4.2 kW</span>
          </div>
          <div className="mt-4 flex h-16 items-end gap-1.5">
            {[30, 45, 60, 80, 95, 85, 70, 50, 35].map((h, i) => (
              <span key={i} className="flex-1 rounded-full bg-[#34c759]" style={{ height: `${h}%`, opacity: 0.35 + h / 160 }} />
            ))}
          </div>
        </div>
      );
    case "entertainment":
      return (
        <div className={`${card} flex items-center gap-4`} aria-hidden="true">
          <span className="h-16 w-16 shrink-0 rounded-[14px] bg-[conic-gradient(from_200deg,#ff2d55,#af52de,#5e5ce6,#ff9500,#ff2d55)]" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[12px] text-mute">{app.nowPlaying}</span>
            <span className="mt-0.5 block truncate text-[14px] font-semibold">{app.living}</span>
            <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-[#e8e8ed]">
              <span className="block h-full w-[45%] rounded-full bg-ink" />
            </span>
          </span>
        </div>
      );
    default:
      return (
        <div className={`${card} flex items-center gap-4`} aria-hidden="true">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white">
            <CategoryIcon category="hubs" size={22} strokeWidth={1.8} />
          </span>
          <span className="flex h-10 flex-1 items-center gap-1">
            {[30, 60, 90, 50, 75, 40, 85, 55, 30, 65, 45, 25].map((h, i) => (
              <span key={i} className="flex-1 rounded-full bg-gradient-to-t from-[#0071e3] to-[#5ac8fa]" style={{ height: `${h}%` }} />
            ))}
          </span>
        </div>
      );
  }
}
