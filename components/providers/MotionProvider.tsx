'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { collectAnchors, footerCubeAmount, journey, splitAmount, trackCube } from '@/lib/journey';

/**
 * Owns everything global about motion:
 *  - Lenis smooth scrolling, driven by the GSAP ticker (one RAF for the page)
 *  - the cube anchor tracker (runs every tick)
 *  - pointer → CSS vars (--mx/--my) for DOM mouse-parallax
 *  - data-depth parallax, data-reveal depth reveals, data-depth-section 3D transitions
 * Reduced motion: no Lenis, no scrubbed depth, content simply visible.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMq = window.matchMedia('(max-width: 767px)');
    journey.reduced = reduced;
    journey.mobile = mobileMq.matches;

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
      lenis.on('scroll', ScrollTrigger.update);
      journey.lenis = lenis;
    }

    let lastSplit = -1;
    let lastFooter = -1;
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
      journey.scrollY = lenis ? lenis.scroll : window.scrollY;
      journey.velocity = lenis ? lenis.velocity : 0;
      trackCube();
      // DOM pieces that hand over to the 3D cube (service icons, footer logo mark)
      const split = Math.round(splitAmount(journey.stage) * 100) / 100;
      const footer = Math.round(footerCubeAmount(journey.stage) * 100) / 100;
      if (split !== lastSplit) { root.style.setProperty('--svc-split', String(split)); lastSplit = split; }
      if (footer !== lastFooter) { root.style.setProperty('--footer-cube', String(footer)); lastFooter = footer; }
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // reduced-motion canvases render on demand: poke them on native scroll
    const onNativeScroll = () => { if (reduced) { journey.scrollY = window.scrollY; trackCube(); } };
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    // pointer parallax (fine pointers only)
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let raf = 0;
    const onPointer = (e: PointerEvent) => {
      journey.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      journey.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          root.style.setProperty('--mx', journey.mouse.x.toFixed(3));
          root.style.setProperty('--my', journey.mouse.y.toFixed(3));
          raf = 0;
        });
      }
    };
    if (finePointer && !reduced) window.addEventListener('pointermove', onPointer, { passive: true });

    const onMq = () => { journey.mobile = mobileMq.matches; };
    mobileMq.addEventListener('change', onMq);

    const ctx = gsap.context(() => {
      if (reduced) return;

      // multi-layer parallax: each [data-depth] layer drifts at its own speed through its section
      gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((el) => {
        const d = parseFloat(el.dataset.depth ?? '0.3');
        const trigger = el.closest('section, footer') ?? el;
        gsap.fromTo(
          el,
          { yPercent: d * 22 },
          { yPercent: -d * 22, ease: 'none', scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      });

      // headings, copy and cards arrive from depth, staggered
      gsap.set('[data-reveal]', { autoAlpha: 0 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { autoAlpha: 0, y: 46, z: -240, rotateX: 12, scale: 0.94, transformPerspective: 900 },
            { autoAlpha: 1, y: 0, z: 0, rotateX: 0, scale: 1, duration: 1.15, ease: 'expo.out', stagger: 0.08, overwrite: true, clearProps: 'transform' },
          ),
      });

      // section-to-section transitions: content tilts in from depth and tilts away
      gsap.utils.toArray<HTMLElement>('[data-depth-section]').forEach((el) => {
        const mode = el.dataset.depthSection;
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
        if (mode !== 'exit') {
          tl.fromTo(el, { rotateX: 8, z: -180, transformPerspective: 1400, transformOrigin: '50% 0%' }, { rotateX: 0, z: 0, ease: 'none', duration: 0.3 });
        } else {
          tl.to(el, { duration: 0.3 });
        }
        tl.to(el, { duration: 0.4 });
        if (mode !== 'enter') {
          tl.to(el, { rotateX: -6, z: -140, transformPerspective: 1400, transformOrigin: '50% 100%', ease: 'none', duration: 0.3 });
        } else {
          tl.to(el, { duration: 0.3 });
        }
      });
    });

    const refresh = () => collectAnchors();
    ScrollTrigger.addEventListener('refresh', refresh);
    collectAnchors();
    ScrollTrigger.refresh();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      ScrollTrigger.removeEventListener('refresh', refresh);
      window.removeEventListener('scroll', onNativeScroll);
      window.removeEventListener('pointermove', onPointer);
      mobileMq.removeEventListener('change', onMq);
      lenis?.destroy();
      journey.lenis = null;
    };
  }, []);

  return <>{children}</>;
}

/** Smooth-scroll to an in-page anchor (works with or without Lenis). */
export function scrollToHash(hash: string) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  if (journey.lenis) journey.lenis.scrollTo(el, { offset: -8, duration: 1.4 });
  else el.scrollIntoView({ behavior: journey.reduced ? 'auto' : 'smooth' });
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
