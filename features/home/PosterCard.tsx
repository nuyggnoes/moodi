"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PauseIcon, PlayIcon, PlusIcon } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/cn";
import { MOOD_COLORS } from "@/entities/record/mood";
import { formatDayLabel } from "./dayLabel";
import type { WeekDay } from "./weekDays";

type PosterCardProps = {
  day: WeekDay;
  /** 가운데에 놓인 포스터인지. 아니면 읽기 대상에서 빠지고 포커스도 받지 않는다. */
  isCenter: boolean;
  /** 가운데가 아닌 포스터를 눌렀을 때: 이동 대신 이 포스터를 가운데로 가져온다. */
  onBringToCenter: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** 배치(transform, z-index 등)는 캐러셀이 정한다. */
  style?: CSSProperties;
};

const BASE =
  "absolute left-1/2 top-1/2 -ml-[140px] -mt-[196px] flex h-[392px] w-[280px] flex-col gap-3 rounded-[22px] border p-3.5 text-left transition-[transform,opacity,box-shadow] duration-[550ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none";

/**
 * 주간 캐러셀의 포스터 한 장. 세 가지 중 하나다.
 * - 기록 있음: 앨범 아트, 곡, 미리듣기
 * - 지난날 기록 없음: 점선 빈 포스터 (+ 없음, 어떤 이동·수정도 없음)
 * - 오늘 기록 없음: + 아이콘 CTA, 포스터 전체가 `/record` 링크 (가운데일 때만 이동)
 */
export function PosterCard({
  day,
  isCenter,
  onBringToCenter,
  isPlaying,
  onTogglePlay,
  style,
}: PosterCardProps) {
  const { record, isToday } = day;
  const label = formatDayLabel(day.dateKey);
  const focusable = isCenter ? 0 : -1;

  const header = (
    <div className="flex items-baseline justify-between px-0.5">
      <span className="font-mono text-[13px] tracking-wide text-ink">{label.date}</span>
      <span className="text-xs text-ink-dim">
        {label.weekdayName}
        {isToday && " · 오늘"}
      </span>
    </div>
  );

  if (!record && isToday) {
    // 가운데가 아니면 이동하지 않고 중앙으로만 가져온다.
    function handleClick(event: MouseEvent) {
      if (isCenter) return;
      event.preventDefault();
      onBringToCenter();
    }

    return (
      <Link
        href="/record"
        aria-hidden={!isCenter}
        aria-label="오늘 기록하기"
        tabIndex={focusable}
        onClick={handleClick}
        style={style}
        className={cn(
          BASE,
          "group cursor-pointer items-center justify-center gap-3.5 border-[1.5px] border-dashed border-accent/60 bg-accent/10 text-center",
        )}
      >
        <div className="absolute left-4 right-4 top-3.5">{header}</div>
        <p className="max-w-[210px] text-[19px] font-semibold leading-snug tracking-tight text-ink [text-wrap:balance]">
          나의 오늘 감정을 노래와 함께 기록
        </p>
        <span
          aria-hidden="true"
          className={cn(
            "grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-accent/55 bg-accent/15 text-accent transition-transform",
            isCenter && "group-hover:scale-105",
          )}
        >
          <PlusIcon />
        </span>
      </Link>
    );
  }

  if (!record) {
    return (
      <div
        aria-hidden={!isCenter}
        onClick={isCenter ? undefined : onBringToCenter}
        style={style}
        className={cn(
          BASE,
          "cursor-default items-center justify-center gap-1.5 border-[1.5px] border-dashed border-border text-center text-ink-faint",
        )}
      >
        <div className="absolute left-4 right-4 top-3.5">{header}</div>
        <strong className="font-medium text-ink-dim">기록 없는 날</strong>
        <span>조용히 지나간 하루</span>
      </div>
    );
  }

  const moodColor = MOOD_COLORS[record.mood];
  const glow = isCenter
    ? `0 30px 80px rgba(8,6,16,.65), 0 0 0 1px color-mix(in srgb, ${moodColor} 55%, transparent), 0 0 60px color-mix(in srgb, ${moodColor} 28%, transparent)`
    : "0 24px 60px rgba(8,6,16,.55)";

  return (
    <div
      aria-hidden={!isCenter}
      onClick={isCenter ? undefined : onBringToCenter}
      style={{ ...style, boxShadow: glow }}
      className={cn(BASE, "border-border bg-surface")}
    >
      {header}

      <div className="relative">
        <AlbumArt src={record.album_art} size={250} radius={14} />
        <button
          type="button"
          tabIndex={focusable}
          disabled={!record.preview_url}
          aria-label={`${record.track_name} ${isPlaying ? "정지" : "미리듣기"}`}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePlay();
          }}
          className="absolute bottom-2.5 right-2.5 z-10 grid h-10 w-10 place-items-center rounded-full bg-bg/65 text-ink backdrop-blur-sm hover:bg-bg/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <div className="min-w-0 px-0.5">
        <p className="truncate text-base font-semibold tracking-tight text-ink">{record.track_name}</p>
        <p className="truncate text-[13px] text-ink-dim">{record.artist}</p>
      </div>
    </div>
  );
}
