import { CategoryIcon } from "./icons";

type Chip = { category: string; label: string; value: string; className: string; delay: string };

/** Illustrated house with glowing rooms and live device status cards. */
export function HomeShowcase({ labels }: { labels: Record<string, string> }) {
  const chips: Chip[] = [
    { category: "lighting", label: labels.lighting, value: "80%", className: "left-[4%] top-[14%]", delay: "0s" },
    { category: "climate", label: labels.climate, value: "22.5°", className: "right-[4%] top-[8%]", delay: "1.2s" },
    { category: "security", label: labels.security, value: "✓", className: "left-[8%] bottom-[12%]", delay: "2.1s" },
    { category: "energy", label: labels.energy, value: "4.2 kW", className: "right-[6%] bottom-[18%]", delay: "0.6s" },
  ];

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-[1100px] overflow-hidden rounded-[36px] bg-[radial-gradient(120%_90%_at_50%_0%,#1b2440_0%,#0a0b10_55%,#000_100%)] shadow-[0_40px_120px_-30px_rgba(0,40,120,0.5)]">
      {/* stars */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 20%, #fff, transparent), radial-gradient(1px 1px at 70% 15%, #fff, transparent), radial-gradient(1px 1px at 85% 40%, #fff, transparent), radial-gradient(1px 1px at 35% 8%, #fff, transparent), radial-gradient(1px 1px at 55% 30%, #fff, transparent)",
        }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 800 500" className="absolute inset-x-0 bottom-0 mx-auto h-[88%] w-auto" aria-hidden="true">
        <defs>
          <linearGradient id="hs-warm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd28a" />
            <stop offset="1" stopColor="#ff9f43" />
          </linearGradient>
          <linearGradient id="hs-cool" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cc8ff" />
            <stop offset="1" stopColor="#2f7cf6" />
          </linearGradient>
          <linearGradient id="hs-violet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e3a6ff" />
            <stop offset="1" stopColor="#9b5cf6" />
          </linearGradient>
          <linearGradient id="hs-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2d36" />
            <stop offset="1" stopColor="#15161b" />
          </linearGradient>
          <filter id="hs-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        {/* ground */}
        <ellipse cx="400" cy="492" rx="380" ry="16" fill="#000" opacity="0.6" />
        {/* glow behind windows */}
        <g filter="url(#hs-glow)" opacity="0.75">
          <rect x="230" y="300" width="120" height="90" fill="#ffb347" />
          <rect x="450" y="300" width="120" height="90" fill="#3b8cff" />
          <rect x="330" y="180" width="140" height="70" fill="#b26bff" />
        </g>
        {/* house */}
        <path d="M150 260 400 90l250 170v230H150Z" fill="url(#hs-wall)" stroke="#3a3d48" strokeWidth="2" />
        <path d="M120 270 400 75l280 195" fill="none" stroke="#50545f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        {/* solar panels */}
        <g transform="translate(470 120) rotate(34)">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={i * 34} y="0" width="30" height="46" rx="3" fill="#1e3a8a" stroke="#4f7cff" strokeWidth="1.5" />
          ))}
        </g>
        {/* windows */}
        <rect x="230" y="300" width="120" height="90" rx="8" fill="url(#hs-warm)" />
        <rect x="450" y="300" width="120" height="90" rx="8" fill="url(#hs-cool)" />
        <rect x="330" y="180" width="140" height="70" rx="8" fill="url(#hs-violet)" />
        <path d="M290 300v90M230 345h120M510 300v90M450 345h120M400 180v70" stroke="#15161b" strokeWidth="4" />
        {/* door */}
        <rect x="375" y="400" width="50" height="90" rx="6" fill="#0e0f13" stroke="#3a3d48" strokeWidth="2" />
        <circle cx="414" cy="447" r="3.5" fill="#34d399" />
        {/* outdoor lights */}
        <circle cx="355" cy="420" r="5" fill="#ffd28a" />
        <circle cx="445" cy="420" r="5" fill="#ffd28a" />
      </svg>

      {chips.map((chip) => (
        <div
          key={chip.category}
          className={`absolute ${chip.className} animate-float flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5 text-white ring-1 ring-white/15 backdrop-blur-xl sm:px-4 sm:py-3`}
          style={{ animationDelay: chip.delay }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 sm:h-9 sm:w-9">
            <CategoryIcon category={chip.category} size={18} />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[11px] text-white/60">{chip.label}</span>
            <span className="block text-[15px] font-semibold">{chip.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
