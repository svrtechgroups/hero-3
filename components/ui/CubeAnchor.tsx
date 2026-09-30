/**
 * Marks a resting place for the traveling cube. The WebGL cube reads this
 * element's position + width every frame (see lib/journey.ts).
 * `stage` is the cube's form here; "process" = dynamic 1→5.
 */
export function CubeAnchor({
  stage,
  className = '',
  frame = true,
  label,
}: {
  stage: number | 'process';
  className?: string;
  frame?: boolean;
  label?: string;
}) {
  return (
    <div data-cube-anchor data-stage={String(stage)} className={`relative aspect-square ${frame ? 'blueprint-frame' : ''} ${className}`} aria-hidden="true">
      {frame && (
        <>
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </>
      )}
      {label && (
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-xs text-primary/70">{label}</span>
      )}
    </div>
  );
}
