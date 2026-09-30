'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { testimonials } from '@/lib/content';
import { CubeAnchor } from '@/components/ui/CubeAnchor';
import { DepthLayers } from '@/components/ui/DepthLayers';
import { Star } from '@/components/ui/Icons';

// depth per card: negative = further away (smaller, slower), positive = nearer
const DEPTHS = [-160, 60, -60, 120, -120];

function Quote({ t, i }: { t: (typeof testimonials)[number]; i: number }) {
  return (
    <figure
      className={`relative flex h-full flex-col rounded-[32px] border border-white bg-white/85 p-7 shadow-depth-lg backdrop-blur-md md:p-9 ${
        i % 2 ? 'md:w-[400px]' : 'md:w-[460px]'
      }`}
    >
      <div className="flex gap-1 text-accent" role="img" aria-label={`Rated ${t.rating} out of 5`}>
        {Array.from({ length: 5 }, (_, k) => (
          <Star key={k} filled={k < t.rating} className="h-5 w-5" />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 font-display text-[1.15rem] leading-relaxed text-navy md:text-[1.25rem]">
        <p>“{t.quote}”</p>
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-3.5">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-gradient font-display text-sm font-bold text-white" aria-hidden="true">
          {t.name.split(' ').map((w) => w[0]).join('')}
        </span>
        <span>
          <span className="block font-semibold text-navy">{t.name}</span>
          <span className="block text-sm text-muted">
            {t.role}, {t.company}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth + 80);
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin.current,
            start: 'top top',
            end: () => `+=${distance() + window.innerHeight * 0.4}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        tl.to(track.current, { x: () => -distance(), duration: 1 }, 0);
        // planets: nearer cards drift faster than far ones
        gsap.utils.toArray<HTMLElement>('[data-planet]').forEach((el, i) => {
          gsap.set(el, { z: DEPTHS[i] });
          tl.to(el, { x: () => -DEPTHS[i] * 1.2, rotateY: DEPTHS[i] > 0 ? -8 : 8, duration: 1 }, 0);
        });
        // the cube cruises past the quotes
        tl.fromTo('[data-testimonial-anchor]', { left: '14%' }, { left: '86%', duration: 1 }, 0);
      });
    },
    { scope: root },
  );

  return (
    <section id="testimonials" ref={root} className="relative" aria-labelledby="testimonials-title">
      <div ref={pin} className="relative overflow-hidden py-24 md:flex md:h-screen md:flex-col md:justify-center md:py-0">
        <DepthLayers variant="orbit" />

        <div className="container relative z-10">
          <h2 id="testimonials-title" data-reveal className="text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-tight">
            What clients say after launch
          </h2>
        </div>

        {/* the cube's lane */}
        <div className="relative z-10 mt-6 h-20 md:h-24">
          <div data-testimonial-anchor className="absolute left-1/2 top-0 -translate-x-1/2">
            <CubeAnchor stage={8} frame={false} className="w-16 md:w-20" />
          </div>
        </div>

        <div
          className="relative z-10 overflow-x-auto pb-6 [scrollbar-width:none] md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          aria-label="Client testimonials, scroll horizontally"
        >
          <div
            ref={track}
            className="flex w-max snap-x snap-mandatory gap-5 px-5 md:snap-none md:gap-14 md:pl-[max(2rem,calc((100vw-1240px)/2+2rem))] md:pr-[20vw] md:[perspective:1400px]"
          >
            {testimonials.map((t, i) => (
              <div key={t.name} data-planet className="w-[82vw] shrink-0 snap-center sm:w-[420px] md:w-auto" style={{ marginTop: `${(i % 3) * 28}px` }}>
                <div className="h-full md:animate-bob" style={{ animationDelay: `${i * -1.3}s` }}>
                  <Quote t={t} i={i} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
