import { isMood, type Mood } from "@/entities/record/mood";

export type MoodSuggestion = { suggestedMood: Mood; reason: string };

export type MoodSuggestRequest = {
  memo: string;
  trackName: string;
  artist: string;
};

export async function fetchMoodSuggestion(
  request: MoodSuggestRequest,
  signal?: AbortSignal,
): Promise<MoodSuggestion> {
  const response = await fetch("/api/ai/mood-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error("mood_suggest_failed");
  }

  const data: { suggestedMood?: unknown; reason?: unknown } =
    await response.json();

  // 서버가 이미 검증하지만, 클라이언트 상태에는 Mood 타입만 들어가도록 한 번 더 확인한다.
  if (!isMood(data.suggestedMood) || typeof data.reason !== "string") {
    throw new Error("mood_suggest_invalid");
  }

  return { suggestedMood: data.suggestedMood, reason: data.reason };
}
