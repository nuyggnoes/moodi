import type { MusicRecord } from "@/entities/record/types";
import { groupRecordsByKstDay, WEEK_DAYS } from "./weekDays";

// 2026-10-14(KST) 05:00 — 이 날이 "오늘"이다.
const NOW = new Date("2026-10-13T20:00:00Z");

function makeRecord(id: string, createdAt: string): MusicRecord {
  return {
    id,
    user_id: "user-1",
    track_id: "1",
    track_name: `track-${id}`,
    artist: "artist",
    album_art: null,
    preview_url: null,
    mood: "calm",
    mood_source: "user",
    memo: null,
    ai_comment: null,
    created_at: createdAt,
    record_date: createdAt.slice(0, 10),
  };
}

describe("groupRecordsByKstDay", () => {
  it("always returns 7 days, oldest first, ending with today", () => {
    const days = groupRecordsByKstDay([], NOW);

    expect(days).toHaveLength(WEEK_DAYS);
    expect(days.map((d) => d.dateKey)).toEqual([
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
    ]);
  });

  it("flags only the last day as today", () => {
    const days = groupRecordsByKstDay([], NOW);

    expect(days.map((d) => d.isToday)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it("fills days without a record with null", () => {
    const record = makeRecord("a", "2026-10-10T03:00:00Z");

    const days = groupRecordsByKstDay([record], NOW);

    expect(days.filter((d) => d.record !== null)).toHaveLength(1);
    expect(days[2]).toEqual({ dateKey: "2026-10-10", record, isToday: false });
    expect(days[6].record).toBeNull();
  });

  it("puts records on the right KST day around midnight", () => {
    const lateYesterday = makeRecord("late", "2026-10-13T14:59:59Z"); // 10-13 23:59:59 KST
    const earlyToday = makeRecord("early", "2026-10-13T15:00:00Z"); // 10-14 00:00:00 KST

    const days = groupRecordsByKstDay([lateYesterday, earlyToday], NOW);

    expect(days[5].record?.id).toBe("late");
    expect(days[6].record?.id).toBe("early");
  });

  it("keeps the latest record when a day has several (legacy data)", () => {
    const first = makeRecord("first", "2026-10-12T01:00:00Z");
    const last = makeRecord("last", "2026-10-12T09:00:00Z");

    const days = groupRecordsByKstDay([last, first], NOW);

    expect(days[4].record?.id).toBe("last");
  });

  it("ignores records outside the 7-day window", () => {
    const tooOld = makeRecord("old", "2026-10-07T14:59:59Z"); // 10-07 23:59:59 KST
    const future = makeRecord("future", "2026-10-14T15:00:00Z"); // 10-15 00:00:00 KST

    const days = groupRecordsByKstDay([tooOld, future], NOW);

    expect(days.every((d) => d.record === null)).toBe(true);
  });

  it("builds correct keys across month and year boundaries", () => {
    const days = groupRecordsByKstDay([], new Date("2027-01-02T03:00:00Z"));

    expect(days.map((d) => d.dateKey)).toEqual([
      "2026-12-27",
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});
