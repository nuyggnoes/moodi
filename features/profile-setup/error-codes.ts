export type ProfileErrorCode =
  | "nickname_required"
  | "nickname_too_long"
  | "nickname_taken"
  | "avatar_invalid_type"
  | "avatar_too_large"
  | "unknown";

export const PROFILE_ERROR_MESSAGES: Record<ProfileErrorCode, string> = {
  nickname_required: "닉네임을 입력해주세요.",
  nickname_too_long: "닉네임은 20자 이하로 입력해주세요.",
  nickname_taken: "이미 사용 중인 닉네임이에요.",
  avatar_invalid_type: "이미지 파일만 업로드할 수 있어요.",
  avatar_too_large: "이미지는 2MB 이하만 업로드할 수 있어요.",
  unknown: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
};

export function mapProfileSaveError(error: {
  code?: string;
  message: string;
}): ProfileErrorCode {
  if (error.code === "23505") {
    return "nickname_taken";
  }
  return "unknown";
}
