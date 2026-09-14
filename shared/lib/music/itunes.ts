import type { MusicProvider, MusicSearchOptions, Track } from "./types";

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const DEFAULT_LIMIT = 25;
// iTunes Search API는 country=KR + entity=song 조합에서 결과를 전혀 반환하지 않는다
// (실측 확인: aespa/BTS/NewJeans 등 모두 0건 — 한국 스토어에 곡 카탈로그가 없는 것으로 보임).
// US는 정상 동작하고 K-pop 아티스트도 카탈로그에 있어 기본값으로 사용한다.
const DEFAULT_COUNTRY = "US";
const CACHE_TTL_SECONDS = 60;

type ItunesRawResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
};

type ItunesSearchResponse = {
  resultCount: number;
  results: ItunesRawResult[];
};

/** iTunes의 100x100 아트워크 URL을 600x600 고해상도로 치환한다. */
function toHighResArtwork(artworkUrl100: string | undefined): string | null {
  if (!artworkUrl100) return null;
  return artworkUrl100.replace("100x100bb", "600x600bb");
}

function mapResult(result: ItunesRawResult): Track {
  return {
    trackId: result.trackId,
    trackName: result.trackName,
    artist: result.artistName,
    albumArt: toHighResArtwork(result.artworkUrl100),
    previewUrl: result.previewUrl ?? null,
    collectionName: result.collectionName,
  };
}

export const itunesProvider: MusicProvider = {
  async search(query: string, opts: MusicSearchOptions = {}): Promise<Track[]> {
    const params = new URLSearchParams({
      term: query,
      entity: "song",
      limit: String(opts.limit ?? DEFAULT_LIMIT),
      country: opts.country ?? DEFAULT_COUNTRY,
    });

    const response = await fetch(`${ITUNES_SEARCH_URL}?${params.toString()}`, {
      next: { revalidate: CACHE_TTL_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`iTunes Search API error: ${response.status}`);
    }

    const data: ItunesSearchResponse = await response.json();
    return data.results.map(mapResult);
  },
};
