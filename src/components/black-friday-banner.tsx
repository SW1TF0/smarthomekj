"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { promoPhase } from "@/lib/black-friday";
import { Countdown, type CountdownLabels } from "@/components/countdown";

/** A black strip at the top of the home page with the countdown; gone once Black Friday is over. */
export function BlackFridayBanner({ href, title, link, labels }: { href: string; title: string; link: string; labels: CountdownLabels }) {
  const [ended, setEnded] = useState(false);
  useEffect(() => setEnded(promoPhase() === "ended"), []);
  if (ended) return null;
  return (
    <Link href={href} className="block bg-night text-white">
      <span className="container-wide flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-3 text-center text-[15px] sm:text-[17px]">
        <span className="font-semibold">{title}</span>
        <span className="text-white/60">
          <Countdown labels={labels} compact />
        </span>
        <span className="text-[#2997ff]">{link} ›</span>
      </span>
    </Link>
  );
}
