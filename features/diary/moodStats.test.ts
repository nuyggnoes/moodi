import { countMoods, pickDefaultDayKey } from "./moodStats";
import type { MusicRecord } from "@/entities/record/types";

function rec(mood: MusicRecord["mood"]): Pick<MusicRecord, "mood"> {
  return { mood };
}

describe("countMoods", () => {
  it("returns zero for every mood when there are no records", () => {
    expect(countMoods([])).toEqual({
      exciting: 0,
      calm: 0,
      energetic: 0,
      sad: 0,
      focused: 0,
    });
  });

  it("counts records per mood", () => {
    const counts = countMoods([
      rec("calm"),
      rec("calm"),
      rec("sad"),
      rec("energetic"),
    ]);
    expect(counts).toEqual({
      exciting: 0,
      calm: 2,
      energetic: 1,
      sad: 1,
      focused: 0,
    });
  });
});

describe("pickDefaultDayKey", () => {
  it("picks today when today has a record", () => {
    expect(pickDefaultDayKey(["2026-10-03", "2026-10-28"], "2026-10-28")).toBe(
      "2026-10-28",
    );
  });

  it("falls back to the most recent recorded day", () => {
    expect(
      pickDefaultDayKey(
        ["2026-10-03", "2026-10-20", "2026-10-11"],
        "2026-10-28",
      ),
    ).toBe("2026-10-20");
  });

  it("picks the most recent day when viewing a past month", () => {
    expect(pickDefaultDayKey(["2026-09-02", "2026-09-27"], "2026-10-28")).toBe(
      "2026-09-27",
    );
  });

  it("returns null when there are no recorded days", () => {
    expect(pickDefaultDayKey([], "2026-10-28")).toBeNull();
  });
});
