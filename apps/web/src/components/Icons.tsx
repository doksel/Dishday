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
  <svg {...base} {...p}>
    <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z" />
    <path d="M4 8h16" />
    <path d="M8 12h8M8 16h5" />
  </svg>
);

export const IconAiPlan = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
    <path d="M18 17l.9 2.1L21 20l-2.1.9L18 23l-.9-2.1L15 20l2.1-.9Z" />
  </svg>
);

export const IconShopping = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 7h12l-1.2 11a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8Z" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
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
