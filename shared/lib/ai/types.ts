/** LLM 호출이 실패한 이유. 모든 AI 기능이 같은 분류를 쓴다. */
export type AiError =
  | "not_configured"
  | "timeout"
  | "upstream"
  | "invalid_response";

export type MoodSuggestInput = {
  memo: string;
  trackName: string;
  artist: string;
  /** 제안 후보로 허용하는 mood 값. shared → entities 의존을 피하려고 호출 측이 주입한다. */
  moods: readonly string[];
};

export type MoodSuggestError = AiError;

export type MoodSuggestResult =
  | { success: true; suggestedMood: string; reason: string }
  | { success: false; error: MoodSuggestError };

export interface MoodSuggester {
  suggest(input: MoodSuggestInput): Promise<MoodSuggestResult>;
}

export type CommentInput = {
  memo: string;
  trackName: string;
  artist: string;
  /** 사용자에게 보이는 무드 이름(예: "차분한"). shared → entities 의존을 피하려고 호출 측이 넘긴다. */
  moodLabel: string;
};

export type CommentResult =
  | {
      success: true;
      /** 한 줄 코멘트. `sensitive` 가 true 면 호출 측이 쓰지 않으므로 검증하지 않는다. */
      comment: string;
      /** 마음이 많이 힘든 상태가 드러난 메모인지. true 면 모델 문장 대신 고정 문구를 써야 한다. */
      sensitive: boolean;
    }
  | { success: false; error: AiError };

export interface CommentGenerator {
  generate(input: CommentInput): Promise<CommentResult>;
}
