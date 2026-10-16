"use client";

import { useCallback, useState } from "react";

/**
 * `line-clamp` 등으로 내용이 잘려 보이는지(`scrollHeight > clientHeight`) 알려주는 ref 콜백과 상태.
 * 마운트 시 한 번 재고, 이후 크기가 바뀌면(펼침·접힘, 폭 변화) 다시 잰다.
 * 같은 요소에서 내용만 바뀌는 경우는 감지하지 못하므로, 내용이 바뀔 때 `key` 로 다시 마운트한다.
 */
export function useIsClamped(): [(el: HTMLElement | null) => void, boolean] {
  const [clamped, setClamped] = useState(false);

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;

    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, clamped];
}
