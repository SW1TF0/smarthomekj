import Image from "next/image";
import { CategoryIcon } from "./icons";

export const categoryTheme: Record<string, { bg: string; glow: string; device: string; icon: string }> = {
  lighting: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(255,170,60,0.55)", device: "from-white to-amber-50", icon: "text-amber-500" },
  climate: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(56,189,248,0.5)", device: "from-white to-sky-50", icon: "text-sky-500" },
  security: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(100,116,139,0.45)", device: "from-zinc-800 to-black", icon: "text-white" },
  energy: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(52,211,153,0.5)", device: "from-white to-emerald-50", icon: "text-emerald-500" },
  entertainment: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(192,132,252,0.5)", device: "from-zinc-700 to-zinc-900", icon: "text-fuchsia-300" },
  cleaning: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(45,212,191,0.5)", device: "from-white to-teal-50", icon: "text-teal-500" },
  hubs: { bg: "from-[#f5f5f7] to-[#ececf0]", glow: "rgba(99,102,241,0.45)", device: "from-white to-indigo-50", icon: "text-indigo-500" },
};

/** Product image, or a rendered device illustration when no photo is uploaded. */
export function ProductVisual({
  category,
  imageUrl,
  alt,
  size = "md",
  className = "",
}: {
  category: string;
  imageUrl?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const theme = categoryTheme[category] ?? categoryTheme.hubs;
  const device = { sm: "w-16 h-16", md: "w-32 h-32", lg: "w-52 h-52 md:w-64 md:h-64" }[size];
  const icon = { sm: 22, md: 44, lg: 84 }[size];
  const round = category === "climate" || category === "cleaning" || category === "hubs" || category === "lighting" ? "rounded-full" : "rounded-[30%]";

  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br ${theme.bg} overflow-hidden ${className}`}>
      {imageUrl ? (
        <Image src={imageUrl} alt={alt} fill className="object-contain p-8" sizes="(max-width: 768px) 100vw, 50vw" />
      ) : (
        <>
          <div
            className="absolute w-2/3 aspect-square rounded-full blur-3xl opacity-40"
            style={{ background: `radial-gradient(circle, ${theme.glow}, transparent 70%)` }}
            aria-hidden="true"
          />
          <div
            role="img"
            aria-label={alt}
            className={`relative ${device} ${round} bg-gradient-to-br ${theme.device} flex items-center justify-center shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-black/5`}
          >
            <div className={`absolute inset-[8%] ${round} bg-gradient-to-b from-white/40 to-transparent`} aria-hidden="true" />
            <CategoryIcon category={category} size={icon} className={`relative ${theme.icon}`} strokeWidth={1.3} />
          </div>
        </>
      )}
    </div>
  );
}
