"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import type { UserProfile } from "./types";

/** 클라이언트 컴포넌트에서 사용자 프로필을 조회하는 훅. */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async (): Promise<UserProfile | null> => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
  });
}
