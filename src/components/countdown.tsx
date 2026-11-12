"use client";

import { useEffect, useState } from "react";
import { blackFriday, promoPhase, type PromoPhase } from "@/lib/black-friday";

export type CountdownLabels = {
  before: string;
  live: string;
  ended: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

/** Counts down to the start of Black Friday, then to its end. Renders "--" until it runs in the browser,
 *  so the static HTML never shows a stale time. */
export function Countdown({ labels, compact = false, dark = false }: { labels: CountdownLabels; compact?: boolean; dark?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const phase: PromoPhase = now === null ? "before" : promoPhase(now);
  const target = Date.parse(phase === "before" ? blackFriday.start : blackFriday.end);
  const values = now === null ? null : parts(target - now);
  const units = [labels.days, labels.hours, labels.minutes, labels.seconds];
  const mute = dark ? "text-white/60" : "text-mute";

  if (phase === "ended") return <p className={`text-[17px] ${mute}`}>{labels.ended}</p>;

  if (compact) {
    return (
      <span className="tabular-nums" aria-label={labels[phase]}>
        {values ? `${values[0]} ${labels.days} ${String(values[1]).padStart(2, "0")}:${String(values[2]).padStart(2, "0")}:${String(values[3]).padStart(2, "0")}` : "--"}
      </span>
    );
  }

  return (
    <div>
      <p className={`text-[17px] font-semibold ${mute}`}>{labels[phase]}</p>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-live="off">
        {units.map((unit, i) => (
          <div key={unit} className={`rounded-[18px] px-2 py-4 text-center sm:px-4 sm:py-5 ${dark ? "bg-night-2" : "bg-cloud"}`}>
            <span className="block text-[34px] font-bold leading-none tracking-tight tabular-nums sm:text-[56px]">
              {values ? String(values[i]).padStart(2, "0") : "--"}
            </span>
            <span className={`mt-2 block text-[13px] sm:text-[15px] ${mute}`}>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
