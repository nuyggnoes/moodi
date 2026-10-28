import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PencilIcon } from "@/shared/ui/icons";
import { formatKstTime } from "@/shared/lib/date/kst";
import { AiComment } from "@/features/comment/AiComment";
import { getMoodLabel, MOOD_COLORS } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";
import { getEmptyKind, type EmptyKind } from "./emptyKind";

const EDIT_HREF = "/record?edit=1";

const MOOD_SOURCE_TEXT: Record<string, string> = {
  ai: "AI 제안을 선택했어요",
  user: "직접 골랐어요",
};

type DayDetailProps = {
  /** 선택한 날의 기록. 없으면 날짜에 맞는 빈 상태를 보인다. */
  record: MusicRecord | null;
  /** 선택한 날(YYYY-MM-DD). 선택이 없으면 null — 기록이 하나도 없는 달이다. */
  dateKey: string | null;
  todayKey: string;
  /** 보고 있는 달이 이번 달인가. 이번 달이 비어 있을 때만 기록 CTA를 보인다. */
  isCurrentMonth: boolean;
};

export function DayDetail({
  record,
  dateKey,
  todayKey,
  isCurrentMonth,
}: DayDetailProps) {
  if (!record) {
    return (
      <EmptyCard
        kind={getEmptyKind(dateKey, todayKey)}
        isCurrentMonth={isCurrentMonth}
      />
    );
  }

  const color = MOOD_COLORS[record.mood];
  const isToday = dateKey === todayKey;

  return (
    <article
      style={{ "--mc": color } as CSSProperties}
      className="flex flex-col gap-5 rounded-[20px] border border-border bg-surface p-5 shadow-[0_24px_60px_rgba(8,6,16,0.35)]"
    >
      <AlbumArt src={record.album_art} size={144} radius={16} />
      <div className="flex flex-col gap-1">
        <span className="text-[19px] font-semibold leading-snug tracking-tight text-ink">
          {record.track_name}
        </span>
        <span className="text-[14px] text-ink-dim">{record.artist}</span>
      </div>
      <span className="inline-flex items-center gap-2 self-start rounded-full border border-[color-mix(in_srgb,var(--mc)_55%,transparent)] bg-[color-mix(in_srgb,var(--mc)_20%,var(--color-surface))] px-3.5 py-1.5 text-[13px] font-medium text-ink">
        <i className="size-2 rounded-full bg-[var(--mc)]" />
        {getMoodLabel(record.mood)}
      </span>
      {record.memo && (
        <div className="flex flex-col gap-1">
          <h3 className="font-mono text-[11px] font-normal tracking-[0.06em] text-ink-faint">
            MEMO
          </h3>
          <p className="text-[15px] leading-relaxed text-ink [overflow-wrap:anywhere]">
            {record.memo}
          </p>
        </div>
      )}
      <AiComment
        record={record}
        renderReady={(comment) => (
          <div className="flex flex-col gap-1">
            <h3 className="font-mono text-[11px] font-normal tracking-[0.06em] text-ink-faint">
              AI COMMENT
            </h3>
            <p className="text-[15px] leading-relaxed text-ink-dim [overflow-wrap:anywhere]">
              {comment}
            </p>
          </div>
        )}
      />
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-ink-faint">
        <span>
          {formatKstTime(record.created_at)} 기록 ·{" "}
          {MOOD_SOURCE_TEXT[record.mood_source] ?? MOOD_SOURCE_TEXT.user}
        </span>
        {isToday && (
          <Link
            href={EDIT_HREF}
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

function EmptyCard({
  kind,
  isCurrentMonth,
}: {
  kind: EmptyKind;
  isCurrentMonth: boolean;
}) {
  // 기록을 남길 수 있는 건 오늘뿐이다. 이번 달이 비어 있을 때도 오늘 기록으로 안내한다.
  const showCta = kind === "today" || (kind === "month" && isCurrentMonth);

  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-border px-5 py-12 text-center">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full border border-border text-ink-faint"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </span>
      <EmptyText kind={kind} />
      {showCta && (
        <Link
          href="/record"
          className="mt-1 rounded-full bg-accent px-6 py-2.5 font-semibold text-bg hover:brightness-110"
        >
          기록하기
        </Link>
      )}
    </div>
  );
}

const EMPTY_TEXT: Record<EmptyKind, { title: string; hint?: string }> = {
  today: {
    title: "오늘의 기록이 아직 없어요",
    hint: "지금 기분에 맞는 노래를 남겨보세요.",
  },
  past: { title: "이 날은 기록이 없어요." },
  future: { title: "아직 오지 않은 날이에요" },
  month: { title: "이 달은 기록이 없어요." },
};

function EmptyText({ kind }: { kind: EmptyKind }): ReactNode {
  const { title, hint } = EMPTY_TEXT[kind];
  return (
    <>
      <p className="text-[15px] font-medium text-ink-dim">{title}</p>
      {hint && <p className="text-sm text-ink-faint">{hint}</p>}
    </>
  );
}
