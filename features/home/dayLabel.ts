const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export type DayLabel = {
  /** MM.DD */
  date: string;
  /** 일(DD) */
  day: string;
  /** 월, 화 ... */
  weekday: string;
  /** 월요일, 화요일 ... */
  weekdayName: string;
};

/** KST 날짜 키(YYYY-MM-DD)를 화면 표기로 바꾼다. 달력 날짜만 다루므로 시간대와 무관하다. */
export function formatDayLabel(dateKey: string): DayLabel {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return { date: `${mm}.${dd}`, day: dd, weekday, weekdayName: `${weekday}요일` };
}
