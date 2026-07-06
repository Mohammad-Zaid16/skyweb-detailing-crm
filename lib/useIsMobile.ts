'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when viewport width is below the given breakpoint.
 * Defaults to 768px (tablet/mobile boundary).
 * SSR-safe: returns false on first render, then updates after mount.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Returns true when viewport width is below 480px (small phone boundary).
 * Useful for further tightening layouts beyond the general mobile breakpoint.
 */
export function useIsSmallMobile(): boolean {
  return useIsMobile(480);
}
