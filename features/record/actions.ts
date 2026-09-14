"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { MOOD_OPTIONS, type Mood } from "@/entities/record/mood";
import type { RecordErrorCode } from "./error-codes";

export type RecordActionState = { error: RecordErrorCode } | null;

const VALID_MOODS = new Set<string>(MOOD_OPTIONS.map((option) => option.value));

function isMood(value: string): value is Mood {
  return VALID_MOODS.has(value);
}

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
    mood_source: "user",
    memo,
  });

  if (error) {
    return { error: "unknown" };
  }

  redirect("/");
}
