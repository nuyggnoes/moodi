import { searchTracks } from "./searchTracks";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("searchTracks", () => {
  it("returns results and URL-encodes the query", async () => {
    mockFetchOnce({ results: [{ trackId: 1 }] });

    const results = await searchTracks("aespa 케릭터");

    expect(results).toEqual([{ trackId: 1 }]);
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/music/search?q=${encodeURIComponent("aespa 케릭터")}`,
    );
  });

  it("throws when the response has an error field", async () => {
    mockFetchOnce({ results: [], error: "upstream_error" }, false);

    await expect(searchTracks("aespa")).rejects.toThrow("upstream_error");
  });
});
