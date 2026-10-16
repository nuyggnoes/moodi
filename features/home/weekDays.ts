import { kstDateKey, kstRecentDaysRange } from "@/shared/lib/date/kst";
import type { MusicRecord } from "@/entities/record/types";

/** 메인 화면이 보여주는 최근 일수 (오늘 포함). */
export const WEEK_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type WeekDay = {
  /** KST 날짜 (YYYY-MM-DD) */
  dateKey: string;
  /** 그날의 기록. 없으면 null */
  record: MusicRecord | null;
  isToday: boolean;
};

/**
 * 기록을 KST 날짜별로 묶어 오늘을 포함한 최근 7일을 오래된 날 → 오늘 순서로 돌려준다.
 * 기록이 없는 날도 항상 한 칸이다. 하루 1기록이 원칙이지만(ADR-0007),
 * 한 날에 여러 건이 있으면 가장 최근 1건을 쓴다. 범위 밖 기록은 무시한다.
 */
export function groupRecordsByKstDay(
  records: MusicRecord[],
  now: Date,
): WeekDay[] {
  const { start } = kstRecentDaysRange(now, WEEK_DAYS);

  const latestByDay = new Map<string, MusicRecord>();
  for (const record of records) {
    const key = kstDateKey(record.created_at);
    const current = latestByDay.get(key);
    if (
      !current ||
      new Date(record.created_at).getTime() >
        new Date(current.created_at).getTime()
    ) {
      latestByDay.set(key, record);
    }
  }

  return Array.from({ length: WEEK_DAYS }, (_, i) => {
    const dateKey = kstDateKey(start.getTime() + i * DAY_MS);
    return {
      dateKey,
      record: latestByDay.get(dateKey) ?? null,
      isToday: i === WEEK_DAYS - 1,
    };
  });
}
