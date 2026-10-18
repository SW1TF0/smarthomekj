"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-renders the server page periodically, e.g. to show new chat messages. */
export function AutoRefresh({ ms = 5000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), ms);
    return () => clearInterval(t);
  }, [router, ms]);
  return null;
}
