"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ViewportSize = { width: number; height: number };

let cachedSize: ViewportSize = { width: 1280, height: 800 };

/**
 * Kích thước viewport (useSyncExternalStore — không gây re-render dư thừa).
 * Dùng để tính vị trí đích của lá thư / ảnh trong choreography.
 */
export function useViewportSize(): ViewportSize {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("resize", onChange, { passive: true });
    return () => window.removeEventListener("resize", onChange);
  }, []);

  const getSnapshot = useCallback((): ViewportSize => {
    const next = { width: window.innerWidth, height: window.innerHeight };
    if (next.width !== cachedSize.width || next.height !== cachedSize.height) {
      cachedSize = next;
    }
    return cachedSize;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, () => cachedSize);
}
