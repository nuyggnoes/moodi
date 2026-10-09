"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import {
  COMMENT_POLL_INTERVAL_MS,
  hasGeneratingComment,
} from "@/entities/record/comment";
import type { MusicRecord } from "@/entities/record/types";

export function useMonthRecords(userId: string, year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return useQuery({
    queryKey: ["month-records", userId, year, month],
    queryFn: async (): Promise<MusicRecord[]> => {
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
    // 방금 저장한 기록의 AI 코멘트가 만들어지는 동안만 다시 조회한다.
    refetchInterval: (query) =>
      hasGeneratingComment(query.state.data ?? [], Date.now())
        ? COMMENT_POLL_INTERVAL_MS
        : false,
  });
}
