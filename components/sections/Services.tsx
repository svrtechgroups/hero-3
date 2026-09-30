import { services } from '@/lib/content';
import { CubeAnchor } from '@/components/ui/CubeAnchor';
import { DepthLayers } from '@/components/ui/DepthLayers';
import { ServiceIcons } from '@/components/ui/Icons';
import { TiltCard } from '@/components/ui/TiltCard';

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-28 md:py-36" aria-labelledby="services-title">
      <DepthLayers variant="code" className="opacity-80" />
      <div data-depth-section="both" className="container relative z-10">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-end">
          <h2 id="services-title" data-reveal className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-tight">
            One team for everything you need built
          </h2>
          <p data-reveal className="max-w-[48ch] text-lg text-muted md:justify-self-end">
            Four kinds of work, one process. Each project gets the same design, review and testing standards.
          </p>
        </div>

        <div className="relative mt-16 grid gap-6 sm:grid-cols-2">
          {/* the cube arrives here, then splits into the four icon slots */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CubeAnchor stage={7} frame={false} className="w-24" />
          </div>

          {services.map((s, i) => {
            const Icon = ServiceIcons[i];
            return (
              <div key={s.title} data-reveal className={i % 2 === 1 ? 'sm:mt-12' : ''}>
                <TiltCard className="h-full rounded-[28px] border border-white bg-white/85 p-7 shadow-depth backdrop-blur-md hover:shadow-depth-lg md:p-9">
                  <div className="tilt-lift">
                    <div data-service-slot={i} className="blueprint-frame grid h-20 w-20 place-items-center !rounded-2xl">
                      <Icon className="h-9 w-9 text-primary" style={{ opacity: 'calc(1 - var(--svc-split))' }} aria-hidden="true" />
                    </div>
                    <h3 className="mt-7 text-2xl font-bold">{s.title}</h3>
                    <p className="mt-3 max-w-[40ch] leading-relaxed text-muted">{s.body}</p>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {s.points.map((p) => (
                        <li key={p} className="rounded-full bg-tint px-3.5 py-1.5 text-sm font-medium text-primary">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
