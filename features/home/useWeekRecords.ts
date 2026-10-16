"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import { kstRecentDaysRange, kstToday } from "@/shared/lib/date/kst";
import {
  COMMENT_POLL_INTERVAL_MS,
  hasGeneratingComment,
} from "@/entities/record/comment";
import type { MusicRecord } from "@/entities/record/types";
import { groupRecordsByKstDay, WEEK_DAYS } from "./weekDays";

/** 오늘(KST)을 포함한 최근 7일의 내 기록을 날짜별 7칸으로 돌려준다. */
export function useWeekRecords(userId: string) {
  const todayKey = kstToday().key;

  return useQuery({
    queryKey: ["week-records", userId, todayKey],
    queryFn: async (): Promise<MusicRecord[]> => {
      const { start, end } = kstRecentDaysRange(new Date(), WEEK_DAYS);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("records")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    // 날짜 묶기는 select 에서 한다. refetchInterval 은 가공 전 원본 기록을 본다.
    select: (records) => groupRecordsByKstDay(records, new Date()),
    // 방금 저장한 기록의 AI 코멘트가 만들어지는 동안만 다시 조회한다.
    refetchInterval: (query) =>
      hasGeneratingComment(query.state.data ?? [], Date.now())
        ? COMMENT_POLL_INTERVAL_MS
        : false,
  });
}
