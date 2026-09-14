export type RecordErrorCode = "track_required" | "mood_required" | "unknown";

export const RECORD_ERROR_MESSAGES: Record<RecordErrorCode, string> = {
  track_required: "곡을 선택해주세요.",
  mood_required: "기분을 선택해주세요.",
  unknown: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
};
