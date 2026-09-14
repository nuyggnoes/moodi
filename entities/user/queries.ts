import { createClient } from "@/shared/lib/supabase/server";
import type { UserProfile } from "./types";

/** 서버(서버 컴포넌트·서버 액션)에서 현재 사용자의 프로필 행을 조회한다. 없으면 null. */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}
