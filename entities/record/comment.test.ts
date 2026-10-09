import {
  COMMENT_GENERATING_WINDOW_MS,
  getCommentState,
  hasGeneratingComment,
} from "./comment";

const CREATED = "2026-10-09T09:00:00Z";
const createdMs = new Date(CREATED).getTime();

function rec(overrides: { memo?: string | null; ai_comment?: string | null } = {}) {
  return { memo: "퇴근길에 마음이 풀렸다", ai_comment: null, created_at: CREATED, ...overrides };
}

describe("getCommentState", () => {
  it("is ready when a comment exists, even without a memo", () => {
    expect(getCommentState(rec({ ai_comment: "코멘트예요", memo: null }), createdMs)).toBe("ready");
  });

  it.each([
    ["no memo", null],
    ["a blank memo", "    "],
    ["a memo shorter than 5 characters", "짧아요"],
  ])("is none for %s", (_label, memo) => {
    expect(getCommentState(rec({ memo }), createdMs + 1_000)).toBe("none");
  });

  it("is generating right after saving", () => {
    expect(getCommentState(rec(), createdMs + 1_000)).toBe("generating");
  });

  it("is generating just before the window ends and failed exactly at the boundary", () => {
    expect(getCommentState(rec(), createdMs + COMMENT_GENERATING_WINDOW_MS - 1)).toBe("generating");
    expect(getCommentState(rec(), createdMs + COMMENT_GENERATING_WINDOW_MS)).toBe("failed");
  });

  it("is failed for an old record that never got a comment", () => {
    expect(getCommentState(rec(), createdMs + 30 * 24 * 60 * 60 * 1000)).toBe("failed");
  });
});

describe("hasGeneratingComment", () => {
  it("is true when any record is still generating", () => {
    const now = createdMs + 5_000;
    expect(hasGeneratingComment([rec({ ai_comment: "있음" }), rec()], now)).toBe(true);
  });

  it("is false when none are generating", () => {
    const now = createdMs + COMMENT_GENERATING_WINDOW_MS + 1;
    expect(hasGeneratingComment([rec(), rec({ memo: null })], now)).toBe(false);
    expect(hasGeneratingComment([], now)).toBe(false);
  });
});
