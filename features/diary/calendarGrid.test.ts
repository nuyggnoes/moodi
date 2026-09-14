import { getMonthGrid, toDateKey } from "./calendarGrid";

describe("getMonthGrid", () => {
  it("starts the grid on a Sunday", () => {
    const cells = getMonthGrid(2026, 8); // September 2026
    expect(cells[0].date.getDay()).toBe(0);
  });

  it("returns a multiple of 7 cells", () => {
    const cells = getMonthGrid(2026, 8);
    expect(cells.length % 7).toBe(0);
  });

  it("marks exactly the days that belong to the target month", () => {
    const year = 2026;
    const month = 8; // September (30 days)
    const cells = getMonthGrid(year, month);
    const inMonth = cells.filter((c) => c.inCurrentMonth);
    expect(inMonth).toHaveLength(30);
    expect(inMonth[0].date.getDate()).toBe(1);
    expect(inMonth[inMonth.length - 1].date.getDate()).toBe(30);
  });

  it("handles a leap-year February correctly", () => {
    const cells = getMonthGrid(2028, 1); // Feb 2028 is a leap year (29 days)
    const inMonth = cells.filter((c) => c.inCurrentMonth);
    expect(inMonth).toHaveLength(29);
  });

  it("produces consecutive dates across the whole grid", () => {
    const cells = getMonthGrid(2026, 8);
    for (let i = 1; i < cells.length; i++) {
      const diffMs = cells[i].date.getTime() - cells[i - 1].date.getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000);
    }
  });
});

describe("toDateKey", () => {
  it("formats with zero-padded month and day", () => {
    expect(toDateKey(new Date(2026, 8, 1))).toBe("2026-09-01");
    expect(toDateKey(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});
