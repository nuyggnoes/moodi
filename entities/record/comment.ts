import type { MusicRecord } from "./types";

/** 이 길이 이상의 메모가 있는 기록에만 AI 코멘트를 만든다 (메모가 재료다). */
export const COMMENT_MIN_MEMO_LENGTH = 5;

/** 마음이 많이 힘든 메모에는 모델이 쓴 문장 대신 이 문구를 저장한다. */
export const SENSITIVE_COMMENT_TEXT = "오늘의 마음을 이곳에 적어두었어요.";

/** 기록 저장 후 이 시간까지는 코멘트를 만드는 중으로 보고, 지나면 만들지 못한 것으로 본다. */
export const COMMENT_GENERATING_WINDOW_MS = 60_000;

/** 코멘트가 만들어지는 동안 목록을 다시 조회하는 간격. */
export const COMMENT_POLL_INTERVAL_MS = 2_000;

/**
 * - none: 코멘트 대상이 아님 (메모가 없거나 짧음)
 * - ready: 코멘트가 있음
 * - generating: 방금 저장돼 서버가 만드는 중
 * - failed: 만들어지지 않음 (생성 실패, 또는 이 기능 이전에 쓴 기록)
 */
export type CommentState = "none" | "ready" | "generating" | "failed";

type CommentFields = Pick<MusicRecord, "memo" | "ai_comment" | "created_at">;

/** 별도 상태 컬럼 없이 메모·코멘트·생성 시각만으로 상태를 파생한다. */
export function getCommentState(record: CommentFields, now: number): CommentState {
  if (record.ai_comment) return "ready";
  if ((record.memo?.trim().length ?? 0) < COMMENT_MIN_MEMO_LENGTH) return "none";

  const elapsed = now - new Date(record.created_at).getTime();
  return elapsed < COMMENT_GENERATING_WINDOW_MS ? "generating" : "failed";
}

export function hasGeneratingComment(records: CommentFields[], now: number): boolean {
  return records.some((record) => getCommentState(record, now) === "generating");
}
