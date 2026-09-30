import type { CSSProperties, ReactNode } from 'react';

/**
 * Per-section parallax world (DOM half). Two layers behind the content:
 *   back  (data-depth 0.25, slowest) — glows + large drafting geometry
 *   mid   (data-depth 0.6)           — themed detail for this section
 * The content itself is the foreground (normal speed). Each layer also
 * drifts with the pointer through --mx/--my (see .mouse-layer).
 */
type Variant = 'blueprint' | 'code' | 'scan' | 'sky' | 'orbit' | 'calm' | 'debris';

function Layer({ depth, children }: { depth: number; children: ReactNode }) {
  return (
    <div data-depth={depth} className="absolute inset-[-15%] will-change-transform">
      <div className="mouse-layer" style={{ '--d': depth } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

const glow = (x: string, y: string, size: string, o = 0.35): CSSProperties => ({
  left: x, top: y, width: size, height: size,
  background: `radial-gradient(circle, rgb(var(--glow) / ${o}), transparent 65%)`,
});

const CODE_SNIPPETS = ['await agent.run(task)', 'deploy --prod', 'test: 128 passed', 'git push origin main', 'fn build(scope)', '<Checkout />', 'if (!verified) return', 'cron: "0 2 * * *"'];

export function DepthLayers({ variant, className = '' }: { variant: Variant; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <Layer depth={0.25}>
        <div className="absolute rounded-full blur-2xl" style={glow('8%', '12%', '44vmax', variant === 'sky' ? 0.55 : 0.3)} />
        <div className="absolute rounded-full blur-2xl" style={glow('60%', '48%', '38vmax', 0.25)} />
        {variant === 'blueprint' && (
          <svg className="absolute left-[55%] top-[20%] h-[50vmax] w-[50vmax] text-primary/[0.08]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="90" strokeDasharray="4 6" />
            <circle cx="100" cy="100" r="60" />
            <path d="M10 100h180M100 10v180" />
          </svg>
        )}
        {variant === 'orbit' && (
          <svg className="absolute left-[10%] top-[25%] h-[40vmax] w-[80vmax] text-accent/[0.12]" viewBox="0 0 400 200" fill="none" stroke="currentColor">
            <ellipse cx="200" cy="100" rx="190" ry="60" />
            <ellipse cx="200" cy="100" rx="130" ry="40" strokeDasharray="3 5" />
          </svg>
        )}
      </Layer>
      <Layer depth={0.6}>
        {variant === 'blueprint' && (
          <svg className="absolute inset-0 h-full w-full text-primary/[0.14]" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.12">
            <path d="M12 30h18M12 28.5v3M30 28.5v3" />
            <path d="M70 70h16M70 68.5v3M86 68.5v3" />
            <path d="M80 18l6 6M20 78l5-5" strokeDasharray="0.8 0.8" />
          </svg>
        )}
        {variant === 'code' && (
          <div className="absolute inset-0">
            {CODE_SNIPPETS.map((s, i) => (
              <span
                key={s}
                className="absolute rounded-lg border border-primary/10 bg-white/60 px-3 py-1.5 font-mono text-xs text-primary/50 shadow-sm backdrop-blur-sm"
                style={{ left: `${8 + ((i * 37) % 80)}%`, top: `${10 + ((i * 23) % 75)}%` }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {variant === 'scan' && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-24 animate-sweep bg-gradient-to-b from-transparent via-accent/15 to-transparent" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(var(--accent)/0.05)_0_1px,transparent_1px_14px)]" />
          </div>
        )}
        {variant === 'sky' && (
          <div className="absolute inset-0 bg-gradient-to-b from-tint via-white to-transparent opacity-80" />
        )}
        {(variant === 'debris' || variant === 'calm' || variant === 'orbit') && (
          <div className="absolute inset-0">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="absolute rounded-[4px] border border-accent/25 bg-glow/20"
                style={{
                  left: `${(i * 53) % 95}%`,
                  top: `${(i * 31) % 90}%`,
                  width: 10 + (i % 4) * 8,
                  height: 10 + (i % 4) * 8,
                  transform: `rotate(${i * 27}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </Layer>
    </div>
  );
}
