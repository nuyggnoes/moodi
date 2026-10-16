import { kstDateKey, kstDayRange, kstMonthRange, kstToday } from "./kst";

describe("kstDateKey", () => {
  it("keeps 14:59:59Z on the same KST day and rolls 15:00:00Z to the next", () => {
    expect(kstDateKey("2026-10-13T14:59:59Z")).toBe("2026-10-13");
    expect(kstDateKey("2026-10-13T15:00:00Z")).toBe("2026-10-14");
  });

  it("rolls over month and year boundaries", () => {
    expect(kstDateKey("2026-10-31T15:00:00Z")).toBe("2026-11-01");
    expect(kstDateKey("2026-12-31T15:00:00Z")).toBe("2027-01-01");
  });

  it("accepts Date and epoch millis", () => {
    const date = new Date("2026-10-13T15:00:00Z");
    expect(kstDateKey(date)).toBe("2026-10-14");
    expect(kstDateKey(date.getTime())).toBe("2026-10-14");
  });
});

describe("kstDayRange", () => {
  it("returns the KST midnight-to-midnight window containing the instant", () => {
    const { start, end } = kstDayRange(new Date("2026-10-13T20:00:00Z"));

    expect(start.toISOString()).toBe("2026-10-13T15:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-14T15:00:00.000Z");
  });

  it("is exactly 24 hours long", () => {
    const { start, end } = kstDayRange(new Date("2026-03-08T01:00:00Z"));
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("includes the start and excludes the end boundary", () => {
    const { start, end } = kstDayRange(new Date("2026-10-13T15:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-13T15:00:00.000Z");
    expect(kstDateKey(start)).toBe("2026-10-14");
    expect(kstDateKey(new Date(end.getTime() - 1))).toBe("2026-10-14");
    expect(kstDateKey(end)).toBe("2026-10-15");
  });
});

describe("kstMonthRange", () => {
  it("covers a KST calendar month (month is 0-based)", () => {
    const { start, end } = kstMonthRange(2026, 9);

    expect(start.toISOString()).toBe("2026-09-30T15:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-31T15:00:00.000Z");
  });

  it("handles December into the next year", () => {
    const { start, end } = kstMonthRange(2026, 11);

    expect(start.toISOString()).toBe("2026-11-30T15:00:00.000Z");
    expect(end.toISOString()).toBe("2026-12-31T15:00:00.000Z");
  });
});

describe("kstToday", () => {
  it("returns KST year, 0-based month, day and key regardless of the machine zone", () => {
    expect(kstToday(new Date("2026-10-13T15:30:00Z"))).toEqual({
      year: 2026,
      month: 9,
      day: 14,
      key: "2026-10-14",
    });
  });
});
