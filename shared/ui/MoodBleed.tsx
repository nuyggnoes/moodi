import type { CSSProperties } from "react";

/**
 * 무드 색이 배경으로 번지는 고정 레이어 (docs/design/home-mockup.html).
 * 본문 뒤에 깔리며, 색이 바뀔 때 `.mood-bleed` 의 `--bleed` 전환(globals.css)으로 부드럽게 바뀐다.
 */
export function MoodBleed({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="mood-bleed"
      style={{ "--bleed": color } as CSSProperties}
    />
  );
}
