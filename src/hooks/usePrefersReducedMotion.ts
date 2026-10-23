"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Lắng nghe media query `prefers-reduced-motion` để giảm chuyển động. */
export function usePrefersReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const getSnapshot = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
