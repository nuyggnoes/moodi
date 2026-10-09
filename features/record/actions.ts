"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { commentGenerator } from "@/shared/lib/ai";
import { isMood } from "@/entities/record/mood";
import { COMMENT_MIN_MEMO_LENGTH } from "@/entities/record/comment";
import { generateDailyComment } from "@/features/comment/generateDailyComment";
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

  const { data: inserted, error } = await supabase
    .from("records")
    .insert({
      user_id: user.id,
      track_id: trackId,
      track_name: trackName,
      artist,
      album_art: albumArt,
      preview_url: previewUrl,
      mood,
      mood_source: moodSource,
      memo,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "unknown" };
  }

  // 저장은 코멘트 생성을 기다리지 않는다. 응답(redirect)이 끝난 뒤 서버에서 이어서 만든다.
  if (memo && memo.length >= COMMENT_MIN_MEMO_LENGTH) {
    const recordId = inserted.id;
    const userId = user.id;
    after(async () => {
      const result = await generateDailyComment(
        { supabase: await createClient(), generator: commentGenerator },
        userId,
        recordId,
      );
      if (!result.success) {
        // 메모 내용은 남기지 않는다. 실패하면 화면에서 "코멘트 받기"로 다시 시도할 수 있다.
        console.error("daily-comment failed", {
          recordId,
          error: result.error,
          cause: "cause" in result ? result.cause : undefined,
        });
      }
    });
  }

  redirect("/");
}
