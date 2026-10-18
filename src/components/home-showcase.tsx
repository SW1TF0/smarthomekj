import type { Dictionary } from "@/i18n";
import { CategoryIcon } from "./icons";

type AppLabels = Dictionary["home"]["app"];

/** Accessory button styled after a phone home-control app. Active tiles are light, idle tiles are glass. */
function Accessory({ category, name, state, active, tint }: { category: string; name: string; state: string; active?: boolean; tint: string }) {
  return (
    <div className={`flex aspect-[1.35] flex-col justify-between rounded-[18px] p-3 ${active ? "bg-white/95 text-ink" : "bg-white/12 text-white ring-1 ring-white/10"}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? tint : "bg-white/15 text-white/80"}`}>
        <CategoryIcon category={category} size={16} strokeWidth={1.8} />
      </span>
      <span className="leading-tight">
        <span className="block truncate text-[11px] font-semibold">{name}</span>
        <span className={`block text-[11px] ${active ? "text-mute" : "text-white/55"}`}>{state}</span>
      </span>
    </div>
  );
}

/** Hero visual: a phone running the home app, flanked by two live widgets. */
export function HomeShowcase({ labels, app, scenes }: { labels: Record<string, string>; app: AppLabels; scenes: string[] }) {
  const bars = [38, 52, 44, 70, 62, 48, 80];

  return (
    <div className="relative mx-auto flex w-full max-w-[1100px] items-center text-left justify-center overflow-hidden rounded-[40px] bg-[#f5f5f7] px-4 pt-14 pb-0 md:pt-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 55% at 30% 35%, rgba(255,184,102,0.28), transparent 70%), radial-gradient(45% 55% at 72% 45%, rgba(90,160,255,0.22), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Left widget: thermostat */}
      <div className="animate-float absolute left-[6%] top-[22%] hidden w-[220px] rounded-[28px] bg-white/80 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)] ring-1 ring-black/5 backdrop-blur-xl lg:block" aria-hidden="true">
        <div className="flex items-center justify-between text-[13px] font-semibold text-mute">
          <span>{labels.climate}</span>
          <span>{app.living}</span>
        </div>
        <div className="relative mx-auto mt-4 h-[140px] w-[140px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-[225deg]">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e8e8ed" strokeWidth="10" strokeDasharray="235.6 314.2" strokeLinecap="round" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="url(#sc-heat)" strokeWidth="10" strokeDasharray="160 314.2" strokeLinecap="round" />
            <defs>
              <linearGradient id="sc-heat" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffb547" />
                <stop offset="1" stopColor="#ff6a3d" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-semibold tracking-tight text-ink">22.5°</span>
          </div>
        </div>
      </div>

      {/* Right widget: energy */}
      <div
        className="animate-float absolute right-[6%] top-[40%] hidden w-[230px] rounded-[28px] bg-white/80 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)] ring-1 ring-black/5 backdrop-blur-xl lg:block"
        style={{ animationDelay: "1.5s" }}
        aria-hidden="true"
      >
        <div className="flex items-center justify-between text-[13px] font-semibold text-mute">
          <span>{labels.energy}</span>
          <span>{app.today}</span>
        </div>
        <div className="mt-1 text-[30px] font-semibold tracking-tight text-ink">4.2 kW</div>
        <div className="mt-4 flex h-[70px] items-end gap-2">
          {bars.map((h, i) => (
            <span key={i} className={`flex-1 rounded-full ${i === bars.length - 1 ? "bg-[#34c759]" : "bg-[#d2d2d7]"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Phone */}
      <div className="relative z-10 w-[290px] translate-y-6 rounded-[54px] bg-[#1d1d1f] p-[11px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.45),inset_0_0_0_1.5px_#3a3a3c] sm:w-[320px]" aria-hidden="true">
        <div className="relative overflow-hidden rounded-[44px] bg-[linear-gradient(170deg,#3b3026_0%,#1c1d22_45%,#0d0e12_100%)] px-4 pt-3 pb-12 text-white">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#ff9f43]/30 blur-3xl" />
          <div className="relative flex items-center justify-between px-3 text-[13px] font-semibold">
            <span>9:41</span>
            <span className="h-[26px] w-[86px] rounded-full bg-black" />
            <span className="flex gap-1">
              <span className="h-2.5 w-4 rounded-[3px] border border-white/80" />
            </span>
          </div>

          <div className="relative mt-6 px-1">
            <div className="text-[28px] font-bold tracking-tight">{app.title}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34c759]" />
              {app.status}
            </div>
          </div>

          <div className="relative mt-4 flex gap-2 px-1">
            {scenes.slice(0, 2).map((s, i) => (
              <span key={s} className={`flex-1 truncate rounded-[14px] px-3 py-2.5 text-[12px] font-semibold ${i === 0 ? "bg-white text-ink" : "bg-white/12 ring-1 ring-white/10"}`}>
                {s}
              </span>
            ))}
          </div>

          <div className="relative mt-5 px-1 text-[13px] font-semibold text-white/70">{app.living}</div>
          <div className="relative mt-2 grid grid-cols-2 gap-2 px-1">
            <Accessory category="lighting" name={labels.lighting} state="80%" active tint="bg-[#ffcc00] text-white" />
            <Accessory category="climate" name={labels.climate} state="22.5°" active tint="bg-[#ff9500] text-white" />
            <Accessory category="entertainment" name="Sonos" state={app.nowPlaying} active tint="bg-[#af52de] text-white" />
            <Accessory category="lighting" name={app.kitchen} state={app.off} tint="" />
          </div>

          <div className="relative mt-5 px-1 text-[13px] font-semibold text-white/70">{labels.security}</div>
          <div className="relative mt-2 grid grid-cols-2 gap-2 px-1">
            <Accessory category="security" name={app.frontDoor} state={app.locked} active tint="bg-[#0071e3] text-white" />
            <Accessory category="energy" name={labels.energy} state="4.2 kW" tint="" />
          </div>
        </div>
      </div>
    </div>
  );
}
