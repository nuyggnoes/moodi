"use client";

import { useEffect, useState } from "react";

/** `value`가 `delayMs` 동안 안 바뀌면 그 값을 반환한다. 그 전에 또 바뀌면 타이머가 리셋된다. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
