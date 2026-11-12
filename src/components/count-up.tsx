"use client";

import { useEffect, useRef, useState } from "react";

/** A stat such as "14 дни" or "2 г.": the number counts up from 0 when it scrolls into view.
 *  Values without a leading number, or with a "/" ("24/7"), stay as they are. The static HTML
 *  always holds the final value (search engines, no JavaScript, reduced motion). */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const m = value.match(/^(\d+)(\D*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!m || !el || Number(m[1]) === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(m[1]);
    const rest = m[2];
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(`${Math.round(target * eased)}${rest}`);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        setShown(`0${rest}`);
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
