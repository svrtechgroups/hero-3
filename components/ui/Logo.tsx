import { site } from '@/lib/content';

/**
 * LOGO PLACEHOLDER — swap for the real file when it arrives, e.g.
 *   import Image from 'next/image';
 *   <Image src="/svr-logo.svg" alt="SVR Tech Groups" width={40} height={40} priority />
 * Keep the outer size (h-10 w-10 mark) so the footer cube still lands on it.
 */
export function Logo({ onDark = false, markHandoff = false }: { onDark?: boolean; markHandoff?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-[0.8rem] font-bold text-white shadow-depth"
        style={markHandoff ? { opacity: 'calc(1 - var(--footer-cube))' } : undefined}
        aria-hidden="true"
      >
        SVR
      </span>
      <span className={`font-display text-[1.05rem] font-semibold tracking-tight ${onDark ? 'text-white' : 'text-navy'}`}>
        {site.name}
      </span>
    </span>
  );
}
