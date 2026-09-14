import type { Track } from "@/shared/lib/music/types";

type SearchResponse = { results: Track[]; error?: string };

export async function searchTracks(query: string): Promise<Track[]> {
  const response = await fetch(
    `/api/music/search?q=${encodeURIComponent(query)}`,
  );
  const data: SearchResponse = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error ?? "search_failed");
  }

  return data.results;
}
