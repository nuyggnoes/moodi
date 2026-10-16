import { formatDayLabel } from "./dayLabel";

describe("formatDayLabel", () => {
  it("formats month.day and the Korean weekday", () => {
    expect(formatDayLabel("2026-10-13")).toEqual({
      date: "10.13",
      day: "13",
      weekday: "화",
      weekdayName: "화요일",
    });
  });

  it("handles year and month boundaries", () => {
    expect(formatDayLabel("2027-01-01")).toMatchObject({ date: "01.01", weekday: "금" });
    expect(formatDayLabel("2026-12-31")).toMatchObject({ date: "12.31", weekday: "목" });
  });

  it("does not depend on the machine time zone", () => {
    // 2026-10-11 은 일요일 — UTC 자정을 로컬로 바꾸면 하루 어긋나는 시간대에서도 같아야 한다.
    expect(formatDayLabel("2026-10-11").weekday).toBe("일");
  });
});
