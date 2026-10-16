"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { useElementWidth } from "@/shared/lib/useElementWidth";
import { MOOD_COLORS } from "@/entities/record/mood";
import { DateStrip } from "./DateStrip";
import { PosterCard } from "./PosterCard";
import { getPosterTransform, swipeTarget } from "./posterLayout";
import type { WeekDay } from "./weekDays";

type WeekCarouselProps = {
  /** 오래된 날 → 오늘 순서의 7칸 (`groupRecordsByKstDay`) */
  days: WeekDay[];
  /** 가운데 포스터의 인덱스. 초기값은 부모가 오늘(마지막 칸)로 정한다. */
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const DEFAULT_STAGE_WIDTH = 980;
const DRAG_CLICK_GUARD_PX = 6;
const DEFAULT_BLEED = "#baa7e0";

/**
 * 최근 7일 코버플로 캐러셀: 가운데 포스터를 크게, 양옆은 기울여 보여준다.
 * 이동은 ←/→(캐러셀에 포커스가 있을 때), 이전/다음 버튼, 드래그, 옆 포스터 클릭, 날짜 스트립. 자동 회전은 없다.
 * 선택은 부모가 들고 있다(제어 컴포넌트). 미리듣기는 한 번에 하나만 재생하고, 선택이 바뀌면 멈춘다.
 */
export function WeekCarousel({ days, selectedIndex, onSelect }: WeekCarouselProps) {
  const [stageRef, stageWidth] = useElementWidth(DEFAULT_STAGE_WIDTH);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const lastIndex = days.length - 1;
  const selectedRecord = days[selectedIndex]?.record ?? null;
  const bleed = selectedRecord ? MOOD_COLORS[selectedRecord.mood] : DEFAULT_BLEED;

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  function stopPlayback() {
    audioRef.current?.pause();
    setPlayingId(null);
  }

  function select(index: number) {
    const next = Math.max(0, Math.min(lastIndex, index));
    if (next === selectedIndex) return;
    stopPlayback();
    onSelect(next);
  }

  function togglePlay(day: WeekDay) {
    const audio = audioRef.current;
    const record = day.record;
    if (!audio || !record?.preview_url) return;

    if (playingId === record.id) {
      stopPlayback();
      return;
    }

    audio.src = record.preview_url;
    setPlayingId(record.id);
    audio.play().catch(() => setPlayingId(null));
  }

  function handleKeyDown(event: KeyboardEvent) {
    const target: Record<string, number> = {
      ArrowLeft: selectedIndex - 1,
      ArrowRight: selectedIndex + 1,
      Home: 0,
      End: lastIndex,
    };
    if (!(event.key in target)) return;
    event.preventDefault();
    select(target[event.key]);
  }

  function handlePointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("[data-carousel-arrow]")) return;

    dragRef.current = { startX: event.clientX, moved: false };

    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (drag && Math.abs(e.clientX - drag.startX) > DRAG_CLICK_GUARD_PX) drag.moved = true;
    }
    function onUp(e: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;

      if (drag.moved) {
        // 드래그 직후에 이어지는 click 이 포스터 선택·이동으로 번지지 않게 막는다.
        suppressClickRef.current = true;
        setTimeout(() => (suppressClickRef.current = false), 0);
      }
      select(swipeTarget(e.clientX - drag.startX, selectedIndex, lastIndex));
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function handleClickCapture(event: React.MouseEvent) {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        aria-hidden="true"
        className="mood-bleed"
        style={{ "--bleed": bleed } as CSSProperties}
      />

      <section
        ref={stageRef}
        aria-roledescription="carousel"
        aria-label="최근 7일의 음악 기록"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
        className="relative h-[480px] w-full max-w-[980px] cursor-grab touch-pan-y select-none [perspective:1500px] focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
      >
        {days.map((day, index) => {
          const t = getPosterTransform(index - selectedIndex, stageWidth);
          return (
            <PosterCard
              key={day.dateKey}
              day={day}
              isCenter={index === selectedIndex}
              onBringToCenter={() => select(index)}
              isPlaying={day.record !== null && playingId === day.record.id}
              onTogglePlay={() => togglePlay(day)}
              style={{
                transform: `translateX(${t.x}px) translateZ(${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale})`,
                opacity: t.opacity,
                zIndex: t.zIndex,
                pointerEvents: t.visible ? "auto" : "none",
              }}
            />
          );
        })}

        <button
          type="button"
          data-carousel-arrow
          aria-label="이전 날"
          disabled={selectedIndex === 0}
          onClick={() => select(selectedIndex - 1)}
          className="absolute left-1 top-1/2 z-30 -mt-[22px] grid h-11 w-11 place-items-center rounded-full border border-border bg-surface/80 text-ink hover:bg-surface-hover disabled:cursor-default disabled:opacity-30"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          data-carousel-arrow
          aria-label="다음 날"
          disabled={selectedIndex === lastIndex}
          onClick={() => select(selectedIndex + 1)}
          className="absolute right-1 top-1/2 z-30 -mt-[22px] grid h-11 w-11 place-items-center rounded-full border border-border bg-surface/80 text-ink hover:bg-surface-hover disabled:cursor-default disabled:opacity-30"
        >
          <ChevronRightIcon />
        </button>
      </section>

      <DateStrip days={days} selectedIndex={selectedIndex} onSelect={select} />

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  );
}
