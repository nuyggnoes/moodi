import { requestDailyComment } from "./requestDailyComment";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetch(body: unknown, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({ ok, json: async () => body });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("requestDailyComment", () => {
  it("POSTs the record id and returns the comment", async () => {
    const fetchMock = mockFetch({ comment: "코멘트예요" });

    await expect(requestDailyComment("rec-1")).resolves.toBe("코멘트예요");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/daily-comment",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ recordId: "rec-1" }) }),
    );
  });

  it("throws on a non-2xx response", async () => {
    mockFetch({ error: "upstream_error" }, false);

    await expect(requestDailyComment("rec-1")).rejects.toThrow("daily_comment_failed");
  });

  it("throws when the comment is not a string", async () => {
    mockFetch({ comment: 1 });

    await expect(requestDailyComment("rec-1")).rejects.toThrow("daily_comment_invalid");
  });
});
