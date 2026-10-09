import { fetchMoodSuggestion } from "./suggestMood";

const originalFetch = global.fetch;
const request = { memo: "퇴근길에 들으니 차분해졌다", trackName: "a", artist: "b" };

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetch(body: unknown, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({ ok, json: async () => body });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("fetchMoodSuggestion", () => {
  it("POSTs the request as JSON and returns the suggestion", async () => {
    const fetchMock = mockFetch({ suggestedMood: "calm", reason: "차분해요" });

    await expect(fetchMoodSuggestion(request)).resolves.toEqual({
      suggestedMood: "calm",
      reason: "차분해요",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/mood-suggest",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(request),
      }),
    );
  });

  it("throws on a non-2xx response", async () => {
    mockFetch({ error: "upstream_error" }, false);

    await expect(fetchMoodSuggestion(request)).rejects.toThrow(
      "mood_suggest_failed",
    );
  });

  it.each([
    ["an unknown mood", { suggestedMood: "angry", reason: "x" }],
    ["a missing reason", { suggestedMood: "calm" }],
    ["a non-string mood", { suggestedMood: 1, reason: "x" }],
  ])("throws on %s", async (_label, body) => {
    mockFetch(body);

    await expect(fetchMoodSuggestion(request)).rejects.toThrow(
      "mood_suggest_invalid",
    );
  });

  it("passes the abort signal to fetch", async () => {
    const fetchMock = mockFetch({ suggestedMood: "calm", reason: "차분해요" });
    const controller = new AbortController();

    await fetchMoodSuggestion(request, controller.signal);

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
