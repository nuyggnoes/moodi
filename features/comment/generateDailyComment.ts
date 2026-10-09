import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/database.types";
import type { AiError, CommentGenerator } from "@/shared/lib/ai";
import { getMoodLabel } from "@/entities/record/mood";
import {
  COMMENT_MIN_MEMO_LENGTH,
  SENSITIVE_COMMENT_TEXT,
} from "@/entities/record/comment";

export type GenerateDailyCommentResult =
  | { success: true; comment: string }
  | { success: false; error: "not_found" }
  | { success: false; error: "no_memo" }
  | { success: false; error: "upstream"; cause: AiError | "db_error" };

type Deps = {
  supabase: SupabaseClient<Database>;
  generator: CommentGenerator;
};

/**
 * 기록 한 건의 AI 코멘트를 만들어 `records.ai_comment` 에 저장한다 (서버 전용).
 *
 * - 본인 기록이 아니면 없는 기록처럼 취급한다 (`records` 는 공개 조회가 가능해 직접 확인해야 한다).
 * - 이미 코멘트가 있으면 다시 만들지 않고 그대로 돌려준다.
 * - 메모가 짧거나 없으면 만들지 않는다.
 * - 힘든 감정으로 판별되면 모델 문장 대신 고정 문구를 저장한다.
 */
export async function generateDailyComment(
  { supabase, generator }: Deps,
  userId: string,
  recordId: string,
): Promise<GenerateDailyCommentResult> {
  const { data: record, error: selectError } = await supabase
    .from("records")
    .select("*")
    .eq("id", recordId)
    .maybeSingle();

  if (selectError) {
    return { success: false, error: "upstream", cause: "db_error" };
  }
  if (!record || record.user_id !== userId) {
    return { success: false, error: "not_found" };
  }
  if (record.ai_comment) {
    return { success: true, comment: record.ai_comment };
  }

  const memo = record.memo?.trim() ?? "";
  if (memo.length < COMMENT_MIN_MEMO_LENGTH) {
    return { success: false, error: "no_memo" };
  }

  const generated = await generator.generate({
    memo,
    trackName: record.track_name,
    artist: record.artist,
    moodLabel: getMoodLabel(record.mood),
  });
  if (!generated.success) {
    return { success: false, error: "upstream", cause: generated.error };
  }

  const comment = generated.sensitive ? SENSITIVE_COMMENT_TEXT : generated.comment;

  const { error: updateError } = await supabase
    .from("records")
    .update({ ai_comment: comment })
    .eq("id", recordId)
    .eq("user_id", userId);

  if (updateError) {
    return { success: false, error: "upstream", cause: "db_error" };
  }

  return { success: true, comment };
}
