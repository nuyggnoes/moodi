/** @jest-environment node */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/database.types";
import type { CommentGenerator } from "@/shared/lib/ai";
import { SENSITIVE_COMMENT_TEXT } from "@/entities/record/comment";
import { generateDailyComment } from "./generateDailyComment";

type RecordRow = Database["public"]["Tables"]["records"]["Row"];

const USER_ID = "user-1";
const RECORD_ID = "11111111-1111-1111-1111-111111111111";

function makeRecord(overrides: Partial<RecordRow> = {}): RecordRow {
  return {
    id: RECORD_ID,
    user_id: USER_ID,
    track_id: "1",
    track_name: "Next Level",
    artist: "aespa",
    album_art: null,
    preview_url: null,
    mood: "calm",
    mood_source: "user",
    memo: "퇴근길에 비가 와서 마음이 좀 풀렸다",
    ai_comment: null,
    created_at: "2026-10-09T09:00:00Z",
    ...overrides,
  };
}

/** `from("records")` 의 조회·갱신 체인을 흉내 낸 가짜 Supabase 클라이언트. */
function fakeSupabase(options: {
  record: RecordRow | null;
  selectError?: boolean;
  updateError?: boolean;
}) {
  const updateEqs: [string, unknown][] = [];
  const update = jest.fn((values: object) => {
    const chain = {
      eq: (column: string, value: unknown) => {
        updateEqs.push([column, value]);
        return updateEqs.length >= 2
          ? Promise.resolve({ error: options.updateError ? { message: "db" } : null })
          : chain;
      },
    };
    void values;
    return chain;
  });

  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: options.record,
            error: options.selectError ? { message: "db" } : null,
          }),
        }),
      }),
      update,
    }),
  };

  return { client: client as unknown as SupabaseClient<Database>, update, updateEqs };
}

function fakeGenerator(result: Awaited<ReturnType<CommentGenerator["generate"]>>) {
  const generate = jest.fn().mockResolvedValue(result);
  return { generator: { generate } as CommentGenerator, generate };
}

describe("generateDailyComment", () => {
  it("generates, saves, and returns the comment for the owner's record", async () => {
    const { client, update, updateEqs } = fakeSupabase({ record: makeRecord() });
    const { generator, generate } = fakeGenerator({
      success: true,
      comment: "비 오는 퇴근길에 마음이 풀리던 하루예요",
      sensitive: false,
    });

    const result = await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID);

    expect(result).toEqual({
      success: true,
      comment: "비 오는 퇴근길에 마음이 풀리던 하루예요",
    });
    expect(generate).toHaveBeenCalledWith({
      memo: "퇴근길에 비가 와서 마음이 좀 풀렸다",
      trackName: "Next Level",
      artist: "aespa",
      moodLabel: "차분한",
    });
    expect(update).toHaveBeenCalledWith({
      ai_comment: "비 오는 퇴근길에 마음이 풀리던 하루예요",
    });
    expect(updateEqs).toEqual([
      ["id", RECORD_ID],
      ["user_id", USER_ID],
    ]);
  });

  it("stores the fixed phrase instead of the model text when the memo is sensitive", async () => {
    const { client, update } = fakeSupabase({ record: makeRecord() });
    const { generator } = fakeGenerator({
      success: true,
      comment: "모델이 쓴 문장",
      sensitive: true,
    });

    const result = await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID);

    expect(result).toEqual({ success: true, comment: SENSITIVE_COMMENT_TEXT });
    expect(update).toHaveBeenCalledWith({ ai_comment: SENSITIVE_COMMENT_TEXT });
  });

  it("treats someone else's record as not found without calling the model", async () => {
    const { client, update } = fakeSupabase({ record: makeRecord({ user_id: "someone-else" }) });
    const { generator, generate } = fakeGenerator({ success: true, comment: "x", sensitive: false });

    const result = await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID);

    expect(result).toEqual({ success: false, error: "not_found" });
    expect(generate).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("returns not_found when the record does not exist", async () => {
    const { client } = fakeSupabase({ record: null });
    const { generator } = fakeGenerator({ success: true, comment: "x", sensitive: false });

    expect(await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID)).toEqual({
      success: false,
      error: "not_found",
    });
  });

  it("returns the existing comment without regenerating", async () => {
    const { client, update } = fakeSupabase({ record: makeRecord({ ai_comment: "이미 있는 코멘트" }) });
    const { generator, generate } = fakeGenerator({ success: true, comment: "x", sensitive: false });

    const result = await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID);

    expect(result).toEqual({ success: true, comment: "이미 있는 코멘트" });
    expect(generate).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ["no memo", null],
    ["a blank memo", "   "],
    ["a memo shorter than 5 characters", "짧아요"],
  ])("returns no_memo for %s without calling the model", async (_label, memo) => {
    const { client } = fakeSupabase({ record: makeRecord({ memo }) });
    const { generator, generate } = fakeGenerator({ success: true, comment: "x", sensitive: false });

    expect(await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID)).toEqual({
      success: false,
      error: "no_memo",
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns upstream with the cause and does not save when generation fails", async () => {
    const { client, update } = fakeSupabase({ record: makeRecord() });
    const { generator } = fakeGenerator({ success: false, error: "timeout" });

    const result = await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID);

    expect(result).toEqual({ success: false, error: "upstream", cause: "timeout" });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns upstream when the record lookup fails", async () => {
    const { client } = fakeSupabase({ record: null, selectError: true });
    const { generator } = fakeGenerator({ success: true, comment: "x", sensitive: false });

    expect(await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID)).toEqual({
      success: false,
      error: "upstream",
      cause: "db_error",
    });
  });

  it("returns upstream when saving the comment fails", async () => {
    const { client } = fakeSupabase({ record: makeRecord(), updateError: true });
    const { generator } = fakeGenerator({ success: true, comment: "코멘트예요", sensitive: false });

    expect(await generateDailyComment({ supabase: client, generator }, USER_ID, RECORD_ID)).toEqual({
      success: false,
      error: "upstream",
      cause: "db_error",
    });
  });
});
