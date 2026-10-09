import { geminiMoodSuggester } from "./gemini";
import { geminiCommentGenerator } from "./geminiComment";
import type { CommentGenerator, MoodSuggester } from "./types";

/**
 * 앱 전체가 쓰는 AI 구현체. LLM provider 를 바꾸려면(예: Claude Haiku)
 * 새 구현을 추가하고 여기 한 줄씩만 바꾼다.
 */
export const moodSuggester: MoodSuggester = geminiMoodSuggester;
export const commentGenerator: CommentGenerator = geminiCommentGenerator;

export type {
  AiError,
  CommentGenerator,
  CommentInput,
  CommentResult,
  MoodSuggester,
  MoodSuggestInput,
  MoodSuggestResult,
  MoodSuggestError,
} from "./types";
