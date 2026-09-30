'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { journey } from '@/lib/journey';
import { steps } from '@/lib/content';
import { CubeAnchor } from '@/components/ui/CubeAnchor';
import { DepthLayers } from '@/components/ui/DepthLayers';
import { CheckIcon } from '@/components/ui/Icons';

/* Per-step background worlds (DOM half; the WebGL world changes in step too):
   blueprint grid → blueprint → code rain → scan lines → sky */
function StepBackground({ i }: { i: number }) {
  if (i <= 1)
    return (
      <div className="absolute inset-0 bg-[linear-gradient(rgb(var(--primary)/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--primary)/0.06)_1px,transparent_1px)] bg-[size:28px_28px]">
        {i === 0 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,transparent_0,white_70%)]" />}
      </div>
    );
  if (i === 2)
    return (
      <div className="absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-x-0 top-0 h-[200%] animate-rain bg-[repeating-linear-gradient(90deg,transparent_0_46px,rgb(var(--accent)/0.08)_46px_48px)] [mask-image:repeating-linear-gradient(180deg,black_0_18px,transparent_18px_34px)]" />
      </div>
    );
  if (i === 3)
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(var(--accent)/0.06)_0_1px,transparent_1px_12px)]" />
        <div className="absolute inset-x-0 h-32 animate-sweep bg-gradient-to-b from-transparent via-accent/15 to-transparent" />
      </div>
    );
  return <div className="absolute inset-0 bg-gradient-to-t from-white via-tint to-glow/40" />;
}

function SpeedMeter() {
  // arc length of the gauge path below ≈ 126
  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl border border-primary/10 bg-white/80 p-4 shadow-depth backdrop-blur" data-meter>
      <svg viewBox="0 0 100 60" className="h-14 w-24" aria-hidden="true">
        <path d="M10 55a40 40 0 0 1 80 0" fill="none" stroke="rgb(var(--line))" strokeWidth="8" strokeLinecap="round" />
        <path data-meter-arc d="M10 55a40 40 0 0 1 80 0" fill="none" stroke="url(#meterGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="126" />
        <defs>
          <linearGradient id="meterGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#93C5FD" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p className="font-display text-2xl font-bold text-navy">
          <span data-meter-value>1.0</span>×
        </p>
        <p className="text-sm text-muted">build speed (illustrative)</p>
      </div>
    </div>
  );
}

