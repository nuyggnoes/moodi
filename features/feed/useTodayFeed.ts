"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import type { MusicRecord } from "@/entities/record/types";
import type { UserProfile } from "@/entities/user/types";

export type FriendToday = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  record: MusicRecord | null;
};

export type TodayFeed = {
  myRecord: MusicRecord | null;
  friends: FriendToday[];
};

async function fetchTodayFeed(userId: string): Promise<TodayFeed> {
  const supabase = createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  const [myRecordResult, followResult] = await Promise.all([
    supabase
      .from("records")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true }),
    supabase.from("follows").select("following_id").eq("follower_id", userId),
  ]);

  if (myRecordResult.error) throw myRecordResult.error;
  if (followResult.error) throw followResult.error;

  const myRecord = myRecordResult.data.at(-1) ?? null;
  const followingIds = (followResult.data ?? []).map((row) => row.following_id);

  if (followingIds.length === 0) {
    return { myRecord, friends: [] };
  }

  const [profilesResult, friendRecordsResult] = await Promise.all([
    supabase.from("users").select("*").in("id", followingIds),
    supabase
      .from("records")
      .select("*")
      .in("user_id", followingIds)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (friendRecordsResult.error) throw friendRecordsResult.error;

  const recordByUserId = new Map<string, MusicRecord>();
  for (const record of friendRecordsResult.data ?? []) {
    recordByUserId.set(record.user_id, record);
  }

  const friends: FriendToday[] = (profilesResult.data ?? []).map(
    (profile: UserProfile) => ({
      id: profile.id,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      record: recordByUserId.get(profile.id) ?? null,
    }),
  );

  return { myRecord, friends };
}

export function useTodayFeed(userId: string) {
  const todayKey = new Date().toDateString();

  return useQuery({
    queryKey: ["today-feed", userId, todayKey],
    queryFn: () => fetchTodayFeed(userId),
  });
}
