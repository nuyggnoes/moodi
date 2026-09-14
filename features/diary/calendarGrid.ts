export type CalendarCell = { date: Date; inCurrentMonth: boolean };

/**
 * year/month(0-indexed, JS Date 관례)의 달력 그리드를 만든다.
 * 일요일 시작, 필요한 주 수만큼만(4~6주) 반환한다 — 항상 6주 고정이 아님.
 */
export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const gridStart = new Date(year, month, 1 - startWeekday);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({ date, inCurrentMonth: date.getMonth() === month });
  }
  return cells;
}

/** 로컬 날짜 기준 YYYY-MM-DD 키. 기록을 날짜별로 묶는 용도. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
