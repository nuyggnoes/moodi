export type EmptyKind = "today" | "past" | "future" | "month";

/**
 * 기록이 없는 상세 패널이 어떤 안내를 보일지 정한다.
 * 선택한 날이 없으면 기록이 하나도 없는 달이다. 날짜 키는 YYYY-MM-DD 라 문자열 비교가 곧 날짜 비교다.
 */
export function getEmptyKind(
  dateKey: string | null,
  todayKey: string,
): EmptyKind {
  if (dateKey === null) return "month";
  if (dateKey === todayKey) return "today";
  return dateKey > todayKey ? "future" : "past";
}
