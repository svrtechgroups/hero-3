'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { journey } from '@/lib/journey';

// Heavy 3D code is split out and only loaded in the browser.
const WorldCanvas = dynamic(() => import('./WorldCanvas'), { ssr: false });
const CubeCanvas = dynamic(() => import('./CubeCanvas'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Two fixed canvases share one camera setup:
 *  - World (z-0) sits BEHIND the content: grids, code rain, beams, glass shapes.
 *  - Cube (z-30) sits IN FRONT of the content so the cube can fly into cards
 *    and beside the form. It never takes pointer events.
 * If WebGL is unavailable the page still works — every DOM icon/logo shows.
 */
export function JourneyCanvases() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const supported = hasWebGL();
    journey.webgl = supported;
    // idle-load so the first paint and LCP text are never blocked by 3D
    const start = () => setOk(supported);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1200 });
    else setTimeout(start, 300);
  }, []);
  if (!ok) return null;
  return (
    <>
      <WorldCanvas />
      <CubeCanvas />
    </>
  );
}
