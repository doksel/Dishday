/**
 * Minimal SVG icon set — inline so we don't pull a whole icon library.
 *
 *   All icons accept the standard SVG props (className, onClick…) and use
 *   `currentColor` for stroke, so colour them via Tailwind's text-*
 *   utilities on the parent.
 */

import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const IconHome = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
  </svg>
);

export const IconRecipes = (p: Props) => (
  // Ionicons `restaurant-outline` — same glyph the mobile Recipes tab uses.
  // Path data copied from Ionicons 5 source so the web/mobile brand reads
  // as a single icon family. Stroke width 32 on a 512 viewBox renders to
  // ~1.5px at 24px tall, in line with the rest of the set.
  <svg
    width={24}
    height={24}
    viewBox="0 0 512 512"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={32}
    {...p}
  >
    <path d="M57.49 47.27a16.36 16.36 0 00-23.14 0L15.49 66.12a16.36 16.36 0 000 23.14L223.74 297.51l-22.66 22.66L73.17 192.26a16 16 0 00-22.61 0L19.32 223.5a48 48 0 000 67.88l101.3 101.3a48 48 0 0067.88 0l31.24-31.24a16 16 0 000-22.62L92.13 211.08l22.62-22.62L322.74 396.45a16.36 16.36 0 0023.14 0l18.86-18.86a16.36 16.36 0 000-23.14z" />
    <path d="M403.07 64a64.74 64.74 0 00-46 19.1l-9.83 9.85a16 16 0 000 22.6l63.42 63.42a16 16 0 0022.6 0l9.85-9.83C497.78 95.65 469 64 432.3 64z" />
    <path
      fill="currentColor"
      stroke="none"
      d="M310.94 174.74l4.41-4.41a16.59 16.59 0 0123.46 0L341 173a16.59 16.59 0 010 23.46l-4.41 4.41a16.59 16.59 0 01-23.46 0L310.94 198.2a16.59 16.59 0 010-23.46zM382 246.07l4.41-4.41a16.59 16.59 0 0123.46 0L412 244a16.6 16.6 0 010 23.46l-4.41 4.41a16.59 16.59 0 01-23.46 0L382 269.53a16.59 16.59 0 010-23.46zM340.6 281.27a16.55 16.55 0 0123.43 0l52.85 52.84a48 48 0 010 67.88l-9.95 9.94a16 16 0 01-22.65 0L286.21 327.86a16 16 0 010-22.66z"
    />
  </svg>
);

export const IconAiPlan = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
    <path d="M18 17l.9 2.1L21 20l-2.1.9L18 23l-.9-2.1L15 20l2.1-.9Z" />
  </svg>
);

export const IconShopping = (p: Props) => (
  // Material Symbols `shopping_basket`: trapezoidal basket body, triangular
  // arched handle from rim to rim, two short vertical "ribs" for the weave.
  <svg {...base} {...p}>
    {/* Basket body */}
    <path d="M3 9h18l-2 11a2 2 0 0 1-2 1H7a2 2 0 0 1-2-1L3 9Z" />
    {/* Arched handle */}
    <path d="M7 9l5-6 5 6" />
    {/* Basket weave ribs */}
    <path d="M10 13v4M14 13v4" />
  </svg>
);

export const IconProfile = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const IconMenu = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const IconClose = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M6 18 18 6" />
  </svg>
);

export const IconBell = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const IconCheck = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const IconBulb = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3Z" />
  </svg>
);

export const IconPlus = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconSearch = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconHeart = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 21s-7-4.5-9.3-9.3C1.3 8.9 3 6 6 6c2 0 3.5 1 4 2.5C10.5 7 12 6 14 6c3 0 4.7 2.9 3.3 5.7C19 16.5 12 21 12 21Z" />
  </svg>
);

export const IconHeartFilled = (p: Props) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M12 21s-7-4.5-9.3-9.3C1.3 8.9 3 6 6 6c2 0 3.5 1 4 2.5C10.5 7 12 6 14 6c3 0 4.7 2.9 3.3 5.7C19 16.5 12 21 12 21Z" />
  </svg>
);

export const IconStar = (p: Props) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9Z" />
  </svg>
);

export const IconClock = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconFlame = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-5 0 0 3 1 3 5a6 6 0 1 1-12 0c0-5 6-5 6-9Z" />
  </svg>
);

export const IconChart = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
);

export const IconCalendarPlus = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
    <path d="M12 13v6M9 16h6" />
  </svg>
);

export const IconPrinter = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M7 9V3h10v6" />
    <rect x="3" y="9" width="18" height="9" rx="2" />
    <rect x="7" y="14" width="10" height="7" />
  </svg>
);

export const IconShare = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

export const IconCheckCircle = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

export const IconBars = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="14" width="4" height="7" rx="1" />
    <rect x="10" y="9" width="4" height="12" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" opacity="0.4" />
  </svg>
);

export const IconLeaf = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 13-9 0 6-2 13-6 14a4 4 0 0 1-4-4" />
    <path d="M4 20c2-6 6-9 11-11" />
  </svg>
);

export const IconFridge = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M5 11h14" />
    <path d="M8 6.5v2M8 14v3" />
  </svg>
);

export const IconBox = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 7h18l-1 13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M3 7l2-4h14l2 4" />
    <path d="M9 11h6" />
  </svg>
);

export const IconBread = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 13a4 4 0 0 1 1.3-3A6 6 0 0 1 12 7a6 6 0 0 1 6.7 3 4 4 0 0 1 1.3 3c0 2-1.5 3-3 3v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3c-1.5 0-3-1-3-3Z" />
    <path d="M8 13h.01M12 13h.01M16 13h.01" />
  </svg>
);

export const IconPiggy = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 13a7 7 0 0 1 7-7h3l3-2v4a6 6 0 0 1 3 5v3l-2 1-1 2h-3v-2h-4v2H7v-2l-2-2a6 6 0 0 1-1-2Z" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
  </svg>
);

export const IconCart = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 4h2l2.6 12.4a1 1 0 0 0 1 .8H19a1 1 0 0 0 1-.8L21.5 9H6" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
  </svg>
);

export const IconDrag = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="6" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="18" r="1" fill="currentColor" />
    <circle cx="15" cy="6" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="18" r="1" fill="currentColor" />
  </svg>
);
