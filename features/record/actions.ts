"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { isMood } from "@/entities/record/mood";
import type { RecordErrorCode } from "./error-codes";

export type RecordActionState = { error: RecordErrorCode } | null;

export async function saveRecord(
  _prevState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const trackId = formData.get("trackId") as string | null;
  const trackName = formData.get("trackName") as string | null;
  const artist = formData.get("artist") as string | null;
  const albumArt = (formData.get("albumArt") as string | null) || null;
  const previewUrl = (formData.get("previewUrl") as string | null) || null;
  const mood = formData.get("mood") as string | null;
  const memo = ((formData.get("memo") as string | null) ?? "").trim() || null;
  // 알 수 없는 값은 "user" 로 취급한다 — 채택률 지표에 잘못된 "ai" 가 섞이지 않게 한다.
  const moodSource = formData.get("moodSource") === "ai" ? "ai" : "user";

  if (!trackId || !trackName || !artist) {
    return { error: "track_required" };
  }
  if (!mood || !isMood(mood)) {
    return { error: "mood_required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("records").insert({
    user_id: user.id,
    track_id: trackId,
    track_name: trackName,
    artist,
    album_art: albumArt,
    preview_url: previewUrl,
    mood,
    mood_source: moodSource,
    memo,
  });

  if (error) {
    return { error: "unknown" };
  }

  redirect("/");
}
