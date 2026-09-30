'use client';
import { useEffect, useState } from 'react';

/** false while the tab is hidden — canvases switch to frameloop="never". */
export function usePageActive() {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const onChange = () => setActive(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return active;
}
