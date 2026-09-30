'use client';

import { useRef, type MouseEvent } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { nav, site } from '@/lib/content';
import { Logo } from '@/components/ui/Logo';
import { InstagramIcon, LinkedInIcon } from '@/components/ui/Icons';
import { scrollToHash } from '@/components/providers/MotionProvider';

export function Footer() {
  const root = useRef<HTMLElement>(null);

  // footer layers rise into place at different speeds
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
          const d = parseFloat(el.dataset.rise ?? '1');
          gsap.fromTo(el, { y: 140 * d, z: -120 * d, transformPerspective: 1200 }, {
            y: 0, z: 0, ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
          });
        });
      });
    },
    { scope: root },
  );

  const go = (e: MouseEvent<HTMLAnchorElement>, h: string) => {
    e.preventDefault();
    scrollToHash(h);
  };

  return (
    <footer ref={root} className="relative overflow-hidden bg-navy pt-24 text-white/80">
      {/* depth layers: far glow (slowest), mid blueprint grid, near content */}
      <div data-rise="1.6" className="pointer-events-none absolute -inset-x-20 -top-10 bottom-0 bg-[radial-gradient(60%_80%_at_20%_0%,rgb(var(--primary)/0.55),transparent_70%)]" aria-hidden="true" />
      <div
        data-rise="1.1"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(147_197_253/0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(147_197_253/0.08)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden="true"
      />

      <div data-rise="0.5" className="container relative z-10">
        <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a href="#top" onClick={(e) => go(e, '#top')} className="relative inline-block rounded-xl" aria-label="SVR Tech Groups, back to top">
              <Logo onDark markHandoff />
              {/* the traveling cube shrinks into the logo mark here */}
              <span data-cube-anchor data-stage="10" className="absolute left-0 top-0 h-10 w-10" aria-hidden="true" />
            </a>
            <p className="mt-6 max-w-[34ch] font-display text-xl text-white">{site.tagline}</p>
            <p className="mt-3 text-sm text-white/60">{site.location}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-display text-sm font-semibold text-white">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={(e) => go(e, l.href)} className="text-white/70 transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-semibold text-white">Get in touch</h2>
            <ul className="mt-4 space-y-2.5">
              <li><a href={`mailto:${site.email}`} className="text-white/70 hover:text-white">{site.email}</a></li>
              <li><a href={site.phoneHref} className="text-white/70 hover:text-white">{site.phone}</a></li>
            </ul>
            <div className="mt-6 flex gap-3">
              {[
                { href: site.social.linkedin, label: 'SVR Tech Groups on LinkedIn', Icon: LinkedInIcon },
                { href: site.social.instagram, label: 'SVR Tech Groups on Instagram', Icon: InstagramIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/5 text-white shadow-[0_4px_0_rgb(0_0_0/0.25)] transition hover:-translate-y-0.5 hover:border-glow/60 hover:bg-white/10"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <p className="py-8 text-sm text-white/55">© 2026 SVR Tech Groups. All rights reserved.</p>
      </div>
    </footer>
  );
}
