"use client";

import { useQuery } from "@tanstack/react-query";
import { searchTracks } from "./searchTracks";

export function useMusicSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["music-search", trimmed],
    queryFn: () => searchTracks(trimmed),
    enabled: trimmed.length > 0,
    retry: false,
  });
}
