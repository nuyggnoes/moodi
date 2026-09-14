/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "./route";
import { itunesProvider } from "@/shared/lib/music/itunes";

jest.mock("@/shared/lib/music/itunes", () => ({
  itunesProvider: { search: jest.fn() },
}));

const mockedSearch = itunesProvider.search as jest.Mock;

afterEach(() => {
  mockedSearch.mockReset();
});

describe("GET /api/music/search", () => {
  it("returns results for a query", async () => {
    mockedSearch.mockResolvedValue([
      {
        trackId: 1,
        trackName: "Next Level",
        artist: "aespa",
        albumArt: "https://example.com/600x600bb.jpg",
        previewUrl: "https://example.com/preview.m4a",
      },
    ]);

    const request = new NextRequest(
      "http://localhost:3000/api/music/search?q=aespa",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(mockedSearch).toHaveBeenCalledWith("aespa");
  });

  it("returns an empty array without calling the provider when q is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/music/search");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ results: [] });
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("returns 502 when the provider throws", async () => {
    mockedSearch.mockRejectedValue(new Error("network error"));

    const request = new NextRequest(
      "http://localhost:3000/api/music/search?q=aespa",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("upstream_error");
  });
});
