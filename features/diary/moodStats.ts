import { MOOD_OPTIONS, type Mood } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";

/** 무드별 기록 개수. 기록이 없는 무드도 0 으로 포함한다. */
export function countMoods(
  records: Pick<MusicRecord, "mood">[],
): Record<Mood, number> {
  const counts = Object.fromEntries(
    MOOD_OPTIONS.map((option) => [option.value, 0]),
  ) as Record<Mood, number>;
  for (const record of records) {
    if (record.mood in counts) counts[record.mood as Mood] += 1;
  }
  return counts;
}

/**
 * 진입 시 기본으로 선택할 날. 오늘 기록이 있으면 오늘, 없으면 가장 최근 기록일.
 * 기록한 날이 하나도 없으면 null. 키는 YYYY-MM-DD 라서 문자열 비교가 곧 날짜 비교다.
 */
export function pickDefaultDayKey(
  recordedDayKeys: string[],
  todayKey: string,
): string | null {
  if (recordedDayKeys.length === 0) return null;
  if (recordedDayKeys.includes(todayKey)) return todayKey;
  return recordedDayKeys.reduce((latest, key) => (key > latest ? key : latest));
}
