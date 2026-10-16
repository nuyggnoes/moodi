"use client";

import { cn } from "@/shared/lib/cn";
import { MOOD_COLORS } from "@/entities/record/mood";
import { formatDayLabel } from "./dayLabel";
import type { WeekDay } from "./weekDays";

type DateStripProps = {
  days: WeekDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

/** 캐러셀 아래 날짜 스트립: 요일·일자·무드 색 점. 키보드 사용자가 포스터를 고르는 수단이기도 하다. */
export function DateStrip({ days, selectedIndex, onSelect }: DateStripProps) {
  return (
    <div role="tablist" aria-label="날짜 선택" className="flex gap-1.5">
      {days.map((day, index) => {
        const label = formatDayLabel(day.dateKey);
        const selected = index === selectedIndex;
        const color = day.record ? MOOD_COLORS[day.record.mood] : null;

        return (
          <button
            key={day.dateKey}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`${label.date} ${label.weekdayName}`}
            onClick={() => onSelect(index)}
            className={cn(
              "grid min-w-[52px] justify-items-center gap-0.5 rounded-xl border border-transparent px-1 py-1.5 text-ink-faint hover:bg-surface-hover",
              selected && "border-border bg-surface",
            )}
          >
            <span className="text-[11px]">{label.weekday}</span>
            <span className={cn("font-mono text-[13px]", selected ? "text-ink" : "text-ink-dim")}>
              {label.day}
            </span>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full border"
              style={
                color
                  ? { background: color, borderColor: color }
                  : { borderColor: "var(--color-border)" }
              }
            />
          </button>
        );
      })}
    </div>
  );
}
