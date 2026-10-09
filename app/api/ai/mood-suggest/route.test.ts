/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "./route";
import { createClient } from "@/shared/lib/supabase/server";
import { moodSuggester } from "@/shared/lib/ai";

jest.mock("@/shared/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/shared/lib/ai", () => ({
  moodSuggester: { suggest: jest.fn() },
}));

const mockedCreateClient = createClient as jest.Mock;
const mockedSuggest = moodSuggester.suggest as jest.Mock;

function mockUser(user: { id: string } | null) {
  mockedCreateClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user } }) },
  });
}

function post(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ai/mood-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  memo: "퇴근길에 들으니 마음이 차분해졌다",
  trackName: "Next Level",
  artist: "aespa",
};

beforeEach(() => {
  mockUser({ id: "user-1" });
});

afterEach(() => {
  mockedCreateClient.mockReset();
  mockedSuggest.mockReset();
});

describe("POST /api/ai/mood-suggest", () => {
  it("returns the suggestion and passes the allowed moods to the suggester", async () => {
    mockedSuggest.mockResolvedValue({
      success: true,
      suggestedMood: "calm",
      reason: "잔잔한 퇴근길 분위기예요",
    });

    const response = await POST(post(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      suggestedMood: "calm",
      reason: "잔잔한 퇴근길 분위기예요",
    });
    expect(mockedSuggest).toHaveBeenCalledWith({
      ...validBody,
      moods: ["exciting", "calm", "energetic", "sad", "focused"],
    });
  });

  it("returns 401 without calling the suggester when not logged in", async () => {
    mockUser(null);

    const response = await POST(post(validBody));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("unauthorized");
    expect(mockedSuggest).not.toHaveBeenCalled();
  });

  it.each([
    ["memo shorter than 5 chars", { ...validBody, memo: "짧아요" }],
    ["memo longer than 200 chars", { ...validBody, memo: "가".repeat(201) }],
    ["missing trackName", { ...validBody, trackName: "" }],
    ["missing artist", { ...validBody, artist: undefined }],
    ["non-string memo", { ...validBody, memo: 12345 }],
  ])("returns 400 for %s", async (_label, payload) => {
    const response = await POST(post(payload));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_input");
    expect(mockedSuggest).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const response = await POST(post("{not json"));

    expect(response.status).toBe(400);
    expect(mockedSuggest).not.toHaveBeenCalled();
  });

  it("returns 502 when the suggester fails", async () => {
    mockedSuggest.mockResolvedValue({ success: false, error: "timeout" });

    const response = await POST(post(validBody));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe("upstream_error");
  });
});
