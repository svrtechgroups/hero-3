'use client';

import { useRef, type ReactNode, type PointerEvent } from 'react';

/** Perspective tilt with a light reflection that follows the pointer. */
export function TiltCard({ children, className = '', max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
    ref.current.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
    ref.current.style.setProperty('--px', `${px * 100}%`);
    ref.current.style.setProperty('--py', `${py * 100}%`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt ${className}`}>
      {children}
    </div>
  );
}
