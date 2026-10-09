export type MoodSuggestInput = {
  memo: string;
  trackName: string;
  artist: string;
  /** 제안 후보로 허용하는 mood 값. shared → entities 의존을 피하려고 호출 측이 주입한다. */
  moods: readonly string[];
};

export type MoodSuggestError =
  | "not_configured"
  | "timeout"
  | "upstream"
  | "invalid_response";

export type MoodSuggestResult =
  | { success: true; suggestedMood: string; reason: string }
  | { success: false; error: MoodSuggestError };

export interface MoodSuggester {
  suggest(input: MoodSuggestInput): Promise<MoodSuggestResult>;
}
