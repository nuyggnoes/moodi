"use client";

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PauseIcon, PlayIcon } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/cn";

type PosterFaceProps = {
  /** 헤더 왼쪽 (MM.DD) */
  dateText: string;
  /** 헤더 오른쪽 (예: "금요일", "금요일 · 오늘") */
  dayText: string;
  trackName: string;
  artist: string;
  albumArt: string | null;
  previewUrl: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** 무드 색. 있으면 그 색으로 테두리·글로우가 빛난다. 없으면 평범한 그림자만 쓴다. */
  glowColor?: string | null;
  /** false 이면 재생 버튼이 탭 순서에서 빠진다 (가운데가 아닌 캐러셀 포스터). */
  focusable?: boolean;
  /** 곡 정보 아래에 끼울 내용 (예: 무드 칩). */
  footer?: ReactNode;
  /** 크기·배치는 쓰는 쪽이 정한다. */
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
  "aria-hidden"?: boolean;
};

const PLAIN_SHADOW = "0 24px 60px rgba(8,6,16,.55)";

function glowShadow(color: string) {
  return `0 30px 80px rgba(8,6,16,.65), 0 0 0 1px color-mix(in srgb, ${color} 55%, transparent), 0 0 60px color-mix(in srgb, ${color} 28%, transparent)`;
}

/**
 * 음악 기록 한 건의 포스터 카드 본체. 홈의 주간 캐러셀(`PosterCard`)과 `/record` 의 미리보기가 같이 쓴다.
 * 위치·크기·전환은 쓰는 쪽이 `className`/`style` 로 정한다.
 */
export function PosterFace({
  dateText,
  dayText,
  trackName,
  artist,
  albumArt,
  previewUrl,
  isPlaying,
  onTogglePlay,
  glowColor = null,
  focusable = true,
  footer,
  className,
  style,
  onClick,
  "aria-hidden": ariaHidden,
}: PosterFaceProps) {
  return (
    <div
      aria-hidden={ariaHidden}
      onClick={onClick}
      style={{ ...style, boxShadow: glowColor ? glowShadow(glowColor) : PLAIN_SHADOW }}
      className={cn(
        "flex flex-col gap-3 rounded-[22px] border border-border bg-surface p-3.5 text-left",
        className,
      )}
    >
      <div className="flex items-baseline justify-between px-0.5">
        <span className="font-mono text-[13px] tracking-wide text-ink">{dateText}</span>
        <span className="text-xs text-ink-dim">{dayText}</span>
      </div>

      <div className="relative">
        <AlbumArt src={albumArt} size={250} radius={14} />
        <button
          type="button"
          tabIndex={focusable ? 0 : -1}
          disabled={!previewUrl}
          aria-label={`${trackName} ${isPlaying ? "정지" : "미리듣기"}`}
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
        <p className="truncate text-base font-semibold tracking-tight text-ink">{trackName}</p>
        <p className="truncate text-[13px] text-ink-dim">{artist}</p>
      </div>

      {footer}
    </div>
  );
}
