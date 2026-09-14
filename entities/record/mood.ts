export type Mood = "exciting" | "calm" | "energetic" | "sad" | "focused";

export const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "exciting", label: "설레는" },
  { value: "calm", label: "차분한" },
  { value: "energetic", label: "신나는" },
  { value: "sad", label: "우울한" },
  { value: "focused", label: "집중되는" },
];

/**
 * 무드별 포인트 색.
 * 지금은 전부 accent 하나를 가리키지만, /diary 설계에서 무드별 색을 정하면
 * 이 값들만 바꾸면 된다 — 이 값을 쓰는 컴포넌트(MoodPicker 등) 로직은 그대로 둔다.
 */
export const MOOD_COLORS: Record<Mood, string> = {
  exciting: "var(--color-accent)",
  calm: "var(--color-accent)",
  energetic: "var(--color-accent)",
  sad: "var(--color-accent)",
  focused: "var(--color-accent)",
};
