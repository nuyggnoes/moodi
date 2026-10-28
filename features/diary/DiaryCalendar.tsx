"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { getMonthGrid, toDateKey } from "./calendarGrid";
import { kstDateKey, kstToday } from "@/shared/lib/date/kst";
import { useMonthRecords } from "./useMonthRecords";
import { countMoods, pickDefaultDayKey } from "./moodStats";
import { DayDetail } from "./DayDetail";
import { MoodBleed } from "@/shared/ui/MoodBleed";
import {
  DEFAULT_BLEED,
  MOOD_COLORS,
  MOOD_OPTIONS,
} from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function goToPrevMonth(year: number, month: number): [number, number] {
  return month === 0 ? [year - 1, 11] : [year, month - 1];
}

function goToNextMonth(year: number, month: number): [number, number] {
  return month === 11 ? [year + 1, 0] : [year, month + 1];
}

export function DiaryCalendar({ userId }: { userId: string }) {
  const today = useMemo(() => kstToday(), []);
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  // 사용자가 직접 고른 날. null 이면 기본 선택(오늘 또는 가장 최근 기록일)을 따른다.
  const [pickedKey, setPickedKey] = useState<string | null>(null);

  const { data: records } = useMonthRecords(userId, year, month);
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const recordsByDay = useMemo(() => {
    const map = new Map<string, MusicRecord[]>();
    for (const record of records ?? []) {
      const key = kstDateKey(record.created_at);
      const list = map.get(key) ?? [];
      list.push(record);
      map.set(key, list);
    }
    return map;
  }, [records]);

  const moodCounts = useMemo(() => countMoods(records ?? []), [records]);
  const recordedDays = (records ?? []).length;

  const selectedKey =
    pickedKey ?? pickDefaultDayKey([...recordsByDay.keys()], today.key);
  const selectedRecords = selectedKey
    ? (recordsByDay.get(selectedKey) ?? [])
    : [];
  // 하루 1기록(ADR-0007)이라 한 날의 기록은 하나다.
  const selectedRecord = selectedRecords[selectedRecords.length - 1] ?? null;
  const selectedMood = selectedRecord?.mood;

  const isCurrentMonth = year === today.year && month === today.month;

  function moveMonth(next: [number, number]) {
    setYear(next[0]);
    setMonth(next[1]);
    setPickedKey(null);
  }

  return (
    <div className="mx-auto grid w-full max-w-[720px] gap-7 p-4 min-[761px]:px-6 min-[761px]:py-7 min-[1101px]:max-w-[1080px] min-[1101px]:grid-cols-[minmax(0,1fr)_380px] min-[1101px]:items-start">
      <MoodBleed
        color={selectedMood ? MOOD_COLORS[selectedMood] : DEFAULT_BLEED}
      />

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.08em] text-ink-dim">
              {year} · {MONTH_NAMES[month]}
            </div>
            <h1 className="mt-1 text-[clamp(24px,3vw,34px)] font-semibold tracking-tight text-ink">
              {month + 1}월의 무드
            </h1>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => moveMonth(goToPrevMonth(year, month))}
              aria-label="이전 달"
              className="grid size-10 place-items-center rounded-full border border-border bg-surface/80 text-ink hover:bg-surface-hover"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => moveMonth(goToNextMonth(year, month))}
              disabled={isCurrentMonth}
              aria-label="다음 달"
              className="grid size-10 place-items-center rounded-full border border-border bg-surface/80 text-ink hover:bg-surface-hover disabled:cursor-default disabled:opacity-30 disabled:hover:bg-surface/80"
            >
              ›
            </button>
          </div>
        </div>

        {recordedDays > 0 ? (
          <div className="flex flex-col gap-2.5">
            <div
              className="flex h-2.5 max-w-[520px] gap-0.5 overflow-hidden rounded-full"
              aria-hidden="true"
            >
              {MOOD_OPTIONS.filter(({ value }) => moodCounts[value] > 0).map(
                ({ value }) => (
                  <i
                    key={value}
                    className="min-w-1.5 rounded-full"
                    style={{
                      flex: moodCounts[value],
                      background: MOOD_COLORS[value],
                    }}
                  />
                ),
              )}
            </div>
            <ul
              aria-label="무드 분포"
              className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-dim"
            >
              {MOOD_OPTIONS.map(({ value, label }) => (
                <li key={value} className="inline-flex items-center gap-1.5">
                  <i
                    className="size-2 rounded-full"
                    style={{ background: MOOD_COLORS[value] }}
                  />
                  {label}
                  <b className="font-mono font-medium text-ink">
                    {moodCounts[value]}
                  </b>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-ink-faint min-[761px]:gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 min-[761px]:gap-2">
            {grid.map(({ date, inCurrentMonth }) => {
              const key = toDateKey(date);
              const dayRecords = recordsByDay.get(key) ?? [];
              const latest = dayRecords[dayRecords.length - 1];
              const isFuture = key > today.key;
              const isSelected = selectedKey === key;
              const isToday = key === today.key;

              const tone = latest
                ? "border-[color-mix(in_srgb,var(--mc)_40%,transparent)] bg-[color-mix(in_srgb,var(--mc)_24%,var(--color-surface))] hover:-translate-y-0.5"
                : isFuture
                  ? "border-dashed border-border/60 opacity-35"
                  : "border-border/60";

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inCurrentMonth || isFuture}
                  onClick={() => setPickedKey(key)}
                  aria-label={key}
                  aria-pressed={isSelected}
                  style={
                    latest
                      ? ({ "--mc": MOOD_COLORS[latest.mood] } as CSSProperties)
                      : undefined
                  }
                  className={`flex aspect-square flex-col justify-between rounded-[10px] border p-1.5 text-left transition duration-200 disabled:cursor-default min-[761px]:rounded-2xl min-[761px]:px-2.5 min-[761px]:py-2 ${tone} ${
                    inCurrentMonth ? "" : "invisible"
                  } ${
                    isSelected && latest
                      ? "shadow-[0_0_0_2px_var(--color-accent),0_0_36px_color-mix(in_srgb,var(--mc)_45%,transparent)]"
                      : isSelected
                        ? "shadow-[0_0_0_2px_var(--color-accent)]"
                        : ""
                  }`}
                >
                  <span
                    className={`font-mono text-[13px] ${latest ? "text-ink" : "text-ink-faint"}`}
                  >
                    {date.getDate()}
                    {isToday && (
                      <span className="ml-1.5 font-sans text-[10px] text-accent">
                        오늘
                      </span>
                    )}
                  </span>
                  {latest && (
                    <span className="truncate text-[11px] text-ink-dim max-[760px]:hidden">
                      {latest.track_name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside
        aria-label="선택한 날의 기록"
        className="flex min-w-0 flex-col gap-2 min-[1101px]:sticky min-[1101px]:top-7"
      >
        {selectedKey && (
          <span className="font-mono text-xs tracking-[0.06em] text-ink-dim">
            {selectedKey}
          </span>
        )}
        <DayDetail
          record={selectedRecord}
          dateKey={selectedKey}
          todayKey={today.key}
          isCurrentMonth={isCurrentMonth}
        />
      </aside>
    </div>
  );
}
