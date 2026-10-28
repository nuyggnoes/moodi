import type { CSSProperties } from "react";
import { MOOD_COLORS, getMoodLabel, type Mood } from "@/entities/record/mood";

/** 포스터 아래에 붙는 무드 칩. 아직 고르지 않았으면 점선 자리 표시를 보여준다. */
export function MoodChip({ mood }: { mood: Mood | null }) {
  if (!mood) {
    return (
      <span className="self-start rounded-full border border-dashed border-border px-3 py-1 text-[12.5px] text-ink-faint">
        기분을 고르면 여기에 담겨요
      </span>
    );
  }

  const color = MOOD_COLORS[mood];
  const style: CSSProperties = {
    background: `color-mix(in srgb, ${color} 20%, var(--color-surface))`,
    borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
  };

  return (
    <span
      style={style}
      className="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-[13px] font-medium text-ink"
    >
      <i aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />
      {getMoodLabel(mood)}
    </span>
  );
}
