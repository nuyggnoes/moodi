/** @jest-environment node */
import { saveRecord } from "./actions";
import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { generateDailyComment } from "@/features/comment/generateDailyComment";

jest.mock("@/shared/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
jest.mock("@/shared/lib/ai", () => ({ commentGenerator: { generate: jest.fn() } }));
jest.mock("@/features/comment/generateDailyComment", () => ({
  generateDailyComment: jest.fn(),
}));

const mockedCreateClient = createClient as jest.Mock;
const mockedRedirect = redirect as unknown as jest.Mock;
const mockedAfter = after as unknown as jest.Mock;
const mockedGenerate = generateDailyComment as jest.Mock;
const upsert = jest.fn();
const single = jest.fn();

function mockClient() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    // upsert(...).select("id").single() 체인
    from: () => ({ upsert: upsert.mockReturnValue({ select: () => ({ single }) }) }),
  };
}

beforeEach(() => {
  single.mockResolvedValue({ data: { id: "rec-1" }, error: null });
  mockedCreateClient.mockResolvedValue(mockClient());
});

afterEach(() => {
  upsert.mockReset();
  single.mockReset();
  mockedCreateClient.mockReset();
  mockedRedirect.mockReset();
  mockedAfter.mockReset();
  mockedGenerate.mockReset();
  jest.restoreAllMocks();
});

function formWith(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields: Record<string, string> = {
    trackId: "1",
    trackName: "Next Level",
    artist: "aespa",
    mood: "calm",
    memo: "차분했다",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("saveRecord mood_source", () => {
  it('stores "ai" when the form says the mood came from the AI suggestion', async () => {
    await saveRecord(null, formWith({ moodSource: "ai" }));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ mood: "calm", mood_source: "ai" }),
      expect.anything(),
    );
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it('stores "user" for a manual pick', async () => {
    await saveRecord(null, formWith({ moodSource: "user" }));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ mood_source: "user" }),
      expect.anything(),
    );
  });

  it.each([
    ["missing", {}],
    ["an unknown value", { moodSource: "robot" }],
  ])('falls back to "user" when moodSource is %s', async (_label, extra) => {
    await saveRecord(null, formWith(extra));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ mood_source: "user" }),
      expect.anything(),
    );
  });
});

describe("saveRecord validation", () => {
  it("rejects an invalid mood without saving", async () => {
    const result = await saveRecord(null, formWith({ mood: "angry" }));

    expect(result).toEqual({ error: "mood_required" });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a missing track without saving", async () => {
    const result = await saveRecord(null, formWith({ trackName: "" }));

    expect(result).toEqual({ error: "track_required" });
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("saveRecord AI comment trigger", () => {
  it("schedules comment generation after the response when the memo is long enough", async () => {
    mockedGenerate.mockResolvedValue({ success: true, comment: "코멘트예요" });

    await saveRecord(null, formWith({ memo: "퇴근길에 마음이 풀렸다" }));

    expect(mockedAfter).toHaveBeenCalledTimes(1);
    // 저장 응답을 막지 않도록 insert 직후에는 아직 생성하지 않는다.
    expect(mockedGenerate).not.toHaveBeenCalled();
    expect(mockedRedirect).toHaveBeenCalledWith("/");

    await mockedAfter.mock.calls[0][0]();

    expect(mockedGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ generator: expect.anything() }),
      "user-1",
      "rec-1",
    );
  });

  it.each([
    ["no memo", { memo: "" }],
    ["a memo shorter than 5 characters", { memo: "짧아요" }],
  ])("does not schedule generation for %s", async (_label, extra) => {
    await saveRecord(null, formWith(extra));

    expect(mockedAfter).not.toHaveBeenCalled();
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("does not schedule generation when saving the record fails", async () => {
    single.mockResolvedValue({ data: null, error: { message: "db" } });

    const result = await saveRecord(null, formWith({ memo: "퇴근길에 마음이 풀렸다" }));

    expect(result).toEqual({ error: "unknown" });
    expect(mockedAfter).not.toHaveBeenCalled();
  });

  it("logs only the record id and cause when generation fails, never the memo", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedGenerate.mockResolvedValue({ success: false, error: "upstream", cause: "timeout" });

    await saveRecord(null, formWith({ memo: "퇴근길에 마음이 풀렸다" }));
    await mockedAfter.mock.calls[0][0]();

    expect(errorSpy).toHaveBeenCalledWith("daily-comment failed", {
      recordId: "rec-1",
      error: "upstream",
      cause: "timeout",
    });
  });
});

describe("saveRecord one-record-per-day replacement", () => {
  it("upserts on (user, KST date), clearing the old comment and refreshing created_at", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-16T01:00:00Z"));

    await saveRecord(null, formWith({ moodSource: "user" }));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        ai_comment: null,
        created_at: "2026-10-16T01:00:00.000Z",
        mood_source: "user",
      }),
      { onConflict: "user_id,record_date" },
    );
    jest.useRealTimers();
  });

  it("does not schedule comment generation when the replacement has no memo", async () => {
    await saveRecord(null, formWith({ memo: "" }));

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ memo: null, ai_comment: null }),
      expect.anything(),
    );
    expect(mockedAfter).not.toHaveBeenCalled();
  });
});
