import type { SVGProps } from 'react';

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const ServiceIcons = [
  (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="4" width="18" height="15" rx="2.5" /><path d="M3 8.5h18M6.5 6.3h.01M9 6.3h.01" /></svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" /><path d="M12 7v10M7.5 9.5l9 5M16.5 9.5l-9 5" /></svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v3.7h-3.7M6 21v-3.7h3.7" /></svg>
  ),
];

export const Star = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled: boolean }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" {...p}>
    <path
      d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

export const LinkedInIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v6.45h-4v-5.7c0-1.36-.02-3.1-1.9-3.1-1.9 0-2.18 1.48-2.18 3v5.8h-4z" />
  </svg>
);

export const InstagramIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
