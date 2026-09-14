"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { mapProfileSaveError, type ProfileErrorCode } from "./error-codes";

export type ProfileActionState = { error: ProfileErrorCode } | null;

const NICKNAME_MAX_LENGTH = 20;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName;
  const fromType = file.type.split("/").pop();
  return fromType || "png";
}

export async function saveProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const nickname = (formData.get("nickname") as string | null)?.trim() ?? "";
  const next = (formData.get("next") as string | null) || "/";
  const avatar = formData.get("avatar");

  if (!nickname) {
    return { error: "nickname_required" };
  }
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return { error: "nickname_too_long" };
  }

  const hasAvatar = avatar instanceof File && avatar.size > 0;

  if (hasAvatar) {
    if (!avatar.type.startsWith("image/")) {
      return { error: "avatar_invalid_type" };
    }
    if (avatar.size > AVATAR_MAX_BYTES) {
      return { error: "avatar_too_large" };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let avatarUrl: string | null = null;

  if (hasAvatar) {
    const path = `${user.id}/avatar.${extensionFromFile(avatar)}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { upsert: true, contentType: avatar.type });

    if (uploadError) {
      return { error: "unknown" };
    }

    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data
      .publicUrl;
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    nickname,
    avatar_url: avatarUrl,
  });

  if (insertError) {
    return { error: mapProfileSaveError(insertError) };
  }

  redirect(next);
}
