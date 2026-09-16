"use client";

import { useState, type RefObject } from "react";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PlayIcon, PauseIcon } from "@/shared/ui/icons";
import { MOOD_COLORS, MOOD_OPTIONS } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";

const MOOD_LABELS = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

type TodayRecordCardProps = {
  record: MusicRecord;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
};

/**
 * 오늘 기록 카드 — 앨범아트 색감이 배경에 번지는 탭-투-플레이 미니플레이어.
 * 무드태그는 항상 보이고, memo/AI 코멘트는 무드태그를 탭해야 펼쳐지는 별도 레이어다.
 */
export function TodayRecordCard({
  record,
  audioRef,
  isPlaying,
  onPlayingChange,
}: TodayRecordCardProps) {
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const moodLabel = MOOD_LABELS[record.mood] ?? record.mood;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !record.preview_url) return;

    if (isPlaying) {
      audio.pause();
      onPlayingChange(false);
      return;
    }

    audio.src = record.preview_url;
    audio.play();
    onPlayingChange(true);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border">
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-125"
        style={{
          background: record.album_art
            ? `url(${record.album_art}) center / cover`
            : `linear-gradient(150deg, color-mix(in srgb, var(--color-accent) 35%, var(--color-surface)), var(--color-border))`,
          filter: "blur(48px) saturate(1.3)",
          opacity: 0.55,
        }}
      />
      <div className="absolute inset-0 bg-bg/50" aria-hidden="true" />

      <div className="relative flex flex-col gap-4 p-5">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!record.preview_url}
          aria-label={`${record.track_name} ${isPlaying ? "정지" : "재생"}`}
          className="group relative self-start disabled:cursor-not-allowed"
        >
          <AlbumArt src={record.album_art} size={104} radius={18} />
          {record.preview_url && (
            <span className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-black/30 text-ink opacity-0 transition-opacity group-hover:opacity-100">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </span>
          )}
        </button>

        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-semibold text-ink">{record.track_name}</span>
          <span className="text-sm text-ink-dim">{record.artist}</span>
        </div>

        <div className="relative self-start">
          <button
            type="button"
            onClick={() => setIsMoodOpen((open) => !open)}
            aria-expanded={isMoodOpen}
            className="relative z-30 rounded-full px-4 py-1.5 text-sm text-bg"
            style={{ background: MOOD_COLORS[record.mood] }}
          >
            {moodLabel}
          </button>

          {isMoodOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMoodOpen(false)}
                aria-hidden="true"
              />
              <div className="relative z-20 mt-2 flex w-64 flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5">
                {record.memo && <p className="text-sm text-ink-dim">{record.memo}</p>}
                <div className="rounded-xl border border-dashed border-border p-2 text-xs text-ink-faint">
                  {record.ai_comment ?? "AI 코멘트는 아직 준비 중이에요."}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
