"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import {
  getRecentSearches,
  addRecentSearch,
  subscribeRecentSearches,
} from "@/shared/lib/recentSearches";
import { useMusicSearch } from "./useMusicSearch";
import { TrackList } from "./TrackList";
import { RecentSearches } from "@/shared/ui/RecentSearches";

const DEBOUNCE_MS = 400;
const NO_RECENT_SEARCHES: string[] = [];

export function MusicSearch() {
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
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
          <p className="text-sm text-ink-faint">
            좋아하는 곡이나 아티스트를 검색해보세요.
          </p>
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
        <TrackList tracks={data} />
      )}
    </div>
  );
}
