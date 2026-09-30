'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { stats } from '@/lib/content';
import { CubeAnchor } from '@/components/ui/CubeAnchor';
import { DepthLayers } from '@/components/ui/DepthLayers';

export function Impact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const nums = gsap.utils.toArray<HTMLElement>('[data-count]');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // count up once, when the cube bursts
      nums.forEach((el) => {
        const target = Number(el.dataset.count);
        if (reduced) { el.textContent = String(target); return; }
        el.textContent = '0';
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 2.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => { el.textContent = String(Math.round(o.v)); },
        });
      });

      if (reduced) return;
      // stats fly out of the cube's landing spot, from deep in the scene
      gsap.fromTo(
        '[data-stat]',
        { z: -900, rotateX: 55, yPercent: -60, autoAlpha: 0, transformPerspective: 1000 },
        {
          z: 0, rotateX: 0, yPercent: 0, autoAlpha: 1, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: '[data-stats]', start: 'top 85%', end: 'top 45%', scrub: 0.6 },
        },
      );
    },
    { scope: root },
  );

  return (
    <section id="impact" ref={root} className="relative overflow-hidden bg-gradient-to-b from-transparent via-tint/70 to-transparent py-28 md:py-36" aria-labelledby="impact-title">
      <DepthLayers variant="debris" />
      <div data-depth-section="both" className="container relative z-10">
        <div className="flex flex-col items-center text-center">
          <CubeAnchor stage={6} frame={false} className="w-28 md:w-36" />
          <h2 id="impact-title" data-reveal className="mt-10 max-w-[20ch] text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-tight">
            Launched, measured, and still improving
          </h2>
          <p data-reveal className="mt-4 max-w-[58ch] text-lg text-muted">
            Our work is judged by business outcomes: fewer manual hours, faster response times, more enquiries, and products people keep using.
          </p>
        </div>

        <dl data-stats className="mt-16 grid grid-cols-2 gap-5 [perspective:1400px] lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-stat
              className={`relative flex flex-col rounded-[28px] border border-white bg-white/80 p-6 text-left shadow-depth-lg backdrop-blur md:p-8 ${i % 2 ? 'lg:mt-10' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <dt className="order-2 mt-2 text-sm font-medium text-muted md:text-base">{s.label}</dt>
              <dd className="order-1 font-display text-[clamp(2.6rem,5vw,4.2rem)] font-bold leading-none text-primary" style={{ transform: 'translateZ(40px)' }}>
                <span className="sr-only">{`${s.value}${s.suffix}`}</span>
                <span aria-hidden="true">
                  <span data-count={s.value}>{s.value}</span>
                  <span className="text-accent">{s.suffix}</span>
                </span>
              </dd>
              <span className="absolute right-5 top-5 h-3 w-3 rounded-[3px] bg-brand-gradient" aria-hidden="true" />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
