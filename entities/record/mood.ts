export type Mood = "exciting" | "calm" | "energetic" | "sad" | "focused";

export const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "exciting", label: "설레는" },
  { value: "calm", label: "차분한" },
  { value: "energetic", label: "신나는" },
  { value: "sad", label: "우울한" },
  { value: "focused", label: "집중되는" },
];

/**
 * 무드별 포인트 색 (#12 /diary 설계에서 확정).
 * 라벤더 미스트 다크 배경 대비가 충분하고 서로 구분되는 파스텔 톤.
 */
export const MOOD_COLORS: Record<Mood, string> = {
  exciting: "#e8a7c4",
  calm: "#a7b8e8",
  energetic: "#e8b175",
  sad: "#8f9bb8",
  focused: "#8fc9b0",
};
