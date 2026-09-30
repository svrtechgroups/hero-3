'use client';

import { useRef, type MouseEvent } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { heroChips } from '@/lib/content';
import { CubeAnchor } from '@/components/ui/CubeAnchor';
import { DepthLayers } from '@/components/ui/DepthLayers';
import { scrollToHash } from '@/components/providers/MotionProvider';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  // The page's one orchestrated entrance: the drafting frame draws,
  // then the headline rises out of depth line by line.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('[data-hero="frame"]', { scale: 0.6, autoAlpha: 0, rotateX: 40, transformPerspective: 800, duration: 1.4 })
          .from('[data-hero="line"]', { yPercent: 110, z: -200, rotateX: -35, autoAlpha: 0, transformPerspective: 900, stagger: 0.12, duration: 1.3 }, '-=1.0')
          .from('[data-hero="fade"]', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1 }, '-=0.9')
          .from('[data-hero="chip"]', { y: 16, z: -120, autoAlpha: 0, stagger: 0.06, duration: 0.9, transformPerspective: 700 }, '-=0.8');
      });
    },
    { scope: root },
  );

  const go = (e: MouseEvent<HTMLAnchorElement>, h: string) => {
    e.preventDefault();
    scrollToHash(h);
  };

  return (
    <section id="top" ref={root} className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-28" aria-labelledby="hero-title">
      <DepthLayers variant="blueprint" />

      <div data-depth-section="exit" className="container relative z-10 flex flex-col items-center text-center">
        <div data-hero="frame">
          <CubeAnchor stage={0} className="w-36 sm:w-44 md:w-52" label="Your idea, first sketch" />
        </div>

        <h1 id="hero-title" className="mt-14 max-w-[17ch] text-[clamp(2.4rem,6.2vw,5rem)] font-bold leading-[1.02] md:max-w-[20ch]">
          <span className="block overflow-hidden pb-1">
            <span data-hero="line" className="block">Custom software, built faster with AI</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span data-hero="line" className="block font-light text-primary">without cutting corners.</span>
          </span>
        </h1>

        <p data-hero="fade" className="mt-6 max-w-[56ch] text-[clamp(1.02rem,1.6vw,1.2rem)] leading-relaxed text-muted">
          SVR Tech Groups builds websites, mobile apps, AI agents, and AI workflow automations that solve real problems.
        </p>

        <div data-hero="fade" className="mt-9 flex flex-col gap-4 sm:flex-row">
          <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn btn-primary">
            Start a Project
          </a>
          <a href="#process" onClick={(e) => go(e, '#process')} className="btn btn-ghost">
            See How We Build
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-2.5" aria-label="What we build">
          {heroChips.map((c) => (
            <li
              key={c}
              data-hero="chip"
              className="rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm font-medium text-navy shadow-[0_3px_0_rgb(var(--glow)/0.7),0_12px_24px_-14px_rgb(var(--primary)/0.4)] backdrop-blur"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
