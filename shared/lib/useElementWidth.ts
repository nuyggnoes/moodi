"use client";

import { useCallback, useState } from "react";

/**
 * 요소의 가로 폭(px)을 따라가는 ref 콜백과 현재 폭.
 * 측정 전(서버 렌더링 포함)에는 `fallback` 을 돌려준다.
 */
export function useElementWidth(fallback: number): [(el: HTMLElement | null) => void, number] {
  const [width, setWidth] = useState(fallback);

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;

    setWidth(el.clientWidth || fallback);
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => setWidth(el.clientWidth || fallback));
    observer.observe(el);
    return () => observer.disconnect();
  }, [fallback]);

  return [ref, width];
}