function StepCopy({ i, withExtras }: { i: number; withExtras: boolean }) {
  const s = steps[i];
  return (
    <>
      <p className="font-display text-sm font-semibold text-primary">Step {s.n}</p>
      <h3 className="mt-2 text-[clamp(1.8rem,3.2vw,2.8rem)] font-bold leading-tight">{s.title}</h3>
      <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-muted">{s.body}</p>
      {withExtras && i === 2 && <SpeedMeter />}
      {withExtras && i === 3 && (
        <ul className="mt-6 grid grid-cols-2 gap-2.5">
          {s.detail.map((d) => (
            <li key={d} data-qa className="flex items-center gap-2.5 rounded-xl border border-line bg-white/85 px-3 py-2.5 text-sm font-medium text-navy">
              <span data-qa-dot className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-line text-white">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              {d}
            </li>
          ))}
        </ul>
      )}
      {(!withExtras || (i !== 2 && i !== 3)) && s.detail.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {s.detail.map((d) => (
            <li key={d} className="rounded-full border border-primary/15 bg-white/80 px-3.5 py-1.5 text-sm text-navy">
              {d}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Process() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const panels = gsap.utils.toArray<HTMLElement>('[data-step-panel]');
        const bgs = gsap.utils.toArray<HTMLElement>('[data-step-bg]');
        const nums = gsap.utils.toArray<HTMLElement>('[data-rail-num]');
        const fill = root.current!.querySelector<HTMLElement>('[data-rail-fill]')!;
        const arc = root.current!.querySelector<SVGPathElement>('[data-meter-arc]');
        const meterVal = root.current!.querySelector<HTMLElement>('[data-meter-value]');
        const qaDots = gsap.utils.toArray<HTMLElement>('[data-qa-dot]');

        gsap.set(panels.slice(1), { autoAlpha: 0 });
        gsap.set(bgs.slice(1), { autoAlpha: 0 });

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: pin.current,
            start: 'top top',
            end: '+=460%',
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            onUpdate: (self) => {
              journey.process = self.progress;
              fill.style.transform = `scaleY(${self.progress})`;
              const active = Math.round(self.progress * 4);
              nums.forEach((n, k) => n.toggleAttribute('data-active', k <= active));
            },
            onLeaveBack: () => { journey.process = 0; },
          },
        });
        tl.to({}, { duration: 1 }, 0); // timeline spans exactly 0 → 1

        // step i is centred at progress i/4 (the cube's stage 1+i)
        panels.forEach((p, i) => {
          const inAt = (i - 0.5) / 4;
          const outAt = (i + 0.5) / 4;
          if (i > 0) {
            tl.fromTo(p, { autoAlpha: 0, z: -420, x: -70, rotateY: 28, transformPerspective: 1200 }, { autoAlpha: 1, z: 0, x: 0, rotateY: 0, duration: 0.07 }, inAt);
            tl.fromTo(bgs[i], { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.08 }, inAt - 0.01);
          }
          if (i < panels.length - 1) {
            tl.to(p, { autoAlpha: 0, z: 240, x: 50, rotateY: -18, duration: 0.07, transformPerspective: 1200 }, outAt - 0.07);
            tl.to(bgs[i], { autoAlpha: 0, duration: 0.08 }, outAt - 0.06);
          }
        });

        // build: speed meter spins up
        const meter = { v: 1 };
        if (arc && meterVal) {
          tl.to(meter, {
            v: 3.2,
            duration: 0.16,
            ease: 'power1.in',
            onUpdate: () => {
              meterVal.textContent = meter.v.toFixed(1);
              arc.style.strokeDashoffset = String(126 * (1 - (meter.v - 1) / 2.2));
            },
          }, 2 / 4 - 0.08);
        }
        // QA: checks light up one by one while the laser sweeps
        qaDots.forEach((d, k) => {
          tl.to(d, { backgroundColor: '#1D4ED8', scale: 1.15, duration: 0.02, ease: 'back.out(3)' }, 3 / 4 - 0.07 + k * 0.035);
        });
      });

      // mobile / reduced: stacked steps, the cube hops between per-step anchors
      mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
        journey.process = 0;
      });
    },
    { scope: root },
  );

  return (
    <section id="process" ref={root} className="relative" aria-labelledby="process-title">
      {/* ---------- desktop: pinned, scroll-scrubbed build sequence ---------- */}
      <div className="hidden md:motion-safe:block">
        <div ref={pin} className="relative h-screen overflow-hidden">
          {steps.map((_, i) => (
            <div key={i} data-step-bg className="absolute inset-0" aria-hidden="true">
              <StepBackground i={i} />
            </div>
          ))}
          <DepthLayers variant="calm" className="opacity-60" />

          <div className="container relative z-10 flex h-full flex-col pb-10 pt-28">
            <div>
              <h2 id="process-title" className="text-[clamp(2rem,3.6vw,3.2rem)] font-bold">How we build</h2>
              <p className="mt-2 max-w-[60ch] text-muted">Keep scrolling to watch one project go from idea to launch.</p>
            </div>

            <div className="grid flex-1 grid-cols-12 items-center gap-6">
              {/* progress rail 01–05 */}
              <ol className="relative col-span-1 flex h-[340px] flex-col justify-between" aria-hidden="true">
                <span className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-[2px] bg-line" aria-hidden="true" />
                <span data-rail-fill className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-[2px] origin-top scale-y-0 bg-primary" aria-hidden="true" />
                {steps.map((s) => (
                  <li key={s.n} data-rail-num className="group relative z-10 flex items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-line bg-white font-display text-xs font-bold text-muted transition-colors duration-300 group-data-[active]:border-primary group-data-[active]:bg-primary group-data-[active]:text-white">
                      {s.n}
                    </span>
                    <span className="sr-only">{s.title}</span>
                  </li>
                ))}
              </ol>

              {/* screen readers get every step at once; the animated panels are visual */}
              <ol className="sr-only">
                {steps.map((s) => (
                  <li key={s.n}>{`${s.n} ${s.title}: ${s.body}`}</li>
                ))}
              </ol>
              <div className="relative col-span-6 h-[420px] [perspective:1200px] lg:col-span-5" aria-hidden="true">
                {steps.map((_, i) => (
                  <div key={i} data-step-panel className="absolute inset-0 flex flex-col justify-center">
                    <div>
                      <StepCopy i={i} withExtras />
                    </div>
                  </div>
                ))}
              </div>

              <div className="col-span-5 flex justify-center lg:col-span-6">
                <CubeAnchor stage="process" className="w-[min(32vw,340px)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- mobile & reduced motion: shorter stacked sequence ---------- */}
      <div className="relative py-24 md:motion-safe:hidden">
        <div className="container">
          <h2 className="text-[clamp(2rem,7vw,3rem)] font-bold" data-reveal>
            How we build
          </h2>
          <p className="mt-2 text-muted" data-reveal>From idea to launch in five steps.</p>
          <ol className="mt-12 space-y-20">
            {steps.map((s, i) => (
              <li key={s.n} className="relative">
                <div className="absolute -inset-x-5 -inset-y-8 overflow-hidden rounded-3xl opacity-70" aria-hidden="true">
                  <StepBackground i={i} />
                </div>
                <div className="relative grid gap-8 sm:grid-cols-[1fr_180px] sm:items-center">
                  <CubeAnchor stage={i + 1} className="mx-auto w-32 sm:order-2 sm:w-40" />
                  <div data-reveal>
                    <StepCopy i={i} withExtras={false} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
