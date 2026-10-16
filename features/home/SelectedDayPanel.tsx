"use client";

import Link from "next/link";
import { useState } from "react";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PencilIcon } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/cn";
import { useIsClamped } from "@/shared/lib/useIsClamped";
import { formatKstTime } from "@/shared/lib/date/kst";
import { AiComment } from "@/features/comment/AiComment";
import { isCommentTarget } from "@/entities/record/comment";
import { getMoodLabel, MOOD_COLORS } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";
import { formatDayLabel } from "./dayLabel";
import type { WeekDay } from "./weekDays";

type SelectedDayPanelProps = {
  day: WeekDay;
  /** 오늘 기록에 보이는 "수정" 버튼의 이동 경로. 없으면 버튼을 그리지 않는다. */
  editHref?: string;
};

const MOOD_SOURCE_TEXT: Record<string, string> = {
  ai: "AI 제안을 선택했어요",
  user: "직접 골랐어요",
};

/**
 * 우측 패널: 캐러셀에서 고른 날의 상세.
 * 메모(2줄)와 AI 코멘트(4줄)는 넘치면 말줄임이고, "전체 보기"는 넘칠 때만 나타나 패널 안에서만 늘어난다.
 */
export function SelectedDayPanel({ day, editHref }: SelectedDayPanelProps) {
  const label = formatDayLabel(day.dateKey);

  return (
    <section aria-label="선택한 날" className="flex flex-col gap-3.5">
      <h2 className="flex justify-between text-[13px] font-medium text-ink-dim">
        선택한 날
        <span className="font-mono text-ink-faint">
          {label.date} {label.weekday}
          {day.isToday && " · 오늘"}
        </span>
      </h2>

      {day.record ? (
        // 날이 바뀌면 펼침 상태와 잘림 측정이 새로 시작되도록 기록 id 로 다시 마운트한다.
        <DetailCard
          key={day.record.id}
          record={day.record}
          editHref={day.isToday ? editHref : undefined}
        />
      ) : day.isToday ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border px-2 py-7 text-center text-ink-faint">
          <b className="font-medium text-ink-dim">오늘의 기록이 아직 없어요</b>
          <span>지금 기분에 맞는 노래를 남겨보세요.</span>
          <Link
            href="/record"
            className="mt-2 rounded-full bg-accent px-6 py-2.5 font-semibold text-bg hover:brightness-110"
          >
            기록하기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border px-2 py-7 text-center text-ink-faint">
          <b className="font-medium text-ink-dim">기록 없는 날</b>
          <span>조용히 지나간 하루예요.</span>
        </div>
      )}
    </section>
  );
}

function DetailCard({ record, editHref }: { record: MusicRecord; editHref?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [memoRef, memoClamped] = useIsClamped();
  const [commentRef, commentClamped] = useIsClamped();

  const moodColor = MOOD_COLORS[record.mood];
  const showComment = isCommentTarget(record);
  const showToggle = expanded || memoClamped || commentClamped;

  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <AlbumArt src={record.album_art} size={72} radius={10} />
        <div className="grid min-w-0 justify-items-start gap-0.5">
          <p className="max-w-full truncate font-semibold text-ink">{record.track_name}</p>
          <p className="max-w-full truncate text-[13px] text-ink-dim">{record.artist}</p>
          <span
            className="mt-1.5 inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium text-ink"
            style={{
              background: `color-mix(in srgb, ${moodColor} 20%, var(--color-surface))`,
              borderColor: `color-mix(in srgb, ${moodColor} 55%, transparent)`,
            }}
          >
            <i className="h-2 w-2 rounded-full" style={{ background: moodColor }} />
            {getMoodLabel(record.mood)}
          </span>
        </div>
      </div>

      <section>
        <h3 className="mb-1 font-mono text-[11px] tracking-wider text-ink-faint">MEMO</h3>
        {record.memo ? (
          <p ref={memoRef} className={cn("[overflow-wrap:anywhere]", !expanded && "line-clamp-2")}>
            {record.memo}
          </p>
        ) : (
          <p className="text-xs text-ink-faint">남긴 메모가 없어요.</p>
        )}
      </section>

      {showComment && (
        <section>
          <h3 className="mb-1 font-mono text-[11px] tracking-wider text-ink-faint">AI 코멘트</h3>
          <AiComment
            record={record}
            renderReady={(comment) => (
              <p
                ref={commentRef}
                className={cn("text-ink-dim [overflow-wrap:anywhere]", !expanded && "line-clamp-4")}
              >
                {comment}
              </p>
            )}
          />
        </section>
      )}

      {showToggle && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="self-start py-0.5 text-xs text-accent"
        >
          {expanded ? "접기" : "전체 보기"}
        </button>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5 text-xs text-ink-faint">
        <span>
          {formatKstTime(record.created_at)} 기록 · {MOOD_SOURCE_TEXT[record.mood_source] ?? MOOD_SOURCE_TEXT.user}
        </span>
        {editHref && (
          <Link
            href={editHref}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1 text-ink-dim hover:bg-surface-hover hover:text-ink"
          >
            <PencilIcon />
            수정
          </Link>
        )}
      </div>
    </article>
  );
}
