import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const LogoMark = ({ size = 22, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0090f7" />
        <stop offset="0.5" stopColor="#ba62fc" />
        <stop offset="1" stopColor="#f2416b" />
      </linearGradient>
    </defs>
    <path d="M16 3 3 13.5V29h9.5v-8h7v8H29V13.5L16 3Z" fill="url(#lg-logo)" />
    <circle cx="16" cy="14.5" r="2.6" fill="#fff" />
  </svg>
);

export const BagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);
export const ChatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5h16v11H9l-5 4V5Z" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9h16M4 15h16" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const GlobeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </Svg>
);
export const SendIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);
export const PersonIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Svg>
);

export const categoryIcons: Record<string, (p: IconProps) => React.ReactElement> = {
  lighting: (p) => (
    <Svg {...p}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" />
    </Svg>
  ),
  climate: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9.5v2.5l1.5 1.5" />
    </Svg>
  ),
  security: (p) => (
    <Svg {...p}>
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  energy: (p) => (
    <Svg {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </Svg>
  ),
  entertainment: (p) => (
    <Svg {...p}>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <circle cx="12" cy="14.5" r="3.5" />
      <circle cx="12" cy="6.5" r="1" />
    </Svg>
  ),
  hubs: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M8.8 8.8a4.5 4.5 0 0 0 0 6.4M15.2 8.8a4.5 4.5 0 0 1 0 6.4" />
    </Svg>
  ),
};

export function CategoryIcon({ category, ...p }: IconProps & { category: string }) {
  const Icon = categoryIcons[category] ?? categoryIcons.hubs;
  return <Icon {...p} />;
}
