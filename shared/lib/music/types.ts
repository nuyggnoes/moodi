export type Track = {
  trackId: number;
  trackName: string;
  artist: string;
  albumArt: string | null;
  previewUrl: string | null;
  collectionName?: string;
};

export type MusicSearchOptions = {
  limit?: number;
  country?: string;
};

export interface MusicProvider {
  search(query: string, opts?: MusicSearchOptions): Promise<Track[]>;
}
