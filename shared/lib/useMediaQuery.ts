"use client";

import { useSyncExternalStore } from "react";

/** CSS 미디어 쿼리 일치 여부. 서버 렌더링 중에는 false. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () =>
      typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );
}
