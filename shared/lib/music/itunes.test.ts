import { itunesProvider } from "./itunes";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("itunesProvider.search", () => {
  it("maps iTunes results to normalized tracks", async () => {
    mockFetchOnce({
      resultCount: 1,
      results: [
        {
          trackId: 123,
          trackName: "Next Level",
          artistName: "aespa",
          collectionName: "Next Level - The 1st Mini Album",
          artworkUrl100:
            "https://example.com/artwork/100x100bb.jpg",
          previewUrl: "https://example.com/preview.m4a",
        },
      ],
    });

    const tracks = await itunesProvider.search("aespa");

    expect(tracks).toEqual([
      {
        trackId: 123,
        trackName: "Next Level",
        artist: "aespa",
        albumArt: "https://example.com/artwork/600x600bb.jpg",
        previewUrl: "https://example.com/preview.m4a",
        collectionName: "Next Level - The 1st Mini Album",
      },
    ]);
  });

  it("returns null albumArt/previewUrl when missing", async () => {
    mockFetchOnce({
      resultCount: 1,
      results: [
        { trackId: 1, trackName: "T", artistName: "A" },
      ],
    });

    const [track] = await itunesProvider.search("query");

    expect(track.albumArt).toBeNull();
    expect(track.previewUrl).toBeNull();
  });

  it("returns an empty array when iTunes has no matches", async () => {
    mockFetchOnce({ resultCount: 0, results: [] });

    const tracks = await itunesProvider.search("asdkjaslkdj");

    expect(tracks).toEqual([]);
  });

  it("throws when iTunes responds with a non-ok status", async () => {
    mockFetchOnce({}, false, 503);

    await expect(itunesProvider.search("aespa")).rejects.toThrow(
      "iTunes Search API error: 503",
    );
  });
});
