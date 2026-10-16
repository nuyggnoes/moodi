import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/database.types";
import { kstToday } from "@/shared/lib/date/kst";
import type { MusicRecord } from "@/entities/record/types";

/**
 * 오늘(KST)의 내 기록을 돌려준다. 없으면 null. (서버용 — 수정 모드가 기존 값을 채울 때 쓴다)
 * 하루 1기록이라 `record_date` 로 정확히 한 건이 나온다 (docs/adr/0007).
 */
export async function getTodayRecord(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date(),
): Promise<MusicRecord | null> {
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("user_id", userId)
    .eq("record_date", kstToday(now).key)
    .maybeSingle();

  if (error) throw error;
  return data;
}
