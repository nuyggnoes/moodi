"use client";

import { useState } from "react";
import { RightPanel } from "@/features/nav/RightPanel";
import { formatDayLabel } from "./dayLabel";
import { SelectedDayNote } from "./SelectedDayNote";
import { SelectedDayPanel } from "./SelectedDayPanel";
import { useWeekRecords } from "./useWeekRecords";
import { WEEK_DAYS } from "./weekDays";
import { WeekCarousel } from "./WeekCarousel";

/** 오늘 기록의 수정 화면. 수정은 항상 오늘 기록만 대상이다. */
const EDIT_HREF = "/record?edit=1";

/**
 * `/` — 최근 7일 주간 포스터 캐러셀 + 우측 상세 패널.
 * 선택은 이곳이 들고 있고(오늘에서 시작), 캐러셀과 패널·아래 영역이 같은 선택을 본다.
 */
export function HomeView({ userId }: { userId: string }) {
  const { data: days, isError, refetch } = useWeekRecords(userId);
  const [selectedIndex, setSelectedIndex] = useState(WEEK_DAYS - 1);

  if (isError) {
    return (
      <Frame>
        <div role="alert" className="flex flex-col items-center gap-3 py-24 text-center text-ink-dim">
          <p>기록을 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-surface-hover"
          >
            다시 시도
          </button>
        </div>
      </Frame>
    );
  }

  if (!days) {
    return (
      <Frame>
        <div
          role="status"
          aria-label="기록을 불러오는 중"
          className="h-[480px] w-full max-w-[980px] rounded-[22px] bg-surface/40 motion-safe:animate-pulse"
        />
      </Frame>
    );
  }

  const selected = days[selectedIndex];
  const askToday = selected.isToday && selected.record === null;

  return (
    <Frame>
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-dim">
          최근 7일 · {formatDayLabel(days[0].dateKey).date} – {formatDayLabel(days[days.length - 1].dateKey).date}
        </p>
        <h1 className="mt-1.5 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-tight [text-wrap:balance]">
          {askToday ? "오늘은 어떤 노래가 어울리나요?" : "이번 주, 이런 노래와 함께였어요"}
        </h1>
      </header>

      <WeekCarousel
        days={days}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        belowStage={<SelectedDayNote day={selected} />}
      />

      <RightPanel>
        <SelectedDayPanel day={selected} editHref={EDIT_HREF} />
      </RightPanel>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-5 overflow-x-clip px-4 py-7">
      {children}
    </div>
  );
}
