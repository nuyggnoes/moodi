"use client";

import { AiComment } from "@/features/comment/AiComment";
import type { WeekDay } from "./weekDays";

/**
 * 우측 패널이 숨겨지는 1100px 이하에서 캐러셀 아래에 보이는 메모·AI 코멘트 영역.
 * 높이가 고정이라 날을 바꿔도 아래 영역이 밀리지 않는다. 메모 1줄 + 코멘트 3줄까지 말줄임이고 전체 보기는 없다.
 * 1101px 이상에서는 CSS 로 숨긴다 (그때는 우측 패널이 보여준다).
 */
export function SelectedDayNote({ day }: { day: WeekDay }) {
  const record = day.record;

  return (
    <div
      aria-live="polite"
      className="flex min-h-[6.4em] w-full max-w-[440px] flex-col items-center gap-1.5 text-center text-sm min-[1101px]:hidden"
    >
      {record && (
        <>
          {record.memo && (
            <p className="line-clamp-1 max-w-full text-ink [overflow-wrap:anywhere]">
              “{record.memo}”
            </p>
          )}
          <AiComment
            key={record.id}
            record={record}
            renderReady={(comment) => (
              <p className="line-clamp-3 text-ink-dim [overflow-wrap:anywhere]">{comment}</p>
            )}
          />
        </>
      )}
    </div>
  );
}
