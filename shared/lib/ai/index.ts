import { geminiMoodSuggester } from "./gemini";
import type { MoodSuggester } from "./types";

/**
 * 앱 전체가 쓰는 무드 제안기. LLM provider 를 바꾸려면(예: Claude Haiku)
 * 새 `MoodSuggester` 구현을 추가하고 여기 한 줄만 바꾼다.
 */
export const moodSuggester: MoodSuggester = geminiMoodSuggester;

export type {
  MoodSuggester,
  MoodSuggestInput,
  MoodSuggestResult,
  MoodSuggestError,
} from "./types";
