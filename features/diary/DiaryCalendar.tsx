"use client";

import { useMemo, useState } from "react";
import { getMonthGrid, toDateKey } from "./calendarGrid";
import { useMonthRecords } from "./useMonthRecords";
import { DayDetail } from "./DayDetail";
import { MOOD_COLORS } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function goToPrevMonth(year: number, month: number): [number, number] {
  return month === 0 ? [year - 1, 11] : [year, month - 1];
}

function goToNextMonth(year: number, month: number): [number, number] {
  return month === 11 ? [year + 1, 0] : [year, month + 1];
}

export function DiaryCalendar({ userId }: { userId: string }) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: records } = useMonthRecords(userId, year, month);
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const recordsByDay = useMemo(() => {
    const map = new Map<string, MusicRecord[]>();
    for (const record of records ?? []) {
      const key = toDateKey(new Date(record.created_at));
      const list = map.get(key) ?? [];
      list.push(record);
      map.set(key, list);
    }
    return map;
  }, [records]);

  function handlePrev() {
    const [y, m] = goToPrevMonth(year, month);
    setYear(y);
    setMonth(m);
    setSelectedKey(null);
  }

  function handleNext() {
    const [y, m] = goToNextMonth(year, month);
    setYear(y);
    setMonth(m);
    setSelectedKey(null);
  }

  const selectedRecords = selectedKey ? (recordsByDay.get(selectedKey) ?? []) : [];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="이전 달"
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-ink-dim"
        >
          ‹
        </button>
        <span className="text-[15px] font-medium text-ink">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={handleNext}
          aria-label="다음 달"
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-ink-dim"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-faint">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map(({ date, inCurrentMonth }) => {
          const key = toDateKey(date);
          const dayRecords = recordsByDay.get(key) ?? [];
          const latestMood = dayRecords[dayRecords.length - 1]?.mood;
          const isSelected = selectedKey === key;

          return (
            <button
              key={key}
              type="button"
              disabled={!inCurrentMonth}
              onClick={() => setSelectedKey(key)}
              aria-label={key}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-sm disabled:cursor-default ${
                inCurrentMonth ? "text-ink" : "text-ink-faint/40"
              } ${isSelected ? "bg-surface-hover" : ""}`}
            >
              <span>{date.getDate()}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: latestMood ? MOOD_COLORS[latestMood] : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      {selectedKey && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-dim">{selectedKey}</span>
          <DayDetail records={selectedRecords} />
        </div>
      )}
    </div>
  );
}
