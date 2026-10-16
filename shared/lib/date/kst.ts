/**
 * "하루"의 기준은 브라우저·서버 시간대와 무관하게 KST(Asia/Seoul)다 (docs/adr/0007).
 * KST 는 서머타임이 없는 UTC+9 고정이라 오프셋 계산만으로 충분하다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** KST 달력 기준의 연·월(0부터)·일. */
function kstParts(input: Date | string | number) {
  const shifted = new Date(new Date(input).getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function formatKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** 시각이 속한 KST 날짜를 YYYY-MM-DD 로 돌려준다. */
export function kstDateKey(input: Date | string | number): string {
  const { year, month, day } = kstParts(input);
  return formatKey(year, month, day);
}

/** KST 해당 일자 0시의 실제 시각. */
function kstMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - KST_OFFSET_MS);
}

/** 시각이 속한 KST 하루의 [start, end) 범위. */
export function kstDayRange(now: Date): { start: Date; end: Date } {
  const { year, month, day } = kstParts(now);
  return {
    start: kstMidnight(year, month, day),
    end: kstMidnight(year, month, day + 1),
  };
}

/** KST 기준 한 달의 [start, end) 범위. month 는 0부터. */
export function kstMonthRange(
  year: number,
  month: number,
): { start: Date; end: Date } {
  return {
    start: kstMidnight(year, month, 1),
    end: kstMidnight(year, month + 1, 1),
  };
}

/** 지금의 KST 연·월(0부터)·일과 날짜 키. */
export function kstToday(now: Date = new Date()) {
  const { year, month, day } = kstParts(now);
  return { year, month, day, key: formatKey(year, month, day) };
}
