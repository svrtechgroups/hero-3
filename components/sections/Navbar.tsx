'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { nav } from '@/lib/content';
import { Logo } from '@/components/ui/Logo';
import { scrollToHash } from '@/components/providers/MotionProvider';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToHash(href);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,backdrop-filter] duration-500 ${
        scrolled || open ? 'border-b border-white/60 bg-white/70 shadow-[0_10px_40px_-20px_rgb(11_31_75/0.25)] backdrop-blur-xl backdrop-saturate-150' : 'bg-transparent'
      }`}
    >
      <nav className="container flex h-[72px] items-center justify-between" aria-label="Main">
        <a href="#top" onClick={(e) => go(e, '#top')} className="rounded-xl" aria-label="SVR Tech Groups home">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {nav.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => go(e, l.href)}
                className="rounded-lg px-3.5 py-2 text-[0.93rem] font-medium text-ink/80 transition-colors hover:bg-tint hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
            Start a Project
          </a>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/80 text-navy lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
            </svg>
          </button>
        </div>
      </nav>

      <div id="mobile-menu" hidden={!open} className="border-t border-line/70 lg:hidden">
        <ul className="container flex flex-col gap-1 py-4">
          {nav.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => go(e, l.href)} className="block rounded-xl px-3 py-3 font-display font-medium text-navy hover:bg-tint">
                {l.label}
              </a>
            </li>
          ))}
          <li className="pt-2">
            <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn btn-primary w-full">
              Start a Project
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
