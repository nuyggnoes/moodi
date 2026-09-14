"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import {
  getRecentSearches,
  addRecentSearch,
  subscribeRecentSearches,
} from "@/shared/lib/recentSearches";
import { useMusicSearch } from "@/features/search/useMusicSearch";
import { RecentSearches } from "@/shared/ui/RecentSearches";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PlayIcon, PauseIcon } from "@/shared/ui/icons";
import type { Track } from "@/shared/lib/music/types";

const DEBOUNCE_MS = 400;
const NO_RECENT_SEARCHES: string[] = [];

export function SongPicker({ onSelect }: { onSelect: (track: Track) => void }) {
  const [input, setInput] = useState("");
  const debouncedQuery = useDebouncedValue(input, DEBOUNCE_MS);
  const { data, isFetching, isError } = useMusicSearch(debouncedQuery);
  const recentQueries = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearches,
    () => NO_RECENT_SEARCHES,
  );

  const hasQuery = debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (hasQuery && !isFetching && !isError && data && data.length > 0) {
      addRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery, hasQuery, isFetching, isError, data]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  function togglePreview(track: Track) {
    const audio = audioRef.current;
    if (!audio || !track.previewUrl) return;

    if (playingId === track.trackId) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = track.previewUrl;
    audio.play();
    setPlayingId(track.trackId);
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="곡명이나 아티스트를 검색해보세요"
        aria-label="음악 검색"
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />

      {!hasQuery &&
        (recentQueries.length > 0 ? (
          <RecentSearches queries={recentQueries} onSelect={setInput} />
        ) : (
          <p className="text-sm text-ink-faint">기록할 곡을 검색해보세요.</p>
        ))}

      {hasQuery && isFetching && (
        <p className="text-sm text-ink-faint">검색 중...</p>
      )}

      {hasQuery && !isFetching && isError && (
        <p className="text-sm text-error">
          검색에 실패했어요. 잠시 후 다시 시도해주세요.
        </p>
      )}

      {hasQuery && !isFetching && !isError && data?.length === 0 && (
        <p className="text-sm text-ink-faint">검색 결과가 없어요.</p>
      )}

      {hasQuery && !isFetching && !isError && data && data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.map((track) => {
            const isPlaying = playingId === track.trackId;

            return (
              <li
                key={track.trackId}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-hover"
              >
                <AlbumArt src={track.albumArt} size={64} radius={10} />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-[13.5px] font-medium text-ink">
                    {track.trackName}
                  </span>
                  <span className="truncate text-[11.5px] text-ink-dim">
                    {track.artist}
                  </span>
                </div>
                {track.previewUrl && (
                  <button
                    type="button"
                    onClick={() => togglePreview(track)}
                    aria-label={`${track.trackName} ${isPlaying ? "정지" : "재생"}`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isPlaying
                        ? "bg-accent text-bg"
                        : "border border-border bg-surface text-ink-dim"
                    }`}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(track)}
                  className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-sm text-bg"
                >
                  선택
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  );
}
