"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MOOD_SUGGEST_MIN_MEMO_LENGTH } from "@/entities/record/memo";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import type { Track } from "@/shared/lib/music/types";
import { fetchMoodSuggestion } from "./suggestMood";

// 고민하며 쓰느라 잠깐 멈추는 경우를 걸러내되, 입력을 끝낸 뒤 응답까지 2초 안팎에 끝나는 값.
const DEBOUNCE_MS = 1200;

/**
 * 곡이 선택돼 있고 메모가 충분히 길 때(디바운스 후)만 AI 무드를 제안받는다.
 * `active` 가 false 면(사용자가 이미 직접 골랐을 때) 요청하지 않는다.
 * 실패는 조용히 무시한다 — `data` 가 없을 뿐 에러 UI 는 없고 사용자가 직접 고른다.
 * 새 응답을 기다리는 동안에는 직전 제안을 유지해 선택이 깜빡이지 않게 한다.
 */
export function useMoodSuggestion(
  track: Track | null,
  memo: string,
  active: boolean,
) {
  const debouncedMemo = useDebouncedValue(memo.trim(), DEBOUNCE_MS);
  const enabled =
    active &&
    track !== null &&
    debouncedMemo.length >= MOOD_SUGGEST_MIN_MEMO_LENGTH;

  return useQuery({
    queryKey: ["mood-suggest", track?.trackId, debouncedMemo],
    queryFn: ({ signal }) =>
      fetchMoodSuggestion(
        {
          memo: debouncedMemo,
          trackName: track!.trackName,
          artist: track!.artist,
        },
        signal,
      ),
    enabled,
    retry: false,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}
